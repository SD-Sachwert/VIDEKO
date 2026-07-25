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
 * GRUNDREGEL: Hier werden KEINE Pflichtangaben erfunden. Was nicht sicher
 * bekannt ist, bleibt `null` und wird über den `status`/die Prüf-Skripte als
 * unvollständig ausgewiesen. Bekannte, aus Impressum/Handelsregister belegte
 * Unternehmensdaten sind übernommen.
 */

/**
 * Verantwortlicher Wirtschaftsakteur i. S. d. GPSR (Art. 16) und
 * verantwortliches Unternehmen für die Textilkennzeichnung.
 * Quelle: Impressum (VIDEKO Küchen eG, Würzburg).
 */
export const RESPONSIBLE_OPERATOR = {
  companyName: 'VIDEKO Küchen eG',
  street: 'Hertzstraße 4',
  postalCode: '97076',
  city: 'Würzburg',
  country: 'Deutschland',
  email: 'info@videko-kuechen.de',
  phone: '0160 5545818',
  brand: 'VIDEKO',
  // GPSR Art. 16: Wird ein Produkt aus einem Nicht-EU-Land bezogen, muss ein in
  // der EU niedergelassener Wirtschaftsakteur (Hersteller, Importeur, Bevoll-
  // mächtigter oder Fulfilment-Dienstleister) benannt sein. Ob VIDEKO diese
  // Rolle vollständig ausfüllt oder ein separater Hersteller/Importeur zu nennen
  // ist, hängt von der je Produkt noch zu bestätigenden Lieferkette ab.
  operatorRoleConfirmed: false, // TODO extern klären (siehe docs/compliance)
}

/**
 * Herkunftsland je Produkt bzw. Produktfamilie. BEWUSST leer: die tatsächliche
 * Fertigungsherkunft der Blankware (Lieferant) ist noch nicht bestätigt.
 * Sobald belegt, hier per Produkt-`id` oder `variantGroup` eintragen
 * (z. B. 'signature-tee': 'Bangladesch'). `publicCompliance()` gibt null zurück,
 * solange nichts eingetragen ist – es wird KEIN Land geraten.
 *
 * WICHTIG: Eine Herkunftsangabe ist für Textilien in der EU KEINE generelle
 * Pflicht. Sie wird hier nur intern erfasst und angezeigt, sobald bekannt. Ein
 * fehlendes Herkunftsland ist daher KEIN Compliance-Blocker (siehe
 * scripts/check-products.mjs) – es sei denn, im Einzelfall besteht eine konkrete
 * Kennzeichnungspflicht oder es wurde bereits eine Herkunft ausgelobt.
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
    material: product.material || null, // z. B. "80 % Baumwolle, 20 % Polyester"
    care: product.care || null,
    countryOfOrigin: COUNTRY_OF_ORIGIN[originKey] ?? null,
    manufacturer: RESPONSIBLE_OPERATOR,
    // Warn-/Sicherheitshinweise: bei normaler Bekleidung i. d. R. keine; bei
    // Produkten mit Kleinteilen/Kordeln (z. B. Hoodie-Kordel) prüfen -> intern.
    safetyNotice: SAFETY_NOTICE[product.productType] ?? null,
  }
}

/**
 * Produktbezogene Warn-/Sicherheitshinweise für die Produktseite. Nur eintragen,
 * was zutrifft und belegt ist. Leer = kein Hinweis erforderlich/bekannt.
 */
export const SAFETY_NOTICE = {
  // 'hoodie': 'Kordelzug – nicht für Kleinkinder geeignet.', // Beispiel, erst nach Prüfung
}

/**
 * Vorlage für die INTERNE GPSR-/Produktakte je Produktfamilie. Alle Felder
 * null = noch zu beschaffen. NICHT öffentlich. Wird von check-products.mjs
 * gegen die tatsächlich vorhandenen Daten geprüft.
 */
export const INTERNAL_RECORD_TEMPLATE = {
  manufacturerName: null, // tatsächlicher Hersteller der Blankware
  manufacturerAddress: null,
  manufacturerEmail: null,
  supplier: null, // Lieferant/Großhändler
  productionPartner: null, // Veredelung/Druck (falls extern)
  productIdentification: null, // Modell-/Typbezeichnung der Blankware
  batchOrModelNumber: null, // Artikel-, Modell- oder Chargennummer
  materialProof: null, // Nachweis Materialzusammensetzung (Lieferantenerklärung/Etikett)
  technicalDocumentation: null, // Ablageort der technischen Unterlagen
  riskAnalysis: null, // Risikoanalyse je Produktfamilie (Dokumentverweis)
  qualityChecks: null, // Qualitätsprüfungen
  dateAddedToShop: null, // Datum der Aufnahme in den Shop (ISO)
  documentStore: 'docs/compliance/produktakten/', // Ablageordner
  complaints: [], // Beschwerden / Sicherheitsmeldungen
  recallStatus: 'kein Rückruf', // 'kein Rückruf' | 'in Prüfung' | 'Rückruf aktiv'
  complete: false,
}

/**
 * Interne Produktakten je Produktfamilie (Key = productType). Bewusst mit der
 * Vorlage vorbelegt (alle Nachweise offen). Sobald Nachweise vorliegen, hier
 * die Felder füllen und `complete: true` setzen.
 */
export const INTERNAL_RECORDS = {
  tshirt: { ...INTERNAL_RECORD_TEMPLATE },
  vneck: { ...INTERNAL_RECORD_TEMPLATE },
  polo: { ...INTERNAL_RECORD_TEMPLATE },
  hoodie: { ...INTERNAL_RECORD_TEMPLATE },
  crewneck: { ...INTERNAL_RECORD_TEMPLATE },
  sneaker: { ...INTERNAL_RECORD_TEMPLATE },
  accessory: { ...INTERNAL_RECORD_TEMPLATE },
  workwear: { ...INTERNAL_RECORD_TEMPLATE },
}

export const getInternalRecord = (product) =>
  INTERNAL_RECORDS[product.productType] || INTERNAL_RECORDS[
    product.category === 'Accessoires' ? 'accessory' : 'tshirt'
  ]
