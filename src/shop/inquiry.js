/**
 * Unverbindliche E-Mail-Anfrage (Anfragemodell – § 4 der Merch-Vorgabe).
 *
 * Der Merch-Bereich schließt über die Website KEINEN Vertrag. Ein Klick öffnet
 * lediglich eine vorbelegte mailto-Anfrage an info@videko-kuechen.de. Es wird
 * KEINE Bestellung angelegt, KEINE Zahlung ausgelöst, KEINE Bestellnummer und
 * KEINE Auftrags-/Bestellbestätigung erzeugt und NICHTS auf einem Server
 * gespeichert.
 *
 * Der Text ist bewusst unverbindlich formuliert und enthält KEINE Begriffe wie
 * „bestellen", „kaufen", „Auftrag erteilen", „Bestellung abschließen",
 * „zahlungspflichtig" oder „verbindlich kaufen". Preise stehen nur als
 * unverbindliche Angabe; ein verbindlicher Preis entsteht erst im individuellen
 * Angebot per E-Mail.
 */
import { INQUIRY_MAIL, formatPrice } from '../data/merch.js'

/** Fester Betreff aller Sammel-Anfragen (§ 4). */
export const INQUIRY_SUBJECT = 'Unverbindliche VIDEKO-Shirt-Anfrage'

/** Hinweis, der in unmittelbarer Nähe des Absende-Buttons steht (§ 4). */
export const INQUIRY_DISCLAIMER =
  'Diese Anfrage ist unverbindlich und stellt keine Bestellung dar. ' +
  'Es entsteht kein Vertrag und keine Zahlungspflicht. Wir melden uns mit einem ' +
  'individuellen Angebot – Versandkosten nennen wir darin.'

const einleitung =
  'Hiermit frage ich die nachfolgenden Produkte unverbindlich an. ' +
  'Diese Nachricht stellt noch keine Bestellung dar.'

const abschluss =
  'Bitte sendet mir ein individuelles Angebot zu den oben genannten Produkten ' +
  'inklusive Versandkosten.'

const VERSANDHINWEIS = 'wird im individuellen Angebot genannt'

/**
 * Baut die vorbelegte mailto-Sammelanfrage aus den Positionen der Anfrageliste.
 *
 * @param {Array<{ sku?:string, productName?:string, colorLabel?:string,
 *   sizeLabel?:string, logoLabel?:string, unitPrice?:number, qty?:number,
 *   note?:string }>} items  Positionen (Preise in Cent)
 * @returns {string} mailto-URL
 */
export function buildInquiryListMailto(items = []) {
  const liste = Array.isArray(items) ? items : []
  let gesamt = 0
  let alleMitPreis = true

  const bloecke = liste.map((it, i) => {
    const qty = it.qty || 1
    const hatPreis = it.unitPrice != null
    if (!hatPreis) alleMitPreis = false
    const zwischen = hatPreis ? it.unitPrice * qty : null
    if (hatPreis) gesamt += zwischen
    return [
      `${i + 1}) ${it.productName || '—'}`,
      `   Farbe: ${it.colorLabel || '—'}`,
      `   Größe: ${it.sizeLabel || '—'}`,
      `   Logoausführung: ${it.logoLabel || '—'}`,
      `   Anzahl: ${qty}`,
      `   Einzelpreis: ${hatPreis ? `${formatPrice(it.unitPrice)} (inkl. gesetzl. USt.)` : 'auf Anfrage'}`,
      `   Zwischensumme: ${zwischen != null ? formatPrice(zwischen) : 'auf Anfrage'}`,
      `   Versandkosten: ${VERSANDHINWEIS}`,
      `   Anmerkung: ${it.note ? it.note : '—'}`,
      `   Art.-Nr.: ${it.sku || '—'}`,
    ].join('\n')
  })

  const summenZeile = alleMitPreis && liste.length
    ? `Unverbindliche Zwischensumme (zzgl. Versand): ${formatPrice(gesamt)}`
    : 'Unverbindliche Zwischensumme: auf Anfrage (zzgl. Versand)'

  const body = [
    'Hallo VIDEKO-Team,',
    '',
    einleitung,
    '',
    bloecke.join('\n\n'),
    '',
    summenZeile,
    '',
    abschluss,
    '',
    'Viele Grüße',
  ].join('\n')

  return `mailto:${INQUIRY_MAIL}?subject=${encodeURIComponent(INQUIRY_SUBJECT)}&body=${encodeURIComponent(body)}`
}

/** Öffnet die vorbelegte, unverbindliche Sammel-Anfrage-Mail. */
export function openInquiryList(items) {
  if (typeof window !== 'undefined') {
    window.location.href = buildInquiryListMailto(items)
  }
}
