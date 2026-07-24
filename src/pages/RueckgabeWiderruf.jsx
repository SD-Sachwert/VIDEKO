import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import RechtstextTodo from '../components/legal/RechtstextTodo.jsx'

/**
 * Bewusst ohne selbst formulierte Widerrufsbelehrung: Der Wortlaut ist
 * gesetzlich vorgegeben und muss geprueft uebernommen werden. Die Seite
 * steht technisch, damit keine Verlinkung ins Leere fuehrt.
 */
export default function RueckgabeWiderruf() {
  return (
    <section className="section section--light legal-page">
      <div className="container">
        <Reveal className="legal-head">
          <span className="kicker kicker--gold">Rechtliches</span>
          <h1 className="legal-head__title">Rückgabe &amp; Widerruf</h1>
        </Reveal>

        <Reveal className="legal legal--doc">
          <p className="legal__lead">
            Verbraucherinnen und Verbraucher haben bei Fernabsatzverträgen grundsätzlich ein
            gesetzliches Widerrufsrecht von 14 Tagen. Der verbindliche Wortlaut der
            Widerrufsbelehrung wird vor dem Verkaufsstart hier eingesetzt.
          </p>

          <h2>Widerrufsbelehrung</h2>
          <RechtstextTodo titel="Gesetzliche Widerrufsbelehrung">
            <p>
              Hier folgt die vollständige Widerrufsbelehrung mit Angaben zu Widerrufsrecht,
              Widerrufsfrist, Fristbeginn, Empfänger der Widerrufserklärung und Rechtsfolgen des
              Widerrufs.
            </p>
          </RechtstextTodo>

          <h2>Folgen des Widerrufs</h2>
          <RechtstextTodo titel="Rückerstattung, Rücksendekosten und Wertersatz">
            <p>
              Hier folgen die Angaben zur Erstattung des Kaufpreises, zur Frist, zum
              Erstattungsweg, zur Tragung der Rücksendekosten und zu einem etwaigen Wertersatz.
            </p>
          </RechtstextTodo>

          <h2>Ausnahmen bei personalisierten Artikeln</h2>
          <p>
            T-Shirts mit Namensdruck werden eigens für dich angefertigt. Bei solchen Waren kann das
            Widerrufsrecht nach den gesetzlichen Bestimmungen ausgeschlossen oder eingeschränkt
            sein. Wir weisen im Bestellvorgang an der Personalisierung noch einmal darauf hin.
          </p>
          <RechtstextTodo titel="Verbindliche Formulierung zum Ausschluss des Widerrufsrechts">
            <p>
              Hier folgt die geprüfte Formulierung zum Ausschluss des Widerrufsrechts bei nach
              Kundenspezifikation angefertigten Waren.
            </p>
          </RechtstextTodo>

          <h2>Muster-Widerrufsformular</h2>
          <RechtstextTodo titel="Muster-Widerrufsformular">
            <p>
              Hier folgt das gesetzliche Muster-Widerrufsformular zum Ausfüllen und Absenden.
            </p>
          </RechtstextTodo>

          <h2>Kontakt für Rückfragen</h2>
          <p>
            Schreib uns bei Fragen einfach an{' '}
            <a href="mailto:info@videko-kuechen.de">info@videko-kuechen.de</a>. Unsere vollständigen
            Kontaktdaten stehen im <Link to="/impressum">Impressum</Link>.
          </p>

          <p className="legal__note">
            Angaben zu Versandkosten und Lieferzeiten findest du unter{' '}
            <Link to="/versand-lieferung">Versand &amp; Lieferung</Link>.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
