import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Hand } from 'lucide-react'

import warmImg from '../assets/images/studio/feeling/warm.png'
import ruhigImg from '../assets/images/studio/feeling/ruhig.png'
import elegantImg from '../assets/images/studio/feeling/elegant.png'
import alltagImg from '../assets/images/studio/feeling/alltag.png'
import scene1 from '../assets/images/inspiration/03_wohnliche_kueche.png'
import scene2 from '../assets/images/inspiration/07_kueche_mit_insel.png'
import scene3 from '../assets/images/inspiration/08_kleine_kueche_clever_geplant.png'
import scene4 from '../assets/images/inspiration/05_helle_kueche.png'

const FEELINGS = [
  {
    key: 'Warm', img: warmImg, h: 'Warm wohnen.',
    bullets: ['Natürliche Materialien schaffen Geborgenheit.', 'Indirektes Licht bringt Ruhe und Tiefe.'],
    mats: [
      { t: 'Eiche natur', c: '#c9a574' }, { t: 'Travertin beige', c: '#dcc9a8' },
      { t: 'Bronze gebürstet', c: '#a87b48' }, { t: 'Leinen natur', c: '#e6ddc9' },
    ],
    spots: [{ x: 30, y: 34, t: 'Indirektes Licht' }, { x: 64, y: 56, t: 'Warme Hölzer' }, { x: 47, y: 78, t: 'Geborgenheit' }],
  },
  {
    key: 'Ruhig', img: ruhigImg, h: 'Ruhig geplant.',
    bullets: ['Klare Linien geben dem Raum Gelassenheit.', 'Helle Materialien lassen alles leicht wirken.'],
    mats: [
      { t: 'Eiche hell', c: '#dcc7a0' }, { t: 'Kalkstein sand', c: '#e3d8c0' },
      { t: 'Champagner matt', c: '#d8c9a8' }, { t: 'Textil beige', c: '#e8e0d0' },
    ],
    spots: [{ x: 36, y: 40, t: 'Klare Linien' }, { x: 70, y: 50, t: 'Helle Flächen' }, { x: 52, y: 74, t: 'Leichtigkeit' }],
  },
  {
    key: 'Elegant', img: elegantImg, h: 'Elegant auftreten.',
    bullets: ['Dunkle Materialien wirken souverän und hochwertig.', 'Lichtakzente bringen Tiefe und Charakter.'],
    mats: [
      { t: 'Räuchereiche dunkel', c: '#4a3a2c' }, { t: 'Marmor graphit', c: '#3a3a3c' },
      { t: 'Bronze smoked', c: '#6e5a3e' }, { t: 'Stoff taupe', c: '#8a7d6c' },
    ],
    spots: [{ x: 32, y: 36, t: 'Lichtakzente' }, { x: 66, y: 52, t: 'Dunkler Stein' }, { x: 48, y: 76, t: 'Charakter' }],
  },
  {
    key: 'Alltag', img: alltagImg, h: 'Alltag, aber schön.',
    bullets: ['Familienfreundlich, offen und einladend.', 'Viel Platz, Stauraum und angenehme Helligkeit.'],
    mats: [
      { t: 'Lack softweiß', c: '#f2efe8' }, { t: 'Eiche natur', c: '#c9a574' },
      { t: 'Quarz hell', c: '#e6e2d8' }, { t: 'Leinen sand', c: '#ddd2bb' },
    ],
    spots: [{ x: 34, y: 42, t: 'Viel Stauraum' }, { x: 68, y: 54, t: 'Offen & hell' }, { x: 50, y: 78, t: 'Familienalltag' }],
  },
]

// Zusätzliche Alltags-/Humor-Szenen (zweite Reihe unter den Tabs) – steuern primär den Bildwechsel.
// Hinweis: echte Szenenbilder werden später ausgetauscht; aktuell hochwertige Küchenfotos als Platzhalter.
const SCENES = [
  { key: 'Hausaufgaben-Chaos', img: scene1, h: 'Hausaufgaben-Chaos.', bullets: ['Die Insel wird zum Schreibtisch – und das darf sie.', 'Platz für Bücher, Brote und Mathe gleichzeitig.'] },
  { key: 'Einkauf eskaliert', img: scene2, h: 'Einkauf eskaliert.', bullets: ['Acht Tüten, eine Ablage – gut, wenn sie da ist.', 'Kurze Wege von der Tür zum Kühlschrank.'] },
  { key: 'Mehlwolke', img: scene3, h: 'Mehlwolke.', bullets: ['Backtag heißt: pflegeleichte Oberflächen.', 'Einmal drüberwischen statt Großputz.'] },
  { key: 'Frühstück mit Hund', img: scene4, h: 'Frühstück mit Hund.', bullets: ['Offen, hell und mittendrin im Leben.', 'Ein Platz, an dem alle zusammenkommen.'] },
]

export default function KitchenFeelingCard() {
  const [active, setActive] = useState(0)
  const [spot, setSpot] = useState(null)
  const [light, setLight] = useState(0) // 0 = Tag, 50 = Abend, 100 = Mood
  const [scene, setScene] = useState(null) // null = Stimmung, sonst Index der Alltagsszene
  const f = FEELINGS[active]
  const sc = scene != null ? SCENES[scene] : null
  const viewImg = sc ? sc.img : f.img
  const viewH = sc ? sc.h : f.h
  const viewBullets = sc ? sc.bullets : f.bullets
  const lightLine = light < 34
    ? 'Natürlich hell. Klar und offen.'
    : light < 67
      ? 'Warm, ruhig und wohnlich.'
      : 'Gedimmt. Gemütlich. Feierabendmodus.'

  return (
    <div className="kfeel">
      <div className="kfeel__card">
        <div className="kfeel__head">
          <span className="kfeel__title">Wähle dein Küchengefühl</span>
          <div className="kfeel__tabs" role="tablist">
            {FEELINGS.map((x, i) => (
              <button key={x.key} type="button" role="tab" aria-selected={i === active && scene == null}
                className={`kfeel__tab ${i === active && scene == null ? 'is-active' : ''}`} onClick={() => { setActive(i); setSpot(null); setScene(null) }}>
                {x.key}
              </button>
            ))}
          </div>
          <div className="kfeel__scenes" aria-label="Alltagsszenen">
            {SCENES.map((s, i) => (
              <button key={s.key} type="button" aria-pressed={scene === i}
                className={`kfeel__scene ${scene === i ? 'is-active' : ''}`}
                onClick={() => { setScene(scene === i ? null : i); setSpot(null) }}>
                <span className="kfeel__scenethumb" style={{ backgroundImage: `url(${s.img})` }} aria-hidden="true" />
                <span className="kfeel__scenelabel">{s.key}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="kfeel__stage" style={{ '--lv': light / 100 }}>
          <AnimatePresence mode="wait">
            <motion.img key={viewImg} src={viewImg} alt={viewH} className="kfeel__img"
              initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} loading="lazy" />
          </AnimatePresence>
          <span className="kfeel__lightveil" aria-hidden="true" />
          {(sc ? [] : f.spots).map((sp, i) => (
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
          <input className="kfeel__range" type="range" min="0" max="100" value={light}
            onChange={(e) => setLight(Number(e.target.value))} aria-label="Lichtstimmung"
            style={{ '--p': `${light}%` }} />
          <div className="kfeel__lightscale"><span>Tag</span><span>Abend</span><span>Mood</span></div>
        </div>

        <div className="kfeel__body">
          <AnimatePresence mode="wait">
            <motion.div key={sc ? sc.key : f.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <span className="kfeel__h">{viewH}</span>
              <ul className="kfeel__bullets">
                {viewBullets.map((b) => <li key={b}>{b}</li>)}
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
