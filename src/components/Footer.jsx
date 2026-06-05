import { Link } from 'react-router-dom'
import { MapPin, Mail, Phone } from 'lucide-react'
import logoMark from '../assets/brand/logo-main.png'

const NAV = [
  { label: 'Studio', to: '/studio' },
  { label: 'Leistungen', to: '/leistungen' },
  { label: 'Inspiration', to: '/inspiration' },
  { label: 'Vorher / Nachher', to: '/vorher-nachher' },
  { label: 'Karriere', to: '/karriere' },
  { label: 'Über uns', to: '/ueber-uns' },
  { label: 'Beratung', to: '/beratung' },
]

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <img src={logoMark} alt="VIDEKO" className="footer__logo" />
            <p>Küchen.<br />Die Kunst des Lebens.</p>
          </div>
          <nav className="footer__nav" aria-label="Footer">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to}>{n.label}</Link>
            ))}
          </nav>
        </div>

        <div className="footer__contact">
          <span className="footer__contact-name">VIDEKO Küchen eG</span>
          <div className="footer__contact-row">
            <span className="footer__contact-line">
              <MapPin size={15} strokeWidth={1.7} /> Hertzstraße 4, 97076 Würzburg
            </span>
            <a href="mailto:info@videko-kuechen.de" className="footer__contact-line">
              <Mail size={15} strokeWidth={1.7} /> info@videko-kuechen.de
            </a>
            <a href="tel:+491605545818" className="footer__contact-line">
              <Phone size={15} strokeWidth={1.7} /> 0160 5545818
            </a>
          </div>
        </div>

        <div className="footer__meta">
          <div className="footer__legal">
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
          </div>
          <span>© {new Date().getFullYear()} VIDEKO Küchen eG · Würzburg</span>
        </div>
      </div>
    </footer>
  )
}
