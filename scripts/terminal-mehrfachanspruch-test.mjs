/**
 * Deckel-Mehrfachanspruch, Lostopf und Practice-Einstellung.
 *
 * Laeuft ohne Netz und ohne echte Zugangsdaten: die Umgebung bekommt
 * Platzhalter, fetch wird durch eine kleine PostgREST-Attrappe ersetzt, die
 * jede Anfrage mitschreibt. Echte Teilnehmer gibt es hier nicht.
 *
 *   node scripts/terminal-mehrfachanspruch-test.mjs
 *
 * Die Notbremse (TERMINAL_SCHREIBEN=0) wird beim Import gelesen; der Teil
 * dazu laeuft deshalb in einem eigenen Kindprozess (Argument `pause`).
 */

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const PAUSE = process.argv[2] === 'pause'

Object.assign(process.env, {
  TERMINAL_SUPABASE_URL: 'https://attrappe.invalid',
  TERMINAL_SUPABASE_SERVICE_KEY: 'attrappe',
  TERMINAL_TOKEN_SECRET: 'attrappe',
  TERMINAL_IP_SALT: 'attrappe',
  TERMINAL_ADMIN_TOKEN: 'richtiger-test-schluessel',
  TERMINAL_SCHREIBEN: PAUSE ? '0' : '1',
})

let fehler = 0
let gesamt = 0
function pruefe(name, ok, info = '') {
  gesamt += 1
  if (!ok) fehler += 1
  console.log(`${ok ? 'OK  ' : 'FEHL'} ${name}${info ? ` — ${info}` : ''}`)
}

/* Datenbank-Attrappe */
const TN = '/videko_terminal_teilnehmer'
let rufe = []
/** Erstaktivierungen, die die Vorabpruefung findet. */
let belegteNummern = new Set()
/** Status, mit dem der naechste Teilnehmer-POST antwortet. */
let postStatus = 201
/** Teilnehmerzeilen fuer das seitenweise Lesen (select=deckel_nummer). */
let topfZeilen = []
/** Einzelzeile fuer besitz-bestaetigen. */
let einzelZeile = null

const json = (daten, status = 200, headers = {}) =>
  new Response(JSON.stringify(daten), { status, headers: { 'content-type': 'application/json', ...headers } })

globalThis.fetch = async (url, opt = {}) => {
  const u = new URL(url)
  const methode = opt.method || 'GET'
  const p = u.searchParams
  rufe.push({ methode, pfad: u.pathname, suche: u.search, body: opt.body ? JSON.parse(opt.body) : null })

  /* Zaehlen (Admin-Bremse, IP-Bremse, Aktiviert-Zaehler) */
  if (methode === 'GET' && (opt.headers?.Prefer || '').includes('count=exact')) {
    const n = u.pathname.endsWith(TN) && p.get('anspruch_art') ? 7 : 0
    return json([], 200, { 'content-range': `0-0/${n}` })
  }

  if (u.pathname.endsWith(TN)) {
    if (methode === 'POST') {
      if (postStatus !== 201) return json({ message: 'duplicate' }, postStatus)
      const z = JSON.parse(opt.body)
      return json([{ id: 'neu-1', ...z }], 201)
    }
    if (methode === 'PATCH') return new Response(null, { status: 204 })
    if (methode === 'DELETE') return new Response(null, { status: 204 })
    if (p.get('id')?.startsWith('eq.')) return json(einzelZeile ? [einzelZeile] : [])
    if (p.get('anspruch_art') === 'eq.erstaktivierung' && p.get('deckel_nummer')) {
      const n = Number(p.get('deckel_nummer').replace(/^eq\./, ''))
      return json(belegteNummern.has(n) ? [{ id: 'erst-1' }] : [])
    }
    /* Seit den Einladungen liest die Ziehung zusaetzlich teilnahme_status,
       darum wird der Anfang der Spaltenliste verglichen und nicht mehr
       die ganze Zeichenkette. */
    if (p.get('select')?.startsWith('deckel_nummer')) {
      const von = Number(p.get('offset') || 0)
      const bis = von + Number(p.get('limit') || 1000)
      return json(topfZeilen.slice(von, bis))
    }
    return json([])
  }
  if (u.pathname.endsWith('/videko_terminal_ziehungen') && methode === 'POST') {
    return json([{ id: 'z-1', ...JSON.parse(opt.body) }], 201)
  }
  return json([])
}

const kern = await import('../api/_terminal-kern.js')
const { default: terminal } = await import('../api/terminal.js')
const { default: admin, topfBilden } = await import('../api/terminal-admin.js')

function antwortAttrappe() {
  return {
    code: 0,
    body: null,
    setHeader() {},
    status(c) { this.code = c; return this },
    json(d) { this.body = d; return this },
  }
}

let ipZaehler = 0
async function aktivieren(extra = {}) {
  ipZaehler += 1
  const req = {
    method: 'POST',
    headers: { 'x-forwarded-for': `10.1.0.${ipZaehler}` },
    body: {
      aktion: 'aktivieren',
      zugang: kern.belegErzeugen('z'),
      deckel: '1847',
      instagram: 'test_anspruch',
      email: 'anspruch@example.com',
      folgt: true,
      ...extra,
    },
  }
  const res = antwortAttrappe()
  await terminal(req, res)
  return res
}

async function adminRuf(body) {
  const req = {
    method: 'POST',
    headers: { 'x-forwarded-for': '10.2.0.1', 'x-terminal-admin': process.env.TERMINAL_ADMIN_TOKEN },
    body,
  }
  const res = antwortAttrappe()
  await admin(req, res)
  return res
}

const posts = () => rufe.filter((r) => r.methode === 'POST' && r.pfad.endsWith(TN))
const loeschRufe = () => rufe.filter((r) => r.methode === 'DELETE')

if (PAUSE) {
  /* Notbremse: weder Aktivierung noch Besitzbestaetigung schreiben. */
  einzelZeile = { id: 'a-1', deckel_nummer: 1847 }
  const r = await adminRuf({ aktion: 'besitz-bestaetigen', id: 'a-1' })
  pruefe('Pause: besitz-bestaetigen 503', r.code === 503 && r.body?.grund === 'pause', String(r.code))
  pruefe('Pause: kein PATCH', !rufe.some((x) => x.methode === 'PATCH'))
  const a = await aktivieren({ besitzBestaetigt: true })
  pruefe('Pause: aktivieren 503', a.code === 503, String(a.code))
  pruefe('Pause: kein Teilnehmer-POST', posts().length === 0)
  console.log(`\n${gesamt - fehler}/${gesamt} Pruefungen bestanden`)
  process.exit(fehler ? 1 : 0)
}

/* 1. Freie Nummer: Erstaktivierung */
rufe = []
belegteNummern = new Set()
let r = await aktivieren()
pruefe('Freie Nummer: 200', r.code === 200 && r.body?.ok === true, String(r.code))
pruefe('Freie Nummer: POST mit anspruch_art erstaktivierung', posts().length === 1 && posts()[0].body.anspruch_art === 'erstaktivierung')
pruefe('Freie Nummer: Vorabpruefung liest nur Erstaktivierungen dieser Nummer',
  rufe.some((x) => x.methode === 'GET' && x.pfad.endsWith(TN) && x.suche.includes('deckel_nummer=eq.1847') && x.suche.includes('anspruch_art=eq.erstaktivierung')))
pruefe('Antwort ohne E-Mail', !JSON.stringify(r.body).includes('anspruch@example.com'))

/* 2. Belegte Nummer ohne Bestaetigung: Frage, kein Schreiben */
rufe = []
belegteNummern = new Set([1847])
r = await aktivieren()
pruefe('Belegt ohne Bestaetigung: 409 belegt', r.code === 409 && r.body?.grund === 'belegt', `${r.code} ${JSON.stringify(r.body)}`)
pruefe('Belegt ohne Bestaetigung: kein POST', posts().length === 0)
r = await aktivieren({ besitzBestaetigt: 'true' })
pruefe('Belegt mit "true" als Text: weiterhin 409, kein POST', r.code === 409 && posts().length === 0)

/* 3. Belegte Nummer mit Bestaetigung: weiterer Besitzanspruch */
rufe = []
r = await aktivieren({ besitzBestaetigt: true })
pruefe('Belegt mit Bestaetigung: 200', r.code === 200 && r.body?.ok === true, String(r.code))
pruefe('Belegt mit Bestaetigung: POST mit weiterer_besitzanspruch',
  posts().length === 1 && posts()[0].body.anspruch_art === 'weiterer_besitzanspruch' && posts()[0].body.deckel_nummer === 1847)

/* 4. Freie Nummer, besitzBestaetigt gesetzt: bleibt Erstaktivierung */
rufe = []
belegteNummern = new Set()
r = await aktivieren({ besitzBestaetigt: true })
pruefe('Frei mit Bestaetigung: bleibt erstaktivierung', r.code === 200 && posts()[0]?.body.anspruch_art === 'erstaktivierung')

/* 5. Wettlauf: Insert scheitert am UNIQUE-Index */
rufe = []
postStatus = 409
r = await aktivieren()
pruefe('Insert-409: Antwort belegt', r.code === 409 && r.body?.grund === 'belegt', String(r.code))
postStatus = 201

/* 6. Zaehler liest nur Erstaktivierungen */
rufe = []
const n = await kern.aktivierteZaehlen()
pruefe('aktivierteZaehlen filtert auf erstaktivierung',
  n === 7 && rufe.length === 1 && rufe[0].suche.includes('anspruch_art=eq.erstaktivierung'), `${n} ${rufe[0]?.suche}`)
pruefe('Kein Loeschaufruf in der Aktivierung', loeschRufe().length === 0)

/* 7. Lostopf: jede Nummer genau einmal */
const mit = (nummer, anzahl) => Array.from({ length: anzahl }, () => ({ deckel_nummer: nummer }))
const basis = [...mit(1, 1), ...mit(2, 1), ...mit(3, 1)]
const groesse = (ansprueche) => topfBilden([...basis, ...mit(1847, ansprueche)]).length
pruefe('Topf: 1, 2, 5 und 20 Ansprueche ergeben dasselbe Los',
  [1, 2, 5, 20].every((k) => groesse(k) === 4), [1, 2, 5, 20].map(groesse).join(','))
const topf20 = topfBilden([...basis, ...mit(1847, 20)])
pruefe('Topf: 1847 genau einmal', topf20.filter((x) => x === 1847).length === 1)
pruefe('Topf: gezogene Nummern fallen heraus',
  JSON.stringify(topfBilden([...basis, ...mit(1847, 5)], [{ deckel_nummer: 1847 }, { deckel_nummer: 2 }])) === '[1,3]')
pruefe('Topf: Unsinn wird ignoriert',
  JSON.stringify(topfBilden([{ deckel_nummer: 5 }, { deckel_nummer: null }, { deckel_nummer: '6' }, { deckel_nummer: 1.5 }])) === '[5]')

/* 8. Ziehen liest seitenweise und zieht nur aus eindeutigen Nummern */
rufe = []
topfZeilen = [...Array.from({ length: 999 }, () => ({ deckel_nummer: 1847 })), { deckel_nummer: 1847 }, { deckel_nummer: 1848 }]
r = await adminRuf({ aktion: 'ziehen' })
const seiten = rufe.filter((x) => x.methode === 'GET' && x.pfad.endsWith(TN) && x.suche.includes('select=deckel_nummer'))
pruefe('Ziehen: 200', r.code === 200 && r.body?.ok === true, `${r.code} ${JSON.stringify(r.body)?.slice(0, 80)}`)
pruefe('Ziehen: zweite Seite gelesen (offset=1000)', seiten.length === 2 && seiten[1].suche.includes('offset=1000'), seiten.map((s) => s.suche).join(' | '))
const gezogen = rufe.find((x) => x.methode === 'POST' && x.pfad.endsWith('/videko_terminal_ziehungen'))?.body?.deckel_nummer
pruefe('Ziehen: gezogene Nummer stammt aus dem Topf', gezogen === 1847 || gezogen === 1848, String(gezogen))
pruefe('Ziehen: gelesen wird nur, wer offiziell teilnimmt',
  seiten.length > 0 && seiten.every((s) => s.suche.includes('teilnahme_status=eq.offiziell')),
  seiten[0]?.suche)
let treffer1847 = 0
for (let i = 0; i < 2000; i += 1) {
  const t = topfBilden(topfZeilen)
  if (t[Math.floor(Math.random() * t.length)] === 1847) treffer1847 += 1
}
pruefe('Topf mit 1000 Anspruechen auf 1847 und einem auf 1848: rund 50 %', treffer1847 > 850 && treffer1847 < 1150, String(treffer1847))

/* 9. Besitz bestaetigen: genau einer bestaetigt, die anderen nicht, nichts geloescht */
rufe = []
einzelZeile = { id: 'a-2', deckel_nummer: 1847 }
r = await adminRuf({ aktion: 'besitz-bestaetigen', id: 'a-2' })
const patches = rufe.filter((x) => x.methode === 'PATCH')
pruefe('Besitz: 200', r.code === 200 && r.body?.ok === true, String(r.code))
pruefe('Besitz: zwei PATCHes', patches.length === 2, String(patches.length))
pruefe('Besitz: gewaehlter Anspruch bestaetigt',
  patches[0]?.suche.includes('id=eq.a-2') && patches[0]?.suche.includes('kampagne=eq.') && patches[0]?.body.besitz_status === 'bestaetigt')
pruefe('Besitz: uebrige Ansprueche derselben Nummer nicht bestaetigt',
  patches[1]?.suche.includes('deckel_nummer=eq.1847') && patches[1]?.suche.includes('id=neq.a-2')
  && patches[1]?.suche.includes('kampagne=eq.') && patches[1]?.body.besitz_status === 'nicht_bestaetigt')
pruefe('Besitz: Zeitpunkt gesetzt', patches.every((x) => !Number.isNaN(Date.parse(x.body.besitz_geprueft_am))))
pruefe('Besitz: nichts geloescht', loeschRufe().length === 0)

rufe = []
einzelZeile = null
r = await adminRuf({ aktion: 'besitz-bestaetigen', id: 'gibtsnicht' })
pruefe('Besitz: unbekannte id 400, kein PATCH', r.code === 400 && !rufe.some((x) => x.methode === 'PATCH'), String(r.code))
r = await adminRuf({ aktion: 'besitz-bestaetigen' })
pruefe('Besitz: ohne id 400', r.code === 400)

/* 10. Practice-Game in den Einstellungen */
rufe = []
r = await adminRuf({ aktion: 'einstellungen', guestPracticeGame: 'gibtsnicht' })
pruefe('Practice: unbekanntes Game 400 felder', r.code === 400 && r.body?.grund === 'felder', String(r.code))
pruefe('Practice: unbekanntes Game schreibt nicht', !rufe.some((x) => x.methode === 'POST'))
rufe = []
r = await adminRuf({ aktion: 'einstellungen', guestPracticeGame: 'kuechen_fit' })
const eingestellt = rufe.find((x) => x.methode === 'POST' && x.pfad.endsWith('/videko_terminal_einstellungen'))
pruefe('Practice: gueltiges Game wird gespeichert', r.code === 200 && eingestellt?.body.guest_practice_game === 'kuechen_fit', String(r.code))
pruefe('practiceSaeubern: Standard videko_jump',
  kern.practiceSaeubern(undefined) === 'videko_jump' && kern.practiceSaeubern('xyz') === 'videko_jump'
  && kern.practiceSaeubern('kuechen_fit') === 'kuechen_fit' && kern.PRACTICE_STANDARD === 'videko_jump')

/* 11. Notbremse im Kindprozess */
const kind = spawnSync(process.execPath, [fileURLToPath(import.meta.url), 'pause'], { encoding: 'utf8' })
process.stdout.write(kind.stdout.split('\n').filter((z) => /^(OK|FEHL)/.test(z)).map((z) => `  ${z}`).join('\n') + '\n')
pruefe('Notbremse-Pruefungen bestanden', kind.status === 0, kind.stderr?.slice(0, 200))

console.log(`\n${gesamt - fehler}/${gesamt} Pruefungen bestanden`)
process.exit(fehler ? 1 : 0)
