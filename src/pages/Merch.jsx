import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight, Search, SlidersHorizontal, BadgeCheck, Mail, ShieldCheck, Info,
  Plus, Minus, Sparkles, Leaf, Clock, Heart,
} from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import Seo from '../components/Seo.jsx'
import ProductCard from '../components/merch/ProductCard.jsx'
import FamilyCard from '../components/merch/FamilyCard.jsx'
import ProductGallery from '../components/merch/ProductGallery.jsx'
import PerformanceSection from '../components/merch/PerformanceSection.jsx'
import {
  MERCH_FAMILIES, ACCESSORY_PRODUCTS, MERCH_TABS, MERCH_SORTS, passtZuTab,
  LOGO_STYLE_ORDER, LOGO_STYLE_INFO, WORKWEAR_PRODUCTS,
  formatPrice, getProduct,
  PERSONALIZATION_MAX, PERSONALIZATION_LABEL, LEAD_TIME_PERSONALIZED,
  SHOW_PUBLIC_PRICES, PRICE_ON_REQUEST,
} from '../data/merch.js'
import { inquiryReady } from '../data/release.js'

import heroBanner from '../assets/images/merch/_shared/merch-hero.webp'
import pBossBattle from '../assets/images/merch/accessories/accessoire-boss-battle-schwarz-gold.webp'

// Motive der Stil-Sektion „Dein Logo. Dein Stil.“ – bewusst dedizierte,
// eigene Dateien (entkoppelt von den Produktbildern, die sich ändern können).
import stilSignature from '../assets/images/merch/_shared/stil-signature.webp'
import stilPure from '../assets/images/merch/_shared/stil-pure.webp'
import stilOne from '../assets/images/merch/_shared/stil-one.webp'
import stilPrestige from '../assets/images/merch/_shared/stil-prestige.webp'

// Bild + Alt-Text + Badge-Variante je Stil-Karte. key = LOGO_STYLE_ORDER-Key,
// damit der Klick die BESTEHENDE Filterlogik (stilWaehlen) nutzt.
const STIL_KARTEN = {
  SIGNATURE: { img: stilSignature, badge: 'gold', desc: 'Klassisches VIDEKO Küchen Logo.', alt: 'Signature – schwarzes T-Shirt mit großem VIDEKO Küchen Logo auf der Brust' },
  PURE: { img: stilPure, badge: 'gold', desc: 'Druck mit Emblem und VIDEKO.', alt: 'Pure – weißes T-Shirt mit Emblem und VIDEKO Schriftzug auf der Brust' },
  ONE: { img: stilOne, badge: 'dark', desc: 'Nur das Emblem – klein auf der Brust.', alt: 'One – schwarzes T-Shirt mit kleinem VIDEKO Emblem auf der Brust' },
  PRESTIGE: { img: stilPrestige, badge: 'dark', desc: 'Flock-Veredelung in verschiedenen Farben.', alt: 'Prestige – weißes T-Shirt mit weißer Flock-Veredelung, Emblem und VIDEKO Schriftzug' },
}

const SEITE = 12

// Shop-Zustand (Kategorie, Filter, Sortierung, „Mehr laden") je History-Eintrag
// sichern, damit „Zurueck" aus einem Produkt exakt denselben Shop wiederfindet –
// gleiche Auswahl UND gleiche Hoehe, sodass die Scrollposition wieder passt.
const STATE_PREFIX = 'videko:merch-state:'

const ladeShopState = (key) => {
  try {
    const roh = sessionStorage.getItem(STATE_PREFIX + key)
    return roh ? JSON.parse(roh) : {}
  } catch { return {} }
}
const speichereShopState = (key, state) => {
  try { sessionStorage.setItem(STATE_PREFIX + key, JSON.stringify(state)) } catch { /* Storage evtl. gesperrt */ }
}

// Anfragemodell (Livegang-Audit, § 2): KEINE Kauf-/Zahlungs-/Versand-/Widerrufs-
// Zusagen mehr. Preis, Versand und Widerrufsbedingungen entstehen erst mit dem
// individuellen Angebot per E-Mail.
const BENEFITS = [
  { icon: BadgeCheck, title: 'Premium Qualität', text: 'Hochwertige Materialien für langen Tragekomfort.' },
  { icon: Mail, title: 'Unverbindlich anfragen', text: 'Individuelles Angebot per E-Mail – ganz ohne Bestellung.' },
  { icon: ShieldCheck, title: 'Sichere Verbindung', text: 'SSL-verschlüsselte Übertragung deiner Angaben.' },
  { icon: Info, title: 'Persönliche Antwort', text: 'Wir melden uns individuell per E-Mail zurück.' },
]

const WERTE = [
  { icon: Sparkles, title: 'Zeitloses Design', text: 'Klar. Modern. Edel.' },
  { icon: Leaf, title: 'Hochwertige Materialien', text: 'Langlebig & bequem.' },
  { icon: Clock, title: 'Für deinen Alltag', text: 'Gemacht für jeden Tag.' },
  { icon: Heart, title: 'Mit Liebe veredelt', text: 'Details, die den Unterschied machen.' },
]

const featured = getProduct('signature-hoodie-white')
const bossBattle = getProduct('boss-battle')
const signature = getProduct('signature-t-shirt-black')
const workwearTeaser = getProduct('workwear-polo-black') // Sammel-CTA der Workwear-Sektion

const FAQ = [
  {
    q: 'Wie läuft eine Anfrage ab?',
    // Solange nur die Produktvorschau (RELEASE_STAGE='preview') freigegeben ist,
    // gibt es bewusst noch keinen Anfrage-Button. Der Ablauf wird erst
    // beschrieben, wenn die Anfrage tatsächlich aktiv ist (Stufe 'inquiry').
    a: inquiryReady
      ? 'Ganz unverbindlich per E-Mail. Auf der Produktseite tippst du auf „Unverbindlich per E-Mail anfragen“ – es öffnet sich eine vorbereitete Mail mit deiner Auswahl (Farbe, Größe, Logoausführung, Anzahl). Es gibt keinen Warenkorb und keinen Online-Checkout. Mit dem Absenden entsteht noch keine Bestellung; wir melden uns anschließend mit einem individuellen Angebot.'
      : 'Der Merch-Bereich ist aktuell eine unverbindliche Produktvorschau. Es gibt bewusst noch keinen Warenkorb, keinen Online-Checkout und keine Anfrage- oder Bestellfunktion. Sobald die Anfrage freigeschaltet ist, kannst du dein Wunschprodukt unverbindlich per E-Mail anfragen und erhältst anschließend ein individuelles Angebot.',
  },
  {
    q: 'Was kostet ein Shirt und wie hoch ist der Versand?',
    a: 'Preis und Versandkosten nennen wir dir mit unserem individuellen Angebot per E-Mail. So können wir Anzahl, Farbe, Größe und Logoausführung sauber berücksichtigen.',
  },
  {
    q: 'Wie lange dauert die Lieferung?',
    a: `Die voraussichtliche Fertigungs- und Lieferzeit beträgt ${signature.lead_time}; personalisierte Shirts werden einzeln veredelt, dort rechne bitte mit ${LEAD_TIME_PERSONALIZED}. Die verbindlichen Angaben erhältst du mit deinem individuellen Angebot.`,
  },
  {
    q: 'Warum sind so viele Produkte „Coming Soon“?',
    a: 'Weil wir sie noch nicht in der Hand hatten. Wir geben nichts frei, was wir nicht selbst getragen oder benutzt haben. Die T-Shirts sind durch, der Rest folgt Stück für Stück. Bis dahin sind diese Artikel als „Demnächst verfügbar“ gekennzeichnet.',
  },
  {
    q: 'Wie funktioniert die Personalisierung?',
    a: `Auf der Produktseite hakst du „${PERSONALIZATION_LABEL}“ an und tippst den Namen ein – bis zu ${PERSONALIZATION_MAX} Zeichen. Ein möglicher Aufpreis für die Personalisierung wird im individuellen Angebot ausgewiesen.`,
  },
  {
    q: 'Sind die abgebildeten Produkte schon final?',
    a: 'Die Abbildungen sind derzeit Musteransichten, die Farben und Schnitte zeigen. Sobald die ersten Serien produziert sind, ersetzen wir sie durch echte Produktfotos.',
  },
]

export default function Merch() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '8%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.03, 1.1])

  const { hash, key } = useLocation()

  // Anker aus dem Footer (#shop, #faq) anspringen – der Router tut das nicht von selbst
  useEffect(() => {
    if (!hash) return
    const ziel = document.getElementById(hash.slice(1))
    if (ziel) requestAnimationFrame(() => ziel.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [hash])

  // Gespeicherten Shop-Zustand EINMAL beim Mount lesen (synchron), damit das
  // Grid sofort in der richtigen Groesse rendert und die Scrollposition passt.
  const startRef = useRef(null)
  if (startRef.current === null) startRef.current = ladeShopState(key)
  const start = startRef.current

  const [tab, setTab] = useState(start.tab ?? 'alle')
  const [stil, setStil] = useState(start.stil ?? null) // Logo-Stil-Filter aus der Stil-Sektion
  const [suche, setSuche] = useState(start.suche ?? '')
  const [sort, setSort] = useState(start.sort ?? 'beliebt')
  const [nurVerfuegbar, setNurVerfuegbar] = useState(start.nurVerfuegbar ?? false)
  const [anzahl, setAnzahl] = useState(start.anzahl ?? SEITE)
  const [accAlle, setAccAlle] = useState(start.accAlle ?? false) // Accessoires ein-/ausklappen
  const [openFaq, setOpenFaq] = useState(0)
  const [hoodieSize, setHoodieSize] = useState('M')

  // Zustand bei jeder Aenderung fuer diesen History-Eintrag sichern.
  useEffect(() => {
    speichereShopState(key, { tab, stil, suche, sort, nurVerfuegbar, anzahl, accAlle })
  }, [key, tab, stil, suche, sort, nurVerfuegbar, anzahl, accAlle])

  const zumShop = (naechsterTab) => {
    if (naechsterTab) { setTab(naechsterTab); setAnzahl(SEITE) }
    document.getElementById('bekleidung')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Klick auf eine Logo-Stil-Karte filtert die Bekleidung auf Familien mit diesem Stil
  const stilWaehlen = (key) => {
    setStil((cur) => (cur === key ? null : key))
    setTab('alle'); setAnzahl(SEITE)
    document.getElementById('bekleidung')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const preisVon = (f) => (f.priceFrom == null ? Number.MAX_SAFE_INTEGER : f.priceFrom)

  // Bekleidung = nur Produktfamilien (Accessoires haben eine eigene Sektion)
  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()
    const list = MERCH_FAMILIES.filter((f) => {
      if (!passtZuTab(f, tab)) return false
      if (stil && !f.styles.includes(stil)) return false
      if (nurVerfuegbar && f.allSoon) return false
      if (q && !`${f.label} ${f.styles.join(' ')}`.toLowerCase().includes(q)) return false
      return true
    })
    if (sort === 'preis-auf') return [...list].sort((a, b) => preisVon(a) - preisVon(b))
    if (sort === 'preis-ab') return [...list].sort((a, b) => preisVon(b) - preisVon(a))
    if (sort === 'neu') return [...list].reverse()
    return list
  }, [tab, stil, suche, sort, nurVerfuegbar])

  const sichtbar = gefiltert.slice(0, anzahl)
  const ACC_VORSCHAU = 8
  const accSichtbar = accAlle ? ACCESSORY_PRODUCTS : ACCESSORY_PRODUCTS.slice(0, ACC_VORSCHAU)

  return (
    <main className="merch">
      <Seo
        title="VIDEKO Merch – Kollektion zum Anziehen"
        description="Hochwertiger VIDEKO Merch: T-Shirts, Hoodies, Polos und Accessoires in den Stilen Signature, Pure, One und Prestige. Personalisierbar, in Premium-Qualität."
        canonicalPath="/merch"
      />
      {/* ---------- Hero: volle Breite, Text als Overlay ---------- */}
      <section className="merch-hero merch-hero--full" ref={heroRef}>
        <motion.div className="merch-hero__media" style={{ y: imgY, scale: imgScale }}>
          <img src={heroBanner} alt="VIDEKO Merch – Modelle mit Bekleidung der Kollektion" fetchPriority="high" decoding="async" width="1600" height="900" />
        </motion.div>
        <div className="merch-hero__veil" aria-hidden="true" />

        <div className="container merch-hero__inner">
          <div className="merch-hero__copy">
            <h1 className="merch-hero__title">
              VIDEKO zum Anziehen.
              <span>Für alle, die mehr vorhaben.</span>
            </h1>
            <p className="merch-hero__lead">
              Hochwertiger Merch für Menschen, die VIDEKO nicht nur gut finden, sondern tragen.
            </p>
            <div className="merch-hero__cta">
              <button type="button" className="btn btn--gold" onClick={() => zumShop('alle')}>
                Kollektion entdecken <ArrowRight size={16} strokeWidth={1.9} />
              </button>
              <button type="button" className="btn btn--ghostlight" onClick={() => zumShop('tshirts')}>
                Alle T-Shirts ansehen <ArrowRight size={16} strokeWidth={1.9} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Leistungsversprechen ---------- */}
      <section className="mben">
        <div className="container mben__grid">
          {BENEFITS.map((b) => (
            <div className="mben__item" key={b.title}>
              <span className="mben__icon"><b.icon size={19} strokeWidth={1.5} /></span>
              <div>
                <strong>{b.title}</strong>
                <span>{b.text}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Logo-Stile erklären ---------- */}
      <section className="mstyles">
        <div className="container">
          <Reveal as="header" className="mstyles__head">
            <span className="eyebrow">Vier Stile, ein Emblem</span>
            <h2>Dein Logo. Dein Stil.</h2>
            <p>Jedes Modell gibt es in bis zu vier Ausführungen. Wähle deinen Stil – die Details legst du auf der Produktseite fest.</p>
          </Reveal>
          <div className="mstyles__grid" role="group" aria-label="Nach Logo-Stil filtern">
            {LOGO_STYLE_ORDER.map((key, i) => {
              const k = STIL_KARTEN[key]
              return (
                <Reveal
                  as="button"
                  key={key}
                  type="button"
                  className={`mstyle ${stil === key ? 'is-active' : ''}`.trim()}
                  onClick={() => stilWaehlen(key)}
                  aria-pressed={stil === key}
                  delay={(i % 4) * 0.05}
                >
                  <span className="mstyle__media">
                    <img
                      src={k.img}
                      alt={k.alt}
                      loading="lazy"
                      decoding="async"
                      width="1100"
                      height="1100"
                    />
                  </span>
                  <span className="mstyle__body">
                    <span className={`mstyle__tag mstyle__tag--${k.badge}`}>{LOGO_STYLE_INFO[key].label}</span>
                    <span className="mstyle__desc">{k.desc}</span>
                  </span>
                </Reveal>
              )
            })}
          </div>
          {stil && (
            <button type="button" className="mstyles__reset" onClick={() => setStil(null)}>
              Stil-Filter zurücksetzen
            </button>
          )}
        </div>
      </section>

      {/* ---------- Featured: Hoodie (Auftakt Bekleidung) ---------- */}
      <section className="mfeat">
        <div className="container mfeat__grid">
          <Reveal className="mfeat__media">
            <ProductGallery images={featured.gallery} alt={featured.name} />
          </Reveal>

          <Reveal className="mfeat__info" delay={0.08}>
            <span className="mfeat__crumbs">{featured.kicker}</span>
            <h2 className="mfeat__title">VIDEKO <em>Hoodie</em></h2>
            <p className="mfeat__variant">{featured.tagline}</p>

            <div className="mfeat__priceline">
              <span className="mfeat__price">{!SHOW_PUBLIC_PRICES ? PRICE_ON_REQUEST : featured.price == null ? featured.priceNote : formatPrice(featured.price)}</span>
              <span className="mfeat__badge"><Clock size={12} strokeWidth={2} /> {featured.badge}</span>
            </div>

            <p className="mfeat__desc">{featured.description}</p>

            <div className="mfeat__usps">
              {featured.usps.map((u) => <span key={u}>{u}</span>)}
            </div>

            <span className="mfeat__label">Größe</span>
            <div className="mfeat__sizes" role="group" aria-label="Größe wählen">
              {featured.sizes.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`mfeat__size ${hoodieSize === s ? 'is-active' : ''}`.trim()}
                  onClick={() => setHoodieSize(s)}
                  aria-pressed={hoodieSize === s}
                >
                  {s}
                </button>
              ))}
            </div>

            <span className="mfeat__cta mfeat__cta--soon" aria-disabled="true">
              <Clock size={16} strokeWidth={1.8} /> Demnächst verfügbar
            </span>

            <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link className="mfeat__more" to={`/merch/${featured.slug}`}>
                Alle Details zum Hoodie <ArrowRight size={14} strokeWidth={2} />
              </Link>
              <a
                className="mfeat__more"
                href="#bekleidung"
                onClick={(e) => { e.preventDefault(); zumShop('hoodies') }}
              >
                Zu allen Hoodies <ArrowRight size={14} strokeWidth={2} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Bekleidung: Filter und Familien-Grid ---------- */}
      <section className="mshop" id="bekleidung">
        <div className="container">
          <Reveal as="header" className="mshop__head">
            <h2>Bekleidung</h2>
            <div className="mshop__tabs" role="tablist" aria-label="Kategorie">
              {MERCH_TABS.map((t) => (
                <button
                  type="button"
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  className={`mshop__tab ${tab === t.key ? 'is-active' : ''}`.trim()}
                  onClick={() => { setTab(t.key); setAnzahl(SEITE) }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="mshop__bar">
            <label className="mshop__search">
              <Search size={16} strokeWidth={1.8} />
              <input
                type="search"
                value={suche}
                onChange={(e) => { setSuche(e.target.value); setAnzahl(SEITE) }}
                placeholder="Suche nach Produkten…"
                aria-label="Produkte durchsuchen"
              />
            </label>

            <label className="mshop__toggle">
              <input
                type="checkbox"
                checked={nurVerfuegbar}
                onChange={(e) => { setNurVerfuegbar(e.target.checked); setAnzahl(SEITE) }}
              />
              <span>Nur sofort verfügbar</span>
            </label>

            <label className="mshop__sort">
              <SlidersHorizontal size={15} strokeWidth={1.8} />
              <span className="sr-only">Sortierung</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sortierung">
                {MERCH_SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>

            <span className="mshop__count">{gefiltert.length} Modelle</span>
          </div>

          {sichtbar.length === 0 ? (
            <p className="mshop__leer">
              Dafür haben wir gerade nichts. Setz den Filter zurück oder such nach etwas anderem.
            </p>
          ) : (
            <div className="mgrid">
              {sichtbar.map((f, i) => <FamilyCard key={f.key} family={f} delay={(i % 4) * 0.05} />)}
            </div>
          )}

          {sichtbar.length < gefiltert.length && (
            <div className="mshop__more">
              <button type="button" onClick={() => setAnzahl((n) => n + SEITE)}>
                Mehr laden ({gefiltert.length - sichtbar.length})
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ---------- VIDEKO PERFORMANCE: eigenständige Sport-Kollektion (Coming Soon) ---------- */}
      <PerformanceSection />

      {/* ---------- Workwear-Teaser: gebündelt statt Platzhalterkarten ---------- */}
      <section className="mwork">
        <div className="container mwork__inner">
          <Reveal className="mwork__copy">
            <span className="eyebrow">In Arbeit</span>
            <h2>WORKWEAR. Gerade noch in Arbeit.</h2>
            <p>
              Polo, Softshell, Overshirt und mehr folgen. Robust genug für die Baustelle.
              Sauber genug fürs Studio.
            </p>
            <span className="mwork__cta mwork__cta--soon" aria-disabled="true">
              <Clock size={16} strokeWidth={1.8} /> Demnächst verfügbar
            </span>
          </Reveal>
          <Reveal className="mwork__list" delay={0.08}>
            {[...new Set(WORKWEAR_PRODUCTS.map((w) => w.name.replace(/ Schwarz| Weiß/g, '')))].map((name) => (
              <span className="mwork__chip" key={name}>{name}</span>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ---------- Accessoires: eigene Sektion mit Einblenden ---------- */}
      <section className="macc" id="accessoires">
        <div className="container">
          <Reveal as="header" className="mshop__head macc__head">
            <h2>Accessoires</h2>
            <p>Cap, Beanie, Tasche und mehr – die kleinen Begleiter zur Kollektion.</p>
          </Reveal>
          <div className="mgrid">
            {accSichtbar.map((p, i) => <ProductCard key={p.id} product={p} delay={(i % 4) * 0.05} />)}
          </div>
          {ACCESSORY_PRODUCTS.length > ACC_VORSCHAU && (
            <div className="mshop__more">
              <button
                type="button"
                onClick={() => setAccAlle((v) => !v)}
                aria-expanded={accAlle}
                aria-controls="accessoires"
              >
                {accAlle ? 'Weniger anzeigen' : `Alle Accessoires anzeigen (${ACCESSORY_PRODUCTS.length})`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Boss-BATTLE: Marble-Gold ---------- */}
      <section className="mgames mgames--marble">
        <span className="mgames__vein" aria-hidden="true" />
        <div className="container mgames__inner">
          <Reveal className="mgames__copy">
            <span className="mgames__kicker">Demnächst</span>
            <h2>Boss-BATTLE</h2>
            <p className="mgames__sub">
              Schnell gespielt, leichte Regeln – mit einer eigenen Mechanik,
              vertraut wie ein Klassiker à la UNO, aber mit Karten aus der Community.
            </p>
            <p className="mgames__sub">
              Jede Karte ist eine echte Person, und jeder kann dabei sein. Sobald die
              nächsten 45 Karten voll sind, geht diese Auflage in den Druck. Mitmachen?
              Melde dich auf Instagram{' '}
              <a
                className="mgames__ig"
                href="https://instagram.com/videko.kuechen"
                target="_blank"
                rel="noreferrer"
              >
                @videko.kuechen
              </a>
              .
            </p>
            <div className="mgames__actions">
              <span className="mgames__cta mgames__cta--soon" aria-disabled="true">
                <Clock size={15} strokeWidth={1.8} /> Demnächst verfügbar
              </span>
              <Link className="mgames__link" to={`/merch/${bossBattle.slug}`}>
                Zum Produkt <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          </Reveal>
          <Reveal className="mgames__media" delay={0.08}>
            <div className="mgames__card">
              <img src={pBossBattle} alt={bossBattle.name} loading="lazy" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Statement: bewusst ohne Bild, breiter Textblock ---------- */}
      <section className="mstate mstate--text mstate--compact">
        <div className="container mstate__body">
          <Reveal>
            <span className="eyebrow">Unsere Mission</span>
            <h2 className="mstate__title">
              Teil der VIDEKO Welt.
              <em>Für jeden Tag.</em>
            </h2>
            <p className="mstate__lead">
              Unsere Produkte stehen für die Werte von VIDEKO: Anspruch, Verlässlichkeit und
              Leidenschaft fürs Detail. Was wir in eine Küche stecken, steckt auch in einem Shirt –
              gute Materialien, saubere Verarbeitung und ein Design, das in fünf Jahren noch stimmt.
            </p>
            <p className="mstate__lead">
              Für Menschen, die mehr vorhaben. Und für alle, die VIDEKO nicht nur gut finden,
              sondern tragen.
            </p>
            <div className="mstate__werte">
              {WERTE.map((w) => (
                <div className="mstate__wert" key={w.title}>
                  <w.icon size={17} strokeWidth={1.5} />
                  <div>
                    <strong>{w.title}</strong>
                    <span>{w.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mfaq" id="faq">
        <div className="container">
          <Reveal as="header" className="mfaq__head">
            <h2>Häufige Fragen</h2>
          </Reveal>
          <div className="mfaq__grid">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} as="div" className={`jacc ${openFaq === i ? 'is-open' : ''}`} delay={(i % 2) * 0.05}>
                <button
                  type="button"
                  className="jacc__q"
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{f.q}</span>
                  <span className="jacc__icon">
                    {openFaq === i ? <Minus size={16} strokeWidth={2.2} /> : <Plus size={16} strokeWidth={2.2} />}
                  </span>
                </button>
                <div className="jacc__a">
                  <div className="jacc__a-in"><p>{f.a}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
