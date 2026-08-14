import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, Plus, Minus, Clock, Bookmark, Quote, Sparkles,
} from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Img from '../components/Img.jsx'

import heroImg from '../assets/images/inspiration/01_hero_atmosphaerische_kueche.webp'
import faqImg from '../assets/images/leistungen/04_intro_helle_kueche.webp'
import {
  categories, journalArticles, journalFaqs, kitchenMyths, fragVidekoQuestions, popularTopics,
} from '../data/journal.js'

export default function Journal() {
  const [cat, setCat] = useState('Alle Themen')
  const [openFaq, setOpenFaq] = useState(0)
  const [openMyth, setOpenMyth] = useState(null)
  const [openFrag, setOpenFrag] = useState(0)
  const mythTrack = useRef(null)

  const shown = cat === 'Alle Themen' ? journalArticles : journalArticles.filter((a) => a.category === cat)

  const slideMyth = (dir) => {
    const el = mythTrack.current
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.7), behavior: 'smooth' })
  }

  return (
    <div className="journal-page">
      {/* 1 — HERO */}
      <section className="pagehero journal-hero">
        <div className="pagehero__media" aria-hidden="true">
          <Img src={heroImg} alt="" className="pagehero__img" priority sizes="100vw" />
          <div className="pagehero__veil" />
        </div>
        <div className="container journal-hero__inner">
          <Reveal className="journal-hero__copy">
            <span className="kicker kicker--gold">Journal</span>
            <h1 className="pagehero__title">Wissen, das <span className="grad">weiterhilft.</span></h1>
            <p className="pagehero__lead">Praktische Tipps, ehrliche Planungshilfe und inspirierende Ideen rund um Küche, Materialien, Licht und Alltag.</p>
            <div className="pagehero__actions">
              <CTAButton href="#artikel">Artikel entdecken</CTAButton>
              <CTAButton to="/stylefinder" variant="dark">Stylefinder starten</CTAButton>
            </div>
          </Reveal>
          <Reveal className="journal-hero__float" delay={0.18}>
            <a href="#artikel" className="jfloat">
              <span className="jfloat__tag"><Sparkles size={13} strokeWidth={2} /> Neu im Journal</span>
              <span className="jfloat__num">{journalArticles.length}</span>
              <span className="jfloat__label">echte Ratgeber</span>
              <span className="jfloat__cta">Jetzt entdecken <ArrowRight size={15} strokeWidth={2} /></span>
            </a>
          </Reveal>
        </div>
        <span className="journal-hero__scroll" aria-hidden="true"><span /></span>
      </section>

      {/* 2 — ALLE ARTIKEL (Übersicht ganz oben) */}
      <section className="section section--light journal-grid-sec" id="artikel">
        <div className="container">
          <SectionHeader align="center" kicker="Küchenratgeber" title={<>Alle Artikel <span className="grad">auf einen Blick.</span></>} lead="Filtere nach Thema und finde genau das Wissen, das deine Planung weiterbringt." />
          <div className="jfilter">
            {categories.map((c) => (
              <button key={c} type="button" className={`jfilter__pill ${cat === c ? 'is-active' : ''}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <div className="jgrid">
            {shown.map((a, i) => (
              <Reveal key={a.slug} delay={(i % 3) * 0.06}>
                <Link to={`/journal/${a.slug}`} className="jcard">
                  <span className="jcard__media"><Img src={a.image} alt="" sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 380px" /><span className="jcard__badge">{a.category}</span></span>
                  <span className="jcard__body">
                    <span className="jcard__title">{a.title}</span>
                    <span className="jcard__teaser">{a.teaser}</span>
                    <span className="jcard__foot"><span className="jcard__read"><Clock size={13} strokeWidth={2} /> {a.read}</span><span className="jcard__arrow"><ArrowUpRight size={16} strokeWidth={2} /></span></span>
                  </span>
                </Link>
              </Reveal>
            ))}
            {shown.length === 0 && <p className="jgrid__empty">Zu diesem Thema kommen bald weitere Artikel.</p>}
          </div>
        </div>
      </section>

      {/* 5 — EXPERTEN-TIPP + BELIEBTE THEMEN */}
      <section className="section section--light journal-tip-sec">
        <div className="container jtip">
          <Reveal className="jtip__quote">
            <span className="jtip__qicon"><Quote size={26} strokeWidth={1.5} /></span>
            <span className="jtip__kicker">VIDEKO Experten-Tipp</span>
            <p className="jtip__text">„Die perfekte Küche ist selten die größte. Meistens ist sie einfach die, bei der man vorher sauber nachgedacht hat."</p>
            <span className="jtip__attr">VIDEKO Küchenplanung</span>
          </Reveal>
          <div className="jtopics">
            <span className="jtopics__head">Beliebte Themen</span>
            {popularTopics.map((t, i) => (
              <Reveal key={t.title} delay={i * 0.06}>
                <Link to={t.to} className="jtopic">
                  <span className="jtopic__img" style={{ backgroundImage: `url(${t.image})` }} aria-hidden="true" />
                  <span className="jtopic__body"><span className="jtopic__title">{t.title}</span><span className="jtopic__count">{t.count}</span></span>
                  <ArrowUpRight size={16} strokeWidth={2} className="jtopic__arrow" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — FAQ GROSSBLOCK */}
      <section className="section section--light journal-faq-sec">
        <div className="container jfaqblock">
          <Reveal className="jfaqblock__left">
            <span className="kicker">Beliebte Fragen</span>
            <h2 className="jfaqblock__title">Fragen, die fast jeder vor der <span className="grad">Küchenplanung</span> hat.</h2>
            <div className="jfaqblock__img"><Img src={faqImg} alt="" sizes="(max-width: 900px) 100vw, 520px" /></div>
          </Reveal>
          <div className="jfaqblock__grid">
            {journalFaqs.map((f, i) => (
              <Reveal key={f.q} as="div" className={`jacc ${openFaq === i ? 'is-open' : ''}`} delay={(i % 2) * 0.05}>
                <button type="button" className="jacc__q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}>
                  <span>{f.q}</span>
                  <span className="jacc__icon">{openFaq === i ? <Minus size={16} strokeWidth={2.2} /> : <Plus size={16} strokeWidth={2.2} />}</span>
                </button>
                <div className="jacc__a"><div className="jacc__a-in"><p>{f.a}</p></div></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7 — KÜCHENMYTHEN */}
      <section className="section journal-myth-sec">
        <div className="container journal-myth-head">
          <div>
            <span className="kicker kicker--gold">Küchenmythen</span>
            <h2 className="journal-myth-title">Wahr oder <span className="grad">falsch?</span></h2>
          </div>
          <div className="jmyth__nav">
            <button type="button" onClick={() => slideMyth(-1)} aria-label="Zurück"><ArrowRight size={18} strokeWidth={2} style={{ transform: 'rotate(180deg)' }} /></button>
            <button type="button" onClick={() => slideMyth(1)} aria-label="Weiter"><ArrowRight size={18} strokeWidth={2} /></button>
          </div>
        </div>
        <div className="jmyth__track" ref={mythTrack}>
          {kitchenMyths.map((m, i) => (
            <div key={m.title} className={`jmyth ${openMyth === i ? 'is-open' : ''}`}>
              <span className="jmyth__tag">Mythos</span>
              <span className="jmyth__title">{m.title}</span>
              {openMyth === i ? (
                <div className="jmyth__answer">
                  <span className="jmyth__verdict">{m.verdict}</span>
                  <p>{m.answer}</p>
                  <button type="button" className="jmyth__btn" onClick={() => setOpenMyth(null)}>Schließen</button>
                </div>
              ) : (
                <button type="button" className="jmyth__btn" onClick={() => setOpenMyth(i)}>Wahr oder falsch? <ArrowRight size={14} strokeWidth={2} /></button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8 — FRAG VIDEKO */}
      <section className="section section--light journal-frag-sec">
        <div className="container jfrag">
          <Reveal className="jfrag__left">
            <span className="kicker">Frag VIDEKO</span>
            <h2 className="jfrag__title">Deine Fragen. <span className="grad">Unsere Antworten.</span></h2>
            <div className="jfrag__list">
              {fragVidekoQuestions.map((f, i) => (
                <div key={f.q} className={`jacc jacc--light ${openFrag === i ? 'is-open' : ''}`}>
                  <button type="button" className="jacc__q" onClick={() => setOpenFrag(openFrag === i ? -1 : i)} aria-expanded={openFrag === i}>
                    <span>{f.q}</span>
                    <span className="jacc__icon">{openFrag === i ? <Minus size={16} strokeWidth={2.2} /> : <Plus size={16} strokeWidth={2.2} />}</span>
                  </button>
                  <div className="jacc__a"><div className="jacc__a-in"><p>{f.a}</p></div></div>
                </div>
              ))}
            </div>
            <div className="jfrag__actions">
              <CTAButton href="https://wa.me/491605545818?text=Hallo%20VIDEKO%2C%20ich%20habe%20eine%20Frage%20zur%20K%C3%BCchenplanung." target="_blank" rel="noopener noreferrer">Noch eine Frage? Schreib uns.</CTAButton>
              <CTAButton to="/beratung" variant="dark">Beratung anfragen</CTAButton>
            </div>
          </Reveal>
          <Reveal className="jfrag__device" delay={0.1}>
            <div className="jphone">
              <span className="jphone__notch" aria-hidden="true" />
              <div className="jphone__screen">
                <span className="jphone__brand">VIDEKO</span>
                <span className="jphone__ask">Frag VIDEKO</span>
                <span className="jphone__bubble jphone__bubble--q">Brauche ich wirklich eine Kochinsel?</span>
                <span className="jphone__bubble jphone__bubble--a">Nur, wenn Raum und Laufwege passen. Sonst lieber clever ohne. 👍</span>
                <span className="jphone__bubble jphone__bubble--q">Matt oder Hochglanz?</span>
                <span className="jphone__bubble jphone__bubble--a">Kommt auf Material & Alltag an – wir finden's gemeinsam raus.</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  )
}
