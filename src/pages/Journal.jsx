import PageHero from '../components/PageHero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'

import heroImg from '../assets/images/inspiration/05_helle_kueche.png'
import aLicht from '../assets/images/inspiration/05_helle_kueche.png'
import aMaterial from '../assets/images/inspiration/06_materialien_und_details.png'
import aPlanung from '../assets/images/inspiration/07_kueche_mit_insel.png'

const ARTICLES = [
  { title: 'Licht in der Küche', text: 'Warum Lichtplanung oft wichtiger ist als die Frontfarbe.', img: aLicht },
  { title: 'Welche Materialien passen zu mir?', text: 'Ein ehrlicher Wegweiser durch Stein, Holz, Keramik & Co.', img: aMaterial },
  { title: 'Küchenplanung: 7 Tipps vom Experten', text: 'Was eine richtig gute Planung von Anfang an ausmacht.', img: aPlanung },
]

export default function Journal() {
  return (
    <>
      <PageHero
        className="leist-hero"
        kicker="Journal"
        title={<>Wissen, das <span className="grad">weiterhilft.</span></>}
        lead="Tipps, Ideen und Expertenwissen rund um Küche, Material und Planung – unser Küchen-Ratgeber."
        image={heroImg}
      >
        <CTAButton to="/beratung">Beratung anfragen</CTAButton>
      </PageHero>

      <section className="section section--light">
        <div className="container">
          <SectionHeader
            align="center"
            kicker="Küchenratgeber"
            title="Die ersten Beiträge."
            lead="Wir arbeiten an unseren Artikeln – ein erster Blick auf das, was bald kommt."
          />
          <div className="cardgrid cardgrid--3">
            {ARTICLES.map((a) => (
              <Reveal key={a.title}>
                <article className="artcard">
                  <span className="artcard__img" style={{ backgroundImage: `url(${a.img})` }} aria-hidden="true" />
                  <span className="artcard__body">
                    <span className="artcard__tag">Demnächst</span>
                    <span className="artcard__title">{a.title}</span>
                    <span className="favcard__text" style={{ color: 'var(--ink-soft)' }}>{a.text}</span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="section__cta">
            <CTAButton to="/inspiration" variant="dark">Zur Inspiration</CTAButton>
          </div>
        </div>
      </section>
    </>
  )
}
