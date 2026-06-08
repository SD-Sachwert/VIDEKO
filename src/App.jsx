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
import Journal from './pages/Journal.jsx'
import JournalArticle from './pages/JournalArticle.jsx'
import Impressum from './pages/Impressum.jsx'
import Datenschutz from './pages/Datenschutz.jsx'
import Experience from './pages/Experience.jsx'

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
        <Route path="/inspiration" element={<Inspiration />} />
        <Route path="/vorher-nachher" element={<VorherNachher />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/journal/:slug" element={<JournalArticle />} />
        <Route path="/karriere" element={<Karriere />} />
        <Route path="/ueber-uns" element={<UeberUns />} />
        <Route path="/beratung" element={<Beratung />} />

        {/* immersive 3D experience (opt-in route) */}
        <Route path="/experience" element={<Experience />} />

        {/* legal */}
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />

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

        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
