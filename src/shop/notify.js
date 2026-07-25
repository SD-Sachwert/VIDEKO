/**
 * Client-Helfer für die Coming-soon-Funktionen (§ 6 Vormerkung / § 7 Interesse).
 *
 * Beide Aktionen sprechen denselben Serverless-Endpoint `/api/notify` an.
 *
 *  - subscribeNotify(): startet die Produktvormerkung mit Double-Opt-in.
 *    Es wird NUR eine Bestätigungs-E-Mail ausgelöst; die eigentliche Vormerkung
 *    entsteht erst nach Klick auf den Bestätigungslink.
 *  - sendInterest(): meldet ANONYMES Produktinteresse über den Herzbutton.
 *    Es werden keinerlei personenbezogene Daten übertragen (§ 7). Der Aufruf
 *    darf die UI nie blockieren und feuert pro Produkt nur EINMAL pro Browser
 *    (erste Aktivierung). Ein kleiner Cooldown dient als einfacher Bot-/Spam-Schutz.
 */

const ENDPOINT = '/api/notify'
const INTEREST_SENT_KEY = 'videko-interest-sent'
const INTEREST_COOLDOWN_KEY = 'videko-interest-cooldown'
const COOLDOWN_MS = 4000

const readList = (key) => {
  try {
    const raw = window.localStorage.getItem(key)
    const val = raw ? JSON.parse(raw) : []
    return Array.isArray(val) ? val : []
  } catch { return [] }
}
const writeList = (key, val) => {
  try { window.localStorage.setItem(key, JSON.stringify(val)) } catch { /* egal */ }
}

/** Wurde für dieses Produkt in diesem Browser bereits ein Interesse gemeldet? */
export function interestAlreadySent(productId) {
  return readList(INTEREST_SENT_KEY).includes(String(productId))
}

/**
 * Anonymes Produktinteresse melden (§ 7). Feuert höchstens einmal pro Produkt
 * und Browser und nur, wenn der Herzbutton AKTIVIERT (nicht deaktiviert) wird.
 * Überträgt bewusst keine personenbezogenen Daten. Fehler werden verschluckt.
 *
 * @returns {boolean} true, wenn ein Request abgeschickt wurde.
 */
export function sendInterest({ productName, productId, variant } = {}) {
  const id = String(productId || productName || '')
  if (!id) return false
  if (interestAlreadySent(id)) return false

  // einfacher clientseitiger Cooldown gegen versehentliches Mehrfachfeuern
  try {
    const last = Number(window.localStorage.getItem(INTEREST_COOLDOWN_KEY) || 0)
    const now = Date.now()
    if (last && now - last < COOLDOWN_MS) return false
    window.localStorage.setItem(INTEREST_COOLDOWN_KEY, String(now))
  } catch { /* egal */ }

  // Optimistisch als „gesendet" markieren, damit auch bei schnellem Toggeln
  // nicht mehrfach gefeuert wird. Bei hartem Fehler wird die Markierung wieder
  // entfernt, damit ein späterer Versuch erneut greifen kann.
  const sent = readList(INTEREST_SENT_KEY)
  writeList(INTEREST_SENT_KEY, [...sent, id])

  try {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'interest', productName, productId, variant, website: '' }),
      keepalive: true,
    }).catch(() => {
      writeList(INTEREST_SENT_KEY, readList(INTEREST_SENT_KEY).filter((x) => x !== id))
    })
  } catch {
    writeList(INTEREST_SENT_KEY, readList(INTEREST_SENT_KEY).filter((x) => x !== id))
    return false
  }
  return true
}

/**
 * Produktvormerkung starten (§ 6, Double-Opt-in). Löst nur die
 * Bestätigungs-E-Mail aus. Gibt die JSON-Antwort des Servers zurück.
 */
export async function subscribeNotify({ email, product, productId, variant, consent }) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'subscribe', email, product, productId, variant, consent, website: '' }),
  })
  let data = {}
  try { data = await res.json() } catch { /* leere Antwort */ }
  return { httpOk: res.ok, ...data }
}

/** Vormerkung über den Link aus der Bestätigungs-E-Mail final bestätigen. */
export async function confirmNotify(token) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'confirm', token }),
  })
  let data = {}
  try { data = await res.json() } catch { /* leere Antwort */ }
  return { httpOk: res.ok, ...data }
}

/**
 * Wortgleicher Einwilligungstext für die Produktvormerkung (§ 6). Wird 1:1 an
 * der Checkbox angezeigt UND serverseitig dokumentiert – daher zentral hier.
 */
export const NOTIFY_CONSENT_TEXT =
  'Ja, benachrichtigt mich einmalig per E-Mail, sobald dieses Produkt verfügbar ist. ' +
  'Meine E-Mail-Adresse wird ausschließlich für diese eine Benachrichtigung gespeichert ' +
  'und danach gelöscht. Es erfolgt kein Newsletter.'
