/**
 * Instagram-Follower-Sync: Abruf, Speichern, Cron-Zugang, Admin-Aktion.
 *
 * Laeuft ohne Netz und ohne echte Zugangsdaten: die Umgebung bekommt
 * Platzhalter, fetch wird durch eine Attrappe ersetzt, die sowohl die Graph
 * API als auch PostgREST spielt. Instagram wird nie wirklich gefragt.
 *
 *   node scripts/terminal-instagram-test.mjs
 */

Object.assign(process.env, {
  TERMINAL_SUPABASE_URL: 'https://attrappe.invalid',
  TERMINAL_SUPABASE_SERVICE_KEY: 'attrappe',
  TERMINAL_TOKEN_SECRET: 'attrappe',
  TERMINAL_IP_SALT: 'attrappe',
  TERMINAL_ADMIN_TOKEN: 'richtiger-test-schluessel',
})
delete process.env.INSTAGRAM_ACCESS_TOKEN
delete process.env.INSTAGRAM_USER_ID
delete process.env.CRON_SECRET

const TOKEN = 'GEHEIMER-TEST-TOKEN-xyz123'
const USER = '17841400000000000'

let fehler = 0
let gesamt = 0
function pruefe(name, ok, info = '') {
  gesamt += 1
  if (!ok) fehler += 1
  console.log(`${ok ? 'OK  ' : 'FEHL'} ${name}${info ? ` — ${info}` : ''}`)
}

/* Attrappe: Graph API und Datenbank */
let graphAufrufe = []
let schreibvorgaenge = []
let graphVerhalten = async () => new Response(JSON.stringify({ followers_count: 1234, id: USER }), { status: 200 })
/* Antwortstatus der Datenbank je Schreibvorgang, der Reihe nach; leer heisst 201. */
let schreibStatus = []
let standZeile = null

globalThis.fetch = async (url, opt = {}) => {
  const u = new URL(url)
  if (u.hostname === 'graph.facebook.com') {
    graphAufrufe.push(String(url))
    return graphVerhalten(u, opt)
  }
  if ((opt.method || 'GET') === 'POST' && u.pathname.endsWith('/videko_terminal_einstellungen')) {
    schreibvorgaenge.push(JSON.parse(opt.body))
    const status = schreibStatus.length ? schreibStatus.shift() : 201
    return new Response(status < 300 ? '[]' : '{"code":"PGRST204"}', { status })
  }
  if (u.pathname.endsWith('/videko_terminal_einstellungen') && u.searchParams.get('select')?.includes('instagram_sync_am')) {
    if (standZeile === 'fehlt') return new Response('{"code":"42703"}', { status: 400 })
    return new Response(JSON.stringify(standZeile ? [standZeile] : []), { status: 200 })
  }
  return new Response('[]', { status: 200 })
}

function zuruecksetzen() {
  graphAufrufe = []
  schreibvorgaenge = []
  schreibStatus = []
  graphVerhalten = async () => new Response(JSON.stringify({ followers_count: 1234, id: USER }), { status: 200 })
}

function zugangSetzen() {
  process.env.INSTAGRAM_ACCESS_TOKEN = TOKEN
  process.env.INSTAGRAM_USER_ID = USER
}

const {
  instagramFollowerHolen,
  instagramSynchronisieren,
  instagramStandLesen,
} = await import('../api/_terminal-instagram.js')
const { default: cronHandler } = await import('../api/terminal-instagram.js')
const { default: adminHandler } = await import('../api/terminal-admin.js')

/* Alles, was irgendwo zurueckkommt oder gespeichert wird, landet hier und
   wird am Ende auf den Token durchsucht. */
const gesehen = []
const merke = (x) => { gesehen.push(JSON.stringify(x)); return x }

/* 1. Ohne Zugangsdaten wird nicht gefragt */
zuruecksetzen()
{
  const r = merke(await instagramFollowerHolen())
  pruefe('Ohne Env: nicht-konfiguriert', r.ok === false && r.grund === 'nicht-konfiguriert', JSON.stringify(r))
  pruefe('Ohne Env: kein fetch an Instagram', graphAufrufe.length === 0)
  process.env.INSTAGRAM_ACCESS_TOKEN = TOKEN
  const nurToken = merke(await instagramFollowerHolen())
  pruefe('Nur Token ohne User-ID: nicht-konfiguriert', nurToken.grund === 'nicht-konfiguriert' && graphAufrufe.length === 0)
  delete process.env.INSTAGRAM_ACCESS_TOKEN
  const s = merke(await instagramSynchronisieren())
  pruefe('Sync ohne Env schreibt keine follower_zahl',
    s.ok === false && schreibvorgaenge.every((z) => !('follower_zahl' in z)), JSON.stringify(schreibvorgaenge))
}

/* 2. Gueltige Antwort */
zuruecksetzen()
zugangSetzen()
{
  const r = merke(await instagramSynchronisieren())
  pruefe('Gueltig: ok mit Wert', r.ok === true && r.wert === 1234 && typeof r.am === 'string', JSON.stringify(r))
  pruefe('Gueltig: genau ein fetch an Instagram', graphAufrufe.length === 1)
  const u = new URL(graphAufrufe[0] ?? 'https://x.invalid')
  pruefe('Gueltig: richtige URL (v21.0, User-ID, followers_count)',
    u.pathname === `/v21.0/${USER}` && u.searchParams.get('fields') === 'followers_count'
    && u.searchParams.get('access_token') === TOKEN)
  const z = schreibvorgaenge[0] ?? {}
  pruefe('Gueltig: schreibt follower_zahl und API-Wert',
    schreibvorgaenge.length === 1 && z.follower_zahl === 1234 && z.instagram_follower_api === 1234
    && z.instagram_sync_fehler === null && z.instagram_sync_am === r.am, JSON.stringify(z))
  pruefe('Gueltig: faesst sonst keine Einstellungen an',
    Object.keys(z).sort().join(',')
      === 'aktualisiert_am,follower_zahl,instagram_follower_api,instagram_sync_am,instagram_sync_fehler,kampagne',
    Object.keys(z).join(','))
  const null0 = merke(await (graphVerhalten = async () => new Response('{"followers_count":0}', { status: 200 }), instagramFollowerHolen()))
  pruefe('Gueltig: 0 ist erlaubt', null0.ok === true && null0.wert === 0)
  const max = merke(await (graphVerhalten = async () => new Response('{"followers_count":10000000}', { status: 200 }), instagramFollowerHolen()))
  pruefe('Gueltig: 10 Mio. ist erlaubt', max.ok === true && max.wert === 10_000_000)
}

/* 3. Ungueltige Werte */
for (const [name, roh] of [
  ['negativ', '{"followers_count":-5}'],
  ['String', '{"followers_count":"1234"}'],
  ['ueber 10 Mio.', '{"followers_count":10000001}'],
  ['Kommazahl', '{"followers_count":12.5}'],
  ['fehlt', '{"id":"1"}'],
  ['null', '{"followers_count":null}'],
]) {
  zuruecksetzen()
  zugangSetzen()
  graphVerhalten = async () => new Response(roh, { status: 200 })
  const r = merke(await instagramSynchronisieren())
  pruefe(`Ungueltig (${name}): ungueltiger-wert`, r.ok === false && r.grund === 'ungueltiger-wert', JSON.stringify(r))
  pruefe(`Ungueltig (${name}): keine follower_zahl geschrieben`,
    schreibvorgaenge.length === 1 && !('follower_zahl' in schreibvorgaenge[0])
    && !('instagram_follower_api' in schreibvorgaenge[0])
    && schreibvorgaenge[0].instagram_sync_fehler === 'ungueltiger-wert', JSON.stringify(schreibvorgaenge))
}

zuruecksetzen()
zugangSetzen()
graphVerhalten = async () => new Response('kein json', { status: 200 })
{
  const r = merke(await instagramSynchronisieren())
  pruefe('Kaputtes JSON: ungueltige-antwort, keine follower_zahl',
    r.grund === 'ungueltige-antwort' && schreibvorgaenge.every((z) => !('follower_zahl' in z)), JSON.stringify(r))
}

/* 4. HTTP-Fehler */
zuruecksetzen()
zugangSetzen()
graphVerhalten = async () => new Response(
  JSON.stringify({ error: { message: `Invalid OAuth access token ${TOKEN}`, code: 190 } }),
  { status: 400 },
)
{
  const r = merke(await instagramSynchronisieren())
  pruefe('HTTP 400: grund http-400', r.ok === false && r.grund === 'http-400', JSON.stringify(r))
  const z = schreibvorgaenge[0] ?? {}
  pruefe('HTTP 400: nur Zeit und Fehler geschrieben',
    schreibvorgaenge.length === 1
    && Object.keys(z).sort().join(',') === 'aktualisiert_am,instagram_sync_am,instagram_sync_fehler,kampagne'
    && z.instagram_sync_fehler === 'http-400', JSON.stringify(z))
  pruefe('HTTP 400: Instagram-Fehlertext mit Token nicht uebernommen', !JSON.stringify([r, z]).includes(TOKEN))
}

/* 5. Zeitueberschreitung */
zuruecksetzen()
zugangSetzen()
graphVerhalten = (u, opt) => new Promise((_, ablehnen) => {
  opt.signal?.addEventListener('abort', () => {
    const e = new Error(`This operation was aborted: ${u}`)
    e.name = 'AbortError'
    ablehnen(e)
  })
})
{
  const beginn = Date.now()
  const r = merke(await instagramSynchronisieren({ zeitlimitMs: 50 }))
  pruefe('Timeout: zeitueberschreitung', r.ok === false && r.grund === 'zeitueberschreitung', JSON.stringify(r))
  pruefe('Timeout: bricht zuegig ab', Date.now() - beginn < 2000, `${Date.now() - beginn} ms`)
  pruefe('Timeout: keine follower_zahl', schreibvorgaenge.every((z) => !('follower_zahl' in z)))
}

/* 6. Netzfehler mit Token in der Meldung */
zuruecksetzen()
zugangSetzen()
graphVerhalten = async (u) => { throw new TypeError(`fetch failed for ${u}`) }
{
  const r = merke(await instagramSynchronisieren())
  pruefe('Netz: grund netz', r.ok === false && r.grund === 'netz', JSON.stringify(r))
  pruefe('Netz: Fehlermeldung mit URL/Token nicht weitergereicht',
    !JSON.stringify([r, schreibvorgaenge]).includes(TOKEN) && !JSON.stringify(r).includes('graph.facebook'))
}

/* 7. Sync-Spalten fehlen */
zuruecksetzen()
zugangSetzen()
schreibStatus = [400, 201]
{
  const r = merke(await instagramSynchronisieren())
  pruefe('Schema fehlt: ok mit hinweis', r.ok === true && r.wert === 1234 && r.hinweis === 'schema-fehlt', JSON.stringify(r))
  pruefe('Schema fehlt: zweiter Versuch nur mit follower_zahl',
    schreibvorgaenge.length === 2
    && Object.keys(schreibvorgaenge[1]).sort().join(',') === 'aktualisiert_am,follower_zahl,kampagne'
    && schreibvorgaenge[1].follower_zahl === 1234, JSON.stringify(schreibvorgaenge[1]))
}
zuruecksetzen()
zugangSetzen()
schreibStatus = [500, 500]
{
  const r = merke(await instagramSynchronisieren())
  pruefe('Datenbank weg: ok false, grund server, wirft nicht', r.ok === false && r.grund === 'server', JSON.stringify(r))
}

/* 8. Stand lesen */
standZeile = { instagram_follower_api: 987, instagram_sync_am: '2026-09-15T10:00:00+00:00', instagram_sync_fehler: null }
{
  const s = await instagramStandLesen()
  pruefe('Stand: liest die drei Spalten', s.wert === 987 && s.am === standZeile.instagram_sync_am && s.fehler === null, JSON.stringify(s))
}
standZeile = 'fehlt'
{
  const s = await instagramStandLesen()
  pruefe('Stand: fehlende Spalten ergeben Nullwerte', s.am === null && s.wert === null && s.fehler === null, JSON.stringify(s))
}
standZeile = null

/* 9. Cron-Route */
async function cronRuf({ methode = 'GET', kopf } = {}) {
  const req = { method: methode, headers: kopf != null ? { authorization: kopf } : {} }
  const res = {
    code: 0,
    body: null,
    kopfzeilen: {},
    setHeader(n, w) { this.kopfzeilen[n.toLowerCase()] = w },
    status(c) { this.code = c; return this },
    json(d) { this.body = d; return this },
  }
  await cronHandler(req, res)
  merke(res.body)
  return res
}

zuruecksetzen()
zugangSetzen()
{
  const r = await cronRuf({ kopf: 'Bearer irgendwas' })
  pruefe('Cron ohne CRON_SECRET in der Umgebung: 503, kein fetch', r.code === 503 && graphAufrufe.length === 0, String(r.code))
}
process.env.CRON_SECRET = 'richtiges-cron-secret'
{
  const ohne = await cronRuf()
  pruefe('Cron ohne Authorization: 401, kein fetch', ohne.code === 401 && graphAufrufe.length === 0, String(ohne.code))
  const falsch = await cronRuf({ kopf: 'Bearer falsches-secret' })
  pruefe('Cron mit falschem Secret: 401, kein fetch', falsch.code === 401 && graphAufrufe.length === 0, String(falsch.code))
  const ohneBearer = await cronRuf({ kopf: 'richtiges-cron-secret' })
  pruefe('Cron mit Secret ohne Bearer: 401', ohneBearer.code === 401 && graphAufrufe.length === 0)
  const post = await cronRuf({ methode: 'POST', kopf: 'Bearer richtiges-cron-secret' })
  pruefe('Cron per POST: 405, kein fetch', post.code === 405 && graphAufrufe.length === 0)
  pruefe('Cron: nicht zwischenspeicherbar', falsch.kopfzeilen['cache-control'] === 'no-store')

  const richtig = await cronRuf({ kopf: 'Bearer richtiges-cron-secret' })
  pruefe('Cron mit richtigem Secret: 200 ok mit Wert',
    richtig.code === 200 && richtig.body?.ok === true && richtig.body?.wert === 1234, JSON.stringify(richtig.body))
  pruefe('Cron mit richtigem Secret: genau ein Abruf', graphAufrufe.length === 1)
  pruefe('Cron-Antwort ohne Token, User-ID, Secret',
    !JSON.stringify(richtig.body).includes(TOKEN) && !JSON.stringify(richtig.body).includes(USER)
    && !JSON.stringify(richtig.body).includes('richtiges-cron-secret'))

  graphVerhalten = async () => new Response('{}', { status: 401 })
  const abgelehnt = await cronRuf({ kopf: 'Bearer richtiges-cron-secret' })
  pruefe('Cron bei Instagram-Fehler: 502 mit grund', abgelehnt.code === 502 && abgelehnt.body?.grund === 'http-401', JSON.stringify(abgelehnt.body))
}
delete process.env.CRON_SECRET

/* 10. Admin-Aktion */
async function adminRuf(schluessel, body) {
  const req = {
    method: 'POST',
    headers: { 'x-forwarded-for': '10.9.9.9', ...(schluessel != null ? { 'x-terminal-admin': schluessel } : {}) },
    body,
  }
  const res = {
    code: 0,
    body: null,
    setHeader() {},
    status(c) { this.code = c; return this },
    json(d) { this.body = d; return this },
  }
  await adminHandler(req, res)
  merke(res.body)
  return res
}

zuruecksetzen()
zugangSetzen()
{
  const ohne = await adminRuf('falscher-schluessel', { aktion: 'instagram-sync' })
  pruefe('Admin-Sync ohne gueltigen Schluessel: 401, kein fetch', ohne.code === 401 && graphAufrufe.length === 0, String(ohne.code))
  const r = await adminRuf(process.env.TERMINAL_ADMIN_TOKEN, { aktion: 'instagram-sync' })
  pruefe('Admin-Sync: 200 mit ok, wert, am, stand',
    r.code === 200 && r.body?.ok === true && r.body?.wert === 1234 && typeof r.body?.am === 'string'
    && r.body?.stand && 'fehler' in r.body.stand, JSON.stringify(r.body))
  const stand = await adminRuf(process.env.TERMINAL_ADMIN_TOKEN, { aktion: 'stand' })
  pruefe('Admin-Stand enthaelt instagramSync',
    stand.code === 200 && stand.body?.instagramSync && 'am' in stand.body.instagramSync
    && 'wert' in stand.body.instagramSync, JSON.stringify(stand.body?.instagramSync))
}

/* 11. Token taucht nirgends auf */
pruefe('Token in keiner Rueckgabe, Antwort oder Datenbankzeile',
  !gesehen.some((t) => t?.includes(TOKEN)) && !schreibvorgaenge.some((z) => JSON.stringify(z).includes(TOKEN)))

console.log(`\n${gesamt - fehler}/${gesamt} Pruefungen bestanden`)
process.exit(fehler ? 1 : 0)
