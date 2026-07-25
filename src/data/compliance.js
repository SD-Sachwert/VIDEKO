/**
 * Compliance-Datenschicht für den VIDEKO-Textilshop.
 *
 * Trennt bewusst ZWEI Ebenen:
 *   1. ÖFFENTLICH  – Angaben, die auf der Produktseite / im Shop stehen müssen
 *      (Textilkennzeichnungsverordnung EU 1007/2011, GPSR EU 2023/988 Art. 16,
 *      Preisangabenverordnung).
 *   2. INTERN      – Dokumentation, die vorgehalten, aber nicht öffentlich
 *      gezeigt werden muss (Lieferkette, Risikoanalyse, Nachweise, Rückruf).
 *
 * GRUNDREGEL: Hier werden KEINE Pflichtangaben, Farben, Zertifikate oder
 * Lieferantendaten erfunden. Was nicht sicher belegt ist, bleibt `null`/`false`
 * und wird über die Prüf-Skripte als unvollständig ausgewiesen.
 *
 * AKTUELLER VERKAUFSUMFANG (Stand: nur diese eine Blankware wird verkauft):
 *   -> Produktfamilie SOLS-IMPERIAL-11500 (Herren-T-Shirt, Blankware SOL'S
 *      Imperial 11500). Alle Logo-, Farb- und Größenvarianten dieses Shirts
 *      gehören zu DIESER einen Familie – es sind keine 51 Einzelprodukte.
 *   Alle übrigen Artikel sind „Coming soon" (nicht kaufbar) und noch nicht
 *   vollständig dokumentiert.
 */

import { MANUFACTURER, ACTIVE_OPERATOR, BRAND } from './company.js'

/**
 * Verantwortlicher Wirtschaftsakteur i. S. d. GPSR (Art. 16) und
 * verantwortliches Unternehmen für die Textilkennzeichnung des FERTIGEN,
 * unter der Marke VIDEKO angebotenen Produkts.
 *
 * Rechtlicher Träger = aktuelle Betreiberin (`ACTIVE_OPERATOR` in company.js):
 * bis zur Eintragung der VIDEKO Küchen eG die »Süddeutsche Sachwert eG«.
 * Die Marke „VIDEKO Küchen" wird als Geschäftsbereich dieser Genossenschaft
 * ausgewiesen. Alle Werte ziehen zentral aus company.js – hier wird nichts
 * dupliziert oder erfunden.
 */
export const RESPONSIBLE_OPERATOR = {
  // Öffentliche Herstellerdarstellung: Marke + Trägergesellschaft.
  brandLine: MANUFACTURER.brandLine, // 'VIDEKO Küchen'
  roleLine: MANUFACTURER.roleLine, // 'ein Geschäftsbereich der Süddeutsche Sachwert eG'
  companyName: MANUFACTURER.legalName, // rechtlicher Träger (aktuell SD Sachwert eG)
  street: MANUFACTURER.street,
  postalCode: MANUFACTURER.postalCode,
  city: MANUFACTURER.city,
  country: MANUFACTURER.country,
  email: MANUFACTURER.email,
  phone: BRAND.phone,
  brand: BRAND.shortName,
  // Die Veredelung erfolgt im eigenen Haus (Geschäftsbereich VIDEKO Küchen der
  // Betreiberin); die Betreiberin bringt das fertige Shirt in Verkehr und ist
  // damit verantwortlicher Wirtschaftsakteur des Endprodukts. Ob zusätzlich ein
  // Importeur/Bevollmächtigter für die Blankware zu benennen ist, hängt von der
  // Lieferkette der Blankware ab (siehe PRODUCT_FAMILIES).
  operatorRoleConfirmed: false, // TODO extern klären (siehe docs/compliance)
}

/** Name des Veredelungs-/Verantwortungsträgers (Marke + aktuelle Betreiberin). */
const FINISHING_PARTNER = `${BRAND.name} (${ACTIVE_OPERATOR.legalName})`

/**
 * Herkunftsland je Produkt bzw. Produktfamilie. BEWUSST leer: die tatsächliche
 * Fertigungsherkunft der Blankware ist noch nicht belegt. Sobald bekannt, hier
 * per Produkt-`id` oder `variantGroup` eintragen. `publicCompliance()` gibt
 * null zurück, solange nichts eingetragen ist – es wird KEIN Land geraten.
 *
 * WICHTIG: Eine Herkunftsangabe ist für Textilien in der EU KEINE generelle
 * Pflicht. Ein fehlendes Herkunftsland ist daher KEIN Compliance-Blocker – es
 * sei denn, im Einzelfall besteht eine konkrete Kennzeichnungspflicht oder es
 * wurde bereits eine Herkunft ausgelobt.
 */
export const COUNTRY_OF_ORIGIN = {
  // 'variantGroup-oder-id': 'Land',
}

/**
 * Öffentliche Pflichtangaben zu einem Produkt, gebündelt für die Anzeige.
 * Zieht Material/Pflege/SKU aus dem Produkt selbst und ergänzt Hersteller +
 * Herkunft. Fehlt etwas, steht dort null (die UI zeigt dann einen ehrlichen
 * Hinweis statt einer Erfindung).
 */
export function publicCompliance(product) {
  const originKey = product.variantGroup || product.id
  return {
    brand: 'VIDEKO',
    productName: product.name,
    productType: product.kicker || product.productType,
    sku: product.sku || null,
    material: product.material || null, // z. B. "100 % Baumwolle"
    care: product.care || null,
    countryOfOrigin: COUNTRY_OF_ORIGIN[originKey] ?? null,
    manufacturer: RESPONSIBLE_OPERATOR,
    safetyNotice: SAFETY_NOTICE[product.productType] ?? null,
  }
}

/**
 * Produktbezogene Warn-/Sicherheitshinweise für die Produktseite. Nur eintragen,
 * was zutrifft und belegt ist. Leer = kein Hinweis erforderlich/bekannt.
 */
export const SAFETY_NOTICE = {
  // 'hoodie': 'Kordelzug – nicht für Kleinkinder geeignet.', // erst nach Prüfung
}

/* ============================================================================
 *  BLANKWARE-PRODUKTFAMILIEN (interne GPSR-/Produktakte)
 * ==========================================================================*/

/**
 * Vorlage für ein VEREDELUNGSPROFIL. Die Veredelung (Druck/Flock/Stick) macht
 * der Geschäftsbereich VIDEKO Küchen (Trägergesellschaft = aktuelle Betreiberin)
 * selbst. Pro tatsächlich eingesetztem Verfahren wird ein Profil geführt. Nur
 * wirklich verwendete Verfahren anlegen – nichts erfinden.
 */
export const FINISHING_PROFILE_TEMPLATE = {
  method: null, // konkretes Verfahren: 'DTF' | 'Flex' | 'Flock' | 'Siebdruck' | 'Stick'
  partner: FINISHING_PARTNER, // Veredelung erfolgt im eigenen Haus
  materialName: null, // eingesetztes Druck-/Flex-/Flockmaterial
  materialManufacturer: null, // Hersteller des Veredelungsmaterials
  materialProductName: null, // Produktbezeichnung des Materials
  materialColor: null,
  adhesiveOrCarrier: null, // Klebstoff/Trägermaterial
  safetyProof: null, // Sicherheits-/Schadstoffnachweis (z. B. OEKO-TEX des Materials)
  processingParams: null, // Verarbeitungstemperatur/-parameter, falls verfügbar
  care: null, // Pflegehinweise des fertig veredelten Shirts
  batchProof: null, // Lieferanten-/Chargennachweis des Veredelungsmaterials
  approvalStatus: 'offen', // 'offen' | 'freigegeben'
}

/**
 * Verkaufsrelevante Blankware-Produktfamilien.
 *
 * Die Varianten (Logo/Farbe/Größe) ERBEN aus der Familie:
 *   Blankware-Hersteller, -Modell, Grundmaterial, Flächengewicht,
 *   Grundkonstruktion, allgemeine Pflege, techn. Datenblätter,
 *   Blankware-Zertifikate, allgemeine Risikoanalyse.
 * Variantenbezogen bleiben: SKU, Farbe+Farbcode, Größe, Logoausführung,
 *   Druck-/Flockfarbe, Veredelungsverfahren, ggf. abweichende Pflege,
 *   Produktbild, Verkaufspreis.
 */
export const PRODUCT_FAMILIES = {
  'SOLS-IMPERIAL-11500': {
    id: 'SOLS-IMPERIAL-11500',
    productType: 'Herren-T-Shirt',
    // Interne variantGroup(s) aus products.json, die zu dieser Blankware gehören.
    variantGroups: ['signature-tee'],

    // --- Blankware / Lieferkette -------------------------------------------
    blankware: {
      brand: "SOL'S",
      line: 'Imperial',
      model: '11500',
      // Hersteller der Blankware laut offizieller Anbieterinformation.
      manufacturer: {
        name: 'SOLO INVEST SAS',
        source: 'offizielle Anbieterinformation SOL’S',
        verified: false, // durch Datenblatt/Etikett bestätigen
      },
      // Bezugsquelle (Händler/Großhändler), NICHT der Hersteller.
      supplier: { name: 'Gröner-Schulze', role: 'Lieferant/Händler' },
      // Verbindliche Blankware-Referenz (vom Auftraggeber gesendete Produktlinks
      // beim Lieferanten Gröner-Schulze – autorisierte Materialquelle).
      referenceLink: {
        black: 'https://www.groener-schulze.de/sol-s-imperial-herren-t-shirt-11500',
        white: 'https://www.groener-schulze.de/sol-s-imperial-herren-t-shirt-11500',
      },
    },

    // --- Grundmaterial der Blankware ---------------------------------------
    material: {
      base: '100 % halbgekämmte, ringgesponnene Baumwolle',
      construction: 'Single Jersey, Rundstrick ohne Seitennaht',
      weightGsm: 190,
      collar: 'Rippstrickkragen mit Elasthan',
      neckTape: true,
      // Abweichende Zusammensetzung NUR bei bestimmten Blankware-Farben.
      // Diese Farben werden aktuell NICHT verkauft (siehe colorsInUse).
      colorExceptions: {
        '300 Ash': '98 % Baumwolle, 2 % Viskose',
        '350 Grey Melange': '85 % Baumwolle, 15 % Viskose',
      },
    },

    // --- Tatsächlich bezogene Farben ---------------------------------------
    // Farb-/Materialdaten anhand der vom Auftraggeber benannten, autorisierten
    // Lieferanten-Produktseiten (Gröner-Schulze) belegt → `confirmedBySource`.
    // `confirmedByInvoice` bleibt getrennt und false, bis zusätzlich die
    // Lieferanten-Rechnung/Charge vorliegt (ehrliche Unterscheidung der
    // Nachweistiefe). Beide Farben sind das Standard-Modell aus 100 % Baumwolle;
    // die Viskose-Mischungen (Ash/Grey Melange) werden NICHT bezogen.
    colorsInUse: [
      {
        internalKey: 'black', label: 'Schwarz',
        solsColorName: 'Deep Black', solsColorCode: '309',
        hex: '#2D2927', pantone: '19-4006 TCX',
        material: '100 % Baumwolle', // Schwarz zählt nicht zu den Ausnahmen
        confirmedBySource: true, // Lieferanten-Produktseite (Gröner-Schulze)
        confirmedByInvoice: false, // Rechnung/Charge noch offen
        note: 'SOL’S Imperial 11500, Farbe „309 – deep black" laut Lieferanten-Produktseite (Gröner-Schulze).',
      },
      {
        internalKey: 'white', label: 'Weiß',
        solsColorName: 'Absolute White', solsColorCode: '117',
        hex: '#F4F9FE', pantone: '11-0601 TCX',
        material: '100 % Baumwolle', // Weiß zählt nicht zu den Ausnahmen
        confirmedBySource: true, // Lieferanten-Produktseite (Gröner-Schulze)
        confirmedByInvoice: false, // Rechnung/Charge noch offen
        note: 'SOL’S Imperial 11500, Farbe „117 – absolute white" laut Lieferanten-Produktseite (Gröner-Schulze).',
      },
    ],

    // Bei Gröner-Schulze verfügbar: XS–5XL. VIDEKO bietet S–XXL an (Quelle:
    // Lieferanten-Produktseite). Endgültige Bestätigung je Größe via Rechnung.
    sizesInUse: ['S', 'M', 'L', 'XL', 'XXL'],

    // --- Zertifikate (NUR intern, nicht automatisch fürs Endprodukt) -------
    // Gelten für die BLANKWARE. Dürfen NICHT ungeprüft für das fertig
    // veredelte VIDEKO-Shirt beworben werden.
    certificates: [
      { name: 'OEKO-TEX Standard 100', scope: 'Blankware (Modell/Farbe zu prüfen)', verified: false, publiclyClaimable: false },
      { name: 'PETA Approved Vegan', scope: 'Blankware', verified: false, publiclyClaimable: false },
    ],
    certificatesPubliclyClaimable: false,

    // --- Veredelung (macht der Geschäftsbereich VIDEKO Küchen selbst) ------
    finishing: {
      partner: FINISHING_PARTNER,
      partnerIsResponsibleOperator: true,
      // Nur tatsächlich verwendete Profile. Die Signature-Tees werden bedruckt
      // ('print'); das KONKRETE Verfahren (DTF/Flex/Siebdruck/…) ist noch zu
      // bestätigen und wird NICHT geraten.
      profiles: {
        print: { ...FINISHING_PROFILE_TEMPLATE, method: null },
      },
    },

    // Verantwortlicher Wirtschaftsakteur des fertigen Produkts.
    responsibleOperator: FINISHING_PARTNER,

    // Ist die Blankware-/Veredelungsakte vollständig belegt? Erst true, wenn
    // Nachweise (Rechnung, Datenblatt, Etiketten, Veredelungsmaterial,
    // Risikoanalyse) vorliegen – siehe docs/compliance/sols-imperial-11500-unterlagen.md.
    complete: false,
  },
}

/** variantGroup -> Familien-ID (für schnelle Zuordnung einer Variante). */
const FAMILY_BY_VARIANT_GROUP = Object.fromEntries(
  Object.values(PRODUCT_FAMILIES).flatMap((f) => (f.variantGroups || []).map((vg) => [vg, f.id])),
)

/**
 * Löst ein Produkt zu seiner Blankware-Produktfamilie auf (oder null, wenn das
 * Produkt keiner verkaufsrelevanten Familie zugeordnet ist – z. B. Coming-soon-
 * Artikel ohne belegte Blankware).
 */
export const getProductFamily = (product) => {
  const id = FAMILY_BY_VARIANT_GROUP[product.variantGroup]
  return id ? PRODUCT_FAMILIES[id] : null
}
