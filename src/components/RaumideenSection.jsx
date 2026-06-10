import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChefHat, Utensils, Sofa, Laptop, WashingMachine, DoorOpen, BedDouble, Check, Plus, ArrowLeft, ArrowRight } from 'lucide-react'

import Reveal from './Reveal.jsx'
import kochen from '../assets/images/raumideen/kochen.png'
import essen from '../assets/images/raumideen/essen.png'
import wohnen from '../assets/images/raumideen/wohnen.png'
import homeoffice from '../assets/images/raumideen/homeoffice.png'
import hauswirtschaft from '../assets/images/raumideen/hauswirtschaft.png'
import garderobe from '../assets/images/raumideen/garderobe.png'
import schlafen from '../assets/images/raumideen/schlafen.png'

const ROOMS = [
  {
    key: 'Kochen', icon: ChefHat, img: kochen, title: 'Kochen mit Stil.',
    text: 'Funktion trifft Emotion – Küchen, die mehr können und schöner sind.',
    features: ['Licht & Atmosphäre', 'Stauraum', 'Sitzplatz', 'Offenes Wohnen'],
    cards: [{ t: 'Offenes Wohnen', d: 'Küche und Raum fließen ineinander.', pos: '50% 40%' }, { t: 'Direkt verbunden', d: 'Kurze Wege, klare Abläufe.', pos: '30% 60%' }],
  },
  {
    key: 'Essen', icon: Utensils, img: essen, title: 'Essen mit Atmosphäre.',
    text: 'Gemeinsam genießen – Essbereiche, die verbinden und einladen.',
    features: ['Sitzplatz', 'Beleuchtung', 'Geselligkeit', 'Nähe zur Küche'],
    cards: [{ t: 'Gute Runde', d: 'Platz für alle, die dazugehören.', pos: '50% 45%' }, { t: 'Warmes Licht', d: 'Stimmung, die zum Bleiben einlädt.', pos: '40% 55%' }],
  },
  {
    key: 'Wohnen', icon: Sofa, img: wohnen, title: 'Wohnen mit Wärme.',
    text: 'Kochen, leben, ankommen – Wohnbereiche, die offen und ruhig wirken.',
    features: ['Offenheit', 'Materialien', 'Komfort', 'Übergänge'],
    cards: [{ t: 'Weiche Übergänge', d: 'Vom Kochen ins Wohnen, ohne Bruch.', pos: '50% 50%' }, { t: 'Echte Materialien', d: 'Oberflächen, die man spüren will.', pos: '35% 45%' }],
  },
  {
    key: 'Homeoffice', icon: Laptop, img: homeoffice, title: 'Homeoffice mit Struktur.',
    text: 'Arbeiten zu Hause – Lösungen, die organisiert, ruhig und wohnlich bleiben.',
    features: ['Arbeitsfläche', 'Stauraum', 'Licht', 'Rückzugsort'],
    cards: [{ t: 'Klarer Kopf', d: 'Arbeitsfläche, die nicht zumüllt.', pos: '50% 45%' }, { t: 'Rückzugsort', d: 'Feierabend beginnt mit Schranktür zu.', pos: '40% 55%' }],
  },
  {
    key: 'Hauswirtschaft', icon: WashingMachine, img: hauswirtschaft, title: 'Hauswirtschaft mit System.',
    text: 'Waschen, lagern, ordnen – Räume, die den Alltag einfacher machen.',
    features: ['Stauraum', 'Arbeitsfläche', 'Geräteintegration', 'Ordnung'],
    cards: [{ t: 'Alles am Platz', d: 'Ordnung, die von selbst hält.', pos: '50% 50%' }, { t: 'Geräte integriert', d: 'Waschen und Trocknen, sauber verbaut.', pos: '40% 50%' }],
  },
  {
    key: 'Garderobe', icon: DoorOpen, img: garderobe, title: 'Ankommen mit Ordnung.',
    text: 'Garderoben, die aufräumen, entlasten und direkt gut aussehen.',
    features: ['Stauraum', 'Sitzbank', 'Schuhe', 'Beleuchtung'],
    cards: [{ t: 'Erster Eindruck', d: 'Aufgeräumt ankommen, jeden Tag.', pos: '50% 45%' }, { t: 'Sitzbank inklusive', d: 'Schuhe an, ohne Balanceakt.', pos: '40% 60%' }],
  },
  {
    key: 'Schlafen', icon: BedDouble, img: schlafen, title: 'Schlafen mit System.',
    text: 'Aus Küchenmöbeln werden Schränke – clevere Schlafzimmer mit Ruhe und Stauraum.',
    features: ['Kleiderschrank', 'Ruhe', 'Stauraum', 'Licht'],
    cards: [{ t: 'Viel Stauraum', d: 'Kleiderschrank, der wirklich passt.', pos: '50% 45%' }, { t: 'Ruhe pur', d: 'Materialien, die runterfahren lassen.', pos: '40% 50%' }],
  },
]

export default function RaumideenSection() {
  const [active, setActive] = useState(0)
  const [focus, setFocus] = useState(null) // welcher Mini-Teaser ist in den Fokus geholt
  const r = ROOMS[active]
  const select = (i) => { setActive(i); setFocus(null) }
  const go = (dir) => select((active + dir + ROOMS.length) % ROOMS.length)
  const num = (n) => String(n + 1).padStart(2, '0')

  return (
    <section className="section insp-rooms2">
      <div className="container">
        <Reveal className="rms__head">
          <span className="kicker">Raumideen</span>
          <h2 className="rms__title">Mehr als <span className="grad">nur Küche.</span></h2>
          <p className="rms__lead">Wir denken nicht nur Küchen, sondern Wohnräume.<br />Jeder Raum. Dein Stil.</p>
        </Reveal>

        <div className="rms__tabs" role="tablist" aria-label="Wohnbereiche">
          {ROOMS.map((room, i) => (
            <button key={room.key} type="button" role="tab" aria-selected={i === active}
              className={`rms__tab ${i === active ? 'is-active' : ''}`} onClick={() => select(i)}>
              <room.icon size={15} strokeWidth={1.9} /> {room.key}
            </button>
          ))}
        </div>

        <div className="rms__stage">
          <AnimatePresence mode="wait">
            <motion.div key={r.key} className="rms__grid"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
              <div className="rms__media">
                <img src={r.img} alt={r.title} className="rms__img" loading="lazy" draggable={false}
                  style={focus != null ? { transform: 'scale(1.14)', objectPosition: r.cards[focus].pos } : undefined} />
                <div className="rms__nav">
                  <button type="button" className="rms__arrow" onClick={() => go(-1)} aria-label="Vorheriger Bereich"><ArrowLeft size={16} strokeWidth={2} /></button>
                  <button type="button" className="rms__arrow" onClick={() => go(1)} aria-label="Nächster Bereich"><ArrowRight size={16} strokeWidth={2} /></button>
                  <span className="rms__count">{num(active)} <span>/ {num(ROOMS.length - 1)}</span></span>
                </div>
              </div>

              <div className="rms__card">
                <h3 className="rms__cardtitle">{r.title}</h3>
                <p className="rms__cardtext">{r.text}</p>
                <ul className="rms__features">
                  {r.features.map((f) => <li key={f}><span className="rms__fic"><Check size={13} strokeWidth={3} /></span>{f}</li>)}
                </ul>
                <Link to="/beratung" className="rms__cta">Ideen entdecken <ArrowRight size={16} strokeWidth={2} /></Link>
              </div>

              <div className="rms__minis">
                {r.cards.map((cd, ci) => (
                  <div key={cd.t} className={`rms__mini ${focus === ci ? 'is-active' : ''}`}>
                    <span className="rms__minithumb" style={{ backgroundImage: `url(${r.img})`, backgroundPosition: cd.pos }} aria-hidden="true" />
                    <span className="rms__minibody">
                      <span className="rms__minit">{cd.t}</span>
                      <span className="rms__minid">{cd.d}</span>
                    </span>
                    <button type="button" className="rms__miniplus" aria-label={`${cd.t} im Bild zeigen`} aria-pressed={focus === ci}
                      onClick={() => setFocus(focus === ci ? null : ci)}><Plus size={15} strokeWidth={2.4} /></button>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
