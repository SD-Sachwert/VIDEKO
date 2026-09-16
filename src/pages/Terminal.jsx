import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CheckCircle2, ChevronRight, Circle, KeyRound, Radio } from 'lucide-react'

import GesamtrankingKarte from '../components/Gesamtranking.jsx'
import Goldrausch from '../components/Goldrausch.jsx'
import KuechenDash from '../components/KuechenDash.jsx'
import KuechenStack from '../components/KuechenStack.jsx'
import Seo from '../components/Seo.jsx'
import TerminalRahmen, {
  Gewinne,
  Ikon,
  Instagram,
  Metrik,
  Raute,
  Schriftzug,
  Truhe,
  Uhr,
} from '../components/TerminalRahmen.jsx'
import TruhenKnacker from '../components/TruhenKnacker.jsx'
import { PracticeKontext, startWunschSetzen } from '../components/spiel-lauf.js'
import { GEWINNE } from '../data/terminal-gewinne.js'
import {
  SPEICHER_INTRO_WUNSCH,
  SPEICHER_SITZUNG,
  SPEICHER_SZENE,
  SPEICHER_TRESOR,
  SPEICHER_ZUGANG,
  einwilligungSetzen,
  introMerken,
  merkeLesen,
  merkeSchreiben,
  probeAktiv,
  sitzungLesen,
  sitzungSchreiben,
  terminalRuf,
  wiederAnfordern,
  wiederEinloesen,
} from '../data/terminal-api.js'
import {
  ABLAUF,
  AKTIVIER_KARTEN,
  EMAIL_MUSTER,
  FELD_GRENZEN,
  SCHRITTE,
  TERMINAL_KAMPAGNE,
  SPIEL_NACH_KEY,
  TEXTE,
  WIEDER_NEUTRAL,
  aktiveSpiele,
  deckelNummer,
  deckelText,
  fuelle,
  instagramNormalisieren,
  missionStand,
  terminText,
  zahl,
} from '../data/terminal.js'

/**
 * /terminal — die Aktionsseite zum Bierdeckel.
 *
 * Auf jedem der 5.000 gedruckten Deckel steht ein QR-Code, der hier landet.
 * Die Seite hat vier Zustaende, und zwar in dieser Reihenfolge:
 *
 *   A  verschlossen — Raetselcode eingeben
 *   Z  Zugang — die Truhe reagiert, bleibt aber zu. Drei Punkte darauf:
 *      Schloss, VIDEKO-Zeichen, Schluesselloch. Nur das Schluesselloch fuehrt
 *      weiter.
 *   B  im Tresor, noch nicht aktiviert — Deckelnummer, Instagram, E-Mail
 *   C  im Tresor, aktiviert — Dashboard, Games, Leaderboard
 *
 * Dazwischen liegen zwei kurze Inszenierungen (`buehne`): `gewaehrt` nach dem
 * richtigen Code und `schluessel` beim Flug durch das Schlüsselloch. Beide
 * sind reine Darstellung — der Zustandswechsel haengt an der Serverantwort,
 * nicht an der Animation. Wer `prefers-reduced-motion` gesetzt hat, bekommt
 * dieselben Schritte in wenigen Hundert Millisekunden.
 *
 * WAS HIER BEWUSST NICHT PASSIERT
 * -------------------------------
 * Der Raetselcode wird nicht im Browser geprueft. Stuende er im Bundle,
 * koennte ihn jeder auslesen, der den QR-Code scannt. `ZUGANG PRÜFEN`
 * schickt die Eingabe deshalb an /api/terminal; zurueck kommt nur ja oder
 * nein und, im Erfolgsfall, ein kurzlebiger signierter Beleg. Auch dieser
 * Beleg wird beim Aktivieren erneut serverseitig geprueft — wer ihn im
 * localStorage faelscht, kommt nicht an Zustand B vorbei.
 *
 * Genauso entscheidet ausschliesslich der Server, ob eine Deckelnummer noch
 * frei ist. Die Pruefung hier im Formular ist Hoeflichkeit, kein Schutz.
 *
 * Und: die Spiele haben mit der Ziehung nichts zu tun. Gezogen wird allein
 * aus den gueltig aktivierten Deckeln. Punkte sind Unterhaltung.
 *
 * ERSTES RENDERN
 * --------------
 * Die Seite wird vorgerendert (scripts/prerender.mjs). Der erste Render —
 * auf dem Server und im Browser — ist deshalb immer Zustand A mit leeren
 * Kennzahlen. Erst ein Effekt sieht in den Speicher, fragt /api/terminal und
 * wechselt gegebenenfalls nach Z, B oder C. So stimmen Server- und
 * Client-Markup beim Hydrieren ueberein.
 */

const LAENGE = TERMINAL_KAMPAGNE.codeLaenge
const LEERER_CODE = Array.from({ length: LAENGE }, () => '')

const LEERES_FORMULAR = {
  deckel: '',
  instagram: '',
  email: '',
  folgt: false,
  leaderboard: false,
  website: '' /* Honigtopf */,
}

const GESAMT = zahl(TERMINAL_KAMPAGNE.deckelGesamt)
const HANDLE = TERMINAL_KAMPAGNE.instagramHandle

/* Dauer der beiden Inszenierungen. Die Choreografie selbst steht in
   terminal.css; hier steht nur, wann der Zustand umschaltet. Die Werte muessen
   zu den Keyframes passen — laenger waere eine Pause, kuerzer ein Abbruch.

   ACCESS GRANTED laeuft in Stufen, jede Schicht mit eigener Verzoegerung:

        0 –  300 ms  die Seite reagiert, der Hintergrund wird dunkler
      300 –  900 ms  ACCESS GRANTED kommt mit Goldlicht
      600 – 1500 ms  Licht wandert durch die Adern der Truhe
      900 – 1800 ms  der Rauch verstaerkt sich
     1300 – 2000 ms  die Truhe kommt leicht nach vorn
          ~1800 ms  das Schloss schnappt sichtbar
     1800 – 2500 ms  der goldene Lichtspalt steht
     2400 – 3400 ms  DU HAST ZUGANG.

   Die Truhe geht dabei nicht auf. */
const BUEHNE_MS = { gewaehrt: 3400, schluessel: 1300, verweigert: 1700, spaehen: 3000, vorflug: 1500 }
const BUEHNE_SANFT_MS = { gewaehrt: 900, schluessel: 320, verweigert: 900, spaehen: 2000, vorflug: 1100 }

/* Rueckmeldung der Punkte, die nicht weiterfuehren. */
const PUNKT_MS = { truhe: 640, schloss: 620, zeichen: 900, wort: 1800 }

/* Das Drehbuch des Ersteinstiegs. Die Zahlen sind Millisekunden ab dem ersten
   Bild; die Bilder selbst stehen in terminal.css unter DER ERSTEINSTIEG.

   Bild 9 ist kein Bild, sondern das Ende: ab dort steht die Seite
   vollstaendig da und die Klasse trm-intro-an wird wieder entfernt.

   Wer Bewegung abbestellt hat, bekommt dieselben Bilder in derselben
   Reihenfolge — nur in gut einer halben Sekunde. Nichts wird uebersprungen,
   nichts faellt weg; es ist dieselbe Ankunft im Zeitraffer. */
/* 0,0 s fast schwarz · 0,3 s Goldadern · 0,6 s Rauch · 0,9 s Truhe weit
   hinten · 1,1–2,4 s sie kommt auf dich zu · 2,4 s Aufschlag · 2,5 s das
   Schloss schwingt · 2,7 s Goldglanz · 2,9 s Schlagzeile · danach Codefelder.
   Die Zwischenzeiten innerhalb eines Bildes stehen als Verzoegerungen in
   terminal.css. */
const INTRO_TAKT = [
  { bild: 1, ms: 32 },
  { bild: 2, ms: 300 },
  { bild: 3, ms: 1100 },
  { bild: 4, ms: 2400 },
  { bild: 5, ms: 2900 },
  { bild: 6, ms: 3300 },
  { bild: 9, ms: 3700 },
]

const INTRO_TAKT_SANFT = [
  { bild: 1, ms: 0 },
  { bild: 2, ms: 60 },
  { bild: 3, ms: 140 },
  { bild: 4, ms: 260 },
  { bild: 5, ms: 340 },
  { bild: 6, ms: 420 },
  { bild: 9, ms: 560 },
]

/** Hat die Person Bewegung abbestellt? Wird bei jeder Sequenz neu gefragt. */
/**
 * Den Anker aus der Adresszeile nehmen, ohne neu zu laden. Ein Zugangslink
 * soll nach dem Einloesen nicht in der Adresszeile, im Verlauf oder in einem
 * Lesezeichen stehen bleiben.
 */
function hashWeg() {
  try {
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  } catch {
    /* nichts zu tun */
  }
}

function sanftGewuenscht() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ */
/* Die acht Codefelder                                                 */
/* ------------------------------------------------------------------ */

/**
 * Acht einzelne Felder, die sich wie ein Feld anfuehlen sollen.
 *
 * Die Fummelarbeit steckt in vier Stellen:
 *   1. Tippen schiebt den Fokus weiter, aber nur bis zum letzten Feld.
 *   2. Einfuegen eines ganzen Codes verteilt sich ueber alle Felder —
 *      deshalb kein `maxLength`, das wuerde den Einfuegevorgang abschneiden.
 *   3. Tippen in ein belegtes Feld ersetzt das Zeichen (Auswahl beim Fokus)
 *      statt zwei Zeichen stehen zu lassen.
 *   4. Rueckschritt in einem leeren Feld loescht das vorherige und springt
 *      dorthin — sonst haengt der Fokus fest.
 */
function CodeFelder({ ziffern, setZiffern, gesperrt }) {
  const felder = useRef([])

  const setzen = useCallback(
    (index, wert) => {
      setZiffern((alt) => {
        const neu = [...alt]
        neu[index] = wert
        return neu
      })
    },
    [setZiffern],
  )

  function geaendert(index, ereignis) {
    let roh = ereignis.target.value

    /* Stand das alte Zeichen noch vorn, wurde dahinter getippt — dann zaehlt
       nur das Neue. */
    const vorher = ziffern[index]
    if (vorher && roh.length > 1 && roh.startsWith(vorher)) roh = roh.slice(1)

    const zeichen = roh
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .split('')

    if (zeichen.length === 0) {
      setzen(index, '')
      return
    }

    setZiffern((alt) => {
      const neu = [...alt]
      for (let k = 0; k < zeichen.length && index + k < LAENGE; k += 1) {
        neu[index + k] = zeichen[k]
      }
      return neu
    })

    const weiter = Math.min(LAENGE - 1, index + zeichen.length)
    felder.current[weiter]?.focus()
  }

  function taste(index, ereignis) {
    if (ereignis.key === 'Backspace' && !ziffern[index]) {
      ereignis.preventDefault()
      if (index > 0) {
        setzen(index - 1, '')
        felder.current[index - 1]?.focus()
      }
      return
    }
    if (ereignis.key === 'ArrowLeft' && index > 0) {
      ereignis.preventDefault()
      felder.current[index - 1]?.focus()
    }
    if (ereignis.key === 'ArrowRight' && index < LAENGE - 1) {
      ereignis.preventDefault()
      felder.current[index + 1]?.focus()
    }
  }

  return (
    <div className="trm-code__felder" role="group" aria-labelledby="trm-code-label">
      {ziffern.map((z, index) => (
        <input
          /* Die Position ist die Identitaet des Feldes — acht feste Plaetze,
             die sich nie umsortieren. */
          key={index}
          ref={(knoten) => {
            felder.current[index] = knoten
          }}
          className="trm-code__feld"
          type="text"
          value={z}
          onChange={(e) => geaendert(index, e)}
          onKeyDown={(e) => taste(index, e)}
          onFocus={(e) => e.target.select()}
          disabled={gesperrt}
          aria-label={`Zeichen ${index + 1} von ${LAENGE}`}
          data-voll={z ? '1' : '0'}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="go"
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Ein Eingabefeld mit Beschriftung, Hilfstext und Fehlerstelle        */
/* ------------------------------------------------------------------ */

function Feld({ id, label, hilfe, fehler, nach, children }) {
  const hilfeId = hilfe ? `${id}-hilfe` : undefined
  const fehlerId = fehler ? `${id}-fehler` : undefined

  return (
    <div className="trm-feld">
      <label className="trm-feld__label" htmlFor={id}>
        {label} <span className="trm-feld__pflicht">*</span>
      </label>

      {nach ? (
        <div className="trm-feld__zeile">
          {children({ hilfeId, fehlerId })}
          <span className="trm-feld__von" aria-hidden="true">
            {nach}
          </span>
        </div>
      ) : (
        children({ hilfeId, fehlerId })
      )}

      {hilfe ? (
        <p className="trm-feld__hilfe" id={hilfeId}>
          {hilfe}
        </p>
      ) : null}
      {fehler ? (
        <p className="trm-feld__fehler" id={fehlerId} role="alert">
          {fehler}
        </p>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Die Inszenierung                                                    */
/* ------------------------------------------------------------------ */

/**
 * Die Buehne liegt ueber der Seite und haelt sie kurz an.
 *
 * `gewaehrt` dunkelt den Hintergrund ab, zieht zwei goldene Lichtlinien
 * darueber, laesst Rauch aufsteigen und setzt `ACCESS GRANTED` in die Mitte.
 * Die Truhe darunter bleibt sichtbar — die Abdunkelung ist in der Mitte offen,
 * damit sie naeher zu kommen scheint, statt zu verschwinden.
 *
 * `schluessel` ist der Flug durch das Schloss: ein Schlüssellochausschnitt
 * waechst ueber das Bild, ein goldener Strahl bricht hervor, dann ist alles
 * schwarz. Kein 3D, kein WebGL — zwei Elemente und zwei Keyframes.
 */
/**
 * Der Blick durchs Schluesselloch, bevor es einen Code gibt.
 *
 * Hinter einer echten Schlossmaske ziehen nur Bilder vorbei — Wellness,
 * Kuechengutschein, Merch —, dazu Goldlicht und Tiefenunschaerfe. Keine
 * Karten, keine Ueberschriften, kein Fliesstext: alles, was hier Schrift
 * waere, laege senkrecht gestaucht im schmalen Schaft. Zwei Baender laufen
 * mit verschiedenem Tempo seitwaerts, das hintere unscharf und groesser —
 * daraus entsteht die Tiefe. Nach etwa 1,5 s schliesst sich der Blick, und
 * unter dem Loch steht die Sperre. Nichts davon ist antippbar.
 */
function SchlossBlick() {
  const bilder = ['wellness', 'gutschein', 'shirt'].map((key) => GEWINNE.find((g) => g.key === key)).filter(Boolean)
  return (
    <div className="trm-buehne trm-buehne--spaehen">
      <span className="trm-spaehen__grund" aria-hidden="true" />
      <div className="trm-schlossblick" aria-hidden="true">
        <div className="trm-schlossblick__maske">
          <div className="trm-schlossblick__inhalt">
            <div className="trm-schlossblick__band trm-schlossblick__band--tief">
              {bilder.map((g) => (
                <img key={g.key} src={g.bild} alt="" className="trm-schlossblick__tiefbild" decoding="async" />
              ))}
            </div>
            <div className="trm-schlossblick__band">
              {bilder.map((g) => (
                <img key={g.key} src={g.bild} alt="" className="trm-schlossblick__bild" decoding="async" />
              ))}
            </div>
            <span className="trm-schlossblick__licht" />
            <span className="trm-schlossblick__schatten" />
          </div>
        </div>
        <svg className="trm-schlossblick__rand" viewBox="0 0 100 160" preserveAspectRatio="none" focusable="false">
          <path d="M50 16A34 34 0 0 1 62 81.9L74 150H26L38 81.9A34 34 0 0 1 50 16Z" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="trm-spaehen__sperre" role="status">
        <p className="trm-spaehen__sperrwort">{TEXTE.wach.spaehenSperre}</p>
        <p className="trm-spaehen__sperrzeile">{TEXTE.wach.spaehenCode}</p>
      </div>
    </div>
  )
}

function Buehne({ art, wort = null }) {
  if (!art) return null

  /* Der Blick durchs Schluesselloch, bevor es einen Code gibt. */
  if (art === 'spaehen') return <SchlossBlick />

  /* Der Satz vor dem echten Flug: der Unterschied zum Blick von vorhin. */
  if (art === 'vorflug') {
    return (
      <div className="trm-buehne trm-buehne--vorflug">
        <p className="trm-buehne__satz" role="status">
          {TEXTE.z.flugText}
        </p>
      </div>
    )
  }

  /* Die Abfuhr am Schluesselloch, solange der Code fehlt. Sie benutzt zwei
     Schichten der grossen Sequenz und fuehrt bewusst nirgendwohin: nach
     knapp zwei Sekunden steht wieder dieselbe Truhe da. */
  if (art === 'verweigert') {
    return (
      <div className="trm-buehne trm-buehne--verweigert">
        <span className="trm-buehne__weich" aria-hidden="true" />
        <p className="trm-buehne__wort" role="status">
          {wort}
        </p>
      </div>
    )
  }

  if (art === 'gewaehrt') {
    return (
      <div className="trm-buehne trm-buehne--gewaehrt">
        <span className="trm-buehne__rauch" aria-hidden="true" />
        <span className="trm-buehne__strich" aria-hidden="true" />
        <span className="trm-buehne__strich trm-buehne__strich--zwei" aria-hidden="true" />
        {/* Der Schlag: ein kurzer Goldblitz und Funken, die ueber die ganze
            Buehne fliegen — genau dann, wenn an der Truhe das Schloss
            anschlaegt. */}
        <span className="trm-buehne__blitz" aria-hidden="true" />
        <span className="trm-buehne__funken" aria-hidden="true" />
        <span className="trm-buehne__funken trm-buehne__funken--zwei" aria-hidden="true" />
        <p className="trm-buehne__wort" role="status">
          {TEXTE.z.gewaehrt}
        </p>
        {/* Der zweite Satz loest den ersten ab, nachdem das Schloss geschnappt
            hat. Er steht an derselben Stelle, an der gleich die Ueberschrift
            des Zustands Z steht — der Wechsel soll wie Stehenbleiben
            aussehen, nicht wie ein Schnitt. `aria-hidden`, weil die
            Ueberschrift denselben Satz gleich noch einmal traegt. */}
        <p className="trm-buehne__wort trm-buehne__wort--zwei" aria-hidden="true">
          {TEXTE.z.titel}
        </p>
      </div>
    )
  }

  return (
    <div className="trm-buehne trm-buehne--schluessel" aria-hidden="true">
      {/* Die Reihenfolge ist hier die Bildregie: erst der Weichzeichner ueber
          der Seite, dann das warme Licht, dann die schwarze Schlossform
          davor. */}
      <span className="trm-buehne__weich" />
      <span className="trm-buehne__strahl" />
      <svg className="trm-buehne__maske" viewBox="0 0 100 100" focusable="false">
        {/* Kreis und Schaft getrennt statt ein gebogener Pfad: beide sind
            schwarz und liegen uebereinander, die Ueberlappung faellt nicht
            auf, und an einem Kreis kann man sich nicht verrechnen. */}
        <g fill="#030302">
          <circle cx="50" cy="44" r="7" />
          <path d="M45 48 L43.2 64.2 Q43 66.3 45.1 66.3 L54.9 66.3 Q57 66.3 56.8 64.2 L55 48 Z" />
        </g>
      </svg>
      {/* Sicherheitsnetz fuer sehr breite Fenster: am Ende ist schwarz. */}
      <span className="trm-buehne__schwarz" />
    </div>
  )
}

/* ------------------------------------------------------------------ */

/**
 * Die Follower-Mission. Die Zahl traegt die Verwaltung von Hand ein — eine
 * Instagram-Schnittstelle gibt es nicht. Jede Stufe zeigt ihren Gewinn, wenn
 * einer eingetragen ist, sonst den Platzhalter. Werte erfindet die Seite nicht.
 */
function Mission({ follower, gewinne }) {
  const M = TEXTE.c.mission
  const stand = missionStand(follower, gewinne)
  const prozent = Math.round(stand.anteil * 100)

  return (
    <section className="trm-karte trm-mission" id="mission" aria-labelledby="trm-mission-titel">
      <div className="trm-karte__kopf">
        <Ikon name="instagram" size={22} className="trm-ikon" />
        <h2 className="trm-karte__titel" id="trm-mission-titel">
          {M.label} <span className="trm-mission__trenner">/</span> {M.sub}
        </h2>
      </div>

      <p className="trm-mission__zahl">{fuelle(M.follower, { zahl: zahl(stand.follower) })}</p>

      <div
        className="trm-balken trm-mission__balken"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={prozent}
        aria-label={M.label}
      >
        <span className="trm-balken__fuellung" style={{ width: `${prozent}%` }} />
      </div>

      <p className="trm-mission__fehlt">
        {stand.naechste ? fuelle(M.fehlt, { fehlt: zahl(stand.fehlt) }) : M.alle}
      </p>

      <ol className="trm-mission__stufen">
        {stand.stufen.map((st) => (
          <li
            key={st.ziel}
            className="trm-mission__stufe"
            data-frei={st.frei ? '1' : '0'}
            data-naechste={stand.naechste?.ziel === st.ziel ? '1' : '0'}
          >
            <span className="trm-mission__ziel">
              {zahl(st.ziel)}
              {st.frei ? null : (
                <span className="trm-mission__schloss" aria-hidden="true">
                  {' '}
                  🔒
                </span>
              )}
            </span>
            <span className="trm-mission__wort">{st.frei ? M.frei : <span className="trm-nur-sr">{M.zu}</span>}</span>
            <span className="trm-mission__gewinn">{st.gewinn}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Testlabor-Szenen im Dashboard, zu denen gescrollt wird. Jede ist eine id. */
const ZIEL_SZENEN = [
  'truhenknacker',
  'goldrausch',
  'kuechen_stack',
  'kuechen_dash',
  'kuechen_balance',
  'kuechen_fit',
  'videko_jump',
  'kuechen_merge',
  'leitungsfinder',
  'kuechen_crush',
  'kuechen_tinder',
  'mission',
  'einwilligung',
]

/** Spielschluessel → Bauteil. Die Reihenfolge kommt aus der Verwaltung. */
const SPIEL_BAUTEILE = {
  truhenknacker: TruhenKnacker,
  goldrausch: Goldrausch,
  kuechen_stack: KuechenStack,
  kuechen_dash: KuechenDash,
}

/*
 * Die Game-Lab-Spiele werden erst geladen, wenn jemand ihre Karte antippt.
 * Sieben Spielfelder samt Logik gehoeren nicht in den ersten Seitenaufbau —
 * wer nur seinen Deckel aktiviert, soll davon nichts herunterladen.
 */
const SPIEL_NACHLADEN = {
  kuechen_balance: lazy(() => import('../components/spiele/KuechenBalance.jsx')),
  kuechen_fit: lazy(() => import('../components/spiele/KuechenFit.jsx')),
  videko_jump: lazy(() => import('../components/spiele/VidekoJump.jsx')),
  kuechen_merge: lazy(() => import('../components/spiele/KuechenMerge.jsx')),
  leitungsfinder: lazy(() => import('../components/spiele/Leitungsfinder.jsx')),
  kuechen_crush: lazy(() => import('../components/spiele/KuechenCrush.jsx')),
  kuechen_tinder: lazy(() => import('../components/spiele/KuechenTinder.jsx')),
}

/** Die kompakte Auswahlkarte eines nachgeladenen Spiels. */
function SpielWahl({ spiel, best, oeffnen }) {
  return (
    <button
      type="button"
      className="trm-karte trm-spielwahl"
      id={spiel.key}
      data-spielwahl={spiel.key}
      onClick={oeffnen}
    >
      <Ikon name={spiel.icon} size={24} className="trm-ikon" />
      <span className="trm-spielwahl__text">
        <span className="trm-spielwahl__titel">{spiel.titel}</span>
        <span className="trm-spielwahl__zeile">{spiel.zeile}</span>
        {best != null && (
          <span className="trm-spielwahl__best">
            {TEXTE.g.best}: {zahl(best)}
          </span>
        )}
      </span>
      <span className="trm-spielwahl__los" aria-hidden="true">
        {TEXTE.g.spielen}
      </span>
    </button>
  )
}

export default function Terminal() {
  /* 'a' verschlossen, 'z' Zugang, 'b' Tresor ohne Aktivierung, 'c' aktiviert */
  const [ansicht, setAnsicht] = useState('a')
  /* null | 'gewaehrt' | 'schluessel' | 'verweigert' — die laufende Inszenierung */
  const [buehne, setBuehne] = useState(null)
  /* Das Wort, das die Abfuhr am Schluesselloch traegt. */
  const [buehneWort, setBuehneWort] = useState(null)

  /* Der Ersteinstieg. Die Zahl beginnt bei 0 und nicht bei 1: das
     vorgerenderte Markup und der erste Render im Browser muessen Zeichen fuer
     Zeichen uebereinstimmen, sonst verwirft React die Hydration. Erst ein
     Effekt entscheidet danach, ob die Sequenz laeuft oder ob die Seite
     sofort vollstaendig dasteht. */
  const [introPhase, setIntroPhase] = useState(0)
  const [introLaeuft, setIntroLaeuft] = useState(false)
  const introUhrenRef = useRef([])

  const [ziffern, setZiffern] = useState(LEERER_CODE)
  const [codeFehler, setCodeFehler] = useState(null)
  const [codePruefung, setCodePruefung] = useState(false)

  const [formular, setFormular] = useState(LEERES_FORMULAR)
  const [feldFehler, setFeldFehler] = useState({})
  const [sendet, setSendet] = useState(false)
  /* Die Nummer ist schon aktiviert: Warnfenster mit JA/NEIN. */
  const [belegtFrage, setBelegtFrage] = useState(false)
  const belegtNeinRef = useRef(null)
  /* Das Warnfenster fokussiert NEIN: ein versehentliches Enter legt keinen
     weiteren Besitzanspruch an. */
  useEffect(() => {
    if (belegtFrage) belegtNeinRef.current?.focus()
  }, [belegtFrage])

  /* Wieder-Login. Das Formular ist zu, bis jemand es aufmacht — so stimmt
     das vorgerenderte Markup mit dem ersten Bild ueberein. */
  const [wiederOffen, setWiederOffen] = useState(false)
  const [wiederEmail, setWiederEmail] = useState('')
  const [wiederFehler, setWiederFehler] = useState(null)
  const [wiederMeldung, setWiederMeldung] = useState(null)
  const [wiederSendet, setWiederSendet] = useState(false)
  const [wiederTestLink, setWiederTestLink] = useState(null)

  const [kennzahlen, setKennzahlen] = useState(null)
  const [teilnehmer, setTeilnehmer] = useState(null)
  const [sitzung, setSitzung] = useState(null)
  const [spiele, setSpiele] = useState(null)
  /* Welche nachgeladenen Spiele aufgeklappt sind, und welches das Testlabor
     zeigen soll — auch wenn es in der Verwaltung ausgeblendet ist. */
  const [offeneSpiele, setOffeneSpiele] = useState({})
  const [laborSpiel, setLaborSpiel] = useState(null)

  /* Die Einwilligung ins oeffentliche Leaderboard, jederzeit aenderbar.
     null heisst: der Haken folgt dem gespeicherten Stand. */
  const [einwEntwurf, setEinwEntwurf] = useState(null)
  const [einwSendet, setEinwSendet] = useState(false)
  const [einwMeldung, setEinwMeldung] = useState(null)

  /* Der angetippte Punkt auf der Truhe und sein Wort darunter. */
  const [punkt, setPunkt] = useState(null)
  const [punktWort, setPunktWort] = useState(null)
  const punktNrRef = useRef(0)
  /* Zaehlt jeden Stoss an Truhe und Schloss. Die Effektschichten haengen an
     dieser Zahl und laufen deshalb bei jedem Antippen neu an. */
  const [stossNr, setStossNr] = useState(0)

  /* Damit die verschlossene Truhe nie zweimal hintereinander dasselbe sagt
     und die Abfuhr am Schluesselloch abwechselnd formuliert ist. */
  const rufNrRef = useRef(-1)

  /* Alle Zeitschalter an einer Stelle. Verlaesst jemand die Seite mitten in
     einer Sequenz, darf kein Timer mehr in eine abgebaute Komponente
     schreiben. */
  const uhrenRef = useRef([])
  const spaeter = useCallback((tun, ms) => {
    const id = window.setTimeout(tun, ms)
    uhrenRef.current.push(id)
    return id
  }, [])

  useEffect(
    () => () => {
      uhrenRef.current.forEach((id) => window.clearTimeout(id))
      uhrenRef.current = []
    },
    [],
  )

  /**
   * Die laufende Szene am Dokumentelement vermerken.
   *
   * Das Stylesheet blendet daran alles ausser der Truhe weg, wenn die Kamera
   * auf das Schloss zufaehrt. Es steht bewusst nicht als Klasse an einem
   * React-Element: die Spalte gehoert dem Rahmen, und ein Attribut ganz oben
   * erreicht sie, ohne die Zustaende durch drei Bauteile zu reichen.
   */
  const szeneSetzen = useCallback((wert) => {
    try {
      const wurzel = document.documentElement
      if (wert) wurzel.dataset.trmSzene = wert
      else delete wurzel.dataset.trmSzene
    } catch {
      /* nichts zu tun */
    }
  }, [])

  useEffect(() => () => szeneSetzen(null), [szeneSetzen])

  /* ---------------------------------------------------------------- */
  /* Der Ersteinstieg                                                  */
  /* ---------------------------------------------------------------- */

  /**
   * Ob die Sequenz laeuft, hat schon das kleine Skript im Dokumentkopf
   * entschieden — noch vor dem ersten Bild. Hier wird sie nur noch getaktet.
   *
   * Wer Bewegung abbestellt hat, bekommt dieselben Bilder in derselben
   * Reihenfolge in gut einer halben Sekunde. Nichts faellt weg.
   */
  useEffect(() => {
    const wurzel = document.documentElement
    if (!wurzel.classList.contains('trm-intro-an')) {
      /* Keine Sequenz: die Seite steht sofort vollstaendig da. */
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIntroPhase(9)
      return undefined
    }

    /* Der Wunsch ist eingeloest. Bliebe er stehen, liefe die Sequenz bei
       jedem weiteren Aufruf erneut. */
    sitzungSchreiben(SPEICHER_INTRO_WUNSCH, null)
    introMerken()

    /* Das Sicherheitsnetz aus dem Dokumentkopf ist fuer den Fall gedacht,
       dass diese Seite nie anlaeuft. Sie laeuft — ab hier taktet sie selbst.
       Bliebe der Zeitschalter stehen, risse er die Sequenz bei langsamem
       Laden mitten im Aufschlag ab. */
    window.clearTimeout(window.__trmIntroNetz)
    setIntroLaeuft(true)

    const takt = sanftGewuenscht() ? INTRO_TAKT_SANFT : INTRO_TAKT
    takt.forEach((bild) => {
      introUhrenRef.current.push(
        window.setTimeout(() => {
          setIntroPhase(bild.bild)
          wurzel.dataset.trmIntro = String(bild.bild)
        }, bild.ms),
      )
    })

    /* Kurz nach dem letzten Bild faellt die Klasse weg. Ab dann ist die
       Seite wieder eine ganz normale Seite. */
    introUhrenRef.current.push(
      window.setTimeout(() => {
        wurzel.classList.remove('trm-intro-an')
        delete wurzel.dataset.trmIntro
        setIntroLaeuft(false)
      }, takt[takt.length - 1].ms + 420),
    )

    return () => {
      introUhrenRef.current.forEach((id) => window.clearTimeout(id))
      introUhrenRef.current = []
      wurzel.classList.remove('trm-intro-an')
      delete wurzel.dataset.trmIntro
    }
  }, [])

  /** Vorbei. Eine Sequenz, die man nicht abbrechen kann, ist eine Zumutung. */
  const introUeberspringen = useCallback(() => {
    introUhrenRef.current.forEach((id) => window.clearTimeout(id))
    introUhrenRef.current = []
    const wurzel = document.documentElement
    wurzel.classList.remove('trm-intro-an')
    delete wurzel.dataset.trmIntro
    setIntroPhase(9)
    setIntroLaeuft(false)
  }, [])

  /** Die Klasse fuer ein Teil, das erst ab einem bestimmten Bild dasteht. */
  const stufe = (ab) => (introPhase >= ab ? 'trm-auftritt trm-auftritt--da' : 'trm-auftritt')

  /* ---------------------------------------------------------------- */
  /* Bereits aktiviert? — Wieder-Login                                 */
  /* ---------------------------------------------------------------- */

  const wiederZeigen = useCallback(() => {
    setWiederOffen(true)
    spaeter(() => {
      document
        .getElementById('bereits-aktiviert')
        ?.scrollIntoView({ behavior: sanftGewuenscht() ? 'auto' : 'smooth', block: 'center' })
      document.getElementById('trm-wieder-email')?.focus({ preventScroll: true })
    }, 80)
  }, [spaeter])

  /* Der Menuepunkt ist ein schlichter Link auf #bereits-aktiviert. Steht man
     schon auf /terminal, laedt der Browser dafuer nicht neu — die Seite
     reagiert deshalb auf den Wechsel des Ankers. Ein Testlink aus dem Labor
     wird dagegen wie jeder Zugangslink beim Ankommen eingeloest. */
  useEffect(() => {
    function ankerGewechselt() {
      const anker = window.location.hash || ''
      if (anker.startsWith('#wieder=')) {
        window.location.reload()
        return
      }
      if (anker !== '#bereits-aktiviert') return
      hashWeg()
      setAnsicht((jetzt) => (jetzt === 'z' ? 'a' : jetzt))
      wiederZeigen()
    }
    window.addEventListener('hashchange', ankerGewechselt)
    return () => window.removeEventListener('hashchange', ankerGewechselt)
  }, [wiederZeigen])

  /* ---------------------------------------------------------------- */
  /* Ankunft: Speicher lesen, Server fragen                           */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const abbruch = new AbortController()

    /**
     * Einen vom Testlabor gewuenschten Zustand herstellen.
     *
     * Erreichbar ist das ausschliesslich mit gueltigem Testbeleg. Jeder
     * Serveraufruf von hier landet in api/_terminal-probe.js, und dort
     * schreibt keine einzige Funktion — weder ein Teilnehmer noch ein Score
     * noch eine Ziehung wird dabei beruehrt.
     */
    async function szeneStellen(szene, signal) {
      /* Der Ersteinstieg und die wache Truhe sind Zustand A — da ist nichts
         herzustellen, die Seite steht schon richtig. */
      if (szene === 'code' || szene === 'truhe') return

      /* Der Blick durchs Schluesselloch vor dem Code: dieselbe Bewegung wie
         beim Antippen, nicht nachgebaut. */
      if (szene === 'spaehen') {
        spaeter(() => schluesselTippenA(), 700)
        return
      }

      /* Wieder-Login: das Formular aufschlagen. Anfordern und Einloesen
         laufen danach ueber denselben Testweg wie alles andere. */
      if (szene === 'wieder') {
        wiederZeigen()
        return
      }

      if (szene === 'code-ok' || szene === 'flug' || szene === 'aktivieren') {
        /* Ein Zettel, kein Beleg: der Testmodus prueft ihn nie, und er liegt
           im Testfach von sessionStorage, nicht beim echten Login. */
        merkeSchreiben(SPEICHER_ZUGANG, 'probe')

        if (szene === 'aktivieren') {
          merkeSchreiben(SPEICHER_TRESOR, '1')
          setAnsicht('b')
          return
        }

        if (szene === 'flug') {
          setAnsicht('z')
          /* Dieselbe Bewegung wie beim Antippen — nicht nachgebaut. */
          spaeter(() => schluesselTippen(), 520)
          return
        }

        const sanft = sanftGewuenscht()
        setBuehne('gewaehrt')
        spaeter(
          () => {
            setBuehne(null)
            setAnsicht('z')
          },
          sanft ? BUEHNE_SANFT_MS.gewaehrt : BUEHNE_MS.gewaehrt,
        )
        return
      }

      /* Der fertige Tresor. Die Testaktivierung legt keine Zeile an; sie gibt
         nur einen neuen Testbeleg zurueck, in dem steht, dass diese virtuelle
         Sitzung aktiviert ist. */
      const auf = await terminalRuf({ aktion: 'aktivieren' }, signal)
      if (signal.aborted || !auf.ok) return

      const neu = await terminalRuf({ aktion: 'zustand' }, signal)
      if (signal.aborted || !neu.ok || !neu.teilnehmer) return

      setTeilnehmer(neu.teilnehmer)
      setSpiele(neu.spiele ?? null)
      merkeSchreiben(SPEICHER_TRESOR, '1')
      setAnsicht('c')

      if (SPIEL_NACH_KEY[szene]) {
        /* Spielszene: Karte zeigen, aufklappen und die Runde direkt starten. */
        setLaborSpiel(szene)
        setOffeneSpiele((o) => ({ ...o, [szene]: true }))
        startWunschSetzen(szene)
      }
      if (ZIEL_SZENEN.includes(szene)) {
        spaeter(() => {
          document.getElementById(szene)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 240)
      }
    }

    async function laden() {
      /* Zugangslink aus der Mail: #wieder=<token>. Der Anker verschwindet
         sofort aus der Adresszeile, der Token geht genau einmal an den
         Server. Kommt ein Sitzungsbeleg zurueck, liegt er danach dort, wo er
         auch nach der Aktivierung liegt — alles Weitere laeuft wie immer. */
      const anker = window.location.hash || ''
      const wiederToken = anker.startsWith('#wieder=') ? anker.slice('#wieder='.length) : null
      const wiederGewuenscht = anker === '#bereits-aktiviert'
      if (wiederToken || wiederGewuenscht) hashWeg()

      let wiederProblem = null
      if (wiederToken) {
        const ein = await wiederEinloesen(wiederToken, abbruch.signal)
        if (abbruch.signal.aborted) return
        if (ein.ok && ein.teilnehmer) {
          if (ein.sitzung) merkeSchreiben(SPEICHER_SITZUNG, ein.sitzung)
          merkeSchreiben(SPEICHER_ZUGANG, null)
          merkeSchreiben(SPEICHER_TRESOR, '1')
        } else if (ein.status === 429 || ein.grund === 'bremse') {
          wiederProblem = TEXTE.wieder.bremse
        } else if (ein.grund === 'netz' || ein.grund === 'server') {
          wiederProblem = TEXTE.b.fehler.allgemein
        } else {
          wiederProblem = TEXTE.wieder.link
        }
      }

      const beleg = merkeLesen(SPEICHER_SITZUNG)
      const zugang = merkeLesen(SPEICHER_ZUGANG)
      const imTresor = merkeLesen(SPEICHER_TRESOR)

      /* Das Testlabor legt hier ab, welcher Zustand gezeigt werden soll. Der
         Zettel gilt genau einmal und nur im Testmodus. */
      const szene = probeAktiv() ? sitzungLesen(SPEICHER_SZENE) : null
      if (szene) sitzungSchreiben(SPEICHER_SZENE, null)

      /* Ein Aufruf fuer alles: oeffentliche Kennzahlen, der Tresorkoenig und
         — falls ein Sitzungsbeleg vorliegt — der eigene Deckel samt
         Bestwerten. Der Server prueft die Signatur und liest die Zeile
         frisch; die E-Mail-Adresse bleibt dabei auf dem Server. */
      const antwort = await terminalRuf({ aktion: 'zustand', sitzung: beleg }, abbruch.signal)
      if (abbruch.signal.aborted) return

      if (antwort.ok) {
        setKennzahlen({
          aktiviert: antwort.aktiviert ?? 0,
          ...antwort.einstellungen,
        })
      }

      if (szene) {
        await szeneStellen(szene, abbruch.signal)
        return
      }

      if (antwort.ok && antwort.teilnehmer) {
        setSitzung(beleg)
        setTeilnehmer(antwort.teilnehmer)
        setSpiele(antwort.spiele ?? null)
        /* Wer aktiviert hat, war im Tresor. Nach einem Reload soll die
           Inszenierung nicht noch einmal laufen. */
        merkeSchreiben(SPEICHER_TRESOR, '1')
        setAnsicht('c')
        return
      }

      /* Kein (mehr) gueltiger Sitzungsbeleg: wegwerfen, sonst versucht es
         die Seite bei jedem Aufruf erneut. */
      if (beleg && antwort.ok && !antwort.teilnehmer) merkeSchreiben(SPEICHER_SITZUNG, null)

      /* Wer den Wieder-Login wollte oder mit einem verbrauchten Link kam,
         bekommt das Formular — auch wenn hier noch ein Code von frueher
         liegt. */
      if (wiederProblem || wiederGewuenscht) {
        if (wiederProblem) setWiederMeldung({ text: wiederProblem, fehler: true })
        wiederZeigen()
        return
      }

      /* Der Code sitzt noch, die Aktivierung fehlt. Wer schon einmal durch
         das Schloss geflogen ist, landet direkt im Tresor; wer nur den Code
         hat, steht wieder vor der geschlossenen Truhe. */
      if (zugang) setAnsicht(imTresor ? 'b' : 'z')
    }

    laden()
    return () => abbruch.abort()
    /* spaeter und schluesselTippen sind ueber die ganze Lebenszeit dieselben
       bzw. sollen bewusst den Stand der Ankunft sehen. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------------------------------------------------------- */
  /* Zustand A — Code pruefen                                         */
  /* ---------------------------------------------------------------- */

  async function codePruefen(ereignis) {
    ereignis.preventDefault()
    if (codePruefung || buehne) return

    const code = ziffern.join('')
    if (code.length < LAENGE) {
      setCodeFehler(TEXTE.a.fehler)
      return
    }

    setCodePruefung(true)
    setCodeFehler(null)

    const antwort = await terminalRuf({ aktion: 'code', code })
    setCodePruefung(false)

    if (antwort.ok && antwort.zugang) {
      merkeSchreiben(SPEICHER_ZUGANG, antwort.zugang)

      /* Erst jetzt, nach dem Ja vom Server, beginnt die Inszenierung. Sie
         haelt die Eingabe an, zeigt ACCESS GRANTED und setzt die Seite
         danach auf Zustand Z — Truhe noch zu. */
      const sanft = sanftGewuenscht()
      setBuehne('gewaehrt')
      spaeter(
        () => {
          setZiffern(LEERER_CODE)
          setBuehne(null)
          setAnsicht('z')
        },
        sanft ? BUEHNE_SANFT_MS.gewaehrt : BUEHNE_MS.gewaehrt,
      )
      return
    }

    /* Kein Wort darueber, was richtig gewesen waere. Bei Netz- oder
       Serverproblemen eine ehrliche andere Meldung — ein "falsch" waere
       hier eine Luege. */
    if (antwort.grund === 'netz' || antwort.grund === 'server') {
      setCodeFehler(TEXTE.b.fehler.allgemein)
    } else {
      setCodeFehler(TEXTE.a.fehler)
    }
  }

  /* ---------------------------------------------------------------- */
  /* Zustand Z — die drei Punkte auf der Truhe                        */
  /* ---------------------------------------------------------------- */

  /** Ein Wort unter der Truhe, das von selbst wieder geht. */
  const wortZeigen = useCallback(
    (text, punktArt, dauer) => {
      punktNrRef.current += 1
      const nr = punktNrRef.current
      setPunktWort(text)
      if (punktArt) {
        setPunkt(punktArt)
        spaeter(() => {
          if (punktNrRef.current === nr) setPunkt(null)
        }, dauer)
      }
      spaeter(() => {
        if (punktNrRef.current === nr) setPunktWort(null)
      }, PUNKT_MS.wort)
    },
    [spaeter],
  )

  function schlossTippen() {
    if (buehne) return
    setStossNr((n) => n + 1)
    wortZeigen(TEXTE.z.schlossText, 'schloss', PUNKT_MS.schloss)
  }

  function zeichenTippen() {
    if (buehne) return
    wortZeigen(TEXTE.z.zeichenText, 'zeichen', PUNKT_MS.zeichen)
  }

  /* Das Schluesselloch ist der eigentliche Eingang. Erst ein Satz, der den
     Unterschied zum Blick von vorhin benennt — dann der Flug hinein. */
  function schluesselTippen() {
    if (buehne) return
    punktNrRef.current += 1
    setPunkt(null)
    setPunktWort(TEXTE.z.eintritt)

    const zeiten = sanftGewuenscht() ? BUEHNE_SANFT_MS : BUEHNE_MS
    setBuehne('vorflug')
    /* Kein Seitenwechsel: die Spalte tritt zurueck, die Truhe bleibt stehen
       und die Kamera faehrt in dasselbe Schloss, das eben noch da war. */
    szeneSetzen('flug')
    spaeter(() => setBuehne('schluessel'), zeiten.vorflug)
    spaeter(
      () => {
        merkeSchreiben(SPEICHER_TRESOR, '1')
        setPunktWort(null)
        setBuehne(null)
        szeneSetzen(null)
        setAnsicht(teilnehmer ? 'c' : 'b')
      },
      zeiten.vorflug + zeiten.schluessel,
    )
  }

  /* ---------------------------------------------------------------- */
  /* Zustand A — dieselbe Truhe, nur verschlossen                      */
  /* ---------------------------------------------------------------- */

  /* Die Truhe ist ein Gegenstand und keine Verzierung. Sie reagiert, bevor
     irgendein Code eingegeben wurde — sonst haelt man sie fuer ein Bild.
     Jeder Stoss bekommt einen Satz, nie zweimal derselbe hintereinander. */
  function naechsterRuf() {
    const rufe = TEXTE.wach.truheRufe
    let i = Math.floor(Math.random() * rufe.length)
    if (i === rufNrRef.current) i = (i + 1) % rufe.length
    rufNrRef.current = i
    return rufe[i]
  }

  function truheTippen() {
    if (buehne) return
    setStossNr((n) => n + 1)
    wortZeigen(naechsterRuf(), 'truhe', PUNKT_MS.truhe)
  }

  function schlossTippenA() {
    if (buehne) return
    setStossNr((n) => n + 1)
    wortZeigen(TEXTE.wach.schloss, 'schloss', PUNKT_MS.schloss)
  }

  function zeichenTippenA() {
    if (buehne) return
    wortZeigen(TEXTE.wach.zeichen, 'zeichen', PUNKT_MS.zeichen)
  }

  /**
   * Das Schluesselloch ohne Code.
   *
   * Die Kamera faehrt heran, und fuer einen Moment sieht man durch das Loch
   * in den Tresor: nur Andeutungen der Gewinne, kein Knopf, kein Weg hinein.
   * Dann schiebt sich ZUGANG GESPERRT davor und alles faehrt zurueck. Zustand,
   * Speicher und Ansicht bleiben dabei unberuehrt.
   */
  function schluesselTippenA() {
    if (buehne) return
    punktNrRef.current += 1
    setPunkt(null)
    setPunktWort(null)
    setBuehneWort(null)
    setBuehne('spaehen')
    szeneSetzen('spaehen')

    const sanft = sanftGewuenscht()
    spaeter(
      () => {
        setBuehne(null)
        szeneSetzen(null)
      },
      sanft ? BUEHNE_SANFT_MS.spaehen : BUEHNE_MS.spaehen,
    )
  }

  /* ---------------------------------------------------------------- */
  /* Zustand B — Deckel aktivieren                                    */
  /* ---------------------------------------------------------------- */

  function aendern(feld, wert) {
    setFormular((alt) => ({ ...alt, [feld]: wert }))
    setFeldFehler((alt) => (alt[feld] ? { ...alt, [feld]: undefined } : alt))
  }

  /* Hoeflichkeitspruefung im Browser. Die verbindliche Pruefung — auch die
     auf schon aktivierte Nummern — macht der Server. */
  function aktivierDaten() {
    const nummer = deckelNummer(formular.deckel)
    const handle = instagramNormalisieren(formular.instagram)
    const email = formular.email.trim()

    const fehler = {}
    if (nummer == null) fehler.deckel = fuelle(TEXTE.b.fehler.nummer, { gesamt: GESAMT })
    if (!handle) fehler.instagram = TEXTE.b.fehler.instagram
    if (!EMAIL_MUSTER.test(email)) fehler.email = TEXTE.b.fehler.email
    if (!formular.folgt) fehler.folgt = fuelle(TEXTE.b.fehler.folgt, { handle: HANDLE })
    /* Die Leaderboard-Einwilligung wird hier bewusst nicht geprueft: sie ist
       freiwillig. Ohne sie gilt die Teilnahme genauso. */

    setFeldFehler(fehler)
    if (Object.keys(fehler).length > 0) return null
    return { nummer, handle, email }
  }

  async function aktivieren(ereignis) {
    ereignis.preventDefault()
    if (sendet) return
    const daten = aktivierDaten()
    if (daten) await absenden(daten, false)
  }

  /* JA im Warnfenster: derselbe Aufruf, diesmal mit der ausdruecklichen
     Bestaetigung. Der Server legt dann einen weiteren Besitzanspruch an —
     die Nummer bleibt ein Los. */
  async function belegtJa() {
    if (sendet) return
    const daten = aktivierDaten()
    if (!daten) {
      setBelegtFrage(false)
      return
    }
    await absenden(daten, true)
  }

  function belegtNein() {
    setBelegtFrage(false)
    requestAnimationFrame(() => document.getElementById('trm-deckel')?.focus())
  }

  async function absenden({ nummer, handle, email }, besitzBestaetigt) {
    setSendet(true)

    const antwort = await terminalRuf({
      aktion: 'aktivieren',
      zugang: merkeLesen(SPEICHER_ZUGANG),
      deckel: nummer,
      instagram: handle,
      email,
      folgt: true,
      leaderboard: formular.leaderboard === true,
      website: formular.website,
      ...(besitzBestaetigt ? { besitzBestaetigt: true } : {}),
    })

    setSendet(false)
    setBelegtFrage(false)

    if (antwort.ok && antwort.teilnehmer) {
      if (antwort.sitzung) {
        merkeSchreiben(SPEICHER_SITZUNG, antwort.sitzung)
        setSitzung(antwort.sitzung)
      }
      merkeSchreiben(SPEICHER_ZUGANG, null)
      merkeSchreiben(SPEICHER_TRESOR, '1')
      setTeilnehmer(antwort.teilnehmer)
      if (antwort.aktiviert != null) {
        setKennzahlen((alt) => ({ ...(alt ?? {}), aktiviert: antwort.aktiviert }))
      }
      setFormular(LEERES_FORMULAR)
      setAnsicht('c')
      return
    }

    if (antwort.grund === 'belegt' || antwort.grund === 'doppelt') {
      if (besitzBestaetigt) setFeldFehler({ deckel: TEXTE.b.doppelt })
      else setBelegtFrage(true)
      return
    }

    /* Der Zugangsbeleg ist abgelaufen oder wurde manipuliert: zurueck an den
       Anfang, mit einer Meldung, die sagt warum. */
    if (antwort.grund === 'zugang') {
      merkeSchreiben(SPEICHER_ZUGANG, null)
      merkeSchreiben(SPEICHER_TRESOR, null)
      setCodeFehler('Der Zugang ist abgelaufen. Bitte gib den Code noch einmal ein.')
      setAnsicht('a')
      return
    }

    if (antwort.grund === 'nummer') {
      setFeldFehler({ deckel: fuelle(TEXTE.b.fehler.nummer, { gesamt: GESAMT }) })
      return
    }

    setFeldFehler({ allgemein: TEXTE.b.fehler.allgemein })
  }

  /* ---------------------------------------------------------------- */
  /* Zustand C — Ergebnis einer Spielrunde                            */
  /* ---------------------------------------------------------------- */

  /**
   * Nach jeder Runde schickt der Server die eigenen Bestwerte und die eigene
   * Platzierung mit, samt Gesamtranking. Alles kommt direkt in den Zustand —
   * die Spitze des Gesamtrankings steht darin, ein zweiter Aufruf entfaellt.
   *
   * Gerechnet wird hier nichts. Welcher Lauf zaehlt, entscheidet der Server.
   */
  const ergebnisUebernehmen = useCallback((daten) => {
    if (!daten?.ok) return

    setSpiele((alt) => ({
      beste: daten.beste ?? alt?.beste ?? null,
      gesamt: daten.gesamt ?? alt?.gesamt ?? null,
      platz: daten.platz ?? null,
      gelistet: daten.gelistet === true,
      gesamtranking: daten.gesamtranking ?? alt?.gesamtranking ?? null,
    }))
  }, [])

  /* ---------------------------------------------------------------- */
  /* Zustand C — Einwilligung ins oeffentliche Leaderboard             */
  /* ---------------------------------------------------------------- */

  /**
   * An oder aus, jederzeit. Der Server aendert nur die Einwilligung und ihren
   * Zeitstempel — Teilnahme, Scores und Ziehung bleiben, wie sie sind. Danach
   * werden Platz und Tresorkoenig frisch geholt: ein Widerruf nimmt den Namen
   * sofort aus allen Listen.
   */
  async function einwilligungSpeichern(ok) {
    if (einwSendet) return
    const E = TEXTE.c.einwilligung
    setEinwSendet(true)
    setEinwMeldung(null)

    const antwort = await einwilligungSetzen(merkeLesen(SPEICHER_SITZUNG), ok)
    setEinwSendet(false)

    if (!antwort.ok) {
      setEinwMeldung({
        text: antwort.status === 429 ? TEXTE.wieder.bremse : E.fehler,
        fehler: true,
      })
      return
    }

    const stand = antwort.leaderboardOk === true
    setTeilnehmer((alt) => (alt ? { ...alt, leaderboardOk: stand } : alt))
    setEinwEntwurf(null)
    setEinwMeldung({ text: stand ? E.gespeichertAn : E.gespeichertAus, fehler: false })

    const neu = await terminalRuf({ aktion: 'zustand', sitzung: merkeLesen(SPEICHER_SITZUNG) })
    if (neu?.ok && neu.spiele) setSpiele(neu.spiele)
  }

  /* ---------------------------------------------------------------- */

  const seo = (
    <Seo
      title="Bierdeckel-Aktion | VIDEKO Küchen"
      description="Rätsel lösen, Deckel aktivieren, Live-Ziehung abwarten. Die Aktionsseite zum VIDEKO Bierdeckel."
      canonicalPath="/terminal"
      noindex
      nofollow
    />
  )

  /* Der Weg zur oeffentlichen Ziehung. Sie ist ohne Anmeldung sichtbar —
     auch fuer Leute, die nur zuschauen wollen. */
  const ziehungZeile = (zusatz = '') => (
    <p className={zusatz ? `trm-zeile ${zusatz}` : 'trm-zeile'}>
      <span className="trm-zeile__text">{TEXTE.ziehungZeile}</span>
      <Link className="trm-cta trm-cta--umriss trm-cta--klein" to="/terminal/ziehung">
        <Radio size={16} aria-hidden="true" />
        {TEXTE.ziehungCta}
      </Link>
    </p>
  )

  const ranglisteZeile = (
    <p className="trm-zeile">
      <span className="trm-zeile__text">{TEXTE.r.sub}</span>
      <Link className="trm-cta trm-cta--umriss trm-cta--klein" to="/terminal/rangliste">
        <Ikon name="pokal" size={16} />
        {TEXTE.r.cta}
      </Link>
    </p>
  )

  /* ================================================================ */
  /* Zustand C — aktiviert, vollstaendiger Tresor                      */
  /* ================================================================ */

  /* ================================================================ */
  /* Bereits aktiviert? — Formular fuer den Zugangslink               */
  /* ================================================================ */

  /**
   * Zugangslink anfordern. Die Seite zeigt danach immer denselben Satz —
   * sie weiss selbst nicht, ob zur Adresse ein Deckel gehoert, und der
   * Server sagt es ihr auch nicht.
   */
  async function wiederSenden(ereignis) {
    ereignis.preventDefault()
    if (wiederSendet) return

    const email = wiederEmail.trim()
    if (!email || email.length > FELD_GRENZEN.email || !EMAIL_MUSTER.test(email)) {
      setWiederFehler(TEXTE.wieder.fehlerEmail)
      setWiederMeldung(null)
      return
    }

    setWiederSendet(true)
    setWiederFehler(null)
    setWiederMeldung(null)
    setWiederTestLink(null)

    const antwort = await wiederAnfordern(email)
    setWiederSendet(false)

    if (antwort.ok) {
      setWiederMeldung({ text: WIEDER_NEUTRAL, fehler: false })
      /* Nur im Testmodus: der Link, der sonst per Mail kaeme. */
      setWiederTestLink(typeof antwort.testLink === 'string' ? antwort.testLink : null)
      return
    }
    if (antwort.grund === 'felder') {
      setWiederFehler(TEXTE.wieder.fehlerEmail)
    } else if (antwort.status === 429 || antwort.grund === 'bremse') {
      setWiederMeldung({ text: TEXTE.wieder.bremse, fehler: true })
    } else {
      setWiederMeldung({ text: TEXTE.b.fehler.allgemein, fehler: true })
    }
  }

  function wiederBlock(zusatz = '') {
    return (
      <div className={`trm-wieder ${zusatz}`} id="bereits-aktiviert">
        {wiederOffen ? (
          <section className="trm-karte trm-wieder__karte" aria-labelledby="trm-wieder-titel">
            <div className="trm-karte__kopf">
              <KeyRound size={18} className="trm-ikon" aria-hidden="true" />
              <h2 className="trm-karte__titel" id="trm-wieder-titel">
                {TEXTE.wieder.frage}
              </h2>
            </div>
            <p className="trm-wieder__text">{TEXTE.wieder.sub}</p>

            <form onSubmit={wiederSenden} noValidate>
              <Feld
                id="trm-wieder-email"
                label={TEXTE.wieder.label}
                hilfe={TEXTE.wieder.hilfe}
                fehler={wiederFehler}
              >
                {({ hilfeId, fehlerId }) => (
                  <input
                    id="trm-wieder-email"
                    className="trm-eingabe"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    maxLength={FELD_GRENZEN.email}
                    value={wiederEmail}
                    onChange={(e) => setWiederEmail(e.target.value)}
                    aria-invalid={wiederFehler ? 'true' : 'false'}
                    aria-describedby={[hilfeId, fehlerId].filter(Boolean).join(' ') || undefined}
                  />
                )}
              </Feld>

              <button type="submit" className="trm-cta" disabled={wiederSendet}>
                {wiederSendet ? TEXTE.wieder.sendet : TEXTE.wieder.cta}
              </button>
            </form>

            <div aria-live="polite">
              {wiederMeldung ? (
                <p className={`trm-meldung trm-wieder__meldung${wiederMeldung.fehler ? ' trm-meldung--fehler' : ''}`}>
                  {wiederMeldung.text}
                </p>
              ) : null}
              {wiederTestLink ? (
                <a
                  className="trm-cta trm-cta--umriss trm-cta--klein trm-wieder__test"
                  href={`/terminal#wieder=${wiederTestLink}`}
                >
                  {TEXTE.wieder.testLink}
                </a>
              ) : null}
            </div>
          </section>
        ) : (
          <button type="button" className="trm-cta trm-cta--umriss trm-cta--klein trm-wieder__knopf" onClick={wiederZeigen}>
            <KeyRound size={16} aria-hidden="true" />
            {TEXTE.wieder.frage}
          </button>
        )}
      </div>
    )
  }

  if (ansicht === 'c' && teilnehmer) {
    const nummer = deckelText(teilnehmer.deckel)
    const termin = terminText(kennzahlen?.naechsteZiehung)
    const uhr = <Uhr zielIso={kennzahlen?.naechsteZiehung} />

    /* Spitze und eigener Stand kommen aus dem Gesamtranking ueber die fuenf
       Hauptgames (maximal 5.000). Die alte Summe aus Truhenknacker und
       Goldrausch (`koenig`, `spiele.gesamt`) liefert der Server weiter, sie
       wird hier aber nicht mehr gezeigt. Ohne Einwilligung gibt es keinen
       oeffentlichen Platz — das steht dann auch so da. */
    const rang = spiele?.gesamtranking ?? null
    const spitze = rang?.eintraege?.[0] ?? null
    const eigenerPlatz = rang?.gelistet ? rang.eigenerPlatz ?? null : null
    const eigeneGesamt = rang?.gelistet ? rang.eigenePunkte ?? null : null

    const E = TEXTE.c.einwilligung
    const oeffentlich = teilnehmer.leaderboardOk === true
    const entwurf = einwEntwurf ?? oeffentlich
    const spieleSichtbar = aktiveSpiele(
      laborSpiel ? { ...kennzahlen?.spieleAktiv, [laborSpiel]: true } : kennzahlen?.spieleAktiv,
      kennzahlen?.spieleReihenfolge,
    )

    return (
      <>
        {seo}
        <Buehne art={buehne} wort={buehneWort} />
        <TerminalRahmen>
          <div className="trm-abzeichen">
            <CheckCircle2 size={30} className="trm-abzeichen__haken" aria-hidden="true" />
            <span className="trm-abzeichen__wort">{TEXTE.c.status}</span>
          </div>

          <h1 className="trm-titel trm-gold">{TEXTE.c.titel}</h1>
          <p className="trm-sub">{fuelle(TEXTE.c.sub, { deckel: nummer })}</p>

          {/* Der Tresor ist offen. Steht absichtlich ueber der Raute: es ist
              die Antwort auf den Flug durch das Schloss, nicht eine Karte
              irgendwo weiter unten. */}
          <p className="trm-frei">
            <Ikon name="schluessel" size={17} className="trm-ikon" />
            <b className="trm-frei__wort">{TEXTE.t.freiTitel}</b>
            <span className="trm-frei__text">{TEXTE.t.freiText}</span>
          </p>

          <Raute />

          <Truhe>
            <Schriftzug />
            <p className="trm-truhe__notiz">
              <b>{TEXTE.c.truheTitel}</b>
              {TEXTE.c.truheText}
            </p>
          </Truhe>

          <section
            className={uhr ? 'trm-karte' : 'trm-karte trm-karte--kompakt'}
            aria-labelledby="trm-uhr-titel"
          >
            <div className="trm-karte__kopf">
              <Ikon name="uhr" size={22} className="trm-ikon" />
              <h2 className="trm-karte__titel" id="trm-uhr-titel">
                {uhr ? TEXTE.c.countdownLabel : TEXTE.d.naechsteLabel}
              </h2>
            </div>
            {uhr ? (
              <>
                {uhr}
                <p className="trm-fuss-notiz">
                  {termin ? `${termin} Uhr. ` : ''}
                  {TEXTE.c.countdownNotiz}
                </p>
              </>
            ) : (
              <p className="trm-metrik__text">{TEXTE.c.countdownOffen}</p>
            )}
          </section>

          <section className="trm-karte" aria-labelledby="trm-status-titel">
            <div className="trm-karte__kopf">
              <Ikon name="schluessel" size={22} className="trm-ikon" />
              <h2 className="trm-karte__titel" id="trm-status-titel">
                {TEXTE.c.statusLabel}
              </h2>
            </div>

            {/* Die letzte Zeile ist eine Aufgabe, keine Bestaetigung — sie
                bekommt deshalb ein offenes Symbol und data-offen. Die
                Unterscheidung steht im Wortlaut, nicht nur in der Farbe. */}
            <ul className="trm-status">
              {TEXTE.c.statusZeilen.map((zeile, index) => {
                const offen = index === TEXTE.c.statusZeilen.length - 1
                return (
                  <li key={zeile} data-offen={offen ? '1' : '0'}>
                    {offen ? (
                      <Circle size={17} aria-hidden="true" />
                    ) : (
                      <Check size={17} aria-hidden="true" />
                    )}
                    <span>{fuelle(zeile, { deckel: nummer })}</span>
                  </li>
                )
              })}
            </ul>
            <p className="trm-feld__hilfe">{TEXTE.c.statusNotiz}</p>
          </section>

          <div className="trm-metriken trm-metriken--eins">
            <Metrik
              ikon="deckel"
              label={TEXTE.c.deckelLabel}
              wert={kennzahlen?.aktiviert ?? null}
              von={TERMINAL_KAMPAGNE.deckelGesamt}
              notiz={TEXTE.c.deckelNotiz}
            />
          </div>

          <Mission
            follower={kennzahlen?.followerZahl ?? TERMINAL_KAMPAGNE.followerStart}
            gewinne={kennzahlen?.meilensteinGewinne}
          />

          {/* Der Tresorkoenig. Oeffentlich ist daran nur, was die Person dafuer
              freigegeben hat: Instagram-Name und Punktzahl. */}
          <section className="trm-karte trm-koenig" aria-labelledby="trm-koenig-titel">
            <div className="trm-karte__kopf">
              <Ikon name="krone" size={22} className="trm-ikon" />
              <h2 className="trm-karte__titel" id="trm-koenig-titel">
                {TEXTE.t.koenigLabel}
              </h2>
            </div>

            {spitze ? (
              <>
                {/* Die Krone als eigenes Zeichen, nicht als Emoji im Namen:
                    so bleibt der Name kopierbar und die Krone skalierbar. */}
                <span className="trm-koenig__krone" aria-hidden="true">
                  <Ikon name="krone" size={34} />
                </span>
                <p className="trm-koenig__name">
                  {spitze.instagram ? `@${spitze.instagram}` : TEXTE.r.grAnonym}
                </p>
                <p className="trm-koenig__punkte">
                  {fuelle(TEXTE.t.koenigPunkte, { punkte: zahl(spitze.punkte) })}
                </p>
                <p className="trm-koenig__frage">{TEXTE.t.koenigFrage}</p>
              </>
            ) : (
              <p className="trm-metrik__text">{TEXTE.t.koenigLeer}</p>
            )}

            {/* Kein neuer Weg, nur ein kurzer: die Games stehen auf derselben
                Seite ein Stueck weiter unten. */}
            <a className="trm-cta trm-cta--klein trm-koenig__taste" href="#trm-games">
              <Ikon name="spiel" size={16} />
              {TEXTE.t.koenigCta}
            </a>

            <p className="trm-koenig__eigen">
              {eigenerPlatz
                ? `${fuelle(TEXTE.r.deinPlatz, { platz: eigenerPlatz })}${
                    eigeneGesamt != null ? ` — ${zahl(eigeneGesamt)}` : ''
                  }`
                : teilnehmer.leaderboardOk
                  ? TEXTE.r.ohnePlatz
                  : TEXTE.r.ohneEinwilligung}
            </p>

            {ranglisteZeile}
          </section>

          {/* Gesamtranking ueber die fuenf Hauptgames: eigener Platz, Rangpunkte
              je Game, fehlende Games. Alles fertig vom Server. */}
          <GesamtrankingKarte daten={spiele?.gesamtranking} />

          {/* Oeffentlich oder nicht — jederzeit umzustellen. Ein Widerruf
              nimmt nur den Namen aus den Listen, nichts sonst. */}
          <section
            className="trm-karte trm-einwilligung"
            id="einwilligung"
            aria-labelledby="trm-einw-titel"
          >
            <div className="trm-karte__kopf">
              <Ikon name="pokal" size={22} className="trm-ikon" />
              <h2 className="trm-karte__titel" id="trm-einw-titel">
                {E.titel}
              </h2>
            </div>

            {oeffentlich ? null : (
              <div className="trm-einwilligung__noch">
                <p className="trm-metrik__text">{E.noch}</p>
                <button
                  type="button"
                  className="trm-cta trm-cta--klein"
                  onClick={() => einwilligungSpeichern(true)}
                  disabled={einwSendet}
                >
                  {E.freischalten}
                </button>
              </div>
            )}

            <label className="trm-einwilligung__haken" htmlFor="trm-einw-haken">
              <input
                id="trm-einw-haken"
                type="checkbox"
                checked={entwurf}
                onChange={(e) => {
                  setEinwEntwurf(e.target.checked)
                  setEinwMeldung(null)
                }}
              />
              <span>{E.haken}</span>
            </label>

            <p className="trm-einwilligung__status" data-an={oeffentlich ? '1' : '0'}>
              {oeffentlich ? E.an : E.aus}
            </p>

            <button
              type="button"
              className="trm-cta trm-cta--umriss trm-cta--klein trm-einwilligung__speichern"
              onClick={() => einwilligungSpeichern(entwurf)}
              disabled={einwSendet}
            >
              {einwSendet ? E.speichert : E.speichern}
            </button>

            <div aria-live="polite">
              {einwMeldung ? (
                <p className={`trm-meldung${einwMeldung.fehler ? ' trm-meldung--fehler' : ''}`}>
                  {einwMeldung.text}
                </p>
              ) : null}
            </div>

            <p className="trm-feld__hilfe">{E.hinweis}</p>
          </section>

          {/* Die Games. Zwei Karten, ein Hinweis — und kein Wort, das den
              Eindruck erwecken koennte, Punkte wuerden die Ziehung
              beeinflussen. */}
          <section className="trm-spiele" id="trm-games" aria-labelledby="trm-games-titel">
            <div className="trm-karte__kopf trm-spiele__kopf">
              <Ikon name="spiel" size={22} className="trm-ikon" />
              <h2 className="trm-karte__titel" id="trm-games-titel">
                {TEXTE.t.gamesLabel}
              </h2>
            </div>

            {/* Ausgeblendete Spiele fehlen hier nur — ihre Scores bleiben. */}
            {spieleSichtbar.map((s) => {
              const best = spiele?.beste?.[s.key] ?? null
              const Bauteil = SPIEL_BAUTEILE[s.key]
              if (Bauteil) {
                return <Bauteil key={s.key} sitzung={sitzung} best={best} onErgebnis={ergebnisUebernehmen} />
              }
              const Nachgeladen = SPIEL_NACHLADEN[s.key]
              if (!Nachgeladen) return null
              if (!offeneSpiele[s.key]) {
                return (
                  <SpielWahl
                    key={s.key}
                    spiel={s}
                    best={best}
                    oeffnen={() => setOffeneSpiele((o) => ({ ...o, [s.key]: true }))}
                  />
                )
              }
              return (
                <Suspense
                  key={s.key}
                  fallback={
                    <div className="trm-karte trm-spielwahl trm-spielwahl--laedt" id={s.key}>
                      {TEXTE.g.laedt}
                    </div>
                  }
                >
                  <Nachgeladen sitzung={sitzung} best={best} onErgebnis={ergebnisUebernehmen} />
                </Suspense>
              )
            })}

            <p className="trm-fuss-notiz">{TEXTE.g.hinweis}</p>
          </section>

          {ziehungZeile()}

          <Gewinne />
        </TerminalRahmen>
      </>
    )
  }

  /* ================================================================ */
  /* Zustand B — im Tresor, Deckel noch nicht aktiviert               */
  /* ================================================================ */

  if (ansicht === 'b') {
    /* Ohne Deckel: genau ein Game im Practice Mode, die anderen aktiven
       Games sichtbar, aber gesperrt. Gespeichert wird hier nichts. */
    const spieleOhneDeckel = aktiveSpiele(kennzahlen?.spieleAktiv, kennzahlen?.spieleReihenfolge)
    const practiceKey = kennzahlen?.guestPracticeGame ?? 'leitungsfinder'
    const practiceSpiel = spieleOhneDeckel.find((s) => s.key === practiceKey) ?? null
    const gesperrteSpiele = spieleOhneDeckel.filter((s) => s.key !== practiceKey)
    const PracticeBauteil = practiceSpiel
      ? SPIEL_BAUTEILE[practiceSpiel.key] ?? SPIEL_NACHLADEN[practiceSpiel.key] ?? null
      : null
    const practiceWeg = {
      onCta: () => {
        document.getElementById('trm-aktivieren')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        document.getElementById('trm-deckel')?.focus({ preventScroll: true })
      },
    }
    const B = TEXTE.b.belegt

    return (
      <>
        {seo}
        <Buehne art={buehne} wort={buehneWort} />
        <TerminalRahmen>
          <div className="trm-abzeichen">
            <Ikon name="schluessel" size={28} className="trm-abzeichen__haken" />
            <span className="trm-abzeichen__wort">{TEXTE.t.titel}</span>
          </div>

          <h1 className="trm-titel trm-gold">{TEXTE.t.gateTitel}</h1>
          <p className="trm-sub">{TEXTE.t.gateText}</p>

          <ol className="trm-stufen">
            {SCHRITTE.map((schritt, index) => {
              const jetzt = index === SCHRITTE.length - 1
              return (
                <li
                  key={schritt}
                  className={`trm-stufe ${jetzt ? 'trm-stufe--jetzt' : 'trm-stufe--fertig'}`}
                >
                  <span className="trm-stufe__kreis">
                    {jetzt ? index + 1 : <Check size={19} aria-hidden="true" />}
                    {!jetzt ? <span className="trm-nur-sr">erledigt</span> : null}
                  </span>
                  <span className="trm-stufe__text">
                    {index + 1}. {schritt}
                  </span>
                </li>
              )
            })}
          </ol>

          <form className="trm-karte" id="trm-aktivieren" onSubmit={aktivieren} noValidate>
            <Feld
              id="trm-deckel"
              label={TEXTE.b.felder.nummer}
              hilfe={fuelle(TEXTE.b.felder.nummerHilfe, { gesamt: GESAMT })}
              fehler={feldFehler.deckel}
              nach={`/ ${TERMINAL_KAMPAGNE.deckelGesamt}`}
            >
              {({ hilfeId, fehlerId }) => (
                <input
                  id="trm-deckel"
                  className="trm-eingabe"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={formular.deckel}
                  onChange={(e) => aendern('deckel', e.target.value.replace(/\D/g, '').slice(0, 7))}
                  placeholder={TEXTE.b.felder.nummerPlatz}
                  aria-describedby={[hilfeId, fehlerId].filter(Boolean).join(' ') || undefined}
                  aria-invalid={feldFehler.deckel ? 'true' : undefined}
                  required
                />
              )}
            </Feld>

            <Feld
              id="trm-instagram"
              label={TEXTE.b.felder.instagram}
              fehler={feldFehler.instagram}
            >
              {({ fehlerId }) => (
                <input
                  id="trm-instagram"
                  className="trm-eingabe"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={FELD_GRENZEN.instagram + 1 /* ein @ darf mit */}
                  value={formular.instagram}
                  onChange={(e) => aendern('instagram', e.target.value)}
                  placeholder={TEXTE.b.felder.instagramPlatz}
                  aria-describedby={fehlerId}
                  aria-invalid={feldFehler.instagram ? 'true' : undefined}
                  required
                />
              )}
            </Feld>

            <Feld
              id="trm-email"
              label={TEXTE.b.felder.email}
              hilfe={TEXTE.b.felder.emailHilfe}
              fehler={feldFehler.email}
            >
              {({ hilfeId, fehlerId }) => (
                <input
                  id="trm-email"
                  className="trm-eingabe"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={FELD_GRENZEN.email}
                  value={formular.email}
                  onChange={(e) => aendern('email', e.target.value)}
                  placeholder={TEXTE.b.felder.emailPlatz}
                  aria-describedby={[hilfeId, fehlerId].filter(Boolean).join(' ') || undefined}
                  aria-invalid={feldFehler.email ? 'true' : undefined}
                  required
                />
              )}
            </Feld>

            {/* Honigtopf. Kein Mensch sieht dieses Feld; Formularroboter
                fuellen es gern. Ist es belegt, verwirft der Server still. */}
            <div className="trm-topf" aria-hidden="true">
              <label htmlFor="trm-website">Website</label>
              <input
                id="trm-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={formular.website}
                onChange={(e) => aendern('website', e.target.value)}
              />
            </div>

            <label className="trm-haken" htmlFor="trm-folgt">
              <input
                id="trm-folgt"
                type="checkbox"
                checked={formular.folgt}
                onChange={(e) => aendern('folgt', e.target.checked)}
                aria-describedby={feldFehler.folgt ? 'trm-folgt-fehler' : undefined}
                aria-invalid={feldFehler.folgt ? 'true' : undefined}
                required
              />
              <span>{fuelle(TEXTE.b.felder.haken, { handle: HANDLE })}</span>
            </label>
            {feldFehler.folgt ? (
              <p className="trm-feld__fehler" id="trm-folgt-fehler" role="alert">
                {feldFehler.folgt}
              </p>
            ) : null}

            {/* Die zweite Einwilligung ist freiwillig und hat mit der
                Teilnahme nichts zu tun. Sie steht deshalb unter dem
                Pflichthaken, ohne Sternchen und mit eigenem Hinweis. */}
            <label className="trm-haken trm-haken--frei" htmlFor="trm-leaderboard">
              <input
                id="trm-leaderboard"
                type="checkbox"
                checked={formular.leaderboard}
                onChange={(e) => aendern('leaderboard', e.target.checked)}
                aria-describedby="trm-leaderboard-hilfe"
              />
              <span>{TEXTE.b.felder.leaderboard}</span>
            </label>
            <p className="trm-feld__hilfe" id="trm-leaderboard-hilfe">
              {TEXTE.b.felder.leaderboardHilfe}
            </p>

            <a
              className="trm-cta trm-cta--umriss"
              href={TERMINAL_KAMPAGNE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram size={18} aria-hidden="true" />
              {TEXTE.b.instagramCta}
              <span className="trm-nur-sr">, öffnet in neuem Tab</span>
            </a>

            <button type="submit" className="trm-cta" disabled={sendet}>
              {sendet ? 'Wird aktiviert …' : TEXTE.b.cta}
            </button>

            {feldFehler.allgemein ? (
              <p className="trm-meldung trm-meldung--fehler" role="alert">
                {feldFehler.allgemein}
              </p>
            ) : null}

            <p className="trm-fuss-notiz">{TEXTE.b.ohne}</p>
          </form>

          <section className="trm-karte" aria-labelledby="trm-erklaer-titel">
            <h2 className="trm-karte__titel" id="trm-erklaer-titel">
              {TEXTE.b.erklaerTitel}
            </h2>
            <p className="trm-karte__sub">{TEXTE.b.erklaerSub}</p>

            <ol className="trm-infos trm-infos--vier">
              {AKTIVIER_KARTEN.map((karte, index) => (
                <li className="trm-info" key={karte.key}>
                  <span className="trm-info__nr" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3 className="trm-info__titel">{karte.titel}</h3>
                  <span className="trm-info__ikon">
                    <Ikon name={karte.icon} size={17} />
                  </span>
                  <p className="trm-info__text">{karte.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="trm-spiele" id="trm-games" aria-labelledby="trm-games-titel">
            <div className="trm-karte__kopf trm-spiele__kopf">
              <Ikon name="spiel" size={22} className="trm-ikon" />
              <h2 className="trm-karte__titel" id="trm-games-titel">
                {TEXTE.t.gamesLabel}
              </h2>
            </div>

            {practiceSpiel && PracticeBauteil && (
              <div className="trm-practice" data-practice={practiceSpiel.key}>
                <p className="trm-spielwahl__best">{TEXTE.g.practiceLabel}</p>
                {!offeneSpiele[practiceSpiel.key] && !SPIEL_BAUTEILE[practiceSpiel.key] ? (
                  <SpielWahl
                    spiel={practiceSpiel}
                    best={null}
                    oeffnen={() => setOffeneSpiele((o) => ({ ...o, [practiceSpiel.key]: true }))}
                  />
                ) : (
                  <PracticeKontext.Provider value={practiceWeg}>
                    <Suspense
                      fallback={
                        <div className="trm-karte trm-spielwahl trm-spielwahl--laedt" id={practiceSpiel.key}>
                          {TEXTE.g.laedt}
                        </div>
                      }
                    >
                      <PracticeBauteil sitzung={null} best={null} onErgebnis={null} />
                    </Suspense>
                  </PracticeKontext.Provider>
                )}
              </div>
            )}

            {gesperrteSpiele.map((s) => (
              <div
                key={s.key}
                className="trm-karte trm-spielwahl trm-spielwahl--gesperrt"
                data-gesperrt={s.key}
                aria-disabled="true"
              >
                <Ikon name={s.icon} size={24} className="trm-ikon" />
                <span className="trm-spielwahl__text">
                  <span className="trm-spielwahl__titel">{s.titel}</span>
                  <span className="trm-spielwahl__zeile">{s.zeile}</span>
                </span>
                <span className="trm-spielwahl__los">{TEXTE.g.gesperrt}</span>
              </div>
            ))}

            <p className="trm-fuss-notiz">{TEXTE.g.hinweis}</p>
          </section>

          {wiederBlock()}

          {ranglisteZeile}

          <Gewinne />
        </TerminalRahmen>

        {belegtFrage && (
          <div
            className="trm-belegt"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trm-belegt-titel"
            aria-describedby="trm-belegt-frage"
            data-belegt
            onKeyDown={(e) => {
              if (e.key === 'Escape') belegtNein()
            }}
          >
            <div className="trm-karte trm-belegt__blatt">
              <h2 className="trm-karte__titel" id="trm-belegt-titel">
                {B.titel}
              </h2>
              <p className="trm-karte__sub" id="trm-belegt-frage">
                {B.frage}
              </p>
              <p className="trm-fuss-notiz">{B.hinweis}</p>
              <div className="trm-belegt__tasten">
                <button type="button" className="trm-cta" data-belegt-ja disabled={sendet} onClick={belegtJa}>
                  {sendet ? 'Wird aktiviert …' : B.ja}
                </button>
                <button
                  type="button"
                  ref={belegtNeinRef}
                  className="trm-cta trm-cta--umriss"
                  data-belegt-nein
                  disabled={sendet}
                  onClick={belegtNein}
                >
                  {B.nein}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  /* ================================================================ */
  /* Zustand Z — Zugang, die Truhe bleibt zu                          */
  /* ================================================================ */

  if (ansicht === 'z') {
    const truheKlassen = [
      'trm-truhe--wach',
      punkt === 'schloss' ? 'trm-truhe--wackelt' : '',
      stossNr % 2 === 1 ? 'trm-truhe--stoss-b' : '',
      punkt === 'zeichen' ? 'trm-truhe--zeichen' : '',
      buehne === 'schluessel' ? 'trm-truhe--flug' : '',
      buehne === 'vorflug' ? 'trm-truhe--vorflug' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <>
        {seo}
        <Buehne art={buehne} wort={buehneWort} />
        <TerminalRahmen>
          <h1 className="trm-titel trm-gold">{TEXTE.z.titel}</h1>
          <p className="trm-sub">{TEXTE.z.sub}</p>
          <Raute />

          <Truhe zuerst className={truheKlassen} schlag={stossNr > 0 ? `ruck-${stossNr}` : null}>
            <Schriftzug />

            {/* Drei Punkte auf dem Motiv. Echte Knoepfe: sie sind mit der
                Tastatur erreichbar und tragen eine Beschriftung, die sagt,
                was sie sind — auch wenn man das Bild nicht sieht. */}
            <div className="trm-punkte">
              <button
                type="button"
                className="trm-punkt trm-punkt--schloss"
                onClick={schlossTippen}
                aria-label={TEXTE.z.schlossLabel}
              >
                {punkt === 'schloss' ? (
                  <span className="trm-punkt__funken" aria-hidden="true" />
                ) : null}
              </button>

              <button
                type="button"
                className="trm-punkt trm-punkt--zeichen"
                onClick={zeichenTippen}
                aria-label={TEXTE.z.zeichenLabel}
              />

              <button
                type="button"
                className="trm-punkt trm-punkt--schluessel"
                onClick={schluesselTippen}
                aria-label={TEXTE.z.schluesselLabel}
              >
                <span className="trm-punkt__wort" aria-hidden="true">
                  {TEXTE.z.schluesselText}
                </span>
              </button>
            </div>
          </Truhe>

          {/* Das Wort zum angetippten Punkt. Der Bereich steht immer im
              Markup, damit Vorleseprogramme die Aenderung bemerken. */}
          <p className="trm-truhe__ruf" aria-live="polite">
            {punktWort ? <span className="trm-truhe__pille">{punktWort}</span> : null}
          </p>

          {/* Derselbe Weg wie der Punkt auf dem Schluesselloch, nur als Knopf.
              Waehrend der Sequenz gesperrt — sonst laesst sich zweimal tippen
              und die Inszenierung startet doppelt. */}
          <button
            type="button"
            className="trm-cta"
            onClick={schluesselTippen}
            disabled={buehne === 'schluessel' || buehne === 'vorflug'}
          >
            {TEXTE.z.cta}
          </button>

          <p className="trm-hinweis">{TEXTE.z.hinweis}</p>

          <Gewinne />

          {ziehungZeile()}
        </TerminalRahmen>
      </>
    )
  }

  /* ================================================================ */
  /* Zustand A — verschlossen                                         */
  /* ================================================================ */

  const gesperrt = codePruefung || buehne === 'gewaehrt'

  /* Waehrend der Inszenierung kommt die Truhe optisch naeher, das Schloss
     schnappt einmal, und zwischen Deckel und Korpus steht ein sehr schmaler
     goldener Lichtspalt. Offen ist sie danach nicht.

     trm-truhe--wach steht hier bewusst nicht: das ist der hellere Schein der
     entriegelten Truhe und gehoert in Zustand Z. */
  const truheKlassenA = [
    buehne === 'gewaehrt' ? 'trm-truhe--gewaehrt' : '',
    punkt === 'truhe' ? 'trm-truhe--ruck' : '',
    punkt === 'schloss' ? 'trm-truhe--wackelt' : '',
    stossNr % 2 === 1 ? 'trm-truhe--stoss-b' : '',
    punkt === 'zeichen' ? 'trm-truhe--zeichen' : '',
    buehne === 'spaehen' ? 'trm-truhe--annaehern' : '',
  ]
    .filter(Boolean)
    .join(' ')

  /* Welche Effektschichten gerade auf der Truhe liegen: der grosse Moment
     geht vor dem Aufschlag des Intros, beide vor dem Antippen. */
  const schlagA =
    buehne === 'gewaehrt'
      ? 'gewaehrt'
      : introLaeuft && introPhase >= 4
        ? 'intro'
        : stossNr > 0
          ? `ruck-${stossNr}`
          : null

  /* Die Schicht hinter der Spalte und der Weg daran vorbei. Beide sind
     Geschwister und liegen im Rahmen vor der Spalte — die Reihenfolge
     entscheidet, was ueber was liegt. */
  const introSzene = introLaeuft ? (
    <>
      <div className="trm-intro" data-phase={introPhase} aria-hidden="true">
        <span className="trm-intro__adern" />
        <span className="trm-intro__rauch" />
        <span className="trm-intro__rauch trm-intro__rauch--zwei" />
        <span className="trm-intro__funke" />
        <span className="trm-intro__glut" />
        <span className="trm-intro__glut trm-intro__glut--zwei" />
        <span className="trm-intro__staub" />
        <p className="trm-intro__marke">{TEXTE.intro.marke}</p>
      </div>
      <button type="button" className="trm-intro__weg" onClick={introUeberspringen}>
        {TEXTE.intro.ueberspringen}
      </button>
    </>
  ) : null

  return (
    <>
      {seo}
      <Buehne art={buehne} wort={buehneWort} />
      <TerminalRahmen hinter={introSzene}>
        <h1 className={`trm-titel trm-gold ${stufe(5)}`}>
          {fuelle(TEXTE.a.titel, { gesamt: GESAMT })}
        </h1>
        <p className={`trm-sub ${stufe(5)}`}>{TEXTE.a.sub}</p>
        <Raute className={stufe(5)} />

        <Truhe zuerst className={truheKlassenA} schlag={schlagA}>
          <Schriftzug />
          <p className="trm-truhe__schild" aria-hidden="true">
            {TEXTE.schild}
          </p>

          {/* Vier Flaechen auf dem Motiv, und zwar von Anfang an. Die grosse
              liegt zuerst im Markup: die drei genauen Punkte liegen danach
              und damit darueber. Echte Knoepfe — mit der Tastatur erreichbar
              und beschriftet, auch wenn man das Bild nicht sieht. */}
          <div className="trm-punkte">
            <button
              type="button"
              className="trm-punkt trm-punkt--truhe"
              onClick={truheTippen}
              aria-label={TEXTE.wach.truheLabel}
            />

            <button
              type="button"
              className="trm-punkt trm-punkt--schloss"
              onClick={schlossTippenA}
              aria-label={TEXTE.wach.schlossLabel}
            >
              {punkt === 'schloss' ? (
                <span className="trm-punkt__funken" aria-hidden="true" />
              ) : null}
            </button>

            <button
              type="button"
              className="trm-punkt trm-punkt--zeichen"
              onClick={zeichenTippenA}
              aria-label={TEXTE.wach.zeichenLabel}
            />

            <button
              type="button"
              className="trm-punkt trm-punkt--schluessel"
              onClick={schluesselTippenA}
              aria-label={TEXTE.wach.schluesselLabel}
            />
          </div>
        </Truhe>

        {/* Was die Truhe gerade gesagt hat. Der Bereich steht immer im
            Markup, damit Vorleseprogramme die Aenderung bemerken. */}
        <p className="trm-truhe__ruf" aria-live="polite">
          {punktWort ? <span className="trm-truhe__pille">{punktWort}</span> : null}
        </p>

        <form
          className={`trm-code ${stufe(6)}`}
          onSubmit={codePruefen}
          data-fehler={codeFehler ? '1' : '0'}
        >
          <p className="trm-code__label" id="trm-code-label">
            {TEXTE.a.codeLabel}
          </p>

          <CodeFelder ziffern={ziffern} setZiffern={setZiffern} gesperrt={gesperrt} />

          <button type="submit" className="trm-cta" disabled={gesperrt}>
            {codePruefung ? 'Wird geprüft …' : TEXTE.a.cta}
          </button>

          {/* Die Meldung bleibt hier stehen — kein Seitenwechsel, kein
              Dialog, und kein Hinweis darauf, was richtig gewesen waere.
              Der Bereich liegt immer im Markup, damit Vorleseprogramme die
              neue Meldung als Aenderung bemerken. */}
          <div aria-live="polite">
            {codeFehler ? (
              <p className="trm-meldung trm-meldung--fehler">{codeFehler}</p>
            ) : null}
          </div>
        </form>

        <p className={`trm-hinweis ${stufe(6)}`}>{TEXTE.a.hinweis}</p>

        {wiederBlock(stufe(6))}

        <ol className={`trm-ablauf ${stufe(6)}`}>
          {ABLAUF.map((schritt, index) => (
            <li className="trm-ablauf__schritt" key={schritt.key}>
              <Ikon name={schritt.icon} size={17} className="trm-ikon" />
              <span className="trm-ablauf__wort">{schritt.titel}</span>
              {index < ABLAUF.length - 1 ? (
                <ChevronRight size={15} className="trm-ablauf__pfeil" aria-hidden="true" />
              ) : null}
            </li>
          ))}
        </ol>

        <Gewinne className={stufe(6)} />

        {ziehungZeile(stufe(6))}
      </TerminalRahmen>
    </>
  )
}
