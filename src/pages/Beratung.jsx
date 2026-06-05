import PageHero from '../components/PageHero.jsx'
import ContactSection from '../components/ContactSection.jsx'
import ctaImg from '../assets/images/beratung/cta-light-portal.png'

export default function Beratung() {
  return (
    <>
      <PageHero
        kicker="Beratung"
        title={<>Bereit für <span className="grad">Ihre Küche?</span></>}
        lead="Wir melden uns persönlich. Keine Callcenter-Nummer. Kein Küchenbasar."
        image={ctaImg}
      />
      <ContactSection />
    </>
  )
}
