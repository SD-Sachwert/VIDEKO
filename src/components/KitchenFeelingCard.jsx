import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Hand, Flame, Waves, Gem, Home } from 'lucide-react'

import warmImg from '../assets/images/studio/feeling/warm.png'
import ruhigImg from '../assets/images/studio/feeling/ruhig.png'
import elegantImg from '../assets/images/studio/feeling/elegant.png'
import alltagImg from '../assets/images/studio/feeling/alltag.png'

const FEELINGS = [
  {
    key: 'Warm', icon: Flame, img: warmImg, h: 'Warm wohnen.',
    bullets: ['Natürliche Materialien schaffen Geborgenheit.', 'Indirektes Licht bringt Ruhe und Tiefe.'],
    mats: [
      { t: 'Eiche natur', c: '#c9a574' }, { t: 'Travertin beige', c: '#dcc9a8' },
      { t: 'Bronze gebürstet', c: '#a87b48' }, { t: 'Leinen natur', c: '#e6ddc9' },
    ],
    spots: [{ x: 30, y: 34, t: 'Indirektes Licht' }, { x: 64, y: 56, t: 'Warme Hölzer' }, { x: 47, y: 78, t: 'Geborgenheit' }],
  },
  {
    key: 'Ruhig', icon: Waves, img: ruhigImg, h: 'Ruhig geplant.',
    bullets: ['Klare Linien geben dem Raum Gelassenheit.', 'Helle Materialien lassen alles leicht wirken.'],
    mats: [
      { t: 'Eiche hell', c: '#dcc7a0' }, { t: 'Kalkstein sand', c: '#e3d8c0' },
      { t: 'Champagner matt', c: '#d8c9a8' }, { t: 'Textil beige', c: '#e8e0d0' },
    ],
    spots: [{ x: 36, y: 40, t: 'Klare Linien' }, { x: 70, y: 50, t: 'Helle Flächen' }, { x: 52, y: 74, t: 'Leichtigkeit' }],
  },
  {
    key: 'Elegant', icon: Gem, img: elegantImg, h: 'Elegant auftreten.',
    bullets: ['Dunkle Materialien wirken souverän und hochwertig.', 'Lichtakzente bringen Tiefe und Charakter.'],
    mats: [
      { t: 'Räuchereiche dunkel', c: '#4a3a2c' }, { t: 'Marmor graphit', c: '#3a3a3c' },
      { t: 'Bronze smoked', c: '#6e5a3e' }, { t: 'Stoff taupe', c: '#8a7d6c' },
    ],
    spots: [{ x: 32, y: 36, t: 'Lichtakzente' }, { x: 66, y: 52, t: 'Dunkler Stein' }, { x: 48, y: 76, t: 'Charakter' }],
  },
  {
    key: 'Alltag', icon: Home, img: alltagImg, h: 'Alltag, aber schön.',
    bullets: ['Familienfreundlich, offen und einladend.', 'Viel Platz, Stauraum und angenehme Helligkeit.'],
    mats: [
      { t: 'Lack softweiß', c: '#f2efe8' }, { t: 'Eiche natur', c: '#c9a574' },
      { t: 'Quarz hell', c: '#e6e2d8' }, { t: 'Leinen sand', c: '#ddd2bb' },
    ],
    spots: [{ x: 34, y: 42, t: 'Viel Stauraum' }, { x: 68, y: 54, t: 'Offen & hell' }, { x: 50, y: 78, t: 'Familienalltag' }],
  },
]

export default function KitchenFeelingCard() {
  const [active, setActive] = useState(0)
  const [spot, setSpot] = useState(null)
  const [light, setLight] = useState(0) // 0 = Tag, 50 = Abend, 100 = Mood
  const f = FEELINGS[active]
  const LIGHT_STOPS = ['Morgen', 'Tag', 'Abend', 'Dimmer', 'Nacht']
  const lightLine = light < 20
    ? 'Frischer Morgen. Klar und wach.'
    : light < 40
      ? 'Natürlich hell. Klar und offen.'
      : light < 60
        ? 'Warm, ruhig und wohnlich.'
        : light < 80
          ? 'Gedimmt und gemütlich.'
          : 'Feierabendmodus. Tief und ruhig.'

  return (
    <div className="kfeel">
      <div className="kfeel__card">
        <div className="kfeel__head">
          <span className="kfeel__title">Wähle dein Küchengefühl</span>
          <div className="kfeel__tabs" role="tablist">
            {FEELINGS.map((x, i) => (
              <button key={x.key} type="button" role="tab" aria-selected={i === active}
                className={`kfeel__tab ${i === active ? 'is-active' : ''}`} onClick={() => { setActive(i); setSpot(null) }}>
                <x.icon size={14} strokeWidth={1.9} /> {x.key}
              </button>
            ))}
          </div>
        </div>

        <div className="kfeel__stage" style={{ '--lv': light / 100 }}>
          <AnimatePresence mode="wait">
            <motion.img key={f.img} src={f.img} alt={f.h} className="kfeel__img"
              initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} loading="lazy" />
          </AnimatePresence>
          <span className="kfeel__lightveil" aria-hidden="true" />
          {f.spots.map((sp, i) => (
            <button key={i} type="button" className={`kfeel__spot ${spot === i ? 'is-open' : ''}`} style={{ left: `${sp.x}%`, top: `${sp.y}%` }}
              onMouseEnter={() => setSpot(i)} onMouseLeave={() => setSpot(null)} onClick={() => setSpot(spot === i ? null : i)} aria-label={sp.t}>
              <span className="kfeel__spotdot" />
              <span className="kfeel__tip">{sp.t}</span>
            </button>
          ))}
        </div>

        <div className="kfeel__light">
          <div className="kfeel__lighttop">
            <span className="kfeel__lightlabel">Lichtstimmung</span>
            <span className="kfeel__lightline">{lightLine}</span>
          </div>
          <div className="kfeel__lightslider">
            <span className="kfeel__lighttrackticks" aria-hidden="true">
              {LIGHT_STOPS.map((s) => <i key={s} />)}
            </span>
            <input className="kfeel__range" type="range" min="0" max="100" value={light}
              onChange={(e) => setLight(Number(e.target.value))} aria-label="Lichtstimmung"
              style={{ '--p': `${light}%` }} />
          </div>
          <div className="kfeel__lightscale">
            {LIGHT_STOPS.map((s, i) => {
              const center = i * 25
              const on = Math.abs(light - center) <= 12.5
              return <span key={s} className={`kfeel__lighttick ${on ? 'is-on' : ''}`}>{s}</span>
            })}
          </div>
        </div>

        <div className="kfeel__body">
          <AnimatePresence mode="wait">
            <motion.div key={f.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <span className="kfeel__h">{f.h}</span>
              <ul className="kfeel__bullets">
                {f.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </motion.div>
          </AnimatePresence>

          <div className="kfeel__foot">
            <div className="kfeel__mats">
              {f.mats.map((m) => (
                <span key={m.t} className="kfeel__mat">
                  <span className="kfeel__swatch" style={{ background: m.c }} aria-hidden="true" />
                  <span className="kfeel__matlabel">{m.t}</span>
                </span>
              ))}
            </div>
            <a className="kfeel__details" href="/stylefinder">Mein Küchengefühl finden <ArrowRight size={14} strokeWidth={2} /></a>
          </div>
        </div>
      </div>

      <p className="kfeel__hint"><Hand size={15} strokeWidth={1.9} /> Tippe oder klicke dich durch Licht, Materialien und Atmosphäre.</p>
    </div>
  )
}
