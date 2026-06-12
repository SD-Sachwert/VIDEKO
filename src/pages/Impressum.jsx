import Reveal from '../components/Reveal.jsx'

export default function Impressum() {
  return (
    <>
      <section className="section section--light legal-page">
        <div className="container">
          <Reveal className="legal-head">
            <span className="kicker kicker--gold">Rechtliches</span>
            <h1 className="legal-head__title">Impressum</h1>
          </Reveal>
          <Reveal className="legal legal--doc">
            <h2>Angaben gemäß § 5 TMG</h2>
            <p>
              VIDEKO Küchen eG<br />
              Hertzstraße 4<br />
              97076 Würzburg
            </p>

            <h2>Vertreten durch</h2>
            <p>Die Vorstände: Vitali Freisinger, Dennis Himmel, Heiko Himmel</p>

            <h2>Kontakt</h2>
            <p>
              Telefon: 0160 5545818<br />
              E-Mail: <a href="mailto:info@videko-kuechen.de">info@videko-kuechen.de</a>
            </p>

            <h2>Registereintrag</h2>
            <p className="legal__ph">
              Handelsregister / Genossenschaftsregister: wird final ergänzt<br />
              Registergericht: wird final ergänzt
            </p>

            <h2>Umsatzsteuer-ID</h2>
            <p className="legal__ph">
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: wird final ergänzt
            </p>

            <h2>EU-Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streit­beilegung (OS)
              bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer">https://ec.europa.eu/consumers/odr/</a>.
              Unsere E-Mail-Adresse findest du oben im Impressum.
            </p>

            <h2>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>

            <p className="legal__note">Hinweis: Register- und USt-Angaben werden final ergänzt.</p>
          </Reveal>
        </div>
      </section>
    </>
  )
}
