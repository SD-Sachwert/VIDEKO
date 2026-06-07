import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'

import CTAButton from './CTAButton.jsx'
import ValueBand from './ValueBand.jsx'
import heroImg from '../assets/images/shared/hero-videko-final-16x9.png'
import heroMobileImg from '../assets/images/home/Mobile.png'
import heroVideoWebm from '../assets/images/home/Header.webm'
import heroVideo from '../assets/images/home/Header.mp4'

const LINES = ['Für Menschen, die das', 'Besondere erleben wollen.']

/**
 * HERO
 * - framer-motion drives only the PARALLAX (scroll + pointer) via motion
 *   values bound to `style`; those never gate visibility.
 * - the entrance reveal is pure CSS (see styles.css: hero-in / lineIn), so the
 *   above-the-fold copy is guaranteed to appear.
 */
export default function Hero() {
  const ref = useRef(null)

  // mobile gets a 9:16 photo (Ken-Burns) instead of the 16:9 video — the video
  // is never put in the DOM on mobile, so it isn't downloaded.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)')
    const onChange = () => setIsMobile(mq.matches)
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
          {isMobile ? (
            <img className="hero__img kenburns hero__img--mobile" src={heroMobileImg} alt="" aria-hidden="true" />
          ) : (
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
              <source src={heroVideoWebm} type="video/webm" />
              <source src={heroVideo} type="video/mp4" />
            </video>
          )}
        </div>
      </motion.div>

      <motion.div className="hero__arcs" style={{ y: arcsY, x: arcPX }} aria-hidden="true">
        <span className="hero__arc hero__arc--1" />
        <span className="hero__arc hero__arc--2" />
        <span className="hero__dust" />
      </motion.div>

      <div className="hero__veil" aria-hidden="true" />

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
                    i === LINES.length - 1 ? 'hero__line-in grad' : 'hero__line-in'
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
