/**
 * ZENTRALE FREIGABE-STUFEN für den VIDEKO-Merch-Bereich (Livegang-Audit, § 10).
 *
 * Die Website aktiviert IMMER nur die Funktionen der tatsächlich freigegebenen
 * Stufe. So kann eine höhere Stufe (z. B. aktive Anfrage) technisch vorbereitet
 * sein, ohne öffentlich schon zu greifen. Das Höherschalten ist bewusst eine
 * EINZEILIGE Änderung (`RELEASE_STAGE`), damit keine verstreuten Flags vergessen
 * werden.
 *
 * Stufenleiter (aufsteigend):
 *   'preview'  – Öffentliche Produktvorschau. Korrektes Impressum, faktisch
 *                korrekte Datenschutz-Rohfassung, keine unnötige Verarbeitung,
 *                funktionierende Rechtslinks, KEIN Kauf, KEIN Anfrage-Button.
 *   'inquiry'  – Zusätzlich: unverbindlicher E-Mail-Anfrage-Button (nur für
 *                Produkte mit vollständigen, bestätigten Pflichtangaben und
 *                bestätigtem Material – siehe canInquire/materialConfirmed).
 *   'sale'     – Zusätzlich: konkretes Angebot per E-Mail (Widerruf, Muster-
 *                Widerrufsformular, USt-Status, Produktakte). Nicht Teil der
 *                Website-Automatik – rein manueller Prozess.
 *   'shipping' – Zusätzlich: Versand (LUCID/VerpackG, Versand-/Rücksendeprozess).
 *
 * AKTUELLE FREIGABE: 'preview'.
 * Begründung: Die konkrete SOL'S-Imperial-Bestellung (Farbcode, Rechnung,
 * Etikett) ist noch nicht belegt (compliance.js → colorsInUse.confirmedByInvoice
 * = false). Nach § 9 der Vorgabe bleibt der Anfrage-Button gesperrt, bis das
 * Material anhand echter Lieferantenangaben bestätigt ist. Sobald der Beleg
 * vorliegt und in compliance.js eingetragen ist, genügt hier die Umstellung auf
 * 'inquiry', um die unverbindliche Anfrage zu aktivieren.
 */
import { getProductFamily } from './compliance.js'

const STAGES = ['preview', 'inquiry', 'sale', 'shipping']

export const RELEASE_STAGE = 'preview'

const stageIndex = STAGES.indexOf(RELEASE_STAGE)

/** Öffentliche Produktvorschau freigegeben. */
export const previewReady = stageIndex >= 0
/** Unverbindliche E-Mail-Anfrage grundsätzlich freigegeben. */
export const inquiryReady = stageIndex >= 1
/** Konkretes Angebot / Verkauf per E-Mail freigegeben. */
export const saleReady = stageIndex >= 2
/** Versand freigegeben. */
export const shippingReady = stageIndex >= 3

/**
 * Ist die Materialzusammensetzung des Produkts durch einen echten Beleg
 * (Lieferantenrechnung/Etikett) bestätigt? Nur dann darf sie als Tatsache
 * öffentlich stehen und nur dann darf der Anfrage-Button erscheinen (§ 9).
 *
 * Produkte ohne verkaufsrelevante Blankware-Familie (reine Coming-soon-Vorschau)
 * liefern `false` – sie sind ohnehin nicht anfragbar.
 */
export function materialConfirmed(product) {
  const fam = getProductFamily(product)
  if (!fam) return false
  const colors = fam.colorsInUse || []
  return colors.length > 0 && colors.every((c) => c.confirmedByInvoice === true)
}

/**
 * Darf für dieses Produkt ein unverbindlicher Anfrage-Button gezeigt werden?
 * Voraussetzung: Stufe ≥ 'inquiry' UND Produkt ist bestellbar (nicht coming-soon)
 * UND das Material ist belegt. Andernfalls bleibt es bei der reinen Vorschau.
 */
export function canInquire(product) {
  if (!inquiryReady) return false
  if (!product || product.soon) return false
  return materialConfirmed(product)
}

/**
 * Einheitlicher Hinweistext für eine reine Produktvorschau ohne aktive Anfrage.
 * Nicht versteckt – bewusst sichtbar an der Aktionszeile.
 */
export const PREVIEW_NOTE =
  'Produktvorschau – die Darstellung kann vom fertig veredelten Produkt abweichen.'
