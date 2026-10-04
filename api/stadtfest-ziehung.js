/**
 * Oeffentlicher, streng sanitierter Lesekanal fuer die Stadtfest-Live-Ziehung.
 *
 * Die Website spricht NICHT direkt mit Supabase. Der Service-Key bleibt nur
 * auf dem Server. Zurueck kommen ausschliesslich Lostopf-Groessen, Preisstatus
 * und bereits aufgedeckte Gewinner in der Form "Vorname N." + Teilnahme-Code.
 *
 * Der aktuelle Gewinner bleibt waehrend status=spinning verborgen. Erst der
 * explizite Aufdecken-Schritt im Studio schaltet ihn fuer diese Route frei.
 */
const {
  STADTFEST_SUPABASE_URL,
  STADTFEST_SUPABASE_SERVICE_KEY,
  STADTFEST_COMPANY_ID,
} = process.env

const EVENT_ID = 'wuerzburger-stadtfest-2026'

function konfiguriert() {
  return Boolean(STADTFEST_SUPABASE_URL && STADTFEST_SUPABASE_SERVICE_KEY && STADTFEST_COMPANY_ID)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ ok: false, meldung: 'Nur GET.' })
    return
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('Pragma', 'no-cache')

  if (!konfiguriert()) {
    res.status(503).json({ ok: false, meldung: 'Die Live-Ziehung ist gerade nicht erreichbar.' })
    return
  }

  try {
    const antwort = await fetch(`${STADTFEST_SUPABASE_URL}/rest/v1/rpc/stadtfest_live_public`, {
      method: 'POST',
      headers: {
        apikey: STADTFEST_SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${STADTFEST_SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_company_id: STADTFEST_COMPANY_ID,
        p_event_id: EVENT_ID,
      }),
    })

    if (!antwort.ok) {
      res.status(502).json({ ok: false, meldung: 'Der Live-Stand konnte nicht geladen werden.' })
      return
    }

    const daten = await antwort.json()
    res.status(200).json({ ok: true, ...daten })
  } catch {
    res.status(502).json({ ok: false, meldung: 'Keine Verbindung zur Live-Ziehung.' })
  }
}
