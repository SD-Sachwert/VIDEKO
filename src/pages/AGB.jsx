import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import RechtstextTodo from '../components/legal/RechtstextTodo.jsx'

/**
 * Geruest der AGB. Die Gliederung steht, damit die geprueften Texte spaeter
 * nur noch eingesetzt werden muessen. Es sind bewusst keine selbst
 * formulierten Vertragsbedingungen enthalten.
 */
const ABSCHNITTE = [
  ['§ 1 Geltungsbereich', 'Anwendungsbereich der Bedingungen, Vertragspartner, Begriffsbestimmungen.'],
  ['§ 2 Vertragsschluss', 'Ablauf der Bestellung, Angebot und Annahme, Speicherung des Vertragstextes.'],
  ['§ 3 Preise und Versandkosten', 'Preisangaben, enthaltene Umsatzsteuer, Versandkosten, Aufpreis für Personalisierung.'],
  ['§ 4 Zahlungsbedingungen', 'Zugelassene Zahlungsarten, Fälligkeit, Zahlungsverzug.'],
  ['§ 5 Lieferung und Lieferzeit', 'Lieferfristen, Liefergebiet, Teillieferungen, Gefahrübergang.'],
  ['§ 6 Eigentumsvorbehalt', 'Eigentumsvorbehalt bis zur vollständigen Bezahlung.'],
  ['§ 7 Widerrufsrecht', 'Verweis auf die Widerrufsbelehrung und die Ausnahmen bei personalisierten Waren.'],
  ['§ 8 Gewährleistung und Haftung', 'Gesetzliche Mängelhaftung, Haftungsbeschränkungen.'],
  ['§ 9 Personalisierte Produkte', 'Freigabe der Druckdaten, zulässige Inhalte, Rechte Dritter, Ausschluss des Widerrufs.'],
  ['§ 10 Schlussbestimmungen', 'Anwendbares Recht, Gerichtsstand, Streitbeilegung, Salvatorische Klausel.'],
]

export default function AGB() {
  return (
    <section className="section section--light legal-page">
      <div className="container">
        <Reveal className="legal-head">
          <span className="kicker kicker--gold">Rechtliches</span>
          <h1 className="legal-head__title">Allgemeine Geschäftsbedingungen</h1>
        </Reveal>

        <Reveal className="legal legal--doc">
          <p className="legal__lead">
            Die Allgemeinen Geschäftsbedingungen für den VIDEKO Merch-Shop werden derzeit
            erstellt und rechtlich geprüft. Die Gliederung steht bereits fest, die verbindlichen
            Texte folgen vor dem Verkaufsstart.
          </p>

          <RechtstextTodo titel="Vollständiger AGB-Text">
            <p>
              Bis zur Freigabe gelten für Bestellungen die gesetzlichen Bestimmungen. Vorgesehen
              ist folgende Gliederung:
            </p>
            <ul>
              {ABSCHNITTE.map(([titel, inhalt]) => (
                <li key={titel}>
                  <strong>{titel}</strong> – {inhalt}
                </li>
              ))}
            </ul>
          </RechtstextTodo>

          <p className="legal__note">
            Verwandte Seiten: <Link to="/versand-lieferung">Versand &amp; Lieferung</Link>,{' '}
            <Link to="/rueckgabe-widerruf">Rückgabe &amp; Widerruf</Link>,{' '}
            <Link to="/datenschutz">Datenschutz</Link> und{' '}
            <Link to="/impressum">Impressum</Link>.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
