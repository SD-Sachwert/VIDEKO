/**
 * Spielgefuehl-Messung fuer KÜCHEN-STACK und KÜCHEN-DASH.
 *
 * Kein Server, kein localhost-API: wie terminal-test.mjs faengt das Skript
 * /api/terminal ab und antwortet selbst — mit kuenstlicher Latenz, damit
 * "Restart ohne Ladezeit" unter echten Bedingungen gemessen wird.
 *
 * Gespielt wird von Bots mit menschlichem Timing: sie sehen dasselbe DOM wie
 * ein Mensch, schaetzen den richtigen Moment und tippen mit normalverteiltem
 * Fehler daneben. Drei Profile — Anfaenger, geuebt, gut.
 *
 * Aufruf:  node scripts/terminal-spielgefuehl.mjs <port> [laeufe] [etikett]
 */

import puppeteer from 'puppeteer-core'
import { existsSync, writeFileSync } from 'node:fs'

const PORT = process.argv[2] || '4191'
const LAEUFE = Number(process.argv[3] || 20)
const ETIKETT = process.argv[4] || 'messung'
const LATENZ = Number(process.env.LATENZ || 280)
const BASIS = `http://127.0.0.1:${PORT}`
const AUS = process.env.AUSGABE || '.'

const CHROME = [
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find((p) => p && existsSync(p))

const PROFILE = [
  { name: 'anfaenger', sigma: 90, bias: 25, reaktion: 380, commit: 0.3 },
  { name: 'geuebt', sigma: 45, bias: 10, reaktion: 260, commit: 0.25 },
  { name: 'gut', sigma: 25, bias: 0, reaktion: 200, commit: 0.22 },
]
const SPIELE = (process.env.SPIELE || 'kuechen_stack,kuechen_dash').split(',')
const DECKEL_MS = Number(process.env.DECKEL_MS || 120000)

let laufNr = 0
function antwort(b) {
  switch (b.aktion) {
    case 'zustand':
      return {
        ok: true,
        aktiviert: 3,
        einstellungen: { ziehungAm: new Date(Date.now() + 3 * 86400000).toISOString(), gezogen: null, followerZahl: 800, meilensteinGewinne: {}, spieleAktiv: {} },
        teilnehmer: { deckel: 4999, instagram: 'bot', aktiviertAm: new Date().toISOString(), leaderboardOk: true },
        spiele: { beste: { truhenknacker: null, goldrausch: null, kuechen_stack: null, kuechen_dash: null }, gesamt: null, platz: null, gelistet: false },
        koenig: { instagram: 'tresorkoenig', punkte: 42840 },
      }
    case 'spiel-start':
      laufNr += 1
      return { ok: true, ticket: `ticket-${laufNr}`, dauerMs: 540000 }
    case 'spiel-ende':
      return { ok: true, gespeichert: true, gewertet: true, punkte: Number(b.score) || 0, beste: {}, rang: { platz: 7, von: 143, bisPlatz: 5, luecke: 1420 }, heute: { punkte: 21840 } }
    case 'rangliste':
      return { ok: true, spieleAktiv: {}, listen: {} }
    default:
      return { ok: true }
  }
}

/* ------------------------------------------------------------------ */
/* Der Bot — laeuft im Browser                                         */
/* ------------------------------------------------------------------ */

async function botLauf(game, P, deckelMs) {
  const karte = document.getElementById(game)
  const gauss = () => {
    let u = 0
    let v = 0
    while (!u) u = Math.random()
    while (!v) v = Math.random()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  const frame = () => new Promise((r) => requestAnimationFrame(r))
  const warte = (ms) => new Promise((r) => setTimeout(r, ms))
  const sel = game === 'kuechen_stack' ? '.trm-stack-buehne' : '.trm-dash-buehne'

  let knopf = null
  const suchBis = performance.now() + 8000
  while (performance.now() < suchBis) {
    knopf = karte.querySelector('.trm-spiel__kopf .trm-cta')
    if (knopf && !knopf.disabled) break
    await warte(5)
  }
  if (!knopf) return { fehler: 'knopf' }
  const knopfText = knopf.textContent.trim()
  const tKlick = performance.now()
  knopf.click()
  let buehne = null
  /* NOCHMAL geht schon waehrend des Speicherns: bis React neu zeichnet, steht
     noch die alte Buehne im Crash-Zustand da. Die zaehlt nicht als Start. */
  while (!(buehne = karte.querySelector(sel)) || buehne.dataset.crash === '1') {
    await frame()
    if (performance.now() - tKlick > 10000) return { fehler: 'buehne' }
  }
  const tBuehne = performance.now()
  const tipp = () => buehne.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))

  const r = { game, profil: P.name, knopf: knopfText, restartMs: Math.round(tBuehne - tKlick) }
  let perfekte = 0
  let maxFaktor = 1
  const gags = []
  const mo = new MutationObserver((ms) => {
    for (const m of ms) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue
        /* Die Gags sind im DASH reine Hintergrund-Schilder. */
        if (n.classList.contains('trm-dash-schild--gag')) gags.push(n.textContent.trim())
        if (!n.classList.contains('trm-spiel__ruf')) continue
        if (n.classList.contains('trm-spiel__ruf--perfekt')) {
          perfekte += 1
          const f = /×(\d)/.exec(n.textContent)
          if (f) maxFaktor = Math.max(maxFaktor, Number(f[1]))
        }
      }
    }
  })
  mo.observe(karte.querySelector('.trm-feld-spiel'), { childList: true, subtree: true })

  let gedeckelt = false
  if (game === 'kuechen_stack') {
    let letzteNr = -1
    let erschienen = 0
    let prevX = null
    let prevT = 0
    let v = 0
    let festgelegt = false
    const abw = []
    const fruehTod = { nr: null }
    const oberstes = () => {
      const l = buehne.querySelectorAll('.trm-stack-turm > .trm-stack-modul:not(.trm-stack-modul--faellt)')
      return l[l.length - 1]
    }
    while (buehne.isConnected && buehne.dataset.crash !== '1') {
      await frame()
      const jetzt = performance.now()
      if (jetzt - tBuehne > deckelMs) {
        gedeckelt = true
        break
      }
      const top = oberstes()
      const fahrer = buehne.querySelector('.trm-stack-modul--faehrt')
      if (!top || !fahrer) continue
      const nr = Number(top.style.getPropertyValue('--stufe'))
      const B = buehne.clientWidth
      const m = /translateX\((-?[\d.]+)px\)/.exec(fahrer.style.transform)
      if (!m) continue
      const x = Number(m[1]) / B
      if (nr !== letzteNr) {
        letzteNr = nr
        erschienen = jetzt
        prevX = null
        festgelegt = false
        continue
      }
      if (prevX != null && jetzt > prevT && Math.abs(x - prevX) < 0.2) {
        v = (x - prevX) / ((jetzt - prevT) / 1000)
      }
      prevX = x
      prevT = jetzt
      if (festgelegt || jetzt - erschienen < P.reaktion || Math.abs(v) < 0.05) continue
      const ziel = Number(top.style.getPropertyValue('--x'))
      const ttr = (ziel - x) / v
      if (ttr > 0.03 && ttr <= P.commit) {
        festgelegt = true
        const fehler = gauss() * P.sigma + P.bias
        const wann = Math.max(0, ttr * 1000 + fehler)
        const merkNr = nr
        setTimeout(() => {
          abw.push(Math.abs(fehler))
          tipp()
          fruehTod.nr = merkNr
        }, wann)
      }
    }
    r.module = letzteNr
    r.abwMs = abw.length ? Math.round(abw.reduce((a, b) => a + b, 0) / abw.length) : null
  } else {
    const LX = 0.22
    const LB = 0.13
    const LH = 0.24
    const FLUG = (2 * 3.1) / 11
    const geplant = new WeakSet()
    const vorher = new WeakMap()
    const beobachtet = new Map()
    /* Reaktion: gesprungen wird fruehestens P.reaktion ms, nachdem ein
       Hindernis am rechten Rand sichtbar wurde — wie bei einem Menschen. */
    const gesehen = new WeakMap()
    let tempo = 1.4
    let spruenge = 0
    let tempoMax = 0
    while (buehne.isConnected && buehne.dataset.crash !== '1') {
      await frame()
      const jetzt = performance.now()
      if (jetzt - tBuehne > deckelMs) {
        gedeckelt = true
        break
      }
      const H = buehne.clientHeight
      const W = buehne.clientWidth
      const px0 = (LX * W) / H + LB * 0.22
      const pc = (LX * W) / H + LB * 0.5
      const l = buehne.querySelector('.trm-dash-laeufer')
      const lm = l && /translate3d\((-?[\d.]+)px, (-?[\d.]+)px/.exec(l.style.transform)
      const y = lm ? (H * 0.8 - Number(lm[2])) / H - LH : 0
      for (const el of buehne.querySelectorAll('.trm-dash-hindernis')) {
        const m = /translate3d\((-?[\d.]+)px/.exec(el.style.transform)
        if (!m) continue
        const ox = Number(m[1]) / H
        const ob = parseFloat(el.style.width) / H
        const oh = parseFloat(el.style.height) / H
        const p = vorher.get(el)
        if (p && jetzt > p.t) {
          const vi = (p.x - ox) / ((jetzt - p.t) / 1000)
          if (vi > 0.3 && vi < 4) tempo = tempo * 0.7 + vi * 0.3
        }
        vorher.set(el, { x: ox, t: jetzt })
        tempoMax = Math.max(tempoMax, tempo)
        const vis0 = (LX * W) / H
        if (ox < vis0 + LB && ox + ob > vis0) {
          const b = beobachtet.get(el) || { min: 9 }
          b.min = Math.min(b.min, y - oh)
          beobachtet.set(el, b)
        }
        if (!gesehen.has(el) && ox < W / H) gesehen.set(el, jetzt)
        if (!geplant.has(el) && gesehen.has(el) && ox + ob > px0) {
          const verzug = (ox + ob / 2 - pc) / tempo - FLUG / 2
          if (verzug <= P.commit) {
            geplant.add(el)
            const fehler = gauss() * P.sigma + P.bias
            const fruehestens = gesehen.get(el) + P.reaktion - jetzt
            setTimeout(() => {
              tipp()
              spruenge += 1
            }, Math.max(0, verzug * 1000 + fehler, fruehestens))
          }
        }
      }
    }
    /* Beim Crash stehen alle Positionen still: sichtbar ueberlappt es? */
    let crashSichtbar = null
    if (!gedeckelt && buehne.isConnected) {
      const H = buehne.clientHeight
      const W = buehne.clientWidth
      const l = buehne.querySelector('.trm-dash-laeufer')
      const lm = l && /translate3d\((-?[\d.]+)px, (-?[\d.]+)px/.exec(l.style.transform)
      const y = lm ? (H * 0.8 - Number(lm[2])) / H - LH : 0
      const vis0 = (LX * W) / H
      for (const el of buehne.querySelectorAll('.trm-dash-hindernis')) {
        const m = /translate3d\((-?[\d.]+)px/.exec(el.style.transform)
        if (!m) continue
        const ox = Number(m[1]) / H
        const ob = parseFloat(el.style.width) / H
        const oh = parseFloat(el.style.height) / H
        const hor = Math.min(vis0 + LB, ox + ob) - Math.max(vis0, ox)
        if (hor > 0) {
          crashSichtbar = { horH: Number(hor.toFixed(3)), tiefeH: Number((oh - y).toFixed(3)), art: el.className.split('--')[1] }
          beobachtet.delete(el)
        }
      }
    }
    r.crashSichtbar = crashSichtbar
    r.spruenge = spruenge
    r.tempoMax = Number(tempoMax.toFixed(2))
    r.knappDrueber = [...beobachtet.values()].filter((b) => b.min < 0).length
  }
  const tCrash = performance.now()
  r.dauerS = Number(((tCrash - tBuehne) / 1000).toFixed(2))
  r.gedeckelt = gedeckelt
  r.perfekte = perfekte
  r.maxFaktor = maxFaktor
  r.gags = gags
  /* Gedeckelt: absichtlich verlieren, damit die naechste Runde normal
     ueber NOCHMAL startet. STACK tippt, sobald nichts mehr ueberlappt;
     DASH springt einfach nicht mehr. */
  if (gedeckelt) {
    const bis = performance.now() + 15000
    while (buehne.isConnected && buehne.dataset.crash !== '1' && performance.now() < bis) {
      await frame()
      if (game !== 'kuechen_stack') continue
      const l = buehne.querySelectorAll('.trm-stack-turm > .trm-stack-modul:not(.trm-stack-modul--faellt)')
      const top = l[l.length - 1]
      const fahrer = buehne.querySelector('.trm-stack-modul--faehrt')
      const m = fahrer && /translateX\((-?[\d.]+)px\)/.exec(fahrer.style.transform)
      if (!top || !m) continue
      const x = Number(m[1]) / buehne.clientWidth
      const b = Number(top.style.getPropertyValue('--b'))
      const tx = Number(top.style.getPropertyValue('--x'))
      if (x > tx + b + 0.01 || x + parseFloat(fahrer.style.width) / buehne.clientWidth < tx - 0.01) tipp()
    }
  }
  const tEnde = performance.now()
  while (!karte.querySelector('.trm-spiel__endstand')) {
    await frame()
    if (performance.now() - tEnde > 10000) break
  }
  const ergebnisMs = Math.round(performance.now() - tEnde)
  let nochmal = null
  while (!(nochmal = karte.querySelector('.trm-spiel__kopf .trm-cta')) || nochmal.disabled) {
    await frame()
    if (performance.now() - tEnde > 10000) break
  }
  if (!gedeckelt) {
    r.crashBisErgebnisMs = ergebnisMs
    r.crashBisNochmalMs = Math.round(performance.now() - tEnde)
  }
  await warte(30)
  r.punkte = Number((karte.querySelector('.trm-spiel__endstand')?.textContent || '0').replace(/\D/g, ''))
  r.perfekte = perfekte
  r.maxFaktor = maxFaktor
  mo.disconnect()
  return r
}

/* ------------------------------------------------------------------ */

/* Ein Browser je Bot: mehrere Tabs in einem headless-Chrome bekommen im
   Hintergrund kein requestAnimationFrame mehr. */
const browsers = []
async function seiteFuer() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    protocolTimeout: DECKEL_MS + 60000,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  })
  browsers.push(browser)
  const s = (await browser.pages())[0] || (await browser.newPage())
  await s.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  await s.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  await s.evaluateOnNewDocument(() => {
    try {
      sessionStorage.setItem('videko.terminal.intro', '1')
      localStorage.setItem('videko.terminal.sitzung', 'sitzung-beleg')
      localStorage.setItem('videko.terminal.tresor', '1')
    } catch {
      /* egal */
    }
  })
  await s.setRequestInterception(true)
  s.on('request', (a) => {
    if (!a.url().includes('/api/terminal')) return a.continue()
    let k = {}
    try {
      k = JSON.parse(a.postData() || '{}')
    } catch {
      k = {}
    }
    const verzoegert = k.aktion === 'spiel-start' || k.aktion === 'spiel-ende' || k.aktion === 'zustand'
    setTimeout(() => a.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(antwort(k)) }),
      verzoegert ? LATENZ : 0)
    return undefined
  })
  s.__fehler = []
  s.on('pageerror', (e) => s.__fehler.push(String(e.message || e)))
  await s.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
  await s.waitForSelector('#kuechen_dash', { timeout: 10000 })
  return s
}

const alle = []
await Promise.all(
  SPIELE.flatMap((game) =>
    PROFILE.map(async (P) => {
      const s = await seiteFuer()
      await s.evaluate((g) => document.getElementById(g).scrollIntoView(), game)
      for (let i = 0; i < LAEUFE; i += 1) {
        const r = await s.evaluate(botLauf, game, P, DECKEL_MS)
        r.nr = i + 1
        alle.push(r)
        if (r.fehler) {
          console.log('FEHLER', game, P.name, r.fehler)
          break
        }
      }
      if (s.__fehler.length) console.log('Seitenfehler', game, P.name, s.__fehler.slice(0, 3))
    }),
  ),
)
await Promise.all(browsers.map((b) => b.close()))

writeFileSync(`${AUS}/spielgefuehl-${ETIKETT}.json`, JSON.stringify(alle, null, 1))

const median = (l) => {
  const s = l.filter(Number.isFinite).sort((a, b) => a - b)
  if (!s.length) return null
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const q = (l, p) => {
  const s = [...l].sort((a, b) => a - b)
  return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null
}

console.log(`\nSpielgefuehl "${ETIKETT}" — ${LAEUFE} Laeufe je Spiel und Profil, Latenz ${LATENZ} ms\n`)
for (const game of SPIELE) {
  for (const P of PROFILE) {
    const l = alle.filter((r) => r.game === game && r.profil === P.name && !r.fehler)
    if (!l.length) continue
    const d = l.map((r) => r.dauerS)
    const zeile = {
      laeufe: l.length,
      dauerMedianS: median(d),
      dauerP25_P75: `${q(d, 0.25)}–${q(d, 0.75)}`,
      unter5s: l.filter((r) => r.dauerS < 5).length,
      unter15s: l.filter((r) => r.dauerS < 15).length,
      ueber30s: l.filter((r) => r.dauerS >= 30).length,
      punkteMedian: median(l.map((r) => r.punkte)),
      restartMedianMs: median(l.slice(1).map((r) => r.restartMs)),
      crashBisErgebnisMs: median(l.map((r) => r.crashBisErgebnisMs)),
      crashBisNochmalMs: median(l.map((r) => r.crashBisNochmalMs)),
      gedeckelt: l.filter((r) => r.gedeckelt).length,
    }
    if (game === 'kuechen_stack') {
      zeile.moduleMedian = median(l.map((r) => r.module))
      zeile.totInErsten5 = l.filter((r) => r.module <= 5).length
      zeile.perfektQuote = `${Math.round((100 * l.reduce((a, r) => a + r.perfekte, 0)) / Math.max(1, l.reduce((a, r) => a + r.module, 0)))} %`
      zeile.maxFaktor = Math.max(...l.map((r) => r.maxFaktor))
    } else {
      zeile.spruengeMedian = median(l.map((r) => r.spruenge))
      zeile.knappDrueberGesamt = l.reduce((a, r) => a + r.knappDrueber, 0)
      zeile.crashOhneSichtkontakt = l.filter((r) => !r.gedeckelt && !(r.crashSichtbar && r.crashSichtbar.tiefeH > 0)).length
      zeile.tempoMax = Math.max(...l.map((r) => r.tempoMax))
      zeile.gagMeldungen = l.reduce((a, r) => a + r.gags.filter((g) => !/DOPPEL/.test(g)).length, 0)
    }
    console.log(game.padEnd(14), P.name.padEnd(10), JSON.stringify(zeile))
  }
}
