import { gleichSicher, konfiguriert, terminalGesperrt } from './_terminal-kern.js'
import { instagramSynchronisieren } from './_terminal-instagram.js'

/**
 * Cron-Endpoint: holt stuendlich die Instagram-Followerzahl (vercel.json,
 * "crons").
 *
 * ZUGANG
 * ------
 * Vercel schickt beim Cron-Aufruf `Authorization: Bearer <CRON_SECRET>`. Nur
 * mit genau diesem Kopf laeuft etwas; verglichen wird in gleichbleibender
 * Laufzeit. Fehlt CRON_SECRET in der Umgebung, ist der Endpoint zu — kein
 * „erstmal offen", sonst koennte jeder beliebig oft Instagram anfragen lassen.
 *
 * Die Antwort nennt hoechstens die Followerzahl (die steht ohnehin oeffentlich
 * im Terminal) und einen kurzen Grund. Nie Token, nie User-ID.
 *
 * Temporaer deaktiviert nach Stadtfest 2026. Fuer zukuenftiges VIDEKO
 * Community Game vorgesehen. Der Cron-Eintrag ist aus vercel.json genommen;
 * solange TERMINAL_PUBLIC_ENABLED nicht `true` ist, antwortet der Endpoint
 * ausserdem mit 404 und fragt Instagram nicht an. Token, User-ID und
 * CRON_SECRET bleiben in der Umgebung stehen.
 */

export default async function handler(req, res) {
  if (terminalGesperrt(res)) return

  /* Kein Zwischenspeicher: jeder Aufruf ist ein echter Lauf. */
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ ok: false, grund: 'methode' })
    return
  }

  const secret = String(process.env.CRON_SECRET ?? '')
  if (!secret) {
    res.status(503).json({ ok: false, grund: 'nicht-eingerichtet' })
    return
  }

  const kopf = String(req.headers?.authorization ?? '')
  if (!kopf || !gleichSicher(`Bearer ${secret}`, kopf)) {
    res.status(401).json({ ok: false, grund: 'zugang' })
    return
  }

  if (!konfiguriert()) {
    res.status(503).json({ ok: false, grund: 'server' })
    return
  }

  const ergebnis = await instagramSynchronisieren()
  res.status(ergebnis.ok ? 200 : 502).json({
    ok: ergebnis.ok,
    ...(ergebnis.ok ? { wert: ergebnis.wert } : { grund: ergebnis.grund }),
    ...(ergebnis.hinweis ? { hinweis: ergebnis.hinweis } : {}),
  })
}
