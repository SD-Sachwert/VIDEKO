import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Wallet, Box, MessageSquare, Wrench, ArrowRight, Check } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import ProcessTimeline from '../components/ProcessTimeline.jsx'

import heroDark from '../assets/images/leistungen/03_hero_dunkle_kueche.png'
import introImg from '../assets/images/leistungen/04_intro_helle_kueche.png'
import imgPlanung from '../assets/images/leistungen/05_kuechenplanung_detail.png'
import imgStudio from '../assets/images/leistungen/06_beratung_im_studio.png'
import imgHome from '../assets/images/leistungen/07_beratung_bei_dir_zuhause.png'
import img3d from '../assets/images/leistungen/08_3d_planung.png'
import imgVr from '../assets/images/leistungen/09_vr_planung.png'
import imgUmbau from '../assets/images/leistungen/10_umbau_aus_einer_hand.png'
import imgTeam from '../assets/images/leistungen/11_team_beratung_vertrauen.png'
import imgArch from '../assets/images/shared/hero-kitchen-arch.jpg'

const KEYPOINTS = [
  { icon: Wallet, label: 'Von günstig bis hochwertig' },
  { icon: Box, label: '3D- & VR-Planung' },
  { icon: MessageSquare, label: 'Studio oder bei dir zuhause' },
  { icon: Wrench, label: 'Alles aus einer Hand' },
]

const SERVICES = [
  { title: 'Küchenplanung', text: 'Maßgeschneidert auf dich und deinen Raum. Kein Schema F.', image: imgPlanung },
  { title: 'Beratung im Studio', text: 'In Ruhe anschauen, anfassen, ausprobieren – ohne Aufschwatzen.', image: imgStudio },
  { title: 'Beratung bei dir zuhause', text: 'Wir kommen dahin, wo deine Küche später wirklich steht.', image: imgHome },
  { title: '3D-Planung', text: 'Du siehst deine Küche, bevor sie gebaut wird.', image: img3d },
  { title: 'VR-Planung', text: 'Auf Wunsch gehst du vorher virtuell durch deine neue Küche.', image: imgVr },
  { title: 'Aufmaß', text: 'Millimetergenau per Laser. Damit später nichts hakt.', image: imgPlanung },
  { title: 'Geräte & Materialien', text: 'Von solide bis Premium – ehrlich kombiniert, nicht hochgeredet.', image: introImg },
  { title: 'Lieferung & Montage', text: 'Termine und Aufbau sauber koordiniert. Wir halten das zusammen.', image: imgArch },
  { title: 'Gewerkekoordination', text: 'Maler, Putzer, Elektriker, Boden, Trockenbau – wir steuern das.', image: imgUmbau },
  { title: 'Raum- & Umbaukonzepte', text: 'Aus einer Küchenanfrage wird auf Wunsch die ganze Raumlösung.', image: imgUmbau },
]

const GEWERKE = ['Maler', 'Putzer', 'Elektriker', 'Boden', 'Trockenbau', 'u. v. m.']

const PROCESS = [
  { title: 'Kennenlernen', text: 'Erstmal quatschen: Was brauchst du, was nervt dich aktuell?' },
  { title: 'Beratung', text: 'Im Studio oder bei dir zuhause – wie es dir lieber ist.' },
  { title: 'Planung', text: 'In 3D, auf Wunsch in VR. Du siehst alles vorab.' },
  { title: 'Koordination', text: 'Wir steuern Termine, Lieferungen und Gewerke.' },
  { title: 'Umsetzung', text: 'Saubere Montage – termintreu und ohne Chaos.' },
  { title: 'Nachbetreuung', text: 'Fragen oder Anpassungen? Wir bleiben dran.' },
]

const HALTUNG = [
  'Ehrlich statt Verkaufsdruck',
  'Persönlich statt Möbelhaus-Abfertigung',
  'Klartext statt Küchen-Geschwafel',
  'Hochwertig – ohne steifes Getue',
]

export default function Leistungen() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])

  return (
    <div className="leist-page">
      {/* HERO (dark) */}
      <section className="pagehero leist-hero" ref={heroRef}>
        <div className="pagehero__media" aria-hidden="true">
          <motion.img src={heroDark} alt="" className="pagehero__img" style={{ y: imgY, scale: imgScale }} />
          <div className="pagehero__veil" />
        </div>
        <div className="container pagehero__inner">
          <Reveal>
            <span className="kicker kicker--gold">Unsere Leistungen</span>
            <h1 className="pagehero__title">Mehr als nur eine Küche.<br /><span className="grad">Eine Lösung.</span></h1>
            <p className="pagehero__lead">
              Wir planen dir nicht einfach eine Küche – wir lösen gleich den ganzen
              Raum. Von günstig bis hochwertig, ehrlich und ohne Verkaufsdruck.
            </p>
            <div className="pagehero__actions">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <a className="leist-hero__link" href="#leist-services">
                Unsere Leistungen entdecken <ArrowRight size={16} strokeWidth={1.9} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* INTRO (light, gold-marble) */}
      <section className="section leist-intro2">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__media">
              <div className="lintro__frame"><img src={introImg} alt="Helle VIDEKO Küche" loading="lazy" /><span className="lintro__rim" aria-hidden="true" /></div>
            </Reveal>
            <Reveal className="lintro__copy" delay={0.08}>
              <span className="kicker">Unser Anspruch</span>
              <h2 className="lintro__title">Wir verkaufen dir nicht einfach eine Küche.<br /><span className="grad">Wir planen mit dir dein Zuhause.</span></h2>
              <p className="lintro__text">
                Ehrlich, durchdacht und ohne Verkaufsdruck. Von der günstigen Lösung
                bis zur hochwertigen Traumküche – und auf Wunsch gleich der ganze Raum.
              </p>
              <div className="lkeys">
                {KEYPOINTS.map((k) => (
                  <div className="lkey" key={k.label}>
                    <span className="lkey__icon" aria-hidden="true"><k.icon size={18} strokeWidth={1.6} /></span>
                    <span className="lkey__label">{k.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SERVICES (image cards) */}
      <section className="section leist-services2" id="leist-services">
        <div className="container">
          <SectionHeader
            kicker="Leistungen"
            title={<>Für deine Küche. Für deinen Raum. <span className="grad">Für dein Zuhause.</span></>}
            lead="Alles, was du für eine richtig gute Küche brauchst – und mehr, wenn du willst."
          />
          <div className="lservice-grid">
            {SERVICES.map((sv, i) => (
              <Reveal key={sv.title} delay={(i % 3) * 0.06}>
                <article className="lscard">
                  <span className="lscard__img" style={{ backgroundImage: `url(${sv.image})` }} aria-hidden="true" />
                  <span className="lscard__scrim" aria-hidden="true" />
                  <span className="lscard__body">
                    <span className="lscard__title">{sv.title}</span>
                    <span className="lscard__text">{sv.text}</span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="section__cta">
            <CTAButton to="/beratung">Beratung anfragen</CTAButton>
          </div>
        </div>
      </section>

      {/* ALLES AUS EINER HAND (text + image) */}
      <section className="section leist-aaeh3">
        <div className="container">
          <div className="laaeh">
            <Reveal className="laaeh__copy">
              <span className="kicker">Alles aus einer Hand</span>
              <h2 className="laaeh__title">Wenn du willst, kümmern wir uns<br /><span className="grad">um den Rest.</span></h2>
              <p>
                Wir hören nicht an der Küche auf. Auf Wunsch denken wir den ganzen
                Raum mit und koordinieren die Gewerke – damit du nicht zehn Baustellen
                jonglierst, sondern einen Ansprechpartner hast. Im Zweifel bauen wir
                dir fast das ganze Haus um.
              </p>
              <div className="lchips">
                {GEWERKE.map((g) => <span className="lchip" key={g}>{g}</span>)}
              </div>
              <CTAButton to="/beratung">Lass uns reden</CTAButton>
            </Reveal>
            <Reveal className="laaeh__media" delay={0.08}>
              <div className="laaeh__frame"><img src={imgUmbau} alt="Umbau aus einer Hand" loading="lazy" /></div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* PROCESS (dark accent band) */}
      <section className="section section--dark leist-ablauf2">
        <div className="container">
          <SectionHeader tone="light" kicker="So arbeiten wir" title={<>Klarer Ablauf. <span className="grad">Stressfrei für dich.</span></>} />
          <ProcessTimeline steps={PROCESS} />
        </div>
      </section>

      {/* HALTUNG (light, image + stances) */}
      <section className="section leist-haltung3">
        <div className="container">
          <div className="lhaltung">
            <Reveal className="lhaltung__media">
              <div className="lhaltung__frame"><img src={imgTeam} alt="Persönliche Beratung bei VIDEKO" loading="lazy" /></div>
            </Reveal>
            <Reveal className="lhaltung__copy" delay={0.08}>
              <span className="kicker">So ticken wir</span>
              <h2 className="lhaltung__title">Ehrlich. Persönlich. <span className="grad">Ohne Blabla.</span></h2>
              <ul className="lstances">
                {HALTUNG.map((h) => (
                  <li key={h}><Check size={16} strokeWidth={2.4} /> {h}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FINAL CTA (dark accent band) */}
      <section className="section section--dark leist-final2">
        <div className="container">
          <Reveal className="lfinal">
            <h2 className="lfinal__title">Egal ob neue Küche oder kompletter Umbau –<br /><span className="grad">lass uns gemeinsam loslegen.</span></h2>
            <p className="lfinal__text">Ohne Verkaufsdruck. Ohne Gelaber. Einfach gute Planung.</p>
            <div className="lfinal__actions">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <CTAButton to="/beratung" variant="dark">Planungsgespräch buchen</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
