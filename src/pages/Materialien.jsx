import PageHero from '../components/PageHero.jsx'
import MaterialsSection from '../components/MaterialsSection.jsx'
import matHero from '../assets/images/materialien/materials-hero-bg-16x9.png'

export default function Materialien() {
  return (
    <>
      <PageHero
        kicker="Materialien"
        title={<>Materialien, die man <span className="grad">fühlen will.</span></>}
        lead="Oberflächen, Haptik und Muster – echte Materialien, perfekt verarbeitet. Für Küchen, die bleiben und begeistern."
        image={matHero}
      />
      <MaterialsSection embedded />
    </>
  )
}
