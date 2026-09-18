import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import TerminalRahmen, { Raute } from '../components/TerminalRahmen.jsx'
import {
  GEWERTETE_GAMES,
  HAUPTGAMES_ANZAHL,
  MEGA_MEILENSTEIN,
  MEILENSTEINE,
  MEILENSTEIN_ARTIKEL,
  MEILENSTEIN_SCHRITT,
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
 *
 * Der Plattformhinweis, den Meta fuer Gewinnspiele verlangt, steht seit dem
 * Launch-Pass im eigenen Abschnitt „Hinweis zu Instagram" — er fehlt also
 * nicht mehr.
 *
 * Der Hinweiskasten oben auf der Seite sagt dasselbe auch den Besuchern.
 * Er bleibt stehen, bis ein freigegebener Text vorliegt.
 *
 * VIER GETRENNTE DINGE
 * --------------------
 * Die alte Fassung warf sie zusammen und endete bei „Fuer die Spiele gibt es
 * keine Preise" — das war schon damals nicht der Code, und heute ist es
 * schlicht falsch. Sauber getrennt sind es vier:
 *
 *   1. Das Gesamtranking — beste vier aus sechs. Bedingung ist Instagram,
 *      nicht der Deckel (`rankingBerechtigt` in api/_terminal-kern.js). Nur
 *      hier entsteht ein Anspruch auf einen Spielpreis, und nur fuer die
 *      Plaetze 1 bis 3. Die Einzel-Bestenlisten sind Vergleich und
 *      Rechengrundlage — aus ihnen folgt kein eigener Gewinn.
 *   2. Die Deckelziehung. Bedingung ist ein aktivierter physischer Deckel
 *      (`ziehungBerechtigt`, `NUR_OFFIZIELLE`).
 *   3. Die Follower-Zusatzziehungen. Je freigeschalteter Followerschwelle
 *      genau eine eigene Ziehung um einen Merchandise-Artikel, aus demselben
 *      Kreis gueltig aktivierter Deckel, aber in einem eigenen Topf
 *      (`followerZiehen` in api/terminal-admin.js). Eine in der grossen
 *      Deckelziehung gezogene Nummer bleibt hier im Rennen und umgekehrt.
 *   4. Das anonyme Probespiel. Kein Konto, kein Score, keine Liste.
 *
 * Keiner der vier Wege haengt an einem anderen. Genauso steht es im Server,
 * und genauso steht es hier.
 *
 * Alle Zahlen dieser Seite kommen aus der Konfiguration: die Deckelzahl aus
 * TERMINAL_KAMPAGNE, die Zahl der Hauptspiele, die Rangpunkte und die
 * Followerschwellen aus data/terminal.js, die ausgeschriebenen Gewinne aus
 * terminal-gewinne.js. Eine hier hineingeschriebene Zahl waere beim naechsten
 * Aendern eine falsche Zusage. Deshalb steht hier auch kein konkreter
 * Followerpreis und kein konkreter Rankingpreis: beides pflegt die Verwaltung,
 * und angezeigt wird, was dort steht.
 */

const GESAMT = zahl(TERMINAL_KAMPAGNE.deckelGesamt)
const GEWINN_ZAHL = GEWINNE.length
const GEWINN_NAMEN = GEWINNE.map((g) => g.titel).join(', ')

/* Die Namen der Hauptspiele in der Standardaufstellung. Die Verwaltung kann
   die Aufstellung aendern; dass es {HAUPTGAMES_ANZAHL} sind, kann sie nicht. */
const HAUPTSPIEL_NAMEN = STANDARD_HAUPTGAMES
  .map((key) => SPIELE_LISTE.find((s) => s.key === key)?.titel ?? key)
  .join(', ')

/* Die Followerstaffel — abgeleitet, nicht abgeschrieben. Aendert sich die
   Liste in data/terminal.js, aendert sich dieser Text mit. */
const NORMALE_STUFEN = MEILENSTEINE.filter((ziel) => ziel !== MEGA_MEILENSTEIN)
const ERSTE_STUFE = zahl(NORMALE_STUFEN[0])
const LETZTE_STUFE = zahl(NORMALE_STUFEN[NORMALE_STUFEN.length - 1])
const STUFEN_ZAHL = NORMALE_STUFEN.length
const SCHRITT = zahl(MEILENSTEIN_SCHRITT)
const MEGA = zahl(MEGA_MEILENSTEIN)
const ARTIKEL_NAMEN = MEILENSTEIN_ARTIKEL.join(', ')

/** Die Abschnitte. Reine Mechanik — jeder Satz beschreibt, was der Code tut. */
const ABSCHNITTE = [
  {
    titel: 'Worum es geht',
    punkte: [
      `Im Umlauf sind ${GESAMT} nummerierte Bierdeckel. Jeder trägt eine handschriftliche Nummer von 1 bis ${GESAMT}; jede Nummer gibt es genau einmal.`,
      'Auf dem Deckel steht ein Rätsel. Seine Lösung ist der Tresor-Code und auf allen Deckeln dieselbe.',
      'Der Code allein gewinnt nichts. Er öffnet nur die Eingabe, mit der ein Deckel aktiviert wird.',
      `Es gibt drei voneinander unabhängige Wege zu einem Gewinn: das Gesamtranking über die besten ${GEWERTETE_GAMES} von ${HAUPTGAMES_ANZAHL} Spielen, die Deckelziehung und die zusätzlichen Follower-Ziehungen. Für das Gesamtranking braucht man keinen Deckel.`,
      `Aus der Deckelziehung werden mehrere Nummern gezogen — ausgeschrieben sind zurzeit ${GEWINN_ZAHL} Gewinne. Es gibt also mehrere Gewinner.`,
      `Erreicht der Instagram-Kanal @${TERMINAL_KAMPAGNE.instagramHandle} eine Followerschwelle, kommt je Schwelle eine weitere, eigene Ziehung um einen Merchandise-Artikel dazu. Sie ändert nichts an den anderen beiden Wegen.`,
      'Die Teilnahme ist in allen Fällen kostenlos. Ein Kauf ist nicht erforderlich.',
    ],
  },
  {
    titel: 'Spielen und Ranglisten',
    punkte: [
      `Wer in den Ranglisten stehen will, legt im Tresor ein Konto an: Instagram-Name und E-Mail-Adresse angeben und selbst bestätigen, dass man @${TERMINAL_KAMPAGNE.instagramHandle} folgt.`,
      'Ein Deckel ist dafür nicht nötig. Wer ohne Deckel dabei ist, spielt dieselben Spiele, steht in denselben Ranglisten und kann dieselben Spiel-Gewinne bekommen.',
      'Jedes Spiel hat seine eigene Bestenliste. Gewertet wird je Person der beste gültige Lauf. Einzel-Bestenlisten dienen der Wertung und dem Vergleich; daraus entsteht kein eigener Gewinnanspruch.',
      'Punktzahlen werden auf unserem Server gespeichert, damit Bestwerte und Ranglisten über Gerätewechsel hinweg erhalten bleiben. Jeder Lauf wird serverseitig auf Plausibilität geprüft; offensichtlich manipulierte Läufe werden nicht gewertet.',
      'Einzelne Spiele können zeitweise ausgeblendet werden; bereits erreichte Punktzahlen bleiben gespeichert.',
      'Der Instagram-Name erscheint nur dann in der öffentlichen Rangliste, wenn man ausdrücklich zugestimmt hat — beim Aktivieren oder später im Dashboard unter „Öffentliches Leaderboard“. Diese Zustimmung ist freiwillig und keine Bedingung für die Teilnahme.',
      'Die Zustimmung kann jederzeit im Dashboard geändert oder widerrufen werden; alternativ genügt eine Nachricht an uns. Nach dem Widerruf wird der Name sofort aus der öffentlichen Liste entfernt. Teilnahme, Punktzahlen und Ziehung bleiben davon unberührt.',
      'Der Instagram-Follow wird nicht automatisch erfasst. Beim Anlegen bestätigt man ihn selbst; geprüft wird er erst im Gewinnfall, von Hand.',
    ],
  },
  {
    titel: `Gesamtranking — beste ${GEWERTETE_GAMES} aus ${HAUPTGAMES_ANZAHL}`,
    punkte: [
      'Für das Gesamtranking zählen deine besten vier Ergebnisse aus sechs Spielen.',
      'Du musst mindestens vier verschiedene Spiele gespielt haben.',
      `Die ${HAUPTGAMES_ANZAHL} Hauptspiele sind in der Standardaufstellung: ${HAUPTSPIEL_NAMEN}.`,
      'Je Person und Hauptspiel zählt nur der beste gültige Lauf.',
      `Für jedes Hauptspiel wird aus dem Platz in dessen Bestenliste eine Rangpunktzahl gebildet: Platz 1 bekommt ${zahl(RANGPUNKTE_MAX)} Punkte, der letzte gewertete Platz 0, dazwischen wird gleichmäßig verteilt. Gleichstand teilt sich den besseren Platz.`,
      `Von diesen Rangpunktzahlen werden nur die besten ${GEWERTETE_GAMES} gewertet; die übrigen werden gestrichen. Die Gesamtpunkte sind die Summe dieser ${GEWERTETE_GAMES} — höchstens ${zahl(GEWERTETE_GAMES * RANGPUNKTE_MAX)}. Gerechnet wird mit Rängen statt mit Rohpunkten, weil die Spiele völlig verschiedene Punktskalen haben.`,
      `Wer mehr als ${GEWERTETE_GAMES} Hauptspiele spielt, verschlechtert sich dadurch nie: ein besseres Ergebnis ersetzt ein schwächeres, ein schwächeres wird gestrichen.`,
      `Welche ${GEWERTETE_GAMES} Ergebnisse gewertet werden, bestimmt der Server, nicht das Gerät. Bei gleichen Gesamtpunkten entscheidet, wer den Stand früher erreicht hat.`,
      'Die Verwaltung kann die Aufstellung der Hauptspiele ändern; maßgeblich ist die Aufstellung, die im Terminal angezeigt wird. Änderungen werden protokolliert.',
      'Küchen-Tinder ist kein Hauptspiel und zählt in keiner Wertung mit.',
      'Die Verwaltung kann das Gesamtranking abschließen. Ab diesem Zeitpunkt gilt der eingefrorene Stand; spätere Läufe ändern daran nichts.',
      'Einen Rankingpreis gewinnen ausschließlich die Gesamtplätze 1, 2 und 3. Welche Preise das sind, steht in der Ausschreibung im Terminal; aus den Einzel-Bestenlisten entsteht kein eigener Gewinnanspruch.',
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
      'Die Deckelziehung und die zusätzlichen Follower-Ziehungen sind getrennte Ziehungen mit getrennten Töpfen. Eine hier gezogene Nummer bleibt bei den Follower-Ziehungen im Rennen — und umgekehrt.',
    ],
  },
  {
    titel: 'Follower-Aktion auf Instagram',
    punkte: [
      `Erreicht der Instagram-Kanal @${TERMINAL_KAMPAGNE.instagramHandle} ${ERSTE_STUFE} Follower, wird eine zusätzliche Ziehung um einen Merchandise-Artikel freigeschaltet. Danach kommt bei jeder weiteren Schwelle im Abstand von ${SCHRITT} Followern genau eine weitere Ziehung dazu — bis ${LETZTE_STUFE}. Das sind ${STUFEN_ZAHL} mögliche Zusatzziehungen.`,
      `Mögliche Gewinne sind die Merchandise-Artikel: ${ARTIKEL_NAMEN}. Welcher Artikel bei welcher Schwelle ausgespielt wird, legt VIDEKO fest und veröffentlicht es im Terminal. Maßgeblich ist die dort angezeigte Ausschreibung.`,
      'Jede freigeschaltete Schwelle wird einzeln gezogen und hat einen eigenen Gewinner. Drei freigeschaltete Schwellen bedeuten drei zusätzliche Gewinner — nicht einen gemeinsamen Gewinn.',
      'An jeder freigeschalteten Zusatzziehung nehmen die zum Ziehungszeitpunkt gültig aktivierten Deckel teil. Ein aktivierter physischer Deckel ist eine Chance je Ziehung; weitere Besitzansprüche auf dieselbe Nummer erhöhen die Chance nicht.',
      'Innerhalb der Follower-Ziehungen wird eine bereits gezogene Nummer nicht erneut gezogen. Gegenüber der großen Deckelziehung sind es getrennte Töpfe.',
      'Eine einmal erreichte Schwelle bleibt dauerhaft freigeschaltet. Sinkt die Followerzahl später wieder, wird eine freigeschaltete Zusatzziehung nicht zurückgenommen.',
      'Werden mehrere Schwellen zugleich übersprungen, werden alle dazwischenliegenden Schwellen freigeschaltet. Es fällt keine Zusatzziehung aus.',
      `Bei ${MEGA} Followern kommt statt einer weiteren Merchandise-Ziehung ein gesondert ausgeschriebener Mega-Preis dazu. Er wird im Terminal bekanntgegeben.`,
      'Die Followerzahl stammt aus der offiziellen Instagram/Meta-Schnittstelle. Maßgeblich ist der Wert, den diese Schnittstelle zum Zeitpunkt der Freischaltung liefert.',
      'Ein noch nicht freigeschalteter Zusatzgewinn kann vor seiner Freischaltung geändert werden. Ein bereits freigeschalteter und öffentlich angezeigter Gewinn wird nicht nachträglich entfernt; eine Änderung wird protokolliert.',
      'Die Follower-Aktion ist von Gesamtranking und Deckelziehung unabhängig. Ein guter Score hilft hier nicht, und eine Zusatzziehung ändert nichts am Ranking.',
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
      'Es gibt drei getrennte Arten von Gewinnen, die nicht vermischt werden: die Rankingpreise für die Gesamtplätze 1 bis 3, die Gewinne der Deckelziehung und die zusätzlichen Gewinne aus den freigeschalteten Follower-Ziehungen.',
      'Die drei besten Spieler des Gesamtrankings gewinnen die ausgeschriebenen Rankingpreise. Die Rankingpreise für die Plätze 1 bis 3 werden von VIDEKO ausgeschrieben und im Terminal angezeigt; ohne Ausschreibung wird nichts zugesagt.',
      'Einzel-Bestenlisten dienen der Wertung und dem Vergleich; daraus entsteht kein eigener Gewinnanspruch.',
      `In der Deckelziehung sind zurzeit ${GEWINN_ZAHL} Gewinne ausgeschrieben: ${GEWINN_NAMEN}. Maßgeblich ist die Ausschreibung auf der Aktionsseite.`,
      `Aus jeder freigeschalteten Followerschwelle kommt ein zusätzlicher Merchandise-Gewinn dazu (${ARTIKEL_NAMEN}), bei ${MEGA} Followern ein gesondert ausgeschriebener Mega-Preis. Welcher Gewinn zu welcher Schwelle gehört, steht im Terminal.`,
      'Ein gespieltes Spiel ist keine Gewinngarantie. Aus einem guten Score entsteht ein Platz in einer Liste — und aus dem Platz ein Anspruch nur dann, wenn ein Gewinn dafür ausgeschrieben ist.',
      'Spiel-Gewinne, Deckelziehung und Follower-Ziehungen sind getrennt. Ein guter Score hilft in der Deckelziehung nicht, und ein Deckel hilft in den Ranglisten nicht.',
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
      'Die Rankingpreise werden nicht gezogen, sondern nach dem Stand des Gesamtrankings an die Plätze 1 bis 3 vergeben. Auch hier wird vor der Ausgabe von Hand geprüft.',
      'Auch die Follower-Zusatzziehungen ziehen eine Deckelnummer. Das Ergebnis wird im Terminal bekanntgegeben; die Zuordnung erfolgt von Hand, und ohne den physischen Originaldeckel wird auch hier kein Gewinn ausgegeben.',
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
      `Für die Follower-Aktion wird ausschließlich die Followerzahl des Kanals @${TERMINAL_KAMPAGNE.instagramHandle} über die offizielle Instagram/Meta-Schnittstelle abgerufen. Daten einzelner Follower werden dabei nicht verarbeitet.`,
      'Einzelheiten zur Verarbeitung stehen in der Datenschutzerklärung.',
    ],
  },
  {
    titel: 'Hinweis zu Instagram',
    punkte: [
      'Die Aktion wird nicht von Instagram gesponsert, unterstützt oder organisiert und steht in keiner Verbindung zu Instagram. Instagram ist nicht Veranstalter.',
      'Veranstalter ist VIDEKO Küchen. Ansprechpartner und Kontaktdaten stehen im Impressum.',
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
            und steuerlicher Behandlung der Gewinne. Das gilt für die Deckelziehung, für die
            Follower-Zusatzziehungen und für die Gewinne aus den Ranglisten gleichermaßen.
            Eine rechtliche Endprüfung vor dem Start der Aktion ist erforderlich; dieser Text
            muss dabei geprüft und ersetzt werden.
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
          <Link className="trm-cta trm-cta--umriss trm-cta--klein" to="/terminal">
            <ArrowLeft size={16} aria-hidden="true" />
            Zurück zur Aktion
          </Link>
        </p>
      </TerminalRahmen>
    </>
  )
}
