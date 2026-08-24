/**
 * Build-Entry fuer das statische Rendering (SSG).
 *
 * WOZU
 * ----
 * Bis August 2026 wurde nur der <head> vorgerendert. Der Body war auf jeder
 * der 85 URLs derselbe leere `<div id="root"></div>` — kein Text, keine
 * Ueberschrift, kein einziges <a href>. Wer die Seite ohne JavaScript abruft
 * (Vorschau-Bots, Text-Crawler, KI-Fetcher, Leser mit deaktiviertem Script),
 * bekam eine leere Seite. Dieses Modul rendert dieselbe React-App zur
 * Build-Zeit einmal pro Route; scripts/prerender.mjs schreibt das Ergebnis in
 * `#root`, der Browser uebernimmt es per `hydrateRoot` (src/main.jsx).
 *
 * WARUM StaticRouter
 * ------------------
 * Die App bleibt beim deklarativen Router (`<Routes>`/`<Route>`). StaticRouter
 * ist dessen Gegenstueck ohne History-API und braucht nur den Pfad. Ein
 * Wechsel auf den Data Router oder den Framework Mode von React Router waere
 * dafuer nicht noetig — und haette jede Route umgeschrieben.
 *
 * WARUM ReactLenis auch hier
 * --------------------------
 * `<ReactLenis root>` erzeugt kein eigenes DOM-Element (lenis/react reicht bei
 * `root` die children unveraendert durch), stellt aber den Kontext, den
 * Layout.jsx ueber `useLenis()` liest. Es steht hier, damit der Baum exakt
 * derselbe ist wie in src/main.jsx — sonst waere die Hydration nicht deckungs-
 * gleich.
 */
import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import { ReactLenis } from 'lenis/react'

import App from './App.jsx'

/**
 * Spuren des Streaming-Formats. Tauchen sie im Ergebnis auf, ist eine
 * Suspense-Grenze waehrend des Renderns offen geblieben: React liefert dann
 * einen Platzhalter im sichtbaren Markup und den echten Inhalt weiter unten
 * in einem `<div hidden>`, das erst ein Inline-Skript einhaengt. Fuer eine
 * statische Datei ist das wertlos — der Inhalt waere versteckt statt sichtbar.
 */
const STREAMING_SPUR = /<!--\$\?-->|<div hidden id="S:/

/**
 * Von React nach oben gezogene Ressourcen-Tags am Anfang der Ausgabe.
 *
 * React 19 erzeugt fuer jedes <img fetchPriority="high"> automatisch ein
 * `<link rel="preload" as="image">` und legt es normalerweise in den <head>.
 * Hier wird nur ein Ausschnitt der Seite gerendert, es gibt also keinen <head>
 * — React stellt die Tags deshalb dem Markup voran. In `#root` haetten sie
 * nichts zu suchen: Sie wuerden die Hydration aus dem Tritt bringen (React
 * erwartet dort das erste echte Element) und stuenden ausserdem in Konkurrenz
 * zu den bewusst kuratierten Preloads aus routes-meta.js.
 *
 * Sie werden deshalb entfernt. Im Browser setzt React sie beim Hydrieren
 * ohnehin selbst in den <head> — genau wie vor dem Prerendering auch. Das
 * Ladeverhalten bleibt damit unveraendert.
 */
const KOPF_TAGS = /^(?:<(?:link|meta|base)\b[^>]*\/?>|<(?:title|style|script)\b[^>]*>[\s\S]*?<\/(?:title|style|script)>)+/

/** Node-Stream vollstaendig einlesen. */
function streamZuText(stream) {
  return new Promise((resolve, reject) => {
    let text = ''
    stream.setEncoding('utf8')
    stream.on('data', (stueck) => { text += stueck })
    stream.on('end', () => resolve(text))
    stream.on('error', reject)
  })
}

function baum(pfad) {
  return (
    <StrictMode>
      <ReactLenis
        root
        options={{ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 }}
      >
        <StaticRouter location={pfad}>
          <App />
        </StaticRouter>
      </ReactLenis>
    </StrictMode>
  )
}

/**
 * React zerlegt eine fertige Seite normalerweise in Haeppchen: Sobald der
 * Inhalt einer <Suspense>-Grenze groesser ist als `progressiveChunkSize`
 * (Standard 12800 Byte), schreibt es an der Stelle nur einen Platzhalter und
 * haengt den echten Inhalt weiter unten in einem `<div hidden>` an, das ein
 * Inline-Skript spaeter einsetzt (react-dom-server, "outlining"). Beim echten
 * Streaming ist das ein Gewinn — der Browser sieht Kopf und Fussbereich frueher.
 *
 * Fuer den Build ist es genau falsch: Es gibt keinen Stream, nur eine Datei,
 * und in dieser Datei laege der ganze Seiteninhalt in einem versteckten
 * Container. Ohne JavaScript bliebe die Seite leer — also genau der Zustand,
 * den dieses Modul beseitigen soll. Die Schwelle wird deshalb aufgehoben:
 * React schreibt jede Grenze an ihrem Platz aus, das Markup ist ein
 * zusammenhaengender, sichtbarer Block.
 *
 * Der Wert gilt nur hier im Build. Am Verhalten im Browser aendert er nichts.
 */
const OHNE_AUFTEILUNG = { progressiveChunkSize: Number.MAX_SAFE_INTEGER }

/**
 * Rendert eine Route zu vollstaendigem, hydrierbarem Markup.
 *
 * `prerenderToNodeStream` (react-dom/static) wartet — anders als
 * `renderToPipeableStream` — bis alle Daten geladen sind, bevor es aufloest.
 * Damit sind auch die per React.lazy nachgeladenen Seitenmodule aus App.jsx
 * fertig, ohne dass am Router oder am Code-Splitting etwas geaendert werden
 * muesste.
 *
 * @param {string} pfad  z. B. '/' oder '/journal/kuechenplanung-fehler'
 * @returns {Promise<string>} Markup fuer den Inhalt von `<div id="root">`
 */
export async function rendereRoute(pfad) {
  const { prelude } = await prerenderToNodeStream(baum(pfad), OHNE_AUFTEILUNG)
  const markup = await streamZuText(prelude)

  // Sicherung: Sollte React doch einmal aufteilen (z. B. wegen einer
  // "suspensey" Ressource), bricht der Build ab, statt eine Seite mit
  // verstecktem Inhalt auszuliefern.
  if (STREAMING_SPUR.test(markup)) {
    throw new Error(
      'React hat den Inhalt in eine versteckte Suspense-Grenze ausgelagert — ' +
      'er waere im ausgelieferten HTML unsichtbar.',
    )
  }

  return markup.replace(KOPF_TAGS, '')
}
