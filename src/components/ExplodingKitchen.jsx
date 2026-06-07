import { Lightbulb, Cpu, Layers, PanelsTopLeft, Archive, LayoutGrid, Ruler, Wrench, Gem, Hammer, MessageSquare } from 'lucide-react'

import Reveal from './Reveal.jsx'
import CTAButton from './CTAButton.jsx'

import sceneImg from '../assets/images/home/exploded/exploded-full-fallback-16x9.png'

const FEATURES = [
  { icon: Lightbulb, title: 'Licht & Atmosphäre', text: 'Integriertes Lichtkonzept für Stimmung und Funktion.' },
  { icon: Cpu, title: 'Premium Geräte', text: 'Nahtlos integrierte Technik – passend zu deinem Alltag.' },
  { icon: Layers, title: 'Arbeitsplatte', text: 'Edle Materialien, perfekt verarbeitet, äußerst belastbar.' },
  { icon: PanelsTopLeft, title: 'Korpus & Fronten', text: 'Maßgenau geplant, sauber gefertigt, langlebig schön.' },
  { icon: Archive, title: 'Auszüge & Stauraum', text: 'Durchdachter Stauraum bis in die letzte Ecke.' },
  { icon: LayoutGrid, title: 'Struktur & Komfort', text: 'Intelligente Lösungen für Ordnung und Ergonomie.' },
  { icon: Ruler, title: 'Maße & Präzision', text: 'Jeder Zentimeter millimetergenau geplant.' },
  { icon: Wrench, title: 'Montage & Perfektion', text: 'Fachgerecht montiert bis ins letzte Detail.' },
]

const VALUES = [
  { icon: Gem, title: 'Design mit Seele', text: 'Ästhetik, die berührt und bleibt.' },
  { icon: Hammer, title: 'Handwerk auf Niveau', text: 'Präzision, Erfahrung, Leidenschaft.' },
  { icon: Layers, title: 'Materialien für Generationen', text: 'Qualität, Beständigkeit und Wert.' },
  { icon: Cpu, title: 'Technik mit Mehrwert', text: 'Intelligent, leise, alltagstauglich.' },
  { icon: MessageSquare, title: 'Beratung auf Augenhöhe', text: 'Ehrlich, individuell, inspirierend.' },
]

export default function ExplodingKitchen() {
  return (
    <section className="xk2">
      <div className="xk2__bg" aria-hidden="true">
        <img src={sceneImg} alt="" />
        <span className="xk2__veil" />
      </div>

      <div className="container xk2__inner">
        <Reveal className="xk2__intro">
          <span className="kicker kicker--gold">Küchen, durchdacht bis ins Detail</span>
          <h2 className="xk2__title">Exploding<br /><span className="grad">Kitchen.</span></h2>
          <p className="xk2__lead">
            Jede VIDEKO-Küche ist ein Zusammenspiel aus präziser Planung, edlen Materialien
            und intelligenter Technik. Für dich sieht es am Ende einfach selbstverständlich aus –
            bei uns sitzt jedes Detail.
          </p>
          <CTAButton to="/beratung">Küche durchdenken lassen</CTAButton>
        </Reveal>

        <Reveal className="xk2__features" delay={0.1}>
          {FEATURES.map((f, i) => (
            <div className="xk2feat" key={f.title}>
              <span className="xk2feat__n">{String(i + 1).padStart(2, '0')}</span>
              <span className="xk2feat__ic"><f.icon size={18} strokeWidth={1.7} /></span>
              <span className="xk2feat__body">
                <span className="xk2feat__title">{f.title}</span>
                <span className="xk2feat__text">{f.text}</span>
              </span>
            </div>
          ))}
        </Reveal>
      </div>

      <div className="container xk2__foot">
        <div className="xk2__values">
          {VALUES.map((v) => (
            <span className="xk2val" key={v.title}>
              <v.icon size={20} strokeWidth={1.6} />
              <b>{v.title}</b>
              <i>{v.text}</i>
            </span>
          ))}
        </div>
        <CTAButton to="/beratung">Entdecke deine Traumküche</CTAButton>
      </div>
    </section>
  )
}
