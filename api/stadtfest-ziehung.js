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
  STADTFEST_SUPABASE_PUBLIC_KEY,
  TERMINAL_SUPABASE_URL,
  TERMINAL_SUPABASE_SERVICE_KEY,
} = process.env

const SUPABASE_URL = STADTFEST_SUPABASE_URL || TERMINAL_SUPABASE_URL
const SUPABASE_KEY =
  STADTFEST_SUPABASE_SERVICE_KEY
  || TERMINAL_SUPABASE_SERVICE_KEY
  || STADTFEST_SUPABASE_PUBLIC_KEY

const EVENT_ID = 'wuerzburger-stadtfest-2026'

function konfiguriert() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY)
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

  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('Pragma', 'no-cache')

  if (!konfiguriert()) {
    res.status(503).json({ ok: false, meldung: 'Die Live-Ziehung ist gerade nicht erreichbar.' })
    return
  }

  try {
    const companyId = STADTFEST_COMPANY_ID || null
    const rpc = companyId ? 'stadtfest_live_public' : 'stadtfest_live_public_read'
    const body = companyId
      ? { p_company_id: companyId, p_event_id: EVENT_ID }
      : {}

    const antwort = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpc}`, {
      method: 'POST',
      headers: {
        ...kopfzeilen(),
      },
      body: JSON.stringify(body),
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
