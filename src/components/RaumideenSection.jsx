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
    cards: [
      { t: 'Clevere Details.', d: 'Durchdachter Stauraum für mehr Leichtigkeit.', pos: '50% 42%', plus: 'Auszüge, Innenorganisation und kurze Wege machen die Küche alltagstauglich.' },
      { t: 'Offen verbunden.', d: 'Kochen, Essen, Wohnen – ein Raumgefühl.', pos: '30% 60%', plus: 'Die Küche wird nicht getrennt geplant, sondern als Teil des gesamten Wohnraums.' },
    ],
  },
  {
    key: 'Essen', icon: Utensils, img: essen, title: 'Essen mit Atmosphäre.',
    text: 'Gemeinsam genießen – Essbereiche, die verbinden und einladen.',
    features: ['Sitzplatz', 'Beleuchtung', 'Geselligkeit', 'Nähe zur Küche'],
    cards: [
      { t: 'Großzügig tafeln.', d: 'Langer Tisch, viele Gäste – perfekt für besondere Abende.', pos: '50% 45%', plus: 'Essbereiche brauchen Raum, Licht und die richtige Verbindung zur Küche.' },
      { t: 'Gemütlich genießen.', d: 'Der Lieblingsplatz für Frühstück und Familie.', pos: '40% 55%', plus: 'Auch kleine Essplätze können hochwertig, bequem und alltagstauglich geplant werden.' },
    ],
  },
  {
    key: 'Wohnen', icon: Sofa, img: wohnen, title: 'Wohnen mit Wärme.',
    text: 'Kochen, leben, ankommen – Wohnbereiche, die offen und ruhig wirken.',
    features: ['Offenheit', 'Materialien', 'Komfort', 'Übergänge'],
    cards: [
      { t: 'Offen verbunden.', d: 'Fließende Übergänge für ein großzügiges Wohngefühl.', pos: '50% 50%', plus: 'Materialien und Linien verbinden Küche und Wohnen zu einem ruhigen Gesamtbild.' },
      { t: 'Ruhige Harmonie.', d: 'Natürliche Materialien für Wärme und Beständigkeit.', pos: '35% 45%', plus: 'Wiederkehrende Oberflächen schaffen Ordnung und optische Ruhe.' },
    ],
  },
  {
    key: 'Homeoffice', icon: Laptop, img: homeoffice, title: 'Homeoffice mit Struktur.',
    text: 'Arbeiten zu Hause – Lösungen, die organisiert, ruhig und wohnlich bleiben.',
    features: ['Arbeitsfläche', 'Stauraum', 'Licht', 'Rückzugsort'],
    cards: [
      { t: 'Stauraum, der mitdenkt.', d: 'Alles griffbereit, alles perfekt verstaut.', pos: '50% 45%', plus: 'Ordner, Technik und Kabel verschwinden sauber in geplanten Stauraumlösungen.' },
      { t: 'Ruhige Nische.', d: 'Fokus finden in einem Raum, der beruhigt.', pos: '40% 55%', plus: 'Ein Arbeitsplatz darf funktional sein, ohne nach Büro auszusehen.' },
    ],
  },
  {
    key: 'Hauswirtschaft', icon: WashingMachine, img: hauswirtschaft, title: 'Hauswirtschaft mit System.',
    text: 'Waschen, lagern, ordnen – Räume, die den Alltag einfacher machen.',
    features: ['Stauraum', 'Arbeitsfläche', 'Geräteintegration', 'Ordnung'],
    cards: [
      { t: 'Clever verborgen.', d: 'Versteckter Stauraum für alles, was nicht im Blick sein muss.', pos: '50% 50%', plus: 'Reinigung, Vorräte und Wäsche verschwinden sauber hinter durchdachten Fronten.' },
      { t: 'Wäsche & Vorrat.', d: 'Alles griffbereit, alles an seinem Platz.', pos: '40% 50%', plus: 'HWR-Räume werden erst stark, wenn Abläufe wirklich mitgedacht sind.' },
    ],
  },
  {
    key: 'Garderobe', icon: DoorOpen, img: garderobe, title: 'Ankommen mit Ordnung.',
    text: 'Garderoben, die aufräumen, entlasten und direkt gut aussehen.',
    features: ['Stauraum', 'Sitzbank', 'Schuhe', 'Beleuchtung'],
    cards: [
      { t: 'Sitzbank mit Stauraum.', d: 'Platz für alles, was mit euch reinkommt.', pos: '50% 45%', plus: 'Schuhe, Taschen und Jacken bekommen feste Plätze – ohne Flur-Chaos.' },
      { t: 'Einladend. Aufgeräumt.', d: 'Ein Eingangsbereich, der Ordnung schafft.', pos: '40% 60%', plus: 'Die Garderobe ist der erste Eindruck des Hauses. Sie darf also ruhig gut aussehen.' },
    ],
  },
  {
    key: 'Schlafen', icon: BedDouble, img: schlafen, title: 'Schlafen mit System.',
    text: 'Aus Küchenmöbeln werden Schränke – clevere Schlafzimmer mit Ruhe und Stauraum.',
    features: ['Kleiderschrank', 'Ruhe', 'Stauraum', 'Licht'],
    cards: [
      { t: 'Maßarbeit für dich.', d: 'Schränke, die zu deinem Raum und deinem Leben passen.', pos: '50% 45%', plus: 'Kleiderschränke können mit derselben Präzision geplant werden wie Küchen.' },
      { t: 'Ruhe, die bleibt.', d: 'Durchdachte Lösungen für erholsamen Schlaf.', pos: '40% 50%', plus: 'Weniger sichtbares Chaos, mehr ruhige Flächen und stimmiges Licht.' },
    ],
  },
]

const EASE = [0.16, 1, 0.3, 1]

export default function RaumideenSection() {
  const [active, setActive] = useState(0)
  const [openCard, setOpenCard] = useState(null) // welche Detailkarte ist im Drawer offen
  const r = ROOMS[active]
  const select = (i) => { setActive(i); setOpenCard(null) }
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

        <div className="rms__grid">
          {/* großes Hauptbild links – weicher Crossfade */}
          <div className="rms__media">
            <AnimatePresence initial={false}>
              <motion.img key={r.img} src={r.img} alt={r.title} className="rms__img" loading="lazy" draggable={false}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }} />
            </AnimatePresence>
            <div className="rms__nav">
              <button type="button" className="rms__arrow" onClick={() => go(-1)} aria-label="Vorheriger Bereich"><ArrowLeft size={16} strokeWidth={2} /></button>
              <button type="button" className="rms__arrow" onClick={() => go(1)} aria-label="Nächster Bereich"><ArrowRight size={16} strokeWidth={2} /></button>
              <span className="rms__count">{num(active)} <span>/ {num(ROOMS.length - 1)}</span></span>
            </div>
          </div>

          {/* helle Content-Karte rechts – fester Aufbau: Text, CTA, Detailkarten, Drawer */}
          <div className="rms__card">
            <AnimatePresence mode="wait">
              <motion.div key={r.key} className="rms__cardcontent"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.38, ease: EASE }}>
                <h3 className="rms__cardtitle">{r.title}</h3>
                <p className="rms__cardtext">{r.text}</p>
                <ul className="rms__features">
                  {r.features.map((f) => <li key={f}><span className="rms__fic"><Check size={13} strokeWidth={3} /></span>{f}</li>)}
                </ul>
              </motion.div>
            </AnimatePresence>

            <Link to="/beratung" className="rms__cta">Ideen entdecken <ArrowRight size={16} strokeWidth={2} /></Link>

            <div className="rms__details">
              {r.cards.map((cd, ci) => {
                const isOpen = openCard === ci
                return (
                  <button key={cd.t} type="button" className={`rms__dcard ${isOpen ? 'is-active' : ''}`}
                    aria-expanded={isOpen} onClick={() => setOpenCard(isOpen ? null : ci)}>
                    <span className="rms__dthumb" style={{ backgroundImage: `url(${r.img})`, backgroundPosition: cd.pos }} aria-hidden="true" />
                    <span className="rms__dbody">
                      <span className="rms__dt">{cd.t}</span>
                      <span className="rms__dd">{cd.d}</span>
                    </span>
                    <span className="rms__dplus">{isOpen ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={2.6} />}</span>
                  </button>
                )
              })}
            </div>

            <AnimatePresence initial={false}>
              {openCard != null && (
                <motion.div key={`${r.key}-${openCard}`} className="rms__drawer"
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: EASE }}>
                  <span className="rms__drawer-in">
                    <b>{r.cards[openCard].t}</b> {r.cards[openCard].plus}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
