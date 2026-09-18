import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import TerminalRahmen, { Raute } from '../components/TerminalRahmen.jsx'
import {
  HAUPTGAMES_ANZAHL,
  RANGPUNKTE_MAX,
  SPIELE_LISTE,
  STANDARD_HAUPTGAMES,
  TERMINAL_KAMPAGNE,
  zahl,
} from '../data/terminal.js'
import { GEWINNE } from '../data/terminal-gewinne.js'

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
 *
 * DREI GETRENNTE DINGE
 * --------------------
 * Die alte Fassung warf sie zusammen und endete bei „Fuer die Spiele gibt es
 * keine Preise" — das war schon damals nicht der Code, und heute ist es
 * schlicht falsch. Sauber getrennt sind es drei:
 *
 *   1. Ranglisten je Game und das Gesamtranking. Bedingung ist Instagram,
 *      nicht der Deckel (`rankingBerechtigt` in api/_terminal-kern.js).
 *   2. Die Deckelziehung. Bedingung ist ein aktivierter physischer Deckel
 *      (`ziehungBerechtigt`, `NUR_OFFIZIELLE`).
 *   3. Das anonyme Probespiel. Kein Konto, kein Score, keine Liste.
 *
 * Keiner der drei Wege haengt an einem anderen. Genauso steht es im Server,
 * und genauso steht es hier.
 *
 * Alle Zahlen dieser Seite kommen aus der Konfiguration: die Deckelzahl aus
 * TERMINAL_KAMPAGNE, die Zahl der Hauptspiele und die Rangpunkte aus
 * data/terminal.js, die ausgeschriebenen Gewinne aus terminal-gewinne.js.
 * Eine hier hineingeschriebene Zahl waere beim naechsten Aendern eine falsche
 * Zusage.
 */

const GESAMT = zahl(TERMINAL_KAMPAGNE.deckelGesamt)
const GEWINN_ZAHL = GEWINNE.length
const GEWINN_NAMEN = GEWINNE.map((g) => g.titel).join(', ')

/* Die Namen der Hauptspiele in der Standardaufstellung. Die Verwaltung kann
   die Aufstellung aendern; dass es {HAUPTGAMES_ANZAHL} sind, kann sie nicht. */
const HAUPTSPIEL_NAMEN = STANDARD_HAUPTGAMES
  .map((key) => SPIELE_LISTE.find((s) => s.key === key)?.titel ?? key)
  .join(', ')

/** Die Abschnitte. Reine Mechanik — jeder Satz beschreibt, was der Code tut. */
const ABSCHNITTE = [
  {
    titel: 'Worum es geht',
    punkte: [
      `Im Umlauf sind ${GESAMT} nummerierte Bierdeckel. Jeder trägt eine handschriftliche Nummer von 1 bis ${GESAMT}; jede Nummer gibt es genau einmal.`,
      'Auf dem Deckel steht ein Rätsel. Seine Lösung ist der Tresor-Code und auf allen Deckeln dieselbe.',
      'Der Code allein gewinnt nichts. Er öffnet nur die Eingabe, mit der ein Deckel aktiviert wird.',
      'Es gibt drei voneinander unabhängige Wege: die Ranglisten der einzelnen Spiele, das Gesamtranking über alle Hauptspiele und die Deckelziehung. Für die ersten beiden braucht man keinen Deckel.',
      `Aus der Deckelziehung werden mehrere Nummern gezogen — ausgeschrieben sind zurzeit ${GEWINN_ZAHL} Gewinne. Es gibt also mehrere Gewinner.`,
      'Die Teilnahme ist in allen drei Fällen kostenlos. Ein Kauf ist nicht erforderlich.',
    ],
  },
  {
    titel: 'Spielen und Ranglisten',
    punkte: [
      `Wer in den Ranglisten stehen will, legt im Tresor ein Konto an: Instagram-Name und E-Mail-Adresse angeben und selbst bestätigen, dass man @${TERMINAL_KAMPAGNE.instagramHandle} folgt.`,
      'Ein Deckel ist dafür nicht nötig. Wer ohne Deckel dabei ist, spielt dieselben Spiele, steht in denselben Ranglisten und kann dieselben Spiel-Gewinne bekommen.',
      'Jedes Spiel hat seine eigene Bestenliste. Gewertet wird je Person der beste gültige Lauf.',
      'Punktzahlen werden auf unserem Server gespeichert, damit Bestwerte und Ranglisten über Gerätewechsel hinweg erhalten bleiben. Jeder Lauf wird serverseitig auf Plausibilität geprüft; offensichtlich manipulierte Läufe werden nicht gewertet.',
      'Einzelne Spiele können zeitweise ausgeblendet werden; bereits erreichte Punktzahlen bleiben gespeichert.',
      'Der Instagram-Name erscheint nur dann in der öffentlichen Rangliste, wenn man ausdrücklich zugestimmt hat — beim Aktivieren oder später im Dashboard unter „Öffentliches Leaderboard“. Diese Zustimmung ist freiwillig und keine Bedingung für die Teilnahme.',
      'Die Zustimmung kann jederzeit im Dashboard geändert oder widerrufen werden; alternativ genügt eine Nachricht an uns. Nach dem Widerruf wird der Name sofort aus der öffentlichen Liste entfernt. Teilnahme, Punktzahlen und Ziehung bleiben davon unberührt.',
      'Der Instagram-Follow wird nicht automatisch erfasst. Beim Anlegen bestätigt man ihn selbst; geprüft wird er erst im Gewinnfall, von Hand.',
    ],
  },
  {
    titel: 'Gesamtranking',
    punkte: [
      `In das Gesamtranking zählen die ${HAUPTGAMES_ANZAHL} Hauptspiele. In der Standardaufstellung sind das: ${HAUPTSPIEL_NAMEN}.`,
      'Je Person und Hauptspiel zählt nur der beste gültige Lauf.',
      `Für jedes Hauptspiel wird aus dem Platz in dessen Bestenliste eine Rangpunktzahl gebildet: Platz 1 bekommt ${zahl(RANGPUNKTE_MAX)} Punkte, der letzte gewertete Platz 0, dazwischen wird gleichmäßig verteilt. Gleichstand teilt sich den besseren Platz.`,
      `Die Gesamtpunkte sind die Summe dieser Rangpunkte — höchstens ${zahl(HAUPTGAMES_ANZAHL * RANGPUNKTE_MAX)}. Gerechnet wird mit Rängen statt mit Rohpunkten, weil die Spiele völlig verschiedene Punktskalen haben.`,
      `Gewertet wird nur, wer in allen ${HAUPTGAMES_ANZAHL} Hauptspielen einen gültigen Lauf hat. Bei gleichen Gesamtpunkten entscheidet, wer den Stand früher erreicht hat.`,
      'Die Verwaltung kann die Aufstellung der Hauptspiele ändern; maßgeblich ist die Aufstellung, die im Terminal angezeigt wird. Änderungen werden protokolliert.',
      'Ein Spiel, das nur als Testplatz eingeblendet ist — derzeit betrifft das VIDEKO SLAM — zählt nicht ins Gesamtranking, solange es nicht ausdrücklich als Hauptspiel eingetragen ist.',
      'Die Verwaltung kann das Gesamtranking abschließen. Ab diesem Zeitpunkt gilt der eingefrorene Stand; spätere Läufe ändern daran nichts.',
    ],
  },
  {
    titel: 'Deckelziehung',
    punkte: [
      'An der Deckelziehung nimmt nur teil, wer einen echten, physischen und nummerierten Deckel aktiviert hat.',
      'Ein physischer Deckel ist eine Chance. Jede Deckelnummer ist genau ein Los — egal, wie viele Besitzansprüche auf ihr liegen. Weitere Ansprüche erhöhen die Gewinnchance nicht.',
      'Ist eine Deckelnummer bereits aktiviert, erscheint ein Hinweis. Wer den physischen Deckel mit dieser Nummer besitzt, kann ausdrücklich bestätigen und einen weiteren Besitzanspruch anmelden.',
      'Gezogen wird aus den aktivierten Deckelnummern, serverseitig und mit einem kryptografischen Zufallsgenerator. Nie aktivierte Nummern sind nicht im Topf.',
      'Gezogen wird mehrfach, nacheinander. Eine bereits gezogene Nummer kommt nicht erneut in den Topf. Eine neue Ziehung startet erst, wenn die vorherige zugeordnet ist oder ihre Frist abgelaufen ist.',
      'Jede gezogene Nummer wird auf der Seite „Live-Ziehung“ veröffentlicht. Veröffentlicht wird die Nummer — keine Namen, keine E-Mail-Adressen.',
      'Wer keinen Deckel hat, kann trotzdem spielen, in den Ranglisten stehen und Spiel-Gewinne bekommen. Nur an der Deckelziehung nimmt er nicht teil.',
    ],
  },
  {
    titel: 'Einladungen',
    punkte: [
      'Wer schon dabei ist, kann andere einladen. Eine Einladung öffnet denselben Zugang wie der Code auf dem Deckel.',
      'Eine Einladung erzeugt keinen zusätzlichen physischen Deckel und kein zusätzliches Los in der Deckelziehung.',
      'Wer über eine Einladung hereinkommt, spielt alle Spiele, steht in allen Ranglisten und im Gesamtranking — wie jeder andere auch.',
      'Um an der Deckelziehung teilzunehmen, muss auch ein eingeladener Mensch einen eigenen physischen Deckel aktivieren.',
    ],
  },
  {
    titel: 'Probespiel ohne Konto',
    punkte: [
      'Ein Spiel ist auch ohne Konto und ohne Deckel spielbar — zum Ausprobieren, direkt auf der Startseite des Tresors.',
      'Das Probespiel wird nicht gespeichert. Es ergibt keinen offiziellen Score, keine Platzierung, keinen Eintrag in einer Rangliste und kein Los.',
      'Wer den Score zählen lassen will, legt ein Konto an und spielt die Runde dort erneut.',
    ],
  },
  {
    titel: 'Gewinne',
    punkte: [
      `In der Deckelziehung sind zurzeit ${GEWINN_ZAHL} Gewinne ausgeschrieben: ${GEWINN_NAMEN}. Maßgeblich ist die Ausschreibung auf der Aktionsseite.`,
      'Für das Gesamtranking sind eigene Gewinne für die Plätze 1 bis 3 vorgesehen. Sie werden von VIDEKO ausgeschrieben und im Terminal angezeigt.',
      'Ob und welche Gewinne es zusätzlich für die Bestenliste eines einzelnen Spiels gibt, richtet sich ebenfalls nach der Ausschreibung. Ein offizieller Score kann dafür zählen.',
      'Ein gespieltes Spiel ist keine Gewinngarantie. Aus einem guten Score entsteht ein Platz in einer Liste — und aus dem Platz ein Anspruch nur dann, wenn ein Gewinn dafür ausgeschrieben ist.',
      'Spiel-Gewinne und Deckelziehung sind getrennt. Ein guter Score hilft in der Deckelziehung nicht, und ein Deckel hilft in den Ranglisten nicht.',
      'Gewinne werden nicht in bar ausgezahlt. Einzelheiten zu Übertragbarkeit, Rechtsweg und steuerlicher Behandlung fehlen in diesem Entwurf noch (siehe Hinweis oben).',
    ],
  },
  {
    titel: 'Gewinn melden',
    punkte: [
      `Wer eine gezogene Nummer hat, meldet sich innerhalb von ${TERMINAL_KAMPAGNE.meldefristStunden} Stunden nach der Ziehung über die Seite „Live-Ziehung“.`,
      'Der Gewinn wird von Hand geprüft: Originaldeckel, passender Teilnahmeeintrag, Instagram-Follow und Einhaltung der Frist.',
      'Ohne den physischen Originaldeckel wird kein Gewinn ausgegeben. Eine Nummer allein genügt nicht.',
      'Gibt es mehrere Besitzansprüche auf eine gezogene Nummer, wird keiner automatisch zugeordnet. Gewinnen kann nur, wer den Originaldeckel vorlegt.',
      `Meldet sich niemand innerhalb der ${TERMINAL_KAMPAGNE.meldefristStunden} Stunden, darf für diesen Gewinn neu gezogen werden.`,
      'Gewinne aus den Ranglisten und aus dem Gesamtranking werden nicht gezogen, sondern nach dem Stand der jeweiligen Liste vergeben. Auch hier wird vor der Ausgabe von Hand geprüft.',
    ],
  },
  {
    titel: 'Daten',
    punkte: [
      'Gespeichert werden Instagram-Name, E-Mail-Adresse, die eigene Follow-Bestätigung, die freiwillige Zustimmung zur Rangliste und der Zeitpunkt der Anmeldung — bei einem aktivierten Deckel zusätzlich dessen Nummer.',
      'Wer die Spiele spielt, von dem werden zusätzlich die erreichten Punktzahlen mit Spielname und Zeitpunkt gespeichert.',
      'Zur Abwehr von Massenabsendungen wird die IP-Adresse nicht gespeichert, sondern nur ein gesalzener Hashwert daraus.',
      'E-Mail-Adressen und Deckelnummern erscheinen auf keiner öffentlichen Seite. Die Ranglisten zeigen ausschließlich Platz, Instagram-Name und Punktzahl.',
      'Das Probespiel ohne Konto speichert keinen Score.',
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
            und steuerlicher Behandlung der Gewinne sowie der von Instagram geforderte Hinweis
            zur Plattform. Das gilt für die Deckelziehung und für die Gewinne aus den
            Ranglisten gleichermaßen. Eine rechtliche Endprüfung vor dem Start der Aktion
            ist erforderlich; dieser Text muss dabei geprüft und ersetzt werden.
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
