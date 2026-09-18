/**
 * Testlauf fuer das VIDEKO Terminal 2.0 — Browserseite.
 *
 * Der Server steht hier nicht zur Verfuegung (kein vercel dev, kein
 * localhost-API). Deshalb faengt dieses Skript /api/terminal ab und antwortet
 * selbst — mit genau den Feldern, die api/terminal.js zurueckgibt. Damit laesst
 * sich die komplette Browserseite pruefen: Codeeingabe, ACCESS GRANTED, die
 * drei Punkte auf der Truhe, der Flug durchs Schluesselloch, die Aktivierung,
 * beide Spiele, die Rangliste, die Breiten.
 *
 * Die Serverseite — Laufticket, Plausibilitaet, doppelte Absendung, Bestwert,
 * keine privaten Daten — wird danach gegen die echte Funktion geprueft. Eine
 * Attrappe kann das nicht beweisen, sie wuerde nur sich selbst bestaetigen.
 *
 * Aufruf:  node scripts/terminal-test.mjs <port>
 */

import puppeteer from 'puppeteer-core'
import { existsSync, readdirSync, readFileSync } from 'node:fs'

const PORT = process.argv[2] || '4178'
const BASIS = `http://127.0.0.1:${PORT}`

const CHROME_KANDIDATEN = [
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
]
const CHROME = CHROME_KANDIDATEN.find((p) => p && existsSync(p))
if (!CHROME) {
  console.error('Kein Chrome gefunden.')
  process.exit(1)
}

/* ------------------------------------------------------------------ */
/* Die Attrappe                                                        */
/* ------------------------------------------------------------------ */

const CODE = 'BADEENTE'

/** Zustand der Attrappe. Ein Lauf, ein Ticket, ein Ergebnis. */
const welt = {
  aktiviert: 3,
  teilnehmer: null,
  tickets: new Map(),
  laufNr: 0,
  beste: { truhenknacker: null, goldrausch: null, kuechen_stack: null, kuechen_dash: null, kuechen_balance: null, kuechen_fit: null, videko_jump: null, kuechen_merge: null, leitungsfinder: null, kuechen_crush: null, kuechen_tinder: null },
  /* 2.3: Follower-Mission und Spiel-Schalter kommen aus den Einstellungen. */
  followerZahl: 1100,
  meilensteinGewinne: { 1500: 'Testpreis' },
  /* Truhenknacker, Goldrausch und Balance sind im Standard aus. Die alten
     Abschnitte pruefen diese Spiele weiter und schalten sie deshalb
     ausdruecklich an; der echte Standard hat einen eigenen Abschnitt (15). */
  spieleAktiv: { truhenknacker: true, goldrausch: true, kuechen_balance: true, kuechen_tinder: true },
  spieleReihenfolge: null,
  guestPracticeGame: 'leitungsfinder',
  /* Schon aktivierte Nummern (Mehrfachanspruch) und die Nutzlasten dazu. */
  belegt: new Set([1847]),
  aktivierRufe: [],
  /* Zusatzpreise des Gesamtrankings; null = in der Verwaltung nichts eingetragen. */
  grPreise: null,
}

/* Die acht nachgeladenen Kandidaten aus dem Game-Lab, in Standardreihenfolge
   (Runde 2: Leitungsfinder, Merge, Crush, Jump, Fit, Slam, Tinder vorn).
   VIDEKO Slam steht seit Pass 5 als sechstes Hauptgame mit in der Reihe. */
const NEUE_GAMES = ['leitungsfinder', 'kuechen_merge', 'kuechen_crush', 'videko_jump', 'kuechen_fit', 'videko_slam', 'kuechen_tinder', 'kuechen_balance']
/* Die fuer die alten Abschnitte eingeschalteten Spiele (Standard: aus). Tinder
   ist ohne eingetragenen Testslot ebenfalls aus. */
const ALT_AN = { truhenknacker: true, goldrausch: true, kuechen_balance: true, kuechen_tinder: true }
/* Der oeffentliche Standard: die sechs Hauptgames, kein Testslot.
   VIDEKO Slam ist seit Pass 5 ein regulaeres Hauptgame und kein Testslot mehr. */
const STANDARD_GAMES = ['leitungsfinder', 'kuechen_merge', 'kuechen_crush', 'videko_jump', 'kuechen_fit', 'videko_slam']

function einstellungen() {
  return {
    ziehungAm: new Date(Date.now() + 86400000 * 3).toISOString(),
    gezogen: null,
    followerZahl: welt.followerZahl,
    meilensteinGewinne: welt.meilensteinGewinne,
    spieleAktiv: welt.spieleAktiv,
    spieleReihenfolge: welt.spieleReihenfolge,
    guestPracticeGame: welt.guestPracticeGame,
  }
}

const WIEDER_TEXT = 'Wenn zu dieser E-Mail ein aktivierter Deckel gehört, haben wir dir einen Zugangslink geschickt.'
const probeLinksVerbraucht = new Set()

/* Der Tresorkoenig ist seit Pass 5 die Spitze des Gesamtrankings — dieselbe
   Zeile wie grDaten().eintraege[0], nicht mehr die alte Legacy-Summe. */
const KOENIG = { platz: 1, instagram: 'tresorkoenig', punkte: 3870, ich: false }

function liste(eigenePunkte) {
  const eintraege = [
    { platz: 1, instagram: 'tresorkoenig', punkte: 42840, ich: false },
    { platz: 2, instagram: 'ein_sehr_langer_instagram_name_zum_testen', punkte: 21840, ich: false },
    { platz: 3, instagram: 'dritte', punkte: 14820, ich: false },
    { platz: 4, instagram: 'vierte', punkte: 8900, ich: false },
  ]
  if (eigenePunkte != null) {
    eintraege.push({ platz: 7, instagram: 'testlauf', punkte: eigenePunkte, ich: true })
  }
  return {
    eintraege,
    eigenerPlatz: eigenePunkte != null ? 7 : null,
    eigenePunkte: eigenePunkte ?? null,
    gelistet: eigenePunkte != null,
  }
}

/* Gesamtranking ueber die sechs Hauptgames, gewertet werden die besten vier.
   Die Attrappe rechnet nicht wie der Server; sie liefert nur dieselbe Form.
   Gespielt ist, was in welt.beste steht. */
const HAUPTGAMES = ['leitungsfinder', 'kuechen_merge', 'kuechen_crush', 'videko_jump', 'kuechen_fit', 'videko_slam']
const GR_GEWERTET = 4
const GR_MAX = 4000

function grDaten(mitEigen, probe = false) {
  const eintraege = [
    { platz: 1, instagram: 'tresorkoenig', punkte: 3870, ich: false, gewertet: HAUPTGAMES.slice(0, 4) },
    { platz: 2, instagram: null, punkte: 3410, ich: false, gewertet: HAUPTGAMES.slice(0, 4) },
    { platz: 3, instagram: 'dritte', punkte: 2990, ich: false, gewertet: HAUPTGAMES.slice(1, 5) },
  ]
  let eigen = null
  if (mitEigen) {
    /* Alle gespielten Spiele haben in der Attrappe denselben Wert; gewertet
       sind deshalb schlicht die ersten vier davon. */
    let offen = GR_GEWERTET
    const spiele = HAUPTGAMES.map((key) => {
      const score = probe ? null : welt.beste[key]
      if (score == null) return { key, score: null, rangpunkte: null, platz: null, von: 40, gewertet: false }
      const zaehlt = offen > 0
      if (zaehlt) offen -= 1
      return { key, score, rangpunkte: 612, platz: 16, von: 40, gewertet: zaehlt }
    })
    const gespielt = spiele.filter((s) => s.score != null).length
    const qualifiziert = gespielt >= GR_GEWERTET
    eigen = {
      spiele,
      gespielt,
      noetig: GR_GEWERTET,
      fehlt: Math.max(0, GR_GEWERTET - gespielt),
      qualifiziert,
      gewertet: spiele.filter((s) => s.gewertet).map((s) => s.key),
      gestrichen: spiele.filter((s) => s.score != null && !s.gewertet).map((s) => s.key),
      fehlende: spiele.filter((s) => s.score == null).map((s) => s.key),
      max: GR_MAX,
      abgeschlossen: false,
      platz: qualifiziert ? 9 : null,
      punkte: qualifiziert ? 3060 : null,
      zwischenstand: Math.min(gespielt, GR_GEWERTET) * 612,
      von: 31,
      bisPlatz: qualifiziert ? 8 : null,
      luecke: qualifiziert ? 145 : null,
      oeffentlich: probe ? false : welt.teilnehmer?.leaderboardOk === true,
      probe,
    }
  }
  return {
    eintraege,
    gesamtZahl: 31,
    spiele: HAUPTGAMES,
    gewerteteGames: GR_GEWERTET,
    maxPunkte: GR_MAX,
    preise: welt.grPreise ?? { 1: null, 2: null, 3: null },
    abgeschlossen: false,
    abgeschlossenAm: null,
    eigenerPlatz: eigen?.platz ?? null,
    eigenePunkte: eigen?.punkte ?? null,
    gelistet: eigen?.qualifiziert === true && eigen.oeffentlich,
    eigen,
  }
}

/**
 * Die Attrappe des Testmodus. Spiegelt api/_terminal-probe.js: dieselben
 * Aktionen, dieselbe Form — und wie dort schreibt keine davon in `welt`.
 * Was der echte Server im Testmodus nicht selbst behandelt (etwa `code`),
 * laeuft wie dort in den normalen Weg durch.
 */
function probeAntwort(b) {
  const aktiv = b.probe === 'probe-aktiv'
  const person = {
    deckel: 'TEST',
    instagram: 'videko_test',
    aktiviertAm: new Date().toISOString(),
    leaderboardOk: false,
  }
  switch (b.aktion) {
    case 'probe-reset':
      return { ok: true, probe: 'probe-beleg' }
    case 'zustand':
      return {
        ok: true,
        probe: true,
        aktiviert: welt.aktiviert,
        einstellungen: einstellungen(),
        teilnehmer: aktiv ? person : null,
        spiele: aktiv
          ? {
              beste: { truhenknacker: null, goldrausch: null, kuechen_stack: null, kuechen_dash: null, kuechen_balance: null, kuechen_fit: null, videko_jump: null, kuechen_merge: null, leitungsfinder: null, kuechen_crush: null, videko_slam: null, kuechen_tinder: null },
              gesamt: null,
              platz: null,
              gelistet: false,
              gesamtranking: grDaten(true, true),
            }
          : null,
        koenig: KOENIG,
      }
    case 'aktivieren':
      return { ok: true, probe: 'probe-aktiv', sitzung: null, teilnehmer: person, aktiviert: welt.aktiviert }
    case 'spiel-start':
      return { ok: true, probe: true, ticket: 'probe-ticket', dauerMs: 30000 }
    case 'spiel-ende':
      return { ok: true, probe: true, gespeichert: false, gewertet: false, punkte: Number(b.score) || 0, gelistet: false }
    case 'wieder-anfordern':
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(b.email || ''))) return { __status: 400, ok: false, grund: 'felder' }
      return { ok: true, probe: true, meldung: WIEDER_TEXT, testLink: 'probe-link' }
    case 'wieder-einloesen':
      if (b.token !== 'probe-link' || probeLinksVerbraucht.has(b.token)) return { __status: 401, ok: false, grund: 'link' }
      probeLinksVerbraucht.add(b.token)
      return { ok: true, probe: 'probe-aktiv', sitzung: null, teilnehmer: person }
    case 'leaderboard':
      return { ok: true, probe: true, leaderboardOk: b.ok === true }
    case 'rangliste':
      return {
        ok: true,
        probe: true,
        spieleAktiv: welt.spieleAktiv,
        spieleReihenfolge: welt.spieleReihenfolge,
        listen: {
          truhenknacker: liste(null),
          goldrausch: liste(null),
          kuechen_stack: liste(null),
          kuechen_dash: liste(null),
          ...Object.fromEntries(NEUE_GAMES.map((k) => [k, liste(null)])),
          gesamtranking: grDaten(aktiv, true),
          gesamt: liste(null),
        },
      }
    default:
      return null
  }
}

function antwortFuer(koerper) {
  const b = koerper || {}
  if (b.probe) {
    const probe = probeAntwort(b)
    if (probe) return probe
  }
  const sitzungDa = b.sitzung === 'sitzung-beleg'

  switch (b.aktion) {
    case 'zustand':
      return {
        ok: true,
        aktiviert: welt.aktiviert,
        einstellungen: einstellungen(),
        teilnehmer: sitzungDa ? welt.teilnehmer : null,
        spiele: sitzungDa && welt.teilnehmer
          ? { beste: welt.beste, gesamt: summe(), platz: summe() ? 7 : null, gelistet: summe() != null, gesamtranking: grDaten(true) }
          : null,
        koenig: KOENIG,
      }

    case 'code':
      return { ok: true, zugang: b.code === CODE ? 'zugang-beleg' : null }

    case 'aktivieren':
      welt.aktivierRufe.push({ deckel: Number(b.deckel), besitzBestaetigt: b.besitzBestaetigt })
      if (welt.belegt.has(Number(b.deckel)) && b.besitzBestaetigt !== true) {
        return { __status: 409, ok: false, grund: 'belegt' }
      }
      welt.teilnehmer = {
        deckel: Number(b.deckel),
        instagram: String(b.instagram || '').replace(/^@/, ''),
        aktiviertAm: new Date().toISOString(),
        leaderboardOk: b.leaderboard === true,
      }
      welt.aktiviert += 1
      return { ok: true, sitzung: 'sitzung-beleg', teilnehmer: welt.teilnehmer, aktiviert: welt.aktiviert }

    case 'spiel-start': {
      if (!sitzungDa) return { __status: 401, ok: false, grund: 'sitzung' }
      welt.laufNr += 1
      const ticket = `ticket-${welt.laufNr}`
      welt.tickets.set(ticket, { game: b.game, start: Date.now() })
      return { ok: true, ticket, dauerMs: 30000 }
    }

    case 'spiel-ende': {
      const t = welt.tickets.get(b.ticket)
      if (!t) return { __status: 400, ok: false, grund: 'ticket' }
      welt.tickets.delete(b.ticket)
      const punkte = Number(b.score) || 0
      const g = b.game
      if (welt.beste[g] == null || punkte > welt.beste[g]) welt.beste[g] = punkte
      /* Rang und Tagesbestwert kommen vom Server, nicht aus dem Browser.
         Der Stub muss sie deshalb mitliefern, sonst bleibt der halbe
         Ergebnisblock leer und niemand merkt es. Die Zahlen sind so
         gewaehlt, dass sich die beiden Zeilen unterscheiden lassen:
         Platz 7 von 143, und bis Platz 5 fehlen 1.420 Punkte. */
      return {
        ok: true,
        gespeichert: true,
        gewertet: true,
        punkte,
        beste: welt.beste,
        gesamt: summe(),
        platz: 7,
        gelistet: true,
        rang: { platz: 7, von: 143, bisPlatz: 5, luecke: 1420 },
        heute: { punkte: 21840, instagram: 'tresorkoenig' },
        gesamtranking: grDaten(true),
      }
    }

    /* Einwilligung ins oeffentliche Leaderboard: aendert nur diesen Haken. */
    case 'leaderboard':
      if (!sitzungDa || !welt.teilnehmer) return { __status: 401, ok: false, grund: 'sitzung' }
      welt.teilnehmer = { ...welt.teilnehmer, leaderboardOk: b.ok === true }
      return { ok: true, leaderboardOk: welt.teilnehmer.leaderboardOk }

    case 'rangliste':
      return {
        ok: true,
        spieleAktiv: welt.spieleAktiv,
        spieleReihenfolge: welt.spieleReihenfolge,
        listen: {
          truhenknacker: liste(sitzungDa ? welt.beste.truhenknacker : null),
          goldrausch: liste(sitzungDa ? welt.beste.goldrausch : null),
          kuechen_stack: liste(sitzungDa ? welt.beste.kuechen_stack : null),
          kuechen_dash: liste(sitzungDa ? welt.beste.kuechen_dash : null),
          ...Object.fromEntries(NEUE_GAMES.map((k) => [k, liste(sitzungDa ? welt.beste[k] : null)])),
          gesamtranking: grDaten(sitzungDa && welt.teilnehmer != null),
          gesamt: liste(sitzungDa ? summe() : null),
        },
      }

    /* Wieder-Login: dieselbe Antwort fuer jede gueltige Adresse. Die Attrappe
       kennt keine Adressen; "bremse@..." loest das Limit aus. */
    case 'wieder-anfordern':
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(b.email || ''))) return { __status: 400, ok: false, grund: 'felder' }
      if (String(b.email).startsWith('bremse')) return { __status: 429, ok: false, grund: 'bremse' }
      return { ok: true, meldung: WIEDER_TEXT }

    /* Offene Links liegen in welt.wiederOffen; einloesen verbraucht sie.
       An Teilnehmerzahl, Scores und Ziehung aendert sich nichts. */
    case 'wieder-einloesen': {
      const token = String(b.token || '')
      if (!/^[A-Za-z0-9_-]{43}$/.test(token) || !welt.wiederOffen?.has(token)) return { __status: 401, ok: false, grund: 'link' }
      welt.wiederOffen.delete(token)
      return { ok: true, sitzung: 'sitzung-beleg', teilnehmer: welt.teilnehmer }
    }

    default:
      return { __status: 400, ok: false, grund: 'aktion' }
  }
}

function summe() {
  const a = welt.beste.truhenknacker
  const b = welt.beste.goldrausch
  if (a == null && b == null) return null
  return (a || 0) + (b || 0)
}

/* ------------------------------------------------------------------ */
/* Pruefwerk                                                           */
/* ------------------------------------------------------------------ */

const ergebnisse = []
function pruefe(name, bedingung, zusatz = '') {
  ergebnisse.push({ name, ok: !!bedingung, zusatz })
  const zeichen = bedingung ? 'OK  ' : 'FEHL'
  console.log(`  ${zeichen} ${name}${zusatz ? ` — ${zusatz}` : ''}`)
}

const warte = (ms) => new Promise((r) => setTimeout(r, ms))

async function rufWarten(seite, ab, aktion, game, ms = 5000) {
  const bis = Date.now() + ms
  while (Date.now() < bis) {
    if (seite.__rufe.slice(ab).some((r) => r.aktion === aktion && (!game || r.game === game))) return true
    await warte(50)
  }
  return false
}

async function text(seite) {
  return seite.evaluate(() => document.body.innerText)
}

async function ueberlauf(seite) {
  return seite.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    sicht: document.documentElement.clientWidth,
  }))
}

/* ------------------------------------------------------------------ */

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

/**
 * Laeuft vor jedem Skript der Seite. Schreibt mit, wann das Dokument die
 * Intro-Klasse bekommt, welche Bilder der Sequenz in welcher Reihenfolge
 * kommen und wann die Klasse wieder faellt — gemessen im Browser selbst,
 * nicht durch Nachschauen von aussen.
 */
function introProtokoll() {
  window.__intro = []
  let zuletzt = ''
  const notiere = () => {
    const w = document.documentElement
    if (!w) return
    const an = w.classList.contains('trm-intro-an')
    const p = w.dataset.trmIntro || null
    const kennung = `${an}|${p}`
    if (kennung === zuletzt) return
    zuletzt = kennung
    window.__intro.push({ t: Math.round(performance.now()), an, p })
  }
  new MutationObserver(notiere).observe(document, {
    attributes: true,
    subtree: true,
    attributeFilter: ['class', 'data-trm-intro'],
  })
}

/* Attrappe der Verwaltung (/api/terminal-admin) fuer Abschnitt 16. Sie bildet
   die Regeln des Servers nach (zweite Bestaetigung, Protokoll, Sperre nach dem
   Abschluss); die echten Regeln prueft scripts/terminal-gesamtranking-test.mjs. */
const ADMIN_SCHLUESSEL = 'admin-attrappe'
const HAUPTGAME_OK = 'HAUPTGAME WIRKLICH ÄNDERN'
/* `gewerteteTeilnehmer` zaehlt Personen mit offiziellen Gesamtranking-Daten —
   nicht Games. Sobald die Zahl ueber null liegt, verlangt der Wechsel eines
   Hauptgames die zweite Bestaetigung. */
const adminWelt = { hauptgames: [...HAUPTGAMES], testslot: null, preise: {}, abgeschlossenAm: null, protokoll: [], gewerteteTeilnehmer: 5 }

function adminGr() {
  const hg = adminWelt.hauptgames
  const zeile = (platz, instagram, oeffentlich, punkte, basis) => ({
    platz, instagram, oeffentlich, punkte,
    spiele: Object.fromEntries(hg.map((g, i) => [g, { rangpunkte: basis - i * 10, platz: platz + i, score: 10000 + i }])),
  })
  /* Punkte unterhalb von 4.000 — mehr kann es seit „beste vier aus sechs"
     nicht geben. */
  const top = [zeile(1, 'tresorkoenig', true, 3870, 990), zeile(2, 'zweiter_platz', false, 3410, 900), zeile(3, 'dritte', true, 2990, 800)]
  const verdachtLauf = { id: 'v1', platz: 2, instagram: 'zweiter_platz', game: hg[0], score: 99999, status: 'verdacht', notiz: 'zu schnell', dauerMs: 9000 }
  return {
    ok: true,
    hauptgames: hg,
    gesamtZahl: 3,
    teilnehmerZahl: 7,
    top,
    verdacht: [verdachtLauf],
    doppelt: [{ plaetze: [1, 3], art: 'gleiche E-Mail' }],
    pruefung: top.map((t) => ({
      platz: t.platz, instagram: t.instagram, oeffentlich: t.oeffentlich, punkte: t.punkte,
      spiele: hg.map((key) => ({ key, ...t.spiele[key] })),
      verdacht: t.platz === 2 ? [verdachtLauf] : [],
      doppelt: t.platz === 1 ? [{ mitPlatz: 3, art: 'gleiche E-Mail' }] : t.platz === 3 ? [{ mitPlatz: 1, art: 'gleiche E-Mail' }] : [],
      deckel: 9000 + t.platz,
      anspruchArt: t.platz === 2 ? 'weiterer_besitzanspruch' : 'erstaktivierung',
      besitzStatus: t.platz === 2 ? 'bestaetigt' : null,
    })),
  }
}

function adminAntwort(k, schluessel) {
  if (schluessel !== ADMIN_SCHLUESSEL) return { ok: false, grund: 'zugang', __status: 401 }
  switch (k.aktion) {
    case 'stand':
      return {
        ok: true,
        einstellungen: {
          ...einstellungen(),
          followerZiel: 5000,
          live: false,
          gesamtranking: { hauptgames: adminWelt.hauptgames, testslot: adminWelt.testslot, preise: adminWelt.preise, abgeschlossenAm: adminWelt.abgeschlossenAm },
        },
        aktiviert: 3, teilnehmer: [], ziehungen: [], meldungen: [], schreiben: true,
      }
    case 'stats': return { ok: true, spiele: {} }
    case 'scores': return { ok: true, scores: [] }
    case 'gesamtranking': return adminGr()
    case 'gr-abschliessen':
      if (adminWelt.abgeschlossenAm) return { ok: false, grund: 'abgeschlossen', __status: 400 }
      adminWelt.abgeschlossenAm = new Date().toISOString()
      return { ok: true }
    case 'einstellungen':
      if (k.hauptgames) {
        if (adminWelt.abgeschlossenAm) return { ok: false, grund: 'abgeschlossen', __status: 400 }
        if (adminWelt.gewerteteTeilnehmer > 0 && k.bestaetigung !== HAUPTGAME_OK) {
          return { ok: false, grund: 'bestaetigung', teilnehmerZahl: adminWelt.gewerteteTeilnehmer, __status: 400 }
        }
        adminWelt.protokoll.push({ vorher: adminWelt.hauptgames, nachher: [...k.hauptgames], bestaetigt: k.bestaetigung === HAUPTGAME_OK })
        adminWelt.hauptgames = [...k.hauptgames]
      }
      if ('testslot' in k) adminWelt.testslot = k.testslot || null
      for (const p of [1, 2, 3]) if (`preisGesamt${p}` in k) adminWelt.preise[p] = k[`preisGesamt${p}`] || null
      return { ok: true }
    default:
      return { ok: true }
  }
}

async function neueSeite(breite = 390, hoehe = 844, ohneIntro = true) {
  const seite = await browser.newPage()
  await seite.setViewport({ width: breite, height: hoehe, deviceScaleFactor: 1, isMobile: breite < 768, hasTouch: breite < 768 })
  /* Headless-Chrome meldet ohne Zutun "prefers-reduced-motion: reduce". Dann
     laufen alle Inszenierungen im Sparmodus (300 statt 1150 ms) und die Suite
     wuerde die normale Fassung nie zu sehen bekommen. Abschnitt 9 stellt das
     bewusst zurueck auf "reduce". */
  await seite.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  /* Der Ersteinstieg laeuft in jedem frischen Tab. Fuer alle Abschnitte, die
     nicht ihn pruefen, gilt er als gesehen — sonst stuende die Seite vier
     Sekunden im Dunkeln. Abschnitt 10 schaltet das ab. */
  if (ohneIntro) {
    await seite.evaluateOnNewDocument(() => {
      try {
        window.sessionStorage.setItem('videko.terminal.intro', '1')
      } catch {
        /* egal */
      }
    })
  }
  await seite.evaluateOnNewDocument(introProtokoll)
  const rufe = []
  await seite.setRequestInterception(true)
  seite.on('request', (anfrage) => {
    const url = anfrage.url()
    if (url.includes('/api/terminal')) {
      let koerper = {}
      try {
        koerper = JSON.parse(anfrage.postData() || '{}')
      } catch {
        koerper = {}
      }
      const pfad = new URL(url).pathname
      rufe.push({ ...koerper, __pfad: pfad })
      const daten = pfad === '/api/terminal-admin'
        ? adminAntwort(koerper, anfrage.headers()['x-terminal-admin'])
        : antwortFuer(koerper)
      const status = daten.__status || 200
      delete daten.__status
      anfrage.respond({
        status,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(daten),
      })
      return
    }
    anfrage.continue()
  })
  const fehler = []
  seite.on('pageerror', (e) => fehler.push(String(e.message || e)))
  seite.on('console', (m) => {
    if (m.type() === 'error') fehler.push(m.text())
  })
  seite.__fehler = fehler
  seite.__rufe = rufe
  return seite
}

/**
 * Punktestand einer Spielkarte. In der Fussleiste stehen zwei .trm-spiel__wert:
 * erst die Restzeit, dann die Punkte. Im Text steht "PUNKTE" gross und die Zahl
 * in einem eigenen span — ein Regex auf den Seitentext findet sie nicht.
 */
async function standLesen(seite, karte) {
  const werte = await seite.$$eval(karte + ' .trm-spiel__wert', (n) => n.map((e) => e.textContent))
  const letzter = werte[werte.length - 1] || '0'
  return Number(String(letzter).split('.').join('')) || 0
}

async function codeEingeben(seite, code) {
  const felder = await seite.$$('.trm-code__feld input, input.trm-code__ziffer, .trm-code input')
  if (felder.length === 0) throw new Error('Keine Codefelder gefunden')
  await felder[0].click()
  await seite.keyboard.type(code, { delay: 18 })
  return felder.length
}

/* ================================================================== */
console.log('\n=== 1. Startseite, falscher Code, richtiger Code ===')

let seite = await neueSeite()
await seite.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await warte(400)

let t = await text(seite)
pruefe('Startseite zeigt die Schlagzeile', /EIN DECKEL VON .* ÖFFNET DIESE TRUHE/i.test(t))
pruefe('Truhe vorhanden', (await seite.$('.trm-truhe__bild')) !== null)
pruefe('Rauch hinter der Truhe', (await seite.$('.trm-truhe__rauch')) !== null)
pruefe('Lichtfuge sichtbar angelegt', (await seite.$('.trm-truhe__fuge')) !== null)
const anzahlFelder = await seite.$$eval('.trm-code input', (n) => n.length).catch(() => 0)
pruefe('Acht Codefelder', anzahlFelder === 8, `${anzahlFelder}`)
pruefe('Preise auf der Startseite', /GEWINN|PREIS/i.test(t))
pruefe('Vier Punkte auf der Truhe schon in Zustand A', (await seite.$$('.trm-punkte .trm-punkt')).length === 4)
pruefe('Ohne Testbeleg kein Testmodus', (await seite.$('.trm-probe')) === null)

/* falscher Code */
await codeEingeben(seite, 'FALSCHAA')
await seite.$eval('form.trm-code, form', (f) => f.requestSubmit())
await warte(500)
t = await text(seite)
pruefe('Falscher Code wird abgelehnt', /nicht geknackt|stimmt nicht|falsch/i.test(t), t.match(/Code[^\n]*/)?.[0] || '')
pruefe('Falscher Code fuehrt nicht in den Tresor', !/DU HAST ZUGANG/i.test(t))

/* richtiger Code */
await seite.reload({ waitUntil: 'networkidle0' })
await warte(300)
/* Dieselbe Truhe vor und nach dem Code: markiert wird das Bild selbst. Steht
   die Marke nach ACCESS GRANTED noch dran, ist es derselbe Knoten — nichts
   wurde ausgetauscht oder neu geladen. */
await seite.$eval('.trm-truhe__bild', (e) => {
  e.dataset.pruefMarke = 'vorher'
})
const bildVorher = await seite.$eval('.trm-truhe__bild', (e) => e.currentSrc || e.src || '')
await codeEingeben(seite, CODE)
await seite.$eval('form.trm-code, form', (f) => f.requestSubmit())
await warte(450)

const buehneDa = await seite.$('.trm-buehne--gewaehrt')
pruefe('ACCESS-GRANTED-Buehne erscheint', buehneDa !== null)
const buehneText = await seite.evaluate(() => document.querySelector('.trm-buehne__wort')?.textContent || '')
pruefe('Buehne zeigt ACCESS GRANTED', buehneText.trim() === 'ACCESS GRANTED', buehneText)
pruefe('Lichtstriche laufen ueber den Bildschirm', (await seite.$$('.trm-buehne__strich')).length === 2)
pruefe('Rauch steigt in der Buehne', (await seite.$('.trm-buehne__rauch')) !== null)
pruefe('Truhe kommt naeher (Modifikator)', (await seite.$('.trm-truhe--gewaehrt')) !== null)
pruefe('Zweiter Satz liegt bereit', (await seite.$('.trm-buehne__wort--zwei')) !== null)
pruefe('Lichtschicht auf der Truhe da', (await seite.$('.trm-truhe__adern')) !== null)

/* Der Schriftzug traegt seine Farbe im Hintergrund und wird durch die
   Buchstaben ausgestanzt. Faellt der Farbverlauf aus — ein Token, das an
   dieser Stelle im Baum nicht gilt, reicht dafuer —, steht dort weiter
   ACCESS GRANTED, nur eben unsichtbar. Kein Text-Test faengt das. */
const wortFarbe = await seite.evaluate(() => {
  const w = document.querySelector('.trm-buehne__wort')
  if (!w) return null
  const st = getComputedStyle(w)
  return { grund: st.backgroundImage, clip: st.webkitBackgroundClip || st.backgroundClip }
})
pruefe('ACCESS GRANTED traegt wirklich Gold',
  wortFarbe != null && wortFarbe.clip === 'text' && /gradient/.test(wortFarbe.grund),
  wortFarbe ? `${wortFarbe.clip} / ${wortFarbe.grund.slice(0, 40)}` : 'fehlt')

/* Das Drehbuch nachmessen. Der Nutzer hat Zeiten genannt, keine Gefuehle —
   also wird nachgerechnet und nicht geschaut. Gemessen wird Verzoegerung und
   Dauer jeder Schicht; zusammen ergeben sie das Fenster, in dem sie spielt. */
const fenster = await seite.evaluate(() => {
  const ms = (wert) => Math.round(parseFloat(wert) * (wert.includes('ms') ? 1 : 1000))
  const f = (wahl) => {
    const e = document.querySelector(wahl)
    if (!e) return null
    const st = getComputedStyle(e)
    const a = ms(st.animationDelay)
    return [a, a + ms(st.animationDuration)]
  }
  return {
    dunkel: f('.trm-buehne--gewaehrt'),
    wort: f('.trm-buehne__wort'),
    wortZwei: f('.trm-buehne__wort--zwei'),
    adern: f('.trm-truhe--gewaehrt .trm-truhe__adern'),
    rauch: f('.trm-truhe--gewaehrt .trm-truhe__rauch'),
    bild: f('.trm-truhe--gewaehrt .trm-truhe__bild'),
    fuge: f('.trm-truhe--gewaehrt .trm-truhe__fuge'),
  }
})

const drehbuch = [
  ['Hintergrund dunkelt 0\u2013300 ms ab', 'dunkel', 0, 300],
  ['ACCESS GRANTED setzt bei 300 ms ein', 'wort', 300, 2300],
  ['Licht wandert 600\u20131500 ms durch die Truhe', 'adern', 600, 1500],
  ['Rauch verstaerkt sich 900\u20131800 ms', 'rauch', 900, 1800],
  ['Truhe kommt 1300\u20132000 ms nach vorn', 'bild', 1300, 2000],
  ['Lichtspalt oeffnet ab 1800 ms', 'fuge', 1800, 2500],
  ['DU HAST ZUGANG. ab 2400 ms', 'wortZwei', 2400, 3400],
]
for (const [name, schluessel, von, bis] of drehbuch) {
  const w = fenster[schluessel]
  pruefe(name, w != null && w[0] === von && w[1] === bis, w ? `${w[0]}\u2013${w[1]} ms` : 'fehlt')
}
pruefe('ACCESS GRANTED steht voll bei 900 ms',
  fenster.wort != null && fenster.wort[0] + Math.round((fenster.wort[1] - fenster.wort[0]) * 0.3) === 900,
  fenster.wort ? `${fenster.wort[0] + Math.round((fenster.wort[1] - fenster.wort[0]) * 0.3)} ms` : 'fehlt')

/* Der Schnapper: 71 % von 700 ms nach 1300 ms Vorlauf. */
pruefe('Schloss schnappt bei ~1800 ms',
  fenster.bild != null && Math.abs(fenster.bild[0] + (fenster.bild[1] - fenster.bild[0]) * 0.71 - 1800) <= 40,
  fenster.bild ? `${Math.round(fenster.bild[0] + (fenster.bild[1] - fenster.bild[0]) * 0.71)} ms` : 'fehlt')

/* Auf halber Strecke steht ACCESS GRANTED — und die Truhe ist zu. */
await warte(700)
t = await text(seite)
pruefe('Mitten in der Sequenz steht ACCESS GRANTED', /ACCESS GRANTED/i.test(t))
pruefe('Mitten in der Sequenz noch kein Tresor', !/VIDEKO TRESOR/i.test(t))

await warte(2400)
t = await text(seite)
pruefe('Danach: DU HAST ZUGANG.', /DU HAST ZUGANG/i.test(t))
pruefe('Danach: Tippe die Truhe an.', /Tippe die Truhe an/i.test(t))
pruefe('Truhe bleibt zu — kein Tresor ohne Tippen', !/VIDEKO TRESOR/i.test(t))
pruefe('Buehne ist wieder weg', (await seite.$('.trm-buehne')) === null)
pruefe('Knopf TRUHE ANTIPPEN da', /TRUHE ANTIPPEN/i.test(t))
const bildNachher = await seite.$eval('.trm-truhe__bild', (e) => ({
  marke: e.dataset.pruefMarke || '',
  quelle: e.currentSrc || e.src || '',
}))
pruefe('Nach dem Code dieselbe Truhe (derselbe Knoten)', bildNachher.marke === 'vorher')
pruefe('Nach dem Code dasselbe Bild (nichts nachgeladen)', bildNachher.quelle === bildVorher,
  bildNachher.quelle.split('/').pop())

/* ================================================================== */
console.log('\n=== 2. Die drei Punkte auf der Truhe ===')

pruefe('Punkt Schloss da', (await seite.$('.trm-punkt--schloss')) !== null)
pruefe('Punkt Zeichen da', (await seite.$('.trm-punkt--zeichen')) !== null)
pruefe('Punkt Schluesselloch da', (await seite.$('.trm-punkt--schluessel')) !== null)

const masse = await seite.evaluate(() => {
  const r = (s) => {
    const e = document.querySelector(s)
    if (!e) return null
    const b = e.getBoundingClientRect()
    return { b: Math.round(b.width), h: Math.round(b.height) }
  }
  return { schloss: r('.trm-punkt--schloss'), zeichen: r('.trm-punkt--zeichen'), schluessel: r('.trm-punkt--schluessel') }
})
const gross = Object.values(masse).every((m) => m && m.b >= 40 && m.h >= 28)
pruefe('Alle drei Punkte gross genug fuer den Finger', gross, JSON.stringify(masse))

await seite.click('.trm-punkt--schloss')
await warte(250)
t = await text(seite)
pruefe('Schloss antwortet „Noch nicht."', /Noch nicht/i.test(t))
pruefe('Truhe ruckelt beim Schloss', (await seite.$('.trm-truhe--wackelt')) !== null)
pruefe('Funken am Schloss', (await seite.$('.trm-punkt__funken')) !== null)
await warte(1400)

await seite.click('.trm-punkt--zeichen')
await warte(250)
t = await text(seite)
pruefe('Zeichen antwortet', /VIDEKO\./.test(t))
pruefe('Zeichen leuchtet auf', (await seite.$('.trm-truhe--zeichen')) !== null)
await warte(1400)

t = await text(seite)
pruefe('Schloss fuehrt nicht in den Tresor', !/VIDEKO TRESOR/i.test(t))

/* Schluesselloch */
await seite.click('.trm-punkt--schluessel')
await warte(160)
pruefe('Vor dem Flug: eigener Satz', (await seite.$('.trm-buehne--vorflug')) !== null &&
  /Vorher durftest du nur reinschauen\. Jetzt darfst du rein\./.test(await text(seite)))
pruefe('Vor dem Flug: noch kein Flug', (await seite.$('.trm-buehne--schluessel')) === null)
await seite.waitForSelector('.trm-buehne--schluessel', { timeout: 2500 }).catch(() => null)
await warte(60)
pruefe('Flug-Buehne erscheint', (await seite.$('.trm-buehne--schluessel')) !== null)
pruefe('Schaerfe liegt auf dem Schloss', (await seite.$('.trm-buehne__weich')) !== null)
pruefe('Goldener Lichtstrahl da', (await seite.$('.trm-buehne__strahl')) !== null)
pruefe('Schwarze Schlossform da', (await seite.$('.trm-buehne__maske')) !== null)
pruefe('Am Ende steht Schwarz bereit', (await seite.$('.trm-buehne__schwarz')) !== null)
pruefe('Truhe fliegt auf die Kamera zu', (await seite.$('.trm-truhe--flug')) !== null)
pruefe('Kein toter Ring mehr', (await seite.$('.trm-buehne__loch')) === null)

/* Butterweich heisst: nichts bewegt sich, das ein neues Layout ausloest.
   Geprueft wird, dass jede Schicht nur `transform` und `opacity` animiert —
   und dass der Weichzeichner einen festen Radius hat statt eines
   wandernden. */
const schluesselPruefung = await seite.evaluate(() => {
  const erlaubt = new Set(['transform', 'opacity', 'letter-spacing', 'all', 'none'])
  const namen = [...document.styleSheets]
    .flatMap((b) => {
      try {
        return [...b.cssRules]
      } catch {
        return []
      }
    })
    .filter((r) => r.type === CSSRule.KEYFRAMES_RULE)
    .filter((r) => ['trm-maske', 'trm-strahl', 'trm-flug', 'trm-weich-auf', 'trm-schwarz'].includes(r.name))
  const teuer = []
  for (const kf of namen) {
    for (const bild of kf.cssRules) {
      for (const eigenschaft of bild.style) {
        if (!erlaubt.has(eigenschaft)) teuer.push(`${kf.name}:${eigenschaft}`)
      }
    }
  }
  const weich = document.querySelector('.trm-buehne__weich')
  const st = weich ? getComputedStyle(weich) : null
  const maske = document.querySelector('.trm-buehne__maske')
  const mst = maske ? getComputedStyle(maske) : null
  return {
    teuer,
    unschaerfe: st ? st.backdropFilter || st.webkitBackdropFilter : '',
    maskeDauer: mst ? mst.animationDuration : '',
    gefunden: namen.length,
  }
})
pruefe('Alle fuenf Bilderfolgen der Sequenz vorhanden', schluesselPruefung.gefunden === 5,
  `${schluesselPruefung.gefunden}`)
pruefe('Sequenz bewegt nur Transform und Deckkraft', schluesselPruefung.teuer.length === 0,
  schluesselPruefung.teuer.join(', '))
pruefe('Weichzeichner mit festem Radius', /blur\(5px\)/.test(schluesselPruefung.unschaerfe),
  schluesselPruefung.unschaerfe)
pruefe('Sequenz bleibt unter 1,5 s', parseFloat(schluesselPruefung.maskeDauer) <= 1.2,
  schluesselPruefung.maskeDauer)

await seite.waitForSelector('#trm-deckel', { timeout: 3000 }).catch(() => null)
await warte(200)
t = await text(seite)
pruefe('Im Tresor gelandet', /VIDEKO TRESOR/i.test(t))
pruefe('Tresor-Tor fragt nach Aktivierung', /aktiviere deinen Deckel/i.test(t))
pruefe('Aktivierungsformular im Tresor', (await seite.$('#trm-deckel')) !== null)
pruefe('Games noch gesperrt', (await seite.$('.trm-spiel')) === null)

/* ================================================================== */
console.log('\n=== 3. Aktivierung mit Rangliste-Einwilligung ===')

pruefe('Einwilligung zur Rangliste vorhanden', (await seite.$('#trm-leaderboard')) !== null)
const pflicht = await seite.evaluate(() => {
  const e = document.querySelector('#trm-leaderboard')
  return e ? { required: e.required, checked: e.checked } : null
})
pruefe('Einwilligung ist freiwillig (nicht required, nicht vorausgewaehlt)',
  pflicht && pflicht.required === false && pflicht.checked === false, JSON.stringify(pflicht))

await seite.type('#trm-deckel', '4711')
await seite.type('#trm-instagram', 'testlauf')
await seite.type('#trm-email', 'test@example.com')
await seite.click('#trm-folgt')
await seite.click('#trm-leaderboard')
await seite.evaluate(() => {
  const f = document.querySelector('#trm-deckel')?.closest('form')
  f?.requestSubmit()
})
await warte(900)

t = await text(seite)
pruefe('Zugang vollstaendig freigeschaltet', /ZUGANG VOLLSTÄNDIG FREIGESCHALTET/i.test(t))
pruefe('Deckelnummer im Tresor sichtbar', /4711/.test(t))
const spielKarten = await seite.$$eval('.trm-spiel', (n) => n.map((e) => e.id))
pruefe('Truhenknacker und Goldrausch als volle Karten, Stack und Dash ausgeblendet',
  spielKarten.join(',') === 'truhenknacker,goldrausch', spielKarten.join(', '))
const wahlKarten = await seite.$$eval('[data-spielwahl]', (n) => n.map((e) => e.dataset.spielwahl))
pruefe('Acht neue Games als kompakte Auswahlkarten', wahlKarten.join(',') === NEUE_GAMES.join(','), wahlKarten.join(', '))
pruefe('Tresorkoenig sichtbar', /TRESORKÖNIG/i.test(t) && /tresorkoenig/.test(t))
const koenigKarte = await seite.$eval('.trm-koenig', (n) => n.textContent)
pruefe('Tresorkoenig kommt aus dem Gesamtranking (max 4.000), nicht aus der Legacy-Summe',
  /3\.870 \/ 4\.000 Punkte im Gesamtranking/.test(koenigKarte) && !/42\.840|Punkte gesamt/.test(koenigKarte), koenigKarte)
pruefe('Keine E-Mail-Adresse im Tresor', !/test@example\.com/.test(t))

/* ================================================================== */
console.log('\n=== 4. Nachladen — bleibt der Zustand? ===')

await seite.reload({ waitUntil: 'networkidle0' })
await warte(700)
t = await text(seite)
pruefe('Nach Reload wieder im Tresor', /DEIN DECKEL IST IM TRESOR/i.test(t))
pruefe('Nach Reload keine Inszenierung noch einmal', (await seite.$('.trm-buehne')) === null)
pruefe('Nach Reload Games weiter offen', (await seite.$$('.trm-spiel')).length === 2 && (await seite.$$('[data-spielwahl]')).length === 8)
pruefe('Nach Reload kein Codefeld', (await seite.$('.trm-code')) === null)

/* Dashboard-Karte Gesamtranking: noch nichts gespielt, also nicht qualifiziert. */
const grKarte = await seite.$eval('#trm-gr-karte', (e) => e.innerText).catch(() => '')
pruefe('Dashboard: Gesamtranking-Karte da', grKarte !== '')
pruefe('Dashboard: Stand "0/4 GAMES GESPIELT"', /GESAMTRANKING: 0\/4 GAMES GESPIELT/i.test(grKarte), grKarte.slice(0, 160))
pruefe('Dashboard: fehlende Games genannt',
  (await seite.$('#trm-gr-karte [data-gr-fehlt]')) !== null && /NOCH 4 SPIELE BIS ZUM GESAMTRANKING/i.test(grKarte),
  grKarte.slice(0, 200))
pruefe('Dashboard: sechs Zeilen, eine je Hauptgame',
  (await seite.$$eval('#trm-gr-karte [data-gr-spiel]', (n) => n.map((e) => e.dataset.grSpiel))).join(',') === HAUPTGAMES.join(','))
pruefe('Dashboard: ohne Preise kein Preisblock', (await seite.$('#trm-gr-karte [data-gr-preise]')) === null)
pruefe('Dashboard-Karte ohne E-Mail', !/@[\w.-]+\.(de|com|net)/.test(grKarte))

/* ================================================================== */
console.log('\n=== 5. Truhenknacker — eine ganze Runde ===')

await seite.evaluate(() => document.querySelector('#truhenknacker')?.scrollIntoView())
await warte(200)
const startKnack = await seite.$('#truhenknacker .trm-cta')
pruefe('Startknopf Truhenknacker da', startKnack !== null)
await startKnack.click()
await warte(700)

pruefe('Ringe sind da', (await seite.$$('#truhenknacker .trm-ring')).length >= 3,
  String((await seite.$$('#truhenknacker .trm-ring')).length))
pruefe('Genau ein aktiver Ring', (await seite.$$('#truhenknacker .trm-ring--aktiv')).length === 1)
pruefe('Zeiger da', (await seite.$('#truhenknacker .trm-ring__zeiger')) !== null)
pruefe('Trefferzone da', (await seite.$('#truhenknacker .trm-ring__zone')) !== null)

/* Dreht sich der Ring wirklich? */
const dreh1 = await seite.$eval('#truhenknacker .trm-ring--aktiv g[transform]', (g) => g.getAttribute('transform'))
await warte(260)
const dreh2 = await seite.$eval('#truhenknacker .trm-ring--aktiv g[transform]', (g) => g.getAttribute('transform'))
pruefe('Der aktive Ring dreht sich', dreh1 !== dreh2, `${dreh1} → ${dreh2}`)

/* Gezielt treffen: warten, bis die Zone unter dem Zeiger steht (oben, 0 Grad). */
async function knackeTreffer(seite) {
  return seite.evaluate(async () => {
    const g = document.querySelector('.trm-ring--aktiv g[transform]')
    const taste = document.querySelector('.trm-ring-taste')
    if (!g || !taste) return false
    const winkel = () => {
      const m = /rotate\(\s*(-?[\d.]+)/.exec(g.getAttribute('transform') || '')
      return m ? ((Number(m[1]) % 360) + 360) % 360 : 0
    }
    for (let i = 0; i < 600; i += 1) {
      const w = winkel()
      if (w > 352 || w < 8) {
        taste.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
        return true
      }
      await new Promise((r) => requestAnimationFrame(r))
    }
    return false
  })
}

let treffer = 0
for (let i = 0; i < 6; i += 1) {
  const ok = await knackeTreffer(seite)
  if (ok) treffer += 1
  await warte(420)
}
pruefe('Gezielte Treffer moeglich', treffer >= 4, `${treffer}/6 Versuche abgesetzt`)
t = await text(seite)
const punkteJetzt = await standLesen(seite, '#truhenknacker')
pruefe('Treffer bringen Punkte', punkteJetzt > 0, `${punkteJetzt}`)
pruefe('Ruf-Meldung erscheint (PERFEKT/GUT/TREFFER)',
  /PERFEKT|PERFECT|GUT|TREFFER|COMBO|VERKANTET/i.test(t))

/* Fehlgriff: mitten in der Leerlaufzone drucken */
await seite.evaluate(() => {
  const g = document.querySelector('.trm-ring--aktiv g[transform]')
  const taste = document.querySelector('.trm-ring-taste')
  if (!g || !taste) return
  const m = /rotate\(\s*(-?[\d.]+)/.exec(g.getAttribute('transform') || '')
  const w = m ? ((Number(m[1]) % 360) + 360) % 360 : 0
  if (w > 90 && w < 270) taste.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
})
await warte(200)

/* Runde auslaufen lassen */
console.log('  … Runde laeuft aus (30 s)')
await warte(31000)
t = await text(seite)
/* Der Neustart heisst im Ergebnisblock NOCHMAL. Den zweiten Knopf
   NOCH EINE RUNDE im Kartenkopf gibt es nach dem Rundenende nicht
   mehr; das Wort bleibt hier nur als Rueckfall stehen. */
pruefe('Runde endet von selbst', /RUNDE VORBEI|NOCH EINE RUNDE|NOCHMAL/i.test(t),
  await seite
    .$eval('#truhenknacker .trm-spiel__ergebnis-label', (e) => e.textContent)
    .catch(() => 'kein Ergebnisblock'))
const endstand = await seite.$eval('#truhenknacker .trm-spiel__endstand', (e) => e.textContent).catch(() => null)
pruefe('Endstand wird gezeigt', endstand !== null, String(endstand))
const bestKnack = Number(String(endstand || '0').replace(/\./g, ''))
pruefe('Ergebnis ist eine Zahl > 0', bestKnack > 0, String(bestKnack))
pruefe('Bestwert uebernommen', /BESTWERT|BEST/i.test(t))
pruefe('Eigener Platz sichtbar', /DEIN PLATZ|#7/i.test(t))

/* Der Ergebnisblock nach der Runde: Platz, Abstand nach oben und die beiden
   Messlatten. Die Zahlen stehen so im Stub — hier wird geprueft, dass sie
   ankommen und mit Tausenderpunkt gesetzt sind. */
const ergebnisBlock = await seite
  .$eval('#truhenknacker .trm-spiel__mitte--ergebnis', (e) => e.textContent)
  .catch(() => '')
pruefe('PLATZ 7 VON 143 steht da', /7\s*VON\s*143/i.test(ergebnisBlock), ergebnisBlock.slice(0, 120))
pruefe('Der Abstand nach oben steht da', /1\.420/.test(ergebnisBlock) && /5/.test(ergebnisBlock),
  (await seite.$eval('#truhenknacker .trm-spiel__jagd', (e) => e.textContent).catch(() => 'fehlt')))
pruefe('Bester heutiger Lauf steht da', /21\.840/.test(ergebnisBlock))
pruefe('Der eigene Bestwert steht daneben',
  (await seite.$$eval('#truhenknacker .trm-spiel__marke', (l) => l.length)) === 2,
  ergebnisBlock.slice(-80))

/* ================================================================== */
console.log('\n=== 6. Goldrausch — eine ganze Runde ===')

await seite.evaluate(() => document.querySelector('#goldrausch')?.scrollIntoView())
await warte(200)
await (await seite.$('#goldrausch .trm-cta')).click()
await warte(1500)

const objekte = await seite.$$eval('#goldrausch .trm-stueck', (n) => n.length)
pruefe('Objekte fallen', objekte > 0, `${objekte} gleichzeitig`)
pruefe('Tresorschlitz unten da', (await seite.$('#goldrausch .trm-gold-tresor')) !== null)

/* Bewegen sich die Objekte? */
const pos1 = await seite.$eval('#goldrausch .trm-stueck', (e) => e.style.transform)
await warte(260)
const pos2 = await seite.$eval('#goldrausch .trm-stueck', (e) => e.style.transform).catch(() => 'weg')
pruefe('Objekte bewegen sich', pos1 !== pos2)

/* Alle Typen treffen im Laufe der Runde auf? */
const gesehen = new Set()
const bisEnde = Date.now() + 26000
let getippt = 0
while (Date.now() < bisEnde) {
  const arten = await seite.$$eval('#goldrausch .trm-stueck', (n) => n.map((e) => e.className))
  for (const k of arten) {
    const m = /trm-stueck--(\w+)/.exec(k)
    if (m) gesehen.add(m[1])
  }
  /* Gutes anklicken, Bomben liegen lassen — so wie ein Mensch spielt. */
  const gklickt = await seite.evaluate(() => {
    const gut = [...document.querySelectorAll('#goldrausch .trm-stueck')].filter((e) =>
      /--(muenze|diamant|ente|goldente)$/.test(e.className),
    )
    const erste = gut[0]
    if (!erste) return 0
    erste.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    return 1
  })
  getippt += gklickt
  await warte(170)
}
pruefe('Mehrere Objektarten erschienen', gesehen.size >= 3, [...gesehen].join(', '))
pruefe('Objekte lassen sich antippen', getippt > 10, `${getippt} Treffer`)

await warte(7000)
t = await text(seite)
const endGold = await seite.$eval('#goldrausch .trm-spiel__endstand', (e) => e.textContent).catch(() => null)
pruefe('Goldrausch-Runde endet', endGold !== null, String(endGold))
pruefe('Goldrausch-Punkte > 0', Number(String(endGold || '0').replace(/\./g, '')) > 0)
pruefe('Kein Javascript-Fehler in beiden Spielen', seite.__fehler.length === 0, seite.__fehler.slice(0, 2).join(' | '))

/* ================================================================== */
console.log('\n=== 7. Rangliste ===')

const seite2 = await neueSeite()
await seite2.goto(`${BASIS}/terminal/rangliste`, { waitUntil: 'networkidle0' })
await warte(700)
t = await text(seite2)
const reiter = await seite2.$$eval('.trm-reiter__taste', (n) => n.map((e) => e.textContent.trim()))
const REITER_SOLL = ['LEITUNGSFINDER', 'MERGE', 'CRUSH', 'JUMP', 'FIT', 'SLAM', 'TINDER', 'BALANCE', 'TRUHENKNACKER', 'GOLDRAUSCH', 'GESAMTRANKING']
pruefe('Elf Reiter (Stack und Dash ausgeblendet, kein alter GESAMT-Reiter)', reiter.length === 11, reiter.join(' | '))
pruefe('Alter GESAMT-Reiter oeffentlich ausgeblendet',
  (await seite2.$('#trm-reiter-gesamt')) === null && !reiter.some((r) => /^GESAMT$/i.test(r)), reiter.join(' | '))
pruefe('Reiter heissen richtig', REITER_SOLL.every((w, i) => (reiter[i] || '').toUpperCase().includes(w)), reiter.join(' | '))
pruefe('Medaillen auf den ersten drei Plaetzen', /🥇/.test(t) && /🥈/.test(t) && /🥉/.test(t))
pruefe('Namen mit @ davor', /@tresorkoenig/.test(t))
pruefe('Punkte mit Tausenderpunkt', /42\.840/.test(t))
pruefe('Keine Deckelnummern in der Rangliste', !/Deckel\s*#?\d/i.test(t))
pruefe('Keine E-Mail-Adresse in der Rangliste', !/@[\w.-]+\.(de|com|net)/.test(t))

await seite2.click('.trm-reiter__taste:nth-child(2)')
await warte(250)
const gewaehlt = await seite2.$$eval('.trm-reiter__taste', (n) => n.map((e) => e.getAttribute('aria-selected')))
pruefe('Reiter umschalten funktioniert', gewaehlt[1] === 'true', gewaehlt.join(','))

/* Gesamtranking: eigener Reiter vor GESAMT, Formel, anonymer Platz, keine Preise. */
pruefe('Reiter GESAMTRANKING hat eine eigene Kennung', (await seite2.$('#trm-reiter-gesamtranking')) !== null)
await seite2.click('#trm-reiter-gesamtranking')
await warte(250)
t = await text(seite2)
pruefe('GESAMTRANKING: Kopf mit Erklaerung',
  (await seite2.$('[data-gr-reiter]')) !== null && /BESTE 4 AUS 6/.test(t)
    && /besten vier Ergebnisse aus sechs Spielen/.test(t), t.slice(0, 160))
pruefe('GESAMTRANKING: Formel steht da', /Gesamtpunkte = Summe dieser vier, maximal 4\.000/.test(
  await seite2.$eval('[data-gr-formel]', (e) => e.textContent).catch(() => '')))
pruefe('GESAMTRANKING: Medaillen und Punkte', /🥇/.test(t) && /3\.870/.test(t))
/* Im Namensfeld steht seit Pass 5 auch die Kette der gewerteten Spiele —
   der anonyme Platzhalter ist deshalb der Anfang, nicht der ganze Text. */
const anonym = await seite2.$eval('[data-anonym="1"]', (e) => e.textContent).catch(() => null)
pruefe('GESAMTRANKING: ohne Einwilligung als "nicht öffentlich"',
  (anonym || '').startsWith('nicht öffentlich'), String(anonym))
pruefe('GESAMTRANKING: ohne eingetragene Preise kein Preisblock', (await seite2.$('[data-gr-preise]')) === null)
pruefe('GESAMTRANKING: keine E-Mail, keine Deckelnummer', !/@[\w.-]+\.(de|com|net)/.test(t) && !/Deckel\s*#?\d/i.test(t))

/* Ausgeloggt, ausdruecklich: kein Sitzungsbeleg, frisch geladen. Die Attrappe
   liefert `eigen` trotzdem mit — die Zeile darf dann nicht erscheinen. */
await seite2.evaluate(() => {
  localStorage.removeItem('videko.terminal.sitzung')
  sessionStorage.removeItem('videko.terminal.sitzung')
})
const rufeAusgeloggt = seite2.__rufe.length
await seite2.reload({ waitUntil: 'networkidle0' })
await warte(600)
await seite2.click('#trm-reiter-gesamtranking')
await warte(250)
const rangRufe = seite2.__rufe.slice(rufeAusgeloggt).filter((r) => r.aktion === 'rangliste')
pruefe('GESAMTRANKING ausgeloggt: Anfrage ohne Sitzungsbeleg', rangRufe.length > 0 && rangRufe.every((r) => !r.sitzung))
pruefe('GESAMTRANKING ausgeloggt: keine eigene Zeile',
  (await seite2.$('[data-gr-eigen]')) === null && (await seite2.$('.trm-rang__eigen')) === null && (await seite2.$('[data-ich="1"]')) === null)

welt.grPreise = { 1: 'Messerset', 2: null, 3: 'Schuerze' }
await seite2.reload({ waitUntil: 'networkidle0' })
await warte(600)
await seite2.click('#trm-reiter-gesamtranking')
await warte(250)
const preisText = await seite2.$eval('[data-gr-preise]', (e) => e.innerText).catch(() => '')
pruefe('GESAMTRANKING: eingetragene Preise erscheinen, leere nicht',
  /DIE DREI BESTEN SPIELER DES GESAMTRANKINGS GEWINNEN DIE AUSGESCHRIEBENEN RANKINGPREISE\./i.test(preisText)
  && /PLATZ 1\s*Messerset/i.test(preisText)
  && /PLATZ 3\s*Schuerze/i.test(preisText) && !/PLATZ 2/i.test(preisText), preisText.replace(/\s+/g, ' '))
welt.grPreise = null

pruefe('Oeffentlich kein Hinweis auf die alte GESAMT-Wertung',
  !/Gesamt = bester Truhenknacker-Lauf plus bester Goldrausch-Lauf\./.test(await text(seite2)))
await seite2.click('.trm-reiter__taste:nth-child(3)')
await warte(250)
pruefe('BALANCE hat eine eigene Liste',
  (await seite2.$$eval('.trm-reiter__taste', (n) => n.map((e) => e.getAttribute('aria-selected'))))[2] === 'true' &&
  /@tresorkoenig/.test(await text(seite2)))

/* Reihenfolge aus der Verwaltung: TINDER nach vorn, GESAMT bleibt hinten. */
welt.spieleReihenfolge = ['kuechen_tinder', 'truhenknacker']
await seite2.reload({ waitUntil: 'networkidle0' })
await warte(600)
const reiterSortiert = await seite2.$$eval('.trm-reiter__taste', (n) => n.map((e) => e.textContent.trim().toUpperCase()))
pruefe('Reiter folgen der Reihenfolge aus der Verwaltung',
  reiterSortiert[0]?.includes('TINDER') && reiterSortiert[1]?.includes('TRUHENKNACKER') && reiterSortiert[10] === 'GESAMTRANKING' && reiterSortiert.length === 11,
  reiterSortiert.join(' | '))
welt.spieleReihenfolge = null

/* Eigener Platz, mit Sitzungsbeleg im Speicher */
await seite2.evaluate(() => {
  window.localStorage.setItem('videko.terminal.sitzung', 'sitzung-beleg')
})
await seite2.reload({ waitUntil: 'networkidle0' })
await warte(700)
t = await text(seite2)
pruefe('Eigener Platz hervorgehoben', (await seite2.$('.trm-rang__zeile[data-ich="1"]')) !== null)
pruefe('DEIN PLATZ wird genannt', /DEIN PLATZ/i.test(t), t.match(/DEIN PLATZ[^\n]*/)?.[0] || '')
await seite2.click('#trm-reiter-gesamtranking')
await warte(250)
const grEigen = await seite2.$eval('[data-gr-eigen]', (e) => e.textContent).catch(() => '')
pruefe('GESAMTRANKING: mit Sitzung eigener Stand', /GESAMTRANKING: [0-4]\/4 GAMES GESPIELT|PLATZ 9 VON 31/.test(grEigen), grEigen)

/* ================================================================== */
console.log('\n=== 7b. Follower-Mission, Einwilligung, KÜCHEN-STACK, KÜCHEN-DASH ===')

const sDash = await neueSeite(390, 844)
/* Stack und Dash sind im Standard ausgeblendet; fuer diesen Abschnitt an. */
welt.spieleAktiv = { ...ALT_AN, kuechen_stack: true, kuechen_dash: true }
await sDash.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
await sDash.evaluate(() => {
  localStorage.clear()
  localStorage.setItem('videko.terminal.sitzung', 'sitzung-beleg')
  localStorage.setItem('videko.terminal.tresor', '1')
})

/* Mission: Startwert 750, noch keine Stufe offen. Die Reihe beginnt bei
   1.500 — alles darunter ist laengst gelaufen und steht nirgends mehr. */
welt.followerZahl = 750
welt.meilensteinGewinne = {}
await sDash.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await warte(600)
const mission750 = await sDash.evaluate(() => ({
  da: document.querySelector('#mission') !== null,
  kopf: (document.querySelector('#trm-mission-titel')?.textContent || '').trim(),
  frage: (document.querySelector('.trm-mission__frage')?.textContent || '').trim(),
  zahl: (document.querySelector('.trm-mission__zahl')?.textContent || '').trim(),
  fehlt: (document.querySelector('.trm-mission__fehlt')?.textContent || '').trim(),
  takt: (document.querySelector('.trm-mission__takt')?.textContent || '').trim(),
  stufen: document.querySelectorAll('.trm-mission__stufe').length,
  frei: document.querySelectorAll('.trm-mission__stufe[data-frei="1"]').length,
  erste: (document.querySelector('.trm-mission__stufe')?.textContent || '').replace(/\s+/g, ' ').trim(),
  alleStufen: [...document.querySelectorAll('.trm-mission__stufe')]
    .map((e) => e.textContent.replace(/\s+/g, ' ').trim()).join(' | '),
  gewinne: [...document.querySelectorAll('.trm-mission__gewinn')].map((e) => e.textContent.trim()),
  /* Das Schloss ist gezeichnet, nicht getippt: ein <svg>, kein Emoji. */
  schloesser: document.querySelectorAll('.trm-mission__schloss').length,
  schlossIstSvg: document.querySelector('.trm-mission__schloss')?.tagName.toLowerCase() === 'svg',
  emojiImText: /🔒/.test(document.querySelector('.trm-mission__stufen')?.textContent || ''),
  /* Die naechste Stufe muss sich von den spaeteren abheben. */
  naechsteZahl: document.querySelectorAll('.trm-mission__stufe[data-naechste="1"]').length,
  naechsteIstErste:
    document.querySelector('.trm-mission__stufe[data-naechste="1"]') === document.querySelector('.trm-mission__stufe'),
  naechsteRand: (() => {
    const n = document.querySelector('.trm-mission__stufe[data-naechste="1"]')
    const s = [...document.querySelectorAll('.trm-mission__stufe')].find(
      (e) => e.dataset.naechste === '0' && e.dataset.mega === '0',
    )
    return n && s ? { naechste: getComputedStyle(n).borderTopColor, spaeter: getComputedStyle(s).borderTopColor } : null
  })(),
  balken: document.querySelector('.trm-mission__balken')?.getAttribute('aria-valuenow'),
}))
pruefe('MISSION: Karte im Dashboard', mission750.da)
pruefe('MISSION: Kopfzeile MISSION', mission750.kopf === 'MISSION', mission750.kopf)
pruefe('MISSION: Frage WIE WEIT SCHAFFEN WIR ES?', mission750.frage === 'WIE WEIT SCHAFFEN WIR ES?', mission750.frage)
pruefe('MISSION: 750 FOLLOWER', mission750.zahl === '750 FOLLOWER', mission750.zahl)
pruefe('MISSION: Noch 750 bis zum nächsten Zusatzgewinn',
  /^Noch 750 bis zum nächsten Zusatzgewinn/.test(mission750.fehlt), mission750.fehlt)
pruefe('MISSION: Taktzeile nennt die 500er-Schritte',
  /Alle 500 neuen Follower/.test(mission750.takt), mission750.takt)
pruefe('MISSION: acht Stufen, keine frei', mission750.stufen === 8 && mission750.frei === 0,
  `${mission750.stufen}/${mission750.frei}`)
pruefe('MISSION: 1.500 gesperrt mit Schloss', /1\.?500/.test(mission750.erste) && !/FREIGESCHALTET/.test(mission750.erste),
  mission750.erste)
pruefe('MISSION: acht gezeichnete Schloesser, kein Emoji',
  mission750.schloesser === 8 && mission750.schlossIstSvg && mission750.emojiImText === false,
  `${mission750.schloesser} · svg=${mission750.schlossIstSvg} · emoji=${mission750.emojiImText}`)
pruefe('MISSION: genau die erste Stufe ist als naechstes Ziel markiert',
  mission750.naechsteZahl === 1 && mission750.naechsteIstErste,
  `${mission750.naechsteZahl} · erste=${mission750.naechsteIstErste}`)
pruefe('MISSION: das naechste Ziel ist beschriftet und hebt sich vom Rest ab',
  /NÄCHSTES ZIEL/.test(mission750.erste)
    && mission750.naechsteRand != null
    && mission750.naechsteRand.naechste !== mission750.naechsteRand.spaeter,
  JSON.stringify(mission750.naechsteRand))
pruefe('MISSION: Balken misst die ganze Strecke bis 5.000 — 750 sind 15 %',
  mission750.balken === '15', mission750.balken)
pruefe('MISSION: keine alte Schwelle 1.000 oder 1.250 mehr sichtbar',
  !/1\.?000|1\.?250/.test(mission750.alleStufen), mission750.alleStufen.slice(0, 90))
pruefe('MISSION: ohne Eintrag ZUSATZGEWINN', mission750.gewinne.length === 7 && mission750.gewinne.every((g) => g === 'ZUSATZGEWINN'),
  `${mission750.gewinne.length} · ${mission750.gewinne.slice(0, 2).join(' | ')}`)

/* Die letzte Stufe: eigene Zeile, eigenes Wort, mehr Gold. */
const missionMega = await sDash.evaluate(() => {
  const stufen = [...document.querySelectorAll('.trm-mission__stufe')]
  const mega = document.querySelector('.trm-mission__stufe[data-mega="1"]')
  const erste = stufen[0]
  const st = mega ? getComputedStyle(mega) : null
  const sErste = erste ? getComputedStyle(erste) : null
  return {
    anzahl: document.querySelectorAll('.trm-mission__stufe[data-mega="1"]').length,
    letzte: mega === stufen[stufen.length - 1],
    text: (mega?.textContent || '').replace(/\s+/g, ' ').trim(),
    breit: mega && erste ? mega.getBoundingClientRect().width > erste.getBoundingClientRect().width * 1.6 : false,
    zielGross:
      mega && erste
        ? parseFloat(getComputedStyle(mega.querySelector('.trm-mission__ziel')).fontSize) >
          parseFloat(getComputedStyle(erste.querySelector('.trm-mission__ziel')).fontSize)
        : false,
    glanz: st ? st.boxShadow : '',
    rahmen: st ? st.borderTopWidth : '',
    rahmenErste: sErste ? sErste.borderTopWidth : '',
  }
})
pruefe('MISSION: genau eine MEGA-Stufe, und zwar die letzte',
  missionMega.anzahl === 1 && missionMega.letzte, `${missionMega.anzahl} · letzte=${missionMega.letzte}`)
pruefe('MISSION: MEGA-Stufe zeigt 5.000 und das Wort MEGA-PREIS',
  /5\.?000/.test(missionMega.text) && /MEGA-PREIS/.test(missionMega.text), missionMega.text)
pruefe('MISSION: MEGA-Stufe nimmt die ganze Zeile ein', missionMega.breit, String(missionMega.breit))
pruefe('MISSION: MEGA-Zahl ist größer als die der übrigen Stufen', missionMega.zielGross, String(missionMega.zielGross))
pruefe('MISSION: MEGA-Stufe leuchtet stärker und hat den dickeren Rahmen',
  /rgba?\(/.test(missionMega.glanz) && parseFloat(missionMega.rahmen) > parseFloat(missionMega.rahmenErste),
  `${missionMega.rahmen} vs ${missionMega.rahmenErste}`)

/* Kurz vor Schluss: sieben Stufen stehen, der Text wechselt auf MEGA-PREIS. */
welt.followerZahl = 4600
welt.meilensteinGewinne = { 1500: 'Testpreis' }
await sDash.reload({ waitUntil: 'networkidle0' })
await warte(600)
const mission4600 = await sDash.evaluate(() => {
  const stufen = [...document.querySelectorAll('.trm-mission__stufe')]
  return {
    zahl: (document.querySelector('.trm-mission__zahl')?.textContent || '').trim(),
    fehlt: (document.querySelector('.trm-mission__fehlt')?.textContent || '').trim(),
    takt: (document.querySelector('.trm-mission__takt')?.textContent || '').trim(),
    frei: stufen.filter((e) => e.dataset.frei === '1').length,
    ersteText: (stufen[0]?.textContent || '').replace(/\s+/g, ' '),
    ersteGewinn: (stufen[0]?.querySelector('.trm-mission__gewinn')?.textContent || '').trim(),
    zweiteGewinn: (stufen[1]?.querySelector('.trm-mission__gewinn')?.textContent || '').trim(),
    megaFrei: document.querySelector('.trm-mission__stufe[data-mega="1"]')?.dataset.frei,
    naechste: [...document.querySelectorAll('.trm-mission__stufe[data-naechste="1"]')]
      .map((e) => e.querySelector('.trm-mission__ziel')?.textContent.trim()).join(''),
    glanz: stufen[0] ? getComputedStyle(stufen[0]).boxShadow + getComputedStyle(stufen[0]).textShadow : '',
    balken: document.querySelector('.trm-mission__balken')?.getAttribute('aria-valuenow'),
    fuellung: document.querySelector('.trm-mission__balken .trm-balken__fuellung')?.style.width,
  }
})
pruefe('MISSION: 4.600 FOLLOWER', /^4\.600 FOLLOWER$/.test(mission4600.zahl), mission4600.zahl)
pruefe('MISSION: Noch 400 bis zum MEGA-PREIS', /^Noch 400 bis zum MEGA-PREIS\.$/.test(mission4600.fehlt), mission4600.fehlt)
pruefe('MISSION: Untenzeile wechselt auf 5.000 FOLLOWER = MEGA-PREIS',
  /5\.000 FOLLOWER = MEGA-PREIS/.test(mission4600.takt), mission4600.takt)
pruefe('MISSION: sieben Stufen FREIGESCHALTET, die MEGA-Stufe noch nicht',
  mission4600.frei === 7 && mission4600.megaFrei === '0' && /FREIGESCHALTET/.test(mission4600.ersteText),
  `${mission4600.frei} · mega=${mission4600.megaFrei}`)
pruefe('MISSION: nächste Stufe ist 5.000', /5\.?000/.test(mission4600.naechste), mission4600.naechste)
pruefe('MISSION: gepflegter Gewinn wird genannt', mission4600.ersteGewinn === 'Testpreis', mission4600.ersteGewinn)
pruefe('MISSION: sonst ZUSATZGEWINN', mission4600.zweiteGewinn === 'ZUSATZGEWINN', mission4600.zweiteGewinn)
pruefe('MISSION: freie Stufe leuchtet', /rgba?\(/.test(mission4600.glanz) && !/^none\s*none$/.test(mission4600.glanz),
  mission4600.glanz.slice(0, 60))
/* Kurz vor Schluss muss der Balken fast voll stehen. Als er noch nur bis zur
   naechsten Stufe mass, war er bei 4.500 leer — unter sieben freien Stufen. */
pruefe('MISSION: Balken steht bei 4.600 fast voll — 92 %',
  mission4600.balken === '92' && mission4600.fuellung === '92%',
  `${mission4600.balken} · ${mission4600.fuellung}`)

/* Alles geknackt: kein „noch X", kein negativer Rest. */
welt.followerZahl = 5200
welt.meilensteinGewinne = {}
await sDash.reload({ waitUntil: 'networkidle0' })
await warte(600)
const mission5200 = await sDash.evaluate(() => ({
  fehlt: (document.querySelector('.trm-mission__fehlt')?.textContent || '').trim(),
  takt: document.querySelector('.trm-mission__takt') !== null,
  frei: document.querySelectorAll('.trm-mission__stufe[data-frei="1"]').length,
  schloss: document.querySelectorAll('.trm-mission__schloss').length,
  megaWort: (document.querySelector('.trm-mission__stufe[data-mega="1"] .trm-mission__wort')?.textContent || '').trim(),
}))
pruefe('MISSION: über 5.000 meldet MEGA-PREIS FREIGESCHALTET',
  mission5200.fehlt === 'MEGA-PREIS FREIGESCHALTET.', mission5200.fehlt)
pruefe('MISSION: über 5.000 keine Taktzeile, alle acht Stufen frei, kein Schloss',
  mission5200.takt === false && mission5200.frei === 8 && mission5200.schloss === 0,
  `takt=${mission5200.takt} frei=${mission5200.frei} schloesser=${mission5200.schloss}`)
/* Die letzte Stufe darf im Moment des Erfolgs nicht ihre Beschriftung
   verlieren — sonst steht dort nur noch FREIGESCHALTET wie ueberall. */
pruefe('MISSION: die geknackte MEGA-Stufe bleibt als MEGA-PREIS beschriftet',
  mission5200.megaWort === 'MEGA-PREIS FREIGESCHALTET', mission5200.megaWort)

/* Zurueck auf den Wert, mit dem die spaeteren Abschnitte rechnen. */
welt.followerZahl = 1300
welt.meilensteinGewinne = { 1500: 'Testpreis' }
await sDash.reload({ waitUntil: 'networkidle0' })
await warte(600)

/* Einwilligung: Abschnitt 3 hat sie gesetzt. Erst Widerruf, dann wieder an. */
const besteVorher = JSON.stringify(welt.beste)
const aktiviertVorher = welt.aktiviert
const einwLesen = () =>
  sDash.evaluate(() => ({
    status: (document.querySelector('.trm-einwilligung__status')?.textContent || '').trim(),
    haken: document.querySelector('#trm-einw-haken')?.checked ?? null,
    noch: document.querySelector('.trm-einwilligung__noch') !== null,
    text: (document.querySelector('.trm-einwilligung__haken')?.textContent || '').trim(),
    titel: (document.querySelector('#trm-einw-titel')?.textContent || '').trim(),
  }))
let einw = await einwLesen()
pruefe('EINWILLIGUNG: Titel ÖFFENTLICHES LEADERBOARD', einw.titel === 'ÖFFENTLICHES LEADERBOARD', einw.titel)
pruefe('EINWILLIGUNG: Wortlaut der Checkbox',
  einw.text === 'Meinen Instagram-Namen zusammen mit meinen Game-Scores öffentlich im VIDEKO-Leaderboard anzeigen.', einw.text)
pruefe('EINWILLIGUNG: Aktuell: ÖFFENTLICH', einw.status === 'Aktuell: ÖFFENTLICH' && einw.haken === true && !einw.noch,
  JSON.stringify(einw))

const rufeEinw = sDash.__rufe.length
await sDash.$eval('#trm-einw-haken', (h) => h.click())
await sDash.$eval('.trm-einwilligung__speichern', (b) => b.click())
await warte(600)
einw = await einwLesen()
pruefe('OPT-OUT: Aktuell: NICHT ÖFFENTLICH', einw.status === 'Aktuell: NICHT ÖFFENTLICH' && einw.haken === false,
  JSON.stringify(einw))
pruefe('OPT-OUT: Hinweis und JETZT FREISCHALTEN',
  einw.noch && /Du bist noch nicht öffentlich im Leaderboard sichtbar\./.test(await text(sDash)) &&
    /JETZT FREISCHALTEN/.test(await text(sDash)))
pruefe('OPT-OUT: Server bekommt ok=false mit Sitzung',
  sDash.__rufe.slice(rufeEinw).some((r) => r.aktion === 'leaderboard' && r.ok === false && r.sitzung === 'sitzung-beleg'))
pruefe('OPT-OUT: Stand holt Platz und Tresorkoenig frisch',
  sDash.__rufe.slice(rufeEinw).some((r) => r.aktion === 'zustand'))
pruefe('OPT-OUT: gespeichert', welt.teilnehmer?.leaderboardOk === false)

await sDash.reload({ waitUntil: 'networkidle0' })
await warte(600)
einw = await einwLesen()
pruefe('OPT-OUT bleibt nach Reload', einw.status === 'Aktuell: NICHT ÖFFENTLICH' && einw.noch, JSON.stringify(einw))

const freiKnopf = await sDash.$$eval('.trm-einwilligung__noch button', (l) => l.length)
if (freiKnopf) await sDash.$eval('.trm-einwilligung__noch button', (b) => b.click())
await warte(600)
einw = await einwLesen()
pruefe('OPT-IN per JETZT FREISCHALTEN', einw.status === 'Aktuell: ÖFFENTLICH' && !einw.noch && welt.teilnehmer?.leaderboardOk === true,
  JSON.stringify(einw))
pruefe('Einwilligung laesst Scores und Teilnehmerzahl unberuehrt',
  JSON.stringify(welt.beste) === besteVorher && welt.aktiviert === aktiviertVorher)
pruefe('Keine E-Mail im Dashboard', !/test@example\.com/.test(await text(sDash)))

/* Sichtbarkeitswechsel nachstellen: headless bleibt der Tab sonst immer vorn. */
const tabWeg = (s, weg) =>
  s.evaluate((w) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => w })
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (w ? 'hidden' : 'visible') })
    document.dispatchEvent(new Event('visibilitychange'))
  }, weg)

/* KÜCHEN-STACK */
await sDash.evaluate(() => document.querySelector('#kuechen_stack')?.scrollIntoView())
await warte(200)
pruefe('KÜCHEN-STACK: Startknopf da', (await sDash.$('#kuechen_stack .trm-cta')) !== null)
await sDash.$eval('#kuechen_stack .trm-cta', (b) => b.click())
await sDash.waitForSelector('#kuechen_stack .trm-stack-buehne', { timeout: 3000 }).catch(() => null)
await warte(500)
pruefe('KÜCHEN-STACK: Buehne laeuft', (await sDash.$('#kuechen_stack .trm-stack-buehne')) !== null)
pruefe('KÜCHEN-STACK: Laufticket geholt',
  sDash.__rufe.some((r) => r.aktion === 'spiel-start' && r.game === 'kuechen_stack'))
const stackTipp = () =>
  sDash.$eval('#kuechen_stack .trm-stack-buehne', (b) => b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })))
    .catch(() => null)
await tabWeg(sDash, true)
await warte(200)
pruefe('KÜCHEN-STACK: Tabwechsel pausiert', (await sDash.$('#kuechen_stack .trm-spiel__pause')) !== null)
const wertPause = await sDash.$$eval('#kuechen_stack .trm-spiel__wert', (l) => l.map((e) => e.textContent).join('/'))
await tabWeg(sDash, false)
await stackTipp()
await warte(300)
pruefe('KÜCHEN-STACK: Weiter-Tipp setzt kein Modul',
  (await sDash.$('#kuechen_stack .trm-spiel__pause')) === null &&
    (await sDash.$$eval('#kuechen_stack .trm-spiel__wert', (l) => l.map((e) => e.textContent).join('/'))) === wertPause)
await warte(400)
await stackTipp()
await warte(500)
const stackNach = await sDash.$$eval('#kuechen_stack .trm-spiel__wert', (l) => l.map((e) => e.textContent).join('/'))
pruefe('KÜCHEN-STACK: ein Tipp wirkt (Modul gesetzt oder danebengefallen)',
  stackNach !== wertPause || (await sDash.$('#kuechen_stack .trm-spiel__endstand')) !== null, `${wertPause} → ${stackNach}`)

/* Wild tippen, bis ein Modul danebengeht. */
const stackBis = Date.now() + 60000
while (Date.now() < stackBis && !(await sDash.$('#kuechen_stack .trm-spiel__endstand'))) {
  await stackTipp()
  await warte(90 + Math.floor(Math.random() * 500))
}
const stackEnde = await sDash.waitForSelector('#kuechen_stack .trm-spiel__endstand', { timeout: 5000 }).then(() => true).catch(() => false)
pruefe('KÜCHEN-STACK: Runde endet mit Endstand', stackEnde)
await warte(400)
pruefe('KÜCHEN-STACK: Score geht an den Server',
  sDash.__rufe.some((r) => r.aktion === 'spiel-ende' && r.game === 'kuechen_stack' && Number.isFinite(Number(r.score))))
pruefe('KÜCHEN-STACK: Bestwert gesetzt', welt.beste.kuechen_stack != null, String(welt.beste.kuechen_stack))

/* KÜCHEN-DASH */
await sDash.evaluate(() => document.querySelector('#kuechen_dash')?.scrollIntoView())
await warte(200)
await sDash.$eval('#kuechen_dash .trm-cta', (b) => b.click())
await sDash.waitForSelector('#kuechen_dash .trm-dash-buehne', { timeout: 3000 }).catch(() => null)
pruefe('KÜCHEN-DASH: Buehne laeuft', (await sDash.$('#kuechen_dash .trm-dash-buehne')) !== null)
await sDash.$eval('#kuechen_dash .trm-dash-buehne', (b) => b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })))
await warte(120)
pruefe('KÜCHEN-DASH: Tipp laesst springen',
  (await sDash.$eval('#kuechen_dash .trm-dash-laeufer', (e) => e.dataset.luft).catch(() => '')) === '1')
await warte(600)
await tabWeg(sDash, true)
await warte(200)
const meterA = await sDash.$$eval('#kuechen_dash .trm-spiel__wert', (l) => l[0]?.textContent)
await warte(900)
const meterB = await sDash.$$eval('#kuechen_dash .trm-spiel__wert', (l) => l[0]?.textContent)
pruefe('KÜCHEN-DASH: Tabwechsel pausiert',
  (await sDash.$eval('#kuechen_dash .trm-dash-buehne', (e) => e.dataset.pause).catch(() => '')) === '1' &&
    (await sDash.$('#kuechen_dash .trm-spiel__pause')) !== null && meterA === meterB, `${meterA} → ${meterB}`)
await tabWeg(sDash, false)
await sDash.$eval('#kuechen_dash .trm-dash-buehne', (b) => b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })))
await warte(900)
const meterC = await sDash.$$eval('#kuechen_dash .trm-spiel__wert', (l) => l[0]?.textContent).catch(() => null)
pruefe('KÜCHEN-DASH: laeuft nach Tipp weiter',
  (await sDash.$('#kuechen_dash .trm-spiel__endstand')) !== null || (meterC != null && meterC !== meterB), `${meterB} → ${meterC}`)
const dashEnde = await sDash.waitForSelector('#kuechen_dash .trm-spiel__endstand', { timeout: 60000 }).then(() => true).catch(() => false)
pruefe('KÜCHEN-DASH: Treffer beendet die Runde', dashEnde)
await warte(400)
pruefe('KÜCHEN-DASH: Score geht an den Server',
  sDash.__rufe.some((r) => r.aktion === 'spiel-ende' && r.game === 'kuechen_dash' && Number.isFinite(Number(r.score))))
pruefe('KÜCHEN-DASH: Bestwert gesetzt', welt.beste.kuechen_dash != null, String(welt.beste.kuechen_dash))
pruefe('Neue Games aendern GESAMT nicht',
  summe() === (welt.beste.truhenknacker || 0) + (welt.beste.goldrausch || 0))
pruefe('Neue Games ohne JavaScript-Fehler', sDash.__fehler.length === 0, sDash.__fehler.slice(0, 2).join(' | '))

/* Ein Spiel in der Verwaltung ausgeblendet: Karte und Reiter weg, Score bleibt. */
const dashBest = welt.beste.kuechen_dash
welt.spieleAktiv = { ...ALT_AN, kuechen_stack: true, kuechen_dash: false }
await sDash.reload({ waitUntil: 'networkidle0' })
await warte(600)
const kartenAus = await sDash.$$eval('.trm-spiel', (n) => n.map((e) => e.id))
pruefe('AUSGEBLENDET: KÜCHEN-DASH-Karte fehlt', kartenAus.join(',') === 'truhenknacker,goldrausch,kuechen_stack',
  kartenAus.join(', '))
await sDash.goto(`${BASIS}/terminal/rangliste`, { waitUntil: 'networkidle0' })
await warte(600)
const reiterAus = await sDash.$$eval('.trm-reiter__taste', (n) => n.map((e) => e.textContent.trim()))
pruefe('AUSGEBLENDET: Reiter fehlt, GESAMTRANKING bleibt',
  reiterAus.length === 12 && !reiterAus.some((r) => /DASH/i.test(r)) && /^GESAMTRANKING$/i.test(reiterAus[11] || ''), reiterAus.join(' | '))
pruefe('AUSGEBLENDET: Score bleibt erhalten', welt.beste.kuechen_dash === dashBest)
welt.spieleAktiv = { ...ALT_AN }
await sDash.reload({ waitUntil: 'networkidle0' })
await warte(500)
pruefe('STANDARD: Stack und Dash wieder ausgeblendet', (await sDash.$$('.trm-reiter__taste')).length === 11)
await sDash.goto(`${BASIS}/terminal/ziehung`, { waitUntil: 'networkidle0' })
await warte(500)
const ziehFollower = await sDash.$$eval('.trm-metrik__zahl', (l) => (l[1]?.textContent || '').replace(/\s+/g, ' ').trim())
pruefe('ZIEHUNG: Follower-Balken zielt auf die naechste Stufe', ziehFollower === '1.300 / 1.500', ziehFollower)
pruefe('ZIEHUNG: Notiz nennt 1.500', /Bei 1\.500 Followern/.test(await text(sDash)))
await sDash.evaluate(() => localStorage.clear())
await sDash.close()

/* ================================================================== */
console.log('\n=== 8. Breiten 320 / 360 / 390 / 430 / 768 / 1280 ===')

const SEITEN = ['/terminal', '/terminal/rangliste', '/terminal/teilnahmebedingungen', '/terminal/ziehung']
for (const breite of [320, 360, 390, 430, 768, 1280]) {
  const s = await neueSeite(breite, 900)
  for (const pfad of SEITEN) {
    await s.goto(`${BASIS}${pfad}`, { waitUntil: 'networkidle0' })
    await warte(350)
    const u = await ueberlauf(s)
    pruefe(`${breite} px ${pfad} ohne Querscrollen`, u.scroll <= u.sicht + 1, `${u.scroll} > ${u.sicht}`)
  }
  /* Der Tresor selbst, mit Beleg — dort stehen die Spiele und die Karten. */
  await s.goto(`${BASIS}/terminal`, { waitUntil: 'domcontentloaded' })
  await s.evaluate(() => {
    window.localStorage.setItem('videko.terminal.sitzung', 'sitzung-beleg')
    window.localStorage.setItem('videko.terminal.tresor', '1')
  })
  await s.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
  await warte(600)
  const u2 = await ueberlauf(s)
  pruefe(`${breite} px Tresor mit Games ohne Querscrollen`, u2.scroll <= u2.sicht + 1, `${u2.scroll} > ${u2.sicht}`)
  await s.screenshot({ path: `pruefung/terminal-tresor-${breite}.png`, fullPage: true })
  /* Die Karten dieses Tresors duerfen auch fuer sich nicht ueber den Rand. */
  const breitKarten = await s.evaluate(() =>
    [...document.querySelectorAll('.trm-karte, .trm-mission, .trm-einwilligung, .trm-spiel')]
      .filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .map((e) => e.id || e.className.split(' ')[0]),
  )
  pruefe(`${breite} px Karten bleiben im Bild`, breitKarten.length === 0, breitKarten.join(', '))
  await s.goto(`${BASIS}/terminal/ziehung`, { waitUntil: 'networkidle0' })
  await warte(300)
  await s.screenshot({ path: `pruefung/terminal-ziehung-${breite}.png`, fullPage: true })
  await s.evaluate(() => localStorage.clear())
  await s.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
  await warte(400)
  await s.screenshot({ path: `pruefung/terminal-start-${breite}.png`, fullPage: true })
  await s.close()
}

/* ================================================================== */
console.log('\n=== 8b. Neue Games: Auswahl, Start, Game Over, NOCHMAL — 320 / 360 / 390 / 430 ===')

for (const breite of [320, 360, 390, 430]) {
  const s = await neueSeite(breite, 800)
  await s.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
  await s.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('videko.terminal.sitzung', 'sitzung-beleg')
    localStorage.setItem('videko.terminal.zugang', 'zugang-beleg')
    localStorage.setItem('videko.terminal.tresor', '1')
  })
  await s.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
  await warte(600)
  const wahl = await s.$$eval('[data-spielwahl]', (l) => l.map((e) => e.dataset.spielwahl))
  pruefe(`${breite} px: acht Auswahlkarten`, wahl.join(',') === NEUE_GAMES.join(','), wahl.join(', '))
  const wahlHoehe = await s.$$eval('[data-spielwahl]', (l) => Math.max(0, ...l.map((e) => e.getBoundingClientRect().height)))
  pruefe(`${breite} px: Auswahlkarten bleiben kompakt`, wahlHoehe > 0 && wahlHoehe <= 140, String(Math.round(wahlHoehe)))
  const skripteVorher = await s.evaluate(() => performance.getEntriesByType('resource').filter((r) => /\.js/.test(r.name)).length)

  for (const key of NEUE_GAMES) {
    const ab = s.__rufe.length
    await s.$eval(`[data-spielwahl="${key}"]`, (b) => {
      b.scrollIntoView({ block: 'center' })
      b.click()
    }).catch(() => null)
    const karte = await s.waitForSelector(`#${key}.trm-spiel`, { timeout: 8000 }).then(() => true).catch(() => false)
    pruefe(`${breite} px ${key}: nachgeladen`, karte)
    if (!karte) continue
    if (key === NEUE_GAMES[0]) {
      const skripteNach = await s.evaluate(() => performance.getEntriesByType('resource').filter((r) => /\.js/.test(r.name)).length)
      pruefe(`${breite} px: Game-Code kommt erst beim Oeffnen`, skripteNach > skripteVorher, `${skripteVorher} → ${skripteNach}`)
    }
    await s.$eval(`#${key} .trm-spiel__kopf .trm-cta`, (b) => b.click()).catch(() => null)
    const gestartet = await rufWarten(s, ab, 'spiel-start', key, 5000)
    pruefe(`${breite} px ${key}: Laufticket geholt`, gestartet)
    await warte(900)
    const u = await ueberlauf(s)
    pruefe(`${breite} px ${key}: laeuft ohne Querscrollen`, u.scroll <= u.sicht + 1, `${u.scroll} > ${u.sicht}`)
    const feld = await s.$eval(`#${key} .trm-feld-spiel`, (e) => {
      const r = e.getBoundingClientRect()
      return { links: Math.round(r.left), rechts: Math.round(r.right), hoehe: Math.round(r.height), sicht: document.documentElement.clientWidth }
    }).catch(() => null)
    pruefe(`${breite} px ${key}: Spielfeld im Bild`, feld && feld.links >= 0 && feld.rechts <= feld.sicht && feld.hoehe >= 200, JSON.stringify(feld))
    await s.$eval(`#${key}`, (e) => e.scrollIntoView({ block: 'start' })).catch(() => null)
    await warte(150)
    const kartenEl = await s.$(`#${key}`)
    if (kartenEl) await kartenEl.screenshot({ path: `pruefung/terminal-game-${key}-${breite}.png` }).catch(() => null)

    const abEnde = s.__rufe.length
    await s.evaluate((k) => window.dispatchEvent(new CustomEvent('trm-game-over', { detail: k })), key)
    const ende = await s.waitForSelector(`#${key} .trm-spiel__nochmal`, { timeout: 6000 }).then(() => true).catch(() => false)
    pruefe(`${breite} px ${key}: Game Over mit NOCHMAL`, ende && (await s.$(`#${key} .trm-spiel__endstand`)) !== null)
    pruefe(`${breite} px ${key}: Score geht an den Server`, await rufWarten(s, abEnde, 'spiel-ende', key, 3000))
    await s.waitForSelector(`#${key} .trm-spiel__marke`, { timeout: 3000 }).catch(() => null)
    const ergebnis = await s.$eval(`#${key}`, (e) => ({
      platz: !!e.querySelector('.trm-spiel__platz'),
      zeile: !!(e.querySelector('.trm-spiel__motiv') || e.querySelector('.trm-spiel__neu')),
      marken: e.querySelectorAll('.trm-spiel__marke').length,
    })).catch(() => null)
    pruefe(`${breite} px ${key}: Ergebnis mit Rang, Motivation und Bestwert`,
      ergebnis && ergebnis.platz && ergebnis.zeile && ergebnis.marken === 2, JSON.stringify(ergebnis))
    const uEnde = await ueberlauf(s)
    pruefe(`${breite} px ${key}: Ergebnis ohne Querscrollen`, uEnde.scroll <= uEnde.sicht + 1, `${uEnde.scroll} > ${uEnde.sicht}`)

    const abNochmal = s.__rufe.length
    const t0 = Date.now()
    await s.$eval(`#${key} .trm-spiel__nochmal`, (b) => b.click()).catch(() => null)
    const neu = await rufWarten(s, abNochmal, 'spiel-start', key, 3000)
    pruefe(`${breite} px ${key}: NOCHMAL startet sofort`, neu && Date.now() - t0 < 1500, `${Date.now() - t0} ms`)
    await warte(500)
    await s.evaluate((k) => window.dispatchEvent(new CustomEvent('trm-game-over', { detail: k })), key)
    await s.waitForSelector(`#${key} .trm-spiel__nochmal`, { timeout: 6000 }).catch(() => null)
  }
  const fehler = s.__fehler.filter((f) => !/ERR_ABORTED|aborted/i.test(f))
  pruefe(`${breite} px: neue Games ohne JavaScript-Fehler`, fehler.length === 0, fehler.slice(0, 2).join(' | '))
  pruefe(`${breite} px: neue Games aendern GESAMT nicht`, summe() === (welt.beste.truhenknacker || 0) + (welt.beste.goldrausch || 0))
  await s.evaluate(() => localStorage.clear())
  await s.close()
}

/* ================================================================== */
console.log('\n=== 8c. VIDEKO Jump: Touch-Steuerung und optionale Neigung ===')

/**
 * Oeffnet Jump in einer frischen Seite. `sensor` legt fest, was der Browser
 * vorgibt: 'keiner' (kein DeviceOrientationEvent), 'erlaubt' / 'verweigert'
 * (iOS-Stil mit requestPermission) oder 'offen' (Event ohne Nachfrage).
 */
async function jumpOeffnen(sensor) {
  const s = await neueSeite(390, 844)
  await s.evaluateOnNewDocument((modus) => {
    window.__sensorFragen = 0
    if (modus === 'keiner') {
      for (const name of ['DeviceOrientationEvent', 'ondeviceorientation']) {
        try { delete window[name] } catch { /* weiter */ }
        try { Object.defineProperty(window, name, { value: undefined, configurable: true, writable: true }) } catch { /* weiter */ }
      }
      return
    }
    if (modus === 'erlaubt' || modus === 'verweigert') {
      const Echt = window.DeviceOrientationEvent
      if (Echt) {
        Echt.requestPermission = () => {
          window.__sensorFragen += 1
          return Promise.resolve(modus === 'erlaubt' ? 'granted' : 'denied')
        }
      }
    }
  }, sensor)
  await s.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
  await s.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('videko.terminal.sitzung', 'sitzung-beleg')
    localStorage.setItem('videko.terminal.zugang', 'zugang-beleg')
    localStorage.setItem('videko.terminal.tresor', '1')
  })
  await s.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
  await warte(500)
  await s.$eval('[data-spielwahl="videko_jump"]', (b) => { b.scrollIntoView({ block: 'center' }); b.click() }).catch(() => null)
  await s.waitForSelector('#videko_jump.trm-spiel', { timeout: 8000 }).catch(() => null)
  const ab = s.__rufe.length
  await s.$eval('#videko_jump .trm-spiel__kopf .trm-cta', (b) => b.click()).catch(() => null)
  await rufWarten(s, ab, 'spiel-start', 'videko_jump', 5000)
  await s.$eval('#videko_jump', (e) => e.scrollIntoView({ block: 'start' })).catch(() => null)
  await warte(500)
  return s
}

const jumpZustand = (s) => s.evaluate(() => {
  const feld = document.querySelector('#videko_jump [data-richtung]')
  const knopf = document.querySelector('#videko_jump .trm-jump-neigung')
  return {
    richtung: feld?.dataset.richtung ?? null,
    steuerung: feld?.dataset.steuerung ?? null,
    status: knopf?.dataset.status ?? null,
    fragen: window.__sensorFragen,
    ende: !!document.querySelector('#videko_jump .trm-spiel__nochmal'),
  }
})

/** Haelt die linke oder rechte Haelfte gedrueckt und liest die Richtung. */
async function jumpHalten(s, seite) {
  const r = await s.$eval('#videko_jump [data-richtung]', (e) => {
    const b = e.getBoundingClientRect()
    return { x: b.left, y: b.top, w: b.width, h: b.height }
  }).catch(() => null)
  if (!r) return { gedrueckt: null, los: null }
  const x = r.x + r.w * (seite === 'links' ? 0.2 : 0.8)
  const y = r.y + r.h * 0.6
  await s.mouse.move(x, y)
  await s.mouse.down()
  await warte(120)
  const gedrueckt = (await jumpZustand(s)).richtung
  await s.mouse.up()
  await warte(120)
  const los = (await jumpZustand(s)).richtung
  return { gedrueckt, los }
}

const neigen = (s, gamma) => s.evaluate((g) => {
  for (let i = 0; i < 4; i += 1) {
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: 10, gamma: g }))
  }
}, gamma)

{
  /* Touch links / rechts, kein Sensor angefragt */
  const s = await jumpOeffnen('erlaubt')
  const vorher = await jumpZustand(s)
  pruefe('Jump: Standard ist Touch, Richtung 0', vorher.steuerung === 'touch' && vorher.richtung === '0', JSON.stringify(vorher))
  pruefe('Jump: kein Sensor-Dialog beim Laden', vorher.fragen === 0 && vorher.status === 'aus', JSON.stringify(vorher))
  const links = await jumpHalten(s, 'links')
  pruefe('Jump: linke Haelfte halten = links', links.gedrueckt === '-1' && links.los === '0', JSON.stringify(links))
  const rechts = await jumpHalten(s, 'rechts')
  pruefe('Jump: rechte Haelfte halten = rechts', rechts.gedrueckt === '1' && rechts.los === '0', JSON.stringify(rechts))

  /* Sensor erlaubt */
  await s.$eval('#videko_jump .trm-jump-neigung', (b) => b.click()).catch(() => null)
  await warte(250)
  await neigen(s, 30)
  await warte(200)
  const an = await jumpZustand(s)
  pruefe('Jump Sensor erlaubt: erst nach Tipp gefragt', an.fragen === 1, JSON.stringify(an))
  pruefe('Jump Sensor erlaubt: Neigung aktiv, nach rechts', an.status === 'aktiv' && an.steuerung === 'neigung' && an.richtung === '1', JSON.stringify(an))
  await neigen(s, -30)
  await warte(200)
  pruefe('Jump Sensor erlaubt: nach links geneigt', (await jumpZustand(s)).richtung === '-1')
  await neigen(s, -30)
  const vorrang = await jumpHalten(s, 'rechts')
  pruefe('Jump Sensor erlaubt: Touch hat Vorrang', vorrang.gedrueckt === '1', JSON.stringify(vorrang))
  const f = s.__fehler.filter((x) => !/ERR_ABORTED|aborted/i.test(x))
  pruefe('Jump Touch/Sensor ohne JavaScript-Fehler', f.length === 0, f.slice(0, 2).join(' | '))
  await s.close()
}

{
  /* Sensor verweigert */
  const s = await jumpOeffnen('verweigert')
  await s.$eval('#videko_jump .trm-jump-neigung', (b) => b.click()).catch(() => null)
  await warte(400)
  const z = await jumpZustand(s)
  pruefe('Jump Sensor verweigert: Status verweigert, Touch bleibt', z.status === 'verweigert' && z.steuerung === 'touch' && z.fragen === 1, JSON.stringify(z))
  const links = await jumpHalten(s, 'links')
  const rechts = await jumpHalten(s, 'rechts')
  pruefe('Jump Sensor verweigert: Touch links/rechts funktioniert',
    links.gedrueckt === '-1' && rechts.gedrueckt === '1' && rechts.los === '0', JSON.stringify({ links, rechts }))
  pruefe('Jump Sensor verweigert: Spiel laeuft weiter', !(await jumpZustand(s)).ende)
  await s.close()
}

{
  /* Kein Sensor im Browser */
  const s = await jumpOeffnen('keiner')
  const z0 = await jumpZustand(s)
  await s.$eval('#videko_jump .trm-jump-neigung', (b) => b.click()).catch(() => null)
  await warte(1900)
  const z = await jumpZustand(s)
  pruefe('Jump ohne Sensor: Knopf meldet nicht unterstuetzt, Touch bleibt',
    ['nicht-unterstuetzt', 'verweigert'].includes(z.status) && z.steuerung === 'touch', JSON.stringify({ z0, z }))
  const links = await jumpHalten(s, 'links')
  const rechts = await jumpHalten(s, 'rechts')
  pruefe('Jump ohne Sensor: Touch links/rechts funktioniert',
    links.gedrueckt === '-1' && rechts.gedrueckt === '1' && links.los === '0', JSON.stringify({ links, rechts }))
  const f = s.__fehler.filter((x) => !/ERR_ABORTED|aborted/i.test(x))
  pruefe('Jump ohne Sensor ohne JavaScript-Fehler', f.length === 0, f.slice(0, 2).join(' | '))
  await s.close()
}

/* ================================================================== */
console.log('\n=== 9. prefers-reduced-motion ===')

const seite3 = await browser.newPage()
await seite3.evaluateOnNewDocument(() => {
  try {
    window.sessionStorage.setItem('videko.terminal.intro', '1')
  } catch {
    /* egal */
  }
})
await seite3.setViewport({ width: 390, height: 844 })
await seite3.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await seite3.setRequestInterception(true)
seite3.on('request', (a) => {
  if (a.url().includes('/api/terminal')) {
    let k = {}
    try { k = JSON.parse(a.postData() || '{}') } catch { k = {} }
    const d = antwortFuer(k)
    const st = d.__status || 200
    delete d.__status
    a.respond({ status: st, contentType: 'application/json', body: JSON.stringify(d) })
    return
  }
  a.continue()
})
await seite3.goto(`${BASIS}/terminal`, { waitUntil: 'domcontentloaded' })
await seite3.evaluate(() => {
  localStorage.clear()
  sessionStorage.clear()
})
await seite3.reload({ waitUntil: 'networkidle0' })
await warte(400)
const dauern = await seite3.evaluate(() => {
  const sel = ['.trm-truhe__rauch', '.trm-truhe__fuge', '.trm-truhe__glanz']
  return sel.map((s) => {
    const e = document.querySelector(s)
    return e ? getComputedStyle(e).animationDuration : 'fehlt'
  })
})
pruefe('Animationen bei reduzierter Bewegung abgeschaltet',
  dauern.every((d) => d === 'fehlt' || Number.parseFloat(d) < 0.01), dauern.join(', '))

/* localStorage haengt am Ursprung, nicht am Tab: die Seiten oben haben Zugang,
   Sitzung und Tresor schon gesetzt. Ohne Leeren startet diese Seite im
   Dashboard und hat gar keine Codefelder mehr. */
await seite3.evaluate(() => {
  localStorage.clear()
  sessionStorage.clear()
})
await seite3.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await warte(300)
pruefe('Sparmodus startet wieder bei der Code-Eingabe', (await seite3.$('.trm-code')) !== null)
await codeEingeben(seite3, CODE)
const sanftBegonnen = Date.now()
await seite3.$eval('form.trm-code, form', (f) => f.requestSubmit())

/* Gemessen statt geraten. Vorher stand hier ein festes `warte(900)` — genau
   die Dauer, die die Sequenz im Sparmodus selbst hat. Das ging manchmal auf
   und manchmal nicht, weil die Uhr erst nach der Antwort des Servers laeuft.
   Gewartet wird jetzt, bis die Buehne von selbst verschwindet, und gemessen
   wird, wie lange das gedauert hat: unter 1,5 s ist die kurze Fassung, die
   volle braucht 3,4 s. */
await seite3.waitForSelector('.trm-buehne', { timeout: 2000 })
await seite3.waitForFunction(() => document.querySelector('.trm-buehne') === null, { timeout: 3000 })
const sanftGedauert = Date.now() - sanftBegonnen
pruefe('Kurze Inszenierung bei reduzierter Bewegung', sanftGedauert < 1500, `${sanftGedauert} ms`)
t = await text(seite3)
pruefe('Sparmodus landet trotzdem bei DU HAST ZUGANG.', /DU HAST ZUGANG/i.test(t))
await seite3.close()

/* ================================================================== */
/* ================================================================== */
console.log('\n=== 10. Ersteinstieg ===')

/** Ein Browser, der noch nie hier war: kein Login, nichts gesehen. */
async function frisch(s) {
  await s.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
  await s.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

async function aufBild(s, bild, timeout = 6000) {
  await s.waitForFunction((b) => document.documentElement.dataset.trmIntro === b, { timeout, polling: 'raf' }, String(bild))
}

async function introVorbei(s, timeout = 7000) {
  await s.waitForFunction(() => !document.documentElement.classList.contains('trm-intro-an'), { timeout, polling: 50 })
  await warte(120)
}

/** Bilderfolge und Zeiten aus dem Protokoll im Browser. */
async function introAuswerten(s) {
  const log = await s.evaluate(() => window.__intro || [])
  const bilder = []
  for (const e of log) {
    const n = e.p ? Number(e.p) : null
    if (n != null && bilder[bilder.length - 1] !== n) bilder.push(n)
  }
  const t = (p) => log.find((e) => e.p === String(p))?.t ?? null
  const eins = t(1)
  const neun = t(9)
  const kopf = log.find((e) => e.an)?.t ?? null
  const weg = log.find((e) => !e.an && eins != null && e.t >= eins)?.t ?? null
  return { log, bilder, eins, neun, kopf, weg, lief: log.some((e) => e.an) }
}

async function menueKnopf(s, wort) {
  if (!(await s.$('.trm-menue-blatt'))) {
    await s.click('.trm-menue')
    await warte(200)
  }
  for (const k of await s.$$('.trm-abmelden')) {
    const w = await k.evaluate((e) => e.textContent || '')
    if (w.includes(wort)) return k
  }
  return null
}

const sIntro = await neueSeite(390, 844, false)
await frisch(sIntro)
await sIntro.goto(`${BASIS}/terminal`, { waitUntil: 'domcontentloaded' })

pruefe('Neuer Browser: Intro startet',
  await sIntro.evaluate(() => document.documentElement.classList.contains('trm-intro-an')))

const bild2 = await (await sIntro.waitForFunction(() => {
  if (document.documentElement.dataset.trmIntro !== '2') return false
  const t = document.querySelector('.trm-truhe')
  return t ? new DOMMatrix(getComputedStyle(t).transform).a : -1
}, { timeout: 6000, polling: 'raf' })).jsonValue()
pruefe('Bild 2: Truhe steht klein weit hinten', bild2 > 0 && bild2 < 0.5, `Massstab ${bild2}`)

const bild3 = await (await sIntro.waitForFunction(() => {
  if (document.documentElement.dataset.trmIntro !== '3') return false
  const o = (s) => {
    const e = document.querySelector(s)
    return e ? Number(getComputedStyle(e).opacity) : -1
  }
  return { titel: o('.trm-titel'), code: o('.trm-code') }
}, { timeout: 6000, polling: 'raf' })).jsonValue()
pruefe('Bild 3: Schlagzeile und Codefelder noch nicht da', bild3.titel === 0 && bild3.code === 0, JSON.stringify(bild3))

const bild4 = await (await sIntro.waitForFunction(() => {
  if (document.documentElement.dataset.trmIntro !== '4') return false
  const b = document.querySelector('.trm-truhe__bild')
  return b ? getComputedStyle(b).animationName : 'fehlt'
}, { timeout: 6000, polling: 'raf' })).jsonValue()
pruefe('Bild 4: Aufschlag der Truhe', String(bild4).includes('trm-aufschlag'), bild4)

await introVorbei(sIntro)
let ein = await introAuswerten(sIntro)
pruefe('Bilderfolge 1-2-3-4-5-6-9', ein.bilder.join('-') === '1-2-3-4-5-6-9', ein.bilder.join('-'))
pruefe('Sequenz dauert 2,5 bis 4 s', ein.eins != null && ein.neun - ein.eins >= 2500 && ein.neun - ein.eins <= 4000,
  `${ein.neun - ein.eins} ms`)
pruefe('Danach faellt die Klasse weg', ein.weg != null && ein.weg - ein.eins <= 4300, `${ein.weg - ein.eins} ms`)

const nachIntro = await sIntro.evaluate(() => {
  const st = (s) => {
    const e = document.querySelector(s)
    return e ? { o: getComputedStyle(e).opacity, t: getComputedStyle(e).transform } : null
  }
  return {
    schicht: document.querySelector('.trm-intro') !== null,
    felder: document.querySelectorAll('.trm-code input').length,
    titel: st('.trm-titel'),
    truhe: st('.trm-truhe'),
    code: st('.trm-code'),
  }
})
pruefe('Nach dem Intro: Schicht weg', !nachIntro.schicht)
pruefe('Nach dem Intro: acht Codefelder', nachIntro.felder === 8, String(nachIntro.felder))
pruefe('Nach dem Intro: Schlagzeile steht voll da',
  nachIntro.titel?.o === '1' && nachIntro.titel?.t === 'none', JSON.stringify(nachIntro.titel))
pruefe('Nach dem Intro: Truhe in voller Groesse', nachIntro.truhe?.t === 'none', JSON.stringify(nachIntro.truhe))
pruefe('Nach dem Intro: Codefeld sichtbar', nachIntro.code?.o === '1', JSON.stringify(nachIntro.code))
pruefe('Die Headline lautet richtig',
  /EIN DECKEL VON .* ÖFFNET DIESE TRUHE/i.test(await text(sIntro)))

await sIntro.reload({ waitUntil: 'networkidle0' })
await warte(700)
ein = await introAuswerten(sIntro)
pruefe('Reload: kein Intro mehr', !ein.lief, JSON.stringify(ein.log.slice(0, 3)))
pruefe('Reload: Codefelder sofort da', (await sIntro.$$('.trm-code input')).length === 8)

const nochmal = await menueKnopf(sIntro, 'INTRO NOCHMAL ANSEHEN')
pruefe('Menue: INTRO NOCHMAL ANSEHEN', nochmal !== null)
if (nochmal) {
  await Promise.all([sIntro.waitForNavigation({ waitUntil: 'domcontentloaded' }), nochmal.click()])
  await introVorbei(sIntro)
  ein = await introAuswerten(sIntro)
  pruefe('Intro laeuft auf Wunsch noch einmal', ein.lief && ein.bilder.join('-') === '1-2-3-4-5-6-9', ein.bilder.join('-'))
  pruefe('Wunsch ist danach eingeloest',
    await sIntro.evaluate(() => sessionStorage.getItem('videko.terminal.introWunsch') === null))
}

/* Ueberspringen */
await sIntro.evaluate(() => sessionStorage.setItem('videko.terminal.introWunsch', '1'))
await sIntro.goto(`${BASIS}/terminal`, { waitUntil: 'domcontentloaded' })
await aufBild(sIntro, 2)
await sIntro.click('.trm-intro__weg')
await warte(200)
const uebersprungen = await sIntro.evaluate(() => ({
  an: document.documentElement.classList.contains('trm-intro-an'),
  schicht: document.querySelector('.trm-intro') !== null,
  code: getComputedStyle(document.querySelector('.trm-code')).opacity,
}))
pruefe('ÜBERSPRINGEN beendet das Intro sofort',
  !uebersprungen.an && !uebersprungen.schicht && uebersprungen.code === '1', JSON.stringify(uebersprungen))

/* Reduzierte Bewegung */
await sIntro.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await sIntro.evaluate(() => sessionStorage.setItem('videko.terminal.introWunsch', '1'))
await sIntro.goto(`${BASIS}/terminal`, { waitUntil: 'domcontentloaded' })
await introVorbei(sIntro)
ein = await introAuswerten(sIntro)
pruefe('Reduzierte Bewegung: dieselben Bilder', ein.bilder.join('-') === '1-2-3-4-5-6-9', ein.bilder.join('-'))
pruefe('Reduzierte Bewegung: unter 0,9 s', ein.eins != null && ein.neun - ein.eins < 900, `${ein.neun - ein.eins} ms`)
pruefe('Reduzierte Bewegung: Klasse nach unter 1,4 s weg', ein.weg != null && ein.weg - ein.eins < 1400,
  `${ein.weg - ein.eins} ms`)
pruefe('Ersteinstieg ohne JavaScript-Fehler', sIntro.__fehler.length === 0, sIntro.__fehler.slice(0, 2).join(' | '))
await sIntro.close()

for (const breite of [320, 360, 390, 430]) {
  const s = await neueSeite(breite, 780, false)
  await frisch(s)
  await s.goto(`${BASIS}/terminal`, { waitUntil: 'domcontentloaded' })
  await aufBild(s, 4)
  const u4 = await ueberlauf(s)
  pruefe(`${breite} px Intro-Aufschlag ohne Querscrollen`, u4.scroll <= u4.sicht + 1, `${u4.scroll} > ${u4.sicht}`)
  await aufBild(s, 5)
  if (breite === 390 || breite === 320) {
    await s.screenshot({ path: `pruefung/terminal-intro-${breite}.png` })
  }
  await introVorbei(s)
  const u9 = await ueberlauf(s)
  pruefe(`${breite} px nach dem Intro ohne Querscrollen`, u9.scroll <= u9.sicht + 1, `${u9.scroll} > ${u9.sicht}`)
  pruefe(`${breite} px Codefelder nach dem Intro da`, (await s.$$('.trm-code input')).length === 8)
  await s.close()
}

/* ================================================================== */
console.log('\n=== 11. Die wache Truhe vor dem Code ===')

const RUFE = (() => {
  const quelle = readFileSync('src/data/terminal.js', 'utf8')
  const m = /truheRufe:\s*\[([^\]]*)\]/.exec(quelle)
  return m ? [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]) : []
})()
pruefe('Rufe der Truhe gelesen', RUFE.length >= 3, RUFE.join(' | '))

const sWach = await neueSeite(390, 844)
await sWach.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
await sWach.evaluate(() => localStorage.clear())
await sWach.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await warte(500)

const treffbar = await sWach.evaluate(() => {
  const erg = {}
  for (const art of ['schloss', 'zeichen', 'schluessel']) {
    const k = document.querySelector(`.trm-punkt--${art}`)
    if (!k) {
      erg[art] = false
      continue
    }
    k.scrollIntoView({ block: 'center' })
    const r = k.getBoundingClientRect()
    const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    erg[art] = e === k || k.contains(e)
  }
  const truhe = document.querySelector('.trm-punkt--truhe')
  erg.truhe = false
  if (truhe) {
    const r = truhe.getBoundingClientRect()
    for (const [fx, fy] of [[0.2, 0.3], [0.8, 0.3], [0.2, 0.75], [0.8, 0.75], [0.5, 0.15]]) {
      const e = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy)
      if (e === truhe) erg.truhe = true
    }
  }
  return erg
})
pruefe('Alle vier Flaechen sind wirklich antippbar', Object.values(treffbar).every(Boolean), JSON.stringify(treffbar))

const rufeVorher = sWach.__rufe.length
let rucke = 0
let worte = 0
const falsch = []
for (let i = 0; i < 12; i += 1) {
  await sWach.$eval('.trm-punkt--truhe', (b) => b.click())
  await warte(70)
  const stand = await sWach.evaluate(() => ({
    ruck: document.querySelector('.trm-truhe--ruck') !== null,
    wort: (document.querySelector('.trm-truhe__ruf')?.textContent || '').trim(),
  }))
  if (stand.ruck) rucke += 1
  if (stand.wort) {
    worte += 1
    if (!RUFE.includes(stand.wort)) falsch.push(stand.wort)
  }
  await warte(430)
}
pruefe('Truhe ruckt bei jedem Antippen', rucke === 12, `${rucke}/12`)
pruefe('Truhe sagt bei jedem Antippen etwas', worte === 12, `${worte}/12 mit Text`)
pruefe('Rufe stehen in der Glas-Pille', (await sWach.$('.trm-truhe__ruf .trm-truhe__pille')) !== null ||
  RUFE.length === 3, RUFE.join(' | '))
pruefe('Und dann nur einen der vorgesehenen Rufe', falsch.length === 0, falsch.join(' | '))
await warte(1900)

await sWach.$eval('.trm-punkt--schloss', (b) => b.click())
await warte(90)
let wach = await sWach.evaluate(() => ({
  wort: (document.querySelector('.trm-truhe__ruf')?.textContent || '').trim(),
  wackelt: document.querySelector('.trm-truhe--wackelt') !== null,
  funken: document.querySelector('.trm-punkt__funken') !== null,
}))
pruefe('Schloss vor dem Code: Verriegelt., wackelt, Funken',
  wach.wort === 'Verriegelt.' && wach.wackelt && wach.funken, JSON.stringify(wach))
await warte(800)

await sWach.$eval('.trm-punkt--zeichen', (b) => b.click())
await warte(90)
wach = await sWach.evaluate(() => ({
  wort: (document.querySelector('.trm-truhe__ruf')?.textContent || '').trim(),
  zeichen: document.querySelector('.trm-truhe--zeichen') !== null,
}))
pruefe('Logo vor dem Code leuchtet', wach.wort === 'VIDEKO.' && wach.zeichen, JSON.stringify(wach))
await warte(1100)

const loch1 = Date.now()
await sWach.$eval('.trm-punkt--schluessel', (b) => b.click())
await warte(160)
wach = await sWach.evaluate(() => ({
  buehne: document.querySelector('.trm-buehne--spaehen') !== null,
  sperre: (document.querySelector('.trm-spaehen__sperrwort')?.textContent || '').trim(),
  zeile: (document.querySelector('.trm-spaehen__sperrzeile')?.textContent || '').trim(),
  kacheln: document.querySelectorAll('.trm-schlossblick__maske .trm-schlossblick__bild').length,
  lochText: (document.querySelector('.trm-schlossblick')?.textContent || '').trim().length,
  alteKarten: document.querySelectorAll('.trm-spaehen__kachel, .trm-spaehen__titel, .trm-spaehen__name').length,
  knoepfe: document.querySelectorAll('.trm-buehne--spaehen button, .trm-buehne--spaehen a, .trm-buehne--spaehen input').length,
  naeher: document.querySelector('.trm-truhe--annaehern') !== null,
  flug: document.querySelector('.trm-buehne--schluessel, .trm-buehne--vorflug') !== null,
}))
pruefe('Schluesselloch ohne Code: Blick in den Tresor',
  wach.buehne && wach.kacheln >= 3 && wach.naeher && !wach.flug, JSON.stringify(wach))
pruefe('Im Schluesselloch nur Bilder, keine Karten und kein Text',
  wach.lochText === 0 && wach.alteKarten === 0, JSON.stringify(wach))
pruefe('Blick zeigt ZUGANG GESPERRT / KNACK ERST DEN CODE.',
  wach.sperre === 'ZUGANG GESPERRT' && wach.zeile === 'KNACK ERST DEN CODE.', `${wach.sperre} / ${wach.zeile}`)
pruefe('Im Blick gibt es nichts anzutippen', wach.knoepfe === 0, String(wach.knoepfe))
await sWach.waitForFunction(() => document.querySelector('.trm-buehne') === null, { timeout: 6000, polling: 50 })
const lochDauer = Date.now() - loch1
pruefe('Danach geht es zurueck zur Code-Eingabe', lochDauer >= 2600 && lochDauer <= 4000 && (await sWach.$('.trm-code')) !== null,
  `${lochDauer} ms`)
pruefe('Schluesselloch ohne Code oeffnet keinen Tresor', !/VIDEKO TRESOR/i.test(await text(sWach)))
pruefe('Schluesselloch ohne Code setzt keinen Zugang',
  await sWach.evaluate(() => localStorage.getItem('videko.terminal.zugang') === null))
pruefe('Kein Serveraufruf durch die Punkte', sWach.__rufe.length === rufeVorher,
  sWach.__rufe.slice(rufeVorher).map((r) => r.aktion).join(', '))

await sWach.$eval('.trm-punkt--schluessel', (b) => b.click())
await warte(160)
pruefe('Zweiter Blick geht genauso', (await sWach.$('.trm-buehne--spaehen')) !== null)
await sWach.waitForFunction(() => document.querySelector('.trm-buehne') === null, { timeout: 6000, polling: 50 })
pruefe('Wache Truhe ohne JavaScript-Fehler', sWach.__fehler.length === 0, sWach.__fehler.slice(0, 2).join(' | '))
await sWach.close()

/* ================================================================== */
console.log('\n=== 12. Testlabor ===')

const roh = await (await fetch(`${BASIS}/terminal`)).text()
pruefe('Vorgerendertes /terminal ohne Testmodus', !roh.includes('trm-probe') && !roh.includes('TESTMODUS'))

const ADMIN_WERT = (() => {
  try {
    const m = /^TERMINAL_ADMIN_TOKEN=(.*)$/m.exec(readFileSync('.env.local', 'utf8'))
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''
  } catch {
    return ''
  }
})()
if (ADMIN_WERT) {
  const funde = readdirSync('dist/assets')
    .filter((n) => n.endsWith('.js'))
    .filter((n) => readFileSync(`dist/assets/${n}`, 'utf8').includes(ADMIN_WERT))
  pruefe('Admin-Token steht in keinem Browser-Bundle', funde.length === 0, funde.length ? `${funde.length} Datei(en)` : '')
} else {
  console.log('  (kein TERMINAL_ADMIN_TOKEN in .env.local — Bundle-Pruefung uebersprungen)')
}

const speicherBild = (s) =>
  s.evaluate(() => {
    const paare = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      paare.push([k, localStorage.getItem(k)])
    }
    return JSON.stringify(paare.sort((a, b) => (a[0] < b[0] ? -1 : 1)))
  })
const weltBild = () =>
  JSON.stringify({ aktiviert: welt.aktiviert, teilnehmer: welt.teilnehmer, beste: welt.beste, laufNr: welt.laufNr })
const probeZettel = (s) =>
  s.evaluate(() => {
    const n = []
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i)
      if (k.startsWith('videko.terminal.probe.')) n.push(k)
    }
    return n
  })

const sLab = await neueSeite(390, 844)
await sLab.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
await sLab.evaluate(() => {
  localStorage.clear()
  localStorage.setItem('videko.terminal.sitzung', 'sitzung-beleg')
  localStorage.setItem('videko.terminal.zugang', 'zugang-beleg')
  localStorage.setItem('videko.terminal.tresor', '1')
  sessionStorage.setItem('videko.terminal.probe', 'probe-beleg')
})
const echterSpeicher = await speicherBild(sLab)
const echteWelt = weltBild()
const rufeAb = sLab.__rufe.length

await sLab.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await warte(600)
t = await text(sLab)
pruefe('TESTMODUS-Badge sichtbar',
  (await sLab.$eval('.trm-probe__marke', (e) => e.textContent).catch(() => '')) === 'TESTMODUS')
pruefe('Testmodus zeigt nicht das echte Dashboard', (await sLab.$('.trm-code')) !== null && !/4711/.test(t))

await sLab.click('.trm-probe__knopf')
await warte(200)
pruefe('Testlabor: 25 Zustaende + Game Over + Reset + Verlassen', (await sLab.$$('.trm-probe__tat')).length === 28,
  String((await sLab.$$('.trm-probe__tat')).length))
pruefe('Testlabor nennt @videko_test · Deckel TEST',
  /@videko_test/.test(await sLab.$eval('.trm-probe__person', (e) => e.textContent).catch(() => '')))

async function laborTat(s, wort) {
  if (!(await s.$('.trm-probe__blatt'))) {
    await s.click('.trm-probe__knopf')
    await warte(150)
  }
  const index = await s.$$eval(
    '.trm-probe__tat',
    (l, w) => {
      const genau = l.findIndex((b) => (b.textContent || '').trim() === w)
      return genau >= 0 ? genau : l.findIndex((b) => (b.textContent || '').trim().includes(w))
    },
    wort,
  )
  if (index < 0) return false
  const knoepfe = await s.$$('.trm-probe__tat')
  await Promise.all([
    s.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
    knoepfe[index].evaluate((b) => b.click()),
  ])
  await warte(400)
  return true
}

const badge = async (s) => (await s.$eval('.trm-probe__marke', (e) => e.textContent).catch(() => '')) === 'TESTMODUS'

await laborTat(sLab, 'CODE-EINGABE')
pruefe('CODE-EINGABE: Codefeld', (await sLab.$('.trm-code')) !== null && (await sLab.$('.trm-buehne')) === null)

await laborTat(sLab, 'INTERAKTIVE TRUHE')
pruefe('INTERAKTIVE TRUHE: Truhe antippbar', (await sLab.$('.trm-punkt--truhe')) !== null && (await badge(sLab)))

await laborTat(sLab, 'CODE KORREKT')
pruefe('CODE KORREKT: ACCESS GRANTED', (await sLab.$('.trm-buehne--gewaehrt')) !== null)
await warte(3800)
t = await text(sLab)
pruefe('CODE KORREKT: danach DU HAST ZUGANG., Truhe zu', /DU HAST ZUGANG/i.test(t) && !/VIDEKO TRESOR/i.test(t))

await laborTat(sLab, 'SCHLÜSSELLOCH-FLUG')
const flugDa = await sLab.waitForSelector('.trm-buehne--schluessel', { timeout: 3000 }).then(() => true).catch(() => false)
pruefe('SCHLÜSSELLOCH-FLUG: Flug laeuft', flugDa)
const tresorDa = await sLab
  .waitForFunction(() => /VIDEKO TRESOR/i.test(document.body.innerText), { timeout: 4000 })
  .then(() => true)
  .catch(() => false)
pruefe('SCHLÜSSELLOCH-FLUG: landet im Tresor', tresorDa)

await laborTat(sLab, 'DECKEL AKTIVIEREN')
pruefe('DECKEL AKTIVIEREN: Formular', (await sLab.$('#trm-deckel')) !== null)

await laborTat(sLab, 'AKTIVIERTES DASHBOARD')
const dashDa = await sLab
  .waitForFunction(() => document.querySelectorAll('.trm-spiel').length === 2 && document.querySelectorAll('[data-spielwahl]').length === 8, { timeout: 4000 })
  .then(() => true)
  .catch(() => false)
t = await text(sLab)
pruefe('AKTIVIERTES DASHBOARD: zwei Games + acht Auswahlkarten', dashDa)
pruefe('AKTIVIERTES DASHBOARD: Deckel TEST, nicht der echte', /TEST/.test(t) && !/4711/.test(t) && !/@testlauf/.test(t))

for (const [wort, id] of [
  ['TRUHENKNACKER', 'truhenknacker'],
  ['GOLDRAUSCH', 'goldrausch'],
  ['KÜCHEN-STACK', 'kuechen_stack'],
  ['KÜCHEN-DASH', 'kuechen_dash'],
  ['KÜCHEN-BALANCE', 'kuechen_balance'],
  ['KÜCHEN-FIT', 'kuechen_fit'],
  ['VIDEKO JUMP', 'videko_jump'],
  ['KÜCHEN-MERGE', 'kuechen_merge'],
  ['LEITUNGSFINDER', 'leitungsfinder'],
  ['KÜCHEN-CRUSH', 'kuechen_crush'],
  ['KÜCHEN-TINDER', 'kuechen_tinder'],
  ['FOLLOWER-MISSION', 'mission'],
  ['LEADERBOARD OPT-IN / OPT-OUT', 'einwilligung'],
]) {
  await laborTat(sLab, wort)
  await warte(1400)
  const lage = await sLab.evaluate((i) => {
    const e = document.getElementById(i)
    return e ? { oben: Math.round(e.getBoundingClientRect().top), hoehe: window.innerHeight } : null
  }, id)
  pruefe(`${wort}: Karte angesprungen`, lage != null && lage.oben > -120 && lage.oben < lage.hoehe * 0.6, JSON.stringify(lage))
  if (NEUE_GAMES.includes(id)) {
    pruefe(`${wort}: startet direkt`, sLab.__rufe.some((r) => r.aktion === 'spiel-start' && r.game === id && r.probe))
    const HOOKS = {
      leitungsfinder: () => {
        const b = document.querySelector('#leitungsfinder [data-wand]')
        return b && b.dataset.wand === '1' && b.dataset.combo != null
      },
      kuechen_merge: () => {
        const b = document.querySelector('#kuechen_merge .trm-merge-buehne')
        return b && b.dataset.warnung === '0' && document.querySelectorAll('#kuechen_merge .trm-merge-stufe').length === 10
          && document.querySelector('#kuechen_merge .trm-merge-naechstes[data-stufe]') !== null
      },
      kuechen_crush: () => {
        const b = document.querySelector('#kuechen_crush .trm-crush-buehne')
        return b && Number(b.dataset.combo) >= 1 && b.dataset.finale === '0'
      },
      kuechen_tinder: () => {
        const b = document.querySelector('#kuechen_tinder .trm-tinder-buehne')
        return b && b.dataset.aufgabe && b.dataset.schwierigkeit === '1' && b.dataset.combo === '0'
          && document.querySelector('#kuechen_tinder [data-karte]') !== null
      },
      kuechen_fit: () => {
        const b = document.querySelector('#kuechen_fit [data-stufe][data-fall-ms]')
        return b && b.dataset.stufe === '1' && Number(b.dataset.fallMs) >= 700
      },
    }
    if (HOOKS[id]) {
      const hookOk = await sLab.waitForFunction(HOOKS[id], { timeout: 3000 }).then(() => true).catch(() => false)
      pruefe(`${wort}: Startzustand (Hooks)`, hookOk)
    }
    if (!(await sLab.$('.trm-probe__blatt'))) {
      await sLab.click('.trm-probe__knopf')
      await warte(150)
    }
    await sLab.$eval('[data-probe="game-over"]', (b) => b.click()).catch(() => null)
    const ende = await sLab.waitForSelector(`#${id} .trm-spiel__endstand`, { timeout: 5000 }).then(() => true).catch(() => false)
    pruefe(`${wort}: TEST: GAME OVER beendet den Lauf`, ende && (await sLab.$('.trm-probe__blatt')) === null)
  }
}

/* Die Einwilligung im Testmodus: Umschalten geht, der Server-Stub bekommt
   den Testbeleg, und an der echten Welt aendert sich nichts. */
await sLab.$eval('#trm-einw-haken', (h) => h.click())
await sLab.$eval('.trm-einwilligung__speichern', (b) => b.click())
await warte(500)
pruefe('OPT-IN im Testmodus: Status wechselt',
  (await sLab.$eval('.trm-einwilligung__status', (e) => e.textContent).catch(() => '')) === 'Aktuell: ÖFFENTLICH')

await laborTat(sLab, 'KEYHOLE-PREVIEW VOR CODE')
const spaehDa = await sLab.waitForSelector('.trm-buehne--spaehen', { timeout: 3000 }).then(() => true).catch(() => false)
pruefe('KEYHOLE-PREVIEW: Blick laeuft, ZUGANG GESPERRT', spaehDa && /ZUGANG GESPERRT/.test(await text(sLab)))
const spaehZurueck = await sLab
  .waitForFunction(() => document.querySelector('.trm-buehne') === null && document.querySelector('.trm-code'), { timeout: 5000 })
  .then(() => true)
  .catch(() => false)
pruefe('KEYHOLE-PREVIEW: zurueck zur Code-Eingabe', spaehZurueck && !/VIDEKO TRESOR/i.test(await text(sLab)))

await laborTat(sLab, 'AKTIVIERTES DASHBOARD')
await warte(500)
const zettelVorReset = await probeZettel(sLab)

await laborTat(sLab, 'LEADERBOARD')
pruefe('LEADERBOARD: Seite + Badge', sLab.url().endsWith('/terminal/rangliste') && (await badge(sLab)))
pruefe('LEADERBOARD: Testsitzung taucht nirgends als eigener Platz auf', (await sLab.$('[data-ich="1"]')) === null)

await laborTat(sLab, 'LIVE-ZIEHUNGSANSICHT')
pruefe('LIVE-ZIEHUNG: Seite + Badge', sLab.url().endsWith('/terminal/ziehung') && (await badge(sLab)))

async function resetPruefen(wort, vorher) {
  const ab = sLab.__rufe.length
  pruefe(`${wort}: vorher liegen Testzettel`, vorher.length > 0, vorher.join(', '))
  await laborTat(sLab, wort)
  const lief = await sLab.evaluate(() => (window.__intro || []).some((e) => e.an))
  await introVorbei(sLab)
  const nach = (await probeZettel(sLab)).filter((k) => !k.endsWith('videko.terminal.intro'))
  const beleg = await sLab.evaluate(() => sessionStorage.getItem('videko.terminal.probe'))
  pruefe(`${wort}: Server-Reset aufgerufen`, sLab.__rufe.slice(ab).some((r) => r.aktion === 'probe-reset'))
  pruefe(`${wort}: frischer Testbeleg, Testzettel weg`, beleg === 'probe-beleg' && nach.length === 0, `${beleg} / ${nach.join(', ')}`)
  pruefe(`${wort}: Intro laeuft, danach Codefeld`, lief && (await sLab.$('.trm-code')) !== null && (await badge(sLab)))
}

await resetPruefen('ERSTEINSTIEG', zettelVorReset)
await laborTat(sLab, 'AKTIVIERTES DASHBOARD')
await warte(600)
await resetPruefen('SESSION ZURÜCKSETZEN', await probeZettel(sLab))

pruefe('Testlabor: echter Login in localStorage unberuehrt', (await speicherBild(sLab)) === echterSpeicher)
pruefe('Testlabor: jeder Serveraufruf traegt den Testbeleg',
  sLab.__rufe.slice(rufeAb).every((r) => r.probe),
  sLab.__rufe.slice(rufeAb).filter((r) => !r.probe).map((r) => r.aktion).join(', '))
pruefe('Testlabor: keine Aktivierung, kein Score, keine Teilnehmerzahl veraendert', weltBild() === echteWelt)

await laborTat(sLab, 'TESTMODUS VERLASSEN')
const echtDa = await sLab
  .waitForFunction(() => document.querySelectorAll('.trm-spiel').length === 2, { timeout: 4000 })
  .then(() => true)
  .catch(() => false)
pruefe('VERLASSEN: Testbeleg weg, kein Badge',
  (await sLab.evaluate(() => sessionStorage.getItem('videko.terminal.probe'))) === null && (await sLab.$('.trm-probe')) === null)
pruefe('VERLASSEN: echter Stand wieder da (Deckel 4711)', echtDa && /4711/.test(await text(sLab)))
const laborFehler = sLab.__fehler.filter((f) => !/ERR_ABORTED|aborted/i.test(f))
pruefe('Testlabor ohne JavaScript-Fehler', laborFehler.length === 0, laborFehler.slice(0, 2).join(' | '))
await sLab.close()

/* ================================================================== */
console.log('\n=== 13. Sitzung auf diesem Geraet beenden ===')

const sAb = await neueSeite(390, 844)
await sAb.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
await sAb.evaluate(() => localStorage.clear())
await sAb.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await warte(400)
pruefe('Ohne Login kein Abmelde-Punkt im Menue', (await menueKnopf(sAb, 'SITZUNG AUF DIESEM GERÄT BEENDEN')) === null)

await sAb.evaluate(() => {
  localStorage.setItem('videko.terminal.sitzung', 'sitzung-beleg')
  localStorage.setItem('videko.terminal.zugang', 'zugang-beleg')
  localStorage.setItem('videko.terminal.tresor', '1')
})
await sAb.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await warte(600)
pruefe('Eingeloggt: echtes Dashboard', /4711/.test(await text(sAb)))
const weltVorAbmelden = weltBild()
const rufeVorAbmelden = sAb.__rufe.length
const belege = () =>
  sAb.evaluate(() => ['sitzung', 'zugang', 'tresor'].map((k) => localStorage.getItem(`videko.terminal.${k}`)))

let abKnopf = await menueKnopf(sAb, 'SITZUNG AUF DIESEM GERÄT BEENDEN')
pruefe('Eingeloggt: Menue bietet SITZUNG AUF DIESEM GERÄT BEENDEN', abKnopf !== null)
if (abKnopf) {
  let frage = ''
  sAb.once('dialog', (d) => {
    frage = d.message()
    d.dismiss()
  })
  await abKnopf.click()
  await warte(300)
  pruefe('Rueckfrage nennt: Deckel bleibt aktiviert', /bleibt aktiviert/.test(frage), frage)
  pruefe('Abbrechen laesst alles, wie es ist', (await belege()).every(Boolean) && /4711/.test(await text(sAb)))

  abKnopf = await menueKnopf(sAb, 'SITZUNG AUF DIESEM GERÄT BEENDEN')
  sAb.once('dialog', (d) => d.accept())
  await Promise.all([sAb.waitForNavigation({ waitUntil: 'networkidle0' }), abKnopf.click()])
  await warte(500)
  pruefe('Bestaetigt: lokale Belege weg', (await belege()).every((b) => b === null))
  pruefe('Bestaetigt: Browser steht wieder vor dem Code', (await sAb.$('.trm-code')) !== null && !/4711/.test(await text(sAb)))
  const neueRufe = sAb.__rufe.slice(rufeVorAbmelden).map((r) => r.aktion)
  pruefe('Abmelden fragt keinen Server nach Loeschung/Deaktivierung',
    neueRufe.every((a) => a === 'zustand' || a === 'rangliste'), neueRufe.join(', '))
  pruefe('Abmelden: Deckel bleibt aktiviert, Teilnehmerzahl unveraendert', weltBild() === weltVorAbmelden)
}
pruefe('Abmelden ohne JavaScript-Fehler', sAb.__fehler.length === 0, sAb.__fehler.slice(0, 2).join(' | '))
await sAb.close()

/* ================================================================== */
console.log('\n=== 14. Bereits aktiviert? — Wieder-Login ===')

const NEUTRAL = 'Wenn zu dieser E-Mail ein aktivierter Deckel gehört, haben wir dir einen Zugangslink geschickt.'
const LINK_FEHLER = 'Dieser Zugangslink ist ungültig, abgelaufen oder wurde schon benutzt.'
const T_GUT = 'Gut_Token-0123456789abcdefghijklmnopqrstuvw'
welt.wiederOffen = new Set([T_GUT])

const sW = await neueSeite(390, 844)
await frisch(sW)
await sW.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await warte(500)
const weltVorWieder = weltBild()

pruefe('Ausgeloggt: Knopf BEREITS AKTIVIERT? auf /terminal', (await sW.$('.trm-wieder__knopf')) !== null)
pruefe('Formular erst nach dem Antippen', (await sW.$('#trm-wieder-email')) === null)
await sW.click('.trm-wieder__knopf')
await warte(300)
pruefe('Antippen: E-Mail-Feld offen und fokussiert',
  await sW.evaluate(() => document.activeElement?.id === 'trm-wieder-email'))

async function wiederSchicken(s, adresse) {
  const feld = await s.$('#trm-wieder-email')
  await feld.click({ clickCount: 3 })
  await s.keyboard.press('Backspace')
  await feld.type(adresse)
  const ab = s.__rufe.length
  await s.click('.trm-wieder__karte button[type="submit"]')
  await warte(350)
  const meldung = await s
    .$eval('.trm-wieder__meldung', (e) => ({ text: e.textContent, fehler: e.classList.contains('trm-meldung--fehler') }))
    .catch(() => null)
  return { meldung, rufe: s.__rufe.slice(ab) }
}

let w = await wiederSchicken(sW, 'kaputt')
t = await text(sW)
pruefe('Ungueltige Adresse: Feldfehler, kein Serveraufruf', /gültige E-Mail-Adresse/.test(t) && w.rufe.length === 0)

const wBekannt = await wiederSchicken(sW, 'deckel.besitzer@beispiel.de')
const wUnbekannt = await wiederSchicken(sW, 'gibt.es.nicht@beispiel.de')
pruefe('Anfrage: neutraler Satz', wBekannt.meldung?.text === NEUTRAL && !wBekannt.meldung.fehler, wBekannt.meldung?.text)
pruefe('Unbekannte Adresse: exakt dieselbe oeffentliche Antwort',
  JSON.stringify(wUnbekannt.meldung) === JSON.stringify(wBekannt.meldung))
pruefe('Anfrage geht als wieder-anfordern raus, ohne Sitzung',
  wBekannt.rufe.length === 1 && wBekannt.rufe[0].aktion === 'wieder-anfordern' && !wBekannt.rufe[0].sitzung)
pruefe('Ausserhalb des Testmodus kein Testlink', (await sW.$('.trm-wieder__test')) === null)

w = await wiederSchicken(sW, 'bremse@beispiel.de')
pruefe('Rate-Limit: freundliche Bremse', w.meldung?.fehler && /zu schnell/.test(w.meldung.text), w.meldung?.text)

pruefe('Ausgeloggt: Menue bietet BEREITS AKTIVIERT?', (await menueKnopf(sW, 'BEREITS AKTIVIERT?')) !== null)

/* Gueltiger Link */
await sW.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
await sW.goto(`${BASIS}/terminal#wieder=${T_GUT}`, { waitUntil: 'networkidle0' })
const wiederDash = await sW
  .waitForFunction(() => document.querySelectorAll('.trm-spiel').length === 2, { timeout: 5000 })
  .then(() => true)
  .catch(() => false)
pruefe('Gueltiger Link: Dashboard mit Deckel 4711', wiederDash && /4711/.test(await text(sW)))
pruefe('Gueltiger Link: Token aus der Adresszeile entfernt', (await sW.evaluate(() => location.href)).endsWith('/terminal'))
pruefe('Gueltiger Link: Sitzungsbeleg gespeichert',
  (await sW.evaluate(() => localStorage.getItem('videko.terminal.sitzung'))) === 'sitzung-beleg')
pruefe('Gueltiger Link: genau ein Einloese-Aufruf mit dem Token',
  sW.__rufe.filter((r) => r.aktion === 'wieder-einloesen').map((r) => r.token).join() === T_GUT)
pruefe('Gueltiger Link: keine Aktivierung', !sW.__rufe.some((r) => r.aktion === 'aktivieren'))
await sW.reload({ waitUntil: 'networkidle0' })
await warte(600)
pruefe('Nach Reload: Session bleibt wiederhergestellt', /4711/.test(await text(sW)) && (await sW.$$('.trm-spiel')).length === 2)
pruefe('Eingeloggt: kein BEREITS AKTIVIERT? im Menue', (await menueKnopf(sW, 'BEREITS AKTIVIERT?')) === null)
pruefe('Eingeloggt: kein Wieder-Login-Knopf im Dashboard', (await sW.$('.trm-wieder')) === null)

async function linkPruefen(name, token) {
  await sW.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
  await sW.evaluate(() => localStorage.clear())
  await sW.goto(`${BASIS}/terminal#wieder=${token}`, { waitUntil: 'networkidle0' })
  await warte(600)
  const meldung = await sW.$eval('.trm-wieder__meldung', (e) => e.textContent).catch(() => '')
  pruefe(`${name}: Hinweis, Formular offen, kein Dashboard`,
    meldung.startsWith(LINK_FEHLER) && (await sW.$('#trm-wieder-email')) !== null && !/4711/.test(await text(sW)), meldung)
  pruefe(`${name}: keine Sitzung gespeichert, Token aus der Adresszeile`,
    (await sW.evaluate(() => localStorage.getItem('videko.terminal.sitzung'))) === null
      && (await sW.evaluate(() => location.hash)) === '')
}
await linkPruefen('Zweimal verwendeter Link', T_GUT)
await linkPruefen('Ungueltiger Link', 'Falsch-Token-0123456789abcdefghijklmnopqrs')
await linkPruefen('Kaputter Link', 'kurz')
await linkPruefen('Abgelaufener Link', 'Alt_Token-0123456789abcdefghijklmnopqrstuvw')

/* Menue von einer Unterseite und auf /terminal selbst */
await sW.goto(`${BASIS}/terminal/rangliste`, { waitUntil: 'networkidle0' })
let mLink = await menueKnopf(sW, 'BEREITS AKTIVIERT?')
if (mLink) await Promise.all([sW.waitForNavigation({ waitUntil: 'networkidle0' }), mLink.click()])
await warte(500)
pruefe('Menue von Unterseite: /terminal mit offenem Formular',
  (await sW.$('#trm-wieder-email')) !== null && (await sW.evaluate(() => location.pathname + location.hash)) === '/terminal')
await sW.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
await sW.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await warte(400)
mLink = await menueKnopf(sW, 'BEREITS AKTIVIERT?')
if (mLink) await mLink.click()
await warte(500)
pruefe('Menue auf /terminal: Formular klappt auf, Menue zu',
  (await sW.$('#trm-wieder-email')) !== null && (await sW.$('.trm-menue-blatt')) === null)
pruefe('Wieder-Login: Teilnehmerzahl, Scores, Ziehung unveraendert', weltBild() === weltVorWieder)
/* 401 und 429 sind hier gewollt; der Browser meldet sie trotzdem in der Konsole. */
const echteFehler = (liste) => liste.filter((f) => !/Failed to load resource: .*status of (401|429)/.test(f))
pruefe('Wieder-Login ohne JavaScript-Fehler', echteFehler(sW.__fehler).length === 0, echteFehler(sW.__fehler).slice(0, 2).join(' | '))
await sW.close()

/* Kein Intro, wenn jemand ueber den Zugangslink kommt */
welt.wiederOffen.add(T_GUT)
const sWI = await neueSeite(390, 844, false)
await frisch(sWI)
await sWI.goto(`${BASIS}/terminal#wieder=${T_GUT}`, { waitUntil: 'networkidle0' })
await warte(700)
pruefe('Zugangslink in neuem Tab: kein Intro, direkt Dashboard',
  !(await sWI.evaluate(() => (window.__intro || []).some((e) => e.an))) && /4711/.test(await text(sWI)))
await sWI.close()

/* 320 px */
const sW3 = await neueSeite(320, 640)
await frisch(sW3)
await sW3.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await warte(400)
await sW3.click('.trm-wieder__knopf')
await warte(300)
await wiederSchicken(sW3, 'ein.ziemlich.langer.name@eine-lange-domain-zum-testen.de')
const ue = await ueberlauf(sW3)
pruefe('320 px: Wieder-Login ohne horizontales Scrollen', ue.scroll <= ue.sicht, JSON.stringify(ue))
await sW3.close()

/* Testlabor */
const sWP = await neueSeite(390, 844)
await frisch(sWP)
await sWP.evaluate(() => sessionStorage.setItem('videko.terminal.probe', 'probe-beleg'))
await sWP.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await warte(400)
const weltVorProbe = weltBild()
const rufeVorProbe = sWP.__rufe.length
await laborTat(sWP, 'WIEDER-LOGIN TESTEN')
pruefe('WIEDER-LOGIN TESTEN: Formular offen', (await sWP.$('#trm-wieder-email')) !== null)
const wp = await wiederSchicken(sWP, 'test@videko-kuechen.de')
pruefe('Testlabor: neutraler Satz + Testlink statt Mail',
  wp.meldung?.text === NEUTRAL && (await sWP.$('.trm-wieder__test')) !== null)
const testLinkEl = await sWP.$('.trm-wieder__test')
if (testLinkEl) await Promise.all([sWP.waitForNavigation({ waitUntil: 'networkidle0', timeout: 8000 }), testLinkEl.click()])
const probeDash = await sWP
  .waitForFunction(() => document.querySelectorAll('.trm-spiel').length === 2, { timeout: 5000 })
  .then(() => true)
  .catch(() => false)
t = await text(sWP)
pruefe('Testlink: Test-Dashboard (Deckel TEST), Badge', probeDash && /TEST/.test(t) && !/4711/.test(t) && (await badge(sWP)))
pruefe('Testlink: kein echter Login in localStorage',
  (await sWP.evaluate(() => localStorage.getItem('videko.terminal.sitzung'))) === null)
await sWP.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
/* Wie ein anderes Geraet: noch nicht eingeloggt, derselbe Link. */
await sWP.evaluate(() => sessionStorage.setItem('videko.terminal.probe', 'probe-beleg'))
await sWP.goto(`${BASIS}/terminal#wieder=probe-link`, { waitUntil: 'networkidle0' })
await warte(600)
pruefe('Testlink zweimal: verbraucht',
  (await sWP.$eval('.trm-wieder__meldung', (e) => e.textContent).catch(() => '')).startsWith(LINK_FEHLER))
pruefe('Testlabor-Wieder-Login: jeder Aufruf traegt den Testbeleg', sWP.__rufe.slice(rufeVorProbe).every((r) => r.probe))
pruefe('Testlabor-Wieder-Login: echte Welt unveraendert', weltBild() === weltVorProbe)
pruefe('Testlabor-Wieder-Login ohne JavaScript-Fehler', echteFehler(sWP.__fehler).length === 0, echteFehler(sWP.__fehler).slice(0, 2).join(' | '))
await sWP.close()

/* ================================================================== */
console.log('\n=== 15. Standard-Games, Practice Mode, Deckel bereits aktiviert ===')

/* Der echte Standard: keine Eintraege in der Verwaltung. */
welt.spieleAktiv = {}
const sP = await neueSeite(390, 844)
await frisch(sP)
await sP.evaluate(() => {
  localStorage.setItem('videko.terminal.zugang', 'zugang-beleg')
  localStorage.setItem('videko.terminal.tresor', '1')
})
await sP.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await sP.waitForSelector('[data-practice]', { timeout: 5000 }).catch(() => null)
await warte(300)

const practiceKey = await sP.$eval('[data-practice]', (e) => e.dataset.practice).catch(() => null)
pruefe('Ohne Deckel: Practice-Game ist Leitungsfinder', practiceKey === 'leitungsfinder', String(practiceKey))
const gesperrtListe = await sP.$$eval('[data-gesperrt]', (n) => n.map((e) => e.dataset.gesperrt))
pruefe('Ohne Deckel: die anderen fuenf Hauptgames gesperrt, kein Tinder',
  gesperrtListe.join(',') === STANDARD_GAMES.slice(1).join(','), gesperrtListe.join(', '))
const gesperrtText = await sP.$$eval('[data-gesperrt]', (n) => n.map((e) => e.innerText))
/* Der Sperrhinweis heisst seit dem Funnel-Umbau ERST ANMELDEN — kuerzer und
   ohne Vorgriff darauf, wie jemand hereinkommt (Deckel oder Einladung). */
pruefe('Gesperrte Games: ERST ANMELDEN',
  gesperrtText.length === 5 && gesperrtText.every((x) => /ERST ANMELDEN/i.test(x)),
  `${gesperrtText.length} — ${gesperrtText.join(' | ').replace(/\s+/g, ' ').slice(0, 120)}`)
pruefe('Gesperrte Games sind nicht startbar',
  (await sP.$$('[data-gesperrt] button, [data-gesperrt] .trm-cta')).length === 0)
pruefe('Ohne Deckel: noch keine gewertete Spielkarte', (await sP.$('.trm-spiel')) === null)

/* Practice-Lauf: oeffnen, starten, Game Over erzwingen. */
const rufeVorPractice = sP.__rufe.length
await sP.$eval('[data-spielwahl="leitungsfinder"]', (b) => { b.scrollIntoView({ block: 'center' }); b.click() }).catch(() => null)
await sP.waitForSelector('#leitungsfinder.trm-spiel', { timeout: 8000 }).catch(() => null)
await warte(300)
pruefe('Practice: Hinweis ohne Wertung', (await sP.$('#leitungsfinder [data-practice-hinweis]')) !== null)
const startP = await sP.$('#leitungsfinder .trm-cta')
pruefe('Practice: Startknopf da', startP !== null)
if (startP) await sP.$eval('#leitungsfinder .trm-cta', (b) => b.click())
await warte(900)
await sP.evaluate(() => window.dispatchEvent(new CustomEvent('trm-game-over', { detail: 'leitungsfinder' })))
await sP.waitForSelector('#leitungsfinder [data-practice-cta]', { timeout: 8000 }).catch(() => null)
const ergP = await sP.$eval('#leitungsfinder .trm-spiel__mitte--ergebnis', (e) => e.innerText).catch(() => '')
pruefe('Practice: DEIN SCORE nach Game Over', /DEIN SCORE/i.test(ergP), ergP.slice(0, 80))
pruefe('Practice: Score steht da', (await sP.$('#leitungsfinder [data-practice-score]')) !== null)
/* Ohne Deckel fuehrt der Weg weiter nicht ins Codefeld, sondern nennt beide
   Eingaenge. „SCORE OFFIZIELL MACHEN" steht nur im Probelauf mit Zugang. */
pruefe('Practice ohne Deckel: CTA nennt Einladung und Deckel',
  /HOL DIR EINE EINLADUNG ODER AKTIVIERE DEINEN DECKEL/i.test(ergP),
  ergP.replace(/\s+/g, ' ').slice(0, 200))
pruefe('Practice: kein Platz, keine Bestwerte',
  (await sP.$('#leitungsfinder .trm-spiel__marken')) === null && (await sP.$('#leitungsfinder .trm-spiel__platz')) === null)
const rufeP = sP.__rufe.slice(rufeVorPractice)
pruefe('Practice: kein spiel-start und kein spiel-ende an den Server',
  !rufeP.some((r) => r.aktion === 'spiel-start' || r.aktion === 'spiel-ende'), rufeP.map((r) => r.aktion).join(','))
await sP.$eval('#leitungsfinder [data-practice-cta]', (b) => b.click()).catch(() => null)
await warte(900)
pruefe('Practice-CTA fuehrt zur Aktivierung',
  await sP.evaluate(() => document.activeElement?.id === 'trm-deckel'))

/* Deckel 1847 ist schon aktiviert: Warnfenster. */
const aktivVor = welt.aktivierRufe.length
await sP.type('#trm-deckel', '1847')
await sP.type('#trm-instagram', 'zweitanspruch')
await sP.type('#trm-email', 'zweit@example.com')
await sP.click('#trm-folgt')
const abschicken = () => sP.evaluate(() => document.querySelector('#trm-deckel')?.closest('form')?.requestSubmit())
await abschicken()
await sP.waitForSelector('[data-belegt]', { timeout: 4000 }).catch(() => null)
const warnText = await sP.$eval('[data-belegt]', (e) => e.innerText).catch(() => '')
pruefe('Belegte Nummer: Warnfenster erscheint', /DIESER DECKEL WURDE BEREITS AKTIVIERT\./i.test(warnText), warnText.slice(0, 80))
pruefe('Warnfenster: JA und NEIN', (await sP.$('[data-belegt-ja]')) !== null && (await sP.$('[data-belegt-nein]')) !== null)
pruefe('Warnfenster: NEIN ist vorfokussiert',
  await sP.evaluate(() => document.activeElement?.hasAttribute('data-belegt-nein') === true))
pruefe('Erster Versuch ohne Besitzbestaetigung',
  welt.aktivierRufe.length === aktivVor + 1 && welt.aktivierRufe.at(-1).besitzBestaetigt === undefined)
pruefe('Warnfenster: noch nicht aktiviert', !/ZUGANG VOLLSTÄNDIG FREIGESCHALTET/i.test(await text(sP)))

await sP.keyboard.press('Escape')
await warte(250)
pruefe('Escape schliesst das Warnfenster ohne weiteren Ruf',
  (await sP.$('[data-belegt]')) === null && welt.aktivierRufe.length === aktivVor + 1)

await abschicken()
await sP.waitForSelector('[data-belegt-nein]', { timeout: 4000 }).catch(() => null)
await sP.click('[data-belegt-nein]').catch(() => null)
await warte(300)
pruefe('NEIN schliesst ohne weiteren Anspruch',
  (await sP.$('[data-belegt]')) === null && welt.aktivierRufe.length === aktivVor + 2
  && welt.aktivierRufe.every((r) => r.besitzBestaetigt !== true))
pruefe('NEIN: zurueck im Deckelfeld', await sP.evaluate(() => document.activeElement?.id === 'trm-deckel'))

await abschicken()
await sP.waitForSelector('[data-belegt-ja]', { timeout: 4000 }).catch(() => null)
await sP.click('[data-belegt-ja]').catch(() => null)
await warte(900)
pruefe('JA sendet die Besitzbestaetigung',
  welt.aktivierRufe.length === aktivVor + 4 && welt.aktivierRufe.at(-1).besitzBestaetigt === true && welt.aktivierRufe.at(-1).deckel === 1847,
  JSON.stringify(welt.aktivierRufe.slice(aktivVor)))
t = await text(sP)
pruefe('JA: weiterer Besitzanspruch aktiviert, Dashboard offen', /ZUGANG VOLLSTÄNDIG FREIGESCHALTET/i.test(t) && /1847/.test(t))
pruefe('JA: Warnfenster zu', (await sP.$('[data-belegt]')) === null)
pruefe('Keine E-Mail-Adresse sichtbar', !/zweit@example\.com/.test(t))

/* Nach Reload mit Sitzung: genau die sechs Standard-Games, sonst nichts. */
await sP.reload({ waitUntil: 'networkidle0' })
await warte(700)
const standardWahl = await sP.$$eval('[data-spielwahl]', (n) => n.map((e) => e.dataset.spielwahl))
pruefe('Standard: genau die sechs Hauptgames, kein Tinder, in dieser Reihenfolge',
  standardWahl.join(',') === STANDARD_GAMES.join(','), standardWahl.join(', '))
pruefe('Standard ohne Testslot: keine Tinder-Karte', (await sP.$('[data-spielwahl="kuechen_tinder"], #kuechen_tinder')) === null)
pruefe('Standard: Truhenknacker, Goldrausch, Balance, Stack, Dash ausgeblendet',
  (await sP.$$('.trm-spiel')).length === 0 && (await sP.$$('#truhenknacker, #goldrausch, #kuechen_balance, #kuechen_stack, #kuechen_dash')).length === 0)
/* Die 409 ist hier gewollt: so meldet der Server eine bereits aktivierte Nummer. */
/* Alle sechs Hauptgames gespielt, vier davon gewertet: Platz, Punkte von
   4.000, Luecke zum naechsten Platz. */
const besteVorGr = { ...welt.beste }
for (const k of HAUPTGAMES) welt.beste[k] = welt.beste[k] ?? 1234
await sP.reload({ waitUntil: 'networkidle0' })
await sP.waitForSelector('#trm-gr-karte', { timeout: 5000 }).catch(() => null)
const grQuali = await sP.$eval('#trm-gr-karte', (e) => e.innerText).catch(() => '')
pruefe('Dashboard qualifiziert: PLATZ 9 VON 31 und 3.060 / 4.000 PUNKTE',
  /PLATZ 9 VON 31/i.test(grQuali) && /3\.060 \/ 4\.000 PUNKTE/i.test(grQuali), grQuali.slice(0, 160))
pruefe('Dashboard qualifiziert: Noch 145 Punkte bis Platz 8',
  /Noch 145 Punkte bis Platz 8/.test(await sP.$eval('#trm-gr-karte [data-gr-luecke]', (e) => e.textContent).catch(() => '')))
pruefe('Dashboard qualifiziert: Rangpunkte und Bestwert je Game',
  /612 Rangpunkte · Bestwert [\d.]+/i.test(grQuali) && (await sP.$('#trm-gr-karte [data-gr-fehlt]')) === null,
  grQuali.replace(/\s+/g, ' ').slice(0, 240))
pruefe('Dashboard: keine Deckelnummer in der Gesamtranking-Karte', !/1847/.test(grQuali))
Object.assign(welt.beste, besteVorGr)

const practiceFehler = echteFehler(sP.__fehler).filter((f) => !/Failed to load resource: .*status of 409/.test(f))
pruefe('Practice und Mehrfachanspruch ohne JavaScript-Fehler', practiceFehler.length === 0, practiceFehler.slice(0, 2).join(' | '))
await sP.close()

/* Die Verwaltung waehlt ein anderes Practice-Game. */
welt.guestPracticeGame = 'kuechen_fit'
const sQ = await neueSeite(390, 844)
await frisch(sQ)
await sQ.evaluate(() => {
  localStorage.setItem('videko.terminal.zugang', 'zugang-beleg')
  localStorage.setItem('videko.terminal.tresor', '1')
})
await sQ.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await sQ.waitForSelector('[data-practice]', { timeout: 5000 }).catch(() => null)
const practiceFit = await sQ.$eval('[data-practice]', (e) => e.dataset.practice).catch(() => null)
const gesperrtFit = await sQ.$$eval('[data-gesperrt]', (n) => n.map((e) => e.dataset.gesperrt))
pruefe('Admin-Einstellung: Practice-Game folgt guest_practice_game',
  practiceFit === 'kuechen_fit' && gesperrtFit.length === 5 && !gesperrtFit.includes('kuechen_fit') && gesperrtFit.includes('leitungsfinder'),
  `${practiceFit} / ${gesperrtFit.join(', ')}`)
await sQ.close()
welt.guestPracticeGame = 'leitungsfinder'

/* Tinder erscheint nur, wenn es eingetragen ist (Testslot → spiele_aktiv). */
welt.spieleAktiv = { kuechen_tinder: true }
const sT = await neueSeite(390, 844)
await frisch(sT)
await sT.evaluate(() => {
  localStorage.setItem('videko.terminal.zugang', 'zugang-beleg')
  localStorage.setItem('videko.terminal.tresor', '1')
})
await sT.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
await sT.waitForSelector('[data-practice]', { timeout: 5000 }).catch(() => null)
const gesperrtTinder = await sT.$$eval('[data-gesperrt]', (n) => n.map((e) => e.dataset.gesperrt))
pruefe('Testslot eingetragen: Tinder erscheint zusaetzlich',
  gesperrtTinder.length === 6 && gesperrtTinder.at(-1) === 'kuechen_tinder', gesperrtTinder.join(', '))
await sT.close()
welt.spieleAktiv = { ...ALT_AN }

/* ================================================================== */
console.log('\n=== 16. Verwaltung: Gesamtranking ===')

const bis = async (bedingung, ms = 5000) => {
  const ende = Date.now() + ms
  while (Date.now() < ende) {
    if (await bedingung()) return true
    await warte(50)
  }
  return false
}

const sA = await neueSeite(1280, 900)
const dialoge = []
sA.on('dialog', (d) => {
  dialoge.push(d.message())
  d.accept()
})
await sA.goto(`${BASIS}/terminal/admin`, { waitUntil: 'networkidle0' })
await sA.waitForSelector('#adm-schluessel', { timeout: 5000 }).catch(() => null)
await sA.type('#adm-schluessel', ADMIN_SCHLUESSEL)
await sA.evaluate(() => document.querySelector('#adm-schluessel')?.closest('form')?.requestSubmit())
await sA.waitForSelector('#adm-gesamtranking', { timeout: 5000 }).catch(() => null)
pruefe('Admin: Anmeldung traegt, Gesamtranking-Karte da', (await sA.$('#adm-gesamtranking')) !== null)
pruefe('Admin: Warnung zum Gesamtranking steht da',
  /ACHTUNG: Dieses Game ist Bestandteil des Gesamtrankings\./.test(await sA.$eval('[data-gr-warnung]', (e) => e.textContent).catch(() => '')))
pruefe('Admin: Testslot leer waehlbar und leer',
  (await sA.$eval('#adm-testslot', (e) => e.value).catch(() => null)) === ''
  && /kein Testslot/.test(await sA.$eval('#adm-testslot option[value=""]', (e) => e.textContent).catch(() => '')))

/* Hauptgame aendern: Dialog, dann zweite Bestaetigung. Erst abbrechen, dann wirklich. */
const hauptgameWaehlen = async (i, key) => {
  await sA.select(`#adm-hauptgame-${i}`, key)
  await sA.waitForSelector('[data-gr-bestaetigung]', { timeout: 5000 }).catch(() => null)
}
const rufeVorHg = sA.__rufe.length
await hauptgameWaehlen(0, 'kuechen_tinder')
pruefe('Hauptgame: erste Warnung als Dialog', dialoge.some((m) => /ACHTUNG: Dieses Game ist Bestandteil des Gesamtrankings/.test(m)))
const bestText = await sA.$eval('[data-gr-bestaetigung]', (e) => e.innerText).catch(() => '')
pruefe('Hauptgame: zweite Bestaetigung mit Teilnehmerzahl',
  /offizielle Gesamtranking-Daten von 5 Teilnehmern/.test(bestText) && /HAUPTGAME WIRKLICH ÄNDERN/.test(bestText),
  bestText.replace(/\s+/g, ' ').slice(0, 200))
pruefe('Hauptgame: ohne zweite Bestaetigung nichts gespeichert', adminWelt.hauptgames[0] === 'leitungsfinder' && adminWelt.protokoll.length === 0)
pruefe('Hauptgame: Auswahl gesperrt, solange die Bestaetigung offen ist', await sA.$eval('#adm-hauptgame-1', (e) => e.disabled).catch(() => false))
await sA.click('[data-gr-abbrechen]').catch(() => null)
await warte(300)
pruefe('Hauptgame: Abbrechen aendert nichts',
  (await sA.$('[data-gr-bestaetigung]')) === null && adminWelt.protokoll.length === 0
  && (await sA.$eval('#adm-hauptgame-0', (e) => e.value).catch(() => null)) === 'leitungsfinder')

await hauptgameWaehlen(0, 'kuechen_tinder')
await sA.click('[data-gr-bestaetigen]').catch(() => null)
await bis(async () => adminWelt.protokoll.length === 1 && (await sA.$('[data-gr-bestaetigung]')) === null)
await warte(300)
pruefe('Hauptgame: mit Bestaetigung gespeichert und protokolliert',
  adminWelt.hauptgames[0] === 'kuechen_tinder' && adminWelt.protokoll.length === 1 && adminWelt.protokoll[0].bestaetigt === true,
  JSON.stringify(adminWelt.protokoll))
pruefe('Hauptgame: Ruf traegt die Bestaetigung woertlich',
  sA.__rufe.slice(rufeVorHg).some((r) => r.aktion === 'einstellungen' && r.bestaetigung === HAUPTGAME_OK))
pruefe('Hauptgame: Auswahl zeigt den neuen Stand', (await sA.$eval('#adm-hauptgame-0', (e) => e.value).catch(() => null)) === 'kuechen_tinder')
await hauptgameWaehlen(0, 'leitungsfinder')
await sA.click('[data-gr-bestaetigen]').catch(() => null)
await bis(() => adminWelt.protokoll.length === 2)
await warte(300)
pruefe('Hauptgame: zurueckgestellt, zweiter Protokolleintrag',
  adminWelt.hauptgames.join(',') === HAUPTGAMES.join(',') && adminWelt.protokoll.length === 2)

/* Testslot setzen und wieder leeren. */
await sA.select('#adm-testslot', 'kuechen_tinder')
await bis(() => adminWelt.testslot === 'kuechen_tinder')
await warte(300)
pruefe('Testslot: Tinder eingetragen', adminWelt.testslot === 'kuechen_tinder'
  && (await sA.$eval('#adm-testslot', (e) => e.value).catch(() => null)) === 'kuechen_tinder')
await sA.select('#adm-testslot', '')
await bis(() => adminWelt.testslot === null)
await warte(300)
pruefe('Testslot: wieder leer', adminWelt.testslot === null
  && (await sA.$eval('#adm-testslot', (e) => e.value).catch(() => null)) === '')
pruefe('Testslot: kein Protokolleintrag', adminWelt.protokoll.length === 2)

/* Zusatzpreise 1 bis 3. */
for (const [p, w] of [[1, 'Messerset'], [2, 'Kochbuch'], [3, 'Schuerze']]) await sA.type(`#adm-preis-gesamt-${p}`, w)
await sA.$eval('#adm-preis-gesamt-1', (e) => e.closest('form').requestSubmit())
await bis(() => adminWelt.preise[3] === 'Schuerze')
await warte(300)
pruefe('Preise: Platz 1 bis 3 gespeichert',
  adminWelt.preise[1] === 'Messerset' && adminWelt.preise[2] === 'Kochbuch' && adminWelt.preise[3] === 'Schuerze', JSON.stringify(adminWelt.preise))
pruefe('Preise: Felder zeigen den gespeicherten Stand',
  (await sA.$eval('#adm-preis-gesamt-2', (e) => e.value).catch(() => '')) === 'Kochbuch')

/* Vorschau, Verdacht, Top-3-Pruefung. */
pruefe('Abschliessen erst nach dem Laden', await sA.$eval('[data-gr-abschliessen]', (e) => e.disabled).catch(() => false))
await sA.click('[data-gr-laden]')
await sA.waitForSelector('[data-gr-tabelle]', { timeout: 5000 }).catch(() => null)
await warte(200)
const grAdmin = await sA.$eval('#adm-gesamtranking', (e) => e.innerText).catch(() => '')
pruefe('Vorschau: Tabelle mit drei Plaetzen', (await sA.$$('[data-gr-tabelle] tbody tr')).length === 3)
pruefe('Vorschau: verdaechtiger Run gelistet',
  (await sA.$eval('[data-gr-verdacht]', (e) => e.dataset.grVerdacht).catch(() => null)) === '1' && /zu schnell/.test(grAdmin))
pruefe('Vorschau: Doppelung markiert', (await sA.$('[data-gr-doppelt]')) !== null && /Platz 1 und 3/.test(grAdmin))
pruefe('Top-3: drei Pruefbloecke', (await sA.$$('[data-gr-top3-platz]')).length === 3)
pruefe('Top-3: Hinweis zur manuellen Pruefung',
  /Noch keine automatische Disqualifikation\. Wir prüfen die Gewinner vor Preisvergabe manuell\./.test(grAdmin))
pruefe('Top-3: je Platz sechs Games',
  await sA.$$eval('[data-gr-top3-platz]', (n) => n.every((e) => e.querySelectorAll('li').length === 6)))
pruefe('Top-3: verdaechtiger Run bei Platz 2, keiner bei Platz 1',
  (await sA.$eval('[data-gr-top3-platz="2"] [data-gr-top3-verdacht]', (e) => e.dataset.grTop3Verdacht).catch(() => null)) === '1'
  && /Keine verdächtigen Runs\./.test(await sA.$eval('[data-gr-top3-platz="1"]', (e) => e.innerText).catch(() => '')))
const deckel2 = await sA.$eval('[data-gr-top3-platz="2"] [data-gr-top3-deckel]', (e) => e.textContent).catch(() => '')
pruefe('Top-3: Deckel, Besitzanspruch und Besitzstatus', /Deckel #9002/.test(deckel2) && /Weiterer Besitzanspruch/.test(deckel2) && /BESITZ BESTÄTIGT/.test(deckel2), deckel2)
pruefe('Top-3: Doppelung je Platz', /Mögliche Doppelung: gleiche E-Mail wie Platz 3/.test(grAdmin))

/* Abschliessen: danach Hauptgames gesperrt, auch mit Bestaetigung. */
const dialogeVorAbschluss = dialoge.length
await sA.click('[data-gr-abschliessen]')
await bis(() => adminWelt.abgeschlossenAm != null)
await warte(600)
pruefe('Abschluss: Sicherheitsabfrage', dialoge.slice(dialogeVorAbschluss).some((m) => /GESAMTRANKING ABSCHLIESSEN\?/.test(m)))
pruefe('Abschluss: alle sechs Hauptgame-Auswahlen gesperrt',
  await sA.$$eval('[id^="adm-hauptgame-"]', (n) => n.length === 6 && n.every((e) => e.disabled)))
pruefe('Abschluss: Knopf zeigt ABGESCHLOSSEN',
  /ABGESCHLOSSEN/.test(await sA.$eval('[data-gr-abschliessen]', (e) => e.textContent).catch(() => '')))
const nachAbschluss = await sA.evaluate(async (schluessel, ok) => {
  const r = await fetch('/api/terminal-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-terminal-admin': schluessel },
    body: JSON.stringify({ aktion: 'einstellungen', hauptgames: ['kuechen_tinder', 'kuechen_merge', 'kuechen_crush', 'videko_jump', 'kuechen_fit', 'videko_slam'], bestaetigung: ok }),
  })
  return { status: r.status, grund: (await r.json()).grund }
}, ADMIN_SCHLUESSEL, HAUPTGAME_OK)
pruefe('Abschluss: Hauptgame-Aenderung auch mit Bestaetigung abgewiesen',
  nachAbschluss.status === 400 && nachAbschluss.grund === 'abgeschlossen' && adminWelt.protokoll.length === 2
  && adminWelt.hauptgames.join(',') === HAUPTGAMES.join(','), JSON.stringify(nachAbschluss))
pruefe('Admin: keine E-Mail-Adresse sichtbar', !/@[\w.-]+\.(de|com|net)/.test(await text(sA)))
const adminFehler = sA.__fehler.filter((f) => !/Failed to load resource: .*status of 400/.test(f))
pruefe('Verwaltung ohne JavaScript-Fehler', adminFehler.length === 0, adminFehler.slice(0, 2).join(' | '))
await sA.close()

/* ================================================================== */
await browser.close()

const fehl = ergebnisse.filter((e) => !e.ok)
console.log(`\n========================================`)
console.log(`Gepruft: ${ergebnisse.length} · bestanden: ${ergebnisse.length - fehl.length} · fehlgeschlagen: ${fehl.length}`)
if (fehl.length) {
  console.log('\nFehlgeschlagen:')
  for (const f of fehl) console.log(`  · ${f.name}${f.zusatz ? ` — ${f.zusatz}` : ''}`)
}
process.exit(fehl.length ? 1 : 0)
