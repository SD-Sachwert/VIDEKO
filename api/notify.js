import crypto from 'node:crypto'
import nodemailer from 'nodemailer'

/**
 * VIDEKO Notify-Endpoint (Vercel Serverless, Node) für den Merch-Bereich.
 *
 * Deckt zwei getrennte Funktionen ab:
 *
 *  A) „Benachrichtige mich" – Produktvormerkung mit DOUBLE-OPT-IN (§ 6).
 *     - action 'subscribe': prüft Einwilligung, erzeugt einen signierten
 *       Bestätigungstoken (HMAC, 48 h gültig) und schickt eine
 *       Bestätigungs-E-Mail mit Double-Opt-in-Link an die angegebene Adresse.
 *       Es wird NOCH KEINE aktive Vormerkung gespeichert und KEINE interne Mail
 *       ausgelöst.
 *     - action 'confirm': verifiziert den Token, aktiviert die Vormerkung (nur
 *       jetzt), dokumentiert Einwilligungszeitpunkt + Produkt und schickt die
 *       interne Mail „Neue Produktvormerkung" an info@. Kein Newsletter.
 *
 *  B) „Herz / Interesse" – ANONYMES Produktinteresse (§ 7).
 *     - action 'interest': (1) schreibt das Interesse in eine anonyme
 *       Nachfrage-Liste (videko_interest_events) fort, damit ersichtlich ist,
 *       welche Artikel oft nachgefragt werden, und (2) schickt eine interne
 *       Sofort-Mail. Es werden KEINE personenbezogenen Daten verarbeitet: keine
 *       IP, kein User-Agent, kein Fingerprint, kein Name, keine E-Mail, kein
 *       Standort. Nur Produktname/-ID, optionale Variante und Datum.
 *
 * Alle Secrets ausschließlich aus Environment-Variablen. Fehlt die Konfiguration
 * (SMTP/NOTIFY_SECRET), antwortet der Endpoint ehrlich mit configured:false,
 * statt etwas vorzutäuschen. Fehler dürfen die Nutzeraktion nicht hart blocken.
 */

const {
  SMTP_HOST = 'smtp.strato.de',
  SMTP_PORT = '465',
  SMTP_USER,
  SMTP_PASS,
  LEAD_NOTIFY_TO = 'info@videko-kuechen.de',
  NOTIFY_SECRET,
  PUBLIC_BASE_URL,
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
} = process.env

const CONSENT_TEXT =
  'Ja, benachrichtigt mich einmalig per E-Mail, sobald dieses Produkt verfügbar ist. ' +
  'Meine E-Mail-Adresse wird ausschließlich für diese eine Benachrichtigung gespeichert ' +
  'und danach gelöscht. Es erfolgt kein Newsletter.'

const TOKEN_TTL_MS = 48 * 60 * 60 * 1000 // 48 h

const clean = (s, max = 200) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max)
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const b64urlDecode = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') { try { return JSON.parse(req.body) } catch { return {} } }
  const raw = await new Promise((res) => {
    let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => res(d)); req.on('error', () => res(''))
  })
  try { return JSON.parse(raw) } catch { return {} }
}

// ───────────── Token (signierte Double-Opt-in-Bestätigung) ─────────────
function makeToken(payload) {
  const body = b64url(JSON.stringify(payload))
  const sig = crypto.createHmac('sha256', NOTIFY_SECRET).update(body).digest('hex').slice(0, 32)
  return `${body}.${sig}`
}
function readToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const exp = crypto.createHmac('sha256', NOTIFY_SECRET).update(body).digest('hex').slice(0, 32)
  // zeitkonstanter Vergleich
  if (sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null
  let data
  try { data = JSON.parse(b64urlDecode(body)) } catch { return null }
  if (!data || typeof data.ts !== 'number') return null
  if (Date.now() - data.ts > TOKEN_TTL_MS) return null
  return data
}

function transport() {
  return nodemailer.createTransport({
    host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
}
const FROM = () => `"VIDEKO Küchen" <${SMTP_USER}>`

function baseUrl(req) {
  if (PUBLIC_BASE_URL) return PUBLIC_BASE_URL.replace(/\/$/, '')
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const proto = req.headers['x-forwarded-proto'] || 'https'
  return `${proto}://${host}`
}

// ───────────── Supabase (optional – nur Dokumentation der Einwilligung) ─────────────
// Tabelle `videko_notify` (anzulegen):
//   id uuid default gen_random_uuid(), email text, product text, product_id text,
//   variant text, status text, consent_text text, consent_at timestamptz,
//   confirmed_at timestamptz, created_at timestamptz default now()
async function storeVormerkung(row) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return false
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/videko_notify`, {
      method: 'POST',
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    })
    return r.ok
  } catch { return false }
}

// Anonyme Nachfrage-Liste (Herzbutton). Append-only Ereignis-Log, damit wir sehen,
// welche Artikel oft nachgefragt werden – rein produktbezogen, KEINE
// personenbezogenen Daten (keine IP, kein User-Agent, kein Name/E-Mail).
// Tabelle `videko_interest_events` (anzulegen):
//   id uuid default gen_random_uuid(), product_id text, product_name text,
//   variant text, created_at timestamptz default now()
// Auswertung „Top-Artikel": select product_id, product_name, count(*)
//   from videko_interest_events group by 1,2 order by 3 desc;
async function storeInterest(row) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return false
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/videko_interest_events`, {
      method: 'POST',
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    })
    return r.ok
  } catch { return false }
}

// ───────────── Handler ─────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method-not-allowed' }); return }

  const b = await readBody(req)
  if (b.website) { res.status(200).json({ ok: true }); return } // Honeypot / Bot-Schutz
  const action = clean(b.action, 20)

  const mailReady = Boolean(SMTP_USER && SMTP_PASS && NOTIFY_SECRET)

  // ============ B) Anonymes Produktinteresse (Herzbutton, § 7) ============
  if (action === 'interest') {
    const productName = clean(b.productName, 160)
    const productId = clean(b.productId, 80)
    const variant = clean(b.variant, 160)
    if (!productName && !productId) { res.status(422).json({ ok: false, error: 'missing-product' }); return }

    // 1) Anonyme Nachfrage-Liste fortschreiben (nur Produktbezug, keine Personendaten).
    const stored = await storeInterest({ product_id: productId, product_name: productName, variant })

    // 2) Interne Sofort-Benachrichtigung per E-Mail.
    let mailed = false
    try {
      if (mailReady) {
        const t = transport()
        const text =
          `❤️ Neues Produktinteresse über den Herzbutton.\n\n` +
          `Produkt: ${productName || '—'}\nProdukt-ID: ${productId || '—'}\n` +
          `Variante: ${variant || '—'}\n\n` +
          `Diese Merkung wurde in der Nachfrage-Liste (videko_interest_events) erfasst, ` +
          `damit ihr seht, welche Artikel oft nachgefragt werden.\n\n` +
          `Hinweis: Es wurden bewusst KEINE personenbezogenen Daten erfasst ` +
          `(keine IP, kein User-Agent, kein Name, keine E-Mail).`
        await t.sendMail({
          from: FROM(), to: LEAD_NOTIFY_TO,
          subject: `❤️ Produktinteresse: ${productName || productId}`,
          text,
        })
        mailed = true
      }
    } catch { /* Nutzeraktion nie blockieren */ }
    res.status(200).json({ ok: true, configured: mailReady, mailed, stored })
    return
  }

  // ============ A) Vormerkung Double-Opt-in ============
  if (action === 'subscribe') {
    const email = clean(b.email, 200)
    const product = clean(b.product, 160)
    const productId = clean(b.productId, 80)
    const variant = clean(b.variant, 160)
    const consent = b.consent === true
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    if (!emailOk || !product) { res.status(422).json({ ok: false, error: 'invalid' }); return }
    if (!consent) { res.status(422).json({ ok: false, error: 'consent-required' }); return }
    if (!mailReady) { res.status(200).json({ ok: false, configured: false }); return }

    const ts = Date.now()
    const token = makeToken({ e: email, p: product, pid: productId, v: variant, ts })
    const confirmUrl = `${baseUrl(req)}/vormerkung-bestaetigen?token=${encodeURIComponent(token)}`

    // Optional: „pending" dokumentieren (nur wenn DB konfiguriert).
    await storeVormerkung({
      email, product, product_id: productId, variant, status: 'pending',
      consent_text: CONSENT_TEXT, consent_at: new Date(ts).toISOString(),
    })

    let mailed = false
    try {
      const t = transport()
      const text =
        `Hallo,\n\nbitte bestätige deine Produktvormerkung für „${product}"${variant ? ` (${variant})` : ''}.\n\n` +
        `Bestätigungslink (48 Stunden gültig):\n${confirmUrl}\n\n` +
        `Wenn du das nicht angefordert hast, ignoriere diese E-Mail einfach – ohne deine ` +
        `Bestätigung wird nichts gespeichert.\n\nDein VIDEKO-Küchen-Team`
      const html =
        `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#1a1a1a">
          <p>Hallo,</p>
          <p>bitte bestätige deine Produktvormerkung für <strong>${esc(product)}</strong>${variant ? ` (${esc(variant)})` : ''}.</p>
          <p><a href="${esc(confirmUrl)}" style="display:inline-block;background:#0d0d0d;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">Vormerkung bestätigen</a></p>
          <p style="font-size:12px;color:#888">Der Link ist 48 Stunden gültig. Ohne deine Bestätigung speichern wir nichts. Es erfolgt kein Newsletter.</p>
          <p>Dein VIDEKO-Küchen-Team</p>
        </div>`
      await t.sendMail({ from: FROM(), to: email, subject: 'Bitte bestätige deine Produktvormerkung', text, html })
      mailed = true
    } catch { /* nicht hart blocken */ }
    res.status(200).json({ ok: mailed, configured: true, mailed, doubleOptIn: true })
    return
  }

  // action 'confirm' – aus der Bestätigungsseite heraus aufgerufen
  if (action === 'confirm') {
    if (!mailReady) { res.status(200).json({ ok: false, configured: false }); return }
    const data = readToken(clean(b.token, 800))
    if (!data) { res.status(400).json({ ok: false, error: 'token-invalid' }); return }

    const confirmedAt = new Date().toISOString()
    await storeVormerkung({
      email: data.e, product: data.p, product_id: data.pid, variant: data.v,
      status: 'confirmed', consent_text: CONSENT_TEXT,
      consent_at: new Date(data.ts).toISOString(), confirmed_at: confirmedAt,
    })

    // Interne Mail an info@ – erst NACH bestätigter Einwilligung (§ 6).
    let mailed = false
    try {
      const t = transport()
      const text =
        `Neue (bestätigte) Produktvormerkung:\n\n` +
        `Produkt: ${data.p || '—'}\nVariante: ${data.v || '—'}\nProdukt-ID: ${data.pid || '—'}\n` +
        `E-Mail: ${data.e}\n` +
        `Einwilligung am: ${new Date(data.ts).toLocaleString('de-DE')}\n` +
        `Bestätigt am: ${new Date(confirmedAt).toLocaleString('de-DE')}\n\n` +
        `Einwilligungstext: ${CONSENT_TEXT}\n\n` +
        `Bitte die Adresse nach der einmaligen Verfügbarkeits-Benachrichtigung löschen.`
      await t.sendMail({ from: FROM(), to: LEAD_NOTIFY_TO, replyTo: data.e, subject: 'Neue Produktvormerkung', text })
      mailed = true
    } catch { /* nicht hart blocken */ }
    res.status(200).json({ ok: true, confirmed: true, mailed })
    return
  }

  res.status(400).json({ ok: false, error: 'unknown-action' })
}
