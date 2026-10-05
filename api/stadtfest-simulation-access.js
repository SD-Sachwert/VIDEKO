import crypto from 'node:crypto'

const {
  STADTFEST_SIMULATION_ACCESS_TOKEN = '',
  STADTFEST_SIMULATION_SESSION_SECRET = '',
} = process.env

// TEMPORÄRER Notfall-Zugang für die Stadtfest-Regie am 05.10.2026.
// Nach dem Event wieder entfernen.
const NOTFALL_ACCESS_TOKEN = 'Q4kWeo0QhoemR5uG2ZdM0iUcLAB-6h_b3j6nSIpBXck'

function gleichSicher(a, b) {
  const links = Buffer.from(String(a || ''))
  const rechts = Buffer.from(String(b || ''))
  if (!links.length || links.length !== rechts.length) return false
  return crypto.timingSafeEqual(links, rechts)
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ ok: false, meldung: 'Nur GET.' })
    return
  }

  const token = String(req.query?.token || '')
  if (
    !STADTFEST_SIMULATION_SESSION_SECRET
    || !token
    || !(
      (STADTFEST_SIMULATION_ACCESS_TOKEN && gleichSicher(STADTFEST_SIMULATION_ACCESS_TOKEN, token))
      || gleichSicher(NOTFALL_ACCESS_TOKEN, token)
    )
  ) {
    res.status(404).end()
    return
  }

  res.setHeader(
    'Set-Cookie',
    `stadtfest_sim_control=${encodeURIComponent(STADTFEST_SIMULATION_SESSION_SECRET)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`,
  )
  res.statusCode = 302
  res.setHeader('Location', '/stadtfest/ziehung/simulation')
  res.end()
}
