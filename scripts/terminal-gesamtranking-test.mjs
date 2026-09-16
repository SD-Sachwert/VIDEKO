/**
 * Gesamtranking ueber die fuenf Hauptgames.
 *
 * Laeuft ohne Netz und ohne echte Zugangsdaten: die Umgebung bekommt
 * Platzhalter, fetch wird durch eine kleine PostgREST-Attrappe ersetzt, die
 * jede Anfrage mitschreibt. Alle Personen hier sind erfunden.
 *
 *   node scripts/terminal-gesamtranking-test.mjs
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

/* Erfundene Personen */
const A = '00000000-0000-4000-8000-00000000000a'
const B = '00000000-0000-4000-8000-00000000000b'
const C = '00000000-0000-4000-8000-00000000000c'
const D = '00000000-0000-4000-8000-00000000000d'
const E = '00000000-0000-4000-8000-00000000000e'

const G = ['leitungsfinder', 'kuechen_merge', 'kuechen_crush', 'videko_jump', 'kuechen_fit']

const personen = [
  { id: A, instagram_handle: 'anna_test', leaderboard_ok: true, email: 'Anna@Test.invalid', deckel_nummer: 9001 },
  { id: B, instagram_handle: 'bert_test', leaderboard_ok: true, email: 'bert@test.invalid', deckel_nummer: 9002, anspruch_art: 'weiterer_besitzanspruch', besitz_status: 'bestaetigt' },
  { id: C, instagram_handle: 'cora_test', leaderboard_ok: true, email: ' anna@test.invalid', deckel_nummer: 9003 },
  { id: D, instagram_handle: 'dora_test', leaderboard_ok: true, email: 'dora@test.invalid', deckel_nummer: 9004 },
  { id: E, instagram_handle: 'emil_test', leaderboard_ok: false, email: 'emil@test.invalid', deckel_nummer: 9005 },
]

/**
 * g1–g3: A 500, B 400, C 400, D 300, E 100  (N=5 → 1000/750/750/250/0)
 * g4–g5: A 500, B 400, C 400, E 100         (N=4 → 1000/667/667/0)
 * A = 5000, B = C = 3584 (B frueher), E = 0, D nur 3 Games.
 */
function laeufeBauen() {
  const z = []
  G.forEach((g, i) => {
    const t = (tag) => `2026-09-${tag}T10:0${i}:00.000Z`
    z.push({ teilnehmer_id: A, game: g, score: 500, created_at: t('03') })
    z.push({ teilnehmer_id: A, game: g, score: 120, created_at: t('01') })
    z.push({ teilnehmer_id: B, game: g, score: 400, created_at: t('01') })
    z.push({ teilnehmer_id: C, game: g, score: 400, created_at: t('02') })
    z.push({ teilnehmer_id: E, game: g, score: 100, created_at: t('04') })
    if (i < 3) z.push({ teilnehmer_id: D, game: g, score: 300, created_at: t('05') })
  })
  return z
}

let laeufe = laeufeBauen()
let rufe = []
let einstellungenZeile = {}
let snapshots = []
let scoresKaputt = false
let protokolle = []
let protokollKaputt = false

const json = (daten, status = 200, headers = {}) =>
  new Response(JSON.stringify(daten), { status, headers: { 'content-type': 'application/json', ...headers } })

const idsAus = (wert) => (wert || '').replace(/^in\.\(|\)$/g, '').split(',').filter(Boolean)

globalThis.fetch = async (url, opt = {}) => {
  const u = new URL(url)
  const methode = opt.method || 'GET'
  const p = u.searchParams
  const body = opt.body ? JSON.parse(opt.body) : null
  rufe.push({ methode, pfad: u.pathname, suche: decodeURIComponent(u.search), body })

  if (methode === 'GET' && (opt.headers?.Prefer || '').includes('count=exact')) {
    return json([], 200, { 'content-range': '0-0/0' })
  }

  if (u.pathname.endsWith('/videko_terminal_einstellungen')) {
    if (methode === 'POST') {
      const { kampagne, aktualisiert_am, ...rest } = body
      Object.assign(einstellungenZeile, rest)
      return json([{ ...einstellungenZeile }], 201)
    }
    return json([{ ...einstellungenZeile }])
  }

  if (u.pathname.endsWith('/videko_terminal_gesamtranking_snapshot')) {
    if (methode === 'POST') {
      snapshots.push(body)
      return new Response(null, { status: 201 })
    }
    return json(snapshots.slice(-1))
  }

  if (u.pathname.endsWith('/videko_terminal_gesamtranking_protokoll')) {
    if (protokollKaputt) return json({ message: 'kaputt' }, 500)
    protokolle.push(body)
    return new Response(null, { status: 201 })
  }

  if (u.pathname.endsWith('/videko_terminal_scores')) {
    if (scoresKaputt) return json({ message: 'kaputt' }, 500)
    const status = p.get('status') || ''
    if (status === 'in.(verdacht,verworfen)') {
      const ids = idsAus(p.get('teilnehmer_id'))
      return json([
        { id: 'lauf-v1', teilnehmer_id: B, game: 'leitungsfinder', score: 999999, status: 'verdacht', notiz: 'zu schnell', dauer_ms: 900, created_at: '2026-09-06T10:00:00.000Z' },
      ].filter((l) => ids.includes(l.teilnehmer_id)))
    }
    if (status === 'eq.gueltig') {
      const game = (p.get('game') || '').replace(/^eq\./, '')
      const von = Number(p.get('offset') || 0)
      const bis = von + Number(p.get('limit') || 1000)
      return json(laeufe.filter((l) => l.game === game).slice(von, bis))
    }
    return json([])
  }

  if (u.pathname.endsWith('/videko_terminal_teilnehmer')) {
    const ids = idsAus(p.get('id'))
    const felder = (p.get('select') || '').split(',')
    let zeilen = personen.filter((x) => ids.includes(x.id))
    if (p.get('leaderboard_ok') === 'is.true') zeilen = zeilen.filter((x) => x.leaderboard_ok)
    return json(zeilen.map((x) => Object.fromEntries(felder.map((f) => [f, x[f]]))))
  }

  return json([])
}

const kern = await import('../api/_terminal-kern.js')
const gr = await import('../api/_terminal-gesamtranking.js')
const { default: admin } = await import('../api/terminal-admin.js')

function antwortAttrappe() {
  return {
    code: 0,
    body: null,
    setHeader() {},
    status(c) { this.code = c; return this },
    json(d) { this.body = d; return this },
  }
}

async function adminRuf(body) {
  const req = {
    method: 'POST',
    headers: { 'x-forwarded-for': '10.3.0.1', 'x-terminal-admin': process.env.TERMINAL_ADMIN_TOKEN },
    body,
  }
  const res = antwortAttrappe()
  await admin(req, res)
  return res
}

const privat = (obj) => {
  const s = JSON.stringify(obj)
  return /@test\.invalid|email|deckel_nummer|900[1-5]/i.test(s)
}
const frisch = () => kern.rangSpeicherLeeren()

if (PAUSE) {
  const r = await adminRuf({ aktion: 'gr-abschliessen' })
  pruefe('Pause: gr-abschliessen 503', r.code === 503 && r.body?.grund === 'pause', String(r.code))
  pruefe('Pause: kein Snapshot', snapshots.length === 0 && !rufe.some((x) => x.methode === 'POST'))
  console.log(`\n${gesamt - fehler}/${gesamt} Pruefungen bestanden`)
  process.exit(fehler ? 1 : 0)
}

/* 1. Rangpunkte */
pruefe('rangpunkte(1,1) = 1000', gr.rangpunkte(1, 1) === 1000)
pruefe('rangpunkte(1,5) = 1000', gr.rangpunkte(1, 5) === 1000)
pruefe('rangpunkte(5,5) = 0', gr.rangpunkte(5, 5) === 0)
pruefe('rangpunkte(2,4) = 667', gr.rangpunkte(2, 4) === 667)
pruefe('rangpunkte(2,5) = 750', gr.rangpunkte(2, 5) === 750)
pruefe('rangpunkte ungueltig = 0', [gr.rangpunkte(0, 5), gr.rangpunkte(6, 5), gr.rangpunkte('x', 3), gr.rangpunkte(1, 0)].every((x) => x === 0))
pruefe('rangpunkte(1,2) = 1000, (2,2) = 0', gr.rangpunkte(1, 2) === 1000 && gr.rangpunkte(2, 2) === 0)
pruefe('rangpunkte 100+: (1,100)=1000, (50,100)=505, (100,100)=0', gr.rangpunkte(1, 100) === 1000 && gr.rangpunkte(50, 100) === 505 && gr.rangpunkte(100, 100) === 0, String(gr.rangpunkte(50, 100)))

/* 1b. Grenzfaelle ueber alle 5 Games */
{
  const uid = (i) => `00000000-0000-4000-9000-${String(i).padStart(12, '0')}`
  const rechnen = (scoreFuer, n) => {
    const karte = {}
    for (const g of G) {
      karte[g] = kern.besteJePerson(
        Array.from({ length: n }, (_, i) => ({ teilnehmer_id: uid(i), game: g, score: scoreFuer(i), created_at: `2026-09-01T10:00:${String(i % 60).padStart(2, '0')}.${String(i).padStart(3, '0')}Z` })),
      )
    }
    const { teilnehmer } = gr.gesamtrankingRechnen(G, karte)
    return Object.fromEntries(teilnehmer.map((t) => [t.id, t]))
  }

  const eins = rechnen(() => 10, 1)
  pruefe('1 Spieler: je Game Platz 1 = 1000, gesamt 5000', eins[uid(0)].gesamt === 5000 && G.every((g) => eins[uid(0)].spiele[g].rangpunkte === 1000), String(eins[uid(0)].gesamt))

  const zwei = rechnen((i) => 100 - i, 2)
  pruefe('2 Spieler: 5000 und 0', zwei[uid(0)].gesamt === 5000 && zwei[uid(1)].gesamt === 0, `${zwei[uid(0)].gesamt}/${zwei[uid(1)].gesamt}`)

  const gleich = rechnen(() => 77, 2)
  pruefe('Gleichstand 2 Spieler: beide Platz 1, beide 5000', [uid(0), uid(1)].every((id) => gleich[id].gesamt === 5000 && gleich[id].spiele[G[0]].platz === 1))

  const viele = rechnen((i) => 1000 - i, 150)
  const werte = Object.values(viele)
  pruefe('150 Spieler: alle Werte endlich und ganzzahlig', werte.length === 150 && werte.every((t) => Number.isInteger(t.gesamt) && t.gesamt >= 0 && t.gesamt <= 5000))
  pruefe('150 Spieler: Erster 5000, Letzter 0', viele[uid(0)].gesamt === 5000 && viele[uid(149)].gesamt === 0, `${viele[uid(0)].gesamt}/${viele[uid(149)].gesamt}`)
}

/* 2. Rechnen ohne Datenbank */
{
  const karte = {}
  for (const g of G) karte[g] = kern.besteJePerson(laeufe.filter((l) => l.game === g))
  const { anzahl, teilnehmer } = gr.gesamtrankingRechnen(G, karte)
  const nach = Object.fromEntries(teilnehmer.map((t) => [t.id, t]))
  pruefe('Anzahl je Game', anzahl.leitungsfinder === 5 && anzahl.kuechen_fit === 4, JSON.stringify(anzahl))
  pruefe('A: nur Bestlauf zaehlt, 5000', nach[A].gesamt === 5000 && nach[A].spiele.leitungsfinder.score === 500)
  pruefe('Gleichstand teilt Platz', nach[B].spiele.leitungsfinder.platz === 2 && nach[C].spiele.leitungsfinder.platz === 2)
  pruefe('B und C je 3584', nach[B].gesamt === 3584 && nach[C].gesamt === 3584, `${nach[B].gesamt}/${nach[C].gesamt}`)
  pruefe('Frueher erreicht gewinnt Gleichstand', teilnehmer.findIndex((t) => t.id === B) < teilnehmer.findIndex((t) => t.id === C))
  pruefe('D nicht qualifiziert (3/5)', nach[D].qualifiziert === false && nach[D].gespielt === 3)
  pruefe('Qualifizierte zuerst', teilnehmer.slice(0, 4).every((t) => t.qualifiziert) && teilnehmer[4].id === D)
  pruefe('Letzter Platz 0 Rangpunkte', nach[E].gesamt === 0)
}

/* 3. Oeffentliche Liste */
frisch()
rufe = []
{
  const r = await gr.gesamtranking()
  pruefe('4 Qualifizierte', r.gesamtZahl === 4 && r.eintraege.length === 4, String(r.gesamtZahl))
  pruefe('Reihenfolge A, B, C, anonym', r.eintraege.map((e) => e.instagram).join(',') === 'anna_test,bert_test,cora_test,')
  pruefe('Ohne Einwilligung: echter Platz, kein Name', r.eintraege[3].platz === 4 && r.eintraege[3].instagram === null)
  pruefe('Punkte oeffentlich', r.eintraege[0].punkte === 5000 && r.eintraege[2].punkte === 3584)
  pruefe('Keine E-Mail/Deckel/ids im JSON', !privat(r) && !JSON.stringify(r).includes(A))
  pruefe('Ohne eigene id kein eigen', r.eigen === null && r.eintraege.every((e) => e.ich === false))
  pruefe('Preise leer, nicht erfunden', r.preise[1] === null && r.preise[2] === null && r.preise[3] === null)
  pruefe('Offen', r.abgeschlossen === false)
  /* Nur die Namensabfragen sind gemeint. Seit den Einladungen liest das
     Modul zusaetzlich die Gast-ids (select=id, ohne Namen) — die duerfen
     naturgemaess keine Ranglistenfreigabe verlangen. */
  const namensrufe = rufe.filter((x) => x.pfad.endsWith('_teilnehmer') && x.suche.includes('instagram_handle'))
  pruefe('Namen nur mit leaderboard_ok',
    namensrufe.length > 0 && namensrufe.every((x) => x.suche.includes('leaderboard_ok=is.true') && !x.suche.includes('email')))
  pruefe('Namen nur von offiziellen Teilnehmern',
    namensrufe.every((x) => x.suche.includes('teilnahme_status=eq.offiziell')))
  pruefe('Keine E-Mail in irgendeiner Teilnehmerabfrage',
    rufe.filter((x) => x.pfad.endsWith('_teilnehmer')).every((x) => !x.suche.includes('email')))
  pruefe('Nur gueltige Laeufe gelesen', rufe.filter((x) => x.pfad.endsWith('_scores')).every((x) => x.suche.includes('status=eq.gueltig')))
}

/* 4. Eigener Stand */
{
  frisch()
  const c = await gr.gesamtranking(C)
  pruefe('C: Platz 3, 3584', c.eigen.platz === 3 && c.eigen.punkte === 3584 && c.eintraege[2].ich === true)
  pruefe('C: Luecke 1417 bis Platz 1', c.eigen.bisPlatz === 1 && c.eigen.luecke === 1417, `${c.eigen.bisPlatz}/${c.eigen.luecke}`)
  pruefe('C: oeffentlich, 5 Games, max 5000', c.eigen.oeffentlich === true && c.eigen.gespielt === 5 && c.eigen.max === 5000 && c.gelistet === true)
  pruefe('C: Spielzeile', c.eigen.spiele[3].key === 'videko_jump' && c.eigen.spiele[3].rangpunkte === 667 && c.eigen.spiele[3].von === 4)

  const d = await gr.gesamtranking(D)
  pruefe('D: kein Platz, 3/5', d.eigen.platz === null && d.eigen.punkte === null && d.eigen.gespielt === 3 && d.gelistet === false)
  pruefe('D: fehlende Games', d.eigen.fehlende.join(',') === 'videko_jump,kuechen_fit', d.eigen.fehlende.join(','))
  pruefe('D: Zwischenstand 750', d.eigen.zwischenstand === 750)

  const e = await gr.gesamtranking(E)
  pruefe('E: Platz 4, nicht oeffentlich', e.eigen.platz === 4 && e.eigen.oeffentlich === false && e.gelistet === false)
  pruefe('E: Luecke bis Platz 3', e.eigen.bisPlatz === 3 && e.eigen.luecke === 3585)

  const a = await gr.gesamtranking(A)
  pruefe('A: Spitze ohne Luecke', a.eigen.platz === 1 && a.eigen.bisPlatz === null && a.eigen.luecke === null)

  const x = await gr.gesamtranking('keine-uuid')
  pruefe('Ungueltige id: kein eigen', x.eigen === null)
}

/* 5. Virtuell (Testlabor) */
{
  frisch()
  const v = await gr.gesamtranking(null, Object.fromEntries(G.map((g) => [g, 450])))
  pruefe('Virtuell: 3900, Platz 2 von 5', v.eigen.punkte === 3900 && v.eigen.platz === 2 && v.eigen.von === 5, `${v.eigen.punkte}/${v.eigen.platz}`)
  pruefe('Virtuell: Luecke 1101', v.eigen.bisPlatz === 1 && v.eigen.luecke === 1101)
  pruefe('Virtuell: probe, nicht gelistet, Liste unveraendert', v.eigen.probe === true && v.gelistet === false && v.gesamtZahl === 4)

  const teil = await gr.gesamtranking(null, { leitungsfinder: 450, kuechen_merge: 0, kuechen_crush: null })
  pruefe('Virtuell: null = nicht gespielt, 0 = gespielt', teil.eigen.gespielt === 2 && teil.eigen.fehlende.join(',') === 'kuechen_crush,videko_jump,kuechen_fit')
  pruefe('Virtuell: ohne alle 5 kein Platz', teil.eigen.platz === null)

  const gleich = await gr.gesamtranking(null, Object.fromEntries(G.map((g) => [g, 500])))
  pruefe('Virtuell: Gleichstand steht hinten', gleich.eigen.punkte === 5000 && gleich.eigen.platz === 2)
}

/* 6. Doppelt-Hinweis */
{
  const h = gr.doppelteTop3([
    { email: 'x', instagram: 'a' },
    { email: 'x', instagram: 'b' },
    { email: '', instagram: 'a' },
  ])
  pruefe('Doppelt: E-Mail 1+2, Instagram 1+3', h.length === 2 && h[0].plaetze.join() === '1,2' && h[1].plaetze.join() === '1,3')
  pruefe('Doppelt: leere Werte zaehlen nicht', gr.doppelteTop3([{ email: '', instagram: '' }, { email: '', instagram: '' }]).length === 0)
}

/* 7. Admin-Ansicht */
{
  const r = await adminRuf({ aktion: 'gesamtranking' })
  const b = r.body
  pruefe('Admin gesamtranking 200', r.code === 200 && b?.ok === true, String(r.code))
  pruefe('Admin: Top mit Namen, auch ohne Einwilligung', b.top[3].instagram === 'emil_test' && b.top[3].oeffentlich === false)
  pruefe('Admin: Werte je Game', b.top[0].spiele.kuechen_fit.rangpunkte === 1000)
  pruefe('Admin: Verdacht mit Platz', b.verdacht.length === 1 && b.verdacht[0].platz === 2 && b.verdacht[0].instagram === 'bert_test')
  pruefe('Admin: Doppelt-Hinweis ohne Adresse', b.doppelt.length === 1 && b.doppelt[0].plaetze.join() === '1,3' && b.doppelt[0].art === 'gleiche E-Mail')
  const { pruefung, ...ohnePruefung } = b
  pruefe('Admin: keine E-Mail/Deckel ausserhalb der Top-3-Pruefung', !privat(ohnePruefung), JSON.stringify(ohnePruefung).slice(0, 80))
  pruefe('Admin: Top-3-Pruefung ohne E-Mail', !/@test\.invalid|email/i.test(JSON.stringify(pruefung)))
  pruefe('Admin: Top-3-Pruefung 3 Plaetze, je 5 Games', pruefung.length === 3 && pruefung.every((p) => p.spiele.length === 5 && p.spiele.every((s) => G.includes(s.key))))
  pruefe('Admin: Top-3 Deckel und Anspruch (nur Admin)', pruefung[0].deckel === 9001 && pruefung[1].deckel === 9002 && pruefung[1].anspruchArt === 'weiterer_besitzanspruch' && pruefung[1].besitzStatus === 'bestaetigt')
  pruefe('Admin: Top-3 verdaechtiger Run bei Platz 2', pruefung[1].verdacht.length === 1 && pruefung[1].verdacht[0].id === 'lauf-v1' && pruefung[0].verdacht.length === 0)
  pruefe('Admin: Top-3 Doppelung bei Platz 1 und 3', pruefung[0].doppelt[0]?.mitPlatz === 3 && pruefung[2].doppelt[0]?.mitPlatz === 1 && pruefung[1].doppelt.length === 0)
  pruefe('Admin: Testslot ohne Eintrag leer, kein Tinder-Fallback', b.testslot === null && b.hauptgames.join() === G.join())

  const leer = kern.spieleAktivSaeubern({}, { hauptgames: G, testslot: null })
  pruefe('Sichtbarkeit: ohne Testslot nur 5 Hauptgames', G.every((g) => leer[g] === true) && Object.entries(leer).filter(([, an]) => an).length === 5, JSON.stringify(leer))
  const mitSlot = kern.spieleAktivSaeubern({}, { hauptgames: G, testslot: 'kuechen_tinder' })
  pruefe('Sichtbarkeit: konfigurierter Testslot sichtbar', mitSlot.kuechen_tinder === true)
  const aus = kern.spieleAktivSaeubern({ kuechen_fit: false }, { hauptgames: G, testslot: null })
  pruefe('Sichtbarkeit: expliziter Schalter gewinnt', aus.kuechen_fit === false)
}

/* 8. Admin-Einstellungen */
{
  const posts = () => rufe.filter((x) => x.methode === 'POST' && x.pfad.endsWith('_einstellungen'))

  rufe = []
  let r = await adminRuf({ aktion: 'einstellungen', hauptgames: G.slice(0, 4) })
  pruefe('4 Hauptgames → felder', r.code === 400 && r.body.grund === 'felder' && posts().length === 0)

  r = await adminRuf({ aktion: 'einstellungen', hauptgames: [...G.slice(0, 4), G[0]] })
  pruefe('Doppeltes Hauptgame → felder', r.code === 400 && r.body.grund === 'felder')

  r = await adminRuf({ aktion: 'einstellungen', hauptgames: [...G.slice(0, 4), 'gibts_nicht'] })
  pruefe('Unbekanntes Game → felder', r.code === 400 && r.body.grund === 'felder')

  r = await adminRuf({ aktion: 'einstellungen', testslot: 'leitungsfinder' })
  pruefe('Testslot als Hauptgame → felder', r.code === 400 && r.body.grund === 'felder' && posts().length === 0)

  r = await adminRuf({ aktion: 'einstellungen', preisGesamt1: '  Kochkurs fuer zwei ', preisGesamt2: '' })
  pruefe('Preise gespeichert, leer = null', r.code === 200 && posts().at(-1).body.preis_gesamt_1 === 'Kochkurs fuer zwei' && posts().at(-1).body.preis_gesamt_2 === null)
  pruefe('Preise in der Antwort', r.body.einstellungen?.gesamtranking?.preise?.[1] === 'Kochkurs fuer zwei')
  frisch()
  const oeff = await gr.gesamtranking()
  pruefe('Preis oeffentlich sichtbar', oeff.preise[1] === 'Kochkurs fuer zwei' && oeff.preise[3] === null)

  const W = gr.HAUPTGAME_BESTAETIGUNG
  pruefe('Bestaetigungswort', W === 'HAUPTGAME WIRKLICH ÄNDERN')

  /* Testslot setzen → sichtbar */
  rufe = []
  r = await adminRuf({ aktion: 'einstellungen', testslot: 'kuechen_tinder' })
  pruefe('Testslot setzen', r.code === 200 && posts().at(-1).body.testslot_game === 'kuechen_tinder' && posts().at(-1).body.spiele_aktiv?.kuechen_tinder === true)
  pruefe('Testslot: kein Protokoll', protokolle.length === 0)

  /* Testslot kuechen_tinder wird Hauptgame — es gibt schon Runs */
  const neu = [...G.slice(0, 4), 'kuechen_tinder']
  frisch()
  rufe = []
  r = await adminRuf({ aktion: 'einstellungen', hauptgames: neu })
  pruefe('Hauptgame aendern ohne Bestaetigung → bestaetigung', r.code === 400 && r.body.grund === 'bestaetigung' && r.body.teilnehmerZahl === 5, JSON.stringify(r.body))
  pruefe('Ohne Bestaetigung: nichts gespeichert, nichts protokolliert', posts().length === 0 && protokolle.length === 0)

  r = await adminRuf({ aktion: 'einstellungen', hauptgames: neu, bestaetigung: 'ja' })
  pruefe('Falsches Bestaetigungswort → bestaetigung', r.code === 400 && r.body.grund === 'bestaetigung' && posts().length === 0)

  protokollKaputt = true
  r = await adminRuf({ aktion: 'einstellungen', hauptgames: neu, bestaetigung: W })
  pruefe('Protokoll schlaegt fehl → server, nichts gespeichert', r.code >= 400 && r.body.grund === 'server' && posts().length === 0)
  protokollKaputt = false

  rufe = []
  r = await adminRuf({ aktion: 'einstellungen', hauptgames: neu, bestaetigung: W })
  const pb = posts().at(-1)?.body
  pruefe('Hauptgames getauscht', r.code === 200 && pb?.gesamtranking_spiele?.join() === neu.join())
  pruefe('Alter Testslot wird Hauptgame → null', pb && 'testslot_game' in pb && pb.testslot_game === null)
  const iProt = rufe.findIndex((x) => x.methode === 'POST' && x.pfad.endsWith('_protokoll'))
  const iEinst = rufe.findIndex((x) => x.methode === 'POST' && x.pfad.endsWith('_einstellungen'))
  pruefe('Erst Protokoll, dann Speichern', iProt >= 0 && iEinst > iProt)
  const pr = protokolle.at(-1)
  pruefe('Protokoll: vorher/nachher/bestaetigt/Zahl', protokolle.length === 1 && pr.art === 'hauptgames' && pr.vorher.join() === G.join() && pr.nachher.join() === neu.join() && pr.bestaetigt === true && pr.teilnehmer_zahl === 5)
  pruefe('Protokoll ohne Personendaten', !privat(pr))
  pruefe('Sichtbarkeit folgt: Tinder an, Fit aus', pb?.spiele_aktiv?.kuechen_tinder === true && pb?.spiele_aktiv?.kuechen_fit === false)

  frisch()
  r = await adminRuf({ aktion: 'einstellungen', hauptgames: G, testslot: 'kuechen_tinder', bestaetigung: W })
  pruefe('Zurueck mit Testslot', r.code === 200 && posts().at(-1).body.testslot_game === 'kuechen_tinder' && posts().at(-1).body.spiele_aktiv?.kuechen_fit === true && posts().at(-1).body.spiele_aktiv?.kuechen_tinder === true)
  pruefe('Zweiter Eintrag im Protokoll', protokolle.length === 2)

  /* Testslot leeren → wirklich leer und ausgeblendet */
  r = await adminRuf({ aktion: 'einstellungen', testslot: '' })
  pruefe('Testslot leeren', r.code === 200 && posts().at(-1).body.testslot_game === null && posts().at(-1).body.spiele_aktiv?.kuechen_tinder === false)
  pruefe('Testslot leer in der Antwort', r.body.einstellungen?.gesamtranking?.testslot === null && r.body.einstellungen?.spieleAktiv?.kuechen_tinder === false)

  /* Scores nicht lesbar → sicherheitshalber Bestaetigung verlangen */
  frisch()
  scoresKaputt = true
  r = await adminRuf({ aktion: 'einstellungen', hauptgames: neu })
  pruefe('Lesefehler → Bestaetigung verlangt, Zahl unbekannt', r.code === 400 && r.body.grund === 'bestaetigung' && r.body.teilnehmerZahl === null)
  scoresKaputt = false

  /* Noch keine Runs → ohne zweite Bestaetigung, aber protokolliert */
  const gemerkt = laeufe
  laeufe = []
  frisch()
  r = await adminRuf({ aktion: 'einstellungen', hauptgames: neu })
  pruefe('Ohne Runs: aendern ohne Bestaetigung', r.code === 200 && protokolle.at(-1).bestaetigt === false && protokolle.at(-1).teilnehmer_zahl === 0)
  r = await adminRuf({ aktion: 'einstellungen', hauptgames: G })
  pruefe('Ohne Runs: zurueck', r.code === 200 && protokolle.length === 4)
  laeufe = gemerkt
  frisch()
}

/* 9. Abschliessen */
{
  frisch()
  scoresKaputt = true
  rufe = []
  let r = await adminRuf({ aktion: 'gr-abschliessen' })
  pruefe('Lesefehler → 500, kein Snapshot', r.code === 500 && r.body.grund === 'server' && snapshots.length === 0)
  pruefe('Lesefehler: nichts abgeschlossen', !einstellungenZeile.gesamtranking_abgeschlossen_am)
  pruefe('Status nicht im Body', !('status' in r.body))
  scoresKaputt = false

  rufe = []
  r = await adminRuf({ aktion: 'gr-abschliessen' })
  pruefe('Abschliessen 200', r.code === 200 && r.body.ok === true && r.body.qualifiziert === 4, JSON.stringify(r.body))
  pruefe('Snapshot geschrieben, ohne E-Mail/Deckel', snapshots.length === 1 && !privat(snapshots[0]), String(JSON.stringify(snapshots[0]).match(/@test\.invalid|email|deckel_nummer|900[1-5]/i)))
  pruefe('Snapshot: Spiele und Teilnehmer', snapshots[0].spiele.join() === G.join() && snapshots[0].daten.teilnehmer.length === 5)
  const iSnap = rufe.findIndex((x) => x.methode === 'POST' && x.pfad.endsWith('_snapshot'))
  const iEin = rufe.findIndex((x) => x.methode === 'POST' && x.pfad.endsWith('_einstellungen'))
  pruefe('Erst Snapshot, dann Zeitpunkt', iSnap >= 0 && iEin > iSnap && rufe[iEin].body.gesamtranking_abgeschlossen_am)
  pruefe('Keine Score-Zeile geaendert', !rufe.some((x) => x.pfad.endsWith('_scores') && x.methode !== 'GET'))

  r = await adminRuf({ aktion: 'gr-abschliessen' })
  pruefe('Zweites Abschliessen → 409', r.code === 409 && r.body.grund === 'abgeschlossen' && snapshots.length === 1)

  /* Nach dem Abschluss: spaetere Laeufe aendern nichts */
  laeufe.push({ teilnehmer_id: D, game: 'videko_jump', score: 9999, created_at: '2026-09-10T10:00:00.000Z' })
  laeufe.push({ teilnehmer_id: D, game: 'kuechen_fit', score: 9999, created_at: '2026-09-10T10:00:00.000Z' })
  frisch()
  const s = await gr.gesamtranking(D)
  pruefe('Snapshot gilt: D bleibt draussen', s.abgeschlossen === true && s.gesamtZahl === 4 && s.eigen.platz === null)
  pruefe('Snapshot gilt: Top unveraendert', s.eintraege[0].instagram === 'anna_test' && s.eintraege[0].punkte === 5000)
  pruefe('Abgeschlossen-Zeitpunkt oeffentlich', typeof s.abgeschlossenAm === 'string')

  const vorProt = protokolle.length
  r = await adminRuf({ aktion: 'einstellungen', hauptgames: [...G.slice(0, 4), 'kuechen_tinder'] })
  pruefe('Abgeschlossen + andere Hauptgames → abgeschlossen', r.code === 400 && r.body.grund === 'abgeschlossen')
  r = await adminRuf({ aktion: 'einstellungen', hauptgames: [...G.slice(0, 4), 'kuechen_tinder'], bestaetigung: gr.HAUPTGAME_BESTAETIGUNG })
  pruefe('Abgeschlossen: auch mit Bestaetigung gesperrt', r.code === 400 && r.body.grund === 'abgeschlossen' && protokolle.length === vorProt)
  r = await adminRuf({ aktion: 'einstellungen', hauptgames: G })
  pruefe('Abgeschlossen + gleiche Hauptgames → ok', r.code === 200)
  r = await adminRuf({ aktion: 'einstellungen', preisGesamt3: 'Messerset' })
  pruefe('Abgeschlossen: Preise weiter pflegbar', r.code === 200)
}

const kind = spawnSync(process.execPath, [fileURLToPath(import.meta.url), 'pause'], { encoding: 'utf8' })
process.stdout.write(kind.stdout.split('\n').filter((z) => /^(OK|FEHL)/.test(z)).map((z) => `  ${z}`).join('\n') + '\n')
pruefe('Notbremse-Pruefungen bestanden', kind.status === 0, kind.stderr?.slice(0, 200))

console.log(`\n${gesamt - fehler}/${gesamt} Pruefungen bestanden`)
process.exit(fehler ? 1 : 0)

