import nodemailer from 'nodemailer'

/**
 * VIDEKO „Benachrichtige mich"-Endpoint (Vercel Serverless, Node).
 *
 * Merkt vor, dass ein Kunde bei Verfügbarkeit eines Coming-Soon-Artikels
 * benachrichtigt werden möchte. Speichert die Vormerkung in Supabase
 * (Tabelle `videko_notify`) und schickt – sofern SMTP konfiguriert ist – eine
 * kurze Bestätigung an den Kunden sowie einen Hinweis ans Team.
 *
 * Wichtig: Ist kein Backend konfiguriert (weder Supabase noch SMTP), liefert
 * der Endpoint bewusst KEINEN gefälschten Erfolg, sondern
 * `{ ok:false, configured:false }`, damit die UI ehrlich melden kann, dass der
 * Versand noch nicht angebunden ist.
 *
 * Secrets ausschließlich aus den Environment-Variablen.
 */

const {
  SMTP_HOST = 'smtp.strato.de',
  SMTP_PORT = '465',
  SMTP_USER,
  SMTP_PASS,
  NOTIFY_TO = 'info@videko-kuechen.de',
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
} = process.env

const clean = (s, max = 300) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max)
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') { try { return JSON.parse(req.body) } catch { return {} } }
  const raw = await new Promise((res) => {
    let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => res(d)); req.on('error', () => res(''))
  })
  try { return JSON.parse(raw) } catch { return {} }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method-not-allowed' }); return }

  const b = await readBody(req)
  if (b.website) { res.status(200).json({ ok: true }); return } // Honeypot

  // Zwei Modi:
  //  - 'interest' : Klick auf „Benachrichtige mich" OHNE E-Mail. Nur Team-Info,
  //                 keine Kundenbestätigung. Ausdrücklich gewünscht: sofort erfahren.
  //  - Standard   : Formular abgeschickt MIT E-Mail → Vormerkung + Bestätigung.
  const isInterest = clean(b.event, 20) === 'interest'

  const d = {
    email: clean(b.email, 200),
    productId: clean(b.productId, 120),
    productName: clean(b.productName, 200),
    variant: clean(b.variant, 300),
  }
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)
  if (!d.productId || (!isInterest && !emailOk)) { res.status(422).json({ ok: false, error: 'invalid' }); return }

  const configured = Boolean((SUPABASE_URL && SUPABASE_SERVICE_KEY) || (SMTP_USER && SMTP_PASS))
  if (!configured) {
    // Ehrlicher Zustand: Backend fehlt, kein Fake-Erfolg.
    res.status(200).json({ ok: false, configured: false, stored: false, mailed: false })
    return
  }

  let stored = false
  try {
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/videko_notify`, {
        method: 'POST',
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          email: d.email || null, product_id: d.productId, product_name: d.productName, variant: d.variant,
          meta: { ua: clean(req.headers['user-agent'], 200), event: isInterest ? 'interest' : 'notify' },
        }),
      })
      stored = r.ok
    }
  } catch { /* nicht blockieren */ }

  let mailed = false
  try {
    if (SMTP_USER && SMTP_PASS) {
      const t = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
      const from = `"VIDEKO Küchen" <${SMTP_USER}>`
      const artikel = d.productName + (d.variant ? ` (${d.variant})` : '')

      if (isInterest) {
        // Nur Team informieren – der Kunde hat (noch) keine E-Mail eingetragen.
        await t.sendMail({
          from, to: NOTIFY_TO,
          subject: `👀 Interesse: ${artikel}`,
          text: `Jemand hat auf „Benachrichtige mich" geklickt für „${artikel}" – noch ohne E-Mail-Eintrag.`,
        })
      } else {
        await t.sendMail({
          from, to: NOTIFY_TO, replyTo: d.email,
          subject: `🔔 Merch-Vormerkung: ${artikel}`,
          text: `${d.email} möchte benachrichtigt werden, sobald „${artikel}" verfügbar ist.`,
        })
        await t.sendMail({
          from, to: d.email, replyTo: NOTIFY_TO,
          subject: `Wir melden uns: ${d.productName}`,
          text: `Danke! Wir sagen dir Bescheid, sobald „${artikel}" bestellbar ist.\n\nDein VIDEKO Team`,
          html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1a1a1a">
            <div style="background:#0d0d0d;color:#fff;padding:22px;border-radius:12px 12px 0 0;text-align:center">
              <div style="font-size:18px;font-weight:700;letter-spacing:.12em">VIDEKO</div>
            </div>
            <div style="border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:22px;font-size:15px;line-height:1.6">
              <p>Danke! Wir sagen dir Bescheid, sobald <strong>${esc(artikel)}</strong> bestellbar ist.</p>
              <p style="margin-top:16px">Dein VIDEKO Team</p>
            </div></div>`,
        })
      }
      mailed = true
    }
  } catch { /* Speicherung zählt trotzdem */ }

  const ok = stored || mailed
  res.status(ok ? 200 : 500).json({ ok, configured: true, stored, mailed })
}
