/**
 * Zentrale Preis- und Aktionslogik für die aktiv anfragbaren Launch-Linien.
 *
 * ------------------------------------------------------------------------
 * RECHTLICHER RAHMEN (Preisangaben)
 * ------------------------------------------------------------------------
 * Je Aktionslinie (`OPENING_LINES`):
 * - `currentPrice`  = aktuell verlangter Gesamtpreis (Launch-Preis), inkl. der
 *   zutreffenden gesetzlichen Umsatzsteuer. In Cent.
 * - `referencePrice` = regulärer Preis (Standardpreis) NACH dem Launch.
 * - `lowestPriceLast30Days` = niedrigster tatsächlich verlangter Gesamtpreis der
 *   letzten 30 Tage. NUR belegbare Werte eintragen (§ 11 PAngV). Solange der Shop
 *   neu ist und der reguläre Preis noch nie tatsächlich verlangt wurde, bleibt
 *   dieser Wert `null` und es wird KEIN Preisverlauf erfunden.
 *
 * WICHTIG – der reguläre Preis ist (noch) KEIN nachgewiesener vorheriger
 * Verkaufspreis:
 *   -> `promotionType: 'opening'` (Launch-Preis).
 *   -> Der reguläre Preis wird durchgestrichen dargestellt und ehrlich als
 *      *regulärer Preis (nach dem Launch)* benannt – NICHT als „statt" oder
 *      vorheriger Verkaufspreis. Es wird bewusst KEIN Prozentrabatt und KEIN
 *      erfundener 30-Tage-Tiefstpreis ausgewiesen; der aktuelle Preis trägt
 *      zusätzlich das Badge „LAUNCH-PREIS". Der Streichpreis kennzeichnet damit
 *      nur den regulären Normalpreis, kein Rabattversprechen.
 *   -> Erst wenn der reguläre Preis nachweislich als tatsächlicher Verkaufspreis
 *      verlangt wurde, darf `promotionType` auf `'reference'` gestellt und
 *      `lowestPriceLast30Days` belastbar gefüllt werden. Dann (und nur dann) ist
 *      eine durchgestrichene Darstellung mit korrektem 30-Tage-Tiefstpreis zulässig.
 *
 * ------------------------------------------------------------------------
 * LAUNCH-KONTINGENT / COUNTDOWN
 * ------------------------------------------------------------------------
 * Der Launch-Preis gilt für die ersten `openingStock` (100) Stück je Linie. Auf
 * der Seite läuft ein Countdown der noch zum Launch-Preis verfügbaren Stücke. Er
 * startet bei `openingStock − alreadyTaken` und nimmt pro Tag genau `dailyDrop`
 * (3) Stück ab (gleicher Wert für alle Besucher am selben Tag, kein Zufall pro
 * Reload). Ist das Kontingent aufgebraucht, greift automatisch der reguläre Preis.
 *
 * Alle Beträge intern in Cent.
 */

const euroToCent = (euro) => (euro == null ? null : Math.round(euro * 100))

/** Launch-Kontingent: erste 100 Stück je Linie zum Launch-Preis. */
export const OPENING_STOCK = 100

/** Fester Tages-Abzug: der Zähler nimmt jeden Tag genau 3 Stück ab. */
export const DAILY_DROP = 3

/** Optionaler Zusatz „Nur für kurze Zeit" – nur wenn wirklich zeitlich begrenzt. */
export const SHOW_LIMITED_TIME_HINT = false

/**
 * >>> ZENTRALE PREISKONFIGURATION JE LINIE <<<
 * Fehlende/nicht belegte Werte bleiben `null` – nichts erfinden.
 *
 * `alreadyTaken` = bereits zum Start vergriffene Stücke des Kontingents. Der
 * sichtbare Zähler startet dadurch nicht bei 100, sondern bei
 * `OPENING_STOCK − alreadyTaken` und zählt von dort täglich um `dailyDrop` weiter
 * runter (signature: 100 − 5 = 95; pure/one: 100 − 7 = 93).
 */
export const OPENING_LINES = {
  signature: {
    currentPrice: euroToCent(4.99), // Launch-Preis (Gesamtpreis inkl. USt.)
    referencePrice: euroToCent(12.99), // regulärer Preis nach dem Launch
    lowestPriceLast30Days: null, // kein belegter 30-Tage-Tiefstpreis (Shop neu)
    promotionType: 'opening', // 'reference' erst bei belegtem Vorpreis
    promotionStart: '2026-07-26', // fester Kalendertag – kein dynamisches Datum
    promotionEnd: null, // endet, wenn das Launch-Kontingent aufgebraucht ist
    openingStock: OPENING_STOCK,
    alreadyTaken: 5, // sichtbarer Start: 100 − 5 = 95
    dailyDrop: DAILY_DROP,
  },
  pure: {
    currentPrice: euroToCent(5.99),
    referencePrice: euroToCent(13.99),
    lowestPriceLast30Days: null,
    promotionType: 'opening',
    promotionStart: '2026-07-26',
    promotionEnd: null,
    openingStock: OPENING_STOCK,
    alreadyTaken: 7, // sichtbarer Start: 100 − 7 = 93
    dailyDrop: DAILY_DROP,
  },
  one: {
    currentPrice: euroToCent(5.99),
    referencePrice: euroToCent(13.99),
    lowestPriceLast30Days: null,
    promotionType: 'opening',
    promotionStart: '2026-07-26',
    promotionEnd: null,
    openingStock: OPENING_STOCK,
    alreadyTaken: 3, // sichtbarer Start: 100 − 3 = 97
    dailyDrop: DAILY_DROP,
  },
}

/** Rückwärtskompatibler Zugriff auf die Signature-Konfiguration. */
export const SIGNATURE_PRICING = OPENING_LINES.signature

/** Konfiguration einer Linie holen (Fallback: Signature). `null` bei Unbekannt. */
function lineConfig(line) {
  return OPENING_LINES[line] || null
}

/** Ganze Tage seit Aktionsbeginn der Linie (0 am Starttag, nie negativ). */
function daysSinceStart(cfg, now = new Date()) {
  const start = Date.parse(`${cfg.promotionStart}T00:00:00+02:00`)
  if (Number.isNaN(start)) return 0
  const diff = now.getTime() - start
  return Math.max(0, Math.floor(diff / 86_400_000))
}

/**
 * Noch zum Launch-Preis verfügbare Stücke (Countdown). Startet bei
 * `openingStock − alreadyTaken` und sinkt täglich um genau `dailyDrop`, min. 0.
 */
export function openingRemaining(line = 'signature', now = new Date()) {
  const cfg = lineConfig(line)
  if (!cfg) return 0
  const days = daysSinceStart(cfg, now)
  const sold = cfg.alreadyTaken + days * cfg.dailyDrop
  return Math.max(0, cfg.openingStock - sold)
}

/** Läuft der Launch der Linie noch (Kontingent > 0 und – falls gesetzt – im Zeitfenster)? */
export function openingActive(line = 'signature', now = new Date()) {
  const cfg = lineConfig(line)
  if (!cfg || cfg.promotionType !== 'opening') return false
  if (openingRemaining(line, now) <= 0) return false
  if (cfg.promotionEnd) {
    const end = Date.parse(`${cfg.promotionEnd}T23:59:59+02:00`)
    if (!Number.isNaN(end) && now.getTime() > end) return false
  }
  return true
}

/**
 * Aktuell gültiger Gesamtpreis (Cent) der Linie. Während des Launches der
 * Launch-Preis, danach der reguläre Preis.
 */
export function activeUnitPrice(line = 'signature', now = new Date()) {
  const cfg = lineConfig(line)
  if (!cfg) return null
  return openingActive(line, now) ? cfg.currentPrice : cfg.referencePrice
}

/**
 * Gebündelte Preisdarstellung für die UI. Bewusst OHNE erfundene Angaben:
 *   - strikePrice/percent nur bei promotionType 'reference' UND belegtem
 *     30-Tage-Tiefstpreis.
 *   - regularPrice: regulärer Preis nach dem Launch (kein „statt"-Preis).
 */
export function priceView(line = 'signature', now = new Date()) {
  const cfg = lineConfig(line)
  if (!cfg) return null
  const opening = openingActive(line, now)
  const isReference = cfg.promotionType === 'reference' && cfg.lowestPriceLast30Days != null
  return {
    line,
    price: activeUnitPrice(line, now), // aktuell gültiger Preis (Cent)
    opening, // Launch aktiv?
    badge: opening && !isReference ? 'LAUNCH-PREIS' : null,
    regularPrice: cfg.referencePrice, // regulärer Preis (Cent)
    // Regulären Normalpreis während des Launches durchgestrichen anzeigen –
    // ehrlich als regulärer Preis, ohne %-Angabe / ohne „statt".
    showRegularStrike: opening,
    // Streichpreis + %-Ersparnis NUR, wenn der reguläre Preis nachweislich vorher
    // verlangt wurde (promotionType 'reference'); sonst bewusst null.
    strikePrice: opening && isReference ? cfg.referencePrice : null,
    lowestPriceLast30Days: isReference ? cfg.lowestPriceLast30Days : null,
    remaining: opening ? openingRemaining(line, now) : 0,
    openingStock: cfg.openingStock,
    showLimitedTimeHint: opening && SHOW_LIMITED_TIME_HINT,
  }
}
