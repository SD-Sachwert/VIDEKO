import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useLenis } from 'lenis/react'

import AmbientBackground from './AmbientBackground.jsx'
import Header from './Header.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  const { pathname, hash } = useLocation()
  const lenis = useLenis()

  // reset scroll to top on route change – oder zu einem #anker scrollen, falls vorhanden
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1)
      const t = setTimeout(() => {
        const el = document.getElementById(id)
        if (el) {
          if (lenis) lenis.scrollTo(el, { offset: -80 })
          else el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 320)
      return () => clearTimeout(t)
    }
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
    return undefined
  }, [pathname, hash, lenis])

  return (
    <div className="app" id="top">
      <AmbientBackground />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
