import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, MapPin, ChevronDown, ShoppingBag } from 'lucide-react'
import logoMain from '../assets/brand/logo-main-v2.png'
import { useCart } from '../shop/cart-context.js'
import { inquiryReady } from '../data/release.js'

const MAIN = [
  { label: 'Studio', to: '/studio' },
  { label: 'Inspiration', to: '/inspiration', menu: 'insp' },
  { label: 'Leistungen', to: '/leistungen' },
  { label: 'Über uns', to: '/ueber-uns', menu: 'about' },
  { label: 'Journal', to: '/journal' },
  { label: 'Merch', to: '/merch' },
]

const DROPDOWN = {
  insp: [
    { label: 'Inspiration Übersicht', to: '/inspiration' },
    { label: 'Stylefinder', to: '/stylefinder' },
    { label: 'Vorher / Nachher', to: '/vorher-nachher' },
  ],
  about: [
    { label: 'Über uns', to: '/ueber-uns' },
    { label: 'Karriere', to: '/karriere' },
  ],
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const close = () => { setOpen(false); setOpenMenu(null) }
  const { inquiryCount, openAnfrage } = useCart()

  // Seiten ohne dunklen Hero: Header dauerhaft im hellen "solid"-Zustand,
  // damit die Navigation auch ganz oben lesbar bleibt.
  const { pathname } = useLocation()
  // Seiten, die direkt mit hellem Inhalt beginnen: Der Header braucht dort von
  // Anfang an seinen festen Hintergrund, sonst steht helle Navigation auf Creme.
  const HELLE_SEITEN = [
    '/impressum', '/datenschutz', '/agb', '/versand-lieferung', '/rueckgabe-widerruf',
  ]
  const solidRoute = HELLE_SEITEN.includes(pathname)

  // Anfrageliste-Icon: nur wenn die unverbindliche Anfrage freigegeben ist
  // (RELEASE_STAGE ≥ 'inquiry'). Auf der Live-Domain (Stufe 'preview') bleibt es
  // ausgeblendet – es ist KEIN Warenkorb/Checkout, sondern öffnet die rein lokale
  // Anfrageliste für die unverbindliche E-Mail-Sammelanfrage.
  const zeigeAnfrage = inquiryReady

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close desktop dropdown on outside click / Escape
  useEffect(() => {
    if (!openMenu) return
    const onDoc = (e) => { if (!e.target.closest('.nav__group')) setOpenMenu(null) }
    const onKey = (e) => { if (e.key === 'Escape') setOpenMenu(null) }
    document.addEventListener('click', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey) }
  }, [openMenu])

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
    <header className={`header ${scrolled || solidRoute ? 'header--scrolled' : ''}`}>
      <div className="container header__inner">
        <Link className="brand" to="/" aria-label="VIDEKO Küchen — Startseite" onClick={close}>
          <img className="brand__logo" src={logoMain} alt="VIDEKO Küchen" />
        </Link>

        <nav className="nav" aria-label="Hauptnavigation">
          {MAIN.map((l) => (
            l.menu ? (
              <div
                className="nav__group"
                key={l.to}
                onMouseEnter={() => setOpenMenu(l.menu)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <NavLink
                  to={l.to}
                  className={({ isActive }) => `nav__top ${isActive ? 'is-active' : ''}`}
                  aria-expanded={openMenu === l.menu}
                  onClick={() => setOpenMenu(null)}
                >
                  {l.label} <ChevronDown className="nav__caret" size={14} strokeWidth={2} />
                </NavLink>
                <div className={`nav__dd ${openMenu === l.menu ? 'is-open' : ''}`}>
                  <div className="nav__dd-inner">
                    {DROPDOWN[l.menu].map((d) => (
                      <NavLink key={d.to} to={d.to} end className={({ isActive }) => (isActive ? 'is-active' : undefined)} onClick={() => setOpenMenu(null)}>{d.label}</NavLink>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>{l.label}</NavLink>
            )
          ))}
        </nav>

        <div className="header__actions">
          {zeigeAnfrage && (
            <button
              type="button"
              className="header__anfrage"
              onClick={openAnfrage}
              aria-label={`Dein Warenkorb${inquiryCount ? ` (${inquiryCount})` : ''}`}
            >
              <ShoppingBag size={19} strokeWidth={1.8} />
              {inquiryCount > 0 && <span className="header__anfragecount">{inquiryCount}</span>}
            </button>
          )}
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
              <NavLink to={l.to} end className="mm-link" onClick={close}>{l.label}</NavLink>
              {l.menu && (
                <div className="mm-sub">
                  {DROPDOWN[l.menu].map((d) => (
                    <Link key={d.to} to={d.to} className="mm-sublink" onClick={close}>{d.label}</Link>
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
