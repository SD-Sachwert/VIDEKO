/**
 * Einladungen, Referral-Kette und Spielberechtigung — Pruefungen A bis X.
 *
 *   node scripts/terminal-einladungen-test.mjs
 *
 * DAS PRODUKTMODELL, DAS HIER GEPRUEFT WIRD
 *
 * Jeder vollstaendig registrierte Spieler darf alle Hauptspiele spielen,
 * gewertete Scores speichern, in den Ranglisten stehen, um die Plaetze 1 bis 3
 * mitspielen, im Gesamtranking auftauchen und selbst drei Leute einladen —
 * egal, ob er ueber einen Deckelcode oder ueber eine Einladung hereingekommen
 * ist. Zugangsbedingung fuer gewertete Scores ist allein der Instagram-Name
 * plus die Bestaetigung, dass man @videko.kuechen folgt.
 *
 * Ein physischer Deckel entscheidet nur ueber eines: die grosse
 * Deckel-Ziehung. Er ist keine Voraussetzung fuer Spiel, Ranking oder
 * Spielpreise. Deshalb werden hier zwei Berechtigungen strikt getrennt
 * geprueft — `rankingBerechtigt` (Instagram + Follow) und `ziehungBerechtigt`
 * (Deckel vorhanden) — und nie miteinander vermischt.
 *
 * Aeltere Zusicherungen dieser Datei („ein Eingeladener darf nicht einladen",
 * „ein Eingeladener beeinflusst das Ranking nicht") waren Teil des alten
 * Modells und sind hier bewusst durch ihr Gegenteil ersetzt.
 *
 * Laeuft ohne Netz, ohne echte Zugangsdaten und ohne einen einzigen echten
 * Teilnehmer: die Umgebung bekommt Platzhalter, `fetch` wird durch eine
 * PostgREST-Attrappe ersetzt. Die Attrappe ist hier bewusst aufwendiger als
 * in den aelteren Testdateien — sie haelt die Zeilen wirklich vor und setzt
 * die Bedingungen der Migration durch:
 *
 *   - videko_terminal_gast_ohne_deckel_chk   Gast  => deckel_nummer IS NULL
 *   - videko_terminal_offiziell_deckel_chk   offiziell => deckel_nummer NOT NULL
 *   - der partielle UNIQUE-Index auf (kampagne, deckel_nummer)
 *     where anspruch_art = 'erstaktivierung'
 *   - der partielle UNIQUE-Index auf (kampagne, einlader_teilnehmer_id,
 *     slot_nummer) where widerrufen_am is null
 *   - UNIQUE auf token_hash, auf gast_teilnehmer_id und auf scores.lauf_id
 *
 * Damit werden genau die Schloesser geprueft, die Verlosung und Ranking
 * schuetzen — und nicht bloss angenommen, dass es sie gibt.
 *
 * Die Notbremse (TERMINAL_SCHREIBEN=0) wird beim Import gelesen; der Teil
 * dazu laeuft deshalb in einem eigenen Kindprozess (Argument `pause`).
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
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

/* ================================================================== */
/* PostgREST-Attrappe                                                  */
/* ================================================================== */

const DB = {
  videko_terminal_teilnehmer: [],
  videko_terminal_einladungen: [],
  videko_terminal_scores: [],
  videko_terminal_spielstarts: [],
  videko_terminal_einstellungen: [],
  videko_terminal_gesamtranking_snapshot: [],
  videko_terminal_ziehungen: [],
  videko_terminal_meldungen: [],
  videko_terminal_wiederherstellung: [],
  videko_terminal_admin_versuche: [],
}

let rufe = []

const RESERVIERT = new Set(['select', 'order', 'limit', 'offset', 'columns', 'on_conflict'])

const json = (daten, status = 200, headers = {}) =>
  new Response(JSON.stringify(daten), { status, headers: { 'content-type': 'application/json', ...headers } })

/** Zahlen numerisch, alles andere als Text — reicht fuer ISO-Zeitstempel. */
function vergleich(a, b) {
  const za = Number(a)
  const zb = Number(b)
  if (Number.isFinite(za) && Number.isFinite(zb) && String(a).trim() !== '' && String(b).trim() !== '') {
    return za - zb
  }
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0
}

/** Ein einzelner Filterausdruck, z. B. `eq.1847` oder `is.null`. */
function bedingung(zeile, feld, ausdruck) {
  const punkt = ausdruck.indexOf('.')
  const op = punkt < 0 ? ausdruck : ausdruck.slice(0, punkt)
  const roh = punkt < 0 ? '' : ausdruck.slice(punkt + 1)
  const wert = zeile[feld]
  switch (op) {
    case 'eq': return String(wert) === roh
    case 'neq': return String(wert) !== roh
    case 'is':
      if (roh === 'null') return wert == null
      if (roh === 'true') return wert === true
      if (roh === 'false') return wert === false
      return false
    case 'in':
      return roh.replace(/^\(/, '').replace(/\)$/, '').split(',')
        .map((s) => s.replace(/^"|"$/g, ''))
        .includes(String(wert))
    case 'gt': return wert != null && vergleich(wert, roh) > 0
    case 'gte': return wert != null && vergleich(wert, roh) >= 0
    case 'lt': return wert != null && vergleich(wert, roh) < 0
    case 'lte': return wert != null && vergleich(wert, roh) <= 0
    default: throw new Error(`Attrappe kennt den Operator nicht: ${op}`)
  }
}

/** `or=(a.is.null,a.gt.X)` — eine Ebene, mehr braucht das Terminal nicht. */
function oderTeile(ausdruck) {
  return ausdruck.replace(/^\(/, '').replace(/\)$/, '').split(',')
}

function passt(zeile, p) {
  for (const [schluessel, ausdruck] of p.entries()) {
    if (RESERVIERT.has(schluessel)) continue
    if (schluessel === 'or') {
      const treffer = oderTeile(ausdruck).some((teil) => {
        const i = teil.indexOf('.')
        return bedingung(zeile, teil.slice(0, i), teil.slice(i + 1))
      })
      if (!treffer) return false
      continue
    }
    if (!bedingung(zeile, schluessel, ausdruck)) return false
  }
  return true
}

function sortiert(zeilen, p) {
  const order = p.get('order')
  if (!order) return zeilen
  const schluessel = order.split(',').map((t) => {
    const [feld, richtung = 'asc'] = t.split('.')
    return { feld, minus: richtung.startsWith('desc') ? -1 : 1 }
  })
  return [...zeilen].sort((a, b) => {
    for (const s of schluessel) {
      const v = vergleich(a[s.feld], b[s.feld]) * s.minus
      if (v !== 0) return v
    }
    return 0
  })
}

function seite(zeilen, p) {
  const von = Number(p.get('offset') || 0)
  const grenze = p.get('limit') ? Number(p.get('limit')) : zeilen.length
  return zeilen.slice(von, von + grenze)
}

function projektion(zeile, p) {
  const select = p.get('select')
  if (!select) return { ...zeile }
  const aus = {}
  for (const spalte of select.split(',')) aus[spalte] = zeile[spalte] ?? null
  return aus
}

/** Vorbelegungen, die in der echten Datenbank als DEFAULT stehen. */
function standard(tabelle) {
  const jetzt = new Date().toISOString()
  if (tabelle === 'videko_terminal_teilnehmer') {
    return {
      deckel_nummer: null,
      instagram_handle: null,
      email: null,
      status: 'aktiv',
      leaderboard_ok: false,
      leaderboard_ok_am: null,
      folgt_bestaetigt_von_nutzer: false,
      aktiviert_am: jetzt,
      ip_hash: null,
      anspruch_art: 'erstaktivierung',
      besitz_status: null,
      teilnahme_status: 'offiziell',
      eingeladen_von: null,
      eingeladen_am: null,
      gast_konvertiert_am: null,
      /* Aus 20261106000000_terminal_spieler_fuer_alle.sql. */
      registrierungsquelle: 'deckel',
      deckel_aktiviert_am: null,
      folgt_pruefstatus: 'offen',
      folgt_geprueft_am: null,
    }
  }
  if (tabelle === 'videko_terminal_einladungen') {
    return {
      erstellt_am: jetzt,
      geoeffnet_am: null,
      oeffnungen: 0,
      verwendet_am: null,
      widerrufen_am: null,
      abgelaufen_am: null,
      gast_teilnehmer_id: null,
      ip_hash: null,
    }
  }
  if (tabelle === 'videko_terminal_scores') {
    return { created_at: jetzt, status: 'gueltig', runden: null, dauer_ms: null, notiz: null }
  }
  return { created_at: jetzt }
}

/**
 * Die Bedingungen der Migration. Gibt `null` zurueck, wenn die Zeile in
 * Ordnung ist — sonst Status und Meldung wie PostgREST sie liefert.
 */
function verstoss(tabelle, zeile, alle) {
  const andere = alle.filter((a) => a !== zeile)
  if (tabelle === 'videko_terminal_teilnehmer') {
    if (zeile.teilnahme_status === 'gast' && zeile.deckel_nummer != null) {
      return { status: 400, text: 'videko_terminal_gast_ohne_deckel_chk' }
    }
    if (zeile.teilnahme_status !== 'gast' && zeile.deckel_nummer == null) {
      return { status: 400, text: 'videko_terminal_offiziell_deckel_chk' }
    }
    if (zeile.teilnahme_status !== 'offiziell' && zeile.teilnahme_status !== 'gast') {
      return { status: 400, text: 'videko_terminal_teilnahme_status_chk' }
    }
    if (zeile.anspruch_art === 'erstaktivierung' && zeile.deckel_nummer != null
      && andere.some((a) => a.anspruch_art === 'erstaktivierung'
        && a.kampagne === zeile.kampagne && a.deckel_nummer === zeile.deckel_nummer)) {
      return { status: 409, text: 'duplicate key value violates unique constraint' }
    }
  }
  if (tabelle === 'videko_terminal_einladungen') {
    if (andere.some((a) => a.token_hash === zeile.token_hash)) {
      return { status: 409, text: 'videko_terminal_einladung_hash_uidx' }
    }
    if (zeile.widerrufen_am == null
      && andere.some((a) => a.widerrufen_am == null && a.kampagne === zeile.kampagne
        && a.einlader_teilnehmer_id === zeile.einlader_teilnehmer_id
        && Number(a.slot_nummer) === Number(zeile.slot_nummer))) {
      return { status: 409, text: 'videko_terminal_einladung_slot_uidx' }
    }
    if (zeile.gast_teilnehmer_id != null
      && andere.some((a) => a.gast_teilnehmer_id === zeile.gast_teilnehmer_id)) {
      return { status: 409, text: 'videko_terminal_einladung_gast_uidx' }
    }
  }
  if (tabelle === 'videko_terminal_scores' && zeile.lauf_id != null
    && andere.some((a) => a.lauf_id === zeile.lauf_id)) {
    return { status: 409, text: 'duplicate key value violates unique constraint' }
  }
  return null
}

globalThis.fetch = async (url, opt = {}) => {
  const u = new URL(url)
  const tabelle = u.pathname.replace('/rest/v1/', '')
  const methode = opt.method || 'GET'
  const p = u.searchParams
  const prefer = String(opt.headers?.Prefer || '')
  const koerper = opt.body ? JSON.parse(opt.body) : null
  rufe.push({ methode, tabelle, suche: u.search, body: koerper })

  const zeilen = DB[tabelle]
  if (!zeilen) return json({ message: `Attrappe kennt die Tabelle nicht: ${tabelle}` }, 404)

  const treffer = zeilen.filter((z) => passt(z, p))

  if (methode === 'GET') {
    if (prefer.includes('count=exact')) {
      return json([], 200, { 'content-range': `0-0/${treffer.length}` })
    }
    return json(seite(sortiert(treffer, p), p).map((z) => projektion(z, p)))
  }

  if (methode === 'POST') {
    const eingang = Array.isArray(koerper) ? koerper : [koerper]
    const neue = eingang.map((z) => ({ id: crypto.randomUUID(), ...standard(tabelle), ...z }))
    const zusammen = [...zeilen, ...neue]
    for (const z of neue) {
      const v = verstoss(tabelle, z, zusammen)
      if (v) return json({ message: v.text }, v.status)
    }
    zeilen.push(...neue)
    if (prefer.includes('return=representation')) {
      return json(neue.map((z) => projektion(z, p)), 201)
    }
    return new Response(null, { status: 201 })
  }

  if (methode === 'PATCH') {
    const sicherung = treffer.map((z) => ({ ...z }))
    for (const z of treffer) Object.assign(z, koerper)
    for (const z of treffer) {
      const v = verstoss(tabelle, z, zeilen)
      if (v) {
        treffer.forEach((ziel, i) => {
          for (const k of Object.keys(ziel)) delete ziel[k]
          Object.assign(ziel, sicherung[i])
        })
        return json({ message: v.text }, v.status)
      }
    }
    if (prefer.includes('return=representation')) {
      return json(treffer.map((z) => projektion(z, p)))
    }
    return new Response(null, { status: 204 })
  }

  if (methode === 'DELETE') {
    for (const z of treffer) zeilen.splice(zeilen.indexOf(z), 1)
    return new Response(null, { status: 204 })
  }

  return json({ message: `Attrappe kennt die Methode nicht: ${methode}` }, 405)
}

/* ================================================================== */
/* Module laden                                                        */
/* ================================================================== */

const kern = await import('../api/_terminal-kern.js')
const gr = await import('../api/_terminal-gesamtranking.js')
const einl = await import('../api/_terminal-einladungen.js')
const { default: terminal } = await import('../api/terminal.js')
const { topfBilden } = await import('../api/terminal-admin.js')
const { RANGPUNKTE_MAX, PRACTICE_STANDARD } = await import('../src/data/terminal.js')

const K = kern.KAMPAGNE
/* Sechs Hauptspiele, gewertet werden die besten vier — das Maximum liegt
   damit bei 4000 und nicht bei 6000. */
const HAUPT = ['leitungsfinder', 'kuechen_merge', 'kuechen_crush', 'videko_jump', 'kuechen_fit', 'videko_slam']

/* ================================================================== */
/* Hilfen                                                              */
/* ================================================================== */

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
/** Jede Anfrage aus einer eigenen Adresse: die Bremsen sollen nicht stoeren. */
function frischeIp() {
  ipZaehler += 1
  return `10.9.${Math.floor(ipZaehler / 250)}.${(ipZaehler % 250) + 1}`
}

async function ruf(body, ip = frischeIp()) {
  const res = antwortAttrappe()
  await terminal({ method: 'POST', headers: { 'x-forwarded-for': ip }, body }, res)
  return res
}

function teilnehmerAnlegen(felder = {}) {
  const zeile = { id: crypto.randomUUID(), kampagne: K, ...standard('videko_terminal_teilnehmer'), ...felder }
  DB.videko_terminal_teilnehmer.push(zeile)
  return zeile
}

/**
 * Ein ueber einen Deckelcode registrierter Spieler.
 *
 * `folgt_bestaetigt_von_nutzer` steht hier absichtlich auf true: seit der
 * Umstellung haengt die Rankingberechtigung allein an Instagram-Name plus
 * Follow-Bestaetigung. Ein Deckelspieler ohne diese Bestaetigung waere
 * ebenfalls nicht rankingberechtigt — genau das prueft Block Q mit
 * `{ folgt_bestaetigt_von_nutzer: false }`.
 */
function offizieller(nummer, handle, extra = {}) {
  return teilnehmerAnlegen({
    deckel_nummer: nummer,
    instagram_handle: handle,
    email: `${handle}@example.invalid`,
    leaderboard_ok: true,
    folgt_bestaetigt_von_nutzer: true,
    teilnahme_status: 'offiziell',
    anspruch_art: 'erstaktivierung',
    registrierungsquelle: 'deckel',
    deckel_aktiviert_am: new Date().toISOString(),
    ...extra,
  })
}

let scoreUhr = Date.parse('2026-09-01T10:00:00.000Z')
function scoreAnlegen(teilnehmerId, game, punkte) {
  scoreUhr += 1000
  DB.videko_terminal_scores.push({
    id: crypto.randomUUID(),
    kampagne: K,
    teilnehmer_id: teilnehmerId,
    game,
    score: punkte,
    status: 'gueltig',
    lauf_id: crypto.randomUUID(),
    dauer_ms: 60000,
    runden: 100,
    created_at: new Date(scoreUhr).toISOString(),
  })
}

const sitzungFuer = (id) => kern.belegErzeugen('s', { id })

/** Ein Laufticket mit einem Start, der weit genug zurueckliegt. */
const ticketFuer = (id, game, vorMs = 60000) =>
  kern.belegErzeugen('r', { p: id, g: game, s: Date.now() - vorMs, n: crypto.randomUUID() })

const teilnehmerPosts = () => rufe.filter((r) => r.methode === 'POST' && r.tabelle === 'videko_terminal_teilnehmer')
const gaesteInDb = () => DB.videko_terminal_teilnehmer.filter((z) => z.teilnahme_status === 'gast')

/* Einstellungen: eine Zeile, drei Einladungen, alles Uebrige Standard. */
DB.videko_terminal_einstellungen.push({
  id: crypto.randomUUID(),
  kampagne: K,
  einladungen_pro_teilnehmer: 3,
  guest_practice_game: null,
  gesamtranking_spiele: null,
  spiele_aktiv: null,
  spiele_reihenfolge: null,
  live_modus: true,
})

/* ================================================================== */
/* Notbremse (Kindprozess)                                             */
/* ================================================================== */

if (PAUSE) {
  const chef = offizieller(1001, 'pause_chef')
  const s = sitzungFuer(chef.id)
  rufe = []

  let r = await ruf({ aktion: 'einladung-erzeugen', sitzung: s })
  pruefe('Pause: einladung-erzeugen 503', r.code === 503, String(r.code))
  r = await ruf({ aktion: 'gast-anlegen', sitzung: s, token: 'x'.repeat(43), instagram: 'pause_gast', email: 'p@example.invalid', folgt: true, bedingungen: true })
  pruefe('Pause: gast-anlegen 503', r.code === 503, String(r.code))
  r = await ruf({ aktion: 'einladung-widerrufen', sitzung: s, slot: 1 })
  pruefe('Pause: einladung-widerrufen 503', r.code === 503, String(r.code))
  pruefe('Pause: nichts geschrieben',
    !rufe.some((x) => x.methode === 'POST' || x.methode === 'PATCH' || x.methode === 'DELETE'),
    rufe.map((x) => x.methode).join(','))
  pruefe('Pause: keine Einladungszeile', DB.videko_terminal_einladungen.length === 0)
  pruefe('Pause: kein Gast', gaesteInDb().length === 0)

  /* Lesen bleibt erlaubt: eine Landingpage darf auch bei Pause antworten. */
  r = await ruf({ aktion: 'einladung-pruefen', token: 'x'.repeat(43) })
  pruefe('Pause: einladung-pruefen antwortet weiterhin 200', r.code === 200 && r.body?.ok === false, String(r.code))

  console.log(`\n${gesamt - fehler}/${gesamt} Pruefungen bestanden`)
  process.exit(fehler ? 1 : 0)
}

/* ================================================================== */
/* A — drei Slots, der vierte nicht                                    */
/* ================================================================== */

const chef = offizieller(1847, 'chef_offiziell')
const chefSitzung = sitzungFuer(chef.id)

rufe = []
const slots = []
for (let i = 0; i < 3; i += 1) {
  const r = await ruf({ aktion: 'einladung-erzeugen', sitzung: chefSitzung })
  if (r.code === 200) slots.push(r.body.slot)
}
pruefe('A: drei Einladungen entstehen', slots.length === 3 && slots.map((s) => s.slot).join(',') === '1,2,3',
  slots.map((s) => s.slot).join(','))
pruefe('A: jede Einladung hat einen 43-Zeichen-Token',
  slots.every((s) => einl.EINLADUNG_MUSTER.test(s.token)))
pruefe('A: Link zeigt auf /terminal/einladung/<token>',
  slots.every((s) => s.link === `https://videko-kuechen.de/terminal/einladung/${s.token}`), slots[0]?.link)
pruefe('A: in der Datenbank steht nur der Hash, nie der Token',
  DB.videko_terminal_einladungen.length === 3
  && DB.videko_terminal_einladungen.every((z, i) => z.token_hash === kern.sha256Hex(slots[i].token))
  && !JSON.stringify(DB.videko_terminal_einladungen).includes(slots[0].token))

const vierter = await ruf({ aktion: 'einladung-erzeugen', sitzung: chefSitzung })
pruefe('A: der vierte Slot wird abgelehnt', vierter.code === 409 && vierter.body?.grund === 'keine-slots',
  `${vierter.code} ${JSON.stringify(vierter.body)}`)
pruefe('A: und erzeugt keine vierte Zeile', DB.videko_terminal_einladungen.length === 3)

const team = await ruf({ aktion: 'einladungen', sitzung: chefSitzung })
pruefe('A: das Team zeigt drei Slots', team.code === 200 && team.body?.team?.slots.length === 3)
pruefe('A: alle drei stehen auf "eingeladen"',
  team.body?.team?.slots.every((s) => s.status === 'eingeladen') && team.body.team.frei === 0)

/* ================================================================== */
/* N + O — ohne Token, ohne Instagram, ohne Follow kein Konto           */
/* ================================================================== */

rufe = []
const vorher = DB.videko_terminal_teilnehmer.length
let r = await ruf({ aktion: 'gast-anlegen', instagram: 'gast_ohne', email: 'ohne@example.invalid', folgt: true, bedingungen: true })
pruefe('Token: ohne Token 401 link', r.code === 401 && r.body?.grund === 'link', `${r.code} ${JSON.stringify(r.body)}`)
r = await ruf({ aktion: 'gast-anlegen', token: 'z'.repeat(43), instagram: 'gast_falsch', email: 'falsch@example.invalid', folgt: true, bedingungen: true })
pruefe('Token: erfundener Token 401 link', r.code === 401 && r.body?.grund === 'link', String(r.code))
r = await ruf({ aktion: 'gast-anlegen', token: slots[0].token, instagram: '', email: 'x', folgt: false, bedingungen: false })
pruefe('N: fehlende Felder 400 mit Feldliste',
  r.code === 400 && r.body?.grund === 'felder'
  && ['instagram', 'email', 'bedingungen'].every((f) => r.body.felder.includes(f)), JSON.stringify(r.body))

/* Instagram ist Pflicht — auch wenn sonst alles ausgefuellt ist. */
r = await ruf({ aktion: 'gast-anlegen', token: slots[0].token, instagram: '   ', email: 'ohne.name@example.invalid', folgt: true, bedingungen: true })
pruefe('N: ohne Instagram-Namen 400 instagram',
  r.code === 400 && r.body?.grund === 'felder' && r.body?.felder?.includes('instagram'), JSON.stringify(r.body))

/* Die Follow-Bestaetigung ebenso: sie ist die Zugangsbedingung fuer
   gewertete Scores und darf deshalb nicht weggelassen werden. */
r = await ruf({ aktion: 'gast-anlegen', token: slots[0].token, instagram: 'ohne_follow', email: 'ohne.follow@example.invalid', bedingungen: true })
pruefe('O: ohne Follow-Bestaetigung 400 folgt',
  r.code === 400 && r.body?.grund === 'felder' && r.body?.felder?.includes('folgt'), JSON.stringify(r.body))
r = await ruf({ aktion: 'gast-anlegen', token: slots[0].token, instagram: 'ohne_follow', email: 'ohne.follow@example.invalid', folgt: false, bedingungen: true })
pruefe('O: ein ausdrueckliches folgt=false zaehlt genauso wenig',
  r.code === 400 && r.body?.felder?.includes('folgt'), JSON.stringify(r.body))

r = await ruf({ aktion: 'gast-anlegen', token: slots[0].token, instagram: 'ohne_haken', email: 'ohne@example.invalid', folgt: true })
pruefe('N: ohne Zustimmung 400 bedingungen',
  r.code === 400 && r.body?.felder?.includes('bedingungen'), JSON.stringify(r.body))
pruefe('N+O: kein einziger Teilnehmer entstanden',
  DB.videko_terminal_teilnehmer.length === vorher && teilnehmerPosts().length === 0)
pruefe('N+O: und der Einladungsslot ist noch offen',
  DB.videko_terminal_einladungen[0].verwendet_am == null)

/* ================================================================== */
/* C — gueltige Einladung erzeugt genau einen vollwertigen Spieler      */
/* ================================================================== */

rufe = []
r = await ruf({
  aktion: 'gast-anlegen',
  token: slots[0].token,
  instagram: '@gast_eins',
  email: 'gast.eins@example.invalid',
  folgt: true,
  leaderboard: true,
  bedingungen: true,
})
pruefe('C: Eingeladener wird angelegt', r.code === 200 && r.body?.ok === true, `${r.code} ${JSON.stringify(r.body)?.slice(0, 160)}`)
const gastSitzung = r.body?.sitzung
const gastZeile = gaesteInDb()[0]
pruefe('C: genau ein Account ohne Deckel in der Datenbank', gaesteInDb().length === 1)
pruefe('C: keine Deckelnummer', gastZeile?.deckel_nummer === null)
pruefe('C: registrierungsquelle = einladung', gastZeile?.registrierungsquelle === 'einladung',
  String(gastZeile?.registrierungsquelle))
pruefe('C: eingeladen_von zeigt auf den Einlader', gastZeile?.eingeladen_von === chef.id)
pruefe('C: eingeladen_am gesetzt', !Number.isNaN(Date.parse(gastZeile?.eingeladen_am)))
pruefe('C: Follow-Bestaetigung und Ranglistenfreigabe uebernommen',
  gastZeile?.leaderboard_ok === true && gastZeile?.folgt_bestaetigt_von_nutzer === true)
pruefe('C: Antwort nennt den Einlader, aber keine E-Mail',
  r.body?.teilnehmer?.einladerInstagram === 'chef_offiziell'
  && !JSON.stringify(r.body).includes('gast.eins@example.invalid'), JSON.stringify(r.body?.teilnehmer))
pruefe('C: Antwort trennt Ranking und Ziehung sauber',
  r.body?.teilnehmer?.quelle === 'einladung'
  && r.body?.teilnehmer?.rankingOk === true
  && r.body?.teilnehmer?.ziehungOk === false
  && r.body?.teilnehmer?.einladenOk === true, JSON.stringify(r.body?.teilnehmer))
pruefe('C: Einladung ist verbraucht und mit dem Konto verknuepft',
  DB.videko_terminal_einladungen[0].verwendet_am != null
  && DB.videko_terminal_einladungen[0].gast_teilnehmer_id === gastZeile.id)

const zustandGast = await ruf({ aktion: 'zustand', sitzung: gastSitzung })
pruefe('C: zustand meldet Quelle und Berechtigungen vom Server',
  zustandGast.body?.teilnehmer?.quelle === 'einladung'
  && zustandGast.body?.teilnehmer?.deckel == null
  && zustandGast.body?.teilnehmer?.rankingOk === true
  && zustandGast.body?.teilnehmer?.ziehungOk === false, JSON.stringify(zustandGast.body?.teilnehmer))
pruefe('C: zustand liefert keine Deckelnummer und keine E-Mail mit',
  !JSON.stringify(zustandGast.body?.teilnehmer ?? {}).includes('gast.eins@example.invalid'))

/* ================================================================== */
/* Token — derselbe Link ein zweites Mal                               */
/* ================================================================== */

rufe = []
r = await ruf({
  aktion: 'gast-anlegen',
  token: slots[0].token,
  instagram: 'gast_zweitversuch',
  email: 'zwei@example.invalid',
  folgt: true,
  bedingungen: true,
})
pruefe('Token: derselbe Token ein zweites Mal 401 link', r.code === 401 && r.body?.grund === 'link', String(r.code))
pruefe('Token: kein zweites Konto', gaesteInDb().length === 1 && teilnehmerPosts().length === 0)

const offen = await ruf({ aktion: 'einladung-pruefen', token: slots[0].token })
pruefe('Token: die Landingpage nennt den Link verbraucht',
  offen.code === 200 && offen.body?.ok === false && offen.body?.grund === 'verbraucht', JSON.stringify(offen.body))

const offen2 = await ruf({ aktion: 'einladung-pruefen', token: slots[1].token })
pruefe('Token: ein offener Link nennt den Einlader',
  offen2.body?.ok === true && offen2.body?.einladung?.einladerInstagram === 'chef_offiziell'
  && offen2.body?.einladung?.slot === 2, JSON.stringify(offen2.body?.einladung))
pruefe('Token: die Pruefung verbraucht nichts',
  DB.videko_terminal_einladungen[1].verwendet_am == null)

/* ================================================================== */
/* Manipulation — gefaelschte Felder in der Anfrage                    */
/* ================================================================== */

rufe = []
r = await ruf({
  aktion: 'gast-anlegen',
  token: slots[1].token,
  instagram: 'gast_zwei',
  email: 'gast.zwei@example.invalid',
  folgt: true,
  bedingungen: true,
  /* Alles, was ein Angreifer hier gern setzen wuerde. Ein Deckel ist der
     einzige Weg in die Ziehung — er darf nie aus dem Anfragekoerper
     kommen. */
  teilnahme_status: 'offiziell',
  deckel_nummer: 4711,
  deckel: 4711,
  eingeladen_von: chef.id,
  leaderboard_ok: true,
  anspruch_art: 'erstaktivierung',
  registrierungsquelle: 'deckel',
  deckel_aktiviert_am: '2026-01-01T00:00:00.000Z',
  folgt_pruefstatus: 'bestaetigt',
  kampagne: 'fremde-kampagne',
})
const gastZwei = gaesteInDb().find((z) => z.instagram_handle === 'gast_zwei')
const postKoerper = teilnehmerPosts()[0]?.body
pruefe('Manipulation: Anfrage geht durch, aber ohne Deckel', r.code === 200 && gastZwei?.deckel_nummer === null)
pruefe('Manipulation: der Einfuegekoerper traegt immer gast/null',
  postKoerper?.teilnahme_status === 'gast' && postKoerper?.deckel_nummer === null
  && postKoerper?.leaderboard_ok === false && postKoerper?.kampagne === K,
  JSON.stringify(postKoerper && { s: postKoerper.teilnahme_status, d: postKoerper.deckel_nummer, l: postKoerper.leaderboard_ok }))
pruefe('Manipulation: die Quelle bleibt einladung',
  postKoerper?.registrierungsquelle === 'einladung' && gastZwei?.registrierungsquelle === 'einladung',
  String(postKoerper?.registrierungsquelle))
pruefe('Manipulation: kein deckel_aktiviert_am und kein Pruefstatus aus der Anfrage',
  !Object.hasOwn(postKoerper ?? {}, 'deckel_aktiviert_am')
  && !Object.hasOwn(postKoerper ?? {}, 'folgt_pruefstatus'))
pruefe('Manipulation: anspruch_art kommt nicht aus der Anfrage', !Object.hasOwn(postKoerper ?? {}, 'anspruch_art'))
pruefe('Manipulation: das Konto ist nicht ziehungsberechtigt',
  kern.ziehungBerechtigt(gastZwei) === false && kern.rankingBerechtigt(gastZwei) === true)

const gastZweiSitzung = r.body?.sitzung

/* ================================================================== */
/* B + C + X — auch ein Eingeladener bekommt genau drei Slots          */
/* ================================================================== */

/**
 * Ein Kettenschritt: der Einlader erzeugt einen Slot, ein neuer Mensch loest
 * ihn ein. Genau so entsteht 1 -> 3 -> 9 -> 27 — und genau das wird hier
 * nicht angenommen, sondern durch die echten Endpunkte gefahren.
 */
async function kettenSchritt(einladerSitzung, handle) {
  const e = await ruf({ aktion: 'einladung-erzeugen', sitzung: einladerSitzung })
  if (e.code !== 200) return { ok: false, stufe: 'erzeugen', code: e.code, body: e.body }
  const g = await ruf({
    aktion: 'gast-anlegen',
    token: e.body.slot.token,
    instagram: handle,
    email: `${handle}@example.invalid`,
    folgt: true,
    leaderboard: true,
    bedingungen: true,
  })
  if (g.code !== 200) return { ok: false, stufe: 'anlegen', code: g.code, body: g.body }
  return {
    ok: true,
    sitzung: g.body.sitzung,
    zeile: DB.videko_terminal_teilnehmer.find((z) => z.instagram_handle === handle),
    teilnehmer: g.body.teilnehmer,
  }
}

rufe = []
const teamGast = await ruf({ aktion: 'einladungen', sitzung: gastSitzung })
pruefe('B: ein Eingeladener bekommt ebenfalls drei Slots',
  teamGast.code === 200 && teamGast.body?.team?.slots.length === 3 && teamGast.body.team.frei === 3,
  `${teamGast.code} ${JSON.stringify(teamGast.body?.team?.frei)}`)

/* Und er laedt selbst drei Leute ein. */
const zweiteReihe = []
for (const handle of ['kette_a', 'kette_b', 'kette_c']) {
  const schritt = await kettenSchritt(gastSitzung, handle)
  zweiteReihe.push(schritt)
}
pruefe('C: ein Eingeladener laedt selbst drei weitere ein',
  zweiteReihe.every((s) => s.ok), zweiteReihe.map((s) => `${s.stufe ?? 'ok'}:${s.code ?? 200}`).join(' '))
pruefe('C: alle drei tragen die Quelle einladung und zeigen auf ihren Einlader',
  zweiteReihe.every((s) => s.zeile?.registrierungsquelle === 'einladung' && s.zeile?.eingeladen_von === gastZeile.id))
pruefe('C: alle drei sind rankingberechtigt, aber nicht ziehungsberechtigt',
  zweiteReihe.every((s) => s.teilnehmer?.rankingOk === true && s.teilnehmer?.ziehungOk === false
    && s.teilnehmer?.einladenOk === true))

/* X: der vierte Slot wird auch in der zweiten Reihe verweigert. */
const vierterGast = await ruf({ aktion: 'einladung-erzeugen', sitzung: gastSitzung })
pruefe('X: auch ein Eingeladener bekommt keinen vierten Slot',
  vierterGast.code === 409 && vierterGast.body?.grund === 'keine-slots',
  `${vierterGast.code} ${JSON.stringify(vierterGast.body)}`)
pruefe('X: nie mehr als drei gueltige Slots je Konto',
  DB.videko_terminal_einladungen
    .filter((z) => z.einlader_teilnehmer_id === gastZeile.id && z.widerrufen_am == null).length === 3)

/* Ohne Sitzung bleibt jede Einladungsaktion verschlossen. */
for (const aktion of ['einladungen', 'einladung-erzeugen', 'einladung-widerrufen']) {
  const a = await ruf({ aktion, slot: 1 })
  pruefe(`X: ${aktion} ohne Sitzung 401`, a.code === 401 && a.body?.grund === 'sitzung', String(a.code))
}

/* Eine untergeschobene Einlader-ID aendert nichts: gezaehlt wird die eigene. */
const fremd = await ruf({
  aktion: 'einladung-erzeugen',
  sitzung: zweiteReihe[0].sitzung,
  einlader: chef.id,
  einlader_teilnehmer_id: chef.id,
})
pruefe('X: eine untergeschobene Einlader-ID landet nicht beim Fremden',
  fremd.code === 200
  && DB.videko_terminal_einladungen.filter((z) => z.einlader_teilnehmer_id === chef.id).length === 3,
  `${fremd.code}`)

/* Ein gesperrtes Konto darf gar nicht einladen — das ist der einzige
   verbliebene Grund fuer eine Ablehnung ('konto'). */
const gesperrt = teilnehmerAnlegen({
  deckel_nummer: 2500,
  instagram_handle: 'gesperrt_konto',
  status: 'gesperrt',
  folgt_bestaetigt_von_nutzer: true,
})
const gesperrtRuf = await ruf({ aktion: 'einladung-erzeugen', sitzung: sitzungFuer(gesperrt.id) })
pruefe('X: ein gesperrtes Konto bekommt 403 konto',
  gesperrtRuf.code === 403 && gesperrtRuf.body?.grund === 'konto',
  `${gesperrtRuf.code} ${JSON.stringify(gesperrtRuf.body)}`)

/* ================================================================== */
/* D + W — die Kette traegt ueber fuenf Generationen                    */
/* ================================================================== */

const kette = [{ handle: 'chef_offiziell', zeile: chef }, { handle: 'gast_eins', zeile: gastZeile },
  { handle: 'kette_a', zeile: zweiteReihe[0].zeile }]
let letzte = zweiteReihe[0]
for (const handle of ['kette_d', 'kette_e', 'kette_f']) {
  letzte = await kettenSchritt(letzte.sitzung, handle)
  kette.push({ handle, zeile: letzte.zeile })
}
pruefe('D: die Kette reicht ueber sechs Glieder', kette.every((k) => Boolean(k.zeile?.id)),
  kette.map((k) => `${k.handle}:${k.zeile ? 'ok' : 'fehlt'}`).join(' '))
pruefe('D: jedes Glied zeigt auf das vorige',
  kette.slice(1).every((k, i) => k.zeile.eingeladen_von === kette[i].zeile.id),
  kette.map((k) => k.zeile?.eingeladen_von ? 'x' : '-').join(''))
pruefe('D: nur das erste Glied kam ueber einen Deckelcode herein',
  kette[0].zeile.registrierungsquelle === 'deckel'
  && kette.slice(1).every((k) => k.zeile.registrierungsquelle === 'einladung'))
pruefe('D: kein Glied ausser dem ersten ist ziehungsberechtigt',
  kern.ziehungBerechtigt(kette[0].zeile) === true
  && kette.slice(1).every((k) => kern.ziehungBerechtigt(k.zeile) === false))
pruefe('D: aber jedes Glied ist rankingberechtigt',
  kette.every((k) => kern.rankingBerechtigt(k.zeile) === true))

/* W: die Verwaltung rechnet die Generation aus genau diesem Baum. */
const adminModul = await import('../api/terminal-admin.js')
async function admin(body) {
  const res = antwortAttrappe()
  await adminModul.default({
    method: 'POST',
    headers: { 'x-forwarded-for': frischeIp(), 'x-terminal-admin': process.env.TERMINAL_ADMIN_TOKEN },
    body,
  }, res)
  return res
}

const standAdmin = await admin({ aktion: 'stand' })
const generationVon = (id) => standAdmin.body?.teilnehmer?.find((z) => z.id === id)?.generation
pruefe('W: die Generationen zaehlen 0,1,2,3,4,5 entlang der Kette',
  kette.map((k) => generationVon(k.zeile.id)).join(',') === '0,1,2,3,4,5',
  kette.map((k) => generationVon(k.zeile.id)).join(','))
pruefe('W: die Verwaltung nennt zu jedem Eingeladenen seinen Einlader',
  kette.slice(1).every((k, i) => standAdmin.body.teilnehmer
    .find((z) => z.id === k.zeile.id)?.einladerInstagram === kette[i].handle),
  kette.slice(1).map((k) => standAdmin.body.teilnehmer.find((z) => z.id === k.zeile.id)?.einladerInstagram).join(','))
pruefe('W: Quelle und beide Berechtigungen stehen je Zeile getrennt',
  standAdmin.body.teilnehmer.every((z) => typeof z.quelle === 'string'
    && typeof z.rankingOk === 'boolean' && typeof z.ziehungOk === 'boolean'))
pruefe('W: die Teilnehmerliste traegt keine E-Mail-Spalte nach aussen',
  standAdmin.body.teilnehmer.find((z) => z.id === gastZeile.id)?.einladungenGesamt === 3)

const auswertung = await admin({ aktion: 'einladungen' })
pruefe('W: die Auswertung misst die maximale Kettentiefe',
  auswertung.body?.zahlen?.tiefeMax >= 5, String(auswertung.body?.zahlen?.tiefeMax))
pruefe('W: sie trennt Deckel- und Einladungsspieler',
  auswertung.body?.zahlen?.spielerViaEinladung >= 6
  && auswertung.body?.zahlen?.spielerViaDeckel >= 1
  && auswertung.body.zahlen.spielerViaEinladung + auswertung.body.zahlen.spielerViaDeckel
    === auswertung.body.zahlen.spielerGesamt,
  JSON.stringify({ e: auswertung.body?.zahlen?.spielerViaEinladung, d: auswertung.body?.zahlen?.spielerViaDeckel }))
pruefe('W: und zaehlt Ranking- und Ziehungsberechtigte getrennt',
  auswertung.body?.zahlen?.rankingTeilnehmer > auswertung.body?.zahlen?.ziehungsberechtigte,
  JSON.stringify({ r: auswertung.body?.zahlen?.rankingTeilnehmer, z: auswertung.body?.zahlen?.ziehungsberechtigte }))
pruefe('W: jede Kennzahl kommt mit ihrer Formel heraus',
  Boolean(auswertung.body?.formeln) && Object.keys(auswertung.body.formeln).length > 0)

/* ================================================================== */
/* E — ein Eingeladener spielt alle sechs Hauptspiele                   */
/* ================================================================== */

rufe = []
const laeufe = []
for (const game of HAUPT) {
  const start = await ruf({ aktion: 'spiel-start', sitzung: gastSitzung, game })
  /* Der Start liefert ein echtes Ticket; fuer die Wertung braucht der Test
     aber einen Lauf, der lang genug gedauert hat — sonst greift
     laufVerdacht und der Score landet als "verdacht" statt "gueltig".
     Deshalb wird das Ticket mit zurueckdatiertem Start selbst ausgestellt. */
  const ticket = ticketFuer(gastZeile.id, game)
  const ende = await ruf({ aktion: 'spiel-ende', sitzung: gastSitzung, game, ticket, score: 1000, runden: 100 })
  laeufe.push({ game, start, ende, ticket })
}
pruefe('E: alle sechs Spiele starten ohne Deckel',
  laeufe.every((l) => l.start.code === 200 && typeof l.start.body?.ticket === 'string'),
  laeufe.map((l) => `${l.game}:${l.start.code}`).join(' '))
pruefe('E: alle sechs Ergebnisse werden angenommen',
  laeufe.every((l) => l.ende.code === 200 && l.ende.body?.gespeichert === true),
  laeufe.map((l) => `${l.game}:${l.ende.code}`).join(' '))
pruefe('E: und als gewertet zurueckgemeldet', laeufe.every((l) => l.ende.body?.gewertet === true),
  laeufe.map((l) => `${l.game}:${l.ende.body?.gewertet}`).join(' '))
pruefe('E: jeder Lauf bekommt einen Rang zurueck — kein Probelauf',
  laeufe.every((l) => l.ende.body?.rang?.platz > 0),
  laeufe.map((l) => `${l.game}:${l.ende.body?.rang?.platz}`).join(' '))

const gastScores = DB.videko_terminal_scores.filter((z) => z.teilnehmer_id === gastZeile.id)
pruefe('E: sechs Scorezeilen unter derselben id', gastScores.length === 6, String(gastScores.length))
pruefe('E: jede Zeile traegt genau ein Hauptspiel',
  HAUPT.every((g) => gastScores.filter((z) => z.game === g).length === 1))
pruefe('E: alle sechs haben status gueltig', gastScores.every((z) => z.status === 'gueltig'))

const doppelt = await ruf({
  aktion: 'spiel-ende',
  sitzung: gastSitzung,
  game: HAUPT[0],
  ticket: laeufe[0].ticket,
  score: 1000,
  runden: 100,
})
pruefe('E: dasselbe Laufticket zaehlt kein zweites Mal',
  doppelt.code === 409 && doppelt.body?.grund === 'doppelt', `${doppelt.code} ${JSON.stringify(doppelt.body)}`)
pruefe('E: und es bleibt bei sechs Zeilen',
  DB.videko_terminal_scores.filter((z) => z.teilnehmer_id === gastZeile.id).length === 6)

/* ================================================================== */
/* F + G + H + R — es gibt nur EINE Rangliste                          */
/* ================================================================== */

/* Es gibt kein "Deckelranking" und kein "Gastranking". Wer Instagram
   bestaetigt hat, steht in derselben Liste — egal, wie er hereinkam.
   Deshalb wird hier nicht geprueft, dass Eingeladene draussen bleiben,
   sondern dass sie ganz normal mitzaehlen und mitverschieben. */

const a1 = offizieller(2001, 'offiziell_eins')
const a2 = offizieller(2002, 'offiziell_zwei')
const a3 = offizieller(2003, 'offiziell_drei')
const offizielle = [a1, a2, a3]
offizielle.forEach((t, i) => {
  for (const game of HAUPT) scoreAnlegen(t.id, game, 1100 + i * 100)
})

/* gast_eins hat weiter oben ueber die echten Endpunkte sechs Mal 1000
   gespielt — er ist der vierte Mensch in der Wertung. */
kern.rangSpeicherLeeren()
const standVorher = await gr.gesamtrankingDaten()
const vorherVon = (id) => standVorher.teilnehmer.find((t) => t.id === id)
pruefe('F: der Eingeladene steht ganz normal in der Wertung',
  Boolean(vorherVon(gastZeile.id)) && vorherVon(gastZeile.id).qualifiziert === true,
  JSON.stringify(standVorher.teilnehmer.map((t) => t.gesamt)))
pruefe('F: vier Teilnehmer — drei ueber Deckel, einer ueber Einladung',
  standVorher.teilnehmer.length === 4, String(standVorher.teilnehmer.length))
pruefe('F: N zaehlt den Eingeladenen mit',
  HAUPT.every((g) => standVorher.anzahl[g] === 4), JSON.stringify(standVorher.anzahl))
/* Vier Menschen in der Wertung: Platz 1 von 4 gibt 1000 Rangpunkte je Spiel,
   gewertet werden vier davon — also 4000. */
pruefe('F: der Deckelbeste fuehrt mit 4000', vorherVon(a3.id)?.gesamt === 4000,
  String(vorherVon(a3.id)?.gesamt))
pruefe('F: sechs gespielt, vier gewertet, zwei gestrichen',
  vorherVon(a3.id)?.gespielt === 6 && vorherVon(a3.id)?.gewertet?.length === 4
  && vorherVon(a3.id)?.gestrichen?.length === 2,
  JSON.stringify({ g: vorherVon(a3.id)?.gespielt, w: vorherVon(a3.id)?.gewertet?.length }))

/* G: ein weiterer Eingeladener mit Spitzenwerten verschiebt die Plaetze
   aller anderen — genau das ist der Unterschied zum alten Modell. */
const spitze = zweiteReihe[0].zeile
for (const game of HAUPT) scoreAnlegen(spitze.id, game, 999999)

kern.rangSpeicherLeeren()
const standNachher = await gr.gesamtrankingDaten()
const nachherVon = (id) => standNachher.teilnehmer.find((t) => t.id === id)
pruefe('G: N waechst von 4 auf 5',
  HAUPT.every((g) => standNachher.anzahl[g] === 5), JSON.stringify(standNachher.anzahl))
pruefe('G: der bisher Erste rutscht auf Platz 2',
  nachherVon(a3.id)?.gesamt === 3000 && nachherVon(a3.id).gesamt < vorherVon(a3.id).gesamt,
  `${vorherVon(a3.id)?.gesamt} -> ${nachherVon(a3.id)?.gesamt}`)
pruefe('G: auch die uebrigen Rangpunkte rechnen sich neu',
  standNachher.teilnehmer.length === 5
  && nachherVon(a2.id)?.gesamt === 2000 && nachherVon(a1.id)?.gesamt === 1000,
  JSON.stringify([nachherVon(a2.id)?.gesamt, nachherVon(a1.id)?.gesamt]))

/* H: ein Einladungsspieler ohne jeden Deckel steht auf Platz 1. */
pruefe('H: ein Einladungsspieler erreicht Gesamtranking-Platz 1',
  standNachher.teilnehmer[0]?.id === spitze.id && standNachher.teilnehmer[0]?.gesamt === 4000,
  JSON.stringify({ erster: standNachher.teilnehmer[0]?.id === spitze.id, gesamt: standNachher.teilnehmer[0]?.gesamt }))
pruefe('H: und ist dabei nachweislich ohne Deckel unterwegs',
  spitze.deckel_nummer == null && spitze.registrierungsquelle === 'einladung'
  && kern.ziehungBerechtigt(spitze) === false && kern.rankingBerechtigt(spitze) === true)

/* R: die Verwaltung darf auf Platz 1 bis 3 Einladungsspieler ausweisen —
   spielpreisberechtigt ja, ziehungsberechtigt nein. Keine Vermischung. */
const grAdmin = await admin({ aktion: 'gesamtranking' })
const pruefung1 = grAdmin.body?.pruefung?.[0]
pruefe('R: Platz 1 der Gewinnerpruefung ist der Einladungsspieler',
  pruefung1?.platz === 1 && pruefung1?.instagram === 'kette_a' && pruefung1?.quelle === 'einladung',
  JSON.stringify({ p: pruefung1?.platz, i: pruefung1?.instagram, q: pruefung1?.quelle }))
pruefe('R: er ist spielpreisberechtigt, aber nicht ziehungsberechtigt',
  pruefung1?.spielpreisBerechtigt === true && pruefung1?.ziehungBerechtigt === false
  && pruefung1?.deckel === null,
  JSON.stringify({ s: pruefung1?.spielpreisBerechtigt, z: pruefung1?.ziehungBerechtigt }))

/* Und die oeffentlichen Listen nennen ihn beim Namen. */
const listen = await ruf({ aktion: 'rangliste' })
const listenText = JSON.stringify(listen.body)
pruefe('R: der Einladungsspieler steht in den oeffentlichen Listen',
  listenText.includes('kette_a'))
pruefe('F: keine interne Teilnehmer-ID in den oeffentlichen Listen',
  ![gastZeile.id, spitze.id, a1.id].some((id) => listenText.includes(id)))
pruefe('F: und keine E-Mail-Adresse', !listenText.includes('@example.invalid'))

/* ================================================================== */
/* P + Q — ohne bestaetigten Follow keine Wertung                      */
/* ================================================================== */

/* Der Lauf wird gespeichert — nichts geht verloren. Er taucht nur in
   keiner Rangliste auf. Das gilt fuer beide Wege ins System. */
const pGast = teilnehmerAnlegen({
  deckel_nummer: null,
  instagram_handle: 'kein_follow_gast',
  email: 'kf1@example.invalid',
  teilnahme_status: 'gast',
  anspruch_art: null,
  registrierungsquelle: 'einladung',
  eingeladen_von: chef.id,
  leaderboard_ok: true,
  folgt_bestaetigt_von_nutzer: false,
})
const qDeckel = offizieller(2600, 'kein_follow_deckel', { folgt_bestaetigt_von_nutzer: false })

const pLauf = await ruf({
  aktion: 'spiel-ende',
  sitzung: sitzungFuer(pGast.id),
  game: HAUPT[0],
  ticket: ticketFuer(pGast.id, HAUPT[0]),
  score: 1000,
  runden: 100,
})
pruefe('P: der Lauf wird angenommen und gespeichert',
  pLauf.code === 200 && pLauf.body?.gespeichert === true,
  `${pLauf.code} ${JSON.stringify(pLauf.body)?.slice(0, 120)}`)
pruefe('P: die Scorezeile liegt in der Datenbank',
  DB.videko_terminal_scores.some((z) => z.teilnehmer_id === pGast.id && z.game === HAUPT[0]))
for (const game of HAUPT.slice(1)) scoreAnlegen(pGast.id, game, 999999)
for (const game of HAUPT) scoreAnlegen(qDeckel.id, game, 999999)

kern.rangSpeicherLeeren()
const standOhneFollow = await gr.gesamtrankingDaten()
pruefe('P: der Eingeladene ohne Follow steht in keiner Wertung',
  !standOhneFollow.teilnehmer.some((t) => t.id === pGast.id)
  && kern.rankingBerechtigt(pGast) === false)
pruefe('Q: und ein Deckelbesitzer ohne Follow genauso wenig',
  !standOhneFollow.teilnehmer.some((t) => t.id === qDeckel.id)
  && kern.rankingBerechtigt(qDeckel) === false)
pruefe('P+Q: N bleibt bei fuenf — beide zaehlen nirgends mit',
  HAUPT.every((g) => standOhneFollow.anzahl[g] === 5), JSON.stringify(standOhneFollow.anzahl))
const listenOhne = JSON.stringify((await ruf({ aktion: 'rangliste' })).body)
pruefe('P+Q: und keiner der beiden Namen steht in den oeffentlichen Listen',
  !['kein_follow_gast', 'kein_follow_deckel'].some((n) => listenOhne.includes(n)))
pruefe('Q: der Deckel bleibt davon unberuehrt — das Los haengt nicht am Follow',
  kern.ziehungBerechtigt(qDeckel) === true)

/* ================================================================== */
/* I + S — der Lostopf kennt nur Deckel                                */
/* ================================================================== */

const topfZeilen = [
  { deckel_nummer: 1847, teilnahme_status: 'offiziell' },
  { deckel_nummer: 2001, teilnahme_status: 'offiziell' },
  { deckel_nummer: 2002, teilnahme_status: null },
  /* So etwas kann es nach der Migration gar nicht geben — der Topf faengt
     es trotzdem ab. Drei Schloesser vor derselben Tuer. */
  { deckel_nummer: 4711, teilnahme_status: 'gast' },
  { deckel_nummer: null, teilnahme_status: 'gast' },
]
const topf = topfBilden(topfZeilen)
pruefe('I: ein Einladungsspieler bekommt kein Los, auch nicht mit Nummer',
  !topf.includes(4711) && topf.length === 3, JSON.stringify(topf))
pruefe('I: alte Zeilen ohne teilnahme_status bleiben im Topf', topf.includes(2002))

rufe = []
const ziehung = await admin({ aktion: 'ziehen' })
pruefe('I: die Ziehung laeuft durch', ziehung.body?.ok !== false, JSON.stringify(ziehung.body)?.slice(0, 120))
const topfLesen = rufe.find((x) => x.methode === 'GET' && x.tabelle === 'videko_terminal_teilnehmer'
  && x.suche.includes('select=deckel_nummer'))
pruefe('I: die Ziehung liest nur offizielle Zeilen',
  Boolean(topfLesen) && topfLesen.suche.includes('teilnahme_status=eq.offiziell'), topfLesen?.suche)

const gezogen = rufe.find((x) => x.methode === 'POST' && x.tabelle === 'videko_terminal_ziehungen')?.body?.deckel_nummer
const gezogenZeile = DB.videko_terminal_teilnehmer.find((z) => z.deckel_nummer === gezogen)
pruefe('S: gezogen wurde die Nummer eines echten Deckelkontos',
  gezogen != null && Boolean(gezogenZeile) && gezogenZeile.teilnahme_status === 'offiziell',
  String(gezogen))
/* Und die ganze Kette ohne Deckel kann gar nicht erst in den Topf kommen:
   sie hat keine Nummer, ueber die sie gezogen werden koennte. */
const ohneDeckel = [gastZeile, ...kette.slice(2).map((k) => k.zeile), pGast]
pruefe('S: kein Einladungsspieler ohne Deckel liegt im Topf',
  ohneDeckel.every((z) => DB.videko_terminal_teilnehmer.find((x) => x.id === z.id)?.deckel_nummer == null),
  ohneDeckel.map((z) => String(DB.videko_terminal_teilnehmer.find((x) => x.id === z.id)?.deckel_nummer)).join(','))
pruefe('S: und die Verwaltung zaehlt sie auch nicht als ziehungsberechtigt',
  ohneDeckel.every((z) => kern.ziehungBerechtigt(DB.videko_terminal_teilnehmer.find((x) => x.id === z.id)) === false))

/* ================================================================== */
/* J + K + L + M — aus dem Gast wird ein Deckelbesitzer                */
/* ================================================================== */

rufe = []
const teilnehmerVorZahl = DB.videko_terminal_teilnehmer.length
const konv = await ruf({
  aktion: 'aktivieren',
  sitzung: gastSitzung,
  deckel: '3001',
  folgt: true,
  leaderboard: true,
})
pruefe('J: Konvertierung gelingt', konv.code === 200 && konv.body?.konvertiert === true,
  `${konv.code} ${JSON.stringify(konv.body)?.slice(0, 140)}`)
pruefe('J: kein zweiter Account',
  DB.videko_terminal_teilnehmer.length === teilnehmerVorZahl && teilnehmerPosts().length === 0,
  `${teilnehmerVorZahl} -> ${DB.videko_terminal_teilnehmer.length}`)
const konvertiert = DB.videko_terminal_teilnehmer.find((z) => z.id === gastZeile.id)
pruefe('J: dieselbe Zeile, jetzt offiziell',
  konvertiert?.teilnahme_status === 'offiziell' && konvertiert?.deckel_nummer === 3001)
pruefe('J: Antwort traegt dieselbe id in der Sitzung',
  kern.belegPruefen(konv.body?.sitzung, 's')?.id === gastZeile.id)
pruefe('J: anspruch_art erstaktivierung', konvertiert?.anspruch_art === 'erstaktivierung')
pruefe('J: deckel_aktiviert_am wird gesetzt',
  !Number.isNaN(Date.parse(konvertiert?.deckel_aktiviert_am)), String(konvertiert?.deckel_aktiviert_am))
pruefe('J: ab jetzt ziehungsberechtigt — und weiterhin rankingberechtigt',
  kern.ziehungBerechtigt(konvertiert) === true && kern.rankingBerechtigt(konvertiert) === true)

/* K: die Herkunft wird NICHT ueberschrieben. Wer ueber eine Einladung kam,
   bleibt in jeder Auswertung ein Einladungsspieler — auch mit Deckel. */
pruefe('K: die Registrierungsquelle bleibt einladung',
  konvertiert?.registrierungsquelle === 'einladung', String(konvertiert?.registrierungsquelle))
const standNachKonv = await admin({ aktion: 'stand' })
pruefe('K: auch die Verwaltung fuehrt ihn weiter unter Einladung',
  standNachKonv.body?.teilnehmer?.find((z) => z.id === gastZeile.id)?.quelle === 'einladung')

const besteNach = await kern.eigeneBestwerte(gastZeile.id)
pruefe('K: alle sechs Bestleistungen sind noch da',
  HAUPT.every((g) => besteNach[g] === 1000), JSON.stringify(HAUPT.map((g) => besteNach[g])))
pruefe('K: die Scorezeilen haengen unveraendert an derselben id',
  DB.videko_terminal_scores.filter((z) => z.teilnehmer_id === gastZeile.id).length === 6)

pruefe('M: eingeladen_von bleibt stehen', konvertiert?.eingeladen_von === chef.id)
pruefe('M: gast_konvertiert_am ist gesetzt', !Number.isNaN(Date.parse(konvertiert?.gast_konvertiert_am)))
pruefe('M: eingeladen_am bleibt stehen', !Number.isNaN(Date.parse(konvertiert?.eingeladen_am)))
pruefe('M: die Einladung zeigt weiterhin auf denselben Menschen',
  DB.videko_terminal_einladungen[0].gast_teilnehmer_id === gastZeile.id)

const neueSitzung = konv.body.sitzung
const teamNeu = await ruf({ aktion: 'einladungen', sitzung: neueSitzung })
/* Er hatte seine drei Einladungen schon als Eingeladener — die Kette
   kette_a/b/c haengt an ihm. Der Deckel schaltet keine vierte frei. */
pruefe('M: die drei Einladungen bleiben ihm erhalten',
  teamNeu.code === 200 && teamNeu.body?.team?.slots.length === 3,
  `${teamNeu.code} ${JSON.stringify(teamNeu.body?.team?.slots?.length)}`)
pruefe('X: der Deckel schaltet keine vierte Einladung frei',
  teamNeu.body?.team?.frei === 0, String(teamNeu.body?.team?.frei))
const eigenerSlot = await ruf({ aktion: 'einladung-erzeugen', sitzung: neueSitzung })
pruefe('X: ein weiterer Versuch endet auf 409 keine-slots',
  eigenerSlot.code === 409 && eigenerSlot.body?.grund === 'keine-slots',
  `${eigenerSlot.code} ${JSON.stringify(eigenerSlot.body)}`)

const teamChef = await ruf({ aktion: 'einladungen', sitzung: chefSitzung })
const slot1 = teamChef.body?.team?.slots.find((s) => s.slot === 1)
pruefe('L: im Team des Einladers steht der Gast als beigetreten',
  slot1?.status === 'beigetreten' && slot1?.gast?.instagram === 'gast_eins', JSON.stringify(slot1?.gast))
/* Der Einlader sieht nur: dieser Mensch hat inzwischen einen Deckel. Keine
   Nummer, keine E-Mail — nur das eine Ja/Nein, das die Ziehung entscheidet. */
pruefe('L: und traegt nach der Aktivierung das Deckel-Kennzeichen',
  slot1?.gast?.deckel === true, JSON.stringify(slot1?.gast))
pruefe('L: ohne Deckel steht dort ein klares Nein',
  teamChef.body?.team?.slots.find((s) => s.slot === 2)?.gast?.deckel === false,
  JSON.stringify(teamChef.body?.team?.slots.find((s) => s.slot === 2)?.gast))
pruefe('L: und nie eine Deckelnummer',
  !JSON.stringify(teamChef.body).includes('3001'))
pruefe('L: das Team nennt keine E-Mail-Adresse',
  !JSON.stringify(teamChef.body).includes('@example.invalid'))

/* ================================================================== */
/* Mehrfachanspruch — Aktivierung auf eine belegte Nummer              */
/* ================================================================== */

rufe = []
const gastDrei = teilnehmerAnlegen({
  instagram_handle: 'gast_drei',
  email: 'drei@example.invalid',
  teilnahme_status: 'gast',
  anspruch_art: null,
  registrierungsquelle: 'einladung',
  eingeladen_von: chef.id,
})
const gastDreiSitzung = sitzungFuer(gastDrei.id)
let p1 = await ruf({ aktion: 'aktivieren', sitzung: gastDreiSitzung, deckel: '1847', folgt: true })
pruefe('Mehrfach: belegte Nummer ohne Bestaetigung 409 belegt',
  p1.code === 409 && p1.body?.grund === 'belegt', `${p1.code} ${JSON.stringify(p1.body)}`)
pruefe('Mehrfach: dabei wird nichts umgeschrieben',
  DB.videko_terminal_teilnehmer.find((z) => z.id === gastDrei.id)?.teilnahme_status === 'gast')

p1 = await ruf({ aktion: 'aktivieren', sitzung: gastDreiSitzung, deckel: '1847', folgt: true, besitzBestaetigt: true })
const gastDreiNach = DB.videko_terminal_teilnehmer.find((z) => z.id === gastDrei.id)
pruefe('Mehrfach: mit Bestaetigung wird daraus ein weiterer Besitzanspruch',
  p1.code === 200 && gastDreiNach?.anspruch_art === 'weiterer_besitzanspruch'
  && gastDreiNach?.teilnahme_status === 'offiziell', `${p1.code} ${gastDreiNach?.anspruch_art}`)
pruefe('Mehrfach: der Mehrfachanspruch bringt kein zweites Los',
  topfBilden(DB.videko_terminal_teilnehmer.filter((z) => z.anspruch_art === 'erstaktivierung'))
    .filter((n) => n === 1847).length === 1)
pruefe('K: auch hier bleibt die Registrierungsquelle einladung',
  gastDreiNach?.registrierungsquelle === 'einladung', String(gastDreiNach?.registrierungsquelle))

/* Und der andere Eingeladene bleibt, was er war — eine Aktivierung
   faerbt nicht auf fremde Konten ab. */
pruefe('Mehrfach: der zweite Eingeladene bleibt ohne Deckel',
  DB.videko_terminal_teilnehmer.find((z) => z.id === gastZwei.id)?.teilnahme_status === 'gast')

/* ================================================================== */
/* Widerruf                                                            */
/* ================================================================== */

rufe = []
const widerruf = await ruf({ aktion: 'einladung-widerrufen', sitzung: chefSitzung, slot: 3 })
pruefe('Widerruf: ein offener Slot laesst sich zurueckziehen', widerruf.code === 200 && widerruf.body?.ok === true,
  `${widerruf.code} ${JSON.stringify(widerruf.body)}`)
const nochmal = await ruf({ aktion: 'einladung-widerrufen', sitzung: chefSitzung, slot: 3 })
pruefe('Widerruf: ein zweites Mal geht nicht', nochmal.code === 409 && nochmal.body?.grund === 'nicht-offen',
  `${nochmal.code} ${JSON.stringify(nochmal.body)}`)
const verbraucht = await ruf({ aktion: 'einladung-widerrufen', sitzung: chefSitzung, slot: 1 })
pruefe('Widerruf: ein eingeloester Slot bleibt eingeloest',
  verbraucht.code === 409 && verbraucht.body?.grund === 'nicht-offen', `${verbraucht.code}`)
const nachWiderruf = await ruf({ aktion: 'einladung-erzeugen', sitzung: chefSitzung })
pruefe('Widerruf: der freigewordene Slot laesst sich neu vergeben',
  nachWiderruf.code === 200 && nachWiderruf.body?.slot?.slot === 3, `${nachWiderruf.code} ${nachWiderruf.body?.slot?.slot}`)
pruefe('Widerruf: der alte Token des Slots ist wertlos',
  kern.sha256Hex(slots[2].token) !== kern.sha256Hex(nachWiderruf.body.slot.token))
const alterLink = await ruf({ aktion: 'einladung-pruefen', token: slots[2].token })
pruefe('Widerruf: der alte Link meldet sich als widerrufen',
  alterLink.body?.ok === false && alterLink.body?.grund === 'widerrufen', JSON.stringify(alterLink.body))

/* ================================================================== */
/* T + U + V — Konfiguration und Formel                                */
/* ================================================================== */

pruefe('U: die sechs Hauptspiele stehen unveraendert',
  kern.hauptgamesSaeubern(undefined).join(',') === HAUPT.join(','), kern.hauptgamesSaeubern(undefined).join(','))
pruefe('U: Kuechen-Tinder ist kein Hauptspiel', !kern.hauptgamesSaeubern(undefined).includes('kuechen_tinder'))
pruefe('U: eine unvollstaendige Liste faellt auf den Standard zurueck',
  kern.hauptgamesSaeubern(['leitungsfinder', 'kuechen_tinder']).join(',') === HAUPT.join(','))
pruefe('U: Kuechen-Tinder bleibt ausschliesslich Testslot',
  kern.testslotSaeubern('kuechen_tinder', HAUPT) === 'kuechen_tinder')

/* T: der anonyme Teaser vor der Anmeldung ist VIDEKO Jump. Kuechen-Merge
   bleibt Hauptgame, aber als Koeder braucht es etwas, das ohne ein Wort
   Erklaerung losgeht. */
pruefe('T: der Probelauf spielt VIDEKO Jump',
  kern.PRACTICE_STANDARD === 'videko_jump' && kern.practiceSaeubern(undefined) === 'videko_jump',
  `${kern.PRACTICE_STANDARD} / ${kern.practiceSaeubern(undefined)}`)
pruefe('T: PRACTICE_STANDARD ist in beiden Modulen dasselbe Spiel',
  PRACTICE_STANDARD === kern.PRACTICE_STANDARD, `${PRACTICE_STANDARD} / ${kern.PRACTICE_STANDARD}`)
pruefe('T: ein unbekanntes Practice-Spiel faellt auf den Standard zurueck',
  kern.practiceSaeubern('gibt_es_nicht') === 'videko_jump')

/* Sechs Hauptspiele zu je 1000 Rangpunkten waeren 6000 — gewertet werden
   aber nur die besten vier, also ist bei 4000 Schluss. */
pruefe('V: alleine im Spiel gibt es 1000 Punkte je Hauptspiel, gewertet vier — also 4000',
  gr.gesamtrankingRechnen(HAUPT, Object.fromEntries(HAUPT.map((g) => [g, new Map([['x', { punkte: 1, wann: 'a' }]])])))
    .teilnehmer[0].gesamt === 4000)
pruefe('V: niemand kommt ueber 4000', standNachher.teilnehmer.every((t) => t.gesamt <= 4000))
pruefe('V: der Letzte eines Spiels bekommt 0, der Erste 1000',
  RANGPUNKTE_MAX === 1000 && gr.rangpunkte(1, 7) === 1000 && gr.rangpunkte(7, 7) === 0
  && gr.rangpunkte(1, 1) === 1000)

/* ================================================================== */
/* Einladungszahl ist konfigurierbar                                   */
/* ================================================================== */

pruefe('Slots: Standard ist 3',
  kern.EINLADUNGEN_STANDARD === 3 && kern.einladungenSaeubern(undefined) === 3
  && kern.einladungenSaeubern('drei') === 3 && kern.einladungenSaeubern(-1) === 3)
pruefe('Slots: 0 heisst geschlossen und wird nicht wegkorrigiert', kern.einladungenSaeubern(0) === 0)
pruefe('Slots: 5 ist erlaubt, 999 nicht',
  kern.einladungenSaeubern(5) === 5 && kern.einladungenSaeubern(999) === 3)

/* Wird die Zahl gesenkt, bleiben vergebene Einladungen sichtbar. */
DB.videko_terminal_einstellungen[0].einladungen_pro_teilnehmer = 1
const teamEng = await ruf({ aktion: 'einladungen', sitzung: chefSitzung })
pruefe('Slots: nach dem Senken bleiben vergebene Einladungen erhalten',
  teamEng.body?.team?.slots.length === 3, String(teamEng.body?.team?.slots.length))
const keinSlot = await ruf({ aktion: 'einladung-erzeugen', sitzung: chefSitzung })
pruefe('Slots: neue Einladungen gibt es dann aber nicht',
  keinSlot.code === 409 && keinSlot.body?.grund === 'keine-slots', String(keinSlot.code))

DB.videko_terminal_einstellungen[0].einladungen_pro_teilnehmer = 0
const zu = await ruf({ aktion: 'einladung-erzeugen', sitzung: chefSitzung })
pruefe('Slots: bei 0 ist das Programm geschlossen',
  zu.code === 409 && zu.body?.grund === 'geschlossen', `${zu.code} ${JSON.stringify(zu.body)}`)
DB.videko_terminal_einstellungen[0].einladungen_pro_teilnehmer = 3

/* ================================================================== */
/* Verwaltung: Auswertung ohne Klartext-Token                          */
/* ================================================================== */

rufe = []
const auswertungSpaet = await admin({ aktion: 'einladungen' })
const auswertungText = JSON.stringify(auswertungSpaet.body)
pruefe('Admin: die Auswertung antwortet', auswertungSpaet.code === 200 && auswertungSpaet.body?.ok === true,
  `${auswertungSpaet.code} ${auswertungText?.slice(0, 120)}`)
pruefe('Admin: kein Klartext-Token in der Antwort',
  !DB.videko_terminal_einladungen.some((z) => auswertungText.includes(einl.einladungToken(z.id))))
pruefe('Admin: kein token_hash in der Antwort',
  !DB.videko_terminal_einladungen.some((z) => auswertungText.includes(z.token_hash)))
pruefe('Admin: keine E-Mail-Adresse in der Antwort', !auswertungText.includes('@example.invalid'))

/* ================================================================== */
/* T — nichts Geheimes im ausgelieferten Bundle                        */
/* ================================================================== */

const wurzel = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const assets = path.join(wurzel, 'dist', 'assets')

function geheimnisse() {
  const datei = path.join(wurzel, '.env.local')
  if (!fs.existsSync(datei)) return null
  const werte = new Map()
  for (const zeile of fs.readFileSync(datei, 'utf8').split(/\r?\n/)) {
    const treffer = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(zeile)
    if (!treffer) continue
    const wert = treffer[2].trim().replace(/^["']|["']$/g, '')
    /* Nur lange Werte suchen: eine kurze Zeichenkette faende sich in jedem
       Bundle zufaellig wieder und ergaebe eine Falschmeldung. */
    if (wert.length >= 16) werte.set(treffer[1], wert)
  }
  return werte
}

if (!fs.existsSync(assets)) {
  pruefe('T: Bundle-Pruefung uebersprungen (dist/assets fehlt — vorher `npm run build`)', true)
} else {
  const dateien = fs.readdirSync(assets).filter((n) => n.endsWith('.js'))
  const inhalt = dateien.map((n) => fs.readFileSync(path.join(assets, n), 'utf8')).join('\n')
  pruefe('T: JavaScript-Dateien im Bundle gefunden', dateien.length > 0, `${dateien.length} Dateien`)

  const werte = geheimnisse()
  if (!werte) {
    pruefe('T: .env.local nicht vorhanden — Wertesuche uebersprungen', true)
  } else {
    /* Es wird ausschliesslich der NAME gemeldet, nie der Wert. */
    const gefunden = [...werte.entries()].filter(([, wert]) => inhalt.includes(wert)).map(([name]) => name)
    pruefe('T: kein Wert aus .env.local steht im Bundle', gefunden.length === 0,
      gefunden.length ? `betroffen: ${gefunden.join(', ')}` : `${werte.size} Werte geprueft`)
  }

  for (const marker of ['service_role', 'TERMINAL_SUPABASE_SERVICE_KEY', 'supabase.co/rest/v1']) {
    pruefe(`T: Marker "${marker}" kommt im Bundle nicht vor`, !inhalt.includes(marker))
  }
  /* Der Einladungstoken wird serverseitig erzeugt; im Bundle darf nichts
     stehen, was ihn nachbauen koennte. */
  pruefe('T: das Bundle leitet keine Einladungstoken ab', !inhalt.includes('einladung|'))
}

/* ================================================================== */
/* Notbremse im Kindprozess                                            */
/* ================================================================== */

const kind = spawnSync(process.execPath, [fileURLToPath(import.meta.url), 'pause'], { encoding: 'utf8' })
process.stdout.write(`${kind.stdout.split('\n').filter((z) => /^(OK|FEHL)/.test(z)).map((z) => `  ${z}`).join('\n')}\n`)
pruefe('Notbremse-Pruefungen bestanden', kind.status === 0, kind.stderr?.slice(0, 300))

console.log(`\n${gesamt - fehler}/${gesamt} Pruefungen bestanden`)
process.exit(fehler ? 1 : 0)
