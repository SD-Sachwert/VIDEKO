import { useState } from 'react'
import { Play, RotateCcw, ArrowRight, Check, AlertTriangle, LayoutGrid } from 'lucide-react'

import Reveal from './Reveal.jsx'
import MagneticButton from './MagneticButton.jsx'
import PlayButton from './PlayButton.jsx'

import heroImg from '../assets/images/planung/simulator/01-hero-planungsfehler-simulator-16x9.png'
import mainProblem from '../assets/images/planung/simulator/02-simulator-main-problem-16x9.png'
import mainLoesung from '../assets/images/planung/simulator/03-simulator-main-loesung-16x9.png'
import tP1 from '../assets/images/planung/simulator/04-thumb-problem-01-zu-wenig-arbeitsflaeche.png'
import tP2 from '../assets/images/planung/simulator/05-thumb-problem-02-schlechte-beleuchtung.png'
import tP3 from '../assets/images/planung/simulator/06-thumb-problem-03-unguenstige-laufwege.png'
import tP4 from '../assets/images/planung/simulator/07-thumb-problem-04-zu-wenig-steckdosen.png'
import tP5 from '../assets/images/planung/simulator/08-thumb-problem-05-geraete-falsch-platziert.png'
import tP6 from '../assets/images/planung/simulator/09-thumb-problem-06-zu-wenig-stauraum.png'
import tP7 from '../assets/images/planung/simulator/10-thumb-problem-07-unpassende-materialien.png'
import tL1 from '../assets/images/planung/simulator/11-thumb-loesung-01-grosszuegige-arbeitsflaeche.png'
import tL2 from '../assets/images/planung/simulator/12-thumb-loesung-02-gute-beleuchtung.png'
import tL3 from '../assets/images/planung/simulator/13-thumb-loesung-03-optimierte-laufwege.png'
import tL4 from '../assets/images/planung/simulator/14-thumb-loesung-04-genug-steckdosen.png'
import tL5 from '../assets/images/planung/simulator/15-thumb-loesung-05-geraete-richtig-platziert.png'
import tL6 from '../assets/images/planung/simulator/16-thumb-loesung-06-mehr-stauraum.png'
import tL7 from '../assets/images/planung/simulator/17-thumb-loesung-07-passende-materialien.png'

const ERRORS = [
  {
    id: 'arbeitsflaeche', stepNumber: 1, title: 'Zu wenig Arbeitsfläche',
    shortDescription: 'Zwischen Spüle, Kochfeld und Vorratsschrank bleibt kaum Platz zum Arbeiten.',
    consequences: ['Hektik beim Kochen', 'Kein Platz für Geräte & Zutaten', 'Unordnung auf der Fläche'],
    solutionTitle: 'Großzügige Arbeitsfläche',
    solutionText: 'Durchdachte Zonen und eine großzügige Insel schaffen Raum für entspanntes Arbeiten.',
    hotspotPositionProblem: { x: 47, y: 56 }, hotspotPositionSolution: { x: 47, y: 56 },
    problemThumbnail: tP1, solutionThumbnail: tL1,
  },
  {
    id: 'beleuchtung', stepNumber: 2, title: 'Schlechte Beleuchtung',
    shortDescription: 'Eine einzige Deckenleuchte lässt die Arbeitsbereiche im Schatten liegen.',
    consequences: ['Schlechte Sicht beim Schneiden', 'Müde Atmosphäre', 'Erhöhte Unfallgefahr'],
    solutionTitle: 'Gute Beleuchtung',
    solutionText: 'Ein mehrschichtiges Lichtkonzept aus Arbeits-, Akzent- und Stimmungslicht.',
    hotspotPositionProblem: { x: 52, y: 20 }, hotspotPositionSolution: { x: 52, y: 20 },
    problemThumbnail: tP2, solutionThumbnail: tL2,
  },
  {
    id: 'laufwege', stepNumber: 3, title: 'Ungünstige Laufwege',
    shortDescription: 'Lange Wege zwischen Kühlschrank, Spüle und Herd kosten täglich Zeit und Nerven.',
    consequences: ['Unnötige Schritte', 'Gedränge zu mehreren', 'Ermüdender Ablauf'],
    solutionTitle: 'Optimierte Laufwege',
    solutionText: 'Das ideale Arbeitsdreieck bringt alles in greifbare Nähe.',
    hotspotPositionProblem: { x: 38, y: 41 }, hotspotPositionSolution: { x: 38, y: 41 },
    problemThumbnail: tP3, solutionThumbnail: tL3,
  },
  {
    id: 'steckdosen', stepNumber: 4, title: 'Zu wenig Steckdosen',
    shortDescription: 'Geräte konkurrieren um wenige, schlecht platzierte Anschlüsse.',
    consequences: ['Kabelsalat', 'Ständiges Umstecken', 'Eingeschränkte Nutzung'],
    solutionTitle: 'Genug Steckdosen',
    solutionText: 'Durchdacht platzierte Anschlüsse – genau dort, wo Sie sie brauchen.',
    hotspotPositionProblem: { x: 66, y: 29 }, hotspotPositionSolution: { x: 66, y: 29 },
    problemThumbnail: tP4, solutionThumbnail: tL4,
  },
  {
    id: 'geraete', stepNumber: 5, title: 'Geräte falsch platziert',
    shortDescription: 'Backofen, Spülmaschine und Kühlschrank behindern sich gegenseitig.',
    consequences: ['Türen blockieren sich', 'Unergonomisches Bücken', 'Stockende Abläufe'],
    solutionTitle: 'Geräte richtig platziert',
    solutionText: 'Ergonomische Höhen und eine sinnvolle Anordnung für müheloses Arbeiten.',
    hotspotPositionProblem: { x: 57, y: 49 }, hotspotPositionSolution: { x: 57, y: 49 },
    problemThumbnail: tP5, solutionThumbnail: tL5,
  },
  {
    id: 'stauraum', stepNumber: 6, title: 'Zu wenig Stauraum',
    shortDescription: 'Geschirr, Vorräte und Geräte finden keinen festen Platz.',
    consequences: ['Überfüllte Schränke', 'Suchen statt Finden', 'Volle Arbeitsflächen'],
    solutionTitle: 'Mehr Stauraum',
    solutionText: 'Intelligente Auszüge und Schranklösungen nutzen jeden Zentimeter.',
    hotspotPositionProblem: { x: 17, y: 30 }, hotspotPositionSolution: { x: 17, y: 30 },
    problemThumbnail: tP6, solutionThumbnail: tL6,
  },
  {
    id: 'materialien', stepNumber: 7, title: 'Unpassende Materialien',
    shortDescription: 'Empfindliche Oberflächen zeigen schnell Kratzer, Flecken und Abnutzung.',
    consequences: ['Frühe Gebrauchsspuren', 'Aufwändige Pflege', 'Wertverlust'],
    solutionTitle: 'Passende Materialien',
    solutionText: 'Robuste, edle Materialien, die ein Leben lang schön bleiben.',
    hotspotPositionProblem: { x: 30, y: 64 }, hotspotPositionSolution: { x: 30, y: 64 },
    problemThumbnail: tP7, solutionThumbnail: tL7,
  },
]

export default function SimulatorSection() {
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState('problem') // 'problem' | 'loesung'
  const current = ERRORS[step]
  const solved = mode === 'loesung'

  function restart() {
    setStep(0)
    setMode('problem')
  }

  return (
    <section className="sim" id="simulator">
      {/* hero */}
      <div className="sim__hero">
        <img src={heroImg} alt="" className="sim__hero-img" />
        <div className="sim__hero-veil" aria-hidden="true" />
        <div className="container sim__hero-inner">
          <Reveal className="sim__hero-copy">
            <span className="kicker kicker--gold">Planungsfehler Simulator</span>
            <h2 className="sim__title">
              Die 7 Küchenfehler,<br />
              die jeden Tag <span className="grad">nerven.</span>
            </h2>
            <p className="sim__lead">
              Entdecken Sie typische Planungsfehler – und erleben Sie, wie
              durchdachte Lösungen Ihren Alltag verwandeln.
            </p>
            <div className="sim__hero-actions">
              <MagneticButton as="a" href="#simulator-card">
                Simulator starten
              </MagneticButton>
              <PlayButton label="So funktioniert der Simulator" href="#simulator-card" />
            </div>
          </Reveal>
        </div>
      </div>

      {/* body */}
      <div className="container sim__body" id="simulator-card">
        {/* step nav */}
        <div className="sim__nav">
          <div className="sim__steps">
            {ERRORS.map((e, i) => (
              <button
                key={e.id}
                type="button"
                className={`simstep ${i === step ? 'simstep--active' : ''}`}
                onClick={() => setStep(i)}
                aria-pressed={i === step}
              >
                {String(e.stepNumber).padStart(2, '0')}
              </button>
            ))}
          </div>
          <a className="sim__overview" href="#simulator-card">
            <LayoutGrid size={15} strokeWidth={1.8} /> Übersicht anzeigen
          </a>
        </div>

        {/* main card */}
        <div className={`simcard ${solved ? 'simcard--solved' : ''}`}>
          {/* left */}
          <div className="simcard__info">
            <span className="simcard__count">
              {String(current.stepNumber).padStart(2, '0')}
              <span> / 07</span>
            </span>
            <h3 className="simcard__title">{current.title}</h3>
            <p className="simcard__desc">{current.shortDescription}</p>

            <div className="simcard__consequences">
              <span className="simcard__sublabel">
                <AlertTriangle size={14} strokeWidth={2} /> Die Folgen
              </span>
              <ul>
                {current.consequences.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>

            <div className="simsolution">
              <span className="simsolution__label">VIDEKO Lösung</span>
              <span className="simsolution__title">{current.solutionTitle}</span>
              <p className="simsolution__text">{current.solutionText}</p>
            </div>

            <button
              type="button"
              className="simcard__cta"
              onClick={() => setMode(solved ? 'problem' : 'loesung')}
            >
              <span>{solved ? 'Problem anzeigen' : 'Lösung anzeigen'}</span>
              <ArrowRight size={17} strokeWidth={2} />
            </button>
          </div>

          {/* right */}
          <div className="simcard__stage">
            <div className="simstage__top">
              <div className="simtoggle" role="tablist" aria-label="Ansicht">
                <button
                  className={`simtoggle__btn ${!solved ? 'is-on' : ''}`}
                  onClick={() => setMode('problem')}
                  role="tab"
                  aria-selected={!solved}
                >
                  Problem
                </button>
                <button
                  className={`simtoggle__btn ${solved ? 'is-on' : ''}`}
                  onClick={() => setMode('loesung')}
                  role="tab"
                  aria-selected={solved}
                >
                  Lösung
                </button>
              </div>
              <button className="simstage__restart" onClick={restart}>
                <RotateCcw size={14} strokeWidth={2} /> Simulator neu starten
              </button>
            </div>

            <div className="simstage__frame">
              <img
                key={mode}
                src={solved ? mainLoesung : mainProblem}
                alt={solved ? 'Optimierte VIDEKO Küche' : 'Küche mit typischen Planungsfehlern'}
                className="simstage__img"
              />
              <div className="simstage__hotspots">
                {ERRORS.map((e, i) => {
                  const pos = solved ? e.hotspotPositionSolution : e.hotspotPositionProblem
                  return (
                    <button
                      key={e.id}
                      type="button"
                      className={`hotspot ${i === step ? 'hotspot--active' : ''} ${solved ? 'hotspot--solved' : ''}`}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      onClick={() => setStep(i)}
                      aria-label={`${e.title}`}
                      aria-pressed={i === step}
                    >
                      <span className="hotspot__pulse" aria-hidden="true" />
                      <span className="hotspot__dot">
                        {solved ? <Check size={13} strokeWidth={3} /> : e.stepNumber}
                      </span>
                      <span className="hotspot__label">{e.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* thumbnails */}
        <div className="sim__thumbs">
          {ERRORS.map((e, i) => (
            <button
              key={e.id}
              type="button"
              className={`simthumb ${i === step ? 'simthumb--active' : ''}`}
              onClick={() => setStep(i)}
              aria-pressed={i === step}
            >
              <span
                className="simthumb__img"
                style={{ backgroundImage: `url(${solved ? e.solutionThumbnail : e.problemThumbnail})` }}
                aria-hidden="true"
              />
              <span className="simthumb__scrim" aria-hidden="true" />
              <span className="simthumb__n">{String(e.stepNumber).padStart(2, '0')}</span>
              <span className="simthumb__title">
                {solved ? e.solutionTitle : e.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
