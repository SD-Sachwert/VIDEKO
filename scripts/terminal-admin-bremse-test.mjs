/**
 * Admin-Anmeldung: Bremse gegen Durchprobieren des Schluessels.
 *
 * Laeuft ohne Netz und ohne echte Zugangsdaten: die Umgebung bekommt
 * Platzhalter, fetch wird durch eine kleine PostgREST-Attrappe fuer
 * videko_terminal_admin_versuche ersetzt, Date.now laesst sich vorstellen.
 *
 *   node scripts/terminal-admin-bremse-test.mjs
 */

Object.assign(process.env, {
  TERMINAL_SUPABASE_URL: 'https://attrappe.invalid',
  TERMINAL_SUPABASE_SERVICE_KEY: 'attrappe',
  TERMINAL_TOKEN_SECRET: 'attrappe',
  TERMINAL_IP_SALT: 'attrappe',
  TERMINAL_ADMIN_TOKEN: 'richtiger-test-schluessel',
})

let fehler = 0
let gesamt = 0
function pruefe(name, ok, info = '') {
  gesamt += 1
  if (!ok) fehler += 1
  console.log(`${ok ? 'OK  ' : 'FEHL'} ${name}${info ? ` — ${info}` : ''}`)
}

/* Uhr */
const echtJetzt = Date.now.bind(Date)
let versatz = 0
Date.now = () => echtJetzt() + versatz

/* Datenbank-Attrappe */
let zeilen = []
let tabelleDa = true
globalThis.fetch = async (url, opt = {}) => {
  const u = new URL(url)
  if (!u.pathname.endsWith('/videko_terminal_admin_versuche')) {
    return new Response('[]', { status: 200 })
  }
  if (!tabelleDa) return new Response('{"message":"relation does not exist"}', { status: 404 })
  if ((opt.method || 'GET') === 'POST') {
    const z = JSON.parse(opt.body)
    zeilen.push({ ...z, created_at: Date.now() })
    return new Response(null, { status: 201 })
  }
  const p = u.searchParams
  const hash = p.get('ip_hash')?.replace(/^eq\./, '')
  const art = p.get('art')?.replace(/^eq\./, '')
  const seit = new Date(p.get('created_at')?.replace(/^gte\./, '')).getTime()
  const n = zeilen.filter((z) => z.ip_hash === hash && z.art === art && z.created_at >= seit).length
  return new Response('[]', { status: 200, headers: { 'content-range': `0-0/${n}` } })
}

const { default: handler, adminBremseLeeren } = await import('../api/terminal-admin.js')

async function ruf(ip, schluessel) {
  const req = {
    method: 'POST',
    headers: { 'x-forwarded-for': ip, ...(schluessel != null ? { 'x-terminal-admin': schluessel } : {}) },
    body: { aktion: 'gibtsnicht' },
  }
  const res = {
    code: 0,
    body: null,
    setHeader() {},
    status(c) { this.code = c; return this },
    json(d) { this.body = d; return this },
  }
  await handler(req, res)
  return res
}

const RICHTIG = process.env.TERMINAL_ADMIN_TOKEN

/* 1. Erfolg zaehlt nicht */
for (let i = 0; i < 25; i += 1) await ruf('10.0.0.1', RICHTIG)
const nachErfolg = await ruf('10.0.0.1', RICHTIG)
pruefe('25 erfolgreiche Anmeldungen sperren nicht', nachErfolg.code === 400 && nachErfolg.body?.grund === 'aktion', String(nachErfolg.code))
pruefe('Erfolg wird nicht vermerkt', zeilen.length === 0, String(zeilen.length))

/* 2. Ohne Schluessel ist kein Rateversuch */
for (let i = 0; i < 15; i += 1) await ruf('10.0.0.2', null)
pruefe('Anfragen ohne Schluessel sperren nicht', (await ruf('10.0.0.2', RICHTIG)).code === 400)

/* 3. Zehn Fehlversuche, dann Sperre */
const antworten = []
for (let i = 0; i < 10; i += 1) antworten.push(await ruf('10.0.0.3', `falsch-${i}`))
pruefe('Fehlversuche 1–10 bekommen 401 zugang', antworten.every((r) => r.code === 401 && r.body?.grund === 'zugang'),
  antworten.map((r) => r.code).join(','))
const gleich = antworten.every((r) => JSON.stringify(r.body) === JSON.stringify(antworten[0].body))
pruefe('Antworten verraten keine Restversuche', gleich && !/\d/.test(JSON.stringify(antworten[9].body)), JSON.stringify(antworten[9].body))
const elfter = await ruf('10.0.0.3', 'falsch-11')
pruefe('11. Versuch gesperrt (429)', elfter.code === 429 && elfter.body?.grund === 'bremse', String(elfter.code))
pruefe('Sperre ohne Zahlen', !/\d/.test(JSON.stringify(elfter.body)), JSON.stringify(elfter.body))
const richtigGesperrt = await ruf('10.0.0.3', RICHTIG)
pruefe('Waehrend der Sperre auch richtiger Schluessel abgewiesen', richtigGesperrt.code === 429)

/* 4. Andere IP unberuehrt */
pruefe('Andere IP bleibt frei', (await ruf('10.0.0.4', RICHTIG)).code === 400)

/* 5. Sperre haelt ueber eine frische Instanz (Datenbankstufe) */
adminBremseLeeren()
pruefe('Sperre ueberlebt Instanzwechsel', (await ruf('10.0.0.3', RICHTIG)).code === 429)

/* 6. Nach 14 Minuten noch gesperrt, nach 15 frei */
versatz = 14 * 60 * 1000
adminBremseLeeren()
pruefe('Nach 14 Minuten noch gesperrt', (await ruf('10.0.0.3', RICHTIG)).code === 429)
versatz = 15 * 60 * 1000 + 1000
adminBremseLeeren()
pruefe('Nach 15 Minuten wieder frei', (await ruf('10.0.0.3', RICHTIG)).code === 400)

/* 7. Fenster: 9 Fehlversuche, 11 Minuten warten, 9 weitere — keine Sperre */
versatz = 0
zeilen = []
adminBremseLeeren()
for (let i = 0; i < 9; i += 1) await ruf('10.0.0.5', 'falsch')
versatz = 11 * 60 * 1000
for (let i = 0; i < 9; i += 1) await ruf('10.0.0.5', 'falsch')
pruefe('Fehlversuche ausserhalb von 10 Minuten zaehlen nicht zusammen', (await ruf('10.0.0.5', RICHTIG)).code === 400)

/* 8. Ohne Tabelle: Speicherstufe greift */
versatz = 0
zeilen = []
tabelleDa = false
adminBremseLeeren()
for (let i = 0; i < 10; i += 1) await ruf('10.0.0.6', 'falsch')
pruefe('Ohne Tabelle sperrt die Speicherstufe', (await ruf('10.0.0.6', RICHTIG)).code === 429)
pruefe('Ohne Tabelle bleibt richtiger Schluessel anderer IP nutzbar', (await ruf('10.0.0.7', RICHTIG)).code === 400)

/* 9. Gespeichert wird nur ein Hash */
tabelleDa = true
zeilen = []
adminBremseLeeren()
await ruf('10.0.0.8', 'falsch')
pruefe('Vermerk enthaelt nur IP-Hash und Art',
  zeilen.length === 1 && Object.keys(zeilen[0]).sort().join(',') === 'art,created_at,ip_hash'
  && /^[0-9a-f]{64}$/.test(zeilen[0].ip_hash) && !JSON.stringify(zeilen).includes('10.0.0.8'))

console.log(`\n${gesamt - fehler}/${gesamt} Pruefungen bestanden`)
process.exit(fehler ? 1 : 0)
