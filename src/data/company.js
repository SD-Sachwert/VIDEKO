/**
 * Zentrale Unternehmens-/Betreiberkonfiguration – Single Source of Truth.
 *
 * RECHTLICHER HINTERGRUND (Stand: 2026-10-08):
 * Die »VIDEKO Küchen eG« ist seit 02.09.2026 im Genossenschaftsregister des
 * Amtsgerichts Würzburg eingetragen (GnR 298, Sitz Würzburg) und hat ihr Gewerbe
 * zum 01.10.2026 angemeldet (Betriebsstätte Hertzstraße 4, 97076 Würzburg).
 * Seit 08.10.2026 ist sie die Betreiberin dieses Internetauftritts
 * (`ACTIVE_OPERATOR = VIDEKO_EG`): Impressum, Datenschutz-Verantwortliche,
 * GPSR-Herstellerangabe und strukturierte Daten ziehen von hier.
 *
 * Bis 07.10.2026 war die »Süddeutsche Sachwert eG« Betreiberin; VIDEKO Küchen
 * war ein Geschäftsbereich der SDS. Das Würzburger Stadtfest 2026 (18./19.09.)
 * lief noch unter der SDS – dessen Teilnahme- und Einwilligungstexte bleiben
 * deshalb fest auf `SD_SACHWERT` (siehe stadtfest-recht.js).
 *
 * Offen: Umsatzsteuer-Identifikationsnummer (noch keine erteilt, `vatId: null`).
 */

/**
 * Marke / Geschäftsbereich – unabhängig vom rechtlichen Träger. Die Bezeichnung
 * „VIDEKO Küchen" darf weiterhin prominent verwendet werden.
 */
export const BRAND = {
  name: 'VIDEKO Küchen',
  shortName: 'VIDEKO',
  /**
   * Name für EXTERNE Einträge (Google Business Profile, Branchenverzeichnisse,
   * Social-Media-Profile) – mit Rechtsformzusatz.
   *
   * Vorgabe des Auftraggebers vom 2026-08-24: „Der korrekte Unternehmensname lautet
   * ausdrücklich: VIDEKO Küchen eG. Das ‚eG‘ ist richtig und darf NICHT entfernt
   * werden.“ Eine frühere Empfehlung, den Zusatz extern zu streichen, ist damit
   * aufgehoben.
   *
   * ABGRENZUNG – dieser Wert wird bewusst NICHT auf der Website ausgegeben:
   * Im Frontend gilt weiterhin `BRAND.name` (Marke, ohne Zusatz), im Impressum und
   * auf Vertrags-/Rechnungsebene `ACTIVE_OPERATOR` (seit 08.10.2026 die
   * VIDEKO Küchen eG). Der Wert dient als Sollwert für den NAP-Abgleich in Verzeichnissen.
   * Siehe docs/LOCAL-SEO-NAP-AUDIT-2026-08-24.md, Abschnitt 1.1a.
   */
  listingName: 'VIDEKO Küchen eG',
  domain: 'videko-kuechen.de',
  // Öffentliche Kontaktwege des Geschäftsbereichs VIDEKO Küchen.
  contactEmail: 'info@videko-kuechen.de',
  inquiryEmail: 'shop@videko-kuechen.de',
  phone: '0160 5545818',
  phoneHref: '+491605545818',
  // Physischer Studio-Standort (Küchenstudio) – NICHT der Sitz der Betreiberin.
  studio: { street: 'Hertzstraße 4', postalCode: '97076', city: 'Würzburg', country: 'Deutschland' },
  /**
   * ÖFFNUNGSZEITEN: BEWUSST `null` – OFFENER DATENPUNKT.
   *
   * Im Repository sind keine verbindlichen Öffnungszeiten hinterlegt und es
   * liegt keine Freigabe dafür vor.
   *
   * Stand 2026-08-24 (eigene Live-Recherche, ohne Verwaltungszugriff):
   * Im Google Business Profile ist öffentlich nur `Montag 09:00–18:00` auslesbar;
   * Googles eigener Statustext „Geschlossen · Öffnet Di um 09:00“ belegt zusätzlich
   * einen Dienstag-Beginn um 09:00. Die restlichen Wochentage sind öffentlich nicht
   * prüfbar. Gleichzeitig sagt der Inhaber-Beitrag vom 13.08.2026 im selben Profil
   * ausdrücklich „Bis zur Eröffnung im Winter 2026 gibt es noch einiges zu tun“ –
   * das Studio ist also noch gar nicht für Laufkundschaft geöffnet. Veröffentlichte
   * Öffnungszeiten wären derzeit also selbst dann fraglich, wenn sie vollständig
   * bekannt wären. Deshalb bleibt dieser Wert `null`. Externe Verzeichnisse zeigen widersprüchliche
   * Zeiten (Cylex: Mo–So 09–18 Uhr, Das Örtliche: Mo–Fr 09–18 Uhr, Gelbe Seiten:
   * „24 Stunden Service“) – siehe docs/LOCAL-SEO-NAP-AUDIT-2026-08-24.md.
   * Solange dieser Wert `null` ist, schreibt `localBusinessLd()` KEINE
   * `openingHoursSpecification` in die strukturierten Daten. Erfundene Zeiten
   * wären in den Suchergebnissen eine falsche Zusage.
   * Sobald freigegebene Zeiten vorliegen, gehören sie hierher – an genau eine
   * Stelle, aus der Website, Schema.org und alle Verzeichnisse gespeist werden.
   */
  openingHours: null,
}

/** Vollständige Studio-Anschrift einzeilig – für Fließtext und Listen. */
export const STUDIO_ADRESSE = `${BRAND.studio.street}, ${BRAND.studio.postalCode} ${BRAND.studio.city}`

/** Google-Maps-Suchlink auf die Studio-Anschrift. */
export const STUDIO_MAPS_URL =
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STUDIO_ADRESSE)}`

/** WhatsApp-Link auf die Studio-Rufnummer. `text` wird angehängt, wenn gesetzt. */
export function whatsappUrl(text) {
  const nummer = BRAND.phoneHref.replace(/[^0-9]/g, '')
  return text ? `https://wa.me/${nummer}?text=${encodeURIComponent(text)}` : `https://wa.me/${nummer}`
}

/**
 * Aktuell eingetragene, rechtlich verantwortliche Genossenschaft.
 * Quelle: Impressum https://www.sd-sachwert.de/impressum, geprüft am 2026-07-25.
 */
export const SD_SACHWERT = {
  legalName: 'Süddeutsche Sachwert eG',
  legalForm: 'eingetragene Genossenschaft (eG)',
  street: 'Grubenweg 4b',
  postalCode: '82327',
  city: 'Tutzing',
  country: 'Deutschland',
  board: ['Vitali Freisinger', 'Heiko Himmel'],
  registerCourt: 'Amtsgericht München',
  registerType: 'Genossenschaftsregister',
  registerNumber: 'GNR 2855',
  vatId: 'DE327112614',
  auditAssociation: 'Deutscher Interessenverband der Kleingenossenschaften e.V.',
  // Eigene Kontaktdaten der Betreiberin (aus deren Impressum).
  operatorEmail: 'info@sd-sachwert.de',
  operatorPhone: '+49 8158 9259945',
  registered: true,
}

/**
 * VIDEKO Küchen eG – Betreiberin seit 08.10.2026.
 * Quellen: Registerauszug GnR 298 AG Würzburg (Abruf 02.09.2026), Satzung vom
 * 03.03.2026, AGO § 42 (Prüfungsverband), Gewerbeanmeldung vom 01.10.2026.
 * Vertretung laut Register: alle drei Vorstände einzelvertretungsberechtigt.
 * Nichts erfinden – offene Felder bleiben `null`.
 */
export const VIDEKO_EG = {
  legalName: 'VIDEKO Küchen eG',
  legalForm: 'eingetragene Genossenschaft (eG)',
  street: 'Hertzstraße 4',
  postalCode: '97076',
  city: 'Würzburg',
  country: 'Deutschland',
  board: ['Vitali Freisinger', 'Dennis Himmel', 'Heiko Himmel'],
  boardNote: 'jeweils einzelvertretungsberechtigt',
  registerCourt: 'Amtsgericht Würzburg',
  registerType: 'Genossenschaftsregister',
  registerNumber: 'GnR 298',
  // noch keine USt-IdNr. erteilt (Stand 08.10.2026) – Impressum lässt den Abschnitt dann weg
  vatId: null,
  auditAssociation: 'DIVK Deutscher Interessenverband der Kleingenossenschaften e.V., Hildesheim',
  operatorEmail: 'info@videko-kuechen.de',
  // Festnetz fürs Impressum (Vorgabe Heiko 08.10.2026); Studio-Handy bleibt BRAND.phone
  operatorPhone: '0931 29764861',
  registered: true,
}

/**
 * >>> ZENTRALER SCHALTER <<<
 * Rechtliche Betreiberin der Website. Seit 08.10.2026 die VIDEKO Küchen eG
 * (eingetragen 02.09.2026, GnR 298 AG Würzburg).
 */
export const ACTIVE_OPERATOR = VIDEKO_EG

/** Betreibt die VIDEKO Küchen eG selbst (und nicht mehr die SDS als Geschäftsbereich)? */
export const EIGENE_GENOSSENSCHAFT = ACTIVE_OPERATOR === VIDEKO_EG

/** Einheitlicher Betreiberhinweis für Footer / Impressum / Datenschutz. */
export const OPERATOR_NOTICE = EIGENE_GENOSSENSCHAFT
  ? `${BRAND.name} ist eine Marke der ${ACTIVE_OPERATOR.legalName}, ${ACTIVE_OPERATOR.city}.`
  : `${BRAND.name} ist derzeit ein Geschäftsbereich bzw. eine Marke der ${ACTIVE_OPERATOR.legalName}.`

/** Kurzform „handelnd unter der Marke" – für Angebots-/Rechnungsabsender. */
export const OPERATOR_TRADING_AS =
  `${ACTIVE_OPERATOR.legalName}, handelnd unter der Marke ${BRAND.name}`

/**
 * GPSR-/Textil-Herstellerdarstellung des fertigen, unter der Marke VIDEKO
 * angebotenen Produkts: Marke + rechtlicher Träger + ladungsfähige Anschrift +
 * elektronische Kontaktadresse (verantwortlicher Wirtschaftsakteur nach
 * GPSR Art. 16). Zieht automatisch aus `ACTIVE_OPERATOR`.
 */
export const MANUFACTURER = {
  brandLine: BRAND.name,
  roleLine: EIGENE_GENOSSENSCHAFT ? `eine Marke der ${ACTIVE_OPERATOR.legalName}` : `ein Geschäftsbereich der ${ACTIVE_OPERATOR.legalName}`,
  legalName: ACTIVE_OPERATOR.legalName,
  street: ACTIVE_OPERATOR.street,
  postalCode: ACTIVE_OPERATOR.postalCode,
  city: ACTIVE_OPERATOR.city,
  country: ACTIVE_OPERATOR.country,
  email: BRAND.contactEmail,
}
