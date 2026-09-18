/**
 * Vorschaubilder fuer die Spielkarten — aus dem echten Spiel, nicht gemalt.
 *
 * Das Skript startet jedes Game im gebauten dist, spielt ein paar Sekunden mit
 * Fingertipps mit, fotografiert danach ausschliesslich das Spielfeld
 * (.trm-feld-spiel) und legt aus jeder Aufnahme ein kartengrosses WebP in
 * src/assets/images/spiele ab. Kein Kopf, keine Leiste, kein Rahmen, keine
 * Schalter der Huelle — nur die Szene.
 *
 * Warum ueberhaupt aufnehmen: auf der Auswahlkarte stand vorher nur ein Name.
 * Ein gemaltes Symbolbild haette dasselbe Problem gehabt, nur bunter — wer
 * die Karte sieht, soll das Spielfeld sehen, das er gleich bekommt.
 *
 * Voraussetzung:
 *   npm run build
 *   node scripts/serve-dist.mjs 4321
 *
 * Aufruf:
 *   node scripts/terminal-vorschaubilder.mjs [port] [zielordner] [nur-ein-spiel]
 *
 * Der dritte Wert nimmt nur ein einzelnes Spiel neu auf. Ein Durchlauf spielt
 * sechs Runden; wer nur einen Zuschnitt nachbessert, braucht die anderen fuenf
 * nicht — und riskiert nicht, ein gutes Bild durch eine schlechtere Runde zu
 * ersetzen (die Spiele wuerfeln, zweimal dieselbe Szene gibt es nicht).
 */
import puppeteer from 'puppeteer-core'
import sharp from 'sharp'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HIER = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.argv[2] || '4321'
const NUR = process.argv[4] || ''
const ZIEL = process.argv[3] || path.join(HIER, '..', 'src', 'assets', 'images', 'spiele')
/* Die Rohaufnahmen sind Zwischenstand. Sie liegen neben dem Ziel, damit man
   einen misslungenen Zuschnitt nachsehen kann, ohne neu zu spielen. */
const ROH = path.join(ZIEL, 'roh')
const BASIS = `http://127.0.0.1:${PORT}`

/* Kartenformat: quer, 1,3:1. Hochkant waere die Karte sofort zu hoch. */
const AUS_B = 312
const AUS_H = 240
const VERHAELTNIS = AUS_B / AUS_H

const CHROME = [
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find((p) => p && existsSync(p))
if (!CHROME) { console.error('Kein Chrome gefunden.'); process.exit(1) }
mkdirSync(ZIEL, { recursive: true })
mkdirSync(ROH, { recursive: true })

const warte = (ms) => new Promise((r) => setTimeout(r, ms))

/* Welches Spiel wie lange laeuft und wie oft dabei getippt wird. Die Zahlen
   sind erspielt: zu frueh ist das Feld leer, zu spaet steht Game Over drin.

   `oben` ist der Zuschnitt: die Aufnahme ist hochkant (960 x 1755), die Karte
   ist quer. Wo im Bild das Spiel steht, ist je Spiel verschieden — mittig zu
   schneiden traf bei Merge und Fit nur leeres Feld. `links`/`breite` setzt
   nur, wer einen engeren Ausschnitt braucht. */
const SPIELE = [
  { key: 'leitungsfinder', raster: 6, takt: 280, dauer: 700, oben: 280 },
  { key: 'kuechen_merge', tipps: 14, takt: 420, dauer: 900, oben: 1000 },
  { key: 'kuechen_crush', tipps: 0, dauer: 1600, oben: 420 },
  { key: 'videko_jump', tipps: 0, dauer: 4400, halten: true, oben: 430 },
  { key: 'kuechen_fit', abwuerfe: 6, takt: 360, dauer: 700, oben: 790 },
  { key: 'videko_slam', tipps: 16, takt: 360, dauer: 800, oben: 250 },
]

function antwort(b) {
  switch (b.aktion) {
    case 'zustand':
      return {
        ok: true,
        aktiviert: 3,
        einstellungen: {
          ziehungAm: new Date(Date.now() + 3 * 86400000).toISOString(),
          gezogen: null, followerZahl: 800, meilensteinGewinne: {},
          spieleAktiv: { videko_slam: true },
        },
        teilnehmer: { deckel: 4999, instagram: 'vorschau', aktiviertAm: new Date().toISOString(), leaderboardOk: true },
        spiele: { beste: {}, gesamt: null, platz: null, gelistet: false },
        koenig: { instagram: 'tresorkoenig', punkte: 42840 },
      }
    case 'spiel-start':
      return { ok: true, ticket: 'ticket-vorschau', dauerMs: 540000 }
    case 'spiel-ende':
      return { ok: true, gespeichert: false, gewertet: false, punkte: 0, beste: {}, rang: null }
    case 'rangliste':
      return { ok: true, spieleAktiv: {}, listen: {} }
    default:
      return { ok: true }
  }
}

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const seite = await browser.newPage()
await seite.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
await seite.setRequestInterception(true)
seite.on('request', (a) => {
  if (a.url().includes('/api/terminal')) {
    let b = {}
    try { b = JSON.parse(a.postData() || '{}') } catch { b = {} }
    a.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(antwort(b)) })
    return
  }
  a.continue()
})
seite.on('pageerror', (e) => console.log('PAGEERROR', e.message))

async function anmelden() {
  await seite.goto(`${BASIS}/terminal/teilnahmebedingungen`, { waitUntil: 'domcontentloaded' })
  await seite.evaluate(() => {
    localStorage.clear(); sessionStorage.clear()
    localStorage.setItem('videko.terminal.sitzung', 'sitzung-beleg')
    localStorage.setItem('videko.terminal.zugang', 'zugang-beleg')
    localStorage.setItem('videko.terminal.tresor', '1')
    sessionStorage.setItem('videko.terminal.intro', '1')
    /* Ton aus: die Vorschau soll nichts abspielen. */
    localStorage.setItem('trm-ton', '0')
  })
  await seite.goto(`${BASIS}/terminal`, { waitUntil: 'networkidle0' })
  await warte(700)
}

async function vorbei(key) {
  return seite.$eval(`#${key}`, (e) => /DEIN SCORE|DEIN ERGEBNIS/i.test(e.innerText)).catch(() => false)
}

async function feldMasse(key) {
  return seite.$eval(`#${key} .trm-feld-spiel`, (e) => {
    const r = e.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  }).catch(() => null)
}

async function aufnehmen(s) {
  await anmelden()
  const offen = await seite.$eval(`[data-spielwahl="${s.key}"]`, (b) => {
    b.scrollIntoView({ block: 'center' }); b.click(); return true
  }).catch(() => false)
  if (!offen) { console.log(`${s.key}: keine Auswahlkarte`); return 'fehlt' }
  const da = await seite.waitForSelector(`#${s.key}.trm-spiel`, { timeout: 9000 }).then(() => true).catch(() => false)
  if (!da) { console.log(`${s.key}: nicht nachgeladen`); return 'fehlt' }
  await seite.$eval(`#${s.key}`, (e) => e.scrollIntoView({ block: 'start' })).catch(() => null)
  await warte(200)
  await seite.$eval(`#${s.key} .trm-spiel__kopf .trm-cta`, (b) => b.click()).catch(() => null)
  await warte(700)

  /* Leitungsfinder: das Raster ist bis zum ersten Tipp geschlossen und
     damit als Vorschau nichtssagend. Also wird gebohrt — quer verteilt,
     damit sich moeglichst viel oeffnet. */
  for (let i = 0; i < (s.raster || 0); i += 1) {
    await seite.$eval(`#${s.key}`, (e) => e.scrollIntoView({ block: 'start' })).catch(() => null)
    const m = await feldMasse(s.key)
    if (!m) break
    const sp = i % 6, ze = Math.floor(i / 6)
    const x = m.x + m.w * (0.12 + 0.15 * sp)
    const y = Math.min(m.y + m.h * (0.30 + 0.16 * ze), 820)
    await seite.touchscreen.tap(x, y).catch(() => null)
    await warte(s.takt || 260)
    if (await vorbei(s.key)) break
  }

  /* Fit: seitlich schieben tut das Feld, fallen laesst nur die Taste. */
  for (let i = 0; i < (s.abwuerfe || 0); i += 1) {
    await seite.$eval(`#${s.key}`, (e) => e.scrollIntoView({ block: 'start' })).catch(() => null)
    const m = await feldMasse(s.key)
    if (!m) break
    await seite.touchscreen.tap(m.x + m.w * (0.15 + 0.7 * ((i * 0.41) % 1)), Math.min(m.y + m.h * 0.45, 820)).catch(() => null)
    await warte(160)
    /* Die Taste hoert auf `pointerdown`, nicht auf `click` — also ein
       echter Tipp auf ihre Mitte, kein ausgeloester Klick. */
    const t = await seite.$eval(`#${s.key} .trm-fit-drop`, (b) => {
      const r = b.getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
    }).catch(() => null)
    if (t && t.y < 844) await seite.touchscreen.tap(t.x, t.y).catch(() => null)
    await warte(s.takt || 420)
    if (await vorbei(s.key)) break
  }

  /* Mitspielen. Getippt wird im Spielfeld, nie darueber oder daneben. */
  for (let i = 0; i < (s.tipps || 0); i += 1) {
    await seite.$eval(`#${s.key}`, (e) => e.scrollIntoView({ block: 'start' })).catch(() => null)
    const m = await feldMasse(s.key)
    if (!m) break
    const x = m.x + m.w * (0.18 + 0.64 * ((i * 0.37) % 1))
    const y = Math.min(m.y + m.h * 0.5, 820)
    await seite.touchscreen.tap(x, y).catch(() => null)
    await warte(s.takt || 450)
    if (await vorbei(s.key)) break
  }
  if (s.halten) {
    /* Jump: kurz nach rechts steuern, damit die Figur wirklich klettert. */
    for (let i = 0; i < 6; i += 1) {
      await seite.$eval(`#${s.key}`, (e) => e.scrollIntoView({ block: 'start' })).catch(() => null)
      const m = await feldMasse(s.key)
      if (!m) break
      const y = Math.min(m.y + m.h * 0.72, 820)
      await seite.touchscreen.tap(m.x + m.w * (i % 2 ? 0.2 : 0.8), y).catch(() => null)
      await warte(380)
    }
  }
  await warte(s.dauer || 800)

  await seite.$eval(`#${s.key}`, (e) => e.scrollIntoView({ block: 'start' })).catch(() => null)
  await warte(250)
  const m = await feldMasse(s.key)
  if (!m || m.h < 120) { console.log(`${s.key}: Feld nicht messbar`, JSON.stringify(m)); return 'fehler' }
  /* Die Tasten der Shell gehoeren zur Huelle, nicht zum Spiel. Auf einem
     Vorschaubild waeren sie nur Beiwerk, das in der Karte niemand bedienen
     kann — also aus dem Bild. */
  await seite.$eval(`#${s.key} .trm-shell`, (e) => { e.style.visibility = 'hidden' }).catch(() => null)
  await warte(80)
  if (await vorbei(s.key)) return 'vorbei'
  await seite.screenshot({
    path: path.join(ROH, `${s.key}.png`),
    clip: { x: m.x, y: m.y, width: m.w, height: Math.min(m.h, 844 - m.y) },
  })
  console.log(`${s.key}: ${Math.round(m.w)}x${Math.round(m.h)}`)
  return 'ok'
}

/**
 * Aus der hochkanten Rohaufnahme wird der Ausschnitt der Karte.
 *
 * Der Ausschnitt nimmt die volle Breite der Aufnahme (ausser bei Jump) und
 * davon so viel Hoehe, wie das Kartenformat hergibt. Erst danach wird
 * verkleinert — umgekehrt waere aus dem Spielfeld Matsch geworden.
 */
async function zuschneiden(s) {
  const ein = path.join(ROH, `${s.key}.png`)
  if (!existsSync(ein)) return false
  const roh = sharp(ein)
  const masse = await roh.metadata()
  const breite = Math.min(s.breite ?? masse.width, masse.width - (s.links ?? 0))
  const hoehe = Math.min(Math.round(breite / VERHAELTNIS), masse.height - s.oben)
  const info = await roh
    .extract({ left: s.links ?? 0, top: s.oben, width: breite, height: hoehe })
    .resize(AUS_B, AUS_H, { fit: 'fill' })
    .webp({ quality: 78 })
    .toFile(path.join(ZIEL, `${s.key}.webp`))
  console.log(`${s.key}: ${AUS_B}x${AUS_H}, ${Math.round(info.size / 1024)} KB`)
  return true
}

for (const s of SPIELE.filter((s) => !NUR || s.key === NUR)) {
  for (let versuch = 1; versuch <= 5; versuch += 1) {
    const stand = await aufnehmen(s)
    if (stand === 'ok' || stand === 'fehlt') break
    console.log(`${s.key}: Versuch ${versuch} ${stand} — noch einmal`)
  }
}

await browser.close()

for (const s of SPIELE.filter((s) => !NUR || s.key === NUR)) {
  if (!(await zuschneiden(s))) console.log(`${s.key}: keine Aufnahme zum Zuschneiden`)
}
console.log(`fertig -> ${ZIEL}`)
