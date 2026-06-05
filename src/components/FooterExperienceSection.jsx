import {
  Star, Award, ChefHat, Gem, MessageSquare,
  MapPin, LayoutGrid, Layers, ThumbsUp, Play, ArrowRight,
} from 'lucide-react'

import { Link } from 'react-router-dom'
import Reveal from './Reveal.jsx'
import CTAButton from './CTAButton.jsx'

import bgWide from '../assets/images/home/footer/footer-experience-bg-wide.png'
import bgMobile from '../assets/images/home/footer/footer-experience-bg-mobile.png'
import avatar1 from '../assets/images/home/footer/review-avatar-01.png'
import avatar2 from '../assets/images/home/footer/review-avatar-02.png'
import avatar3 from '../assets/images/home/footer/review-avatar-03.png'
import logoMark from '../assets/brand/logo-main.png'

const AVATARS = [avatar1, avatar2, avatar3]

// --- editable demo content (replace with real, verifiable values) ---
const RATING = { score: '4,9 / 5', basis: 'Basierend auf 250+ Bewertungen' }

const USPS = [
  { icon: Award, title: 'Award Winner', text: 'German Design Award 2023 & 2024' }, // DEMO – bei Bedarf ersetzen
  { icon: ChefHat, title: 'Über', text: '1.250 Küchen realisiert' },
  { icon: Gem, title: 'Premium Qualität', text: 'Ausgewählte Materialien & präzise Verarbeitung' },
  { icon: MessageSquare, title: 'Persönliche Beratung', text: 'Individuell, ehrlich und auf höchstem Niveau' },
]

const STATS = [
  { icon: MapPin, value: '250+', text: 'Showrooms & Partnerstandorte' }, // DEMO-Werte
  { icon: LayoutGrid, value: '20+', text: 'Küchenstile & Designlinien' },
  { icon: Layers, value: '50+', text: 'Exklusive Materialien von Bestmarken' },
  { icon: ThumbsUp, value: '98%', text: 'Weiterempfehlung & Kundenzufriedenheit' },
]

// neutral, verifiable text badges (no fabricated award logos)
const BADGES = ['Meisterbetrieb', 'Made in Germany', '15+ Jahre Erfahrung', 'Zertifizierte Planung', 'Eigene Montage']

export default function FooterExperienceSection() {
  return (
    <section className="fx" id="beratung">
      <div className="fx__bg" aria-hidden="true">
        <img src={bgWide} alt="" className="fx__bg-img fx__bg-img--wide" />
        <img src={bgMobile} alt="" className="fx__bg-img fx__bg-img--mobile" />
        <div className="fx__veil" />
      </div>

      <div className="container fx__inner">
        {/* brand + hero */}
        <Reveal className="fx__hero">
          <a className="fx__brand" href="#top" aria-label="VIDEKO">
            <img src={logoMark} alt="" className="fx__brand-logo" />
            <span className="fx__brand-text">
              <span className="fx__brand-name">VIDEKO</span>
              <span className="fx__brand-sub">Küchen</span>
            </span>
          </a>

          <span className="kicker kicker--gold">Küchen für Menschen mit Anspruch</span>
          <h2 className="fx__title">
            Bereit für ein<br />
            <span className="grad">besonderes Erlebnis?</span>
          </h2>
          <p className="fx__lead">
            Exklusive Küchenarchitektur, die Design, Funktion und Emotion in
            vollendeter Harmonie vereint.
          </p>

          <div className="fx__hero-actions">
            <CTAButton to="/beratung">Beratung buchen</CTAButton>

            <div className="fx__rating">
              <div className="fx__avatars">
                {AVATARS.map((a, i) => (
                  <span className="fx__avatar" key={i} style={{ zIndex: 3 - i }}>
                    <img src={a} alt="" />
                  </span>
                ))}
              </div>
              <div className="fx__rating-meta">
                <span className="fx__stars" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} size={13} strokeWidth={0} fill="currentColor" />
                  ))}
                  <strong>{RATING.score}</strong>
                </span>
                <span className="fx__rating-basis">{RATING.basis}</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* glass info cards */}
        <Reveal className="fx__cards" delay={0.05}>
          <div className="fxcard fxcard--trust">
            <div className="fxcard__lead">
              <h3>Vertrauen Sie<br />auf Erfahrung.</h3>
              <p>
                Seit über 15 Jahren schaffen wir außergewöhnliche Küchen für
                Menschen, die das Besondere wertschätzen.
              </p>
            </div>
            <div className="fxcard__usps">
              {USPS.map((u) => (
                <div className="fxusp" key={u.title}>
                  <span className="fxusp__icon" aria-hidden="true">
                    <u.icon size={20} strokeWidth={1.5} />
                  </span>
                  <span className="fxusp__title">{u.title}</span>
                  <span className="fxusp__text">{u.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fxcard fxcard--stats">
            {STATS.map((s) => (
              <div className="fxstat" key={s.value}>
                <span className="fxstat__icon" aria-hidden="true">
                  <s.icon size={18} strokeWidth={1.5} />
                </span>
                <span className="fxstat__value">{s.value}</span>
                <span className="fxstat__text">{s.text}</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* closing split */}
        <Reveal className="fx__close" delay={0.1}>
          <div className="fx__statement">
            <h3>
              Mehr als eine Küche.<br />
              <span className="grad">Ein Statement.</span>
            </h3>
            <p>
              Für Menschen, die keine Kompromisse machen. Lassen Sie uns gemeinsam
              Ihre Traumküche verwirklichen – einzigartig wie Sie.
            </p>
            <Link className="fx__play" to="/showroom">
              <span className="fx__play-disc">
                <Play size={15} strokeWidth={0} fill="currentColor" />
              </span>
              <span className="fx__play-label">
                <strong>VIDEKO erleben</strong>
                Showroom ansehen
              </span>
            </Link>
          </div>

          <div className="fx__ctacard">
            <div className="fx__ctacard-glow" aria-hidden="true" />
            <h3>Jetzt persönlichen<br />Beratungstermin sichern</h3>
            <p>Inspiration. Expertise. Exklusiv für Sie.</p>
            <CTAButton to="/beratung">Termin vereinbaren</CTAButton>
          </div>
        </Reveal>

        {/* trust badge row */}
        <Reveal className="fx__badges" delay={0.05}>
          <span className="fx__badges-title">Ausgezeichnet. Empfohlen. Vertraut.</span>
          <div className="fx__badges-row">
            {BADGES.map((b) => (
              <span className="fx__badge" key={b}>{b}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
