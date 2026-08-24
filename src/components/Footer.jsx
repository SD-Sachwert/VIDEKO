import { Link, useLocation } from 'react-router-dom'
import { MapPin, Mail, Phone, ArrowRight } from 'lucide-react'
import logoMark from '../assets/brand/logo-main-v2-288.webp'
import Img from './Img.jsx'
import { BRAND, ACTIVE_OPERATOR, OPERATOR_NOTICE, STUDIO_MAPS_URL } from '../data/company.js'

import kitchenVision from '../assets/images/kitchen-vision-1.webp'

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
  { label: 'Merch', to: '/merch' },
  { label: 'Karriere', to: '/karriere' },
  { label: 'Über uns', to: '/ueber-uns' },
]
// Nur im Shop: die Links, die Kunden dort erwarten.
const SHOP = [
  { label: 'Alle Produkte', to: '/merch#shop' },
  { label: 'T-Shirts', to: '/merch/signature-t-shirt-black' },
  { label: 'Boss-BATTLE', to: '/merch/boss-battle' },
  { label: 'Versand & Lieferung', to: '/versand-lieferung' },
  { label: 'Rückgabe & Widerruf', to: '/rueckgabe-widerruf' },
  { label: 'FAQ', to: '/merch#faq' },
]
// Bis SEO-Phase 2 zeigten „Planung", „Montage" und „Garantie" alle auf
// /leistungen; „Garantie" versprach ausserdem etwas, wozu es keine Seite und
// keine belegte Zusage gibt. Jetzt steht hier je Eintrag die Seite, die das
// Thema wirklich behandelt.
const SERVICE = [
  { label: 'Leistungen im Überblick', to: '/leistungen' },
  { label: 'Küchenstudio Würzburg', to: '/studio' },
  { label: 'Küchenberatung', to: '/beratung' },
  { label: 'Küchenplanung', to: '/planung' },
  { label: 'Küchen nach Maß', to: '/kuechen-nach-mass' },
  { label: 'Arbeitsplatten', to: '/arbeitsplatten' },
  { label: 'Küchenmontage', to: '/kuechenmontage-wuerzburg' },
  { label: 'Alles aus einer Hand', to: '/alles-aus-einer-hand' },
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
  const imShop = pathname.startsWith('/merch')

  return (
    <footer className={`footer footer--cinematic footer--${v.tone}`} id="footer">
      <div className="footer__bg" aria-hidden="true">
        {/* Steht immer unterhalb des Viewports — darf niemals eager laden.
            Vor der Optimierung waren das 2,13 MB auf jeder einzelnen Seite. */}
        <Img src={v.img} alt="" className="footer__bg-img" style={{ objectPosition: v.pos }} sizes="100vw" defer />
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

          <nav className="footer__col" aria-label={imShop ? 'Shop' : 'Navigation'}>
            <span className="footer__coltitle">{imShop ? 'Shop' : 'Navigation'}</span>
            {(imShop ? SHOP : NAV).map((n) => <Link key={n.label} to={n.to}>{n.label}</Link>)}
          </nav>

          <nav className="footer__col" aria-label="Leistungen">
            <span className="footer__coltitle">Leistungen</span>
            {SERVICE.map((n) => <Link key={n.label} to={n.to}>{n.label}</Link>)}
          </nav>

          <div className="footer__col footer__col--contact">
            <span className="footer__coltitle">Kontakt</span>
            <span className="footer__contact-name">{BRAND.name}</span>
            <a href={STUDIO_MAPS_URL} target="_blank" rel="noopener noreferrer" className="footer__contact-line"><MapPin size={15} strokeWidth={1.7} /> {BRAND.studio.street}, {BRAND.studio.postalCode} {BRAND.studio.city}</a>
            <a href={`mailto:${BRAND.contactEmail}`} className="footer__contact-line"><Mail size={15} strokeWidth={1.7} /> {BRAND.contactEmail}</a>
            <a href={`tel:${BRAND.phoneHref}`} className="footer__contact-line"><Phone size={15} strokeWidth={1.7} /> {BRAND.phone}</a>
          </div>
        </div>

        <div className="footer__meta">
          <span>© {new Date().getFullYear()} {ACTIVE_OPERATOR.legalName} · {BRAND.name}</span>
          <div className="footer__legal">
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
            <Link to="/agb">AGB</Link>
            <Link to="/versand-lieferung">Versand &amp; Lieferung</Link>
            <Link to="/rueckgabe-widerruf">Rückgabe &amp; Widerruf</Link>
          </div>
        </div>

        <p className="footer__operatornote">{OPERATOR_NOTICE} <Link to="/impressum">Impressum</Link></p>
        <p className="footer__ainote">Ein Teil der Bilder auf dieser Website wurde mit KI erstellt.</p>
      </div>
    </footer>
  )
}
