import Reveal from '../components/Reveal.jsx'
import { ACTIVE_OPERATOR, BRAND, OPERATOR_NOTICE } from '../data/company.js'

/**
 * Impressum von videko-kuechen.de.
 *
 * Betreiberin dieses Internetauftritts ist ACTIVE_OPERATOR aus company.js –
 * seit 08.10.2026 die VIDEKO Küchen eG (GnR 298, AG Würzburg). Alle Angaben
 * ziehen zentral aus company.js; keine Platzhalter, keine „wird ergänzt".
 * Fehlt eine USt-IdNr. (noch nicht erteilt), entfällt der Abschnitt.
 */
export default function Impressum() {
  const op = ACTIVE_OPERATOR
  const inhaltlichVerantwortlich = op.board?.[0]

  return (
    <>
      <section className="section section--light legal-page">
        <div className="container">
          <Reveal className="legal-head">
            <span className="kicker kicker--gold">Rechtliches</span>
            <h1 className="legal-head__title">Impressum</h1>
          </Reveal>
          <Reveal className="legal legal--doc">
            <h2>Angaben zur Betreiberin dieses Internetauftritts</h2>
            <p>
              Betreiberin von {BRAND.domain} ist die<br />
              <strong>{op.legalName}</strong><br />
              {op.street}<br />
              {op.postalCode} {op.city}<br />
              {op.country}
            </p>
            <p>{OPERATOR_NOTICE}</p>

            <h2>Vertreten durch die Vorstände</h2>
            <p>{op.board.join(', ')}{op.boardNote ? ` (${op.boardNote})` : ''}</p>

            <h2>Registereintrag</h2>
            <p>
              {op.registerType}: {op.registerNumber}<br />
              Registergericht: {op.registerCourt}
            </p>

            {op.vatId && (
              <>
                <h2>Umsatzsteuer-Identifikationsnummer</h2>
                <p>
                  Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:{' '}
                  {op.vatId}
                </p>
              </>
            )}

            <h2>Genossenschaftlicher Prüfungsverband</h2>
            <p>{op.auditAssociation}</p>

            <h2>Kontakt</h2>
            <p>
              Telefon: {op.operatorPhone}<br />
              E-Mail: <a href={`mailto:${op.operatorEmail}`}>{op.operatorEmail}</a>
            </p>

            <h2>Inhaltlich verantwortlich gemäß § 18 Abs. 2 MStV</h2>
            <p>
              {inhaltlichVerantwortlich}<br />
              {op.street}, {op.postalCode} {op.city}
            </p>

            <h2>Hinweis zu Bildern (KI-Kennzeichnung)</h2>
            <p>
              Ein großer Teil der auf {BRAND.domain} gezeigten Bilder – insbesondere
              Küchen-, Raum- und Stimmungsaufnahmen, Produktdarstellungen sowie einzelne
              Szenen mit Personen in Beratungs- oder Kundensituationen – wurde mit
              künstlicher Intelligenz (KI) erzeugt. Diese Bilder dienen der Veranschaulichung
              und können vom tatsächlichen Aussehen von Räumen, Produkten oder Situationen
              abweichen. KI-generierte Motive sind im jeweiligen Zusammenhang zusätzlich
              gekennzeichnet.
            </p>
            <p>
              Vorher/Nachher- sowie Projektdarstellungen sind – soweit nicht ausdrücklich
              anders angegeben – beispielhafte, teils KI-generierte Illustrationen und keine
              dokumentierten realen Kundenprojekte. Die Fotos der drei Gründer (Vitali,
              Dennis, Heiko) im Bereich „Über uns" sind echte Aufnahmen dieser Personen.
            </p>

            <h2>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
            {/*
              Bewusst KEIN Hinweis/Link auf die frühere EU-Online-Streitbeilegungs-
              plattform (OS-Plattform, ec.europa.eu/consumers/odr): Diese wurde von der
              EU-Kommission zum 20.07.2025 eingestellt. Ein Link darauf wäre veraltet
              und wird nicht eingebunden.
            */}
          </Reveal>
        </div>
      </section>
    </>
  )
}
