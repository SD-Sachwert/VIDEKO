import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ReactLenis } from 'lenis/react'
import App from './App.jsx'
import './styles.css'

/**
 * Seit dem Body-Prerendering (scripts/prerender.mjs) liefert der Server bereits
 * fertiges Markup in `#root`. `createRoot(...).render()` wuerde das komplett
 * wegwerfen und neu aufbauen — sichtbares Flackern und ein verschenkter
 * First Paint. `hydrateRoot` uebernimmt stattdessen die vorhandenen Knoten und
 * haengt nur noch die Interaktivitaet daran.
 *
 * Fuer den Fall, dass eine Route ohne Prerender ausgeliefert wird (heute nur
 * /experience, siehe OHNE_KOERPER in scripts/prerender.mjs), bleibt der alte
 * Weg erhalten: ein leerer `#root` wird ganz normal frisch gerendert.
 */
const wurzel = document.getElementById('root')

const baum = (
  <React.StrictMode>
    <ReactLenis
      root
      options={{ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ReactLenis>
  </React.StrictMode>
)

if (wurzel.hasChildNodes()) {
  ReactDOM.hydrateRoot(wurzel, baum)
} else {
  ReactDOM.createRoot(wurzel).render(baum)
}
