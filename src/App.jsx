import { Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Stylefinder from './pages/Stylefinder.jsx'
import Materialien from './pages/Materialien.jsx'
import Showroom from './pages/Showroom.jsx'
import Planung from './pages/Planung.jsx'
import UeberVideko from './pages/UeberVideko.jsx'
import Team from './pages/Team.jsx'
import Karriere from './pages/Karriere.jsx'
import Beratung from './pages/Beratung.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/stylefinder" element={<Stylefinder />} />
        <Route path="/kuechenwelten" element={<Navigate to="/stylefinder" replace />} />
        <Route path="/materialien" element={<Materialien />} />
        <Route path="/showroom" element={<Showroom />} />
        <Route path="/planung" element={<Planung />} />
        <Route path="/ueber-videko" element={<UeberVideko />} />
        <Route path="/team" element={<Team />} />
        <Route path="/karriere" element={<Karriere />} />
        <Route path="/beratung" element={<Beratung />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
