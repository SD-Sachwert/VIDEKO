/**
 * Unverbindliche E-Mail-Anfrage (Anfragemodell – Livegang-Audit).
 *
 * Der Merch-Bereich schließt über die Website KEINEN Vertrag. Ein Klick öffnet
 * lediglich eine vorbelegte mailto-Anfrage. Es wird KEINE Bestellung angelegt,
 * KEINE Zahlung ausgelöst und KEINE Auftrags-/Bestellbestätigung erzeugt.
 *
 * Der Text ist bewusst unverbindlich formuliert und enthält KEINE Begriffe wie
 * „bestellen", „kaufen", „Auftrag", „kostenpflichtig" oder „verbindlich" und
 * KEINEN Preis. Ein verbindlicher Preis entsteht erst im individuellen Angebot
 * per E-Mail (siehe docs/compliance/EMAIL-VERKAUFSPROZESS.md, Phase B).
 *
 * Felder bewusst begrenzt auf: Produkt, Farbe, Größe, Logoausführung, Anzahl,
 * optionale Anmerkung.
 */
import { INQUIRY_MAIL } from '../data/merch.js'

export const INQUIRY_DISCLAIMER =
  'Mit dem Absenden der E-Mail wird noch keine Bestellung ausgelöst. ' +
  'Wir senden dir anschließend ein individuelles Angebot.'

/**
 * @param {{ productName?:string, color?:string, size?:string, logo?:string, qty?:number|string, note?:string }} d
 * @returns {string} mailto-URL
 */
export function buildInquiryMailto(d = {}) {
  const felder = [
    ['Produkt', d.productName || '—'],
    ['Farbe', d.color || '—'],
    ['Größe', d.size || '—'],
    ['Logoausführung', d.logo || '—'],
    ['Anzahl', d.qty ? String(d.qty) : '1'],
    ['Anmerkung', d.note || ''],
  ]
  const body =
    'Hallo VIDEKO-Team,\n\n' +
    'Hiermit frage ich das folgende Produkt unverbindlich an. ' +
    'Diese Nachricht stellt noch keine Bestellung dar.\n\n' +
    felder.map(([label, wert]) => `${label}: ${wert}`).join('\n') +
    '\n\nViele Grüße\n'
  const subject = `Unverbindliche Anfrage: ${d.productName || 'VIDEKO Merch'}`
  return `mailto:${INQUIRY_MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/** Öffnet die vorbelegte, unverbindliche Anfrage-Mail. */
export function openInquiry(details) {
  if (typeof window !== 'undefined') {
    window.location.href = buildInquiryMailto(details)
  }
}
