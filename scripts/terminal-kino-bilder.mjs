/**
 * Bilder der beiden Inszenierungen — zum Ansehen, nicht zum Bestehen.
 *
 * Das Drehbuch laesst sich messen (das tut scripts/terminal-test.mjs), aber ob
 * eine Szene ueberladen wirkt, entscheidet kein Zahlenvergleich. Dieses Skript
 * faehrt beide Sequenzen und legt zu festen Zeitpunkten Bilder ab, damit man
 * sie nebeneinander anschauen kann.
 *
 * Wichtig: ein Bildschirmfoto kostet hier ein halbes Sekundenviertel. Wer die
 * Sequenz in Echtzeit mitlaufen laesst, fotografiert deshalb nicht die Marke,
 * die er anpeilt, sondern irgendetwas dahinter. Darum wird nicht gewartet,
 * sondern angehalten: nach dem Absenden werden alle Animationen pausiert und
 * auf die gewuenschte Millisekunde gesetzt. Pro Marke ein frischer Seitenlauf,
 * damit der Umschalter der Seite nicht dazwischenfunkt.
 *
 * Aufruf:  node scripts/terminal-kino-bilder.mjs <port> <zielordner>
 */

import puppeteer from 'puppeteer-core'
import { existsSync, mkdirSync } from 'node:fs'

const PORT = process.argv[2] || '4178'
const ZIEL = process.argv[3] || 'kino'
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
mkdirSync(ZIEL, { recursive: true })

const CODE = 'BADEENTE'

function antwortFuer(koerper) {
  const b = koerper || {}
  switch (b.aktion) {
    case 'zustand':
      return {
        ok: true,
        aktiviert: 3,
        einstellungen: { ziehungAm: new Date(Date.now() + 86400000 * 3).toISOString(), gezogen: null },
        teilnehmer: null,
        spiele: null,
        koenig: { instagram: 'tresorkoenig', punkte: 42840 },
      }
    case 'code':
      return { ok: true, zugang: b.code === CODE ? 'zugang-beleg' : null }
    default:
      return { __status: 400, ok: false, grund: 'aktion' }
  }
}

const warte = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const seite = await browser.newPage()
await seite.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await seite.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
/* Jeder Lauf faengt bei null an — sonst erinnert sich die Seite an den Zugang
   und ueberspringt genau die Szene, die fotografiert werden soll. */
await seite.evaluateOnNewDocument(() => {
  try {
    localStorage.clear()
  } catch {
    /* egal */
  }
})
await seite.setRequestInterception(true)
seite.on('request', (anfrage) => {
  if (anfrage.url().includes('/api/terminal')) {
    let koerper = {}
    try {
      koerper = JSON.parse(anfrage.postData() || '{}')
    } catch {
      koerper = {}
    }
    const daten = antwortFuer(koerper)
    const status = daten.__status || 200
    delete daten.__status
    anfrage.respond({ status, contentType: 'application/json', body: JSON.stringify(daten) })
    return
  }
  anfrage.continue()
})

seite.on('pageerror', (e) => console.log('PAGEERROR', e.message))
seite.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE', m.text())
})

/* Anhalten und vorspulen. `currentTime` zaehlt die Verzoegerung mit, die Marke
   ist also dieselbe wie im Drehbuch. */
async function haltenBei(ms) {
  await seite.evaluate((t) => {
    for (const a of document.getAnimations()) {
      a.pause()
      a.currentTime = t
    }
  }, ms)
}

async function codeEingeben() {
  await seite.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
  await warte(400)
  const felder = await seite.$$('.trm-code__feld input, input.trm-code__ziffer, .trm-code input')
  await felder[0].click()
  await seite.keyboard.type(CODE, { delay: 8 })
  await seite.$eval('form.trm-code, form', (f) => f.requestSubmit())
  await warte(90)
}

/* Erste Szene. Die Marken sind die des Drehbuchs plus zwei Uebergaenge. */
for (const ms of [150, 450, 900, 1200, 1650, 1850, 2100, 2600, 3200]) {
  await codeEingeben()
  const steht = await seite.evaluate(() => document.querySelector('.trm-buehne')?.className || 'FEHLT')
  if (steht === 'FEHLT') {
    console.log(`Buehne fehlt bei ${ms} ms`)
    continue
  }
  await haltenBei(ms)
  await seite.screenshot({ path: `${ZIEL}/gewaehrt-${String(ms).padStart(4, '0')}.png` })
}

/* Danach: der Zustand Z, wie er stehen bleibt. */
await codeEingeben()
await warte(3600)
await seite.screenshot({ path: `${ZIEL}/gewaehrt-ende.png` })

/* Zweite Szene: der Weg durch das Schluesselloch. Sie laeuft aus dem Zustand
   heraus, den der letzte Lauf gerade erreicht hat. */
for (const ms of [120, 320, 600, 850, 1050, 1250]) {
  if (ms !== 120) {
    await codeEingeben()
    await warte(3600)
  }
  await seite.click('.trm-punkt--schluessel')
  await warte(60)
  await haltenBei(ms)
  await seite.screenshot({ path: `${ZIEL}/schluessel-${String(ms).padStart(4, '0')}.png` })
}

/* Dritte Szene: der Ersteinstieg. Er wird von der Seite selbst getaktet
   (Zeitschalter, Uebergaenge), Anhalten greift hier also nicht. Stattdessen
   pro Marke ein frischer Lauf in Echtzeit; die tatsaechliche Zeit seit dem
   Seitenstart steht im Dateinamen. */
async function frischOhneIntro() {
  await seite.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
  await seite.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
    sessionStorage.setItem('videko.terminal.intro', '1')
  })
}

for (const ms of [120, 300, 650, 950, 1600, 2250, 2480, 2720, 3000, 3500]) {
  await seite.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
  await seite.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
    sessionStorage.setItem('videko.terminal.introWunsch', '1')
  })
  await seite.goto(`${BASIS}/terminal`, { waitUntil: 'domcontentloaded' })
  /* Ein Bildschirmfoto braucht selbst etwas; knapp davor abdruecken. */
  await seite.waitForFunction((t) => performance.now() >= t, { polling: 10, timeout: 8000 }, Math.max(0, ms - 90))
  const echt = Math.round(await seite.evaluate(() => performance.now()))
  await seite.screenshot({ path: `${ZIEL}/intro-${String(ms).padStart(4, '0')}-echt${echt}.png` })
}

/* Vierte Szene: die Truhe vor dem Code antippen. Die Effekte haengen beim
   Tippen neu ein; danach wird angehalten und vorgespult. */
for (const ms of [60, 140, 240, 380, 560]) {
  await frischOhneIntro()
  await seite.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
  await warte(500)
  await seite.$eval('.trm-punkt--truhe', (b) => b.click())
  await warte(40)
  await haltenBei(ms)
  await seite.screenshot({ path: `${ZIEL}/stoss-${String(ms).padStart(4, '0')}.png` })
}

/* Fuenfte Szene: das Schluesselloch ohne Code. */
for (const ms of [300, 900, 1500, 2000, 2800]) {
  await frischOhneIntro()
  await seite.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
  await warte(500)
  await seite.$eval('.trm-punkt--schluessel', (b) => b.click())
  await warte(60)
  await haltenBei(ms)
  await seite.screenshot({ path: `${ZIEL}/blick-${String(ms).padStart(4, '0')}.png` })
}

await browser.close()
console.log(`Bilder liegen in ${ZIEL}`)
