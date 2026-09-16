import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import TerminalRahmen, { Raute } from '../components/TerminalRahmen.jsx'
import { TERMINAL_KAMPAGNE, zahl } from '../data/terminal.js'

/**
 * Teilnahmebedingungen der Bierdeckel-Aktion — ENTWURF.
 *
 * ACHTUNG, BITTE LESEN
 * --------------------
 * Dieser Text ist ausdruecklich KEINE fertige Rechtsgrundlage. Er beschreibt
 * nur den Ablauf, wie er technisch umgesetzt ist: welche Nummern gueltig
 * sind, was gespeichert wird, wie gezogen wird, welche Frist gilt. Er
 * beschreibt ihn, damit der Betrieb eine verlaessliche Tatsachenbasis hat,
 * wenn er die Bedingungen rechtlich formulieren oder pruefen laesst.
 *
 * Was hier bewusst FEHLT, weil es nicht erfunden werden darf:
 *   - Veranstalterangaben in rechtsverbindlicher Form (Impressum verlinkt)
 *   - Teilnahmealter, Ausschluss von Mitarbeitenden und Angehoerigen
 *   - Rechtsweg, Barauszahlung, Uebertragbarkeit des Gewinns
 *   - Steuerliche Behandlung der Sachpreise
 *   - Widerruf, Loeschfristen, Rechtsgrundlage der Verarbeitung
 *   - Der Hinweis, dass die Aktion nicht von Instagram/Meta gesponsert,
 *     unterstuetzt oder organisiert wird (Meta verlangt ihn)
 *
 * Der Hinweiskasten oben auf der Seite sagt dasselbe auch den Besuchern.
 * Er bleibt stehen, bis ein freigegebener Text vorliegt.
 */

const GESAMT = zahl(TERMINAL_KAMPAGNE.deckelGesamt)

/** Die Abschnitte. Reine Mechanik — jeder Satz beschreibt, was der Code tut. */
const ABSCHNITTE = [
  {
    titel: 'Worum es geht',
    punkte: [
      `Im Umlauf sind ${GESAMT} Bierdeckel. Jeder trägt eine handschriftliche Nummer von 1 bis ${GESAMT}; jede Nummer gibt es genau einmal.`,
      'Auf dem Deckel steht ein Rätsel. Seine Lösung ist der Tresor-Code und auf allen Deckeln dieselbe.',
      'Der Code allein gewinnt nichts. Er öffnet nur die Eingabe, mit der ein Deckel aktiviert wird.',
    ],
  },
  {
    titel: 'Teilnahme',
    punkte: [
      'Teilnahme heißt: Code eingeben, dann Deckelnummer, Instagram-Name und E-Mail-Adresse angeben und bestätigen, dass man @' + TERMINAL_KAMPAGNE.instagramHandle + ' folgt.',
      'Ist eine Deckelnummer bereits aktiviert, erscheint ein Hinweis. Wer den physischen Deckel mit dieser Nummer besitzt, kann ausdrücklich bestätigen und einen weiteren Besitzanspruch anmelden.',
      'Jede Deckelnummer ist genau ein Los — egal, wie viele Besitzansprüche auf ihr liegen. Weitere Ansprüche erhöhen die Gewinnchance nicht.',
      'An der Ziehung nehmen ausschließlich aktivierte Deckelnummern teil, jede genau einmal.',
      'Die Teilnahme ist kostenlos. Ein Kauf ist nicht erforderlich.',
    ],
  },
  {
    titel: 'Ziehung',
    punkte: [
      'Gezogen wird aus den aktivierten Deckelnummern, serverseitig und mit einem kryptografischen Zufallsgenerator.',
      'Eine einmal gezogene Nummer wird nicht erneut gezogen.',
      'Die gezogene Nummer wird auf der Seite „Live-Ziehung“ veröffentlicht. Veröffentlicht wird die Nummer — keine Namen, keine E-Mail-Adressen.',
    ],
  },
  {
    titel: 'Gewinn melden',
    punkte: [
      `Wer die gezogene Nummer hat, meldet sich innerhalb von ${TERMINAL_KAMPAGNE.meldefristStunden} Stunden nach der Ziehung über die Seite „Live-Ziehung“.`,
      'Der Gewinn wird von Hand geprüft: Originaldeckel, passender Teilnahmeeintrag, Instagram-Follow und Einhaltung der Frist.',
      'Ohne den physischen Originaldeckel wird kein Gewinn ausgegeben. Eine Nummer allein genügt nicht. Die gezogene Nummer muss mit dem Originaldeckel nachgewiesen werden.',
      'Gibt es mehrere Besitzansprüche auf die gezogene Nummer, wird keiner automatisch zugeordnet. Gewinnen kann nur, wer den Originaldeckel vorlegt.',
      'Der Instagram-Follow wird nicht automatisch erfasst. Beim Aktivieren bestätigt man ihn selbst; geprüft wird er erst im Gewinnfall, von Hand.',
      `Meldet sich niemand innerhalb der ${TERMINAL_KAMPAGNE.meldefristStunden} Stunden, darf neu gezogen werden.`,
    ],
  },
  {
    titel: 'Games',
    punkte: [
      'Die Spiele im Tresor sind freiwillig und reine Unterhaltung. Einzelne Spiele können zeitweise ausgeblendet werden; bereits erreichte Punktzahlen bleiben gespeichert.',
      'Ein Spiel ist auch ohne aktivierten Deckel im Practice Mode spielbar. Dort wird nichts gespeichert, es gibt keine Platzierung und keine Rangliste.',
      'Sie haben keinerlei Einfluss auf die Teilnahme, auf die Gewinnchance oder auf die Ziehung. Gezogen wird ausschließlich aus den gültig aktivierten Deckeln; die Deckelnummer allein entscheidet über die Gewinnchance.',
      'Punktzahlen werden auf unserem Server gespeichert, damit Bestwerte und Rangliste über Gerätewechsel hinweg erhalten bleiben. Jeder Lauf wird serverseitig auf Plausibilität geprüft; offensichtlich manipulierte Läufe werden nicht gewertet.',
      'Der Instagram-Name erscheint nur in der öffentlichen Rangliste, wenn man ausdrücklich zugestimmt hat — beim Aktivieren oder später im Dashboard unter „Öffentliches Leaderboard“. Diese Zustimmung ist freiwillig und keine Bedingung für die Teilnahme an der Aktion.',
      'Die Zustimmung kann jederzeit im Dashboard geändert oder widerrufen werden; alternativ genügt eine Nachricht an uns. Nach dem Widerruf wird der Name sofort aus der öffentlichen Rangliste entfernt. Teilnahme, Punktzahlen und Ziehung bleiben davon unberührt.',
      'Ohne diese Zustimmung kann man die Spiele trotzdem spielen; man erscheint dann in keiner öffentlichen Liste.',
      'Für die Spiele gibt es keine Preise.',
    ],
  },
  {
    titel: 'Daten',
    punkte: [
      'Gespeichert werden Deckelnummer, Instagram-Name, E-Mail-Adresse, die eigene Follow-Bestätigung, die freiwillige Zustimmung zur Rangliste und der Zeitpunkt der Aktivierung.',
      'Wer die Spiele spielt, von dem werden zusätzlich die erreichten Punktzahlen mit Spielname und Zeitpunkt gespeichert.',
      'Zur Abwehr von Massenabsendungen wird die IP-Adresse nicht gespeichert, sondern nur ein gesalzener Hashwert daraus.',
      'E-Mail-Adressen und Deckelnummern erscheinen auf keiner öffentlichen Seite. Die Rangliste zeigt ausschließlich Platz, Instagram-Name und Punktzahl.',
      'Einzelheiten zur Verarbeitung stehen in der Datenschutzerklärung.',
    ],
  },
]

export default function TerminalTeilnahme() {
  return (
    <>
      <Seo
        title="Teilnahmebedingungen – VIDEKO Aktion"
        description="Ablauf der VIDEKO Bierdeckel-Aktion: Aktivierung, Ziehung, Meldefrist."
        canonicalPath="/terminal/teilnahmebedingungen"
        noindex
        nofollow
      />

      <TerminalRahmen>
        <h1 className="trm-titel trm-gold">TEILNAHME­BEDINGUNGEN</h1>
        <p className="trm-sub">Bierdeckel-Aktion von VIDEKO Küchen</p>
        <Raute />

        {/* Dieser Kasten ist kein Schmuck. Er bleibt, bis ein geprüfter Text
            vorliegt — sonst wirkt ein Entwurf wie eine Zusage. */}
        <section className="trm-karte trm-entwurf">
          <div className="trm-karte__kopf">
            <AlertTriangle size={18} aria-hidden="true" />
            <h2 className="trm-karte__titel">ENTWURF — RECHTLICH NOCH NICHT FREIGEGEBEN</h2>
          </div>
          <p className="trm-karte__sub">
            Die folgenden Punkte beschreiben den tatsächlichen Ablauf der Aktion. Sie sind
            noch keine abschließenden, rechtlich geprüften Teilnahmebedingungen. Es fehlen
            unter anderem Angaben zu Teilnahmealter, Ausschlüssen, Rechtsweg, Übertragbarkeit
            und steuerlicher Behandlung der Preise sowie der von Instagram geforderte Hinweis
            zur Plattform. Vor dem Start der Aktion muss dieser Text geprüft und ersetzt
            werden.
          </p>
        </section>

        {ABSCHNITTE.map((abschnitt) => (
          <section className="trm-karte" key={abschnitt.titel}>
            <div className="trm-karte__kopf">
              <h2 className="trm-karte__titel">{abschnitt.titel}</h2>
            </div>
            <ul className="trm-liste">
              {abschnitt.punkte.map((punkt) => (
                <li key={punkt}>{punkt}</li>
              ))}
            </ul>
          </section>
        ))}

        <p className="trm-zeile">
          <span className="trm-zeile__text">
            Veranstalter und Kontakt stehen im <Link to="/impressum">Impressum</Link>. Zur
            Verarbeitung der Daten siehe <Link to="/datenschutz">Datenschutz</Link>.
          </span>
          <Link to="/terminal">Zurück zur Aktion</Link>
        </p>
      </TerminalRahmen>
    </>
  )
}
