import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import RechtstextTodo from '../components/legal/RechtstextTodo.jsx'
import {
  formatPrice, SHIPPING_COST, FREE_SHIPPING_FROM,
  LEAD_TIME_DEFAULT, LEAD_TIME_PERSONALIZED,
} from '../data/merch.js'

/**
 * Die Konditionen kommen aus shop-config.json, damit Shop, FAQ und diese
 * Seite nicht auseinanderlaufen koennen.
 */
export default function VersandLieferung() {
  return (
    <section className="section section--light legal-page">
      <div className="container">
        <Reveal className="legal-head">
          <span className="kicker kicker--gold">Service</span>
          <h1 className="legal-head__title">Versand &amp; Lieferung</h1>
        </Reveal>

        <Reveal className="legal legal--doc">
          <h2>Versandkosten</h2>
          <p>
            Innerhalb Deutschlands berechnen wir pauschal {formatPrice(SHIPPING_COST)} pro Bestellung.
            Ab einem Bestellwert von {formatPrice(FREE_SHIPPING_FROM)} liefern wir versandkostenfrei.
          </p>

          <h2>Lieferzeit</h2>
          <p>
            Lagerartikel versenden wir in der Regel innerhalb von {LEAD_TIME_DEFAULT} nach
            Zahlungseingang. Personalisierte Artikel werden einzeln für dich angefertigt, hier
            beträgt die Lieferzeit {LEAD_TIME_PERSONALIZED}.
          </p>
          <p>
            Artikel, die im Shop mit „Coming Soon“ gekennzeichnet sind, können noch nicht bestellt
            werden. Über „Benachrichtige mich“ informieren wir dich, sobald sie verfügbar sind.
          </p>

          <h2>Liefergebiet</h2>
          <p>
            Wir liefern derzeit ausschließlich innerhalb Deutschlands. Sobald wir weitere Länder
            beliefern, findest du die Konditionen an dieser Stelle.
          </p>

          <h2>Bestellung und Versanddienstleister</h2>
          <RechtstextTodo titel="Angaben zu Versanddienstleister, Gefahrübergang und Teillieferungen">
            <p>
              Hier folgen die verbindlichen Angaben zum eingesetzten Versanddienstleister, zum
              Gefahrübergang, zum Umgang mit Teillieferungen sowie zu Transportschäden.
            </p>
          </RechtstextTodo>

          <p className="legal__note">
            Fragen zur Rückgabe beantwortet die Seite{' '}
            <Link to="/rueckgabe-widerruf">Rückgabe &amp; Widerruf</Link>. Die vertraglichen
            Grundlagen stehen in unseren <Link to="/agb">AGB</Link>.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
