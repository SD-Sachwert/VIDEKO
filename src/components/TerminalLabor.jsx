import { useEffect, useState } from 'react'
import { LogOut, RotateCcw, Wrench, X } from 'lucide-react'

import {
  SPEICHER_INTRO,
  SPEICHER_SZENE,
  introNochmal,
  probeAktiv,
  probeVerlassen,
  probeZettelLeeren,
  sitzungSchreiben,
  terminalRuf,
} from '../data/terminal-api.js'
import { GAME_OVER_EREIGNIS } from './spiel-lauf.js'
import { TEXTE } from '../data/terminal.js'

/**
 * Das Testlabor auf den Aktionsseiten.
 *
 * Sichtbar nur, wenn in diesem Tab ein gueltiger Testbeleg liegt — und den
 * gibt es ausschliesslich nach einer Anmeldung in /terminal/admin. Ohne
 * Testbeleg gibt diese Komponente null zurueck und steht nirgends im Markup.
 *
 * Zwei Dinge macht sie:
 *
 *   1. Sie sagt unmissverstaendlich, dass gerade nichts Echtes passiert.
 *      Der Streifen oben ist absichtlich nicht in Gold, sondern in dem
 *      warmen Rot, das auf dieser Seite sonst nur Fehlermeldungen tragen —
 *      Testmodus soll nie wie Betrieb aussehen.
 *   2. Sie springt jeden Zustand der Nutzerreise direkt an, statt ihn sich
 *      jedes Mal von vorn erarbeiten zu muessen.
 *
 * Der Sprung laeuft ueber einen Zettel in sessionStorage und ein echtes
 * Neuladen, nicht ueber einen Zustandswechsel im laufenden Bild. Das ist
 * Absicht: nur so sieht man den Zustand so, wie ihn jemand sieht, der genau
 * dort ankommt — samt allem, was das kleine Skript im Dokumentkopf tut.
 *
 * Was hier ausgeloest wird, aendert nie etwas Echtes. Der Server beantwortet
 * jeden Aufruf mit Testbeleg aus api/_terminal-probe.js, und dort schreibt
 * keine einzige Funktion.
 */

/* Zwei der zwoelf Zustaende liegen gar nicht auf /terminal. */
const ZIELE = {
  leaderboard: '/terminal/rangliste',
  ziehung: '/terminal/ziehung',
}

export default function TerminalLabor() {
  /* Erst nach dem ersten Rendern: der Beleg liegt in sessionStorage, und die
     Seiten werden vorgerendert. Waere die Antwort schon im ersten Render da,
     wuerde React die Hydration verwerfen. */
  const [da, setDa] = useState(false)
  const [offen, setOffen] = useState(false)
  const [laeuft, setLaeuft] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDa(probeAktiv())
  }, [])

  if (!da) return null

  const P = TEXTE.probe

  function gehe(ziel) {
    try {
      window.location.assign(ziel)
    } catch {
      /* nichts zu tun */
    }
  }

  function szeneWaehlen(key) {
    if (laeuft) return
    if (key === 'ersteinstieg') {
      zuruecksetzen()
      return
    }
    /* Ausser beim Ersteinstieg soll die Sequenz nicht dazwischenfunken. */
    sitzungSchreiben(SPEICHER_INTRO, '1')
    const ziel = ZIELE[key]
    if (ziel) {
      sitzungSchreiben(SPEICHER_SZENE, null)
      gehe(ziel)
      return
    }
    sitzungSchreiben(SPEICHER_SZENE, key)
    gehe('/terminal')
  }

  /**
   * Die Testsitzung auf null stellen.
   *
   * Der Server gibt einen frischen, nicht aktivierten Beleg zurueck; danach
   * fliegen alle Testzettel dieses Tabs weg und die Seite laedt mit dem
   * Wunsch neu, die Sequenz noch einmal zu sehen. Angefasst wird dabei
   * ausschliesslich der Testmodus — der echte Login dieses Browsers liegt in
   * localStorage und bleibt, wo er ist.
   */
  async function zuruecksetzen() {
    if (laeuft) return
    setLaeuft(true)
    await terminalRuf({ aktion: 'probe-reset' })
    probeZettelLeeren()
    introNochmal('/terminal')
  }

  /** Testmodus verlassen: Beleg weg, Testzettel weg, normale Seite. */
  function verlassen() {
    if (laeuft) return
    setLaeuft(true)
    probeVerlassen()
    gehe('/terminal')
  }

  return (
    <>
      <div className="trm-probe" title={P.markeTitel}>
        <span className="trm-probe__marke">{P.marke}</span>
        <button
          type="button"
          className="trm-probe__knopf"
          onClick={() => setOffen((v) => !v)}
          aria-expanded={offen}
          aria-controls="trm-probe-blatt"
        >
          <Wrench size={14} aria-hidden="true" />
          <span className="trm-nur-sr">{offen ? P.schliessen : P.knopf}</span>
        </button>
      </div>

      {offen && (
        <div className="trm-probe__blatt" id="trm-probe-blatt" role="dialog" aria-label={P.titel}>
          <div className="trm-probe__kopf">
            <h2 className="trm-probe__titel">{P.titel}</h2>
            <button type="button" className="trm-probe__zu" onClick={() => setOffen(false)}>
              <X size={16} aria-hidden="true" />
              <span className="trm-nur-sr">{P.schliessen}</span>
            </button>
          </div>

          <p className="trm-probe__person">{P.person}</p>
          <p className="trm-probe__hinweis">{P.hinweis}</p>

          <p className="trm-probe__abschnitt">{P.zustandTitel}</p>
          <div className="trm-probe__gitter">
            {P.zustaende.map((z) => (
              <button
                key={z.key}
                type="button"
                className="trm-probe__tat"
                disabled={laeuft}
                onClick={() => szeneWaehlen(z.key)}
              >
                {z.wort}
              </button>
            ))}
          </div>

          {/* Beendet den laufenden Game-Lauf ueber seinen normalen
              Game-Over-Weg: Wertung, Rang und NOCHMAL wie im echten Spiel. */}
          <div className="trm-probe__gitter trm-probe__gitter--unten">
            <button
              type="button"
              className="trm-probe__tat trm-probe__tat--breit"
              data-probe="game-over"
              title={P.gameOverHinweis}
              onClick={() => {
                setOffen(false)
                window.dispatchEvent(new CustomEvent(GAME_OVER_EREIGNIS))
              }}
            >
              {P.gameOver}
            </button>
          </div>

          <div className="trm-probe__gitter trm-probe__gitter--unten">
            <button
              type="button"
              className="trm-probe__tat trm-probe__tat--breit"
              disabled={laeuft}
              onClick={zuruecksetzen}
            >
              <RotateCcw size={14} aria-hidden="true" />
              {P.reset}
            </button>
            <button
              type="button"
              className="trm-probe__tat trm-probe__tat--breit trm-probe__tat--warnung"
              disabled={laeuft}
              onClick={verlassen}
            >
              <LogOut size={14} aria-hidden="true" />
              {P.verlassen}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
