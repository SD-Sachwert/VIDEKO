import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'

/**
 * Route-Level Code-Splitting (Performance 1.1).
 *
 * Vorher lag jede Seite im Startbundle: 1051 kB roh / 305 kB gzip, davon
 * 40,7 % ungenutzt (Lighthouse `unused-javascript`, 14.08.2026). Wer die
 * Startseite aufrief, lud damit auch Shop, Produktdetail, Experience,
 * Stylefinder, Karriere und saemtliche Rechtstexte mit.
 *
 * `Home` bleibt bewusst statisch importiert. Der Auslagerungsversuch wurde
 * gemessen (14.08.2026, mobil): Das Startbundle sank zwar von 186 auf 133 kB
 * gzip, doch der Bundler zerlegte den bis dahin gemeinsam genutzten Code in
 * ~30 zusaetzliche Kleinstdateien (einzelne Lucide-Icons, <1 kB). Auf `/`
 * stiegen die Requests von 19 auf 50, das Gesamtgewicht sogar von 604 auf
 * 618 kB, der LCP von 4753 auf 5206 ms. Journal gewann dabei nur 146 ms.
 * Alle uebrigen Seiten kommen als eigener Chunk nach.
 */
const Studio = lazy(() => import('./pages/Studio.jsx'))
const Leistungen = lazy(() => import('./pages/Leistungen.jsx'))
const Inspiration = lazy(() => import('./pages/Inspiration.jsx'))
const VorherNachher = lazy(() => import('./pages/VorherNachher.jsx'))
const Karriere = lazy(() => import('./pages/Karriere.jsx'))
const UeberUns = lazy(() => import('./pages/UeberUns.jsx'))
const Beratung = lazy(() => import('./pages/Beratung.jsx'))
const Merch = lazy(() => import('./pages/Merch.jsx'))
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'))
const VormerkungBestaetigen = lazy(() => import('./pages/VormerkungBestaetigen.jsx'))
const Journal = lazy(() => import('./pages/Journal.jsx'))
const JournalArticle = lazy(() => import('./pages/JournalArticle.jsx'))
const Impressum = lazy(() => import('./pages/Impressum.jsx'))
const Datenschutz = lazy(() => import('./pages/Datenschutz.jsx'))
const VersandLieferung = lazy(() => import('./pages/VersandLieferung.jsx'))
const RueckgabeWiderruf = lazy(() => import('./pages/RueckgabeWiderruf.jsx'))
const AGB = lazy(() => import('./pages/AGB.jsx'))
const Experience = lazy(() => import('./pages/Experience.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
const AllesAusEinerHand = lazy(() => import('./pages/AllesAusEinerHand.jsx'))

// kept (reachable via the homepage teasers/cards)
const Stylefinder = lazy(() => import('./pages/Stylefinder.jsx'))
const Planung = lazy(() => import('./pages/Planung.jsx'))
const KuechenNachMass = lazy(() => import('./pages/KuechenNachMass.jsx'))
const Arbeitsplatten = lazy(() => import('./pages/Arbeitsplatten.jsx'))
const KuechenmontageWuerzburg = lazy(() => import('./pages/KuechenmontageWuerzburg.jsx'))
const Team = lazy(() => import('./pages/Team.jsx'))
// Ziel der gedruckten QR-Codes — wie jede andere Unterseite nachgeladen.
const Entdecken = lazy(() => import('./pages/Entdecken.jsx'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        {/* main navigation */}
        <Route path="/studio" element={<Studio />} />
        <Route path="/leistungen" element={<Leistungen />} />
        <Route path="/alles-aus-einer-hand" element={<AllesAusEinerHand />} />
        <Route path="/kuechen-nach-mass" element={<KuechenNachMass />} />
        <Route path="/arbeitsplatten" element={<Arbeitsplatten />} />
        <Route path="/kuechenmontage-wuerzburg" element={<KuechenmontageWuerzburg />} />
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

        {/* Landeseite der Offline-QR-Codes */}
        <Route path="/entdecken" element={<Entdecken />} />

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
        <Route path="/planung" element={<Planung />} />
        <Route path="/team" element={<Team />} />

        {/* redirects for renamed / old routes */}
        <Route path="/materialien" element={<Navigate to="/inspiration" replace />} />
        <Route path="/kontakt" element={<Navigate to="/beratung" replace />} />
        <Route path="/ueber-videko" element={<Navigate to="/ueber-uns" replace />} />
        <Route path="/kuechenwelten" element={<Navigate to="/stylefinder" replace />} />
        {/* /showroom und /studio bedienten dieselbe Suchintention; der
            Standortteil steht seit SEO-Phase 2 auf /studio. Vercel liefert
            dafuer bereits einen 308 aus, dieser Fall greift nur bei der
            Navigation innerhalb der laufenden SPA. */}
        <Route path="/showroom" element={<Navigate to="/studio" replace />} />

        {/* Unbekannte Pfade zeigen eine echte 404-Seite statt heimlich die
            Startseite — Vercel liefert dafuer dist/404.html mit HTTP 404 aus. */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
