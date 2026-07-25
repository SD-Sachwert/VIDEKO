import nodemailer from 'nodemailer'

/**
 * VIDEKO Lead-Endpoint (Vercel Serverless, Node).
 * - speichert die Anfrage in Supabase (videko_leads)
 * - Datei-Anhänge liegen bereits in Supabase Storage (Bucket lead-uploads);
 *   hier werden signierte Links erzeugt (Mail + DB) und die Dateien an die
 *   interne Mail angehängt.
 * - schickt interne Vertriebs-Mail ans Team + lockere Premium-Bestätigung an den Kunden.
 * Secrets ausschließlich aus den Environment-Variablen.
 */

const {
  SMTP_HOST = 'smtp.strato.de',
  SMTP_PORT = '465',
  SMTP_USER,
  SMTP_PASS,
  LEAD_NOTIFY_TO = 'info@videko-kuechen.de',
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
} = process.env

const BUCKET = 'lead-uploads'

const clean = (s, max = 500) =>
  String(s ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max)
const esc = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
const list = (v, max = 8) => (Array.isArray(v) ? v.map((x) => clean(x, 120)).filter(Boolean).slice(0, max) : [])

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') { try { return JSON.parse(req.body) } catch { return {} } }
  const raw = await new Promise((res) => {
    let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => res(d)); req.on('error', () => res(''))
  })
  try { return JSON.parse(raw) } catch { return {} }
}

// Signierter (1 Jahr gültiger) Download-Link für eine Storage-Datei
async function signUrl(path) {
  try {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, apikey: SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 365 }),
    })
    if (!r.ok) return null
    const j = await r.json()
    return j.signedURL ? `${SUPABASE_URL}/storage/v1${j.signedURL}` : null
  } catch { return null }
}

// ───────────────────────── Mail-Texte ─────────────────────────
function detailRows(d) {
  return [
    ['Telefon', d.telefon], ['E-Mail', d.email], ['Anliegen', d.anliegen],
    ['Küchenart', d.kueche], ['Projektstatus', d.status], ['Zeitplan', d.zeitraum],
    ['Budget', d.budget], ['Grundriss', d.grundriss], ['Wunschbereich', d.bereich],
  ].filter(([, v]) => v && String(v).trim())
}
function sfRows(sf) {
  if (!sf) return []
  return [
    ['Stil-Ergebnis', sf.stil], ['Farben', (sf.farben || []).join(', ')],
    ['Materialien', (sf.materialien || []).join(', ')], ['Funktion', (sf.funktion || []).join(', ')],
    ['Charakter', (sf.tags || []).join(' · ')],
  ].filter(([, v]) => v && String(v).trim())
}

function internalMail(d) {
  const isJob = d.source === 'karriere'
  const isSf = d.source === 'stylefinder'
  const subject = isJob
    ? `👋 Neue Bewerbung: ${d.name} will zu uns!`
    : isSf
      ? `🎨 Stylefinder-Lead: ${d.name} – Stil "${d.stylefinder?.stil || '—'}"`
      : `🍽️ Neuer Lead: ${d.name} – ran an die Küche!`
  const intro = isJob
    ? `Aufgepasst, Team! Da möchte jemand bei uns mitmischen: ${d.name}. Lebenslauf checken, Sympathie spüren, schnell zurückmelden.`
    : isSf
      ? `🔥 Heißer Lead aus dem Stylefinder! ${d.name} hat sich komplett durchgeklickt und weiß schon ziemlich genau, was er/sie will. Inkl. Stilprofil unten – das ist kein „mal gucken", das ist Kaufabsicht. Schnapp dir den Hörer!`
      : `Aufgepasst, Team! 🚨 Da will jemand eine Küche – und zwar ${d.name}. Schnapp dir den Hörer, bevor die Konkurrenz die Suppe serviert. 😏`
  const rows = [...detailRows(d), ...sfRows(d.stylefinder)]
  const upl = d.uploads || []
  const text =
    `${intro}\n\nName: ${d.name}\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    (d.nachricht ? `\n\nNachricht:\n${d.nachricht}` : '') +
    (upl.length ? `\n\nDateien (auch im Anhang):\n${upl.map((u) => `- ${u.name}: ${u.url || '(siehe Anhang)'}`).join('\n')}` : '') +
    `\n\n(Gespeichert in Supabase: videko_leads)`
  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#1a1a1a">
      <div style="background:#0d0d0d;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
        <strong style="font-size:16px;letter-spacing:.04em">VIDEKO · ${isJob ? 'Neue Bewerbung' : isSf ? 'Stylefinder-Lead' : 'Neuer Lead'}</strong>
      </div>
      <div style="border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:22px">
        <p style="margin:0 0 16px">${esc(intro)}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#888;width:130px">Name</td><td style="padding:6px 0"><strong>${esc(d.name)}</strong></td></tr>
          ${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#888">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`).join('')}
        </table>
        ${d.nachricht ? `<p style="margin:16px 0 4px;color:#888;font-size:13px">Nachricht</p><p style="margin:0;white-space:pre-wrap">${esc(d.nachricht)}</p>` : ''}
        ${upl.length ? `<p style="margin:16px 0 4px;color:#888;font-size:13px">Dateien (auch im Anhang)</p><ul style="margin:0;padding-left:18px">${upl.map((u) => `<li><a href="${esc(u.url || '#')}">${esc(u.name)}</a></li>`).join('')}</ul>` : ''}
        <p style="margin:18px 0 0;font-size:12px;color:#aaa">Gespeichert in Supabase · videko_leads</p>
      </div>
    </div>`
  return { subject, text, html }
}

function customerMail(d) {
  const isJob = d.source === 'karriere'
  const first = (d.name || '').trim().split(/\s+/)[0] || 'du'
  const subject = isJob
    ? 'Deine Bewerbung ist da – und wir freuen uns drauf 🙌'
    : 'Deine Anfrage ist da – wir sind schon dran 🙌'
  const body = isJob
    ? `Hey ${first},\n\nmega, dass du dich bei uns gemeldet hast! 🙌\nDeine Bewerbung ist bei uns gelandet und wir schauen sie uns in Ruhe an.\n\nWas jetzt passiert: Wir prüfen deine Unterlagen und melden uns ganz schnell persönlich bei dir – kein Bot, kein Standard-Absage-Generator, sondern echte Menschen.`
    : `Hey ${first},\n\nmega, dass du dich gemeldet hast! 🙌\nDeine Anfrage${d.source === 'stylefinder' ? ' inkl. deiner Stylefinder-Auswahl' : ''} ist bei uns gelandet und wir schauen sie uns gerade in Ruhe an.\n\nWas jetzt passiert: Wir prüfen alles und melden uns ganz schnell persönlich bei dir – kein Callcenter, kein Bla, sondern echte Menschen mit Bock auf deine Küche.`
  const text = `${body}\n\nBis gleich,\nDein VIDEKO Team\n\nVIDEKO Küchen – ein Geschäftsbereich der Süddeutsche Sachwert eG\ninfo@videko-kuechen.de · 0160 5545818`
  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#1a1a1a">
      <div style="background:#0d0d0d;color:#fff;padding:26px 24px;border-radius:14px 14px 0 0;text-align:center">
        <div style="font-size:20px;font-weight:700;letter-spacing:.12em">VIDEKO</div>
        <div style="font-size:11px;letter-spacing:.32em;color:#caa15a;margin-top:4px">KÜCHEN</div>
      </div>
      <div style="border:1px solid #eee;border-top:none;border-radius:0 0 14px 14px;padding:26px 24px">
        <p style="margin:0 0 14px;white-space:pre-wrap;font-size:15px;line-height:1.6">${esc(body)}</p>
        <p style="margin:18px 0 0;font-size:15px">Bis gleich,<br><strong>Dein VIDEKO Team</strong></p>
        <hr style="border:none;border-top:1px solid #eee;margin:22px 0">
        <p style="margin:0;font-size:12px;color:#999;line-height:1.6">
          VIDEKO Küchen – ein Geschäftsbereich der Süddeutsche Sachwert eG<br>
          <a href="mailto:info@videko-kuechen.de" style="color:#caa15a">info@videko-kuechen.de</a> · 0160 5545818
        </p>
      </div>
    </div>`
  return { subject, text, html }
}

// ───────────────────────── Handler ─────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method-not-allowed' }); return }

  const b = await readBody(req)
  if (b.website) { res.status(200).json({ ok: true }); return } // Honeypot

  const source = ['karriere', 'stylefinder'].includes(b.source) ? b.source : 'beratung'
  const sf = b.stylefinder && typeof b.stylefinder === 'object'
    ? { stil: clean(b.stylefinder.stil, 120), farben: list(b.stylefinder.farben), materialien: list(b.stylefinder.materialien), funktion: list(b.stylefinder.funktion), tags: list(b.stylefinder.tags) }
    : null

  const d = {
    source,
    name: clean(b.name, 120), email: clean(b.email, 200), telefon: clean(b.telefon, 60),
    nachricht: clean(b.nachricht, 3000),
    anliegen: clean(b.anliegen, 120), kueche: clean(b.kueche, 120), status: clean(b.status, 120),
    zeitraum: clean(b.zeitraum, 120), budget: clean(b.budget, 120), grundriss: clean(b.grundriss, 120),
    bereich: clean(b.bereich, 120),
    stylefinder: sf,
  }

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)
  if (!d.name || !emailOk) { res.status(422).json({ ok: false, error: 'invalid' }); return }

  // Uploads (liegen schon im Storage) -> signierte Links erzeugen
  const rawUploads = Array.isArray(b.uploads) ? b.uploads.slice(0, 8).filter((u) => u && u.path) : []
  const uploads = []
  for (const u of rawUploads) {
    const url = await signUrl(clean(u.path, 300))
    uploads.push({ name: clean(u.name, 200) || 'datei', path: clean(u.path, 300), url })
  }
  d.uploads = uploads

  // 1) Supabase speichern
  let stored = false
  try {
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/videko_leads`, {
        method: 'POST',
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          source: d.source, name: d.name, email: d.email, telefon: d.telefon,
          anliegen: d.anliegen, kueche: d.kueche, status: d.status, zeitraum: d.zeitraum,
          budget: d.budget, grundriss: d.grundriss, nachricht: d.nachricht,
          meta: { bereich: d.bereich, stylefinder: sf, uploads, ua: clean(req.headers['user-agent'], 200) },
        }),
      })
      stored = r.ok
    }
  } catch { /* nicht blockieren */ }

  // 2) Mails via Strato SMTP (Dateien als Anhang an die interne Mail)
  let mailed = false
  try {
    if (SMTP_USER && SMTP_PASS) {
      const t = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
      const intern = internalMail(d)
      const kunde = customerMail(d)
      const from = `"VIDEKO Küchen" <${SMTP_USER}>`
      const attachments = uploads.filter((u) => u.url).map((u) => ({ filename: u.name, path: u.url }))
      await t.sendMail({ from, to: LEAD_NOTIFY_TO, replyTo: d.email || undefined, subject: intern.subject, text: intern.text, html: intern.html, attachments })
      await t.sendMail({ from, to: d.email, replyTo: LEAD_NOTIFY_TO, subject: kunde.subject, text: kunde.text, html: kunde.html })
      mailed = true
    }
  } catch { /* Speicherung zählt trotzdem */ }

  const ok = stored || mailed
  res.status(ok ? 200 : 500).json({ ok, stored, mailed })
}
