import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  Database,
  Dices,
  Download,
  FlaskConical,
  Hash,
  Lock,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react'

import Seo from '../components/Seo.jsx'
import TerminalRahmen, { Ikon, Instagram, Metrik, Raute } from '../components/TerminalRahmen.jsx'
import {
  SPEICHER_ADMIN,
  introNochmal,
  probeSetzen,
  sitzungLesen,
  sitzungSchreiben,
  terminalAdminRuf,
} from '../data/terminal-api.js'
import {
  GEWERTETE_GAMES,
  HAUPTGAMES_ANZAHL,
  MEGA_LEER,
  MEGA_MEILENSTEIN,
  MEILENSTEINE,
  MEILENSTEIN_LEER,
  PRACTICE_STANDARD,
  SPIELE_LISTE,
  SPIEL_NACH_KEY,
  STANDARD_HAUPTGAMES,
  TERMINAL_KAMPAGNE,
  TEXTE,
  deckelText,
  instagramAnzeige,
  missionStand,
  spielAktiv,
  spielKurz,
  spieleSortiert,
  terminText,
  zahl,
} from '../data/terminal.js'

/**
 * Die Verwaltung der Bierdeckel-Aktion: /terminal/admin.
 *
 * WAS HIER NICHT STEHT
 * --------------------
 * Kein Passwort, keine Pruefung, keine Datenbankadresse. Diese Seite ist eine
 * Eingabemaske. Der Schluessel, den man eintippt, geht als Kopfzeile an
 * api/terminal-admin.js — dort wird gegen TERMINAL_ADMIN_TOKEN verglichen.
 * Wer das Bundle liest, findet nichts, und wer die Seite einfach oeffnet,
 * sieht keine Teilnehmerdaten: ohne gueltigen Schluessel antwortet der Server
 * mit 401 und schickt keine Zeile mit.
 *
 * Der Schluessel liegt in sessionStorage, damit ein Reload waehrend der
 * Arbeit nicht zur erneuten Eingabe zwingt. Mit dem Tab ist er weg.
 *
 * DIE ZIEHUNG
 * -----------
 * Der Knopf loest sie aus, er fuehrt sie nicht aus. Gezogen wird
 * serverseitig mit crypto.randomInt aus den tatsaechlich aktivierten
 * Nummern. Im Browser faellt keine Entscheidung — ein Math.random() hier
 * waere manipulierbar und haette bei einer Verlosung nichts zu suchen.
 *
 * Die Seite ist noindex/nofollow und steht in keiner Sitemap.
 */

const GESAMT = TERMINAL_KAMPAGNE.deckelGesamt

/** ISO-Zeitpunkt in den Wert, den ein datetime-local-Feld erwartet (Ortszeit). */
function fuerFeld(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    + `T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Umgekehrt. Wichtig: die Umrechnung passiert hier im Browser, wo die
 * Ortszeit bekannt ist. Die Serverfunktion laeuft in UTC — wuerde sie
 * „2026-10-01T18:00" selbst auslegen, waere der Termin zwei Stunden falsch.
 */
function ausFeld(wert) {
  if (!wert) return ''
  const d = new Date(wert)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

/*
 * Deckel 1847 / @dhimmel_ ist der interne Testdatensatz. Er steht zwischen
 * echten Teilnehmern, darf aber nie mit einem verwechselt werden. VOR DER
 * VERTEILUNG: physischen Deckel 1847 zurueckhalten ODER diesen Datensatz
 * loeschen.
 */
const TESTDECKEL_NUMMER = 1847
const TESTDECKEL_HANDLE = 'dhimmel_'

function istTestdeckel(z) {
  return Number(z?.deckel_nummer) === TESTDECKEL_NUMMER
    || String(z?.instagram_handle ?? '').replace(/^@/, '').toLowerCase() === TESTDECKEL_HANDLE
}

function TestdeckelMarke() {
  return (
    <span
      className="trm-adm__status trm-adm__status--test"
      title="Vor der Verteilung: Deckel 1847 zurückhalten oder diesen Datensatz löschen."
    >
      INTERNER TESTDECKEL
    </span>
  )
}

const ANSPRUCH_WORT = {
  erstaktivierung: 'Erstaktivierung',
  weiterer_besitzanspruch: 'Weiterer Besitzanspruch',
}

const BESITZ_WORT = {
  bestaetigt: 'BESITZ BESTÄTIGT',
  nicht_bestaetigt: 'NICHT BESTÄTIGT',
}

/**
 * Der Follow-Pruefstand, wie ihn ein Mensch setzt. „offen" heisst: noch
 * niemand hat nachgesehen — nicht „abgelehnt". Automatisch aendert sich
 * hier nichts.
 */
const PRUEFSTAND_WORT = [
  ['offen', 'offen'],
  ['bestaetigt', 'geprüft: folgt'],
  ['abgelehnt', 'geprüft: folgt nicht'],
]

/**
 * Gewinnfall: alle Besitzansprueche auf die gezogene Nummer.
 *
 * Der Server ordnet keinen Anspruch zu. Wer den Originaldeckel vorlegt, wird
 * hier von Hand bestaetigt; die anderen Ansprueche werden dabei als nicht
 * bestaetigt vermerkt. Geloescht wird nichts.
 */
function Gewinnfall({ nummer, teilnehmer, laeuft, bestaetigen }) {
  const ansprueche = teilnehmer.filter((t) => Number(t.deckel_nummer) === Number(nummer))
  const bestaetigt = ansprueche.find((t) => t.besitz_status === 'bestaetigt')
  return (
    <div className="trm-adm__gewinnfall" data-gewinnfall={nummer}>
      <strong className="trm-adm__label">DECKEL {nummer}</strong>
      <p className="trm-feld__hilfe" data-ansprueche={ansprueche.length}>
        {ansprueche.length === 1 ? '1 BESITZANSPRUCH' : `${zahl(ansprueche.length)} BESITZANSPRÜCHE`}
      </p>
      <p className={bestaetigt ? 'trm-meldung' : 'trm-meldung trm-meldung--fehler'} data-verifikation>
        {bestaetigt
          ? `BESITZ BESTÄTIGT: ${instagramAnzeige(bestaetigt.instagram_handle)}`
          : 'PHYSISCHER DECKEL MUSS VERIFIZIERT WERDEN'}
      </p>
      {ansprueche.length > 0 && (
        <ol className="trm-adm__liste">
          {ansprueche.map((t) => (
            <li key={t.id} data-anspruch={t.id}>
              <strong>{instagramAnzeige(t.instagram_handle)}</strong>
              <span className="trm-adm__status">{BESITZ_WORT[t.besitz_status] ?? 'OFFEN'}</span>
              <span className="trm-adm__klein">
                {ANSPRUCH_WORT[t.anspruch_art] ?? ANSPRUCH_WORT.erstaktivierung} · {t.email} ·{' '}
                {terminText(t.aktiviert_am) ?? '—'}
              </span>
              {t.besitz_status !== 'bestaetigt' && (
                <span className="trm-adm__leiste">
                  <button
                    type="button"
                    className="trm-cta trm-cta--klein"
                    data-besitz={t.id}
                    disabled={laeuft}
                    onClick={() => bestaetigen(t.id)}
                  >
                    <Check size={15} aria-hidden="true" /> BESITZ BESTÄTIGEN
                  </button>
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/**
 * Eine Kennzahlzeile. `hilfe` ist die Formel dahinter — der Server schickt
 * sie mit, damit in der Verwaltung niemand raten muss, was genau gezaehlt
 * wurde. Fehlt sie, steht dort auch nichts.
 */
function Zeile({ label, hilfe, children }) {
  return (
    <div className="trm-adm__zeile">
      <span className="trm-adm__label">{label}</span>
      <span className="trm-adm__wert">{children}</span>
      {hilfe ? <span className="trm-adm__formel">{hilfe}</span> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Anmeldung                                                           */
/* ------------------------------------------------------------------ */

function Anmeldung({ beiAnmeldung, fehler, laeuft }) {
  const [eingabe, setEingabe] = useState('')

  return (
    <section className="trm-karte trm-adm__tor">
      <div className="trm-karte__kopf">
        <Lock size={18} aria-hidden="true" />
        <h1 className="trm-karte__titel">VERWALTUNG</h1>
      </div>
      <p className="trm-karte__sub">
        Zugang nur mit Verwaltungsschlüssel. Die Prüfung läuft auf dem Server.
      </p>

      <form
        onSubmit={(ereignis) => {
          ereignis.preventDefault()
          beiAnmeldung(eingabe.trim())
        }}
      >
        <div className="trm-feld">
          <label className="trm-feld__label" htmlFor="adm-schluessel">
            Verwaltungsschlüssel
          </label>
          <input
            id="adm-schluessel"
            className="trm-eingabe"
            type="password"
            autoComplete="current-password"
            value={eingabe}
            onChange={(ereignis) => setEingabe(ereignis.target.value)}
            required
          />
          {fehler && <p className="trm-feld__fehler" role="alert">{fehler}</p>}
        </div>
        <button type="submit" className="trm-cta" disabled={laeuft}>
          {laeuft ? 'Wird geprüft …' : 'ANMELDEN'}
        </button>
      </form>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Einstellungen                                                       */
/* ------------------------------------------------------------------ */

/** Kurze Fehlergruende des Instagram-Syncs, fuer Menschen gesagt. */
function instagramFehlerText(grund) {
  if (!grund) return ''
  if (grund.startsWith('http-')) {
    return 'Instagram hat die Anfrage abgelehnt — ist der Access Token abgelaufen?'
  }
  return (
    {
      'nicht-konfiguriert': 'Der Instagram-Zugang ist nicht eingerichtet (Token oder User-ID fehlen).',
      zeitueberschreitung: 'Instagram hat nicht rechtzeitig geantwortet.',
      'ungueltiger-wert': 'Instagram hat keine gültige Followerzahl geliefert.',
      'ungueltige-antwort': 'Instagram hat keine lesbare Antwort geliefert.',
      netz: 'Instagram war nicht erreichbar.',
      server: 'Die Datenbank hat nicht geantwortet.',
    }[grund] ?? 'Der letzte Sync hat nicht funktioniert.'
  )
}

/**
 * Der Zustand des Syncs in einem Wort. Reihenfolge nach Dringlichkeit:
 * ein abgelaufener Token ist ein anderer Fall als ein fehlender Zugang,
 * und beide sind etwas anderes als "eingerichtet, aber noch nie gelaufen".
 */
function instagramStatus(sync) {
  if (!sync?.eingerichtet || sync?.fehler === 'nicht-konfiguriert') {
    return { wort: 'NICHT EINGERICHTET', art: 'aus' }
  }
  if (typeof sync?.fehler === 'string' && sync.fehler.startsWith('http-')) {
    return { wort: 'TOKENFEHLER', art: 'fehler' }
  }
  if (sync?.fehler) return { wort: 'LETZTER LAUF FEHLGESCHLAGEN', art: 'fehler' }
  if (!sync?.am) return { wort: 'EINGERICHTET, NOCH KEIN LAUF', art: 'wartet' }
  return { wort: 'AKTIV', art: 'aktiv' }
}

function Einstellungen({ einstellungen, speichern, laeuft, instagramSync, synchronisieren }) {
  const igStatus = instagramStatus(instagramSync)
  const [formular, setFormular] = useState(() => ({
    naechsteZiehung: fuerFeld(einstellungen?.naechsteZiehung),
    followerZahl: String(einstellungen?.followerZahl ?? TERMINAL_KAMPAGNE.followerStart),
    followerZiel: String(einstellungen?.followerZiel ?? TERMINAL_KAMPAGNE.followerZiel),
  }))

  /* Kommt ein neuer Stand vom Server (nach dem Speichern, nach einem
     Neuladen), uebernehmen die Felder ihn — sonst zeigt das Formular
     dauerhaft den Stand des ersten Renderns. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormular({
      naechsteZiehung: fuerFeld(einstellungen?.naechsteZiehung),
      followerZahl: String(einstellungen?.followerZahl ?? TERMINAL_KAMPAGNE.followerStart),
      followerZiel: String(einstellungen?.followerZiel ?? TERMINAL_KAMPAGNE.followerZiel),
    })
  }, [einstellungen])

  const aendern = (feld) => (ereignis) =>
    setFormular((alt) => ({ ...alt, [feld]: ereignis.target.value }))

  return (
    <section className="trm-karte">
      <div className="trm-karte__kopf">
        <Ikon name="uhr" />
        <h2 className="trm-karte__titel">EINSTELLUNGEN</h2>
      </div>

      <form
        onSubmit={(ereignis) => {
          ereignis.preventDefault()
          /* Die Followerzahl geht nur mit, wenn sie hier wirklich geaendert
             wurde. Sonst wuerde das Speichern von Termin oder Ziel einen
             inzwischen synchronisierten Wert mit dem alten Formularstand
             ueberschreiben. */
          const geladen = String(einstellungen?.followerZahl ?? TERMINAL_KAMPAGNE.followerStart)
          speichern({
            naechsteZiehung: ausFeld(formular.naechsteZiehung),
            ...(formular.followerZahl !== geladen ? { followerZahl: formular.followerZahl } : {}),
            followerZiel: formular.followerZiel,
          })
        }}
      >
        <div className="trm-feld">
          <label className="trm-feld__label" htmlFor="adm-termin">
            Nächste Ziehung
          </label>
          <input
            id="adm-termin"
            className="trm-eingabe"
            type="datetime-local"
            value={formular.naechsteZiehung}
            onChange={aendern('naechsteZiehung')}
          />
          <p className="trm-feld__hilfe">
            Leer lassen heißt: kein Termin veröffentlicht. Der Countdown zeigt dann
            „Termin folgt“.
          </p>
        </div>

        <div className="trm-adm__paar">
          <div className="trm-feld">
            <label className="trm-feld__label" htmlFor="adm-follower">
              Follower (automatisch / Handeingabe)
            </label>
            <input
              id="adm-follower"
              className="trm-eingabe"
              type="number"
              inputMode="numeric"
              min="0"
              value={formular.followerZahl}
              onChange={aendern('followerZahl')}
            />
          </div>
          <div className="trm-feld">
            <label className="trm-feld__label" htmlFor="adm-ziel">
              Follower-Ziel
            </label>
            <input
              id="adm-ziel"
              className="trm-eingabe"
              type="number"
              inputMode="numeric"
              min="1"
              value={formular.followerZiel}
              onChange={aendern('followerZiel')}
            />
          </div>
        </div>

        <p className="trm-feld__hilfe">
          Die Followerzahl wird stündlich automatisch über die offizielle Instagram-API
          abgerufen. Die Handeingabe bleibt als Rückfall — ein hier eingetragener Wert
          wird beim nächsten erfolgreichen Sync überschrieben. Sie treibt die
          Follower-Mission überall im Terminal: angezeigt wird immer die nächste
          noch offene Stufe aus der festen Reihe 1.500 bis 5.000. Das Feld
          „Follower-Ziel“ ist nur noch ein Rückfallwert und ändert an dieser
          Reihe nichts.
        </p>

        <button type="submit" className="trm-cta" disabled={laeuft}>
          {laeuft ? 'Wird gespeichert …' : 'EINSTELLUNGEN SPEICHERN'}
        </button>
      </form>

      <div className="trm-feld">
        <Zeile label="INSTAGRAM SYNC">
          <span className="trm-adm__ampel" data-art={igStatus.art}>{igStatus.wort}</span>
        </Zeile>
        <Zeile label="LETZTER INSTAGRAM-SYNC">
          {terminText(instagramSync?.am) ?? 'noch nie'}
        </Zeile>
        <Zeile label="AKTUELLER API-WERT">
          {typeof instagramSync?.wert === 'number' ? zahl(instagramSync.wert) : '–'}
        </Zeile>
        {!instagramSync?.eingerichtet && (
          <p className="trm-feld__hilfe">
            INSTAGRAM_ACCESS_TOKEN und INSTAGRAM_USER_ID sind in der Serverumgebung nicht
            gesetzt. Solange das so ist, läuft nichts automatisch und die Followerzahl
            oben ist die einzige Quelle.
          </p>
        )}
        {instagramSync?.fehler && (
          <p className="trm-meldung trm-meldung--fehler">
            <AlertTriangle size={15} aria-hidden="true" /> {instagramFehlerText(instagramSync.fehler)}
          </p>
        )}
        <button
          type="button"
          className="trm-cta trm-cta--klein trm-cta--umriss"
          onClick={synchronisieren}
          disabled={laeuft}
        >
          <RefreshCw size={14} aria-hidden="true" /> JETZT SYNCHRONISIEREN
        </button>
      </div>

      <div className="trm-adm__schalter">
        <div>
          <strong className="trm-adm__label">Live-Ziehung öffentlich</strong>
          <p className="trm-feld__hilfe">
            Schaltet auf /terminal/ziehung die Markierung „JETZT LIVE“ ein.
          </p>
        </div>
        <button
          type="button"
          className={einstellungen?.live ? 'trm-cta trm-cta--klein' : 'trm-cta trm-cta--klein trm-cta--umriss'}
          onClick={() => speichern({ live: !einstellungen?.live })}
          disabled={laeuft}
          aria-pressed={einstellungen?.live === true}
        >
          {einstellungen?.live ? 'LIVE AN' : 'LIVE AUS'}
        </button>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Follower-Mission: Preisnamen je Meilenstein                         */
/* ------------------------------------------------------------------ */

function leereGewinne(gewinne) {
  return Object.fromEntries(MEILENSTEINE.map((ziel) => [String(ziel), gewinne?.[String(ziel)] ?? '']))
}

function MissionGewinne({ einstellungen, speichern, laeuft }) {
  const [felder, setFelder] = useState(() => leereGewinne(einstellungen?.meilensteinGewinne))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFelder(leereGewinne(einstellungen?.meilensteinGewinne))
  }, [einstellungen])

  return (
    <section className="trm-karte" id="adm-mission">
      <div className="trm-karte__kopf">
        <Ikon name="instagram" />
        <h2 className="trm-karte__titel">FOLLOWER-MISSION</h2>
      </div>
      <p className="trm-karte__sub">
        Aktuell {zahl(einstellungen?.followerZahl ?? TERMINAL_KAMPAGNE.followerStart)} Follower.
        Je Meilenstein ein Preisname — leer bleibt „{MEILENSTEIN_LEER}“, bei{' '}
        {zahl(MEGA_MEILENSTEIN)} „{MEGA_LEER}“.
      </p>

      <form
        onSubmit={(ereignis) => {
          ereignis.preventDefault()
          speichern({ meilensteinGewinne: felder })
        }}
      >
        <div className="trm-adm__gewinne">
          {MEILENSTEINE.map((ziel) => (
            <div className="trm-feld" key={ziel}>
              <label className="trm-feld__label" htmlFor={`adm-meilenstein-${ziel}`}>
                {zahl(ziel)} Follower
              </label>
              <input
                id={`adm-meilenstein-${ziel}`}
                className="trm-eingabe"
                type="text"
                maxLength={80}
                placeholder={ziel === MEGA_MEILENSTEIN ? MEGA_LEER : MEILENSTEIN_LEER}
                value={felder[String(ziel)]}
                onChange={(ereignis) =>
                  setFelder((alt) => ({ ...alt, [String(ziel)]: ereignis.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <button type="submit" className="trm-cta" disabled={laeuft}>
          {laeuft ? 'Wird gespeichert …' : 'MEILENSTEINE SPEICHERN'}
        </button>
      </form>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Games: Schalter und Kennzahlen                                      */
/* ------------------------------------------------------------------ */

/**
 * AKTIV / AUSGEBLENDET je Spiel. Ausgeblendet heisst: keine Karte im
 * Dashboard, kein Tab in der Rangliste, kein neuer Lauf. Die gespeicherten
 * Scores bleiben stehen und sind nach dem Wiedereinschalten sofort zurueck.
 */
function SpielSchalter({ einstellungen, speichern, laeuft }) {
  const schalter = einstellungen?.spieleAktiv ?? {}
  const sortiert = spieleSortiert(einstellungen?.spieleReihenfolge)
  return (
    <section className="trm-karte" id="adm-spiele">
      <div className="trm-karte__kopf">
        <Ikon name="spiel" size={18} />
        <h2 className="trm-karte__titel">GAMES</h2>
      </div>
      <p className="trm-karte__sub">
        Ohne neues Deployment ein- und ausblenden und sortieren. Scores bleiben erhalten.
      </p>
      <div className="trm-feld">
        <label className="trm-feld__label" htmlFor="adm-practice">
          Practice-Game ohne Konto
        </label>
        <select
          id="adm-practice"
          className="trm-eingabe"
          value={einstellungen?.guestPracticeGame ?? PRACTICE_STANDARD}
          disabled={laeuft}
          onChange={(ereignis) =>
            speichern({ guestPracticeGame: ereignis.target.value }, 'Practice-Game gespeichert.')
          }
        >
          {SPIELE_LISTE.map((s) => (
            <option key={s.key} value={s.key}>{s.titel}</option>
          ))}
        </select>
        <p className="trm-feld__hilfe">
          Genau dieses Game ist ohne Konto spielbar — ohne Wertung, Ranking,
          Gewinnchance oder Tresorkönig. Es muss dafür aktiv sein.
        </p>
      </div>
      {sortiert.map((spiel, i) => {
        const an = spielAktiv(schalter, spiel.key)
        /* Nach oben/unten tauscht mit dem Nachbarn und speichert die ganze
           Reihenfolge — Dashboard und Rangliste folgen ihr. */
        const schieben = (richtung) => {
          const keys = sortiert.map((s) => s.key)
          const j = i + richtung
          ;[keys[i], keys[j]] = [keys[j], keys[i]]
          speichern({ spieleReihenfolge: keys }, `${spiel.titel} verschoben.`)
        }
        return (
          <div className="trm-adm__schalter" key={spiel.key}>
            <div>
              <strong className="trm-adm__label">
                {i + 1}. {spiel.titel}
              </strong>
              <p className="trm-feld__hilfe">{an ? 'Sichtbar und spielbar.' : 'Ausgeblendet.'}</p>
            </div>
            <div className="trm-adm__leiste">
              <button
                type="button"
                className="trm-cta trm-cta--klein trm-cta--umriss"
                data-hoch={spiel.key}
                disabled={laeuft || i === 0}
                aria-label={`${spiel.titel} nach oben`}
                onClick={() => schieben(-1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="trm-cta trm-cta--klein trm-cta--umriss"
                data-runter={spiel.key}
                disabled={laeuft || i === sortiert.length - 1}
                aria-label={`${spiel.titel} nach unten`}
                onClick={() => schieben(1)}
              >
                ↓
              </button>
              <button
                type="button"
                data-spiel={spiel.key}
                className={an ? 'trm-cta trm-cta--klein' : 'trm-cta trm-cta--klein trm-cta--umriss'}
                disabled={laeuft}
                aria-pressed={an}
                onClick={() => {
                  /* Immer alle Schalter ausdruecklich senden, sonst greift
                     fuer fehlende Spiele wieder der Standard. */
                  const neu = {}
                  for (const s of SPIELE_LISTE) neu[s.key] = spielAktiv(schalter, s.key)
                  neu[spiel.key] = !an
                  speichern({ spieleAktiv: neu }, an ? `${spiel.titel} ausgeblendet.` : `${spiel.titel} aktiv.`)
                }}
              >
                {an ? 'AKTIV' : 'AUSGEBLENDET'}
              </button>
            </div>
          </div>
        )
      })}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Gesamtranking                                                       */
/* ------------------------------------------------------------------ */

const GR_WARNUNG = 'ACHTUNG: Dieses Game ist Bestandteil des Gesamtrankings.'
/* Muss woertlich zu HAUPTGAME_BESTAETIGUNG in api/_terminal-gesamtranking.js passen. */
const HAUPTGAME_BESTAETIGUNG = 'HAUPTGAME WIRKLICH ÄNDERN'
const MEDAILLEN_ADMIN = ['🥇', '🥈', '🥉']
const grTitel = (key) => SPIEL_NACH_KEY[key]?.titel ?? key

/**
 * Hauptgames, Testslot, Rankingpreise und der Abschluss.
 *
 * Die Liste laedt erst auf Knopfdruck: sie liest alle gueltigen Laeufe der
 * sechs Hauptgames und muss nicht bei jedem Oeffnen der Verwaltung laufen.
 * Abschliessen geht erst, wenn sie geladen ist — dann stehen die
 * verdaechtigen Laeufe der Spitze direkt darueber.
 *
 * Gerechnet wird beste vier aus sechs. Welche vier das sind, bestimmt der
 * Server; die Verwaltung sieht nur das Ergebnis — je Zeile, welche Spiele
 * gewertet und welche gestrichen wurden.
 */
function GesamtrankingVerwaltung({ einstellungen, laeuft, handeln, rufen }) {
  const gr = einstellungen?.gesamtranking ?? null
  const hauptgames = gr?.hauptgames ?? STANDARD_HAUPTGAMES
  const abgeschlossen = Boolean(gr?.abgeschlossenAm)
  const [liste, setListe] = useState(null)
  const [laedt, setLaedt] = useState(false)
  const [preise, setPreise] = useState({ 1: '', 2: '', 3: '' })
  const [offen, setOffen] = useState(null)
  const [alleZeigen, setAlleZeigen] = useState(false)

  /* Welche Zeilen die Tabelle zeigt. `top` sind die ersten zwanzig
     Qualifizierten, `alle` zusaetzlich die, denen noch Spiele fehlen. */
  const zeilen = (alleZeigen ? liste?.alle : liste?.top) ?? []

  const preiseText = JSON.stringify(gr?.preise ?? {})
  useEffect(() => {
    const p = JSON.parse(preiseText)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreise({ 1: p[1] ?? '', 2: p[2] ?? '', 3: p[3] ?? '' })
  }, [preiseText])

  async function laden() {
    setLaedt(true)
    const antwort = await rufen({ aktion: 'gesamtranking' })
    setLaedt(false)
    setListe(antwort?.ok ? antwort : null)
  }

  async function hauptgameSetzen(i, key) {
    if (key === hauptgames[i]) return
    if (!window.confirm(`${GR_WARNUNG}\n\n${grTitel(hauptgames[i])} wird durch ${grTitel(key)} ersetzt. Das Gesamtranking wird sofort neu gerechnet.`)) return
    const neu = [...hauptgames]
    /* Ist das neue Game schon an anderer Stelle Hauptgame, tauschen beide
       die Plaetze — es bleiben immer sechs verschiedene. */
    const j = neu.indexOf(key)
    if (j >= 0) neu[j] = neu[i]
    neu[i] = key
    const antwort = await handeln({ aktion: 'einstellungen', hauptgames: neu }, 'Hauptgames gespeichert.')
    /* Gibt es schon gewertete Runs, verlangt der Server eine zweite,
       ausdrueckliche Bestaetigung. */
    if (antwort?.grund === 'bestaetigung') setOffen({ neu, teilnehmerZahl: antwort.teilnehmerZahl ?? null })
  }

  async function hauptgameBestaetigen() {
    const antwort = await handeln(
      { aktion: 'einstellungen', hauptgames: offen.neu, bestaetigung: HAUPTGAME_BESTAETIGUNG },
      'Hauptgames gespeichert und protokolliert.',
    )
    if (antwort?.ok || antwort?.grund === 'abgeschlossen') setOffen(null)
  }

  async function abschliessen() {
    if (!window.confirm('GESAMTRANKING ABSCHLIESSEN?\n\nDer aktuelle Stand wird eingefroren. Spätere Runs ändern das Gesamtranking nicht mehr. Wiederöffnen geht nur direkt in der Datenbank.')) return
    await handeln({ aktion: 'gr-abschliessen' }, 'Gesamtranking abgeschlossen.')
    await laden()
  }

  return (
    <section className="trm-karte" id="adm-gesamtranking">
      <div className="trm-karte__kopf">
        <Ikon name="pokal" size={18} />
        <h2 className="trm-karte__titel">GESAMTRANKING</h2>
      </div>
      <p className="trm-karte__sub">
        Beste {GEWERTETE_GAMES} aus {HAUPTGAMES_ANZAHL}: gewertet wird je Person die Summe der {GEWERTETE_GAMES} besten
        Rangpunktzahlen, die übrigen werden gestrichen. Wer mindestens {GEWERTETE_GAMES} verschiedene Hauptgames gespielt
        hat, ist qualifiziert. Practice und Küchen-Tinder zählen nicht.{' '}
        {abgeschlossen ? `Abgeschlossen am ${terminText(gr.abgeschlossenAm) ?? '—'}.` : 'Läuft.'}
      </p>

      <p className="trm-meldung" data-gr-warnung="1">
        <AlertTriangle size={15} aria-hidden="true" /> {GR_WARNUNG}
      </p>
      {hauptgames.map((key, i) => (
        <div className="trm-feld" key={`hg-${i}`}>
          <label className="trm-feld__label" htmlFor={`adm-hauptgame-${i}`}>
            Hauptgame {i + 1}
          </label>
          <select
            id={`adm-hauptgame-${i}`}
            className="trm-eingabe"
            value={key}
            disabled={laeuft || abgeschlossen || Boolean(offen)}
            onChange={(ereignis) => hauptgameSetzen(i, ereignis.target.value)}
          >
            {SPIELE_LISTE.map((s) => (
              <option key={s.key} value={s.key}>{s.titel}</option>
            ))}
          </select>
        </div>
      ))}

      {offen && !abgeschlossen && (
        <div className="trm-meldung trm-meldung--fehler" data-gr-bestaetigung="1" role="alertdialog" aria-label="Hauptgame ändern">
          <p>
            <AlertTriangle size={15} aria-hidden="true" /> Es gibt bereits offizielle Gesamtranking-Daten
            {offen.teilnehmerZahl == null
              ? ' (Anzahl konnte nicht gelesen werden)'
              : ` von ${zahl(offen.teilnehmerZahl)} Teilnehmer${offen.teilnehmerZahl === 1 ? '' : 'n'}`}
            . Neue Hauptgames: {offen.neu.map(grTitel).join(', ')}. Die Änderung wird protokolliert.
          </p>
          <div className="trm-adm__leiste">
            <button type="button" className="trm-cta trm-cta--klein" disabled={laeuft} onClick={hauptgameBestaetigen} data-gr-bestaetigen="1">
              <AlertTriangle size={15} aria-hidden="true" />
              {HAUPTGAME_BESTAETIGUNG}
            </button>
            <button type="button" className="trm-cta trm-cta--klein trm-cta--umriss" disabled={laeuft} onClick={() => setOffen(null)} data-gr-abbrechen="1">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <div className="trm-feld">
        <label className="trm-feld__label" htmlFor="adm-testslot">
          Testslot (zählt nicht)
        </label>
        <select
          id="adm-testslot"
          className="trm-eingabe"
          value={gr?.testslot ?? ''}
          disabled={laeuft}
          onChange={(ereignis) =>
            handeln({ aktion: 'einstellungen', testslot: ereignis.target.value }, 'Testslot gespeichert.')
          }
        >
          <option value="">— kein Testslot —</option>
          {SPIELE_LISTE.filter((s) => !hauptgames.includes(s.key)).map((s) => (
            <option key={s.key} value={s.key}>{s.titel}</option>
          ))}
        </select>
        <p className="trm-feld__hilfe">
          Frei änderbar, ohne Einfluss auf das Gesamtranking. Leer heißt: öffentlich nur die {HAUPTGAMES_ANZAHL}{' '}
          Hauptgames — der Normalfall, seit VIDEKO Slam reguläres Hauptgame ist.
        </p>
      </div>

      <form
        onSubmit={(ereignis) => {
          ereignis.preventDefault()
          handeln(
            { aktion: 'einstellungen', preisGesamt1: preise[1], preisGesamt2: preise[2], preisGesamt3: preise[3] },
            'Rankingpreise gespeichert.',
          )
        }}
      >
        {[1, 2, 3].map((p) => (
          <div className="trm-feld" key={p}>
            <label className="trm-feld__label" htmlFor={`adm-preis-gesamt-${p}`}>
              RANKINGPREIS PLATZ {p}
            </label>
            <input
              id={`adm-preis-gesamt-${p}`}
              className="trm-eingabe"
              maxLength={80}
              value={preise[p]}
              disabled={laeuft}
              onChange={(ereignis) => setPreise((alt) => ({ ...alt, [p]: ereignis.target.value }))}
            />
          </div>
        ))}
        <p className="trm-feld__hilfe">
          Die einzigen Preise aus dem Spiel: Platz 1 bis 3 des Gesamtrankings. Für einzelne Spiele gibt es keine Preise.
          Leer heißt: kein Preis angezeigt. Ein Preis pro Person. Die Deckelziehung läuft getrennt davon.
        </p>
        <div className="trm-adm__leiste">
          <button type="submit" className="trm-cta trm-cta--klein" disabled={laeuft}>
            <Check size={15} aria-hidden="true" />
            Preise speichern
          </button>
        </div>
      </form>

      <div className="trm-adm__leiste">
        <button type="button" className="trm-cta trm-cta--klein trm-cta--umriss" onClick={laden} disabled={laedt} data-gr-laden="1">
          <RefreshCw size={15} aria-hidden="true" />
          {laedt ? 'Lädt …' : 'Ranking laden'}
        </button>
      </div>

      {liste && (
        <>
          <p className="trm-feld__hilfe">
            {zahl(liste.gesamtZahl)} qualifiziert · {zahl(liste.teilnehmerZahl)} mit mindestens einem Hauptgame ·
            Höchstwert {zahl(liste.maxPunkte ?? GEWERTETE_GAMES * 1000)}
          </p>

          {liste.doppelt?.length > 0 && (
            <div className="trm-meldung trm-meldung--fehler" data-gr-doppelt="1">
              {liste.doppelt.map((d) => (
                <p key={`${d.plaetze.join('-')}-${d.art}`}>
                  <AlertTriangle size={15} aria-hidden="true" /> Platz {d.plaetze.join(' und ')}: {d.art}. Ein Preis pro
                  Person — bitte prüfen.
                </p>
              ))}
            </div>
          )}

          {zeilen.length === 0 ? (
            <p className="trm-feld__hilfe">
              Noch niemand mit mindestens {GEWERTETE_GAMES} Hauptgames gewertet.
            </p>
          ) : (
            <>
              {/* Top 20 oder alles. Die lange Liste enthaelt auch die noch
                  nicht Qualifizierten — genau die Gruppe, bei der man wissen
                  will, woran es haengt. */}
              <div className="trm-adm__leiste">
                <button
                  type="button"
                  className={alleZeigen ? 'trm-cta trm-cta--klein trm-cta--umriss' : 'trm-cta trm-cta--klein'}
                  onClick={() => setAlleZeigen(false)}
                  data-gr-ansicht="top"
                >
                  Top {Math.min(20, liste.top.length)}
                </button>
                <button
                  type="button"
                  className={alleZeigen ? 'trm-cta trm-cta--klein' : 'trm-cta trm-cta--klein trm-cta--umriss'}
                  onClick={() => setAlleZeigen(true)}
                  data-gr-ansicht="alle"
                >
                  Alle ({zahl(liste.alle?.length ?? 0)})
                </button>
              </div>

              <div className="trm-adm__rollen">
                <table className="trm-adm__tabelle trm-adm__tabelle--stats" data-gr-tabelle="1">
                  <thead>
                    <tr>
                      <th scope="col">Platz</th>
                      <th scope="col">Instagram</th>
                      <th scope="col">Punkte</th>
                      <th scope="col">Games</th>
                      <th scope="col">Gewertet</th>
                      <th scope="col">Gestrichen</th>
                      {/* Drei getrennte Spalten, absichtlich nicht vermischt:
                          das Game-Ranking haengt allein an den Spielen. */}
                      <th scope="col">Ranking&shy;berechtigt</th>
                      <th scope="col">Follow selbst</th>
                      <th scope="col">Deckel</th>
                      {liste.hauptgames.map((g) => (
                        <th scope="col" key={g}>{grTitel(g)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {zeilen.map((t, i) => (
                      <tr
                        key={`${t.platz ?? 'x'}-${t.instagram ?? i}`}
                        data-gr-quali={t.qualifiziert ? '1' : '0'}
                      >
                        <td className="trm-adm__zahl">
                          {t.platz ?? '—'}
                          {t.platz != null && t.platz <= 3 && (
                            <span aria-hidden="true"> {MEDAILLEN_ADMIN[t.platz - 1]}</span>
                          )}
                        </td>
                        <td>
                          {t.instagram ? `@${t.instagram}` : '—'}
                          {!t.oeffentlich && <span className="trm-adm__klein"> (nicht öffentlich)</span>}
                        </td>
                        <td className="trm-adm__zahl">{zahl(t.punkte)}</td>
                        <td className="trm-adm__zahl">
                          {zahl(t.gespielt ?? 0)}/{HAUPTGAMES_ANZAHL}
                          {!t.qualifiziert && (
                            <span className="trm-adm__klein"> — noch {zahl(t.fehlt ?? 0)}</span>
                          )}
                        </td>
                        <td className="trm-adm__klein">
                          {t.gewertet?.length ? t.gewertet.map(spielKurz).join(' · ') : '—'}
                        </td>
                        <td className="trm-adm__klein">
                          {t.gestrichen?.length ? t.gestrichen.map(spielKurz).join(' · ') : '—'}
                        </td>
                        <td>{t.rankingBerechtigt ? 'ja' : 'nein'}</td>
                        <td>{t.folgtBestaetigt ? 'ja' : 'nein'}</td>
                        <td>{t.deckel ? 'ja' : 'nein'}</td>
                        {liste.hauptgames.map((g) => (
                          <td className="trm-adm__zahl" key={g} data-gr-zelle={t.gewertet?.includes(g) ? 'gewertet' : undefined}>
                            {t.spiele[g]
                              ? `${zahl(t.spiele[g].rangpunkte)} · #${t.spiele[g].platz} · ${zahl(t.spiele[g].score)}`
                              : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="trm-feld__hilfe">
                Je Spiel: Rangpunkte · Platz in der Einzelliste · Rohscore. Gewertete Spalten stehen in Gold. Die
                Spalte Deckel ist reine Anzeige und beeinflusst das Game-Ranking nicht.
              </p>
            </>
          )}

          <h3 className="trm-adm__label">Verdächtige / verworfene Runs der Top 20</h3>
          {liste.verdacht.length === 0 ? (
            <p className="trm-feld__hilfe" data-gr-verdacht="0">Keine.</p>
          ) : (
            <ul className="trm-adm__liste" data-gr-verdacht={liste.verdacht.length}>
              {liste.verdacht.map((v) => (
                <li key={v.id}>
                  Platz {v.platz ?? '—'} · {v.instagram ? `@${v.instagram}` : '—'} · {grTitel(v.game)} · {zahl(v.score)} ·{' '}
                  {SCORE_WORT[v.status] ?? v.status} · {laufzeitText(v.dauerMs)}
                  {v.notiz ? ` · ${v.notiz}` : ''}
                </li>
              ))}
            </ul>
          )}

          {liste.pruefung?.length > 0 && (
            <div data-gr-top3={liste.pruefung.length}>
              <h3 className="trm-adm__label">Top-3-Prüfung vor Preisvergabe</h3>
              <p className="trm-feld__hilfe">
                Noch keine automatische Disqualifikation. Wir prüfen die Gewinner vor Preisvergabe manuell.
              </p>
              {liste.pruefung.map((p) => (
                <div className="trm-karte" key={p.platz} data-gr-top3-platz={p.platz}>
                  <p className="trm-adm__label">
                    {MEDAILLEN_ADMIN[p.platz - 1]} Platz {p.platz} · {p.instagram ? `@${p.instagram}` : '—'}
                    {!p.oeffentlich && <span className="trm-adm__klein"> (nicht öffentlich)</span>} · {zahl(p.punkte)} Punkte
                  </p>
                  <ul className="trm-adm__liste">
                    {p.spiele.map((s) => (
                      <li key={s.key}>
                        {grTitel(s.key)}: {s.rangpunkte == null ? '—' : `${zahl(s.rangpunkte)} · #${s.platz} · Score ${zahl(s.score)}`}
                      </li>
                    ))}
                  </ul>
                  <p className="trm-feld__hilfe" data-gr-top3-verdacht={p.verdacht.length}>
                    {p.verdacht.length === 0
                      ? 'Keine verdächtigen Runs.'
                      : `Verdächtige Runs: ${p.verdacht
                          .map((v) => `${grTitel(v.game)} ${zahl(v.score)} (${SCORE_WORT[v.status] ?? v.status}, ${laufzeitText(v.dauerMs)}${v.notiz ? `, ${v.notiz}` : ''})`)
                          .join(' · ')}`}
                  </p>
                  {p.doppelt.length > 0 && (
                    <p className="trm-meldung trm-meldung--fehler">
                      <AlertTriangle size={15} aria-hidden="true" /> Mögliche Doppelung:{' '}
                      {p.doppelt.map((d) => `${d.art} wie Platz ${d.mitPlatz}`).join(' · ')}
                    </p>
                  )}
                  <p className="trm-feld__hilfe" data-gr-top3-deckel="1">
                    Deckel {p.deckel == null ? '—' : `#${p.deckel}`} · {ANSPRUCH_WORT[p.anspruchArt] ?? 'Anspruch unbekannt'}
                    {p.besitzStatus ? ` · ${BESITZ_WORT[p.besitzStatus] ?? p.besitzStatus}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="trm-adm__leiste">
        <button
          type="button"
          className="trm-cta trm-cta--klein"
          data-gr-abschliessen="1"
          disabled={laeuft || laedt || !liste || abgeschlossen}
          onClick={abschliessen}
        >
          <Lock size={15} aria-hidden="true" />
          {abgeschlossen ? 'ABGESCHLOSSEN' : 'GESAMTRANKING ABSCHLIESSEN'}
        </button>
      </div>
      {!abgeschlossen && !liste && <p className="trm-feld__hilfe">Zum Abschließen erst das Ranking laden und die Runs prüfen.</p>}
    </section>
  )
}

const prozent = (wert) => (wert == null ? '—' : `${Math.round(wert * 1000) / 10} %`)
const sekunden = (ms) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)} s`)
const kommazahl = (wert) => (wert == null ? '—' : String(wert).replace('.', ','))

const STAT_ZEILEN = [
  ['replay60', 'REPLAY < 60 S', prozent],
  ['starts', 'Starts', (w) => (w == null ? '—' : zahl(w))],
  ['abbruchQuote', 'Abbruch-Quote', prozent],
  ['laeufe', 'Runs', (w) => zahl(w)],
  ['spieler', 'Unique Players', (w) => zahl(w)],
  ['laeufeJeSpieler', 'Runs pro Spieler', kommazahl],
  ['laeufeMedianJeSpieler', 'Median Runs pro Spieler', kommazahl],
  ['anteilMehrfach', 'Anteil ≥ 2 Runs', prozent],
  ['anteilDreiPlus', 'Anteil ≥ 3 Runs', prozent],
  ['dauerSchnitt', 'Ø Dauer', sekunden],
  ['dauerMedian', 'Median Dauer', sekunden],
  ['scoreMedian', 'Median Score', (w) => (w == null ? '—' : zahl(w))],
  ['anteilVerdacht', 'Anteil verdächtig', prozent],
  ['replayRate', 'REPLAY-RATE', prozent],
]

function SpielStatistik({ stats, laden, laeuft }) {
  return (
    <section className="trm-karte" id="adm-stats">
      <div className="trm-karte__kopf">
        <Ikon name="pokal" size={18} />
        <h2 className="trm-karte__titel">GAME-STATISTIK</h2>
      </div>
      <p className="trm-karte__sub">
        Nur Zahlen, keine Namen. Gezählt wird jeder Lauf außer „aus der Wertung“.
        REPLAY &lt; 60 S (wichtigste Kennzahl): Anteil der Läufe, die binnen 60 Sekunden
        nach dem Ende des vorigen Laufs derselben Person starten. REPLAY-RATE: dasselbe
        binnen fünf Minuten. Abbruch-Quote: gestartete Runden ohne gewerteten Lauf.
      </p>
      <div className="trm-adm__leiste">
        <button type="button" className="trm-cta trm-cta--klein trm-cta--umriss" onClick={laden} disabled={laeuft}>
          <RefreshCw size={15} aria-hidden="true" />
          {laeuft ? 'Lädt …' : 'Neu laden'}
        </button>
      </div>
      {stats == null ? (
        <p className="trm-feld__hilfe">{laeuft ? 'Lädt …' : 'Keine Daten.'}</p>
      ) : (
        <div className="trm-adm__rollen">
          <table className="trm-adm__tabelle trm-adm__tabelle--stats">
            <thead>
              <tr>
                <th scope="col">Kennzahl</th>
                {SPIELE_LISTE.map((s) => (
                  <th scope="col" key={s.key}>{s.titel}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAT_ZEILEN.map(([feld, titel, format]) => (
                <tr key={feld}>
                  <th scope="row">{titel}</th>
                  {SPIELE_LISTE.map((s) => (
                    <td className="trm-adm__zahl" key={s.key}>
                      {format(stats.spiele?.[s.key]?.[feld] ?? null)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Einladungen                                                         */
/* ------------------------------------------------------------------ */

/**
 * Die Kennzahlen in der Reihenfolge, in der sie hier gelesen werden — in
 * vier Blöcken: wer ist da, was macht die Kette, wie steht es mit Instagram,
 * und wer ist wofür berechtigt.
 *
 * Die dritte Spalte ist das Format, die Formel dazu kommt vom Server
 * (`daten.formeln`). Steht dort nichts, bleibt die Zeile ohne Erklärung —
 * hier wird keine erfunden.
 */
const EINLADUNG_ZEILEN = [
  ['spielerGesamt', 'Spieler gesamt', (w) => zahl(w)],
  ['spielerViaDeckel', 'davon über einen Deckel-Code', (w) => zahl(w)],
  ['spielerViaEinladung', 'davon über eine Einladung', (w) => zahl(w)],
  ['anteilViaEinladung', 'Anteil über Einladung', prozent],

  ['slotsProTeilnehmer', 'Einladungen pro Spieler', (w) => zahl(w)],
  ['einladungenErzeugt', 'Einladungen erzeugt', (w) => zahl(w)],
  ['einladungenWiderrufen', 'davon zurückgezogen', (w) => zahl(w)],
  ['einladungenGeoeffnet', 'Links geöffnet', (w) => zahl(w)],
  ['oeffnungenGesamt', 'Öffnungen gesamt', (w) => zahl(w)],
  ['einladungenVerwendet', 'Eingelöst', (w) => zahl(w)],
  ['aktiveKetten', 'Aktive Ketten', (w) => zahl(w)],
  ['einladungenJeSpieler', 'Ø Einladungen je Spieler', (w) => (w == null ? '—' : String(w))],
  ['tiefeMax', 'Tiefste Generation', (w) => zahl(w)],
  ['kFaktor', 'K-Faktor', (w) => (w == null ? '—' : String(w))],

  ['eingeladenDannDeckel', 'Eingeladene, die später einen Deckel aktiviert haben', (w) => zahl(w)],
  ['conversionRate', 'Conversion (Einladung → eigener Deckel)', prozent],

  ['folgtBestaetigt', 'Follow selbst bestätigt', (w) => zahl(w)],
  ['folgtGeprueft', 'Follow von Hand bestätigt', (w) => zahl(w)],
  ['folgtAbgelehnt', 'Follow von Hand abgelehnt', (w) => zahl(w)],
  ['folgtZuPruefen', 'Follow noch zu prüfen', (w) => zahl(w)],

  ['rankingTeilnehmer', 'Rankingberechtigt', (w) => zahl(w)],
  ['ziehungsberechtigte', 'Ziehungsberechtigt (Deckel vorhanden)', (w) => zahl(w)],
  ['offizielleTeilnehmer', 'Lose in der Deckel-Ziehung (Erstaktivierungen)', (w) => zahl(w)],
]

const EINLADUNG_STATUS = {
  eingeladen: 'offen',
  beigetreten: 'eingelöst',
}

/** Wie ein Konto entstanden ist — Deckel-Code oder Einladung. */
const QUELLE_TEXT = {
  deckel: 'DECKEL-CODE',
  einladung: 'EINLADUNG',
}

/**
 * Der Bereich EINLADUNGEN.
 *
 * WAS HIER BEWUSST FEHLT
 * ----------------------
 * Der Einladungstoken. Er steht auch in der Datenbank nur als Hash, und der
 * Server schickt ihn hier nicht mit — eine Verwaltung, die fremde Plaetze
 * selbst einloesen kann, waere kein Auswertungswerkzeug mehr.
 *
 * Und es gibt keinen Knopf „ziehungsberechtigt machen". Ein Los in der
 * Deckel-Ziehung entsteht ausschliesslich ueber einen echten, aktivierten
 * Deckel. Ein Umweg an dieser Pruefung vorbei wuerde genau das aushebeln,
 * worauf die Verlosung steht: 1 physischer Deckel = 1 Gewinnchance.
 *
 * Spielen, Scores und Ranking haengen daran ausdruecklich NICHT: wer ueber
 * eine Einladung hereinkommt, spielt voll mit und laedt selbst weiter ein.
 *
 * Angezeigt werden Instagram-Namen und Deckelnummern — dieselben Angaben wie
 * in jeder anderen Ansicht. Keine Adressen.
 */
function EinladungenAuswertung({ daten, laden, laeuft, einstellungen, speichern, standLaeuft }) {
  const [suche, setSuche] = useState('')
  const [slots, setSlots] = useState('')
  const zahlen = daten?.zahlen ?? null
  const formeln = daten?.formeln ?? {}
  const einlader = daten?.einlader ?? []
  const eingeladene = daten?.eingeladene ?? []

  /* Der gespeicherte Wert kommt mit dem Stand, nicht mit dieser Auswertung. */
  const gespeichert = String(einstellungen?.einladungenProTeilnehmer ?? '')
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlots(gespeichert)
  }, [gespeichert])

  return (
    <section className="trm-karte" id="adm-einladungen">
      <div className="trm-karte__kopf">
        <Ikon name="verbinden" size={18} />
        <h2 className="trm-karte__titel">EINLADUNGEN</h2>
      </div>
      <p className="trm-karte__sub">
        Jeder Spieler bekommt dieselben Einladungen — egal, ob er über einen Deckel-Code
        oder über eine Einladung hereingekommen ist. Eingeladene spielen alle Games, ihre
        Scores zählen in den Ranglisten und im Gesamtranking. Nur die Deckel-Ziehung bleibt
        den Deckelbesitzern vorbehalten. Der Einladungstoken wird hier nicht angezeigt.
      </p>

      {/* Die Zahl steht in der Datenbank, nicht im Code. 0 schliesst das
          Programm fuer neue Slots — bereits erzeugte Einladungen bleiben
          gueltig und werden dadurch nicht entwertet. */}
      <form
        className="trm-adm__paar"
        onSubmit={(ereignis) => {
          ereignis.preventDefault()
          speichern({ einladungenProTeilnehmer: slots })
        }}
      >
        <div className="trm-feld">
          <label className="trm-feld__label" htmlFor="adm-einladung-slots">
            Einladungen pro Spieler
          </label>
          <input
            id="adm-einladung-slots"
            className="trm-eingabe"
            type="number"
            inputMode="numeric"
            min="0"
            max="20"
            value={slots}
            onChange={(ereignis) => setSlots(ereignis.target.value)}
          />
          <p className="trm-feld__hilfe">
            Gilt nur für neue Slots. Der Server begrenzt den Wert zusätzlich.
          </p>
        </div>
        <div className="trm-adm__leiste">
          <button
            type="submit"
            className="trm-cta trm-cta--klein"
            disabled={standLaeuft || slots === gespeichert}
          >
            {standLaeuft ? 'Wird gespeichert …' : 'Speichern'}
          </button>
        </div>
      </form>

      <form
        className="trm-adm__suche"
        onSubmit={(ereignis) => {
          ereignis.preventDefault()
          laden(suche.trim())
        }}
      >
        <div className="trm-feld">
          <label className="trm-feld__label" htmlFor="adm-einladung-suche">
            Deckelnummer oder Instagram-Name
          </label>
          <input
            id="adm-einladung-suche"
            className="trm-eingabe"
            type="search"
            value={suche}
            onChange={(ereignis) => setSuche(ereignis.target.value)}
          />
        </div>
        <div className="trm-adm__leiste">
          <button type="submit" className="trm-cta trm-cta--klein" disabled={laeuft}>
            <Search size={15} aria-hidden="true" /> Suchen
          </button>
          <button
            type="button"
            className="trm-cta trm-cta--klein trm-cta--umriss"
            disabled={laeuft}
            onClick={() => {
              setSuche('')
              laden('')
            }}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {laeuft ? 'Lädt …' : 'Neu laden'}
          </button>
        </div>
      </form>

      {zahlen == null ? (
        <p className="trm-feld__hilfe">{laeuft ? 'Lädt …' : 'Keine Daten.'}</p>
      ) : (
        <>
          {/* Die Kennzahlen ignorieren die Suche: sie beschreiben immer die
              ganze Aktion, nicht den gerade gefilterten Ausschnitt. */}
          {EINLADUNG_ZEILEN.map(([feld, titel, format]) => (
            <Zeile key={feld} label={titel} hilfe={formeln[feld]}>
              {format(zahlen[feld] ?? null)}
            </Zeile>
          ))}

          <h3 className="trm-adm__untertitel">EINLADER</h3>
          {einlader.length === 0 ? (
            <p className="trm-feld__hilfe">Noch keine Einladungen erzeugt.</p>
          ) : (
            <ol className="trm-adm__liste">
              {einlader.map((e) => (
                <li key={e.id}>
                  <strong>{e.deckel != null ? deckelText(e.deckel) : instagramAnzeige(e.instagram)}</strong>
                  <span className="trm-adm__status">
                    {e.deckel != null ? instagramAnzeige(e.instagram) : 'ohne Deckel'}
                    {' · '}
                    {QUELLE_TEXT[e.quelle] ?? e.quelle}
                    {' · Gen. '}
                    {zahl(e.generation ?? 0)}
                  </span>
                  <span className="trm-adm__klein">
                    {e.slots
                      .map((s) => {
                        /* Ein belegter Platz zeigt, wer drinsitzt — mit
                           Deckelnummer nur dann, wenn diese Person auch
                           wirklich einen Deckel aktiviert hat. */
                        const wer = s.spieler
                          ? `${instagramAnzeige(s.spieler.instagram)}${
                              s.spieler.deckel != null ? ` · ${deckelText(s.spieler.deckel)}` : ''
                            }`
                          : `${zahl(s.oeffnungen)}× geöffnet`
                        return `#${s.slot} ${EINLADUNG_STATUS[s.status] ?? s.status} · ${wer}`
                      })
                      .join(' | ')}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <h3 className="trm-adm__untertitel">EINGELADENE SPIELER</h3>
          {eingeladene.length === 0 ? (
            <p className="trm-feld__hilfe">Noch niemand über eine Einladung dabei.</p>
          ) : (
            <ol className="trm-adm__liste">
              {eingeladene.map((g) => (
                <li key={g.id}>
                  <strong>{instagramAnzeige(g.instagram)}</strong>
                  {/* Ranking und Ziehung sind zwei verschiedene Dinge: das
                      erste haengt an Instagram, das zweite am Deckel. */}
                  <span className="trm-adm__status">
                    {g.deckel != null ? `Deckel ${deckelText(g.deckel)}` : 'ohne Deckel'}
                    {' · Ranking '}
                    {g.rankingOk ? 'ja' : 'nein'}
                    {' · Ziehung '}
                    {g.ziehungOk ? 'ja' : 'nein'}
                  </span>
                  <span className="trm-adm__klein">
                    {g.einladerInstagram ? `von ${instagramAnzeige(g.einladerInstagram)} · ` : ''}
                    {`Gen. ${zahl(g.generation ?? 0)} · `}
                    {terminText(g.eingeladenAm) ?? '—'}
                    {g.deckelAktiviertAm ? ` · Deckel ${terminText(g.deckelAktiviertAm)}` : ''}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Game-Leaderboard                                                    */
/* ------------------------------------------------------------------ */

/**
 * Die Filter ueber den Spielstaenden.
 *
 * `alle` schickt keinen Statusfilter mit - der Server filtert nur, wenn der
 * Wert einer der drei bekannten Status ist. Ein vierter Knopf "loeschen"
 * fehlt hier mit Absicht: fuer die normale Moderation reicht der Status, und
 * ein Lauf, der aus der Wertung genommen wurde, laesst sich damit jederzeit
 * wieder freigeben. Endgueltig entfernen kann diese Seite nichts.
 */
const SCORE_FILTER = [
  { key: 'alle', titel: 'Alle' },
  { key: 'gueltig', titel: 'Gültig' },
  { key: 'verdacht', titel: 'Verdächtig' },
  { key: 'verworfen', titel: 'Aus der Wertung' },
]

/** Der Status als Wort, wie er in der Zeile stehen soll. */
const SCORE_WORT = {
  gueltig: 'gültig',
  verdacht: 'verdächtig',
  verworfen: 'aus der Wertung',
}

/**
 * Laufzeit in Sekunden.
 *
 * Sie steht hier, weil sie der schnellste Betrugshinweis ist: ein Lauf mit
 * 40.000 Punkten nach neun Sekunden ist keiner.
 */
function laufzeitText(ms) {
  const wert = Number(ms)
  if (!Number.isFinite(wert) || wert <= 0) return '—'
  return `${(wert / 1000).toFixed(1)} s`
}

/* ------------------------------------------------------------------ */
/* Datenverwaltung — physische Deckeldaten                             */
/* ------------------------------------------------------------------ */

/**
 * Hier wird geloescht, und zwar nur eine Sorte Daten: alles, was an einem
 * physischen Bierdeckel haengt. Spielstaende, Konten, Einladungen und
 * Ranglisten bleiben stehen — das ist keine Absichtserklaerung, sondern
 * steht so in api/_terminal-deckel.js: der Reset fasst die Score-Tabelle
 * nicht an.
 *
 * DER KNOPF ENTSCHEIDET NICHTS
 * ----------------------------
 * Das Pflichtwort prueft der Server. Wer den Browser umgeht und den Aufruf
 * von Hand absetzt, bekommt ohne das Wort ein 400 zurueck. Die Abfrage hier
 * ist die zweite Huerde, nicht die einzige.
 */

const DECKEL_RESET_WORT = 'DECKEL LÖSCHEN'

const DECKEL_BLEIBT = [
  'Spieler und ihre Konten',
  'Instagram-Namen',
  'Einladungen und Einladungsketten',
  'Game-Scores',
  'Einzel-Bestenlisten und Gesamtranking',
  'Followerzahl und Instagram-Sync',
]

const DECKEL_WEG = [
  'physische Deckelnummern',
  'Deckelansprüche (Erstaktivierung und weiterer Besitzanspruch)',
  'Deckel-Wiederherstellungen',
  'bisherige Ziehungen und Deckel-Meldungen',
]

const DECKEL_FEHLER = {
  pause: 'Schreiben ist über TERMINAL_SCHREIBEN angehalten.',
  zugang: 'Schlüssel nicht mehr gültig. Bitte neu anmelden.',
  bremse: 'Zu viele Versuche. Bitte später erneut.',
  netz: 'Keine Verbindung.',
  felder: 'Keine gültige Deckelnummer.',
  bestaetigung: `Der Server hat das Pflichtwort „${DECKEL_RESET_WORT}“ nicht erhalten.`,
  server: 'Die Datenbank hat nicht geantwortet.',
}

const anspruchWort = (wert) =>
  wert === 'erstaktivierung' ? 'Erstaktivierung' : wert === 'weiterer_besitzanspruch' ? 'weiterer Besitzanspruch' : '—'

function Datenverwaltung({ rufen, standLaden }) {
  const [stand, setStand] = useState(null)
  const [laedt, setLaedt] = useState(false)
  const [nummer, setNummer] = useState('')
  const [vorschau, setVorschau] = useState(null)
  const [wort, setWort] = useState('')
  const [frage, setFrage] = useState(false)
  const [bericht, setBericht] = useState(null)
  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')
  const [alleZeigen, setAlleZeigen] = useState(false)

  const laden = useCallback(async () => {
    setLaedt(true)
    const antwort = await rufen({ aktion: 'deckel-stand' })
    setLaedt(false)
    if (antwort?.ok) setStand(antwort.stand)
    else setFehler(DECKEL_FEHLER[antwort?.grund] ?? 'Der Deckelstand konnte nicht gelesen werden.')
  }, [rufen])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    laden()
  }, [laden])

  const belegt = stand?.belegt ?? []
  const sichtbar = alleZeigen ? belegt : belegt.slice(0, 20)

  async function vorschauHolen() {
    setMeldung('')
    setFehler('')
    setVorschau(null)
    setLaedt(true)
    const antwort = await rufen({ aktion: 'deckel-vorschau', nummer })
    setLaedt(false)
    if (antwort?.ok) setVorschau(antwort.vorschau)
    else setFehler(DECKEL_FEHLER[antwort?.grund] ?? 'Die Vorschau konnte nicht geladen werden.')
  }

  async function einzelnReset() {
    setMeldung('')
    setFehler('')
    setLaedt(true)
    const antwort = await rufen({ aktion: 'deckel-reset', nummer: vorschau.nummer })
    setLaedt(false)
    if (!antwort?.ok) {
      setFehler(DECKEL_FEHLER[antwort?.grund] ?? 'Das Zurücksetzen hat nicht funktioniert.')
      return
    }
    setStand(antwort.stand)
    setVorschau(null)
    setNummer('')
    setMeldung(
      `Deckel ${antwort.nummer} zurückgesetzt: ${zahl(antwort.geaendert?.teilnehmer ?? 0)} Teilnehmerzeile(n) gelöst, `
      + `${zahl(antwort.geaendert?.wiederherstellungen ?? 0)} Wiederherstellung(en), `
      + `${zahl(antwort.geaendert?.ziehungen ?? 0)} Ziehung(en), `
      + `${zahl(antwort.geaendert?.meldungen ?? 0)} Meldung(en) entfernt. Scores unberührt.`,
    )
    await standLaden()
  }

  async function allesReset() {
    setMeldung('')
    setFehler('')
    setLaedt(true)
    const antwort = await rufen({ aktion: 'deckel-reset-alle', bestaetigung: DECKEL_RESET_WORT })
    setLaedt(false)
    if (!antwort?.ok) {
      setFehler(
        DECKEL_FEHLER[antwort?.grund] ??
        (antwort?.schritt ? `Abgebrochen bei „${antwort.schritt}“. Erneut ausführen setzt fort.` : 'Der Reset hat nicht funktioniert.'),
      )
      return
    }
    setStand(antwort.stand)
    setBericht(antwort)
    setFrage(false)
    setWort('')
    setVorschau(null)
    setMeldung(
      antwort.sauber
        ? 'Alle physischen Deckeldaten sind zurückgesetzt. Aktivierte Deckel: 0, Besitzansprüche: 0.'
        : 'Der Reset lief durch, es stehen aber noch Deckeldaten in der Datenbank. Bitte erneut ausführen.',
    )
    await standLaden()
  }

  return (
    <section className="trm-karte" id="adm-datenverwaltung">
      <div className="trm-karte__kopf">
        <Database size={18} aria-hidden="true" />
        <h2 className="trm-karte__titel">DATENVERWALTUNG</h2>
      </div>
      <p className="trm-karte__sub">
        Physische Deckeldaten ansehen und zurücksetzen. Spielstände und Konten bleiben dabei stehen.
      </p>

      {meldung && <p className="trm-meldung" role="status">{meldung}</p>}
      {fehler && <p className="trm-meldung trm-meldung--fehler" role="alert">{fehler}</p>}

      <h3 className="trm-adm__untertitel">DECKELDATEN</h3>
      <Zeile label="Aktivierte Deckel">{zahl(stand?.aktiviert ?? 0)}</Zeile>
      <Zeile label="Besitzansprüche gesamt" hilfe={`${zahl(stand?.erstaktivierungen ?? 0)} Erstaktivierung, ${zahl(stand?.weitereAnsprueche ?? 0)} weiterer Anspruch`}>
        {zahl(stand?.ansprueche ?? 0)}
      </Zeile>
      <Zeile label="Wiederherstellungen">{zahl(stand?.wiederherstellungen ?? 0)}</Zeile>
      <Zeile label="Bisherige Ziehungen" hilfe={`${zahl(stand?.meldungen ?? 0)} Deckel-Meldung(en)`}>
        {zahl(stand?.ziehungen ?? 0)}
      </Zeile>
      <Zeile label="Bleibt stehen" hilfe="wird vom Reset nicht angefasst">
        {zahl(stand?.scores ?? 0)} Scores · {zahl(stand?.teilnehmerGesamt ?? 0)} Spieler
      </Zeile>

      <div className="trm-adm__leiste">
        <button type="button" className="trm-cta trm-cta--klein trm-cta--umriss" disabled={laedt} onClick={laden}>
          <RefreshCw size={15} aria-hidden="true" /> NEU LADEN
        </button>
      </div>

      {belegt.length > 0 && (
        <>
          <h3 className="trm-adm__untertitel">BELEGTE NUMMERN</h3>
          <div className="trm-adm__rollen" data-deckel-liste="1">
            <table className="trm-adm__tabelle">
              <thead>
                <tr>
                  <th scope="col">Nr.</th>
                  <th scope="col">Instagram</th>
                  <th scope="col">Anspruch</th>
                  <th scope="col">Aktiviert</th>
                </tr>
              </thead>
              <tbody>
                {sichtbar.map((z) => (
                  <tr key={z.id}>
                    <td>{z.nummer}</td>
                    <td>{instagramAnzeige(z.instagram)}</td>
                    <td>{anspruchWort(z.anspruch)}</td>
                    <td>{terminText(z.aktiviertAm) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {belegt.length > 20 && (
            <div className="trm-adm__leiste">
              <button
                type="button"
                className="trm-cta trm-cta--klein trm-cta--umriss"
                onClick={() => setAlleZeigen((a) => !a)}
              >
                {alleZeigen ? 'Nur die ersten 20' : `Alle ${zahl(belegt.length)} zeigen`}
              </button>
            </div>
          )}
        </>
      )}

      {/* ---- A) einzelnen Deckel zuruecksetzen ---- */}
      <h3 className="trm-adm__untertitel">EINZELNEN DECKEL ZURÜCKSETZEN</h3>
      <div className="trm-feld">
        <label className="trm-feld__label" htmlFor="adm-deckel-nummer">Deckelnummer</label>
        <input
          id="adm-deckel-nummer"
          className="trm-eingabe"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={nummer}
          disabled={laedt}
          onChange={(ereignis) => {
            setNummer(ereignis.target.value)
            setVorschau(null)
          }}
        />
        <p className="trm-feld__hilfe">
          Erst ansehen, was an der Nummer hängt — zurückgesetzt wird erst im zweiten Schritt.
        </p>
      </div>
      <div className="trm-adm__leiste">
        <button
          type="button"
          className="trm-cta trm-cta--klein"
          disabled={laedt || !nummer.trim()}
          onClick={vorschauHolen}
        >
          <Search size={15} aria-hidden="true" /> VORSCHAU
        </button>
      </div>

      {vorschau && (
        <div className="trm-adm__gefahr" data-deckel-vorschau={vorschau.nummer}>
          <p className="trm-adm__gefahr-kopf">
            <Hash size={15} aria-hidden="true" /> Deckel {vorschau.nummer}
          </p>
          {vorschau.gefunden === 0 ? (
            <p className="trm-feld__hilfe">
              Diese Nummer ist keinem Teilnehmer zugeordnet.
              {vorschau.ziehungen > 0 || vorschau.meldungen > 0
                ? ` Es hängen aber noch ${zahl(vorschau.ziehungen)} Ziehung(en) und ${zahl(vorschau.meldungen)} Meldung(en) daran.`
                : ' Es gibt nichts zurückzusetzen.'}
            </p>
          ) : (
            <ul className="trm-adm__liste">
              {vorschau.teilnehmer.map((t) => (
                <li key={t.id}>
                  <strong>{instagramAnzeige(t.instagram)}</strong> — {anspruchWort(t.anspruch)}, Status {t.status ?? '—'}
                  {t.aktiviertAm ? `, aktiviert ${terminText(t.aktiviertAm)}` : ''}
                  {t.eingeladen ? ', eingeladen' : ''}
                  {t.folgtBestaetigt ? ', Follow bestätigt' : ''}
                </li>
              ))}
            </ul>
          )}
          <p className="trm-feld__hilfe">
            Wird entfernt: Deckelnummer, Anspruch, {zahl(vorschau.wiederherstellungen)} Wiederherstellung(en),{' '}
            {zahl(vorschau.ziehungen)} Ziehung(en), {zahl(vorschau.meldungen)} Meldung(en). Bleibt erhalten:
            der Spieler selbst mit {zahl(vorschau.scores)} Score(s), Instagram-Name und Einladungen.
          </p>
          <div className="trm-adm__leiste">
            <button
              type="button"
              className="trm-cta trm-cta--klein trm-cta--gefahr"
              disabled={laedt || (vorschau.gefunden === 0 && vorschau.ziehungen === 0 && vorschau.meldungen === 0)}
              onClick={einzelnReset}
            >
              <Trash2 size={15} aria-hidden="true" /> DECKEL ZURÜCKSETZEN
            </button>
            <button
              type="button"
              className="trm-cta trm-cta--klein trm-cta--umriss"
              disabled={laedt}
              onClick={() => setVorschau(null)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* ---- B) alles zuruecksetzen ---- */}
      <h3 className="trm-adm__untertitel">ALLE DECKELDATEN ZURÜCKSETZEN</h3>
      <div className="trm-adm__paar" data-deckel-folgen="1">
        <div>
          <p className="trm-adm__label">Bleibt erhalten:</p>
          <ul className="trm-adm__liste">
            {DECKEL_BLEIBT.map((t) => <li key={t}><Check size={14} aria-hidden="true" /> {t}</li>)}
          </ul>
        </div>
        <div>
          <p className="trm-adm__label">Wird gelöscht/zurückgesetzt:</p>
          <ul className="trm-adm__liste">
            {DECKEL_WEG.map((t) => <li key={t}><Trash2 size={14} aria-hidden="true" /> {t}</li>)}
          </ul>
        </div>
      </div>

      <div className="trm-adm__gefahr trm-adm__gefahr--stark">
        <p className="trm-adm__gefahr-kopf">
          <AlertTriangle size={16} aria-hidden="true" /> Diese Aktion lässt sich nicht rückgängig machen.
        </p>
        <div className="trm-feld">
          <label className="trm-feld__label" htmlFor="adm-deckel-wort">
            Zum Freischalten „{DECKEL_RESET_WORT}“ eintippen
          </label>
          <input
            id="adm-deckel-wort"
            className="trm-eingabe"
            type="text"
            autoComplete="off"
            spellCheck="false"
            value={wort}
            disabled={laedt}
            onChange={(ereignis) => {
              setWort(ereignis.target.value)
              setFrage(false)
            }}
          />
        </div>

        {!frage ? (
          <div className="trm-adm__leiste">
            <button
              type="button"
              className="trm-cta trm-cta--gefahr"
              disabled={laedt || wort.trim() !== DECKEL_RESET_WORT}
              onClick={() => setFrage(true)}
              data-deckel-reset-alle="1"
            >
              <Trash2 size={16} aria-hidden="true" /> ALLE DECKELDATEN ZURÜCKSETZEN
            </button>
          </div>
        ) : (
          <div role="alertdialog" aria-label="Alle Deckeldaten zurücksetzen">
            <p className="trm-adm__gefahr-kopf">Wirklich alle physischen Deckeldaten löschen?</p>
            <div className="trm-adm__leiste">
              <button
                type="button"
                className="trm-cta trm-cta--gefahr"
                disabled={laedt}
                onClick={allesReset}
                data-deckel-reset-ja="1"
              >
                <Trash2 size={16} aria-hidden="true" /> JA, ALLES LÖSCHEN
              </button>
              <button
                type="button"
                className="trm-cta trm-cta--klein trm-cta--umriss"
                disabled={laedt}
                onClick={() => setFrage(false)}
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

      {bericht && (
        <>
          <h3 className="trm-adm__untertitel">LETZTER RESET</h3>
          <Zeile label="Vorher" hilfe="aktivierte Deckel · Ansprüche">
            {zahl(bericht.vorher?.aktiviert ?? 0)} · {zahl(bericht.vorher?.ansprueche ?? 0)}
          </Zeile>
          <Zeile label="Nachher" hilfe="aktivierte Deckel · Ansprüche">
            {zahl(bericht.stand?.aktiviert ?? 0)} · {zahl(bericht.stand?.ansprueche ?? 0)}
          </Zeile>
          <Zeile label="Geändert">
            {zahl(bericht.geaendert?.teilnehmer ?? 0)} Teilnehmer, {zahl(bericht.geaendert?.reste ?? 0)} Restfelder,{' '}
            {zahl(bericht.geaendert?.wiederherstellungen ?? 0)} Wiederherstellungen,{' '}
            {zahl(bericht.geaendert?.ziehungen ?? 0)} Ziehungen, {zahl(bericht.geaendert?.meldungen ?? 0)} Meldungen
          </Zeile>
          <Zeile label="Scores unberührt">{zahl(bericht.stand?.scores ?? 0)}</Zeile>
        </>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Seite                                                               */
/* ------------------------------------------------------------------ */

export default function TerminalAdmin() {
  const [schluessel, setSchluessel] = useState(null)
  const [angemeldet, setAngemeldet] = useState(false)
  const [torFehler, setTorFehler] = useState('')
  const [daten, setDaten] = useState(null)
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState('')
  const [fehler, setFehler] = useState('')
  const [suche, setSuche] = useState('')
  const [treffer, setTreffer] = useState(null)

  /* Das Game-Leaderboard laedt getrennt vom Stand der Aktion. Es hat eigene
     Filter, wird oefter angefasst und darf die Ziehungsdaten nicht mitziehen
     - deshalb ein eigener Ruf und ein eigener Zustand. */
  const [scores, setScores] = useState(null)
  const [scoreFilter, setScoreFilter] = useState('alle')
  const [scoreSuche, setScoreSuche] = useState('')
  const [scoreAbfrage, setScoreAbfrage] = useState('')
  const [scoreLaeuft, setScoreLaeuft] = useState(false)
  const [scoreSpiel, setScoreSpiel] = useState('')
  const [stats, setStats] = useState(null)
  const [statsLaeuft, setStatsLaeuft] = useState(false)

  /* Die Einladungsauswertung laedt ebenfalls getrennt: sie hat eine eigene
     Suche und liest zwei komplette Tabellen. */
  const [einladungen, setEinladungen] = useState(null)
  const [einladungenLaeuft, setEinladungenLaeuft] = useState(false)

  /* Der gemerkte Schluessel wird erst im Effekt gelesen: waehrend des
     Vorrenderns gibt es kein window, und der erste Klientenlauf muss
     dieselbe Ausgabe erzeugen wie der Server. */
  useEffect(() => {
    const gemerkt = sitzungLesen(SPEICHER_ADMIN)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (gemerkt) setSchluessel(gemerkt)
  }, [])

  const rufen = useCallback(
    async (nutzlast) => {
      if (!schluessel) return { ok: false, grund: 'zugang' }
      return terminalAdminRuf(schluessel, nutzlast)
    },
    [schluessel],
  )

  const standLaden = useCallback(async () => {
    if (!schluessel) return
    setLaeuft(true)
    const antwort = await terminalAdminRuf(schluessel, { aktion: 'stand' })
    setLaeuft(false)
    if (antwort.ok) {
      setDaten(antwort)
      setAngemeldet(true)
      setTorFehler('')
      sitzungSchreiben(SPEICHER_ADMIN, schluessel)
      return
    }
    setAngemeldet(false)
    sitzungSchreiben(SPEICHER_ADMIN, null)
    setTorFehler(
      antwort.grund === 'zugang'
        ? 'Schlüssel nicht gültig.'
        : antwort.grund === 'bremse'
          ? 'Zu viele Versuche. Bitte später erneut.'
          : antwort.grund === 'netz'
          ? 'Keine Verbindung.'
          : 'Die Verwaltung ist nicht eingerichtet.',
    )
  }, [schluessel])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    standLaden()
  }, [standLaden])

  const scoresLaden = useCallback(async () => {
    if (!schluessel) return
    setScoreLaeuft(true)
    const antwort = await terminalAdminRuf(schluessel, {
      aktion: 'scores',
      filter: scoreFilter,
      suche: scoreAbfrage,
      game: scoreSpiel,
    })
    setScoreLaeuft(false)
    if (antwort.ok) setScores(antwort.scores ?? [])
  }, [schluessel, scoreFilter, scoreAbfrage, scoreSpiel])

  const einladungenLaden = useCallback(
    async (begriff = '') => {
      if (!schluessel) return
      setEinladungenLaeuft(true)
      const antwort = await terminalAdminRuf(schluessel, { aktion: 'einladungen', suche: begriff })
      setEinladungenLaeuft(false)
      if (antwort.ok) setEinladungen(antwort)
    },
    [schluessel],
  )

  const statsLaden = useCallback(async () => {
    if (!schluessel) return
    setStatsLaeuft(true)
    const antwort = await terminalAdminRuf(schluessel, { aktion: 'stats' })
    setStatsLaeuft(false)
    if (antwort.ok) setStats(antwort)
  }, [schluessel])

  /* Erst laden, wenn der Schluessel einmal getragen hat. Vorher stuende in
     der Liste ohnehin nur eine abgewiesene Antwort. */
  useEffect(() => {
    if (!angemeldet) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    scoresLaden()
  }, [angemeldet, scoresLaden])

  useEffect(() => {
    if (!angemeldet) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    statsLaden()
  }, [angemeldet, statsLaden])

  useEffect(() => {
    if (!angemeldet) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    einladungenLaden()
  }, [angemeldet, einladungenLaden])

  if (!angemeldet) {
    return (
      <>
        <Seo
          title="Verwaltung – VIDEKO Aktion"
          description="Interne Verwaltung der Bierdeckel-Aktion."
          canonicalPath="/terminal/admin"
          noindex
          nofollow
        />
        <TerminalRahmen>
          <Anmeldung
            beiAnmeldung={(wert) => {
              setTorFehler('')
              setSchluessel(wert)
            }}
            fehler={torFehler}
            laeuft={laeuft}
          />
        </TerminalRahmen>
      </>
    )
  }

  const einstellungen = daten?.einstellungen ?? {}
  /* Der Nenner der Follower-Metrik ist die naechste echte Stufe, nicht das
     handgepflegte Follower-Ziel — sonst stuende hier eine Schwelle, die
     laengst gefallen ist. Steht die 5.000, bleibt sie stehen. */
  const missionAdmin = missionStand(einstellungen.followerZahl ?? 0, einstellungen.meilensteinGewinne)
  const missionZiel = missionAdmin.naechste?.ziel ?? MEGA_MEILENSTEIN
  const teilnehmer = treffer ?? daten?.teilnehmer ?? []
  const ziehungen = daten?.ziehungen ?? []
  const meldungen = daten?.meldungen ?? []
  const offeneZiehung = ziehungen.find((z) => z.status === 'offen') ?? null

  async function handeln(nutzlast, erfolgstext) {
    setMeldung('')
    setFehler('')
    setLaeuft(true)
    const antwort = await rufen(nutzlast)
    setLaeuft(false)
    if (antwort.ok) {
      setMeldung(erfolgstext)
      await standLaden()
      return antwort
    }
    setFehler(
      {
        offen: 'Es läuft noch eine Ziehung. Erst abschließen, dann neu ziehen.',
        leer: 'Es gibt keine ziehbare Nummer mehr.',
        pause: 'Schreiben ist über TERMINAL_SCHREIBEN angehalten.',
        zugang: 'Schlüssel nicht mehr gültig. Bitte neu anmelden.',
        bremse: 'Zu viele Versuche. Bitte später erneut.',
        netz: 'Keine Verbindung.',
        felder: 'Eingabe nicht gültig.',
        abgeschlossen: 'Das Gesamtranking ist abgeschlossen — Hauptgames stehen fest.',
        bestaetigung: 'Es gibt schon gewertete Runs. Zum Ändern „HAUPTGAME WIRKLICH ÄNDERN“ bestätigen.',
        server: 'Die Datenbank hat nicht geantwortet. Nichts wurde gespeichert.',
      }[antwort.grund] ?? 'Das hat nicht funktioniert.',
    )
    if (antwort.grund === 'zugang') setAngemeldet(false)
    return antwort
  }

  /* Instagram-Follower jetzt holen. Anders als handeln wird danach in jedem
     Fall neu geladen: auch ein Fehlschlag steht mit Zeit und Grund im Stand. */
  async function instagramSynchronisieren() {
    setMeldung('')
    setFehler('')
    setLaeuft(true)
    const antwort = await rufen({ aktion: 'instagram-sync' })
    setLaeuft(false)
    if (antwort.grund === 'zugang') {
      setFehler('Schlüssel nicht mehr gültig. Bitte neu anmelden.')
      setAngemeldet(false)
      return
    }
    if (antwort.ok) {
      setMeldung(
        antwort.hinweis === 'schema-fehlt'
          ? `Instagram-Sync: ${zahl(antwort.wert)} Follower übernommen (Sync-Spalten fehlen noch in der Datenbank).`
          : `Instagram-Sync: ${zahl(antwort.wert)} Follower übernommen.`,
      )
    } else if (antwort.grund === 'bremse') {
      setFehler('Zu viele Versuche. Bitte später erneut.')
    } else {
      setFehler(instagramFehlerText(antwort.grund))
    }
    await standLaden()
  }

  async function suchen(ereignis) {
    ereignis.preventDefault()
    const begriff = suche.trim()
    if (!begriff) {
      setTreffer(null)
      return
    }
    const antwort = await rufen({ aktion: 'suche', suche: begriff })
    if (antwort.ok) setTreffer(antwort.teilnehmer ?? [])
    else setFehler('Die Suche hat nicht funktioniert.')
  }

  async function exportieren() {
    const antwort = await rufen({ aktion: 'csv' })
    if (!antwort.ok || !antwort.csv) {
      setFehler('Der Export hat nicht funktioniert.')
      return
    }
    /* Die Datei wird im Browser aus der Antwort gebaut. So geht kein Link mit
       Teilnehmerdaten durch die Adresszeile oder in ein Serverprotokoll. */
    const blob = new Blob([antwort.csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `videko-deckel-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.append(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  /**
   * Testmodus starten.
   *
   * Der Server stellt einen signierten Testbeleg aus — erst nach der
   * Anmeldung, die weiter oben schon getragen hat. Der Admin-Schluessel bleibt
   * dabei, wo er ist: er wandert als Kopfzeile hin und kommt nicht zurueck.
   * In die Adresszeile geht ueberhaupt nichts.
   *
   * Danach wird im selben Tab /terminal neu geladen. Absichtlich kein neues
   * Fenster: der Beleg liegt in sessionStorage, und sessionStorage teilt sich
   * nur ein Tab mit sich selbst.
   */
  async function testmodusStarten() {
    setMeldung('')
    setFehler('')
    setLaeuft(true)
    const antwort = await rufen({ aktion: 'testsession' })
    setLaeuft(false)
    if (!antwort.ok || !antwort.probe) {
      setFehler(
        antwort.grund === 'zugang'
          ? 'Schlüssel nicht mehr gültig. Bitte neu anmelden.'
          : 'Der Testmodus liess sich nicht starten.',
      )
      if (antwort.grund === 'zugang') setAngemeldet(false)
      return
    }
    probeSetzen(antwort.probe)
    /* Ein Testlauf faengt beim Ersteinstieg an — also auch beim Intro. Das
       braucht ein echtes Laden: ob die Sequenz laeuft, entscheidet das
       Skript im Dokumentkopf, und ein Wechsel innerhalb der App liefe daran
       vorbei. */
    introNochmal('/terminal')
  }

  /**
   * Status eines Laufs aendern - nicht loeschen.
   *
   * Der Server schickt die gefilterte Liste gleich zurueck, damit die Zeile
   * sofort richtig dasteht, ohne den kompletten Stand neu zu ziehen.
   */
  async function scoreSetzen(id, status, erfolgstext) {
    setMeldung('')
    setFehler('')
    setScoreLaeuft(true)
    const antwort = await rufen({
      aktion: 'score-status',
      id,
      status,
      filter: scoreFilter,
      suche: scoreAbfrage,
      game: scoreSpiel,
    })
    setScoreLaeuft(false)
    if (antwort.ok) {
      setScores(antwort.scores ?? [])
      setMeldung(erfolgstext)
      return
    }
    setFehler(
      antwort.grund === 'zugang'
        ? 'Schlüssel nicht mehr gültig. Bitte neu anmelden.'
        : 'Das hat nicht funktioniert.',
    )
    if (antwort.grund === 'zugang') setAngemeldet(false)
  }

  function scoreSuchen(ereignis) {
    ereignis.preventDefault()
    setScoreAbfrage(scoreSuche.trim())
  }

  return (
    <>
      <Seo
        title="Verwaltung – VIDEKO Aktion"
        description="Interne Verwaltung der Bierdeckel-Aktion."
        canonicalPath="/terminal/admin"
        noindex
        nofollow
      />

      <TerminalRahmen>
        <h1 className="trm-titel trm-gold">VERWALTUNG</h1>
        <p className="trm-sub">Bierdeckel-Aktion · {TERMINAL_KAMPAGNE.id}</p>
        <Raute />

        <div className="trm-adm__leiste">
          <button type="button" className="trm-cta trm-cta--klein trm-cta--umriss" onClick={standLaden} disabled={laeuft}>
            <RefreshCw size={15} aria-hidden="true" />
            {laeuft ? 'Lädt …' : 'Neu laden'}
          </button>
          <button
            type="button"
            className="trm-cta trm-cta--klein trm-cta--umriss"
            onClick={() => {
              sitzungSchreiben(SPEICHER_ADMIN, null)
              setSchluessel(null)
              setAngemeldet(false)
              setDaten(null)
            }}
          >
            Abmelden
          </button>
        </div>

        {meldung && <p className="trm-meldung" role="status">{meldung}</p>}
        {fehler && <p className="trm-meldung trm-meldung--fehler" role="alert">{fehler}</p>}

        <div className="trm-metriken">
          <Metrik
            ikon="deckel"
            label="AKTIVIERTE DECKEL"
            wert={zahl(daten?.aktiviert ?? 0)}
            von={`/ ${zahl(GESAMT)}`}
          />
          <Metrik
            ikon="instagram"
            label="FOLLOWER"
            wert={zahl(einstellungen.followerZahl)}
            von={`/ ${zahl(missionZiel)}`}
          />
        </div>

        {daten?.schreiben === false && (
          <p className="trm-meldung trm-meldung--fehler">
            <AlertTriangle size={15} aria-hidden="true" /> TERMINAL_SCHREIBEN steht auf 0 —
            Aktivierungen und Ziehungen sind angehalten.
          </p>
        )}

        {/* ---------------- Ziehung ---------------- */}
        <section className="trm-karte">
          <div className="trm-karte__kopf">
            <Dices size={18} aria-hidden="true" />
            <h2 className="trm-karte__titel">ZIEHUNG</h2>
          </div>

          {offeneZiehung ? (
            <>
              <Zeile label="Gesucht">{deckelText(offeneZiehung.deckel_nummer)}</Zeile>
              <Zeile label="Gezogen am">{terminText(offeneZiehung.gezogen_am) ?? '—'}</Zeile>
              <Zeile label="Meldefrist bis">
                {terminText(offeneZiehung.meldefrist_bis) ?? '—'}
              </Zeile>

              <p className="trm-feld__hilfe">
                Gültig ist ein Gewinn erst, wenn Originaldeckel, Teilnehmereintrag,
                Instagram-Follow und Frist von Hand geprüft wurden.
              </p>

              <Gewinnfall
                nummer={offeneZiehung.deckel_nummer}
                teilnehmer={daten?.teilnehmer ?? []}
                laeuft={laeuft}
                bestaetigen={(id) =>
                  handeln({ aktion: 'besitz-bestaetigen', id }, 'Besitz bestätigt.')
                }
              />

              <div className="trm-adm__leiste">
                <button
                  type="button"
                  className="trm-cta trm-cta--klein"
                  disabled={laeuft}
                  onClick={() =>
                    handeln(
                      { aktion: 'ziehung-status', id: offeneZiehung.id, status: 'geclaimt' },
                      'Ziehung als eingelöst vermerkt.',
                    )
                  }
                >
                  <Check size={15} aria-hidden="true" /> Eingelöst
                </button>
                <button
                  type="button"
                  className="trm-cta trm-cta--klein trm-cta--umriss"
                  disabled={laeuft}
                  onClick={() =>
                    handeln(
                      { aktion: 'ziehung-status', id: offeneZiehung.id, status: 'abgelaufen' },
                      'Frist als abgelaufen vermerkt. Es darf neu gezogen werden.',
                    )
                  }
                >
                  Frist abgelaufen
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="trm-karte__sub">
                Keine offene Ziehung. Gezogen wird auf dem Server, ausschließlich aus
                aktivierten Deckelnummern, die noch nicht gezogen wurden.
              </p>
              <button
                type="button"
                className="trm-cta"
                disabled={laeuft}
                onClick={() => handeln({ aktion: 'ziehen' }, 'Eine Nummer wurde gezogen.')}
              >
                <Dices size={16} aria-hidden="true" /> NUMMER ZIEHEN
              </button>
            </>
          )}

          {ziehungen.length > 0 && (
            <ol className="trm-adm__liste">
              {ziehungen.map((z) => (
                <li key={z.id}>
                  <strong>{deckelText(z.deckel_nummer)}</strong>
                  <span className="trm-adm__status">{z.status}</span>
                  <span className="trm-adm__klein">{terminText(z.gezogen_am) ?? '—'}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <Einstellungen
          einstellungen={einstellungen}
          laeuft={laeuft}
          instagramSync={daten?.instagramSync}
          synchronisieren={instagramSynchronisieren}
          speichern={(felder) =>
            handeln({ aktion: 'einstellungen', ...felder }, 'Einstellungen gespeichert.')
          }
        />

        <MissionGewinne
          einstellungen={einstellungen}
          laeuft={laeuft}
          speichern={(felder) =>
            handeln({ aktion: 'einstellungen', ...felder }, 'Meilensteine gespeichert.')
          }
        />

        <SpielSchalter
          einstellungen={einstellungen}
          laeuft={laeuft}
          speichern={(felder, text) => handeln({ aktion: 'einstellungen', ...felder }, text)}
        />

        <GesamtrankingVerwaltung
          einstellungen={einstellungen}
          laeuft={laeuft}
          handeln={handeln}
          rufen={rufen}
        />

        <SpielStatistik stats={stats} laden={statsLaden} laeuft={statsLaeuft} />

        <EinladungenAuswertung
          daten={einladungen}
          laden={einladungenLaden}
          laeuft={einladungenLaeuft}
          einstellungen={einstellungen}
          standLaeuft={laeuft}
          speichern={(felder) =>
            handeln({ aktion: 'einstellungen', ...felder }, 'Einladungsslots gespeichert.')
          }
        />

        {/* ---------------- Teilnehmer ---------------- */}
        <section className="trm-karte">
          <div className="trm-karte__kopf">
            <Users size={18} aria-hidden="true" />
            <h2 className="trm-karte__titel">AKTIVIERUNGEN</h2>
          </div>

          <form className="trm-adm__suche" onSubmit={suchen}>
            <div className="trm-feld">
              <label className="trm-feld__label" htmlFor="adm-suche">
                Deckelnummer oder Instagram-Name
              </label>
              <input
                id="adm-suche"
                className="trm-eingabe"
                type="search"
                value={suche}
                onChange={(ereignis) => setSuche(ereignis.target.value)}
              />
            </div>
            <div className="trm-adm__leiste">
              <button type="submit" className="trm-cta trm-cta--klein">
                <Search size={15} aria-hidden="true" /> Suchen
              </button>
              {treffer && (
                <button
                  type="button"
                  className="trm-cta trm-cta--klein trm-cta--umriss"
                  onClick={() => {
                    setSuche('')
                    setTreffer(null)
                  }}
                >
                  Filter aufheben
                </button>
              )}
              <button
                type="button"
                className="trm-cta trm-cta--klein trm-cta--umriss"
                onClick={exportieren}
              >
                <Download size={15} aria-hidden="true" /> CSV
              </button>
            </div>
          </form>

          <p className="trm-feld__hilfe">
            {teilnehmer.length === 0
              ? 'Keine Einträge.'
              : `${zahl(teilnehmer.length)} Einträge. E-Mail-Adressen stehen hier bewusst nicht — sie sind im CSV-Export und beim Gewinnfall. Diese Liste enthält personenbezogene Daten, nicht weitergeben.`}
          </p>

          {teilnehmer.length > 0 && (
            <div className="trm-adm__rollen">
              <table className="trm-adm__tabelle">
                <thead>
                  <tr>
                    <th scope="col">Deckel</th>
                    <th scope="col">Instagram</th>
                    <th scope="col">Quelle</th>
                    <th scope="col">Follow</th>
                    <th scope="col">Ranking</th>
                    <th scope="col">Ziehung</th>
                    <th scope="col">Einladungen</th>
                    <th scope="col">Gen.</th>
                    <th scope="col">Aktiviert</th>
                    <th scope="col">Anspruch</th>
                  </tr>
                </thead>
                <tbody>
                  {teilnehmer.map((t) => (
                    <tr key={t.id} className={istTestdeckel(t) ? 'trm-adm__zeile--test' : undefined}>
                      {/* Ein Konto ohne Deckelnummer ist kein Fehler: es ist
                          jemand, der ueber eine Einladung hereinkam. */}
                      <td>
                        {t.deckel_nummer != null ? deckelText(t.deckel_nummer) : 'kein Deckel'}
                        {istTestdeckel(t) && <TestdeckelMarke />}
                      </td>
                      <td>{instagramAnzeige(t.instagram_handle)}</td>
                      <td>
                        {t.quelle === 'einladung'
                          ? `EINLADUNG${
                              t.einladerInstagram ? ` VON ${instagramAnzeige(t.einladerInstagram)}` : ''
                            }`
                          : 'DECKEL-CODE'}
                      </td>
                      {/* §19: Vor einer Preisausgabe schaut ein Mensch auf das
                          Profil und traegt hier ein, was er gesehen hat. Ein
                          Dienstausfall setzt niemanden auf „abgelehnt". */}
                      <td>
                        <span className="trm-adm__klein">
                          {t.folgt_bestaetigt_von_nutzer ? 'Eigenangabe' : 'keine Angabe'}
                          {t.folgt_geprueft_am ? ` · ${terminText(t.folgt_geprueft_am)}` : ''}
                        </span>
                        <select
                          className="trm-eingabe trm-eingabe--klein"
                          aria-label={`Follow-Prüfstand von @${t.instagram_handle ?? ''}`}
                          value={t.folgt_pruefstatus ?? 'offen'}
                          disabled={laeuft}
                          onChange={(ereignis) =>
                            handeln(
                              { aktion: 'folgt-pruefen', id: t.id, status: ereignis.target.value },
                              'Follow-Prüfstand gespeichert.',
                            )
                          }
                        >
                          {PRUEFSTAND_WORT.map(([wert, wort]) => (
                            <option key={wert} value={wert}>{wort}</option>
                          ))}
                        </select>
                      </td>
                      <td>{t.rankingOk ? 'berechtigt' : 'nicht'}</td>
                      <td>{t.ziehungOk ? 'berechtigt' : 'nicht'}</td>
                      <td>
                        {zahl(t.einladungenBelegt ?? 0)}/{zahl(t.einladungenGesamt ?? 0)}
                        {t.einladungenEingeloest != null && (
                          <span className="trm-adm__klein">
                            {zahl(t.einladungenEingeloest)} eingelöst
                          </span>
                        )}
                      </td>
                      <td>{zahl(t.generation ?? 0)}</td>
                      <td>{terminText(t.aktiviert_am) ?? '—'}</td>
                      <td>
                        {ANSPRUCH_WORT[t.anspruch_art] ?? ANSPRUCH_WORT.erstaktivierung}
                        {BESITZ_WORT[t.besitz_status] && (
                          <span className="trm-adm__status">{BESITZ_WORT[t.besitz_status]}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ---------------- Meldungen ---------------- */}
        <section className="trm-karte">
          <div className="trm-karte__kopf">
            <Hash size={18} aria-hidden="true" />
            <h2 className="trm-karte__titel">GEWINNMELDUNGEN</h2>
          </div>

          {meldungen.length === 0 ? (
            <p className="trm-karte__sub">Noch keine Meldung eingegangen.</p>
          ) : (
            <ol className="trm-adm__liste">
              {meldungen.map((m) => (
                <li key={m.id}>
                  <strong>{deckelText(m.deckel_nummer)}</strong>
                  {istTestdeckel(m) && <TestdeckelMarke />}
                  <span className="trm-adm__status">{m.status}</span>
                  <span className="trm-adm__klein">
                    <Instagram size={13} aria-hidden="true" />{' '}
                    {instagramAnzeige(m.instagram_handle)} · {m.email} ·{' '}
                    {terminText(m.gemeldet_am) ?? '—'}
                    {m.gezogene_nummer != null
                      && ` · gesucht war ${deckelText(m.gezogene_nummer)}`}
                  </span>
                  {m.nachricht && <span className="trm-adm__klein">{m.nachricht}</span>}
                  <span className="trm-adm__leiste">
                    <button
                      type="button"
                      className="trm-cta trm-cta--klein"
                      disabled={laeuft}
                      onClick={() =>
                        handeln(
                          { aktion: 'meldung-status', id: m.id, status: 'bestaetigt' },
                          'Meldung als bestätigt vermerkt.',
                        )
                      }
                    >
                      Bestätigt
                    </button>
                    <button
                      type="button"
                      className="trm-cta trm-cta--klein trm-cta--umriss"
                      disabled={laeuft}
                      onClick={() =>
                        handeln(
                          { aktion: 'meldung-status', id: m.id, status: 'abgelehnt' },
                          'Meldung als abgelehnt vermerkt.',
                        )
                      }
                    >
                      Abgelehnt
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ---------------- Game-Leaderboard ---------------- */}
        <section className="trm-karte">
          <div className="trm-karte__kopf">
            <Ikon name="krone" size={18} />
            <h2 className="trm-karte__titel">GAME-LEADERBOARD</h2>
          </div>
          <p className="trm-karte__sub">
            Moderation der Spielstände. Vollständig getrennt von der Ziehung: ein
            Score ändert nichts an einer Gewinnchance, und in dieser Liste steht
            weder Deckelnummer noch E-Mail.
          </p>

          <form className="trm-adm__suche" onSubmit={scoreSuchen}>
            <div className="trm-feld">
              <label className="trm-feld__label" htmlFor="adm-score-suche">
                Teilnehmer suchen
              </label>
              <input
                id="adm-score-suche"
                className="trm-eingabe"
                type="search"
                value={scoreSuche}
                onChange={(ereignis) => setScoreSuche(ereignis.target.value)}
              />
              <p className="trm-feld__hilfe">Instagram-Name oder Deckelnummer.</p>
            </div>
            <div className="trm-adm__leiste">
              <button type="submit" className="trm-cta trm-cta--klein">
                <Search size={15} aria-hidden="true" /> Suchen
              </button>
              {scoreAbfrage && (
                <button
                  type="button"
                  className="trm-cta trm-cta--klein trm-cta--umriss"
                  onClick={() => {
                    setScoreSuche('')
                    setScoreAbfrage('')
                  }}
                >
                  Suche aufheben
                </button>
              )}
              <button
                type="button"
                className="trm-cta trm-cta--klein trm-cta--umriss"
                onClick={scoresLaden}
                disabled={scoreLaeuft}
              >
                <RefreshCw size={15} aria-hidden="true" />
                {scoreLaeuft ? 'Lädt …' : 'Neu laden'}
              </button>
            </div>
          </form>

          <div className="trm-adm__leiste" role="group" aria-label="Nach Game filtern">
            {[{ key: '', titel: 'Alle Games' }, ...SPIELE_LISTE].map((spiel) => (
              <button
                key={spiel.key || 'alle'}
                type="button"
                className={`trm-cta trm-cta--klein${scoreSpiel === spiel.key ? '' : ' trm-cta--umriss'}`}
                aria-pressed={scoreSpiel === spiel.key}
                onClick={() => setScoreSpiel(spiel.key)}
              >
                {spiel.titel}
              </button>
            ))}
          </div>

          <div className="trm-adm__leiste" role="group" aria-label="Nach Status filtern">
            {SCORE_FILTER.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`trm-cta trm-cta--klein${scoreFilter === f.key ? '' : ' trm-cta--umriss'}`}
                aria-pressed={scoreFilter === f.key}
                onClick={() => setScoreFilter(f.key)}
              >
                {f.titel}
              </button>
            ))}
          </div>

          <p className="trm-feld__hilfe">
            {scores == null
              ? 'Lädt …'
              : scores.length === 0
                ? 'Kein Lauf gefunden.'
                : `${zahl(scores.length)} Läufe, neueste zuerst${scores.length >= 500 ? ' (mehr werden nicht geladen)' : ''}.`}
          </p>

          {scores != null && scores.length > 0 && (
            <div className="trm-adm__rollen">
              <table className="trm-adm__tabelle trm-adm__tabelle--scores">
                <thead>
                  <tr>
                    <th scope="col">Instagram</th>
                    <th scope="col">Game</th>
                    <th scope="col">Score</th>
                    <th scope="col">Datum</th>
                    <th scope="col">Laufzeit</th>
                    <th scope="col">Status</th>
                    <th scope="col">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((s) => (
                    <tr key={s.id}>
                      <td>{s.instagram ? instagramAnzeige(s.instagram) : '—'}</td>
                      <td>{SPIEL_NACH_KEY[s.game]?.titel ?? s.game}</td>
                      <td className="trm-adm__zahl">{zahl(s.score)}</td>
                      <td>{terminText(s.wann) ?? '—'}</td>
                      <td>
                        {laufzeitText(s.dauerMs)}
                        {s.runden ? ` · ${s.runden} Runden` : ''}
                      </td>
                      <td>
                        <span className="trm-adm__status">{SCORE_WORT[s.status] ?? s.status}</span>
                        {s.notiz && <span className="trm-adm__klein">{s.notiz}</span>}
                      </td>
                      <td>
                        {/* Zwei Richtungen, nie ein Loeschen: rausnehmen und
                            wieder freigeben. Der Lauf bleibt in beiden
                            Faellen in der Datenbank stehen. */}
                        {s.status === 'gueltig' ? (
                          <button
                            type="button"
                            className="trm-cta trm-cta--klein trm-cta--umriss"
                            disabled={scoreLaeuft}
                            onClick={() =>
                              scoreSetzen(s.id, 'verworfen', 'Score aus der Wertung genommen.')
                            }
                          >
                            Aus der Wertung
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="trm-cta trm-cta--klein"
                            disabled={scoreLaeuft}
                            onClick={() => scoreSetzen(s.id, 'gueltig', 'Score wieder freigegeben.')}
                          >
                            Freigeben
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ---------------- Datenverwaltung ---------------- */}
        <Datenverwaltung rufen={rufen} standLaden={standLaden} />

        {/* ---------------- Testlabor ---------------- */}
        <section className="trm-karte">
          <div className="trm-karte__kopf">
            <FlaskConical size={18} aria-hidden="true" />
            <h2 className="trm-karte__titel">{TEXTE.probe.titel}</h2>
          </div>

          <p className="trm-feld__hilfe">
            Der Testmodus spielt die komplette Nutzerreise mit einer virtuellen
            Person durch: {TEXTE.probe.person}. Auf der Aktionsseite erscheinen
            oben ein Hinweis „{TEXTE.probe.marke}“ und ein kleines Werkzeug, mit
            dem sich jeder Zustand direkt anspringen laesst.
          </p>

          <ul className="trm-adm__liste">
            <li>Es entsteht kein Teilnehmerdatensatz — die Teilnehmerzahl bleibt, wie sie ist.</li>
            <li>Testpunkte werden nicht gespeichert und stehen in keiner Rangliste.</li>
            <li>Die Ziehung kann keinen Testdeckel ziehen, weil es keinen gibt.</li>
            <li>Termin, Teilnehmerzahl und Ranglisten werden echt gelesen, aber nie verändert.</li>
          </ul>

          <div className="trm-adm__leiste">
            <button
              type="button"
              className="trm-cta trm-cta--klein"
              disabled={laeuft}
              onClick={testmodusStarten}
            >
              <FlaskConical size={15} aria-hidden="true" /> TESTMODUS STARTEN
            </button>
          </div>

          <p className="trm-feld__hilfe">
            Die Testsitzung gilt zwölf Stunden und endet mit dem Tab. Sie lässt
            sich auf der Aktionsseite jederzeit zurücksetzen oder verlassen.
          </p>
        </section>

        <p className="trm-zeile">
          <Link to="/terminal">Zur Aktionsseite</Link>
        </p>
      </TerminalRahmen>
    </>
  )
}
