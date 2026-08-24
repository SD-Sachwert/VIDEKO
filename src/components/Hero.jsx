import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'

import CTAButton from './CTAButton.jsx'
import ValueBand from './ValueBand.jsx'
import { KiHinweis } from './legal/KiKennzeichnung.jsx'
import { imageMeta } from '../data/image-meta.js'
import heroImg from '../assets/images/shared/hero-videko-final-16x9.webp'
import heroMobileImg from '../assets/images/home/Mobile.webp'
import heroVideo from '../assets/images/home/Header.mp4'

const LINES = ['Küchenplanung aus Würzburg –', 'für dein Zuhause,', 'nicht fürs Schaufenster.']

/**
 * HERO
 * - framer-motion drives only the PARALLAX (scroll + pointer) via motion
 *   values bound to `style`; those never gate visibility.
 * - the entrance reveal is pure CSS (see styles.css: hero-in / lineIn), so the
 *   above-the-fold copy is guaranteed to appear.
 */
export default function Hero() {
  const ref = useRef(null)

  // GERAETEWEICHE OHNE JAVASCRIPT
  // -----------------------------
  // Mobil zeigt der Hero ein 9:16-Foto, ab 721 px ein Video mit 16:9-Poster.
  // Frueher entschied das `window.matchMedia` im Startwert des States. Seit die
  // Seite im Build vorgerendert wird, geht das nicht mehr: Node kennt keine
  // Viewportbreite, das ausgelieferte HTML waere also immer die Desktopvariante
  // — auf dem Handy haette der Browser damit erst das Video-Markup geparst
  // (mp4-Metadaten + 16:9-Poster geladen) und React es direkt danach wieder
  // ersetzt. Genau das soll die Weiche ja verhindern.
  //
  // Deshalb ist der erste Render jetzt geraeteunabhaengig ein <picture>: die
  // `media`-Bedingung im <source> entspricht exakt dem Breakpoint hier und den
  // beiden Preloads in routes-meta.js, also laedt jedes Geraet weiterhin genau
  // ein Motiv — schon vor dem ersten Byte JavaScript. Das Video kommt erst nach
  // dem Mount dazu, und weil sein `poster` dieselbe Datei ist, die der Desktop
  // ohnehin schon anzeigt, ist der Wechsel unsichtbar.
  const [zeigeVideo, setZeigeVideo] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)')
    const onChange = () => setZeigeVideo(!mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.14])
  const arcsY = useTransform(scrollYProgress, [0, 1], [0, -70])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -64])
  const bandY = useTransform(scrollYProgress, [0, 1], [0, 56])

  // Pointer parallax
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 55, damping: 18, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 55, damping: 18, mass: 0.6 })
  const imgPX = useTransform(sx, [-0.5, 0.5], [18, -18])
  const imgPY = useTransform(sy, [-0.5, 0.5], [14, -14])
  const arcPX = useTransform(sx, [-0.5, 0.5], [28, -28])
  const txtPX = useTransform(sx, [-0.5, 0.5], [-10, 10])

  function handleMove(e) {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  function handleLeave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <section
      className="hero"
      id="kuechenwelten"
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {/* --- Media: scroll (outer) + pointer (middle) + CSS ken-burns (img) --- */}
      <motion.div className="hero__media" style={{ y: imgY, scale: imgScale }}>
        <div className="hero__kb">
          {zeigeVideo ? (
            <video
              className="hero__img kenburns"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={heroImg}
              aria-hidden="true"
            >
              <source src={heroVideo} type="video/mp4" />
            </video>
          ) : (
            <picture>
              {/* Bis 720 px das 9:16-Motiv – identische Quellen und `sizes` wie
                  der zugehoerige Preload in routes-meta.js. */}
              <source
                media="(max-width: 720px)"
                srcSet={imageMeta(heroMobileImg)?.srcSet || heroMobileImg}
                sizes="100vw"
              />
              {/* Ab 721 px das Posterbild des Videos. Bewusst OHNE srcSet: der
                  Preload liefert genau diese eine Datei (responsive: false),
                  ein zweiter Kandidat wuerde einen Doppel-Download ausloesen. */}
              <img
                className="hero__img kenburns"
                src={heroImg}
                width={imageMeta(heroImg)?.w}
                height={imageMeta(heroImg)?.h}
                alt=""
                aria-hidden="true"
                fetchPriority="high"
                decoding="sync"
              />
            </picture>
          )}
        </div>
      </motion.div>

      <motion.div className="hero__arcs" style={{ y: arcsY, x: arcPX }} aria-hidden="true">
        <span className="hero__arc hero__arc--1" />
        <span className="hero__arc hero__arc--2" />
        <span className="hero__dust" />
      </motion.div>

      <div className="hero__veil" aria-hidden="true" />

      <KiHinweis className="kimark--overlay" variant="visualization" />

      {/* --- Copy --- */}
      <motion.div className="container hero__inner" style={{ y: textY }}>
        <motion.div className="hero__copy" style={{ x: txtPX }}>
          <p className="hero__kicker hero-in hero-in--1">
            Küchen, die mehr sind als Raum.
          </p>

          <h1 className="hero__title">
            {LINES.map((line, i) => (
              <span className="hero__line" key={line}>
                <span
                  className={
                    i >= 1 ? 'hero__line-in grad' : 'hero__line-in'
                  }
                >
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <p className="hero__sub hero-in hero-in--2">
            Maßgeschneiderte Küchen, exklusive Materialien und präzises Handwerk –
            für ein Zuhause, das zu dir passt.
          </p>

          <div className="hero__actions hero-in hero-in--3">
            <CTAButton to="/beratung">Persönlich beraten lassen</CTAButton>
            <CTAButton to="/inspiration" variant="dark">Inspiration entdecken</CTAButton>
          </div>
        </motion.div>
      </motion.div>

      {/* --- Value band --- */}
      <motion.div className="container hero__band" style={{ y: bandY }}>
        <div className="hero__band-in hero-in hero-in--4">
          <ValueBand />
        </div>
      </motion.div>

      <div className="hero__scroll" aria-hidden="true">
        <span>SCROLL</span>
        <span className="hero__scroll-line" />
      </div>
    </section>
  )
}
