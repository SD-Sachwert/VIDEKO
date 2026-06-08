import { useParams, Navigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Clock } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import KuechenfehlerGame from '../components/KuechenfehlerGame.jsx'
import { journalArticles } from '../data/journal.js'

const GAME_SLUG = '7-kuechenfehler-die-du-spaeter-jeden-tag-bereust'

export default function JournalArticle() {
  const { slug } = useParams()
  const article = journalArticles.find((a) => a.slug === slug)
  if (!article) return <Navigate to="/journal" replace />

  const related = journalArticles.filter((a) => a.slug !== slug).slice(0, 3)

  return (
    <div className="journal-page jarticle-page">
      {/* HERO */}
      <section className="pagehero jarticle-hero">
        <div className="pagehero__media" aria-hidden="true">
          <img src={article.image} alt="" className="pagehero__img" />
          <div className="pagehero__veil" />
        </div>
        <div className="container jarticle-hero__inner">
          <Reveal>
            <Link to="/journal" className="jarticle__back"><ArrowLeft size={15} strokeWidth={2} /> Zurück zum Journal</Link>
            <span className="jarticle__meta"><span className="jfeat__cat">{article.category}</span><span className="jfeat__read"><Clock size={13} strokeWidth={2} /> {article.read} Lesezeit</span></span>
            <h1 className="jarticle__title">{article.title}</h1>
          </Reveal>
        </div>
      </section>

      {/* BODY */}
      <section className="section section--light jarticle-body-sec">
        <div className="container jarticle">
          <Reveal as="p" className="jarticle__intro">{article.intro}</Reveal>
          {article.sections.map((s, i) => (
            <Reveal key={s.h} className="jarticle__block" delay={(i % 3) * 0.04}>
              <h2 className="jarticle__h">{s.h}</h2>
              <p className="jarticle__p">{s.p}</p>
            </Reveal>
          ))}
          <Reveal className="jarticle__fazit">
            <span className="jarticle__fazit-k">Fazit</span>
            <p>{article.fazit}</p>
          </Reveal>
          <Reveal className="jarticle__cta">
            <CTAButton to="/beratung">Beratung anfragen</CTAButton>
            <CTAButton to="/stylefinder" variant="dark">Stylefinder starten</CTAButton>
          </Reveal>
        </div>
      </section>

      {/* INTERAKTIVES MODUL (nur auf der 7-Küchenfehler-Seite) */}
      {slug === GAME_SLUG && <KuechenfehlerGame />}

      {/* RELATED */}
      <section className="section section--light jarticle-related-sec">
        <div className="container">
          <h2 className="jarticle-related__title">Weiterlesen</h2>
          <div className="jgrid">
            {related.map((a, i) => (
              <Reveal key={a.slug} delay={(i % 3) * 0.06}>
                <Link to={`/journal/${a.slug}`} className="jcard">
                  <span className="jcard__media"><img src={a.image} alt="" loading="lazy" /><span className="jcard__badge">{a.category}</span></span>
                  <span className="jcard__body">
                    <span className="jcard__title">{a.title}</span>
                    <span className="jcard__teaser">{a.teaser}</span>
                    <span className="jcard__foot"><span className="jcard__read"><Clock size={13} strokeWidth={2} /> {a.read}</span><span className="jcard__arrow"><ArrowUpRight size={16} strokeWidth={2} /></span></span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
