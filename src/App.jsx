import { Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Studio from './pages/Studio.jsx'
import Leistungen from './pages/Leistungen.jsx'
import Inspiration from './pages/Inspiration.jsx'
import VorherNachher from './pages/VorherNachher.jsx'
import Karriere from './pages/Karriere.jsx'
import UeberUns from './pages/UeberUns.jsx'
import Beratung from './pages/Beratung.jsx'
import Merch from './pages/Merch.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import VormerkungBestaetigen from './pages/VormerkungBestaetigen.jsx'
import Journal from './pages/Journal.jsx'
import JournalArticle from './pages/JournalArticle.jsx'
import Impressum from './pages/Impressum.jsx'
import Datenschutz from './pages/Datenschutz.jsx'
import VersandLieferung from './pages/VersandLieferung.jsx'
import RueckgabeWiderruf from './pages/RueckgabeWiderruf.jsx'
import AGB from './pages/AGB.jsx'
import Experience from './pages/Experience.jsx'
import NotFound from './pages/NotFound.jsx'
import AllesAusEinerHand from './pages/AllesAusEinerHand.jsx'

// kept (reachable via the homepage teasers/cards)
import Stylefinder from './pages/Stylefinder.jsx'
import Showroom from './pages/Showroom.jsx'
import Planung from './pages/Planung.jsx'
import Team from './pages/Team.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        {/* main navigation */}
        <Route path="/studio" element={<Studio />} />
        <Route path="/leistungen" element={<Leistungen />} />
        <Route path="/alles-aus-einer-hand" element={<AllesAusEinerHand />} />
        <Route path="/inspiration" element={<Inspiration />} />
        <Route path="/vorher-nachher" element={<VorherNachher />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/journal/:slug" element={<JournalArticle />} />
        <Route path="/karriere" element={<Karriere />} />
        <Route path="/ueber-uns" element={<UeberUns />} />
        <Route path="/beratung" element={<Beratung />} />
        <Route path="/merch" element={<Merch />} />
        <Route path="/merch/:slug" element={<ProductDetail />} />
        <Route path="/vormerkung-bestaetigen" element={<VormerkungBestaetigen />} />

        {/* immersive 3D experience (opt-in route) */}
        <Route path="/experience" element={<Experience />} />

        {/* legal */}
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/versand-lieferung" element={<VersandLieferung />} />
        <Route path="/rueckgabe-widerruf" element={<RueckgabeWiderruf />} />
        <Route path="/agb" element={<AGB />} />

        {/* kept feature pages (linked from homepage) */}
        <Route path="/stylefinder" element={<Stylefinder />} />
        <Route path="/showroom" element={<Showroom />} />
        <Route path="/planung" element={<Planung />} />
        <Route path="/team" element={<Team />} />

        {/* redirects for renamed / old routes */}
        <Route path="/materialien" element={<Navigate to="/inspiration" replace />} />
        <Route path="/kontakt" element={<Navigate to="/beratung" replace />} />
        <Route path="/ueber-videko" element={<Navigate to="/ueber-uns" replace />} />
        <Route path="/kuechenwelten" element={<Navigate to="/stylefinder" replace />} />

        {/* Unbekannte Pfade zeigen eine echte 404-Seite statt heimlich die
            Startseite — Vercel liefert dafuer dist/404.html mit HTTP 404 aus. */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
