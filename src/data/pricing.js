/**
 * Zentrale Preis- und Aktionslogik für die aktiv anfragbaren Signature-Shirts.
 *
 * ------------------------------------------------------------------------
 * RECHTLICHER RAHMEN (Preisangaben)
 * ------------------------------------------------------------------------
 * - `currentPrice`  = aktuell verlangter Gesamtpreis (Eröffnungspreis), inkl.
 *   der zutreffenden gesetzlichen Umsatzsteuer. In Cent.
 * - `referencePrice` = regulärer Preis (Standardpreis) NACH der Eröffnung.
 * - `lowestPriceLast30Days` = niedrigster tatsächlich verlangter Gesamtpreis der
 *   letzten 30 Tage. NUR belegbare Werte eintragen (§ 11 PAngV). Solange der Shop
 *   neu ist und 17,99 € noch nie tatsächlich verlangt wurde, bleibt dieser Wert
 *   `null` und es wird KEIN Preisverlauf erfunden.
 *
 * WICHTIG – 17,99 € ist (noch) KEIN nachgewiesener vorheriger Verkaufspreis:
 *   -> `promotionType: 'opening'` (Eröffnungspreis).
 *   -> Der reguläre Preis 17,99 € wird NICHT durchgestrichen, es wird KEIN
 *      Prozentrabatt und KEIN „statt 17,99 €" ausgewiesen. Stattdessen trägt der
 *      Preis das auffällige Badge „ERÖFFNUNGSPREIS" und 17,99 € wird ehrlich als
 *      *regulärer Preis nach der Eröffnung* benannt (zukünftiger, nicht
 *      vorheriger Preis).
 *   -> Erst wenn 17,99 € nachweislich als tatsächlicher Verkaufspreis verlangt
 *      wurde, darf `promotionType` auf `'reference'` gestellt und
 *      `lowestPriceLast30Days` belastbar gefüllt werden. Dann (und nur dann) ist
 *      eine durchgestrichene Darstellung mit korrektem 30-Tage-Tiefstpreis zulässig.
 *
 * ------------------------------------------------------------------------
 * ERÖFFNUNGSKONTINGENT / COUNTDOWN
 * ------------------------------------------------------------------------
 * Der Eröffnungspreis gilt für die ersten `OPENING_STOCK` (100) Shirts. Auf der
 * Seite läuft ein Countdown der noch zum Eröffnungspreis verfügbaren Stücke. Er
 * startet bei 100 und nimmt pro Tag deterministisch 1–3 Stück ab (gleicher Wert
 * für alle Besucher am selben Tag, kein Zufall pro Reload). Ist das Kontingent
 * aufgebraucht, greift automatisch der reguläre Preis.
 *
 * Alle Beträge intern in Cent.
 */

const euroToCent = (euro) => (euro == null ? null : Math.round(euro * 100))

/**
 * >>> ZENTRALE PREISKONFIGURATION <<<
 * Fehlende/nicht belegte Werte bleiben `null` – nichts erfinden.
 */
export const SIGNATURE_PRICING = {
  currentPrice: euroToCent(4.99), // Eröffnungspreis (Gesamtpreis inkl. USt.)
  referencePrice: euroToCent(17.99), // regulärer Preis nach der Eröffnung
  // Kein belegter 30-Tage-Tiefstpreis (Shop neu, 17,99 € noch nie verlangt).
  lowestPriceLast30Days: null,
  // 'opening' = Eröffnungspreis-Badge (kein Streichpreis). 'reference' erst,
  // wenn 17,99 € nachweislich vorher verlangt wurde.
  promotionType: 'opening',
  // Aktionsbeginn (Eröffnung). Fester Kalendertag – kein dynamisches Datum.
  promotionStart: '2026-07-25',
  // Kein festes Enddatum: Die Aktion endet, wenn das Eröffnungskontingent
  // (OPENING_STOCK) aufgebraucht ist. Nur setzen, wenn zeitlich klar begrenzt.
  promotionEnd: null,
}

/** Eröffnungskontingent: erste 100 Shirts zum Eröffnungspreis. */
export const OPENING_STOCK = 100

/** Optionaler Zusatz „Nur für kurze Zeit" – nur wenn wirklich zeitlich begrenzt. */
export const SHOW_LIMITED_TIME_HINT = false

/**
 * Deterministischer Tages-Abzug 1–3 anhand des Tagesindex. Gleicher Tag ⇒
 * gleicher Wert für alle Besucher; wirkt organisch, ohne echten Zufall.
 */
function dailyDrop(dayIndex) {
  let x = Math.sin((dayIndex + 1) * 12.9898) * 43758.5453
  x = x - Math.floor(x) // 0..1
  return 1 + Math.floor(x * 3) // 1..3
}

/** Ganze Tage seit Aktionsbeginn (0 am Starttag, nie negativ). */
function daysSinceStart(now = new Date()) {
  const start = Date.parse(`${SIGNATURE_PRICING.promotionStart}T00:00:00+02:00`)
  if (Number.isNaN(start)) return 0
  const diff = now.getTime() - start
  return Math.max(0, Math.floor(diff / 86_400_000))
}

/**
 * Noch zum Eröffnungspreis verfügbare Stücke (Countdown). Startet bei
 * OPENING_STOCK und sinkt täglich deterministisch um 1–3, min. 0.
 */
export function openingRemaining(now = new Date()) {
  const days = daysSinceStart(now)
  let sold = 0
  for (let d = 0; d < days; d++) {
    sold += dailyDrop(d)
    if (sold >= OPENING_STOCK) return 0
  }
  return Math.max(0, OPENING_STOCK - sold)
}

/** Läuft die Eröffnungsaktion noch (Kontingent > 0 und – falls gesetzt – im Zeitfenster)? */
export function openingActive(now = new Date()) {
  if (SIGNATURE_PRICING.promotionType !== 'opening') return false
  if (openingRemaining(now) <= 0) return false
  if (SIGNATURE_PRICING.promotionEnd) {
    const end = Date.parse(`${SIGNATURE_PRICING.promotionEnd}T23:59:59+02:00`)
    if (!Number.isNaN(end) && now.getTime() > end) return false
  }
  return true
}

/**
 * Aktuell gültiger Gesamtpreis (Cent). Während der Eröffnungsaktion der
 * Eröffnungspreis, danach der reguläre Preis.
 */
export function activeUnitPrice(now = new Date()) {
  return openingActive(now) ? SIGNATURE_PRICING.currentPrice : SIGNATURE_PRICING.referencePrice
}

/**
 * Gebündelte Preisdarstellung für die UI. Bewusst OHNE erfundene Angaben:
 *   - showStrike/percent nur bei promotionType 'reference' UND belegtem
 *     30-Tage-Tiefstpreis.
 *   - regularAfterOpening: 17,99 € als *regulärer Preis nach der Eröffnung*
 *     (kein Streichpreis).
 */
export function priceView(now = new Date()) {
  const opening = openingActive(now)
  const isReference = SIGNATURE_PRICING.promotionType === 'reference'
    && SIGNATURE_PRICING.lowestPriceLast30Days != null
  return {
    price: activeUnitPrice(now), // aktuell gültiger Preis (Cent)
    opening, // Eröffnungsaktion aktiv?
    badge: opening && !isReference ? 'ERÖFFNUNGSPREIS' : null,
    regularPrice: SIGNATURE_PRICING.referencePrice, // 17,99 € (Cent)
    // Streichpreis + %-Ersparnis NUR, wenn 17,99 € nachweislich vorher verlangt
    // wurde (promotionType 'reference'); sonst bewusst null.
    strikePrice: opening && isReference ? SIGNATURE_PRICING.referencePrice : null,
    lowestPriceLast30Days: isReference ? SIGNATURE_PRICING.lowestPriceLast30Days : null,
    remaining: opening ? openingRemaining(now) : 0,
    openingStock: OPENING_STOCK,
    showLimitedTimeHint: opening && SHOW_LIMITED_TIME_HINT,
  }
}
