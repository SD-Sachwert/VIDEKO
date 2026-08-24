/**
 * Zentrale Unternehmens-/Betreiberkonfiguration – Single Source of Truth.
 *
 * RECHTLICHER HINTERGRUND (Stand: 2026-07):
 * Die »VIDEKO Küchen eG« ist noch NICHT im Genossenschaftsregister eingetragen
 * und darf daher NICHT als bereits bestehende Betreiberin, Herstellerin,
 * Vertragspartnerin, Zahlungsempfängerin oder Rechnungsausstellerin dargestellt
 * werden. Bis zu ihrer Eintragung ist die bereits eingetragene
 *   »Süddeutsche Sachwert eG«
 * die rechtliche Betreiberin dieses Internetauftritts (videko-kuechen.de),
 * datenschutzrechtlich Verantwortliche, Absenderin von Angeboten, mögliche
 * Verkäuferin, Zahlungsempfängerin, Rechnungsausstellerin und Vertragspartnerin
 * der Kunden. »VIDEKO Küchen« ist derzeit ein Geschäftsbereich bzw. eine Marke
 * dieser Genossenschaft.
 *
 * UMSTELLUNG NACH EINTRAGUNG:
 * Sobald die VIDEKO Küchen eG mit Registergericht, Registernummer, Vorständen,
 * Anschrift, Steuerdaten und tatsächlichem Stichtag eingetragen ist, wird die
 * Zielgesellschaft `VIDEKO_EG` vollständig befüllt und `ACTIVE_OPERATOR` von
 * `SD_SACHWERT` auf `VIDEKO_EG` umgestellt. Damit ziehen an EINER Stelle nach:
 * Impressum, Datenschutz-Verantwortliche, GPSR-Herstellerangabe, E-Mail-
 * Absender, Angebote, Rechnungen, Zahlungsempfänger, Widerruf, AGB und
 * Rücksende-/Betreiberadresse. Bis dahin bleibt `VIDEKO_EG` bewusst
 * unvollständig (`null`) und darf NICHT aktiviert werden.
 */

/**
 * Marke / Geschäftsbereich – unabhängig vom rechtlichen Träger. Die Bezeichnung
 * „VIDEKO Küchen" darf weiterhin prominent verwendet werden.
 */
export const BRAND = {
  name: 'VIDEKO Küchen',
  shortName: 'VIDEKO',
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
   * liegt keine Freigabe dafür vor. Externe Verzeichnisse zeigen widersprüchliche
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
 * Zielgesellschaft nach Registereintragung – bewusst UNVOLLSTÄNDIG.
 * Erst befüllen UND aktivieren, wenn der Registerauszug tatsächlich vorliegt.
 * Nichts erfinden – offene Felder bleiben `null`.
 */
export const VIDEKO_EG = {
  legalName: 'VIDEKO Küchen eG',
  legalForm: 'eingetragene Genossenschaft (eG)',
  street: null,
  postalCode: null,
  city: null,
  country: 'Deutschland',
  board: null,
  registerCourt: null,
  registerType: 'Genossenschaftsregister',
  registerNumber: null,
  vatId: null,
  auditAssociation: null,
  operatorEmail: null,
  operatorPhone: null,
  registered: false,
}

/**
 * >>> ZENTRALER SCHALTER <<<
 * Solange die VIDEKO Küchen eG nicht eingetragen ist, bleibt die
 * Süddeutsche Sachwert eG die rechtliche Betreiberin. Nach der Eintragung hier
 * (und erst dann) auf `VIDEKO_EG` umstellen.
 */
export const ACTIVE_OPERATOR = SD_SACHWERT

/** Einheitlicher Betreiberhinweis für Footer / Impressum / Datenschutz. */
export const OPERATOR_NOTICE =
  `${BRAND.name} ist derzeit ein Geschäftsbereich bzw. eine Marke der ${ACTIVE_OPERATOR.legalName}.`

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
  roleLine: `ein Geschäftsbereich der ${ACTIVE_OPERATOR.legalName}`,
  legalName: ACTIVE_OPERATOR.legalName,
  street: ACTIVE_OPERATOR.street,
  postalCode: ACTIVE_OPERATOR.postalCode,
  city: ACTIVE_OPERATOR.city,
  country: ACTIVE_OPERATOR.country,
  email: BRAND.contactEmail,
}
