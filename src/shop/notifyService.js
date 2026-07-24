/**
 * Service-Abstraktion für „Benachrichtige mich".
 *
 * Kapselt den Aufruf des /api/notify-Endpoints. Die UI kennt nur die drei
 * Ergebniszustände und muss nichts über das Backend wissen. So lässt sich der
 * Endpoint später gegen ein anderes Backend tauschen, ohne die Komponenten zu
 * ändern.
 *
 * Rückgabe-Status:
 *  - 'success'        – Vormerkung gespeichert und/oder Mail verschickt
 *  - 'not_configured' – Endpoint erreichbar, aber kein Backend angebunden
 *                       (kein Fake-Erfolg – die UI meldet das ehrlich)
 *  - 'error'          – ungültige Eingabe oder technischer Fehler
 *
 * Benötigte ENV (serverseitig, siehe docs/environment-setup.md):
 *  - SUPABASE_URL, SUPABASE_SERVICE_KEY   (Speicherung in Tabelle videko_notify)
 *  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_TO  (Bestätigungsmails)
 */

const ENDPOINT = '/api/notify'

/**
 * @param {{ productId:string, productName:string, variant?:string, email:string }} payload
 * @returns {Promise<{ status:'success'|'not_configured'|'error', detail?:object }>}
 */
export async function requestNotify(payload) {
  const email = String(payload.email || '').trim()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: 'error', detail: { reason: 'invalid-email' } }
  }
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        productId: payload.productId,
        productName: payload.productName,
        variant: payload.variant || '',
      }),
    })
    // Lokal (Vite ohne Serverless) liefert der Aufruf HTML/404 statt JSON.
    const data = await res.json().catch(() => null)
    if (data && data.ok) return { status: 'success', detail: data }
    if (data && data.configured === false) return { status: 'not_configured', detail: data }
    // Endpoint nicht erreichbar oder unerwartete Antwort → ehrlich „nicht angebunden"
    if (!res.ok || !data) return { status: 'not_configured', detail: { reason: 'endpoint-unavailable' } }
    return { status: 'error', detail: data }
  } catch {
    // Netzwerk-/Parsefehler: lokal ohne API meist der Fall
    return { status: 'not_configured', detail: { reason: 'endpoint-unreachable' } }
  }
}

/**
 * „Interesse"-Signal: wird ausgeloest, SOBALD jemand auf „Benachrichtige mich"
 * klickt – noch bevor eine E-Mail eingetragen wird. So erfaehrt das Team von
 * jedem Interessenten, auch wenn das Formular nicht abgeschickt wird.
 *
 * Bewusst „fire-and-forget": kein UI-Feedback, keine Fehleranzeige. Lokal ohne
 * angebundenes Backend passiert schlicht nichts (kein Fake-Erfolg). Sobald der
 * /api/notify-Endpoint live ist, verarbeitet er `event: 'interest'` und
 * benachrichtigt das Team.
 */
export function pingInterest(payload) {
  try {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        event: 'interest',
        productId: payload.productId,
        productName: payload.productName,
        variant: payload.variant || '',
      }),
    }).catch(() => {})
  } catch {
    /* lokal ohne API – bewusst ignoriert */
  }
}
