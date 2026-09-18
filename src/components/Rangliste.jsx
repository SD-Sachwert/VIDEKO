import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { GesamtPreise, gesamtrankingZeile } from './Gesamtranking.jsx'
import { Ikon } from './TerminalRahmen.jsx'
import { ranglisteHolen } from '../data/terminal-api.js'
import { SPIELE_LISTE, TEXTE, aktiveSpiele, fuelle, spielKurz, zahl } from '../data/terminal.js'

/**
 * Das oeffentliche Leaderboard — alle Listen in einer Anfrage.
 *
 * Die Einzelspiele und das Gesamtranking kommen in einer einzigen Antwort vom
 * Server. Beim Umschalten der Reiter wird deshalb nichts nachgeladen: das
 * Umschalten soll sich wie Blaettern anfuehlen, nicht wie Warten.
 *
 * Gewonnen wird nur ueber das Gesamtranking (beste vier aus sechs) — die
 * Einzel-Bestenlisten sind Vergleich und Rechengrundlage, sonst nichts. Genau
 * das steht auch unter jeder Einzelliste.
 *
 * WAS HIER NICHT STEHT
 * --------------------
 * Deckelnummern, E-Mail-Adressen, Teilnehmer-IDs. Der Server liefert pro
 * Eintrag nur Platz, Instagram-Name und Punkte — und den Namen ausschliesslich
 * von Leuten, die der oeffentlichen Anzeige zugestimmt haben. Wer nicht
 * zugestimmt hat, erscheint gar nicht; seine Teilnahme an der Aktion ist
 * davon unberuehrt.
 *
 * Der eigene Platz kommt nur mit Sitzungsbeleg zurueck. Ohne Beleg ist die
 * Liste dieselbe, nur ohne Hervorhebung.
 */

const T = TEXTE.r

/* Die Reiter in der Reihenfolge, in der sie stehen sollen. In der Verwaltung
   ausgeblendete Spiele fallen weg; das Gesamtranking bleibt immer stehen. Die
   alte Wertung GESAMT (Truhenknacker + Goldrausch) liefert der Server weiter,
   oeffentlich ist das Gesamtranking aber die einzige spieluebergreifende Liste. */
const REITER = [...SPIELE_LISTE.map((s) => s.key), 'gesamtranking']
const reiterFuer = (schalter, reihenfolge) => [
  ...aktiveSpiele(schalter, reihenfolge).map((s) => s.key),
  'gesamtranking',
]

const MEDAILLEN = ['🥇', '🥈', '🥉']

export default function Rangliste({ sitzung = null, leaderboardOk = true }) {
  const [listen, setListen] = useState(null)
  const [reiter, setReiter] = useState(REITER[0])
  const [fehler, setFehler] = useState(false)
  const [schalter, setSchalter] = useState(null)
  const [reihenfolge, setReihenfolge] = useState(null)

  const holen = useCallback(
    async (signal) => {
      const antwort = await ranglisteHolen(sitzung, signal)
      if (signal?.aborted) return
      if (antwort?.ok && antwort.listen) {
        setListen(antwort.listen)
        setSchalter(antwort.spieleAktiv ?? null)
        setReihenfolge(antwort.spieleReihenfolge ?? null)
        setFehler(false)
      } else {
        setFehler(true)
      }
    },
    [sitzung],
  )

  useEffect(() => {
    const abbruch = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    holen(abbruch.signal)
    return () => abbruch.abort()
  }, [holen])

  const reiterSichtbar = reiterFuer(schalter, reihenfolge)
  const aktuell = reiterSichtbar.includes(reiter) ? reiter : reiterSichtbar[0]
  const liste = listen?.[aktuell] ?? null
  const eintraege = liste?.eintraege ?? []
  const istGr = aktuell === 'gesamtranking'

  return (
    <section className="trm-karte trm-rang" aria-labelledby="trm-rang-titel">
      <div className="trm-karte__kopf">
        <Ikon name="pokal" size={22} className="trm-ikon" />
        <h2 className="trm-karte__titel" id="trm-rang-titel">
          {T.titel}
        </h2>
      </div>
      <p className="trm-karte__sub">{T.sub}</p>

      {/* Reiter. Echte Knoepfe mit `aria-selected`, damit die Tastatur und
          Vorleseprogramme dasselbe sehen wie das Auge. */}
      <div className="trm-reiter" role="tablist" aria-label={T.titel}>
        {reiterSichtbar.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`trm-reiter-${key}`}
            aria-selected={aktuell === key}
            aria-controls="trm-rang-liste"
            className="trm-reiter__taste"
            onClick={() => setReiter(key)}
          >
            {T.tabs[key]}
          </button>
        ))}
      </div>

      <div className="trm-rang__feld" id="trm-rang-liste" role="tabpanel" aria-live="polite">
        {listen == null && !fehler && <p className="trm-metrik__text">{T.laedt}</p>}

        {istGr && liste != null && (
          <div className="trm-gr__kopf" data-gr-reiter="1">
            <p className="trm-grliste__beste">{T.grBeste}</p>
            <p className="trm-karte__sub">{T.grSub}</p>
            <p className="trm-feld__hilfe">{T.grNochHilfe}</p>
            {liste.abgeschlossen && <p className="trm-gr__hinweis">{T.grAbgeschlossen}</p>}
            <GesamtPreise preise={liste.preise} />
          </div>
        )}
        {fehler && <p className="trm-meldung trm-meldung--fehler">{T.fehler}</p>}

        {/* Kein Eintrag heisst nicht: kaputt. Vor dem Start der Aktion ist
            die Liste zwangslaeufig leer — dann steht hier eine Einladung
            statt einer leeren Tabelle. Sobald der erste Lauf gewertet ist,
            verschwindet der Block von allein. */}
        {listen != null && eintraege.length === 0 && (
          <div className="trm-thron">
            <Ikon name="krone" size={30} className="trm-thron__krone" />
            <p className="trm-thron__titel">{T.thronTitel}</p>
            <p className="trm-thron__text">{T.thronText}</p>
            <Link className="trm-cta trm-cta--klein trm-thron__taste" to="/terminal">
              <Ikon name="spiel" size={16} />
              {T.thronTaste}
            </Link>
          </div>
        )}

        {eintraege.length > 0 && (
          <ol className="trm-rang__liste">
            {eintraege.map((e) => (
              <li
                className="trm-rang__zeile"
                key={`${aktuell}-${e.platz}-${e.instagram}`}
                data-ich={e.ich ? '1' : '0'}
              >
                <span className="trm-rang__platz" aria-hidden="true">
                  {MEDAILLEN[e.platz - 1] ?? e.platz}
                </span>
                <span className="trm-nur-sr">Platz {e.platz}</span>
                {/* Nur im Gesamtranking: wer nicht zugestimmt hat, steht mit
                    seinem echten Platz, aber ohne Namen da — sonst saehen die
                    Preisplaetze falsch aus. */}
                <span
                  className="trm-rang__name"
                  data-anonym={e.instagram ? undefined : '1'}
                  /* Zwei Zeilen statt einer, sobald die gewerteten Spiele
                     darunter stehen — sonst schneidet die Ellipse sie weg. */
                  data-zweizeilig={istGr && e.gewertet?.length ? '1' : undefined}
                >
                  {e.instagram ? `@${e.instagram}` : T.grAnonym}
                  {/* Nur im Gesamtranking: welche vier Ergebnisse gezaehlt
                      haben. Welche das sind, hat der Server bestimmt. */}
                  {istGr && Array.isArray(e.gewertet) && e.gewertet.length > 0 && (
                    <span className="trm-grliste__spiele" title={T.grGewerteteSpiele}>
                      {e.gewertet.map(spielKurz).join(' · ')}
                    </span>
                  )}
                </span>
                <span className="trm-rang__punkte">{zahl(e.punkte)}</span>
              </li>
            ))}
          </ol>
        )}

        {/* Der eigene Stand. Steht unter der Liste, damit Platz 47 nicht in
            Platz 1 bis 20 hineinrutscht. */}
        {istGr && liste?.eigen && sitzung ? (
          <p className="trm-rang__eigen" data-gr-eigen="1">
            {gesamtrankingZeile(liste.eigen)}
          </p>
        ) : null}

        {!istGr && liste != null && sitzung ? (
          <p className="trm-rang__eigen">
            {liste.eigenerPlatz
              ? fuelle(T.deinPlatz, { platz: liste.eigenerPlatz })
              : leaderboardOk
                ? T.ohnePlatz
                : T.ohneEinwilligung}
            {liste.eigenerPlatz && liste.eigenePunkte != null
              ? ` — ${zahl(liste.eigenePunkte)}`
              : ''}
          </p>
        ) : null}

        {/* Unter jeder Einzelliste: aus ihr folgt kein Gewinn. Gewonnen wird
            nur ueber das Gesamtranking, Plaetze 1 bis 3. */}
        {!istGr && (
          <p className="trm-feld__hilfe" data-gr-einzel="1">
            {T.grEinzelHinweis}
          </p>
        )}
      </div>

      {istGr && <p className="trm-feld__hilfe" data-gr-formel="1">{T.grFormel}</p>}
      <p className="trm-fuss-notiz">{T.hinweis}</p>
    </section>
  )
}
