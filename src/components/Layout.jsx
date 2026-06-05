import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useLenis } from 'lenis/react'

import AmbientBackground from './AmbientBackground.jsx'
import Header from './Header.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const lenis = useLenis()

  // reset scroll to top on route change
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname, lenis])

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
