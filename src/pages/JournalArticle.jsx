import { useParams, Navigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Clock } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Img from '../components/Img.jsx'
import TextLink from '../components/TextLink.jsx'
import Seo from '../components/Seo.jsx'
import { journalArticles } from '../data/journal.js'
import { journalArticleHead } from '../data/head.js'

/**
 * Pro Artikel eine weiterfuehrende Seite, die zum Thema passt.
 *
 * Bis SEO-Phase 2 stand unter jedem Beitrag derselbe Satz mit demselben Link
 * auf /leistungen. Damit lief die gesamte Journalkraft auf eine einzige Seite,
 * und ein Beitrag über Arbeitsplatten verwies nicht auf die Seite, die genau
 * das behandelt. Fehlt ein Slug hier, greift STANDARD — kein Artikel bleibt
 * also ohne Anschluss.
 */
const WEITER = {
  'licht-in-der-kueche': {
    text: 'Wann Licht in der Planung entschieden wird – solange die Leitungswege offen sind – steht unter',
    label: 'Küchenplanung',
    to: '/planung',
  },
  'welche-arbeitsplatte-passt-zu-mir': {
    text: 'Was wir bei Material, Kante, Ausschnitten und Aufmaß übernehmen, steht auf der Seite zu',
    label: 'Arbeitsplatten',
    to: '/arbeitsplatten',
  },
  'offene-oder-geschlossene-kueche': {
    text: 'Wenn sich mit dem Grundriss auch Wände, Boden oder Decke ändern, wird daraus ein Umbau – wie der koordiniert wird, steht unter',
    label: 'Alles aus einer Hand',
    to: '/alles-aus-einer-hand',
  },
  'fronten-farben-materialien': {
    text: 'Oberflächen entscheidet man am besten nebeneinander im echten Licht – dazu gibt es unser',
    label: 'Küchenstudio in Würzburg',
    to: '/studio',
  },
  'vor-dem-beratungstermin-das-solltest-du-wissen': {
    text: 'Wie das Erstgespräch bei uns abläuft und was du mitbringen kannst, steht unter',
    label: 'Küchenberatung',
    to: '/beratung',
  },
  'mehr-stauraum-weniger-chaos': {
    text: 'Stauraum entsteht dort, wo für den vorhandenen Raum geplant wird – mehr dazu unter',
    label: 'Küchen nach Maß',
    to: '/kuechen-nach-mass',
  },
  '7-kuechenfehler-die-du-spaeter-jeden-tag-bereust': {
    text: 'Die meisten dieser Fehler entscheiden sich lange vor dem Aufmaß – wie wir sie vermeiden, steht unter',
    label: 'Küchenplanung',
    to: '/planung',
  },
  'geraete-richtig-planen': {
    text: 'Geräte gehören in die Planung und nicht in die Restlücke – wie wir das machen, steht unter',
    label: 'Küchenplanung',
    to: '/planung',
  },
  'pflegeleichte-kueche': {
    text: 'Welche Oberfläche im Alltag wirklich pflegeleicht ist, klären wir auf der Seite zu',
    label: 'Arbeitsplatten',
    to: '/arbeitsplatten',
  },
}

const STANDARD = {
  text: 'Wie so ein Projekt bei VIDEKO abläuft, steht unter',
  label: 'Leistungen',
  to: '/leistungen',
}

export default function JournalArticle() {
  const { slug } = useParams()
  const article = journalArticles.find((a) => a.slug === slug)
  if (!article) return <Navigate to="/journal" replace />

  const related = journalArticles.filter((a) => a.slug !== slug).slice(0, 3)
  const weiter = WEITER[slug] || STANDARD

  return (
    <div className="journal-page jarticle-page">
      {/* Title und Description kommen aus journal.js – dort gepflegt, hier nur
          verwendet. Das Artikelbild ist zugleich das OG-Bild. Derselbe Builder
          erzeugt das vorgerenderte HTML in scripts/prerender.mjs. */}
      <Seo {...journalArticleHead(article)} />
      {/* HERO */}
      <section className="pagehero jarticle-hero">
        <div className="pagehero__media" aria-hidden="true">
          {/* LCP-Element des Artikels. Im Audit lag der LCP hier mobil bei
              18,8 s — unpriorisiertes 2 MB-PNG. Jetzt WebP, eager, high. */}
          <Img src={article.image} alt="" className="pagehero__img" priority sizes="100vw" />
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
            <Reveal key={i} className="jarticle__block" delay={(i % 3) * 0.04}>
              {s.h && <h2 className="jarticle__h">{s.h}</h2>}
              <p className="jarticle__p">{s.p}</p>
            </Reveal>
          ))}
          <Reveal className="jarticle__fazit">
            <span className="jarticle__fazit-k">Fazit</span>
            <p>{article.fazit}</p>
          </Reveal>
          <Reveal as="p" className="jarticle__weiter">
            {weiter.text}{' '}
            <TextLink href={weiter.to}>{weiter.label}</TextLink>.
          </Reveal>
          <Reveal className="jarticle__cta">
            <CTAButton to="/beratung">Beratung anfragen</CTAButton>
            <CTAButton to="/stylefinder" variant="dark">Stylefinder starten</CTAButton>
          </Reveal>
        </div>
      </section>

      {/* RELATED */}
      <section className="section section--light jarticle-related-sec">
        <div className="container">
          <h2 className="jarticle-related__title">Weiterlesen</h2>
          <div className="jgrid">
            {related.map((a, i) => (
              <Reveal key={a.slug} delay={(i % 3) * 0.06}>
                <Link to={`/journal/${a.slug}`} className="jcard">
                  <span className="jcard__media"><Img src={a.image} alt="" sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 380px" defer /><span className="jcard__badge">{a.category}</span></span>
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
