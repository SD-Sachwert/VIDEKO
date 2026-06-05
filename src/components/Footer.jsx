import { Link } from 'react-router-dom'
import logoMark from '../assets/brand/logo-main.png'

const NAV = [
  { label: 'Stylefinder', to: '/stylefinder' },
  { label: 'Materialien', to: '/materialien' },
  { label: 'Showroom', to: '/showroom' },
  { label: 'Planung', to: '/planung' },
  { label: 'Über VIDEKO', to: '/ueber-videko' },
  { label: 'Team', to: '/team' },
  { label: 'Karriere', to: '/karriere' },
  { label: 'Beratung', to: '/beratung' },
]

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <img src={logoMark} alt="VIDEKO" className="footer__logo" />
          <p>Küchen.<br />Die Kunst des Lebens.</p>
        </div>
        <nav className="footer__nav" aria-label="Footer">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="footer__meta">
          <span>VIDEKO Küchen eG · Hertzstraße 4 · 97076 Würzburg</span>
          <span>© {new Date().getFullYear()} VIDEKO Küchen · info@videko-kuechen.de</span>
        </div>
      </div>
    </footer>
  )
}
