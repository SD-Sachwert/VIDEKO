import { useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Ikon } from './TerminalRahmen.jsx'
import { PracticeKontext, START_EREIGNIS, startWunschNehmen } from './spiel-lauf.js'
import { motivation } from './spiel-motivation.js'
import { useSpielShell } from './spiele/spiel-shell.js'
import { musikAn, musikAus, musikZurueck } from './spiele/spielmusik.js'
import { tonStatus, tonUmschalten } from './spiele/spielgefuehl.js'
import { ANLEITUNGEN, TEXTE, fuelle, zahl } from '../data/terminal.js'

/**
 * Die Huelle um ein Spielfeld — Kopf, Startbildschirm, Ergebnis, Leiste.
 *
 * Alle Spiele sitzen in derselben Karte wie das alte Mini-Spiel: gleiche
 * `trm-karte`, gleiches `trm-feld-spiel`, gleiche goldene Taste. Das Spielfeld
 * selbst kommt als Kinder herein und darf darin tun, was es will.
 *
 * Die Startmeldung und das Ergebnis liegen als Schicht ueber dem Feld, nicht
 * daneben: so springt beim Start kein Layout, und die Karte behaelt auf allen
 * Breiten dieselbe Hoehe.
 *
 * Seit der Game-Shell traegt die Karte ausserdem die Tasten, die jedes Spiel
 * braucht und die vorher jedes Spiel einzeln gebaut hat: Ton, Anleitung,
 * Minimieren, Vollbild, Verlassen. Sie sitzen immer an derselben Stelle, und
 * die Seitensperre (`useSpielShell`) haengt an derselben Huelle — ein Spiel
 * muss sich darum nicht mehr kuemmern.
 *
 * Auch die Musik haengt an der Shell und nicht an einem einzelnen Spiel:
 * ein Stueck fuer alle Runden, dieselbe Stummtaste wie fuer die Effekte, und
 * es faengt nie von selbst an — der erste Ton kommt immer aus einem Klick.
 *
 * MINIMIEREN ist die Antwort auf ein echtes Problem am Handy: ein offenes
 * Spiel sperrt den Seitenscroll, und wer weiterlesen will, muss die Runde
 * wegwerfen. Minimiert klappt die Buehne auf Hoehe null, die Runde steht
 * still (`lauf.pausieren`) und die Seite ist sofort wieder frei. Die Buehne
 * bleibt dabei eingehaengt und behaelt ihre eigene Hoehe — wer sie in einen
 * zusammengeklappten Rahmen steckt, statt sie selbst zu schrumpfen, laesst
 * Canvas und ResizeObserver der Spiele in Ruhe.
 */

const T = TEXTE.g

/* Die Shell-Tasten sitzen mitten im Spielfeld. Was sie nicht weiterreichen
   duerfen, steht hier einmal statt sechsmal im Markup. */
const halt = (e) => e.stopPropagation()
const tastenHalt = (e) => {
  if (e.key === ' ' || e.key === 'Enter') e.stopPropagation()
}

export default function SpielKarte({ spiel, lauf, best, leiste = null, children }) {
  const { phase, laeuft, restSek, punkte, antwort, fehler } = lauf
  const titelId = `trm-spiel-${spiel.key}`
  const nochmalRef = useRef(null)
  /* Practice Mode: ohne Deckel, ohne Wertung. Rang, Bestwerte und Status
     fallen weg; stattdessen fuehrt ein CTA zur Aktivierung. */
  const practiceWeg = useContext(PracticeKontext)
  const practice = lauf.practice === true

  /* Die Huelle: Seitensperre solange gespielt wird, Vollbild auf Wunsch.
     `startet` zaehlt mit — zwischen Tastendruck und erstem Bild soll die
     Seite schon stillstehen. */
  /* Minimiert ist die Seite wieder frei: die Sperre haengt ausdruecklich
     auch an `!klein`, nicht nur an der Phase. */
  const [klein, setKlein] = useState(false)
  const [hilfe, setHilfe] = useState(false)
  const { huelleRef, vollbild, echt, vollbildSetzen } = useSpielShell(
    (laeuft || phase === 'startet') && !klein,
  )
  const [ton, setTon] = useState(() => tonStatus())
  const anleitung = ANLEITUNGEN[spiel.key] ?? null
  /* Nur die Pause, die die Anleitung selbst ausgeloest hat, darf sie auch
     wieder aufheben — sonst laeuft eine minimierte Runde weiter, weil
     jemand zwischendurch die Anleitung zugemacht hat. */
  const hilfePauseRef = useRef(false)

  /* Direktstart aus dem Testlabor: entweder liegt der Wunsch schon beim
     Einhaengen bereit (die Karte wurde gerade erst nachgeladen), oder er
     kommt als Ereignis, waehrend die Karte schon steht. */
  const startenRef = useRef(lauf.starten)
  const phaseRef = useRef(phase)
  useEffect(() => {
    startenRef.current = lauf.starten
    phaseRef.current = phase
  })
  useEffect(() => {
    /* Nachgeladene Karten haengen erst nach dem Sprung des Testlabors ein und
       verschieben die Seite — deshalb richtet sich die Karte selbst aus. */
    const zeigen = () =>
      requestAnimationFrame(() => document.getElementById(spiel.key)?.scrollIntoView({ block: 'start' }))
    if (startWunschNehmen(spiel.key)) {
      startenRef.current()
      zeigen()
    }
    const hoeren = (e) => {
      if (e?.detail === spiel.key && phaseRef.current !== 'laeuft' && phaseRef.current !== 'startet') {
        startWunschNehmen(spiel.key)
        startenRef.current()
        zeigen()
      }
    }
    window.addEventListener(START_EREIGNIS, hoeren)
    return () => window.removeEventListener(START_EREIGNIS, hoeren)
  }, [spiel.key])

  /* START und NOCHMAL sind echte Tipps — genau hier darf die Musik zum
     ersten Mal anfangen. Alles danach haelt der Effekt weiter unten am
     Zustand der Runde fest. */
  const starten = () => {
    musikAn(spiel.key)
    lauf.starten()
  }

  /* Die Musik folgt der Runde: sie laeuft, solange wirklich gespielt wird,
     und steht bei Pause, Anleitung, Minimieren und Stumm. Aus einem Effekt
     heraus darf `musikAn` still scheitern; dann fehlte die Geste. */
  const musikSoll = laeuft && !lauf.pausiert && ton
  useEffect(() => {
    if (musikSoll) musikAn(spiel.key)
    else musikAus()
  }, [musikSoll, spiel.key])

  /* Vor und nach einer Runde faengt das Stueck wieder vorn an. */
  useEffect(() => {
    if (phase === 'ruht' || phase === 'vorbei') musikZurueck()
  }, [phase])
  useEffect(() => () => musikZurueck(), [])

  /* Der Server schickt die eigenen Bestwerte zurueck. Ist der gerade
     gespielte Lauf der beste, sagen wir es — aber nur, wenn er auch
     gewertet wurde. */
  const gewertet = antwort?.ok && antwort.gewertet
  const neuerBest = gewertet && antwort.beste?.[spiel.key] === punkte && punkte > 0

  /* Der eigene Stand in diesem Spiel, direkt aus der Antwort auf den
     abgeschlossenen Lauf. `rang` fehlt, solange der Lauf nicht gewertet
     wurde — dann bleibt der Block einfach weg. Ohne Zustimmung zur Rangliste
     ist `platz` null; auch dann steht hier nichts Falsches. */
  const rang = phase === 'vorbei' && antwort?.ok ? antwort.rang : null
  const heute = phase === 'vorbei' && antwort?.ok ? antwort.heute : null
  const eigenBest = antwort?.ok ? (antwort.beste?.[spiel.key] ?? best) : best
  const ansage =
    phase === 'vorbei' && antwort?.ok && !practice
      ? motivation({ neuerBest, rang, punkte, eigenBest, hebel: spiel.hebel })
      : null

  /* Der Vergleich nach dem Probelauf. Die Seite, die das Probespiel zeigt,
     reicht ueber den Kontext zwei Dinge herein: `onEnde` holt die
     oeffentliche Rangliste — erst nach einer wirklich gespielten Runde, nie
     beim Laden der Seite — und `rangSatz` rechnet daraus den Satz. Fehlt
     beides, bleibt der Practice Mode genau so, wie er vorher war. Gelesen
     wird dabei nur; das Probespiel schreibt nichts. */
  const practiceEnde = practice && phase === 'vorbei'
  const practiceEndeMelden = practiceWeg?.onEnde
  useEffect(() => {
    if (practiceEnde) practiceEndeMelden?.()
  }, [practiceEnde, practiceEndeMelden])
  const probeRang = practiceEnde ? (practiceWeg?.rangSatz?.(punkte) ?? null) : null

  /* NOCHMAL im Ergebnis: bei den Endlosspielen schon waehrend des Speicherns,
     bei den Zeitspielen erst, wenn das Ergebnis da ist. */
  const nochmalMoeglich = phase === 'vorbei' || (phase === 'sendet' && lauf.sofort)

  /* Der Fokus springt auf NOCHMAL — Enter oder Leertaste starten sofort neu,
     ohne dass die Seite dabei scrollt. */
  useEffect(() => {
    if (phase === 'vorbei') nochmalRef.current?.focus({ preventScroll: true })
  }, [phase])

  /* VERLASSEN macht genau zwei Dinge, in dieser Reihenfolge: es holt aus dem
     Vollbild zurueck und beendet eine noch laufende Runde regulaer. Der
     erreichte Punktestand wird dabei ganz normal abgegeben — Aufhoeren ist
     kein Betrug und darf keinen Lauf verschlucken. */
  const verlassen = () => {
    if (vollbild) vollbildSetzen(false)
    if (laeuft) lauf.fertig()
  }

  /* MINIMIEREN: erst aus dem Vollbild, dann die Runde anhalten, dann die
     Buehne zuklappen. Die Reihenfolge ist wichtig — die Uhr soll stehen,
     bevor irgendetwas am Layout passiert. */
  const minimieren = () => {
    if (vollbild) vollbildSetzen(false)
    if (hilfe) setHilfe(false)
    hilfePauseRef.current = false
    lauf.pausieren?.()
    setKlein(true)
  }

  const weiterspielen = () => {
    setKlein(false)
    lauf.weiter?.()
    musikAn(spiel.key)
  }

  /* BEENDEN gibt den Lauf ganz normal ab. Die Pause wird vorher aufgeloest,
     damit die gestandene Zeit sauber verrechnet ist, bevor der Endstand
     entsteht. */
  const pauseBeenden = () => {
    setKlein(false)
    lauf.weiter?.()
    lauf.fertig()
  }

  /* Wer die Anleitung aufmacht, spielt in dieser Zeit nicht. Also steht die
     Runde auch dann still — und laeuft beim Zumachen genau dort weiter. */
  const hilfeAuf = () => {
    if (laeuft && !lauf.pausiert) {
      hilfePauseRef.current = true
      lauf.pausieren?.()
    }
    setHilfe(true)
  }

  const hilfeZu = () => {
    setHilfe(false)
    if (!hilfePauseRef.current) return
    hilfePauseRef.current = false
    lauf.weiter?.()
    musikAn(spiel.key)
  }

  const huelleKlasse = [
    'trm-karte',
    'trm-spiel',
    vollbild ? 'trm-spiel--vollbild' : '',
    echt ? 'trm-spiel--vollbild-echt' : '',
    klein ? 'trm-spiel--klein' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={huelleKlasse} id={spiel.key} aria-labelledby={titelId} ref={huelleRef}>
      <div className="trm-spiel__kopf">
        <Ikon name={spiel.icon} size={26} className="trm-ikon" />
        <div className="trm-spiel__text">
          <h2 className="trm-karte__titel" id={titelId}>
            {spiel.titel}
          </h2>
          <p className="trm-spiel__zeile">{spiel.zeile}</p>
        </div>
        {/* Die Endlosspiele (lauf.sofort) duerfen schon waehrend des
            Speicherns neu starten: der alte Lauf wird trotzdem abgegeben.

            Sobald das Ergebnis steht, uebernimmt NOCHMAL im Ergebnisblock
            den Neustart. Dieser Knopf verschwindet dann - zwei Knoepfe mit
            derselben Wirkung uebereinander sind keine Auswahl, sondern nur
            eine Frage mehr. Uebrig bleibt die klare Staffel: NOCHMAL, und
            daneben der Weg, der den Lauf zaehlen laesst. */}
        {!laeuft && !nochmalMoeglich && (phase !== 'sendet' || lauf.sofort) && (
          <button
            type="button"
            className="trm-cta trm-cta--klein"
            onClick={starten}
            disabled={phase === 'startet'}
          >
            {T.start}
          </button>
        )}
      </div>

      {/* Der Rahmen um die Buehne. Nur er klappt zu; die Buehne darin behaelt
          ihre Hoehe, damit kein Spiel sich auf 0 × 0 neu vermisst. */}
      <div className="trm-spiel__buehne" data-klein={klein ? '' : undefined} inert={klein || undefined}>
        {/* Die Tasten der Shell. Sie stehen in einer eigenen Zeile ueber
            dem Feld, nicht mehr darin: nebeneinander sind es 194 px, und bei
            390 px Bildschirmbreite lag darunter genau die Kopfzeile, die
            jedes Spiel selbst dort zeichnet — beim Leitungsfinder der
            Schalter MARKIEREN, der so gar nicht mehr zu treffen war.

            Bedienen duerfen sie das Spiel trotzdem nicht: jedes Spiel haengt
            an denselben Zeigerereignissen, ein durchgereichter Tipp wuerde
            drehen, abwerfen oder springen. Darum stoppt jede Taste Zeiger
            und Leertaste, bevor die Buehne sie sieht. */}
        <div className="trm-shell" data-vollbild={vollbild ? '' : undefined}>
          {/* Die Anleitung steht immer bereit — vor der Runde, um zu wissen,
              worauf man sich einlaesst, und mittendrin, wenn eine Taste
              unklar war. */}
          {anleitung && (
            <button
              type="button"
              className="trm-shell__knopf trm-shell__knopf--wort trm-shell__knopf--anleitung"
              aria-label={T.shellAnleitungHilfe}
              title={T.shellAnleitungHilfe}
              data-anleitung-auf
              onPointerDown={halt}
              onPointerUp={halt}
              onKeyDown={tastenHalt}
              onClick={hilfeAuf}
            >
              <span aria-hidden="true">ⓘ</span>
              <span className="trm-shell__wort" aria-hidden="true">
                {T.shellAnleitung}
              </span>
            </button>
          )}
          <button
            type="button"
            className="trm-shell__knopf"
            aria-pressed={ton}
            aria-label={ton ? T.shellTonAus : T.shellTonAn}
            onPointerDown={halt}
            onPointerUp={halt}
            onKeyDown={tastenHalt}
            onClick={() => {
              const neu = tonUmschalten()
              setTon(neu)
              if (neu && laeuft && !lauf.pausiert) musikAn(spiel.key)
              else musikAus()
            }}
          >
            {ton ? '♪' : '✕'}
          </button>
          {/* Minimieren gibt es nur, solange es etwas anzuhalten gibt.
              Waehrend einer Runde ist das Scrollen gesperrt — dann ist diese
              Taste der einzige Weg zurueck auf die Seite, und deshalb steht
              sie mit Wort da und nicht als Strich. */}
          {laeuft && (
            <button
              type="button"
              className="trm-shell__knopf trm-shell__knopf--wort trm-shell__knopf--klein"
              aria-label={T.shellMinimierenHilfe}
              title={T.shellMinimierenHilfe}
              data-minimieren
              onPointerDown={halt}
              onPointerUp={halt}
              onKeyDown={tastenHalt}
              onClick={minimieren}
            >
              <span aria-hidden="true">–</span>
              <span className="trm-shell__wort" aria-hidden="true">
                {T.shellMinimieren}
              </span>
            </button>
          )}
          <button
            type="button"
            className="trm-shell__knopf trm-shell__knopf--wort trm-shell__knopf--voll"
            aria-pressed={vollbild}
            aria-label={vollbild ? T.shellVollbildAus : T.shellVollbild}
            title={vollbild ? T.shellVollbildAus : T.shellVollbild}
            onPointerDown={halt}
            onPointerUp={halt}
            onKeyDown={tastenHalt}
            /* Echtes Vollbild gibt es nur auf eine echte Nutzergeste. Genau
               diese ist der Klick hier — nie ein Effekt, nie ein Timer. */
            onClick={() => vollbildSetzen(!vollbild)}
          >
            <span aria-hidden="true">⛶</span>
            <span className="trm-shell__wort" aria-hidden="true">
              {vollbild ? T.shellVollbildKurzAus : T.shellVollbildKurz}
            </span>
          </button>
          {(laeuft || vollbild) && (
            <button
              type="button"
              className="trm-shell__knopf trm-shell__knopf--weg"
              aria-label={T.shellVerlassenHilfe}
              title={T.shellVerlassenHilfe}
              onPointerDown={halt}
              onPointerUp={halt}
              onKeyDown={tastenHalt}
              onClick={verlassen}
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>
        <div className={`trm-feld-spiel${spiel.hochformat ? ' trm-feld-spiel--hoch' : ''}`}>
          {children}

          {phase === 'ruht' && (
            <div className="trm-spiel__mitte">
              <p className="trm-metrik__text">{spiel.regel}</p>
              <p className="trm-spiel__best" data-practice-hinweis={practice ? '' : undefined}>
                {practice ? T.practiceSub : best != null ? `${T.best}: ${zahl(best)}` : T.bestLeer}
              </p>
              {fehler && <p className="trm-meldung trm-meldung--fehler">{T.ticketFehler}</p>}
            </div>
          )}

          {phase === 'startet' && (
            <div className="trm-spiel__mitte">
              <p className="trm-metrik__text">{T.startet}</p>
            </div>
          )}

          {(phase === 'sendet' || phase === 'vorbei') && (
            <div className="trm-spiel__mitte trm-spiel__mitte--ergebnis">
              <p className="trm-spiel__ergebnis-label">{practice ? T.practiceScore : T.ergebnis}</p>
              <p className="trm-metrik__zahl trm-spiel__endstand" data-practice-score={practice ? '' : undefined}>
                {zahl(punkte)}
              </p>

              {/* Der Probelauf ist vorbei und zaehlt nicht. Hier steht, was
                  stattdessen zaehlt — und die beiden Wege dahin. */}
              {practice && phase === 'vorbei' && (
                <>
                  {probeRang && (
                    <p className="trm-spiel__probe-rang" data-art={probeRang.art} role="status">
                      {probeRang.text}
                      {probeRang.zusatz ? (
                        <span className="trm-spiel__probe-bis">{probeRang.zusatz}</span>
                      ) : null}
                    </p>
                  )}
                  <p className="trm-spiel__jagd">{practiceWeg?.frageText ?? T.practiceFrage}</p>
                  <button
                    type="button"
                    className="trm-cta trm-cta--umriss"
                    data-practice-cta
                    onClick={() => practiceWeg?.onCta?.()}
                  >
                    {practiceWeg?.ctaText ?? T.practiceCta}
                  </button>
                  {/* Was der Knopf bedeutet — und warum der Probe-Score nicht
                      mitkommt. Steht nur im Practice-Kontext, nie im echten
                      Lauf. */}
                  {practiceWeg?.ctaSub ? (
                    <p className="trm-spiel__probe-sub">{practiceWeg.ctaSub}</p>
                  ) : null}
                  {practiceWeg?.ctaDrei ? (
                    <p className="trm-spiel__probe-drei">{practiceWeg.ctaDrei}</p>
                  ) : null}
                  {practiceWeg?.neuText ? (
                    <p className="trm-spiel__probe-neu">{practiceWeg.neuText}</p>
                  ) : null}
                </>
              )}
              {neuerBest && <p className="trm-spiel__neu">{T.neuerBest}</p>}

              {rang?.platz > 0 && (
                <p className="trm-spiel__platz">
                  {fuelle(T.platzVon, { platz: rang.platz, von: zahl(rang.von ?? rang.platz) })}
                </p>
              )}
              {ansage && !(neuerBest && ansage === T.motivRekord) && (
                <p className="trm-spiel__jagd trm-spiel__motiv">{ansage}</p>
              )}

              {/* Der Tagesbestwert und der eigene Bestwert nebeneinander: das
                  eine ist das Ziel, das andere die Messlatte. */}
              {phase === 'vorbei' && antwort?.ok && !practice && (
                <dl className="trm-spiel__marken">
                  <div className="trm-spiel__marke">
                    <dt>{T.besterHeute}</dt>
                    <dd>{heute?.punkte != null ? zahl(heute.punkte) : T.besterHeuteLeer}</dd>
                  </div>
                  <div className="trm-spiel__marke">
                    <dt>{T.deinBester}</dt>
                    <dd>{eigenBest != null ? zahl(eigenBest) : T.besterHeuteLeer}</dd>
                  </div>
                </dl>
              )}

              {/* Zwei Wege aus dem Ergebnis: sofort nochmal — oder nachsehen,
                  wo der Lauf gelandet ist. Im Probelauf zaehlt nichts davon,
                  dort steht stattdessen der Weg zur Aktivierung. */}
              {nochmalMoeglich && (
                <p className="trm-spiel__wege">
                  <button
                    type="button"
                    ref={nochmalRef}
                    className="trm-cta trm-spiel__nochmal"
                    onClick={starten}
                  >
                    {T.nochmalKurz}
                  </button>
                  {!practice && (
                    <Link className="trm-cta trm-cta--umriss trm-cta--klein" to="/terminal/rangliste">
                      {T.zurRangliste}
                    </Link>
                  )}
                </p>
              )}

              <p className="trm-metrik__text trm-spiel__status" aria-live="polite" hidden={practice}>
                {phase === 'sendet' && T.speichert}
                {phase === 'vorbei' && antwort?.ok && antwort.gewertet && T.gespeichert}
                {phase === 'vorbei' && antwort?.ok && !antwort.gewertet && T.nichtGewertet}
                {phase === 'vorbei' && antwort && !antwort.ok && T.fehler}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Die kompakte Karte. Sie steht an der Stelle der Buehne und sagt
          genau zwei Dinge: die Runde steht, und wie es weitergeht. */}
      {klein && (
        <div className="trm-spiel__pausekarte" data-pause role="status">
          <p className="trm-spiel__pausekarte-titel">{T.pauseTitel}</p>
          <p className="trm-spiel__pausekarte-sub">{T.pauseSub}</p>
          <p className="trm-spiel__pausekarte-wege">
            <button type="button" className="trm-cta" data-pause-weiter onClick={weiterspielen}>
              {T.pauseWeiter}
            </button>
            <button
              type="button"
              className="trm-cta trm-cta--umriss trm-cta--klein"
              data-pause-beenden
              onClick={pauseBeenden}
            >
              {T.pauseBeenden}
            </button>
          </p>
        </div>
      )}

      {/* Die Anleitung: ein Blatt ueber dem Feld, nicht daneben. Sie liegt
          in der Karte selbst, damit sie auch im echten Vollbild sichtbar
          bleibt — ein fest positioniertes Element ausserhalb des
          Vollbildelements zeigt der Browser nicht an. */}
      {hilfe && anleitung && (
        <div
          className="trm-anleitung"
          data-anleitung
          role="dialog"
          aria-modal="true"
          aria-label={`${T.shellAnleitung}: ${spiel.titel}`}
          onPointerDown={halt}
          onPointerUp={halt}
          onClick={(e) => {
            if (e.target === e.currentTarget) hilfeZu()
          }}
        >
          <div className="trm-anleitung__blatt">
            <p className="trm-anleitung__marke">{T.shellAnleitung}</p>
            <h3 className="trm-anleitung__titel">{spiel.titel}</h3>
            <dl className="trm-anleitung__liste">
              <div className="trm-anleitung__zeile">
                <dt>{T.anleitungZiel}</dt>
                <dd>{anleitung.ziel}</dd>
              </div>
              <div className="trm-anleitung__zeile">
                <dt>{T.anleitungSteuerung}</dt>
                <dd>{anleitung.steuerung}</dd>
              </div>
              {anleitung.punkte.map(([kopf, satz]) => (
                <div className="trm-anleitung__zeile" key={kopf}>
                  <dt>{kopf}</dt>
                  <dd>{satz}</dd>
                </div>
              ))}
              <div className="trm-anleitung__zeile">
                <dt>{T.anleitungEnde}</dt>
                <dd>{anleitung.ende}</dd>
              </div>
              {/* Was zu holen ist — einmal fuer alle Spiele gleich, und nie
                  mehr versprochen als die Teilnahmebedingungen hergeben. */}
              <div className="trm-anleitung__zeile" data-anleitung-gewinn>
                <dt>{T.anleitungGewinn}</dt>
                <dd>{practice ? T.anleitungGewinnProbe : T.anleitungGewinnText}</dd>
              </div>
            </dl>
            <button type="button" className="trm-cta trm-anleitung__zu" data-anleitung-zu onClick={hilfeZu}>
              {T.anleitungZu}
            </button>
          </div>
        </div>
      )}

      <p className="trm-spiel__leiste">
        {/* Die Endlosspiele haben keine Uhr: die Runde endet mit dem Fehler.
            Links steht dann, was sie stattdessen misst — Hoehe oder Meter. */}
        {spiel.ohneZeit ? (
          <span>
            {spiel.leisteLabel} <span className="trm-spiel__wert">{zahl(spiel.leisteWert ?? 0)}</span>
          </span>
        ) : (
          <span>
            {T.zeit} <span className="trm-spiel__wert">{String(Math.max(0, restSek)).padStart(2, '0')}</span>
          </span>
        )}
        {leiste}
        <span aria-live="off">
          {T.punkte} <span className="trm-spiel__wert">{zahl(punkte)}</span>
        </span>
      </p>
    </section>
  )
}
