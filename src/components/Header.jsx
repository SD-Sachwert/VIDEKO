import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, MapPin } from 'lucide-react'
import logoMain from '../assets/brand/logo-main.png'

const LINKS = [
  { label: 'Stylefinder', to: '/stylefinder' },
  { label: 'Materialien', to: '/materialien' },
  { label: 'Showroom', to: '/showroom' },
  { label: 'Planung', to: '/planung' },
  { label: 'Über VIDEKO', to: '/ueber-videko' },
  { label: 'Team', to: '/team' },
  { label: 'Karriere', to: '/karriere' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="container header__inner">
        <Link className="brand" to="/" aria-label="VIDEKO Küchen — Startseite">
          <img className="brand__logo" src={logoMain} alt="VIDEKO" />
          <span className="brand__text">
            <span className="brand__name">VIDEKO</span>
            <span className="brand__sub">Küchen</span>
          </span>
        </Link>

        <nav className="nav" aria-label="Hauptnavigation">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          <Link className="pill pill--cta" to="/beratung">
            <MapPin size={15} strokeWidth={1.8} />
            Beratung buchen
          </Link>
          <button
            className="burger"
            aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-menu">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <Link className="pill pill--cta" to="/beratung" onClick={() => setOpen(false)}>
            <MapPin size={15} strokeWidth={1.8} />
            Beratung buchen
          </Link>
        </div>
      )}
    </header>
  )
}
