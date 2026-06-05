import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Home, ChefHat, Sparkles, SlidersHorizontal, Wallet,
  DoorOpen, Sofa, Utensils, Building2, KeyRound, Users, Heart, Clock,
  ArrowRight, ArrowLeft, Check, BadgeCheck, ShieldCheck, Lightbulb,
  Mail, Phone, MapPin, Upload,
} from 'lucide-react'

import CTAButton from './CTAButton.jsx'

import imgKitchenWide from '../assets/images/kuechenwelten/stilfinderhero-kitchen-wide.jpg'
import imgModern from '../assets/images/kuechenwelten/stilfindercard-modern-warm.jpg'
import imgWarm from '../assets/images/kuechenwelten/stilfinderresult-modern-warm.jpg'
import imgDunkel from '../assets/images/kuechenwelten/stilfindercard-dunkel-dramatisch.jpg'
import imgHell from '../assets/images/kuechenwelten/stilfindercard-natuerlich-luxurioes.jpg'
import imgLandhaus from '../assets/images/kuechenwelten/stilfinderresult-natuerlich-luxurioes.jpg'
import imgIndustrial from '../assets/images/kuechenwelten/stilfindercard-industrial-premium.jpg'
import imgLuxus from '../assets/images/kuechenwelten/stilfinderresult-industrial-premium.jpg'
import imgZeitlos from '../assets/images/kuechenwelten/stilfindercard-zeitlos-elegant.jpg'

const STEPS = [
  { n: '01', label: 'Raum', icon: Home },
  { n: '02', label: 'Alltag', icon: ChefHat },
  { n: '03', label: 'Stil', icon: Sparkles },
  { n: '04', label: 'Prioritäten', icon: SlidersHorizontal },
  { n: '05', label: 'Budget', icon: Wallet },
]

const RAUM = [
  { key: 'separat', label: 'Separate Küche', icon: DoorOpen },
  { key: 'offen', label: 'Offene Wohnküche', icon: Sofa },
  { key: 'essbereich', label: 'Küche mit Essbereich', icon: Utensils },
  { key: 'apartment', label: 'Kleine Wohnung / Apartment', icon: Home },
  { key: 'neubau', label: 'Neubau', icon: Building2 },
  { key: 'bestand', label: 'Renovierung / Bestand', icon: KeyRound },
]
const FLAECHE = ['bis 10 m²', '10–20 m²', '20–30 m²', 'über 30 m²', 'weiß ich nicht genau']

const NUTZER = [
  { key: 'paar', label: 'Single / Paar', icon: Heart },
  { key: 'familie', label: 'Familie mit Kindern', icon: Users },
  { key: 'gaeste', label: 'Viel Besuch / Gäste', icon: Sparkles },
  { key: 'hobbykoch', label: 'Hobbykoch', icon: ChefHat },
  { key: 'vermietung', label: 'Vermietung / Mietobjekt', icon: KeyRound },
  { key: 'buero', label: 'Büro / Mitarbeiterküche', icon: Building2 },
]
const KOCHEN = [
  'Schnell & praktisch', 'Regelmäßig frisch', 'Leidenschaftlich / aufwendig',
  'Selten, aber schön soll sie sein', 'Viel vorbereiten / Mealprep',
]

const STILE = [
  { key: 'grifflos', label: 'Modern & grifflos', desc: 'Klare Flächen, reduziert, hochwertig.', image: imgModern },
  { key: 'warm', label: 'Warm & wohnlich', desc: 'Holz, weiche Töne, Geborgenheit.', image: imgWarm },
  { key: 'dunkel', label: 'Dunkel & elegant', desc: 'Tiefe Töne, starker Charakter.', image: imgDunkel },
  { key: 'hell', label: 'Hell & natürlich', desc: 'Licht, Naturmaterialien, Ruhe.', image: imgHell },
  { key: 'landhaus', label: 'Landhaus modern', desc: 'Klassik, neu interpretiert.', image: imgLandhaus },
  { key: 'industrial', label: 'Industrial / Beton / Schwarz', desc: 'Roh, urban, markant.', image: imgIndustrial },
  { key: 'luxus', label: 'Luxus / Architekturküche', desc: 'Statement, Materialtiefe, Design.', image: imgLuxus },
  { key: 'zeitlos', label: 'Zeitlos schlicht', desc: 'Unaufgeregt, langlebig schön.', image: imgZeitlos },
]

const PRIOS = [
  'Design', 'Stauraum', 'Geräte', 'Preis',
  'Pflegeleicht', 'Familienalltag', 'Arbeitsfläche', 'Besondere Materialien',
]

const BUDGET = [
  'bis 10.000 €', '10.000–15.000 €', '15.000–20.000 €',
  '20.000–30.000 €', '30.000–40.000 €', '40.000 €+', 'Ich brauche erst Orientierung',
]

const TRUST = ['Ehrliche Orientierung', 'Ca. 2 Minuten', 'Unverbindlich']

function profileFor(a) {
  const stil = STILE.find((s) => s.key === a.stil)
  let name = 'Ihre individuelle Traumküche'
  if (a.nutzer === 'familie') name = 'Die moderne Familienküche'
  else if (a.nutzer === 'paar') name = 'Die elegante Wohnküche'
  else if (a.nutzer === 'hobbykoch') name = 'Die Küche für Genießer'
  else if (a.nutzer === 'vermietung') name = 'Die clevere Vermieterküche'
  else if (a.nutzer === 'gaeste') name = 'Die offene Gastgeber-Küche'
  return {
    name,
    style: stil ? stil.label : 'Modern & wohnlich',
    image: stil ? stil.image : imgWarm,
    budget: a.budget && a.budget !== 'Ich brauche erst Orientierung' ? a.budget : '18.000–25.000 €',
    points: [
      'Durchdachte Arbeitszonen & Laufwege',
      'Stauraum, der zum Alltag passt',
      'Materialien mit Charakter & Langlebigkeit',
    ],
    welten: [stil ? stil.label : 'Modern Elegance', 'Offene Wohnküche', 'Premium Insel'],
  }
}

export default function StylefinderWizard() {
  const [step, setStep] = useState(0) // 0..4 steps, 5 = result
  const [a, setA] = useState({
    raum: null, flaeche: null, nutzer: null, kochen: null, stil: null,
    prios: Object.fromEntries(PRIOS.map((p) => [p, 50])),
    budget: null,
  })
  const set = (k, v) => setA((s) => ({ ...s, [k]: v }))
  const setPrio = (p, v) => setA((s) => ({ ...s, prios: { ...s.prios, [p]: v } }))

  const go = (n) => setStep(Math.max(0, Math.min(5, n)))
  const profile = profileFor(a)

  function Stepper() {
    return (
      <div className="sfstepper">
        {STEPS.map((s, i) => (
          <button
            key={s.n}
            type="button"
            className={`sfstep ${i === step ? 'sfstep--active' : ''} ${i < step ? 'sfstep--done' : ''}`}
            onClick={() => go(i)}
          >
            <span className="sfstep__icon"><s.icon size={18} strokeWidth={1.6} /></span>
            <span className="sfstep__n">{s.n}</span>
            <span className="sfstep__label">{s.label}</span>
          </button>
        ))}
      </div>
    )
  }

  function NavRow({ onNext, nextLabel = 'Weiter', back = true }) {
    return (
      <div className="sfnav">
        {back ? (
          <button type="button" className="sfbtn sfbtn--ghost" onClick={() => go(step - 1)}>
            <ArrowLeft size={16} strokeWidth={2} /> Zurück
          </button>
        ) : <span />}
        <div className="sfnav__right">
          <button type="button" className="sfbtn sfbtn--primary" onClick={onNext}>
            {nextLabel} <ArrowRight size={16} strokeWidth={2} />
          </button>
          <CTAButton to="/beratung" variant="dark" size="md">Beratung buchen</CTAButton>
        </div>
      </div>
    )
  }

  function PreviewCard({ title = 'Ihre erste Richtung', sub = 'Basierend auf Ihrer Auswahl' }) {
    return (
      <aside className="sfpreview">
        <span className="sfpreview__eyebrow">{title}</span>
        <span className="sfpreview__sub">{sub}</span>
        <div className="sfpreview__media">
          <img src={profile.image} alt="" loading="lazy" />
        </div>
        <ul className="sfpreview__list">
          <li><span>Wohnsituation</span><strong>{RAUM.find((r) => r.key === a.raum)?.label || 'noch offen'}</strong></li>
          <li><span>Stil</span><strong>{STILE.find((s) => s.key === a.stil)?.label || 'noch offen'}</strong></li>
          <li><span>Fläche</span><strong>{a.flaeche || 'noch offen'}</strong></li>
        </ul>
      </aside>
    )
  }

  function TrustBar() {
    return (
      <div className="sftrust">
        {TRUST.map((t) => (
          <span key={t} className="sftrust__item"><Check size={14} strokeWidth={2.4} /> {t}</span>
        ))}
      </div>
    )
  }

  // ---------- RESULT ----------
  if (step === 5) {
    return (
      <div className="sfwizard" id="sf-wizard">
        <div className="sfresult">
          <div className="sfresult__card">
            <span className="sfresult__eyebrow">Ihr Küchenprofil</span>
            <h3 className="sfresult__name">{profile.name}</h3>
            <div className="sfresult__media"><img src={profile.image} alt={profile.name} /></div>
            <p className="sfresult__text">
              Auf Basis Ihrer Antworten passt am besten ein Konzept mit Stil
              „{profile.style}". Eine ehrliche erste Richtung – verfeinert wird
              alles im persönlichen Gespräch.
            </p>
            <div className="sfresult__chips">
              <span className="sfchip"><Sparkles size={13} /> {profile.style}</span>
              <span className="sfchip"><Wallet size={13} /> {profile.budget}</span>
            </div>
            <span className="sfresult__sublabel">Wichtige Punkte für die Planung</span>
            <ul className="sfresult__points">
              {profile.points.map((p) => <li key={p}><BadgeCheck size={15} strokeWidth={2} /> {p}</li>)}
            </ul>
            <span className="sfresult__sublabel">Passende Küchenwelten</span>
            <div className="sfresult__welten">
              {profile.welten.map((w) => <span key={w} className="sfchip sfchip--soft">{w}</span>)}
            </div>
          </div>

          <form className="sfform" onSubmit={(e) => e.preventDefault()}>
            <h3 className="sfform__title">Lassen Sie uns Ihre Traumküche planen.</h3>
            <div className="sfform__row">
              <label className="field"><span>Name</span><input type="text" placeholder="Ihr Name" required /></label>
              <label className="field"><span>E-Mail</span><input type="email" placeholder="name@beispiel.de" required /></label>
            </div>
            <div className="sfform__row">
              <label className="field"><span>Telefon</span><input type="tel" placeholder="Optional" /></label>
              <label className="field"><span>PLZ / Ort</span><input type="text" placeholder="z. B. 97070 Würzburg" /></label>
            </div>
            <label className="field"><span>Gewünschter Fertigstellungstermin</span><input type="text" placeholder="z. B. Herbst 2026" /></label>
            <label className="field"><span>Nachricht</span><textarea rows={3} placeholder="Worauf kommt es Ihnen an?" /></label>
            <label className="sfupload">
              <Upload size={18} strokeWidth={1.7} />
              <span>Grundriss, Fotos oder Skizze hochladen <em>(optional)</em></span>
              <input type="file" multiple hidden />
            </label>
            <div className="sfform__actions">
              <button type="submit" className="sfbtn sfbtn--ghost">
                <Mail size={16} strokeWidth={1.9} /> Ergebnis per E-Mail senden
              </button>
              <CTAButton to="/beratung">Persönliches Planungsgespräch buchen</CTAButton>
            </div>
          </form>
        </div>

        <div className="sfresult__trust">
          {[
            { icon: ShieldCheck, t: 'Ehrliche Beratung' },
            { icon: BadgeCheck, t: 'Geprüfte Qualität' },
            { icon: Lightbulb, t: 'Transparente Planung' },
            { icon: Sparkles, t: 'Premium auf Augenhöhe' },
          ].map((x) => (
            <span key={x.t} className="sfresult__trust-item"><x.icon size={18} strokeWidth={1.5} /> {x.t}</span>
          ))}
        </div>

        <div className="sfnav sfnav--center">
          <button type="button" className="sfbtn sfbtn--ghost" onClick={() => go(0)}>
            <ArrowLeft size={16} strokeWidth={2} /> Stylefinder neu starten
          </button>
        </div>
      </div>
    )
  }

  // ---------- STEPS ----------
  return (
    <div className="sfwizard" id="sf-wizard">
      <Stepper />

      {step === 0 && (
        <div className="sfstep-body">
          <div className="sfstep-main">
            <h2 className="sfstep__title"><span className="sfstep__no">1.</span> Raum &amp; Wohnsituation</h2>
            <p className="sfq">Welche Wohnsituation beschreibt Ihre Küche am besten?</p>
            <div className="sfcards sfcards--3">
              {RAUM.map((o) => (
                <button key={o.key} type="button" className={`sfcard ${a.raum === o.key ? 'sfcard--active' : ''}`} onClick={() => set('raum', o.key)}>
                  <span className="sfcard__icon"><o.icon size={22} strokeWidth={1.5} /></span>
                  <span className="sfcard__label">{o.label}</span>
                  {a.raum === o.key && <span className="sfcard__check"><Check size={13} strokeWidth={3} /></span>}
                </button>
              ))}
            </div>
            <p className="sfq">Wie groß ist Ihre Küchenfläche ungefähr?</p>
            <div className="sfchips">
              {FLAECHE.map((f) => (
                <button key={f} type="button" className={`sfchipbtn ${a.flaeche === f ? 'sfchipbtn--active' : ''}`} onClick={() => set('flaeche', f)}>{f}</button>
              ))}
            </div>
          </div>
          <PreviewCard />
          <div className="sfstep-foot"><NavRow onNext={() => go(1)} back={false} /></div>
        </div>
      )}

      {step === 1 && (
        <div className="sfstep-body">
          <div className="sfstep-main">
            <h2 className="sfstep__title"><span className="sfstep__no">2.</span> Alltag &amp; Nutzung</h2>
            <p className="sfq">Wer nutzt die Küche hauptsächlich?</p>
            <div className="sfcards sfcards--3">
              {NUTZER.map((o) => (
                <button key={o.key} type="button" className={`sfcard ${a.nutzer === o.key ? 'sfcard--active' : ''}`} onClick={() => set('nutzer', o.key)}>
                  <span className="sfcard__icon"><o.icon size={22} strokeWidth={1.5} /></span>
                  <span className="sfcard__label">{o.label}</span>
                  {a.nutzer === o.key && <span className="sfcard__check"><Check size={13} strokeWidth={3} /></span>}
                </button>
              ))}
            </div>
            <p className="sfq">Wie kochen Sie?</p>
            <div className="sfchips">
              {KOCHEN.map((k) => (
                <button key={k} type="button" className={`sfchipbtn ${a.kochen === k ? 'sfchipbtn--active' : ''}`} onClick={() => set('kochen', k)}>{k}</button>
              ))}
            </div>
          </div>
          <PreviewCard title="Ihre aktuelle Empfehlung" sub={profile.name} />
          <div className="sfstep-foot"><NavRow onNext={() => go(2)} nextLabel="Weiter zu Stil" /></div>
        </div>
      )}

      {step === 2 && (
        <div className="sfstep-body sfstep-body--wide">
          <div className="sfstep-main">
            <h2 className="sfstep__title"><span className="sfstep__no">3.</span> Stilrichtung</h2>
            <p className="sfq">Welcher Stil spricht Sie am meisten an?</p>
            <div className="sfstilgrid">
              {STILE.map((s) => (
                <button key={s.key} type="button" className={`sfstilcard ${a.stil === s.key ? 'sfstilcard--active' : ''}`} onClick={() => set('stil', s.key)}>
                  <span className="sfstilcard__img" style={{ backgroundImage: `url(${s.image})` }} aria-hidden="true" />
                  <span className="sfstilcard__scrim" aria-hidden="true" />
                  {a.stil === s.key && <span className="sfstilcard__check"><Check size={14} strokeWidth={3} /></span>}
                  <span className="sfstilcard__body">
                    <span className="sfstilcard__label">{s.label}</span>
                    <span className="sfstilcard__desc">{s.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="sfstep-foot"><NavRow onNext={() => go(3)} /></div>
        </div>
      )}

      {step === 3 && (
        <div className="sfstep-body">
          <div className="sfstep-main">
            <h2 className="sfstep__title"><span className="sfstep__no">4.</span> Was ist Ihnen <span className="grad">wirklich</span> wichtig?</h2>
            <p className="sfq">Verschieben Sie die Regler nach Ihrem Gefühl.</p>
            <div className="sfsliders">
              {PRIOS.map((p) => (
                <div className="sfslider" key={p}>
                  <span className="sfslider__label">{p}</span>
                  <input type="range" min="0" max="100" value={a.prios[p]} onChange={(e) => setPrio(p, Number(e.target.value))} />
                  <span className="sfslider__hint">{a.prios[p] >= 66 ? 'wichtig' : a.prios[p] <= 33 ? 'weniger' : 'mittel'}</span>
                </div>
              ))}
            </div>
          </div>
          <PreviewCard title="Ihre Richtung" sub="Live aus Ihren Prioritäten" />
          <div className="sfstep-foot"><NavRow onNext={() => go(4)} /><TrustBar /></div>
        </div>
      )}

      {step === 4 && (
        <div className="sfstep-body">
          <div className="sfstep-main">
            <h2 className="sfstep__title"><span className="sfstep__no">5.</span> Budget &amp; Rahmen</h2>
            <p className="sfq">In welchem Rahmen planen Sie ungefähr?</p>
            <div className="sfcards sfcards--3">
              {BUDGET.map((b) => (
                <button key={b} type="button" className={`sfcard sfcard--budget ${a.budget === b ? 'sfcard--active' : ''}`} onClick={() => set('budget', b)}>
                  <span className="sfcard__label">{b}</span>
                  {a.budget === b && <span className="sfcard__check"><Check size={13} strokeWidth={3} /></span>}
                </button>
              ))}
            </div>
          </div>
          <aside className="sfpreview">
            <span className="sfpreview__eyebrow">Jeder Plan ist individuell</span>
            <span className="sfpreview__sub">Budget ist Orientierung – kein Etikett.</span>
            <div className="sfpreview__media"><img src={profile.image} alt="" loading="lazy" /></div>
            <p className="sfpreview__note">
              Ihre Auswahl ergibt das Profil <strong>{profile.name}</strong>. Im
              Ergebnis sehen Sie Stil, Budgetspanne und nächste Schritte.
            </p>
          </aside>
          <div className="sfstep-foot"><NavRow onNext={() => go(5)} nextLabel="Ergebnis anzeigen" /></div>
        </div>
      )}
    </div>
  )
}
