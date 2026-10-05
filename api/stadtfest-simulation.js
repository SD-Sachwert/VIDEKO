import crypto from 'node:crypto'

const {
  STADTFEST_SUPABASE_URL,
  STADTFEST_SUPABASE_SERVICE_KEY,
  STADTFEST_COMPANY_ID,
  TERMINAL_SUPABASE_URL,
  TERMINAL_SUPABASE_SERVICE_KEY,
  STADTFEST_SIMULATION_SESSION_SECRET = '',
} = process.env

const SUPABASE_URL = STADTFEST_SUPABASE_URL || TERMINAL_SUPABASE_URL
const SUPABASE_KEY = STADTFEST_SUPABASE_SERVICE_KEY || TERMINAL_SUPABASE_SERVICE_KEY
const EVENT_ID = 'wuerzburger-stadtfest-2026-simulation'
const TABELLE = 'stadtfest_simulation_regie'
const DRAW_MS = 15000

function konfiguriert() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY && STADTFEST_COMPANY_ID)
}

function headers(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function gleichSicher(a, b) {
  const links = Buffer.from(String(a || ''))
  const rechts = Buffer.from(String(b || ''))
  if (!links.length || links.length !== rechts.length) return false
  return crypto.timingSafeEqual(links, rechts)
}

function cookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || '')
      .split(';')
      .map((teil) => teil.trim())
      .filter(Boolean)
      .map((teil) => {
        const index = teil.indexOf('=')
        return index < 0 ? [teil, ''] : [teil.slice(0, index), decodeURIComponent(teil.slice(index + 1))]
      }),
  )
}

function angemeldet(req) {
  const mitgebracht = cookies(req).stadtfest_sim_control || ''
  return Boolean(
    STADTFEST_SIMULATION_SESSION_SECRET
    && mitgebracht
    && gleichSicher(STADTFEST_SIMULATION_SESSION_SECRET, mitgebracht)
  )
}

async function lesen() {
  const params = new URLSearchParams({
    select: 'schritt,updated_at',
    company_id: `eq.${STADTFEST_COMPANY_ID}`,
    event_id: `eq.${EVENT_ID}`,
    limit: '1',
  })
  const antwort = await fetch(`${SUPABASE_URL}/rest/v1/${TABELLE}?${params}`, {
    headers: headers(),
    cache: 'no-store',
  })
  if (!antwort.ok) throw new Error('Regiezustand konnte nicht gelesen werden.')
  const zeilen = await antwort.json()
  const zeile = zeilen?.[0]
  if (!zeile) throw new Error('Regiezustand fehlt.')
  return {
    schritt: Number(zeile.schritt || 0),
    updatedAt: zeile.updated_at,
    serverNow: new Date().toISOString(),
  }
}

function istZiehphase(schritt) {
  const n = Number(schritt)
  return (n >= 1 && n <= 17 && n % 2 === 1)
    || (n >= 20 && n <= 50 && n % 2 === 0)
}

async function schreiben(schritt) {
  const params = new URLSearchParams({
    company_id: `eq.${STADTFEST_COMPANY_ID}`,
    event_id: `eq.${EVENT_ID}`,
  })
  const jetzt = new Date().toISOString()
  const antwort = await fetch(`${SUPABASE_URL}/rest/v1/${TABELLE}?${params}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify({ schritt, updated_at: jetzt }),
  })
  if (!antwort.ok) throw new Error('Regiezustand konnte nicht gespeichert werden.')
  const zeilen = await antwort.json()
  const zeile = zeilen?.[0]
  if (!zeile) throw new Error('Regiezustand wurde nicht gespeichert.')
  return {
    schritt: Number(zeile.schritt || 0),
    updatedAt: zeile.updated_at,
    serverNow: new Date().toISOString(),
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  if (!konfiguriert()) {
    res.status(503).json({ ok: false, meldung: 'Die Simulations-Regie ist gerade nicht erreichbar.' })
    return
  }

  try {
    if (req.method === 'GET') {
      let stand = await lesen()

      if (istZiehphase(stand.schritt)) {
        const gestartet = Date.parse(stand.updatedAt)
        const abgelaufen = Number.isFinite(gestartet) && Date.now() - gestartet >= DRAW_MS
        if (abgelaufen) {
          stand = await schreiben(stand.schritt + 1)
        }
      }

      res.status(200).json({ ok: true, ...stand })
      return
    }

    if (req.method === 'POST') {
      if (!angemeldet(req)) {
        res.status(401).json({ ok: false, meldung: 'Regie-Zugang fehlt.' })
        return
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})

      const schritt = Number(body.schritt)
      if (!Number.isInteger(schritt) || schritt < 0 || schritt > 100) {
        res.status(400).json({ ok: false, meldung: 'Ungültiger Simulationsschritt.' })
        return
      }

      res.status(200).json({ ok: true, ...(await schreiben(schritt)) })
      return
    }

    res.setHeader('Allow', 'GET, POST')
    res.status(405).json({ ok: false, meldung: 'Nur GET und POST.' })
  } catch (error) {
    res.status(502).json({
      ok: false,
      meldung: error instanceof Error ? error.message : 'Die Simulations-Regie ist nicht erreichbar.',
    })
  }
}
