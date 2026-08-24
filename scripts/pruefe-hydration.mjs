/**
 * Browserpruefung fuer das statische Prerendering.
 *
 * Ein gruener Build und sauberes HTML sagen nichts darueber aus, ob React das
 * vorgerenderte Markup im Browser auch uebernimmt. Passt der erste Client-
 * Render nicht exakt zum ausgelieferten HTML, verwirft React den Teilbaum,
 * baut ihn neu auf — und die Seite flackert, obwohl in dist/ alles richtig
 * steht. Dieses Skript prueft deshalb mit einem echten Chrome:
 *
 *   1. keine Konsolenfehler und keine React-Warnungen (u. a. "Hydration failed",
 *      "did not match", "Text content does not match")
 *   2. das ausgelieferte DOM ueberlebt die Hydration — der erste Kindknoten von
 *      #root ist danach noch derselbe Knoten (React haette ihn sonst ersetzt)
 *   3. der sichtbare Text bleibt beim Hydrieren erhalten (kein Leerblitzen)
 *   4. die interaktiven Teile laufen: Lenis, Framer Motion, Router-Navigation,
 *      Anfrageliste, Formularfelder, Lazy-Bilder/-Videos, Three.js auf
 *      /experience
 *
 * Aufruf:  npm run pruefe:hydration      (setzt "npm run build" voraus)
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')

/** Chrome oder Edge aus der lokalen Installation — kein Download. */
const KANDIDATEN = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)
const browserPfad = KANDIDATEN.find((p) => { try { return fs.existsSync(p) } catch { return false } })
if (!browserPfad) {
  console.error('✖ Kein Chrome/Edge gefunden. Pfad ueber CHROME_PATH setzen.')
  process.exit(1)
}

/* ------------------------------------------------------------------ */
/* Server wie in scripts/pruefe-ssg.mjs                                */
/* ------------------------------------------------------------------ */

const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.glb': 'model/gltf-binary',
  '.hdr': 'application/octet-stream', '.ktx2': 'image/ktx2',
}

function loese(pfad) {
  const rein = decodeURIComponent(pfad.split('?')[0])
  if (rein.includes('..')) return null
  const direkt = path.join(DIST, rein)
  if (fs.existsSync(direkt) && fs.statSync(direkt).isFile()) return direkt
  const index = path.join(direkt, 'index.html')
  if (fs.existsSync(index)) return index
  return null
}

const server = http.createServer((req, res) => {
  const datei = loese(req.url)
  if (datei) {
    res.writeHead(200, { 'content-type': TYPEN[path.extname(datei)] || 'application/octet-stream' })
    res.end(fs.readFileSync(datei))
    return
  }
  const not = path.join(DIST, '404.html')
  res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
  res.end(fs.existsSync(not) ? fs.readFileSync(not) : 'not found')
})
const port = await new Promise((r) => server.listen(0, '127.0.0.1', () => r(server.address().port)))
const basis = `http://127.0.0.1:${port}`

/* ------------------------------------------------------------------ */
/* Referenzrouten                                                      */
/* ------------------------------------------------------------------ */

const ROUTEN = [
  { pfad: '/', was: 'Startseite, Hero-Video/Bild, Teaser' },
  { pfad: '/studio', was: 'Studio' },
  { pfad: '/planung', was: 'Planung' },
  { pfad: '/leistungen', was: 'Leistungen' },
  { pfad: '/inspiration', was: 'Inspiration, Kuechensuenden-Interaktion' },
  { pfad: '/stylefinder', was: 'Stylefinder' },
  { pfad: '/journal/licht-in-der-kueche', was: 'Journalartikel' },
  { pfad: '/merch', was: 'Merch-Uebersicht' },
  { pfad: '/merch/cap-black', was: 'Produktseite, Anfrageliste' },
  { pfad: '/beratung', was: 'Beratungsformular' },
  { pfad: '/team', was: 'Team' },
  { pfad: '/experience', was: 'Three.js (bewusst ohne Body-Prerender)', ohneKoerper: true },
]

/** Meldungen, die nichts mit der Hydration zu tun haben. */
const IGNORIEREN = [
  /Failed to load resource: the server responded with a status of 404/i, // fehlende Favicon-Varianten o. ae.
  /Download the React DevTools/i,
]

const HYDRATIONS_SPUR = /hydrat|did not match|server (?:html|rendered)|text content does not match|Expected server HTML/i

const browser = await puppeteer.launch({
  executablePath: browserPfad,
  headless: 'shell',
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})

const berichte = []

for (const r of ROUTEN) {
  const seite = await browser.newPage()
  await seite.setViewport({ width: 1440, height: 900 })
  const meldungen = []
  seite.on('console', (m) => {
    const t = m.text()
    if (['error', 'warning'].includes(m.type()) && !IGNORIEREN.some((re) => re.test(t))) {
      meldungen.push({ art: m.type(), text: t })
    }
  })
  seite.on('pageerror', (e) => meldungen.push({ art: 'exception', text: e.message }))

  // Vor dem Ausfuehren von JavaScript den Ist-Zustand des HTML festhalten und
  // den ersten Kindknoten von #root markieren. Ersetzt React ihn beim
  // Hydrieren, ist die Markierung danach weg.
  await seite.evaluateOnNewDocument(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const wurzel = document.getElementById('root')
      const erstes = wurzel && wurzel.firstElementChild
      window.__vorher = {
        html: wurzel ? wurzel.innerHTML.length : 0,
        text: document.body.innerText.replace(/\s+/g, ' ').trim().length,
        kinder: wurzel ? wurzel.children.length : 0,
      }
      if (erstes) erstes.setAttribute('data-ssg-marke', '1')
    }, { once: true })
  })

  await seite.goto(basis + r.pfad, { waitUntil: 'networkidle2', timeout: 60000 })
  // React hydriert in einem eigenen Task; zwei Frames abwarten.
  await seite.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res))))

  const zustand = await seite.evaluate(() => {
    const wurzel = document.getElementById('root')
    const erstes = wurzel && wurzel.firstElementChild
    return {
      vorher: window.__vorher || null,
      markeUeberlebt: !!(erstes && erstes.getAttribute('data-ssg-marke') === '1'),
      nachherText: document.body.innerText.replace(/\s+/g, ' ').trim().length,
      lenis: document.documentElement.classList.contains('lenis'),
      links: document.querySelectorAll('a[href^="/"]').length,
      motion: document.querySelectorAll('[style*="transform"], [style*="opacity"]').length,
      bilder: {
        gesamt: document.images.length,
        geladen: [...document.images].filter((i) => i.complete && i.naturalWidth > 0).length,
      },
      videos: document.querySelectorAll('video').length,
      canvas: document.querySelectorAll('canvas').length,
      felder: document.querySelectorAll('input, textarea, select').length,
      h1: (document.querySelector('h1')?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60),
    }
  })

  // Router-Navigation: einen internen Link klicken und pruefen, dass die URL
  // wechselt, ohne dass die Seite neu laedt.
  let navigation = 'nicht geprueft'
  try {
    const ziel = await seite.evaluate(() => {
      const a = [...document.querySelectorAll('a[href^="/"]')]
        .find((x) => x.getAttribute('href') !== location.pathname && !x.getAttribute('target'))
      if (!a) return null
      window.__keinReload = true
      a.click()
      return a.getAttribute('href')
    })
    if (ziel) {
      await seite.waitForFunction(
        (z) => location.pathname === z.split('#')[0],
        { timeout: 8000 }, ziel,
      )
      const ohneReload = await seite.evaluate(() => window.__keinReload === true)
      navigation = ohneReload ? `ok → ${ziel}` : `Vollreload nach ${ziel}`
    } else {
      navigation = 'kein Link gefunden'
    }
  } catch (e) {
    navigation = `fehlgeschlagen: ${String(e.message).split('\n')[0]}`
  }

  const hydrationsMeldungen = meldungen.filter((m) => HYDRATIONS_SPUR.test(m.text))

  berichte.push({ ...r, zustand, navigation, meldungen, hydrationsMeldungen })
  await seite.close()
}

/* Anfrageliste: Produkt merken, Zaehler pruefen. Nicht jedes Produkt ist
   bestellbar ("Produktvorschau"), deshalb der Reihe nach probieren. */
let anfrage = 'kein anfragbares Produkt gefunden'
for (const slug of ['signature-t-shirt-black', 'pure-hoodie-beige', 'cap-black', 'tasse-black']) {
  try {
    const seite = await browser.newPage()
    await seite.setViewport({ width: 1440, height: 900 })
    await seite.goto(`${basis}/merch/${slug}`, { waitUntil: 'networkidle2', timeout: 60000 })
    const geklickt = await seite.evaluate(() => {
      const b = [...document.querySelectorAll('button')]
        .find((x) => /in den warenkorb|anfrageliste|hinzuf/i.test(x.innerText))
      if (!b) return false
      b.click()
      return true
    })
    if (geklickt) {
      await seite.evaluate(() => new Promise((r) => setTimeout(r, 500)))
      const gespeichert = await seite.evaluate(() => {
        try { return JSON.parse(localStorage.getItem('videko-anfrageliste') || '[]').length } catch { return -1 }
      })
      anfrage = gespeichert > 0
        ? `ok — /merch/${slug}: ${gespeichert} Position im localStorage`
        : `/merch/${slug}: Button geklickt, aber nichts gespeichert (${gespeichert})`
      await seite.close()
      break
    }
    await seite.close()
  } catch (e) {
    anfrage = `fehlgeschlagen: ${String(e.message).split('\n')[0]}`
    break
  }
}

/* ------------------------------------------------------------------ */
/* Optischer Vergleich vorher/nachher                                  */
/* ------------------------------------------------------------------ */
/*
 * "Vorher" ist der Zustand ohne Prerendering: React baute #root komplett neu
 * auf (createRoot). Genau das laesst sich nachstellen, indem #root vor dem
 * Ausfuehren der Bundles geleert wird — src/main.jsx faellt dann auf
 * createRoot zurueck. Verglichen wird das Ergebnis, nachdem sich beide Wege
 * beruhigt haben: Kommt derselbe DOM und dieselbe Seitenhoehe heraus, ist das
 * Erscheinungsbild unveraendert. Zusaetzlich landen Screenshots in
 * `pruefung/` zum Nachsehen.
 */
const SHOTS = path.join(ROOT, 'pruefung')
fs.mkdirSync(SHOTS, { recursive: true })

async function aufnehmen(pfad, leeren, datei) {
  const seite = await browser.newPage()
  await seite.setViewport({ width: 1440, height: 900 })
  if (leeren) {
    await seite.evaluateOnNewDocument(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const w = document.getElementById('root')
        if (w) w.innerHTML = ''
      }, { once: true })
    })
  }
  await seite.goto(basis + pfad, { waitUntil: 'networkidle2', timeout: 60000 })
  await seite.evaluate(() => new Promise((r) => setTimeout(r, 1500)))
  const daten = await seite.evaluate(() => {
    const w = document.getElementById('root')
    return {
      html: w ? w.innerHTML : '',
      hoehe: document.body.scrollHeight,
      text: document.body.innerText.replace(/\s+/g, ' ').trim(),
    }
  })
  await seite.screenshot({ path: path.join(SHOTS, datei) })
  await seite.close()
  return daten
}

const optisch = []
for (const pfad of ['/', '/planung', '/journal/licht-in-der-kueche']) {
  const name = pfad === '/' ? 'start' : pfad.replace(/\//g, '-').replace(/^-/, '')
  const vorher = await aufnehmen(pfad, true, `${name}--vorher-csr.png`)
  const nachher = await aufnehmen(pfad, false, `${name}--nachher-ssg.png`)
  optisch.push({
    pfad,
    gleicherText: vorher.text === nachher.text,
    textDiff: Math.abs(vorher.text.length - nachher.text.length),
    hoeheVorher: vorher.hoehe,
    hoeheNachher: nachher.hoehe,
    htmlDiff: Math.abs(vorher.html.length - nachher.html.length),
  })
}

await browser.close()
server.close()

/* ------------------------------------------------------------------ */
/* Ausgabe                                                             */
/* ------------------------------------------------------------------ */

console.log('| Route | Konsole | Hydration | DOM behalten | Text vorher→nachher | Lenis | Links | Bilder | Navigation |')
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |')
for (const b of berichte) {
  const z = b.zustand
  const konsole = b.meldungen.length ? `${b.meldungen.length} Meldung(en)` : 'sauber'
  const hyd = b.hydrationsMeldungen.length ? `${b.hydrationsMeldungen.length} Warnung(en)` : 'ohne Befund'
  const text = `${z.vorher?.text ?? '?'} → ${z.nachherText}`
  const dom = b.ohneKoerper ? 'entfaellt (kein Prerender)' : (z.markeUeberlebt ? 'ja' : 'nein')
  console.log(`| ${b.pfad} | ${konsole} | ${hyd} | ${dom} | ${text} | ${z.lenis ? 'ja' : 'nein'} | ${z.links} | ${z.bilder.geladen}/${z.bilder.gesamt} | ${b.navigation} |`)
}

console.log('')
console.log(`Anfrageliste: ${anfrage}`)
console.log(`Three.js (/experience): ${berichte.find((b) => b.pfad === '/experience')?.zustand.canvas ?? 0} <canvas>`)
console.log(`Formularfelder (/beratung): ${berichte.find((b) => b.pfad === '/beratung')?.zustand.felder ?? 0}`)

const mitMeldung = berichte.filter((b) => b.meldungen.length)
if (mitMeldung.length) {
  console.log('')
  console.log('Konsolenmeldungen im Detail:')
  for (const b of mitMeldung) {
    for (const m of b.meldungen) console.log(`   ${b.pfad} [${m.art}] ${m.text.split('\n')[0].slice(0, 220)}`)
  }
}

console.log('')
console.log('Optischer Vergleich (links: alter CSR-Weg mit geleertem #root, rechts: neuer SSG-Weg)')
console.log('| Route | Text identisch | Zeichen-Differenz | Seitenhoehe vorher | Seitenhoehe nachher | HTML-Differenz |')
console.log('| --- | --- | --- | --- | --- | --- |')
for (const o of optisch) {
  console.log(`| ${o.pfad} | ${o.gleicherText ? 'ja' : 'nein'} | ${o.textDiff} | ${o.hoeheVorher} px | ${o.hoeheNachher} px | ${o.htmlDiff} |`)
}
console.log(`Screenshots: ${path.relative(ROOT, SHOTS)}/`)

const schlecht = berichte.filter((b) => b.hydrationsMeldungen.length || (!b.ohneKoerper && !b.zustand.markeUeberlebt))
console.log('')
console.log(`Geprueft: ${berichte.length} Routen · ohne Hydrationsbefund: ${berichte.length - schlecht.length} · auffaellig: ${schlecht.length}`)
if (schlecht.length) process.exit(1)
