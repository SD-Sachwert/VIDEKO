import { Link } from 'react-router-dom'

import PageHero from '../components/PageHero.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'
import Seo from '../components/Seo.jsx'
import heroImg from '../assets/images/inspiration/01_hero_atmosphaerische_kueche.webp'

/**
 * 404.
 *
 * Bewusst keine stille Weiterleitung auf die Startseite: Eine falsche URL soll
 * als solche erkennbar sein — für Besucher wie für Suchmaschinen. Die Seite
 * steht auf `noindex` und wird über dist/404.html mit echtem HTTP-Status 404
 * ausgeliefert (siehe scripts/prerender.mjs und vercel.json).
 */
export default function NotFound() {
  return (
    <div className="notfound-page">
      <Seo
        title="Seite nicht gefunden | VIDEKO Küchen"
        description="Diese Seite existiert nicht (mehr). Zurück zur Startseite oder direkt zur Beratungsanfrage."
        canonicalPath="/404"
        noindex
      />

      <PageHero
        kicker="Fehler 404"
        title={<>Diese Seite gibt es <span className="grad">nicht.</span></>}
        lead="Vielleicht ein Tippfehler in der Adresse, vielleicht ein alter Link. Deine Küche planen wir trotzdem gern weiter."
        image={heroImg}
        aiImage
      >
        <CTAButton to="/">Zur Startseite</CTAButton>
        <CTAButton to="/beratung" variant="dark">Beratung anfragen</CTAButton>
      </PageHero>

      <section className="section section--light">
        <div className="container">
          <Reveal>
            <p className="notfound__hint">
              Häufig gesucht:{' '}
              <Link to="/leistungen">Leistungen</Link> ·{' '}
              <Link to="/inspiration">Inspiration</Link> ·{' '}
              <Link to="/vorher-nachher">Vorher / Nachher</Link> ·{' '}
              <Link to="/journal">Journal</Link> ·{' '}
              <Link to="/studio">Studio Würzburg</Link>
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
