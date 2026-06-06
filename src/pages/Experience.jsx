import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import CTAButton from '../components/CTAButton.jsx'
import ExperienceOverlay from '../components/experience/ExperienceOverlay.jsx'

import fbHero from '../assets/images/experience/hero/exp-hero-kitchen.png'
import fbWhy from '../assets/images/experience/why-videko/exp-why-bg.png'
import fbStyle from '../assets/images/experience/stylefinder/exp-style-modern-warm.jpg'
import fbMaterial from '../assets/images/experience/materials/exp-material-naturstein.png'
import fbPlanning from '../assets/images/experience/planning/exp-exploding-kitchen.png'
import fbFinal from '../assets/images/experience/showroom/exp-final-cta.jpg'

// load three/r3f only when the immersive version is actually used
const ExperienceCanvas = lazy(() => import('../components/experience/ExperienceCanvas.jsx'))

function immersiveByDefault() {
  if (typeof window === 'undefined') return false
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const small = window.matchMedia('(max-width: 820px)').matches
  return !reduced && !small
}

const FB = [
  { img: fbHero, align: 'left', eyebrow: 'VIDEKO Experience', lines: ['Bereit für eine Küche,', 'die nicht normal ist?'], sub: 'Für Menschen mit Anspruch. Für Räume mit Seele. Für alle, die keine Küche von der Stange wollen.', cta: { label: 'Beratung buchen', to: '/beratung' } },
  { img: fbWhy, align: 'right', eyebrow: 'Warum VIDEKO', lines: ['Schluss mit', 'Küchenverkauf von 2008.'], sub: 'Kein Rabattgeschrei, kein Verkaufsdruck. Sondern ehrliche Planung für dein echtes Leben.', cta: { label: 'Den Unterschied erleben', to: '/ueber-uns' } },
  { img: fbStyle, align: 'left', eyebrow: 'Küchenwelten', lines: ['Welcher', 'Küchenstil bist du?'], sub: 'Von zeitlos elegant bis industrial premium – finde deine Richtung.', cta: { label: 'Stilfinder starten', to: '/stylefinder' } },
  { img: fbMaterial, align: 'right', eyebrow: 'Materialwelt', lines: ['Materialien,', 'die man fühlen will.'], sub: 'Naturstein, Metall, Bronze, Keramik, Holz und Glas – echte Oberflächen.', cta: { label: 'Materialien entdecken', to: '/materialien' } },
  { img: fbPlanning, align: 'left', eyebrow: 'Planungskompetenz', lines: ['Was du siehst: Küche.', 'Was wir sehen: 184 Entscheidungen.'], sub: 'Licht, Geräte, Arbeitsplatte, Korpus, Fronten, Stauraum, Maß und Montage.', cta: { label: 'Planung entdecken', to: '/planung' } },
  { img: fbFinal, align: 'left', eyebrow: 'Eintauchen statt nur anschauen.', lines: ['Bereit für', 'deine Küche?'], sub: 'Unser Studio ist kein Möbelhaus. Es ist ein Erlebnisraum für gute Entscheidungen.', cta: { label: 'Beratung buchen', to: '/beratung' } },
]

function ExperienceFallback() {
  return (
    <div className="xp-fb">
      {FB.map((s, i) => (
        <section className={`xp-fb__sec xp-fb__sec--${s.align}`} key={i}>
          <div className="xp-fb__bg" style={{ backgroundImage: `url(${s.img})` }} aria-hidden="true" />
          <div className="xp-fb__veil" aria-hidden="true" />
          <motion.div
            className="xp-fb__inner"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
          >
            <span className="xp-fb__eyebrow">{s.eyebrow}</span>
            <h2 className="xp-fb__title">{s.lines.map((l, k) => <span key={k}>{l}</span>)}</h2>
            <p className="xp-fb__sub">{s.sub}</p>
            <CTAButton to={s.cta.to}>{s.cta.label}</CTAButton>
          </motion.div>
        </section>
      ))}
    </div>
  )
}

export default function Experience() {
  const [immersive] = useState(immersiveByDefault)
  const progress = useRef(0)

  useEffect(() => {
    if (!immersive) return
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      progress.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [immersive])

  if (!immersive) return <ExperienceFallback />

  return (
    <div className="xp">
      <Suspense fallback={<div className="xp__loading"><span>VIDEKO Experience lädt …</span></div>}>
        <ExperienceCanvas progress={progress} />
      </Suspense>
      <div className="xp__topscrim" aria-hidden="true" />
      <ExperienceOverlay />
    </div>
  )
}
