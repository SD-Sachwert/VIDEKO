import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, MapPin } from 'lucide-react'
import logoMain from '../assets/brand/logo-main.png'

const MAIN = [
  { label: 'Home', to: '/' },
  { label: 'Studio', to: '/studio' },
  { label: 'Inspiration', to: '/inspiration' },
  { label: 'Leistungen', to: '/leistungen' },
  { label: 'Über uns', to: '/ueber-uns' },
  { label: 'Journal', to: '/journal' },
]

// extra links surfaced only inside the mobile menu, grouped under a parent
const SUBMENUS = {
  Inspiration: [
    { label: 'Stylefinder', to: '/stylefinder' },
    { label: 'Materialien', to: '/inspiration#materialien' },
    { label: 'Vorher / Nachher', to: '/vorher-nachher' },
    { label: 'Projektideen', to: '/inspiration#insp-stilwelten' },
  ],
  'Über uns': [
    { label: 'Team', to: '/team' },
    { label: 'Karriere', to: '/karriere' },
  ],
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="container header__inner">
        <Link className="brand" to="/" aria-label="VIDEKO Küchen — Startseite" onClick={close}>
          <img className="brand__logo" src={logoMain} alt="VIDEKO" />
          <span className="brand__text">
            <span className="brand__name">VIDEKO</span>
            <span className="brand__sub">Küchen</span>
          </span>
        </Link>

        <nav className="nav" aria-label="Hauptnavigation">
          {MAIN.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          <Link className="pill pill--cta" to="/beratung">
            <MapPin size={15} strokeWidth={1.8} />
            Beratung anfragen
          </Link>
          <button className="burger" aria-label={open ? 'Menü schließen' : 'Menü öffnen'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-menu">
          <Link className="pill pill--cta mm-cta" to="/beratung" onClick={close}>
            <MapPin size={15} strokeWidth={1.8} /> Beratung anfragen
          </Link>
          {MAIN.map((l) => (
            <div className="mm-group" key={l.to}>
              <NavLink to={l.to} end={l.to === '/'} className="mm-link" onClick={close}>{l.label}</NavLink>
              {SUBMENUS[l.label] && (
                <div className="mm-sub">
                  {SUBMENUS[l.label].map((s) => (
                    <Link key={s.to} to={s.to} className="mm-sublink" onClick={close}>{s.label}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  )
}
