import { Link } from 'react-router-dom'
import { MapPin, Mail, Phone, ArrowRight } from 'lucide-react'
import logoMark from '../assets/brand/logo-main.png'
import footerBg from '../assets/images/home/footer/footer-experience-bg-wide.png'

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

export default function Footer() {
  return (
    <footer className="footer footer--cinematic" id="footer">
      <div className="footer__bg" aria-hidden="true">
        <img src={footerBg} alt="" className="footer__bg-img" />
        <span className="footer__overlay" />
      </div>

      <div className="container footer__inner">
        <div className="footer__cta">
          <span className="kicker kicker--gold">Persönlich. Ehrlich. Anspruchsvoll.</span>
          <h2 className="footer__ctatitle">
            Bereit für eine Küche, die nicht nach Standard aussieht?<br />
            <span className="grad">Dann lass uns über deine Ideen sprechen.</span>
          </h2>
          <Link to="/beratung" className="footer__ctabtn">
            Beratung vereinbaren <ArrowRight size={16} strokeWidth={2} />
          </Link>
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
            <span className="footer__contact-line"><MapPin size={15} strokeWidth={1.7} /> Hertzstraße 4, 97076 Würzburg</span>
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
