import { BRAND } from '../data/company.js'

/**
 * Visitenkarte zum Mitnehmen — als echte vCard-Datei.
 *
 * Bewusst KEINE statische Datei in public/: Telefonnummer, E-Mail und
 * Anschrift stehen genau einmal im Projekt, naemlich in data/company.js.
 * Eine zweite gepflegte Kopie im public-Ordner wuerde beim naechsten
 * Nummernwechsel unbemerkt veralten. Die Datei entsteht deshalb im Browser
 * aus denselben Daten, die auch Footer, Kontaktseite und Standortblock
 * benutzen. Hier wird nichts erfunden und nichts nachgeschlagen.
 *
 * Version 3.0 statt 4.0: Sie wird von iOS, Android, Outlook und Google
 * Kontakte gleichermassen anstandslos importiert.
 */

/** Dateiname der erzeugten Karte. Ohne Umlaut, damit ihn jedes Ziel mag. */
export const VCARD_DATEINAME = 'VIDEKO-Kuechen.vcf'

/**
 * Maskiert die Zeichen, die in einem vCard-Wert Sonderbedeutung haben
 * (RFC 2426). Aktuell enthaelt keiner unserer Werte eines davon — die
 * Funktion steht hier, damit das auch nach der naechsten Adressaenderung
 * noch stimmt.
 */
function esc(wert) {
  return String(wert)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/([,;])/g, '\\$1')
}

/**
 * Der Inhalt der Karte. Nur belegte Felder, keine Platzhalter:
 * Name, Firma, Telefon, E-Mail, Website, Anschrift.
 *
 * `N` steht drin, weil vCard 3.0 es verlangt — ohne den Eintrag legen
 * manche Importer einen namenlosen Kontakt an. Der Firmenname im
 * Nachnamensfeld ist die uebliche Loesung fuer Firmenkarten.
 */
export function vcardText() {
  const ort = BRAND.studio
  const zeilen = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(BRAND.name)};;;;`,
    `FN:${esc(BRAND.name)}`,
    `ORG:${esc(BRAND.listingName)}`,
    `TEL;TYPE=WORK,VOICE:${BRAND.phoneHref}`,
    `EMAIL;TYPE=WORK:${BRAND.contactEmail}`,
    `URL:https://${BRAND.domain}`,
    // ADR: Postfach;Zusatz;Strasse;Ort;Region;PLZ;Land
    `ADR;TYPE=WORK:;;${esc(ort.street)};${esc(ort.city)};;${esc(ort.postalCode)};${esc(ort.country)}`,
    'END:VCARD',
  ]
  // Zeilenende ist im Format vorgeschrieben CRLF, unabhaengig vom System.
  return `${zeilen.join('\r\n')}\r\n`
}

/**
 * Loest den Download der Karte aus. Kein Netzaufruf, kein Tracking: Die
 * Datei entsteht im Browser und verlaesst das Geraet nicht.
 *
 * Rueckgabe sagt nur, ob der Download angestossen wurde — ob das Telefon
 * den Kontakt am Ende wirklich speichert, weiss die Seite nicht und
 * behauptet es darum auch nicht.
 */
export function vcardSpeichern() {
  if (typeof document === 'undefined' || typeof Blob === 'undefined') return false
  if (typeof URL === 'undefined' || !URL.createObjectURL) return false

  const blob = new Blob([vcardText()], { type: 'text/vcard;charset=utf-8' })
  const adresse = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = adresse
  a.download = VCARD_DATEINAME
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Safari auf dem iPhone braucht die Blob-Adresse noch einen Moment,
  // waehrend es die Vorschau der Karte oeffnet.
  setTimeout(() => URL.revokeObjectURL(adresse), 30000)
  return true
}
