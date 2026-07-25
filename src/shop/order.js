/**
 * Client-Helfer für die geführte Angebots-Anfrage (Warenkorb → Kontaktdaten →
 * Absenden). Schickt die Positionen samt Kontakt- und Lieferdaten an den
 * Serverless-Endpoint `/api/order`, der die interne Team-Mail und die
 * Eingangsbestätigung an den Kunden verschickt.
 *
 * WICHTIG (Anfragemodell): Dies ist eine unverbindliche ANGEBOTSANFRAGE, KEINE
 * Bestellung mit Zahlungspflicht. Es wird kein Vertrag geschlossen und keine
 * Zahlung ausgelöst; der verbindliche Preis (inkl. Versand) entsteht erst im
 * individuellen Angebot per E-Mail.
 *
 * Fällt der Endpoint aus (z. B. SMTP auf Vercel nicht konfiguriert), liefert
 * `submitOrder` einen Fehler zurück – die Oberfläche bietet dann als Rückfall
 * die vorbelegte mailto-Anfrage an, damit die Anfrage NIE ins Leere läuft.
 */
import { INQUIRY_MAIL, formatPrice } from '../data/merch.js'

/** Reduziert eine Warenkorb-Position auf die für die Anfrage nötigen Felder. */
function toOrderItem(it) {
  return {
    sku: it.sku,
    productName: it.productName,
    colorLabel: it.colorLabel,
    sizeLabel: it.sizeLabel,
    logoLabel: it.logoLabel,
    note: it.note,
    qty: it.qty || 1,
    unitPrice: it.unitPrice != null ? it.unitPrice : null,
  }
}

/**
 * Schickt die Anfrage an den Server.
 * @returns {Promise<{ok:boolean, mailed?:boolean, stored?:boolean, error?:string}>}
 */
export async function submitOrder({ contact, items }) {
  const payload = {
    name: contact.name,
    email: contact.email,
    telefon: contact.telefon,
    firma: contact.firma,
    strasse: contact.strasse,
    plz: contact.plz,
    ort: contact.ort,
    land: contact.land || 'Deutschland',
    anmerkung: contact.anmerkung,
    items: (items || []).map(toOrderItem),
    website: contact.website || '', // Honeypot
  }
  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    let data = {}
    try { data = await res.json() } catch { /* leere/ungültige Antwort */ }
    if (res.ok && data.ok) return { ok: true, mailed: data.mailed, stored: data.stored }
    return { ok: false, error: data.error || `http-${res.status}` }
  } catch {
    return { ok: false, error: 'network' }
  }
}

/**
 * Rückfall: baut eine vorbelegte mailto-Anfrage inkl. Kontakt-/Lieferdaten.
 * Wird nur genutzt, wenn der Server nicht erreichbar ist.
 */
export function buildOrderMailto({ contact, items }) {
  const liste = Array.isArray(items) ? items : []
  let gesamt = 0
  let alleMitPreis = true
  const bloecke = liste.map((it, i) => {
    const qty = it.qty || 1
    const hatPreis = it.unitPrice != null
    if (!hatPreis) alleMitPreis = false
    if (hatPreis) gesamt += it.unitPrice * qty
    return [
      `${i + 1}) ${it.productName || '—'}`,
      `   Farbe: ${it.colorLabel || '—'}`,
      `   Größe: ${it.sizeLabel || '—'}`,
      `   Logoausführung: ${it.logoLabel || '—'}`,
      `   Anzahl: ${qty}`,
      `   Einzelpreis: ${hatPreis ? formatPrice(it.unitPrice) : 'auf Anfrage'}`,
      it.note ? `   Anmerkung: ${it.note}` : null,
      `   Art.-Nr.: ${it.sku || '—'}`,
    ].filter(Boolean).join('\n')
  })
  const summe = alleMitPreis && liste.length
    ? `Unverbindliche Zwischensumme (zzgl. Versand): ${formatPrice(gesamt)}`
    : 'Unverbindliche Zwischensumme: auf Anfrage (zzgl. Versand)'
  const anschrift = [contact.strasse, `${contact.plz || ''} ${contact.ort || ''}`.trim(), contact.land]
    .filter(Boolean).join(', ')
  const body = [
    'Hallo VIDEKO-Team,',
    '',
    'ich frage die folgenden Produkte unverbindlich an und bitte um ein individuelles Angebot inkl. Versand.',
    '',
    '— MEINE KONTAKTDATEN —',
    `Name: ${contact.name || '—'}`,
    `E-Mail: ${contact.email || '—'}`,
    contact.telefon ? `Telefon: ${contact.telefon}` : null,
    contact.firma ? `Firma: ${contact.firma}` : null,
    `Lieferadresse: ${anschrift || '—'}`,
    '',
    '— ARTIKEL —',
    bloecke.join('\n\n'),
    '',
    summe,
    contact.anmerkung ? `\nAnmerkung: ${contact.anmerkung}` : null,
    '',
    'Viele Grüße',
    contact.name || '',
  ].filter((l) => l !== null).join('\n')
  return `mailto:${INQUIRY_MAIL}?subject=${encodeURIComponent('Unverbindliche VIDEKO-Shirt-Anfrage')}&body=${encodeURIComponent(body)}`
}
