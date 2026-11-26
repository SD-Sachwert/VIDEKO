import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'

import SectionHeader from './SectionHeader.jsx'
import Reveal from './Reveal.jsx'

/**
 * Planungs-Check: Was ist für das erste Planungsgespräch schon da, was nicht?
 *
 * Kein Rechner, keine Preise, keine Bewertung. Der Check sortiert nur, was
 * Kundinnen und Kunden mitbringen können, und sagt bei jedem Punkt, warum er
 * hilft. Das Ergebnis wird als Text in das Nachrichtenfeld auf /beratung
 * übernommen (sessionStorage, Schlüssel unten) und kann dort frei geändert
 * werden. Nichts wird ohne Absenden des Formulars übertragen.
 */
export const PLANUNGSCHECK_KEY = 'videko:planungscheck'

const GRUPPEN = [
  {
    titel: 'Der Raum',
    punkte: [
      { id: 'grundriss', text: 'Grundriss oder Skizze mit groben Maßen', tipp: 'Eine Handskizze reicht. Millimetergenau misst später der Laser vor Ort.' },
      { id: 'fotos', text: 'Fotos von allen Wänden', tipp: 'Auch von der Ecke, die gerade niemand sehen soll. Gerade die.' },
      { id: 'fenster', text: 'Raumhöhe, Fenster und Türen', tipp: 'Die Brüstungshöhe des Fensters entscheidet, ob die Arbeitsplatte darunter durchlaufen kann.' },
    ],
  },
  {
    titel: 'Die Anschlüsse',
    punkte: [
      { id: 'wasser', text: 'Wo Wasser und Abwasser liegen', tipp: 'Ein Foto unter der alten Spüle sagt mehr als jede Beschreibung.' },
      { id: 'strom', text: 'Herdanschluss (Starkstrom) vorhanden', tipp: 'Meist eine Anschlussdose hinter dem alten Herd. Bei Induktion wichtig.' },
      { id: 'abluft', text: 'Abluft nach außen möglich oder Umluft', tipp: 'In der Mietwohnung vorher klären, ob ein Wanddurchbruch erlaubt ist.' },
    ],
  },
  {
    titel: 'Dein Alltag',
    punkte: [
      { id: 'kochen', text: 'Wer kocht wie oft, für wie viele', tipp: 'Danach richten sich Arbeitsfläche, Kochfeldgröße und Stauraum.' },
      { id: 'geraete', text: 'Geräte, die bleiben oder dazukommen sollen', tipp: 'Kühlschrank, Spülmaschine, Kaffeevollautomat: Was bleibt, braucht seinen festen Platz im Plan.' },
      { id: 'stoert', text: 'Was dich an der jetzigen Küche stört', tipp: 'Der wichtigste Punkt. Daraus entsteht die Planung, nicht aus dem Katalog.' },
      { id: 'zeit', text: 'Grober Zeitrahmen (Einzug, Umbau)', tipp: 'Lieferzeiten hängen von Hersteller und Ausführung ab. Früh fragen hilft.' },
    ],
  },
]

const ALLE = GRUPPEN.flatMap((g) => g.punkte)

function nachrichtAus(da) {
  const ja = ALLE.filter((p) => da.has(p.id)).map((p) => `- ${p.text}`)
  const offen = ALLE.filter((p) => !da.has(p.id)).map((p) => `- ${p.text}`)
  return [
    'Aus dem Planungs-Check:',
    ja.length ? `Habe ich schon:\n${ja.join('\n')}` : '',
    offen.length ? `Noch offen:\n${offen.join('\n')}` : '',
  ].filter(Boolean).join('\n\n')
}

export default function PlanungsCheck() {
  const [da, setDa] = useState(() => new Set())
  const navigate = useNavigate()
  const toggle = (id) => setDa((alt) => {
    const neu = new Set(alt)
    if (neu.has(id)) neu.delete(id); else neu.add(id)
    return neu
  })

  const weiter = () => {
    try { sessionStorage.setItem(PLANUNGSCHECK_KEY, nachrichtAus(da)) } catch { /* ohne Speicher: Formular bleibt leer */ }
    navigate('/beratung#anfrage-formular')
  }

  return (
    <section className="section section--light" id="planungs-check">
      <div className="container">
        <SectionHeader
          kicker="Planungs-Check"
          title={<>Was du fürs erste Gespräch <span className="grad">schon hast.</span></>}
          lead="Hak ab, was du schon weißt oder zur Hand hast. Was offen bleibt, ist kein Problem: Das klären wir gemeinsam. Der Check speichert nichts und schickt nichts ab."
        />
        <div className="pcheck">
          {GRUPPEN.map((g) => (
            <Reveal key={g.titel} className="pcheck__gruppe">
              <h3 className="pcheck__titel">{g.titel}</h3>
              <ul className="pcheck__liste">
                {g.punkte.map((p) => {
                  const an = da.has(p.id)
                  return (
                    <li key={p.id}>
                      <button type="button" className={`pcheck__punkt ${an ? 'is-active' : ''}`} onClick={() => toggle(p.id)} aria-pressed={an}>
                        <span className="pcheck__box" aria-hidden="true">{an && <Check size={14} strokeWidth={2.8} />}</span>
                        <span>
                          <span className="pcheck__text">{p.text}</span>
                          <span className="pcheck__tipp">{p.tipp}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Reveal>
          ))}
        </div>
        <div className="pcheck__fazit">
          <p className="aaeh-note aaeh-note--center" aria-live="polite">
            {da.size === 0
              ? 'Noch nichts abgehakt? Dann fangen wir einfach beim Raum an.'
              : `${da.size} von ${ALLE.length} Punkten hast du schon. Den Rest klären wir im Gespräch.`}
          </p>
          <div className="section__cta">
            <button type="button" className="btn btn--primary btn--lg" onClick={weiter}>
              Mit dieser Liste Beratung anfragen <ArrowRight size={16} strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
