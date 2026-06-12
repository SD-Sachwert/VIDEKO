import { Link, useLocation } from 'react-router-dom'
import { MapPin, Mail, Phone, ArrowRight } from 'lucide-react'
import logoMark from '../assets/brand/logo-main.png'

import kitchenVision from '../assets/images/kitchen-vision-1.png'

// "Kitchen Vision" als einheitlicher Footer-Hintergrund auf allen Seiten
const bgDefault = kitchenVision
const bgHome = kitchenVision
const bgJournal = kitchenVision
const bgKarriere = kitchenVision
const bgLeistungen = kitchenVision

const NAV = [
  { label: 'Stylefinder', to: '/stylefinder' },
  { label: 'Inspiration', to: '/inspiration' },
  { label: 'Journal', to: '/journal' },
  { label: 'Vorher / Nachher', to: '/vorher-nachher' },
  { label: 'Karriere', to: '/karriere' },
  { label: 'Über uns', to: '/ueber-uns' },
]
const SERVICE = [
  { label: 'Beratung', to: '/beratung' },
  { label: 'Planung', to: '/leistungen' },
  { label: 'Montage', to: '/leistungen' },
  { label: 'Materialien', to: '/inspiration' },
  { label: 'Garantie', to: '/leistungen' },
  { label: 'FAQ', to: '/journal' },
]

// Pro Seite leichte Variation: Bildmotiv, Komposition (object-position), Overlay-Ton + die jeweils stärksten Claims.
const VARIANTS = {
  home: {
    img: bgHome, pos: 'center 42%', tone: 'warm', kicker: 'Persönlich. Ehrlich. Anspruchsvoll.',
    t1: 'Deine Küche. Dein Zuhause. ', t2: 'Dein Leben.',
    sub: 'Vereinbare deinen persönlichen Beratungstermin und erlebe, wie aus Ideen eine Küche wird, die wirklich zu dir passt.',
    primary: { label: 'Beratung anfragen', to: '/beratung' }, secondary: { label: 'Studio besuchen', to: '/studio' },
  },
  journal: {
    img: bgJournal, pos: 'center 32%', tone: 'deep', kicker: 'Inspiration trifft Planung.',
    t1: 'Bereit für deine ', t2: 'neue Küche?',
    sub: 'Finde deinen Stil oder lass dich persönlich beraten – ehrlich, ohne Verkaufstheater.',
    primary: { label: 'Stylefinder starten', to: '/stylefinder' }, secondary: { label: 'Beratung anfragen', to: '/beratung' },
  },
  karriere: {
    img: bgKarriere, pos: 'center 38%', tone: 'deep', kicker: 'Mehr als ein Job.',
    t1: 'Lust, etwas Besonderes ', t2: 'mit aufzubauen?',
    sub: 'Wir suchen keine Lebensläufe. Wir suchen Menschen. Vielleicht genau dich.',
    primary: { label: 'Jetzt bewerben', to: '/karriere#bewerbung' }, secondary: { label: 'Beratung anfragen', to: '/beratung' },
  },
  leistungen: {
    img: bgLeistungen, pos: 'center 45%', tone: 'cool', kicker: 'Klar. Persönlich. Verlässlich.',
    t1: 'Deine Küche. Unser Versprechen. ', t2: 'Wir machen es einfach.',
    sub: 'Unverbindlich, persönlich und auf Augenhöhe.',
    primary: { label: 'Termin vereinbaren', to: '/beratung' }, secondary: { label: 'Studio erleben', to: '/studio' },
  },
  studio: {
    img: bgDefault, pos: 'center 30%', tone: 'warm', kicker: 'Dein Studio in Würzburg.',
    t1: 'Deine Küche. Dein Zuhause. ', t2: 'Wir machen es möglich.',
    sub: 'Komm vorbei, fühl die Materialien und erlebe Planung, wie sie sein sollte.',
    primary: { label: 'Termin vereinbaren', to: '/beratung' }, secondary: { label: 'Studio entdecken', to: '/studio' },
  },
  vorher: {
    img: bgJournal, pos: 'center 52%', tone: 'deep', kicker: 'Bereit für deine Verwandlung?',
    t1: 'Aus deinem Zuhause kann mehr werden. ', t2: 'Lass uns gemeinsam loslegen.',
    sub: 'Ehrlich geplant, sauber umgesetzt – dein Projekt ist nur ein Gespräch entfernt.',
    primary: { label: 'Projekt anfragen', to: '/beratung' }, secondary: { label: 'Inspiration entdecken', to: '/inspiration' },
  },
  default: {
    img: bgDefault, pos: 'center 35%', tone: 'warm', kicker: 'Persönlich. Ehrlich. Anspruchsvoll.',
    t1: 'Bereit für eine Küche, die nicht nach Standard aussieht? ', t2: 'Dann lass uns über deine Ideen sprechen.',
    sub: 'Finde deinen Stil oder lass dich persönlich beraten – und mach aus einer Idee deinen Lieblingsraum.',
    primary: { label: 'Beratung vereinbaren', to: '/beratung' }, secondary: null,
  },
}

function variantFor(path) {
  if (path === '/') return VARIANTS.home
  if (path.startsWith('/journal')) return VARIANTS.journal
  if (path.startsWith('/karriere')) return VARIANTS.karriere
  if (path.startsWith('/leistungen')) return VARIANTS.leistungen
  if (path.startsWith('/studio')) return VARIANTS.studio
  if (path.startsWith('/vorher-nachher')) return VARIANTS.vorher
  return VARIANTS.default
}

export default function Footer() {
  const { pathname } = useLocation()
  const v = variantFor(pathname)

  return (
    <footer className={`footer footer--cinematic footer--${v.tone}`} id="footer">
      <div className="footer__bg" aria-hidden="true">
        <img src={v.img} alt="" className="footer__bg-img" style={{ objectPosition: v.pos }} />
        <span className="footer__overlay" />
      </div>

      <div className="container footer__inner">
        <div className="footer__cta">
          <span className="kicker kicker--gold">{v.kicker}</span>
          <h2 className="footer__ctatitle">{v.t1}<span className="grad">{v.t2}</span></h2>
          <div className="footer__ctabtns">
            <Link to={v.primary.to} className="footer__ctabtn">{v.primary.label} <ArrowRight size={16} strokeWidth={2} /></Link>
            {v.secondary && <Link to={v.secondary.to} className="footer__ctabtn footer__ctabtn--ghost">{v.secondary.label}</Link>}
          </div>
        </div>

        <div className="footer__cols">
          <div className="footer__brand">
            <img src={logoMark} alt="VIDEKO" className="footer__logo" />
            <p>Küchen.<br />Die Kunst des Lebens.</p>
          </div>

          <nav className="footer__col" aria-label="Navigation">
            <span className="footer__coltitle">Navigation</span>
            {NAV.map((n) => <Link key={n.label} to={n.to}>{n.label}</Link>)}
          </nav>

          <nav className="footer__col" aria-label="Service">
            <span className="footer__coltitle">Service</span>
            {SERVICE.map((n) => <Link key={n.label} to={n.to}>{n.label}</Link>)}
          </nav>

          <div className="footer__col footer__col--contact">
            <span className="footer__coltitle">Kontakt</span>
            <span className="footer__contact-name">VIDEKO Küchen eG</span>
            <a href="https://www.google.com/maps/search/?api=1&query=Hertzstra%C3%9Fe%204%2C%2097076%20W%C3%BCrzburg" target="_blank" rel="noopener noreferrer" className="footer__contact-line"><MapPin size={15} strokeWidth={1.7} /> Hertzstraße 4, 97076 Würzburg</a>
            <a href="mailto:info@videko-kuechen.de" className="footer__contact-line"><Mail size={15} strokeWidth={1.7} /> info@videko-kuechen.de</a>
            <a href="tel:+491605545818" className="footer__contact-line"><Phone size={15} strokeWidth={1.7} /> 0160 5545818</a>
          </div>
        </div>

        <div className="footer__meta">
          <span>© {new Date().getFullYear()} VIDEKO Küchen eG · Würzburg</span>
          <div className="footer__legal">
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
