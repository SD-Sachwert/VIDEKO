/**
 * Oeffentlicher, streng sanitierter Lesekanal fuer die Stadtfest-Live-Ziehung.
 *
 * Die Website spricht NICHT direkt mit Supabase. Der Service-Key bleibt nur
 * auf dem Server. Zurueck kommen ausschliesslich Lostopf-Groessen, Preisstatus
 * und bereits aufgedeckte Gewinner in der Form "Vorname N." + Teilnahme-Code.
 *
 * Der aktuelle Gewinner bleibt fuer die ersten 15 Sekunden nach dem Start
 * verborgen. Danach gibt die sanitierte DB-Funktion ihn automatisch frei.
 */
const {
  STADTFEST_SUPABASE_URL,
  STADTFEST_SUPABASE_SERVICE_KEY,
  STADTFEST_COMPANY_ID,
  TERMINAL_SUPABASE_URL,
  TERMINAL_SUPABASE_SERVICE_KEY,
} = process.env

const SUPABASE_URL = STADTFEST_SUPABASE_URL || TERMINAL_SUPABASE_URL
const SUPABASE_KEY =
  STADTFEST_SUPABASE_SERVICE_KEY
  || TERMINAL_SUPABASE_SERVICE_KEY

const EVENT_ID = 'wuerzburger-stadtfest-2026'

function konfiguriert() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY && STADTFEST_COMPANY_ID)
}

function kopfzeilen(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ ok: false, meldung: 'Nur GET.' })
    return
  }

  // Browser immer frisch, Vercel-CDN darf denselben Live-Stand für maximal
  // eine Sekunde teilen. So erzeugen 200 Zuschauer nicht 200 identische
  // Supabase-Abfragen pro Poll-Takt.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1, stale-while-revalidate=1')

  if (!konfiguriert()) {
    res.status(503).json({ ok: false, meldung: 'Die Live-Ziehung ist gerade nicht erreichbar.' })
    return
  }

  try {
    const antwort = await fetch(`${SUPABASE_URL}/rest/v1/rpc/stadtfest_live_public`, {
      method: 'POST',
      headers: {
        ...kopfzeilen(),
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
