import nodemailer from 'nodemailer'

/**
 * VIDEKO Merch – Angebots-Anfrage-Endpoint (Vercel Serverless, Node).
 *
 * Der Kunde legt Signature-Shirts in den Warenkorb und wird Schritt für Schritt
 * durch ein Formular (Kontakt- + Lieferdaten) geführt. Beim Absenden landet HIER
 * die vollständige Anfrage. Wir:
 *   1. speichern sie best-effort in Supabase (Tabelle videko_leads, source 'merch-order'),
 *   2. schicken dem Team eine interne Mail mit allen Positionen + Kontakt/Lieferdaten,
 *   3. schicken dem Kunden eine Eingangsbestätigung.
 *
 * WICHTIG (Anfragemodell): Dies ist eine unverbindliche ANGEBOTSANFRAGE, KEINE
 * Bestellung mit Zahlungspflicht. Es wird kein Vertrag geschlossen, keine Zahlung
 * ausgelöst und keine Bestellnummer erzeugt. Der verbindliche Preis (inkl. Versand)
 * entsteht erst im individuellen Angebot per E-Mail.
 *
 * Secrets ausschließlich aus Environment-Variablen (gleiche wie api/lead.js).
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

const clean = (s, max = 500) =>
  String(s ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max)
const esc = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

const euro = (cent) =>
  cent == null || Number.isNaN(Number(cent))
    ? null
    : (Number(cent) / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

// ── Adress-Plausibilität (gegen Fantasie-Eingaben) ────────────────────
// Erlaubte Buchstaben inkl. Umlaute/Akzente. Bewusst KEINE volle Geocodierung
// (die würde echte Kunden fälschlich abweisen) – wir prüfen Format + einen
// echten PLZ↔Ort-Abgleich über die offene openPLZ-API.
const L = 'A-Za-zÀ-ÖØ-öø-ÿ'
const RE_NAME = new RegExp(`^[${L}][${L} .'-]{1,}$`)
const RE_ORT = new RegExp(`^[${L}][${L} .'-]{1,}$`)
const RE_PLZ_DE = /^\d{5}$/
const hasLetter = (s) => new RegExp(`[${L}]`).test(s)
const isGermany = (land) => !land || /deutsch|germany|^de$/i.test(String(land).trim())

const normOrt = (s) =>
  String(s).toLowerCase().replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/[^a-z]/g, '')

/** Format-Prüfung; gibt {field, message} des ersten Fehlers zurück oder null. */
function validateAddressFormat(d) {
  if (!RE_NAME.test(d.name)) return { field: 'name', message: 'Bitte gib deinen vollständigen Namen an (Buchstaben, keine Zahlen).' }
  if (!(hasLetter(d.strasse) && /\d/.test(d.strasse) && d.strasse.trim().length >= 5))
    return { field: 'strasse', message: 'Bitte Straße und Hausnummer angeben, z. B. „Musterstraße 12".' }
  if (isGermany(d.land)) {
    if (!RE_PLZ_DE.test(d.plz)) return { field: 'plz', message: 'Bitte eine gültige 5-stellige Postleitzahl angeben.' }
  } else if (d.plz.trim().length < 3) {
    return { field: 'plz', message: 'Bitte eine gültige Postleitzahl angeben.' }
  }
  if (!RE_ORT.test(d.ort)) return { field: 'ort', message: 'Bitte einen gültigen Ort angeben (Buchstaben, keine Zahlen).' }
  return null
}

/**
 * Echter PLZ↔Ort-Abgleich für Deutschland über die offene openPLZ-API.
 * Ergebnis:
 *   'ok'        – PLZ existiert und passt zum Ort
 *   'notfound'  – PLZ existiert nachweislich nicht (Fantasie-PLZ)
 *   'mismatch'  – PLZ existiert, aber Ort passt nicht (mit Vorschlägen in `names`)
 *   'unknown'   – API nicht erreichbar → NICHT blockieren (Format hat schon geprüft)
 */
async function checkPlzOrtDE(plz, ort) {
  try {
    const r = await fetch(`https://openplzapi.org/de/Localities?postalCode=${encodeURIComponent(plz)}`, {
      headers: { Accept: 'application/json' },
    })
    if (!r.ok) return { status: 'unknown' }
    const arr = await r.json()
    if (!Array.isArray(arr)) return { status: 'unknown' }
    if (arr.length === 0) return { status: 'notfound' }
    const want = normOrt(ort)
    const names = arr.map((x) => x && x.name).filter(Boolean)
    const match = names.some((n) => {
      const nn = normOrt(n)
      return nn && (nn === want || nn.includes(want) || want.includes(nn))
    })
    return { status: match ? 'ok' : 'mismatch', names }
  } catch {
    return { status: 'unknown' }
  }
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') { try { return JSON.parse(req.body) } catch { return {} } }
  const raw = await new Promise((res) => {
    let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => res(d)); req.on('error', () => res(''))
  })
  try { return JSON.parse(raw) } catch { return {} }
}

/** Positionen aus dem Request säubern und begrenzen. */
function sanitizeItems(raw) {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 50).map((it) => {
    const qty = Math.max(1, Math.min(99, Math.round(Number(it?.qty) || 1)))
    const unit = it?.unitPrice != null && !Number.isNaN(Number(it.unitPrice)) ? Math.round(Number(it.unitPrice)) : null
    return {
      productName: clean(it?.productName, 160) || '—',
      colorLabel: clean(it?.colorLabel, 80),
      sizeLabel: clean(it?.sizeLabel, 40),
      logoLabel: clean(it?.logoLabel, 80),
      note: clean(it?.note, 300),
      sku: clean(it?.sku, 80),
      qty,
      unitPrice: unit,
      lineTotal: unit != null ? unit * qty : null,
    }
  }).filter((it) => it.sku || it.productName !== '—')
}

// ───────────────────────── Mail-Texte ─────────────────────────
function itemLinesText(items) {
  return items.map((it, i) => {
    const parts = [it.colorLabel && `Farbe: ${it.colorLabel}`, it.sizeLabel && `Größe: ${it.sizeLabel}`, it.logoLabel && it.logoLabel !== '—' && `Logo: ${it.logoLabel}`]
      .filter(Boolean).join(' · ')
    return [
      `${i + 1}) ${it.productName}  ×${it.qty}`,
      parts && `   ${parts}`,
      `   Einzelpreis: ${it.unitPrice != null ? euro(it.unitPrice) : 'auf Anfrage'}  ·  Zwischensumme: ${it.lineTotal != null ? euro(it.lineTotal) : 'auf Anfrage'}`,
      it.note && `   Anmerkung: ${it.note}`,
      it.sku && `   Art.-Nr.: ${it.sku}`,
    ].filter(Boolean).join('\n')
  }).join('\n\n')
}

function internalMail(d) {
  const subject = `🛒 Neue Shirt-Anfrage: ${d.name} (${d.itemCount} ${d.itemCount === 1 ? 'Artikel' : 'Artikel'})`
  const anschrift = [d.strasse, `${d.plz} ${d.ort}`.trim(), d.land].filter(Boolean).join('\n')
  const text =
    `Neue Angebots-Anfrage aus dem Merch-Shop 🎉\n\n` +
    `— KONTAKT —\n` +
    `Name: ${d.name}\n` +
    `E-Mail: ${d.email}\n` +
    (d.telefon ? `Telefon: ${d.telefon}\n` : '') +
    (d.firma ? `Firma: ${d.firma}\n` : '') +
    `\n— LIEFERADRESSE —\n${anschrift || '—'}\n` +
    `\n— ARTIKEL —\n${itemLinesText(d.items)}\n\n` +
    `Unverbindliche Zwischensumme: ${d.subtotal != null ? euro(d.subtotal) : 'auf Anfrage'} (zzgl. Versand)\n` +
    (d.anmerkung ? `\n— ANMERKUNG DES KUNDEN —\n${d.anmerkung}\n` : '') +
    `\nBitte ein individuelles Angebot (inkl. Versand) erstellen und dem Kunden antworten (einfach auf diese Mail antworten).`

  const rowsHtml = d.items.map((it, i) => {
    const parts = [it.colorLabel, it.sizeLabel && `Gr. ${it.sizeLabel}`, it.logoLabel && it.logoLabel !== '—' ? it.logoLabel : null].filter(Boolean).join(' · ')
    return `<tr>
      <td style="padding:8px 6px;border-bottom:1px solid #eee;vertical-align:top">${i + 1}.</td>
      <td style="padding:8px 6px;border-bottom:1px solid #eee">
        <strong>${esc(it.productName)}</strong>${parts ? `<br><span style="color:#888;font-size:13px">${esc(parts)}</span>` : ''}
        ${it.note ? `<br><span style="color:#a06a00;font-size:13px">Anmerkung: ${esc(it.note)}</span>` : ''}
        ${it.sku ? `<br><span style="color:#bbb;font-size:11px">Art.-Nr.: ${esc(it.sku)}</span>` : ''}
      </td>
      <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:center">×${it.qty}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${it.lineTotal != null ? esc(euro(it.lineTotal)) : 'auf Anfrage'}</td>
    </tr>`
  }).join('')

  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;color:#1a1a1a">
      <div style="background:#0d0d0d;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
        <strong style="font-size:16px;letter-spacing:.04em">VIDEKO · Neue Shirt-Anfrage</strong>
      </div>
      <div style="border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:22px">
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:18px">
          <tr><td style="padding:5px 0;color:#888;width:120px">Name</td><td style="padding:5px 0"><strong>${esc(d.name)}</strong></td></tr>
          <tr><td style="padding:5px 0;color:#888">E-Mail</td><td style="padding:5px 0"><a href="mailto:${esc(d.email)}">${esc(d.email)}</a></td></tr>
          ${d.telefon ? `<tr><td style="padding:5px 0;color:#888">Telefon</td><td style="padding:5px 0">${esc(d.telefon)}</td></tr>` : ''}
          ${d.firma ? `<tr><td style="padding:5px 0;color:#888">Firma</td><td style="padding:5px 0">${esc(d.firma)}</td></tr>` : ''}
          <tr><td style="padding:5px 0;color:#888;vertical-align:top">Lieferadresse</td><td style="padding:5px 0;white-space:pre-wrap">${esc(anschrift) || '—'}</td></tr>
        </table>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead><tr>
            <th style="text-align:left;padding:6px;color:#888;font-weight:600;border-bottom:2px solid #0d0d0d">#</th>
            <th style="text-align:left;padding:6px;color:#888;font-weight:600;border-bottom:2px solid #0d0d0d">Artikel</th>
            <th style="text-align:center;padding:6px;color:#888;font-weight:600;border-bottom:2px solid #0d0d0d">Menge</th>
            <th style="text-align:right;padding:6px;color:#888;font-weight:600;border-bottom:2px solid #0d0d0d">Summe</th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <p style="text-align:right;margin:14px 0 0;font-size:15px"><strong>Zwischensumme: ${d.subtotal != null ? esc(euro(d.subtotal)) : 'auf Anfrage'}</strong> <span style="color:#888;font-size:12px">(zzgl. Versand)</span></p>
        ${d.anmerkung ? `<p style="margin:16px 0 4px;color:#888;font-size:13px">Anmerkung des Kunden</p><p style="margin:0;white-space:pre-wrap">${esc(d.anmerkung)}</p>` : ''}
        <p style="margin:18px 0 0;font-size:12px;color:#aaa">Unverbindliche Angebotsanfrage · einfach auf diese Mail antworten, um dem Kunden das Angebot zu schicken.</p>
      </div>
    </div>`
  return { subject, text, html }
}

function customerMail(d) {
  const first = (d.name || '').trim().split(/\s+/)[0] || 'du'
  const subject = 'Deine VIDEKO-Anfrage ist da – wir erstellen dein Angebot 🙌'
  const liste = d.items.map((it) => `• ${it.productName} ×${it.qty}${it.sizeLabel ? ` (Gr. ${it.sizeLabel}${it.colorLabel ? `, ${it.colorLabel}` : ''})` : it.colorLabel ? ` (${it.colorLabel})` : ''}`).join('\n')
  const body =
    `Hey ${first},\n\n` +
    `danke für deine Anfrage! 🙌 Sie ist bei uns eingegangen und wir erstellen dir jetzt dein individuelles Angebot inkl. Versandkosten.\n\n` +
    `Deine Auswahl:\n${liste}\n\n` +
    `Was jetzt passiert: Wir melden uns ganz schnell persönlich per E-Mail mit deinem Angebot. Erst wenn du dieses Angebot bestätigst, wird daraus etwas Verbindliches – bis dahin ist alles unverbindlich und kostenlos.`
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

  const items = sanitizeItems(b.items)
  const d = {
    name: clean(b.name, 120),
    email: clean(b.email, 200),
    telefon: clean(b.telefon, 60),
    firma: clean(b.firma, 160),
    strasse: clean(b.strasse, 200),
    plz: clean(b.plz, 20),
    ort: clean(b.ort, 120),
    land: clean(b.land, 80) || 'Deutschland',
    anmerkung: clean(b.anmerkung, 2000),
    items,
    itemCount: items.reduce((n, it) => n + it.qty, 0),
    subtotal: items.every((it) => it.unitPrice != null)
      ? items.reduce((s, it) => s + it.lineTotal, 0)
      : null,
  }

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)
  if (!emailOk) { res.status(422).json({ ok: false, error: 'address', field: 'email', message: 'Bitte gib eine gültige E-Mail-Adresse an.' }); return }
  if (items.length === 0) { res.status(422).json({ ok: false, error: 'invalid' }); return }

  // Adresse gegen Fantasie-Eingaben absichern: erst Format, dann echter PLZ↔Ort-Abgleich.
  const formatErr = validateAddressFormat(d)
  if (formatErr) { res.status(422).json({ ok: false, error: 'address', ...formatErr }); return }
  if (isGermany(d.land)) {
    const chk = await checkPlzOrtDE(d.plz, d.ort)
    if (chk.status === 'notfound') {
      res.status(422).json({ ok: false, error: 'address', field: 'plz', message: `Die Postleitzahl ${d.plz} gibt es nicht. Bitte prüfe deine PLZ.` }); return
    }
    if (chk.status === 'mismatch') {
      const vorschlag = (chk.names || []).slice(0, 3).join(', ')
      res.status(422).json({ ok: false, error: 'address', field: 'ort', message: `Die PLZ ${d.plz} gehört zu ${vorschlag || 'einem anderen Ort'}. Bitte prüfe PLZ und Ort.` }); return
    }
  }

  // 1) Best-effort Supabase-Speicherung (gleiche Tabelle wie Leads)
  let stored = false
  try {
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/videko_leads`, {
        method: 'POST',
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          source: 'merch-order', name: d.name, email: d.email, telefon: d.telefon,
          nachricht: d.anmerkung,
          meta: {
            firma: d.firma, lieferadresse: { strasse: d.strasse, plz: d.plz, ort: d.ort, land: d.land },
            items: d.items, subtotal: d.subtotal, itemCount: d.itemCount,
            ua: clean(req.headers['user-agent'], 200),
          },
        }),
      })
      stored = r.ok
    }
  } catch { /* nicht blockieren */ }

  // 2) Mails via SMTP
  let mailed = false
  try {
    if (SMTP_USER && SMTP_PASS) {
      const t = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
      const intern = internalMail(d)
      const kunde = customerMail(d)
      const from = `"VIDEKO Küchen" <${SMTP_USER}>`
      await t.sendMail({ from, to: LEAD_NOTIFY_TO, replyTo: d.email, subject: intern.subject, text: intern.text, html: intern.html })
      await t.sendMail({ from, to: d.email, replyTo: LEAD_NOTIFY_TO, subject: kunde.subject, text: kunde.text, html: kunde.html })
      mailed = true
    }
  } catch { /* Speicherung zählt trotzdem */ }

  const ok = stored || mailed
  res.status(ok ? 200 : 500).json({ ok, stored, mailed })
}
