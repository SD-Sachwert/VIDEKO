import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams, useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  Mail, Heart, Minus, Plus, Truck, Info,
  ShieldCheck, Headphones, Ruler, ArrowLeft, ShoppingBag, Check, BellRing,
} from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import Seo from '../components/Seo.jsx'
import { familyJsonLd } from '../components/seo-jsonld.js'
import { merchDetailHead } from '../data/head.js'
import ProductGallery from '../components/merch/ProductGallery.jsx'
import ProductCard from '../components/merch/ProductCard.jsx'
import FamilyCard from '../components/merch/FamilyCard.jsx'
import NotifyModal from '../components/merch/NotifyModal.jsx'
import PersonalisierungHinweis from '../components/merch/PersonalisierungHinweis.jsx'
import { useCart } from '../shop/cart-context.js'
import { sendInterest, interestAlreadySent } from '../shop/notify.js'
import {
  getProduct, getFamilyOfProduct, getRelated, MERCH_FAMILIES,
  formatPrice, personalizationPrice, getSizeGuide,
  PERSONALIZATION_MAX, PERSONALIZATION_LABEL, FREE_SHIPPING_FROM, LOGO_STYLE_INFO,
  LOGO_COLOR_ORDER, isPlaceholderStatus, IMAGE_STATUS_TITLE,
  SHOW_PUBLIC_PRICES, PRICE_ON_REQUEST, PRICE_INQUIRY_NOTE, skuFor,
  merchCanonicalSlug,
} from '../data/merch.js'
import { INQUIRY_DISCLAIMER } from '../shop/inquiry.js'
import { priceView } from '../data/pricing.js'
import { publicCompliance, getProductFamily } from '../data/compliance.js'
import { canInquire, materialConfirmed, PREVIEW_NOTE } from '../data/release.js'

/**
 * Erlaubt nur Zeichen, die sich sauber drucken lassen: Buchstaben, Ziffern,
 * Leerzeichen und einfache Satzzeichen. Emojis und Symbole fallen weg.
 */
const nurDruckbar = (text) => text.replace(/[^\p{L}\p{N} .,'&-]/gu, '')

// Anfragemodell: keine Kauf-/Versand-/Zahlungs-Zusagen mehr auf der Produktseite.
// Preis, Versandkosten und Widerrufsbedingungen entstehen erst mit dem
// individuellen Angebot per E-Mail.
const SERVICE = [
  { icon: Mail, title: 'Unverbindlich anfragen', text: 'Du erhältst ein individuelles Angebot' },
  { icon: Info, title: 'Keine Bestellung', text: 'Die Anfrage löst keinen Kauf aus' },
  { icon: ShieldCheck, title: 'Sichere Verbindung', text: 'SSL-verschlüsselte Übertragung' },
  { icon: Headphones, title: 'Kontakt', text: 'Antwort persönlich per E-Mail' },
]

/**
 * Zurueck genau dorthin, wo der Nutzer herkam (inkl. Scrollposition/Filter –
 * die Position wird im Layout je Verlaufseintrag wiederhergestellt). Wurde die
 * Produktseite direkt geoeffnet (kein In-App-Verlauf), faellt es sauber auf die
 * Shop-Uebersicht zurueck.
 */
function useZurueck() {
  const navigate = useNavigate()
  const location = useLocation()
  return () => {
    if (location.key && location.key !== 'default') navigate(-1)
    else navigate('/merch')
  }
}

export default function ProductDetail() {
  const { slug } = useParams()
  const product = getProduct(slug)
  if (!product) return <Navigate to="/merch" replace />
  const family = getFamilyOfProduct(product)
  // Familienprodukte (Bekleidung) laufen ueber den Konfigurator, Accessoires
  // und Workwear als klassische Einzelseite.
  return family
    ? <Konfigurator key={family.key} family={family} start={product} />
    : <Einzelseite key={product.id} product={product} />
}

/* ============================================================
   Gemeinsame Bausteine
   ============================================================ */

function InfoBloecke({ product, material, care, lead, soon, size, sizeGuide }) {
  const [offen, setOffen] = useState(0)
  const comp = publicCompliance(product)
  const m = comp.manufacturer
  // § 9: Material nur dann als Tatsache zeigen, wenn es für ein verkaufsrelevantes
  // Produkt durch einen echten Beleg bestätigt ist. Reine Coming-soon-Vorschauen
  // ohne Blankware-Familie zeigen ihre Materialangabe weiter als Vorschauwert.
  const family = getProductFamily(product)
  const materialOk = !family || materialConfirmed(product)
  const materialPending = 'Die genaue Materialzusammensetzung wird vor dem Verkaufsstart anhand der Lieferantenangaben bestätigt.'
  const infos = [
    {
      title: 'Material & Pflege',
      text: materialOk ? `${material}. ${care}.` : `${care}. ${materialPending}`,
    },
    {
      title: 'Lieferzeit & Versand',
      text: soon
        ? `Dieser Artikel ist noch nicht bestellbar. ${lead}.`
        : SHOW_PUBLIC_PRICES
          ? `Versand innerhalb von ${lead}. Ab ${formatPrice(FREE_SHIPPING_FROM)} Bestellwert liefern wir versandkostenfrei.`
          : `Die voraussichtliche Fertigungs- und Lieferzeit beträgt ${lead}. Die genauen Versandkosten nennen wir dir mit unserem individuellen Angebot.`,
    },
    {
      title: 'Rückgabe & Widerruf',
      text: 'Über die Website kommt kein Kauf zustande – du sendest nur eine unverbindliche Anfrage. Kommt später auf Basis unseres Angebots ein Kauf zustande, gelten die gesetzlichen Widerrufsbedingungen; die Einzelheiten – auch die Einschränkungen bei personalisierten Artikeln – erhältst du mit dem Angebot.',
    },
    {
      // Pflichtangaben nach Textilkennzeichnungs-VO und GPSR Art. 16
      // (Hersteller/verantwortliches Unternehmen mit Anschrift & Kontakt).
      title: 'Hersteller & Produktangaben',
      body: (
        <dl className="pdp__facts">
          <div><dt>Marke</dt><dd>{comp.brand}</dd></div>
          <div><dt>Produktart</dt><dd>{comp.productType}</dd></div>
          <div><dt>Artikelnummer</dt><dd>{comp.sku || <em>wird ergänzt</em>}</dd></div>
          <div><dt>Material</dt><dd>{materialOk ? (comp.material || <em>wird ergänzt</em>) : <em>wird vor Verkaufsstart bestätigt</em>}</dd></div>
          <div><dt>Pflege</dt><dd>{comp.care || <em>wird ergänzt</em>}</dd></div>
          <div><dt>Herkunft</dt><dd>{comp.countryOfOrigin || <em>wird vor Verkaufsstart ergänzt</em>}</dd></div>
          <div>
            <dt>Hersteller / verantwortliches Unternehmen</dt>
            <dd>
              {m.brandLine}<br />
              {m.roleLine}<br />
              {m.companyName}<br />
              {m.street && <>{m.street}<br /></>}
              {(m.postalCode || m.city) && <>{m.postalCode} {m.city}, {m.country}<br /></>}
              <a href={`mailto:${m.email}`}>{m.email}</a>
            </dd>
          </div>
          {comp.safetyNotice && (
            <div><dt>Sicherheitshinweis</dt><dd>{comp.safetyNotice}</dd></div>
          )}
        </dl>
      ),
    },
  ]
  return (
    <section className="pdp__infos">
      <div className="container">
        {infos.map((b, i) => (
          <div key={b.title} className={`jacc jacc--light ${offen === i ? 'is-open' : ''}`}>
            <button type="button" className="jacc__q" onClick={() => setOffen(offen === i ? -1 : i)} aria-expanded={offen === i}>
              <span>{b.title}</span>
              <span className="jacc__icon">{offen === i ? <Minus size={16} strokeWidth={2.2} /> : <Plus size={16} strokeWidth={2.2} />}</span>
            </button>
            <div className="jacc__a"><div className="jacc__a-in">{b.body ? b.body : <p>{b.text}</p>}</div></div>
          </div>
        ))}

        {sizeGuide && (
          <div className={`jacc jacc--light ${offen === infos.length ? 'is-open' : ''}`}>
            <button type="button" className="jacc__q" onClick={() => setOffen(offen === infos.length ? -1 : infos.length)} aria-expanded={offen === infos.length}>
              <span>Größentabelle · {sizeGuide.title}</span>
              <span className="jacc__icon">{offen === infos.length ? <Minus size={16} strokeWidth={2.2} /> : <Plus size={16} strokeWidth={2.2} />}</span>
            </button>
            <div className="jacc__a">
              <div className="jacc__a-in">
                <div className="sizetable__wrap">
                  <table className="sizetable">
                    <thead><tr>{sizeGuide.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {sizeGuide.rows.map((r) => (
                        <tr key={r[0]} className={r[0] === size ? 'is-active' : undefined}>
                          {r.map((z, i) => <td key={i}>{z}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="sizetable__note">
                  {sizeGuide.note} Die Werte sind vorbereitete Richtwerte und werden vor dem
                  Verkaufsstart mit den Herstellerangaben abgeglichen.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * Feste Kaufleiste am unteren Rand – nur mobil sichtbar (CSS). Zeigt Preis und
 * die primäre Aktion, damit sie beim Scrollen durch die Varianten erreichbar bleibt.
 */
function StickyBuyBar({ soon, kannAnfragen, onAdd, onNotify, priceLabel }) {
  return (
    <div className="pdp__stickybar" role="region" aria-label="Anfrage">
      <div className="pdp__stickyprice">
        <span>{priceLabel || PRICE_ON_REQUEST}</span>
      </div>
      {soon ? (
        <button type="button" className="pdp__stickycta pdp__stickycta--notify" onClick={onNotify}>
          <BellRing size={16} strokeWidth={1.8} /> Benachrichtige mich
        </button>
      ) : kannAnfragen ? (
        <button type="button" className="pdp__stickycta" onClick={onAdd}>
          In den Warenkorb <ShoppingBag size={16} strokeWidth={1.8} />
        </button>
      ) : (
        <span className="pdp__stickycta pdp__stickycta--soon" aria-disabled="true">
          <Info size={16} strokeWidth={1.8} /> Produktvorschau
        </span>
      )}
    </div>
  )
}

function ServiceStrip() {
  return (
    <section className="pdp__service">
      <div className="container pdp__servicegrid">
        {SERVICE.map((s) => (
          <div className="pdp__serviceitem" key={s.title}>
            <s.icon size={20} strokeWidth={1.5} />
            <div><strong>{s.title}</strong><span>{s.text}</span></div>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Personalisierungsblock – identisch fuer beide Seitentypen. */
function PersBlock({ product, persAn, setPersAn, persName, setPersName }) {
  if (!product.personalizable) return null
  return (
    <div className="pdp__block pdp__pers">
      <span className="pdp__label">Personalisierung</span>
      <label className="pdp__check">
        <input type="checkbox" checked={persAn} onChange={(e) => setPersAn(e.target.checked)} />
        <span>{PERSONALIZATION_LABEL}{SHOW_PUBLIC_PRICES ? ` (+${formatPrice(personalizationPrice(product))})` : ''}</span>
      </label>
      {persAn && (
        <>
          <div className="pdp__persfield">
            <input
              type="text" value={persName} maxLength={PERSONALIZATION_MAX}
              onChange={(e) => setPersName(nurDruckbar(e.target.value))}
              placeholder="Z. B. Max Mustermann" aria-label="Name für den Druck"
            />
            <span className="pdp__perscount">{persName.length} / {PERSONALIZATION_MAX}</span>
          </div>
          <p className="pdp__persview">Vorschau: <strong>{persName.trim() || 'Dein Name auf dem Shirt'}</strong></p>
          <p className="pdp__perspos">
            Druckposition: {product.personalization?.position}. Emojis und Sonderzeichen sind nicht möglich.
          </p>
          <PersonalisierungHinweis />
        </>
      )}
    </div>
  )
}

function RelatedFamilies({ current }) {
  const andere = MERCH_FAMILIES.filter((f) => f.key !== current.key).slice(0, 4)
  if (!andere.length) return null
  return (
    <section className="pdp__related">
      <div className="container">
        <Reveal as="header" className="pdp__relhead">
          <span className="eyebrow">Passt dazu</span>
          <h2>Weitere Modelle aus der Kollektion</h2>
        </Reveal>
        <div className="mgrid mgrid--rel">
          {andere.map((f, i) => <FamilyCard key={f.key} family={f} delay={(i % 4) * 0.05} />)}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   Familien-Konfigurator (Bekleidung)
   ============================================================ */

function Konfigurator({ family, start }) {
  const zurueck = useZurueck()
  const { wishlist, toggleWish, addInquiry, openAnfrage } = useCart()
  const [justAdded, setJustAdded] = useState(false)
  // Die Variantenauswahl lebt in der URL (?style&color=&placement=&size=).
  // Dadurch ist sie teilbar, per Reload wiederherstellbar und die Zurück-/
  // Vorwärtsnavigation des Browsers funktioniert. Ungültige Werte werden beim
  // Ableiten auf die nächste existierende Variante zurückgeführt.
  const [params, setParams] = useSearchParams()
  const [menge, setMenge] = useState(1)
  const [persAn, setPersAn] = useState(false)
  const [persName, setPersName] = useState('')
  // § 6: „Benachrichtige mich"-Formular. Öffnet sich auch automatisch, wenn aus
  // dem Grid mit ?benachrichtigen=1 auf ein Coming-soon-Produkt verlinkt wurde.
  const [notifyOpen, setNotifyOpen] = useState(false)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }) }, [])
  useEffect(() => { if (params.get('benachrichtigen')) setNotifyOpen(true) }, [params])

  const setParam = (updates) => {
    const p = new URLSearchParams(params)
    Object.entries(updates).forEach(([k, v]) => (v == null ? p.delete(k) : p.set(k, v)))
    // replace statt push: Varianten-Auswahl (style/color/placement/size ...) legt
    // KEINEN neuen History-Eintrag an. Dadurch fuehrt "Zurueck" – der Button auf
    // der Seite wie auch der Browser-Zurueck – direkt an die Klickstelle im Shop
    // zurueck und nicht Schritt fuer Schritt durch die vorher gewaehlten Varianten.
    // Die URL bleibt trotzdem teilbar und per Reload wiederherstellbar.
    setParams(p, { replace: true })
  }

  // ----- Ableiten mit Clamping (nie leere Kombi, nie falsches Bild) -----
  const styleParam = (params.get('style') || start.logoStyle || '').toUpperCase()
  const style = family.styles.includes(styleParam) ? styleParam : family.styles[0]
  const styleUnits = family.units.filter((u) => u.style === style)

  const colors = []
  styleUnits.forEach((u) => { if (!colors.some((c) => c.key === u.colorKey)) colors.push({ key: u.colorKey, label: u.color, hex: u.colorHex }) })
  const colorObj = colors.find((c) => c.key === (params.get('color') || start.colors?.[0]?.key)) || colors[0]
  const color = colorObj.label

  const scUnits = styleUnits.filter((u) => u.color === color)

  // ----- Achse 1: Logo-Platzierung (Slot: großes Front- vs. kleines Brustlogo) -----
  const places = []
  scUnits.forEach((u) => { if (!places.some((p) => p.key === u.placementKey)) places.push({ key: u.placementKey, label: u.placementLabel }) })
  const placeParam = params.get('placement')
  let placeObj = places.find((p) => p.key === placeParam)
  if (!placeObj) placeObj = places.find((p) => scUnits.some((u) => u.placementKey === p.key && !isPlaceholderStatus(u.imageStatus))) || places[0]
  const placeIdx = places.findIndex((p) => p.key === placeObj.key)
  const placeUnits = scUnits.filter((u) => u.placementKey === placeObj.key)

  // ----- Achse 2: Logo-/Flock-Farbe (nur wenn die Platzierung mehrere Farben kennt) -----
  const logoColors = []
  placeUnits.forEach((u) => { if (u.logoColorKey && !logoColors.some((l) => l.key === u.logoColorKey)) logoColors.push({ key: u.logoColorKey, label: u.logoColorLabel, hex: u.logoColorHex }) })
  logoColors.sort((a, b) => LOGO_COLOR_ORDER.indexOf(a.key) - LOGO_COLOR_ORDER.indexOf(b.key))
  const lcParam = params.get('logocolor')
  let unit
  if (logoColors.length) {
    let lcObj = logoColors.find((l) => l.key === lcParam)
    if (!lcObj) lcObj = logoColors.find((l) => placeUnits.some((u) => u.logoColorKey === l.key && !isPlaceholderStatus(u.imageStatus))) || logoColors[0]
    unit = placeUnits.find((u) => u.logoColorKey === lcObj.key) || placeUnits[0]
  } else {
    unit = placeUnits[0]
  }
  const isFlock = unit.refinement === 'flock'
  // Kein stiller Fallback: Platzhalter-Varianten zeigen ein hochwertiges
  // Platzhalter-Panel statt eines falschen Bildes.
  const platzhalter = isPlaceholderStatus(unit.imageStatus)
    ? { title: IMAGE_STATUS_TITLE[unit.imageStatus] || 'Produktbild folgt', sub: unit.regenNote }
    : null

  const quelle = getProduct(unit.sourceSlug)
  const sizeGuide = getSizeGuide(unit.sizeGuide)
  const sizeParam = (params.get('size') || '').toUpperCase()
  const groesse = unit.sizes.includes(sizeParam) ? sizeParam : (unit.sizes[2] || unit.sizes[0])
  const gemerkt = wishlist.includes(quelle.id)
  const kannAnfragen = canInquire(quelle)
  const aufpreis = unit.personalizable && persAn && persName.trim() ? unit.personalizationPrice : 0
  // Launch-Linie (signature/pure/one): Preis live aus der zentralen Preislogik
  // (Launch-/Regulärpreis inkl. Countdown je Linie). Alle anderen Familien
  // behalten ihre Logik.
  const pv = unit.isPromo ? priceView(unit.promoLine) : null
  const basisPreis = unit.isPromo ? pv.price : unit.price
  const stueck = basisPreis == null ? null : basisPreis + aufpreis
  const preisSichtbar = unit.isPromo || SHOW_PUBLIC_PRICES

  const logoAusfuehrung = [
    unit.styleLabel,
    places.length > 1 ? unit.placementLabel : null,
    logoColors.length > 1 && unit.logoColorLabel ? `${isFlock ? 'Flock' : 'Logo'} ${unit.logoColorLabel}` : null,
  ].filter(Boolean).join(' · ')

  // SKU/Variant-ID der aktuell gewählten Kombination (Farbe × Logoausführung × Größe).
  const sku = skuFor({ colorKey: colorObj.key, placementKey: placeObj.key, size: groesse })

  // Anfragemodell: legt die gewählte Variante in die rein lokale Anfrageliste.
  // KEINE Bestellung, KEINE Server-Speicherung, KEINE Zahlungsaufforderung.
  const anfragen = () => {
    addInquiry({
      sku,
      productName: `${family.label} · ${unit.styleLabel} · ${color}`,
      colorLabel: color,
      colorKey: colorObj.key,
      sizeLabel: groesse,
      logoLabel: logoAusfuehrung,
      placementKey: placeObj.key,
      unitPrice: stueck,
      qty: menge,
      note: persAn && persName.trim() ? `Namensdruck: ${persName.trim()}` : '',
      image: unit.image,
      slug: unit.sourceSlug,
    })
    setJustAdded(true)
    openAnfrage()
    window.setTimeout(() => setJustAdded(false), 2500)
  }

  // § 7: Herz auf Coming-soon-Produkten. Beim AKTIVIEREN (erste Aktivierung)
  // wird EINMALIG anonymes Interesse gemeldet – ohne jegliche personenbezogene
  // Daten. Das reine Merken bleibt lokal; ein Fehler blockiert nichts.
  const merkenUndInteresse = () => {
    if (!gemerkt) {
      sendInterest({ productName: family.label, productId: quelle.id, variant: `${unit.styleLabel} · ${color}` })
    }
    toggleWish(quelle.id)
  }

  const ld = useMemo(
    () => familyJsonLd(family, SHOW_PUBLIC_PRICES && family.priceFrom != null ? family.priceFrom / 100 : null),
    [family],
  )

  return (
    <main className="pdp">
      <Seo {...merchDetailHead({
        name: family.label, tagline: quelle.tagline, slug: family.slug,
        canonicalSlug: merchCanonicalSlug(family.slug),
        image: unit.image, extraLd: ld,
      })} />
      <div className="container">
        <nav className="pdp__crumbs" aria-label="Brotkrumen">
          <button type="button" className="pdp__back" onClick={zurueck}>
            <ArrowLeft size={15} strokeWidth={1.9} /> Zurück
          </button>
          <Link to="/merch">Shop</Link>
          <span aria-hidden="true">›</span>
          <span className="pdp__crumb-now">{family.label}</span>
        </nav>
      </div>

      <section className="pdp__top">
        <div className="container pdp__grid">
          <div className="pdp__media">
            {/* key auf die aktive Variante: Galerie springt auf das erste (volle) Bild */}
            <ProductGallery key={`${unit.sourceId}-${unit.placementKey}-${unit.logoColorKey || ''}`} images={unit.gallery} alt={`${family.label} – ${unit.styleLabel}, ${color}`} placeholder={platzhalter} ai={!platzhalter && unit.imageStatus !== 'real_photo'} />
          </div>

          <div className="pdp__info">
            <span className="pdp__kicker">{unit.styleLabel} · {color}</span>
            <h1 className="pdp__title">{family.label}</h1>
            <p className="pdp__tagline">{quelle.tagline}</p>

            <div className="pdp__priceline">
              {preisSichtbar && stueck != null ? (
                <span className="pdp__price">{formatPrice(stueck)}</span>
              ) : (
                <span className="pdp__price pdp__price--offen">{PRICE_ON_REQUEST}</span>
              )}
              {pv?.showRegularStrike && (
                <s className="pdp__price-strike" title="Regulärer Preis nach dem Launch">{formatPrice(pv.regularPrice)}</s>
              )}
              {pv?.badge && <span className="pdp__badge pdp__badge--opening">{pv.badge}</span>}
              {unit.refinement === 'flock' && <span className="pdp__badge pdp__badge--flock">PRESTIGE · FLOCK</span>}
              {unit.soon && <span className="pdp__badge">Coming Soon</span>}
            </div>
            {unit.refinement === 'flock' && (
              <p className="pdp__flocknote">PRESTIGE wird nicht bedruckt, sondern mit samtigem Flock veredelt – erhaben, matt und deutlich hochwertiger. Kontrastierend in Weiß oder Schwarz, auf Wunsch in edlem Gold.</p>
            )}
            {unit.isPromo ? (
              <>
                <span className="pdp__vat">
                  inkl. gesetzl. USt., zzgl. Versand{aufpreis > 0 && ` · enthält ${formatPrice(aufpreis)} Namensdruck`}. Versandkosten nennen wir mit dem individuellen Angebot.
                </span>
                {pv?.opening && (
                  <p className="pdp__opening">
                    <strong>Launch-Preis</strong> für die ersten {pv.openingStock} Stück – noch {pv.remaining} zum Launch-Preis verfügbar.
                    Regulärer Preis nach dem Launch: {formatPrice(pv.regularPrice)}.
                  </p>
                )}
              </>
            ) : (
              <span className="pdp__vat">{PRICE_INQUIRY_NOTE}</span>
            )}

            {/* --- Logo-Stil --- */}
            <div className="pdp__block">
              <span className="pdp__label">Logo-Stil</span>
              <div className="pdp__styles" role="group" aria-label="Logo-Stil wählen">
                {family.styles.map((s) => (
                  <button
                    type="button" key={s}
                    className={`pdp__style ${style === s ? 'is-active' : ''}`.trim()}
                    onClick={() => setParam({ style: s.toLowerCase(), placement: null, logocolor: null })}
                    aria-pressed={style === s}
                  >
                    <strong>{LOGO_STYLE_INFO[s].label}</strong>
                    <small>{LOGO_STYLE_INFO[s].desc}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* --- Logo-Platzierung --- */}
            {places.length > 1 && (
              <div className="pdp__block">
                <span className="pdp__label">Logo-Platzierung</span>
                <div className="pdp__places" role="group" aria-label="Logo-Platzierung wählen">
                  {places.map((p, i) => (
                    <button
                      type="button" key={p.key}
                      className={`pdp__place ${placeIdx === i ? 'is-active' : ''}`.trim()}
                      onClick={() => setParam({ placement: p.key, logocolor: null })}
                      aria-pressed={placeIdx === i}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* --- Logo- / Flock-Farbe --- */}
            {logoColors.length > 1 && (
              <div className="pdp__block">
                <span className="pdp__label">{isFlock ? 'Flock-Farbe' : 'Logo-Farbe'}</span>
                <div className="pdp__colors" role="group" aria-label={isFlock ? 'Flock-Farbe wählen' : 'Logo-Farbe wählen'}>
                  {logoColors.map((l) => {
                    const aktiv = unit.logoColorKey === l.key
                    const lU = placeUnits.find((u) => u.logoColorKey === l.key)
                    const soon = !lU || isPlaceholderStatus(lU.imageStatus)
                    return (
                      <button
                        type="button" key={l.key}
                        className={`pdp__color ${aktiv ? 'is-active' : ''}`.trim()}
                        onClick={() => setParam({ logocolor: l.key })}
                        aria-pressed={aktiv}
                      >
                        <span className="pdp__swatch" style={{ background: l.hex }} aria-hidden="true" />
                        {l.label}{soon && <em className="pdp__soonhint"> · bald</em>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* --- Farbe --- */}
            {colors.length > 1 && (
              <div className="pdp__block">
                <span className="pdp__label">Farbe</span>
                <div className="pdp__colors" role="group" aria-label="Farbe wählen">
                  {colors.map((c) => (
                    <button
                      type="button" key={c.label}
                      className={`pdp__color ${color === c.label ? 'is-active' : ''}`.trim()}
                      onClick={() => setParam({ color: c.key, placement: null, logocolor: null })}
                      aria-pressed={color === c.label}
                    >
                      <span className="pdp__swatch" style={{ background: c.hex }} aria-hidden="true" />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* --- Größe --- */}
            {unit.sizes?.length > 1 && (
              <div className="pdp__block">
                <div className="pdp__blockhead">
                  <span className="pdp__label">Größe</span>
                  <span className="pdp__sizehint"><Ruler size={13} strokeWidth={1.8} /> {unit.fit} – {unit.fitNote}</span>
                </div>
                <div className="pdp__chips" role="group" aria-label="Größe wählen">
                  {unit.sizes.map((s) => (
                    <button type="button" key={s} className={`pdp__chip ${groesse === s ? 'is-active' : ''}`.trim()} onClick={() => setParam({ size: s.toLowerCase() })} aria-pressed={groesse === s}>{s}</button>
                  ))}
                </div>
                {quelle.modelSize && <p className="pdp__model">Model ist {quelle.modelHeight} groß und trägt Größe {quelle.modelSize}.</p>}
              </div>
            )}

            <PersBlock product={quelle} persAn={persAn} setPersAn={setPersAn} persName={persName} setPersName={setPersName} />

            {!unit.soon && (
              <div className="pdp__block">
                <span className="pdp__label">Menge</span>
                <div className="pdp__qty">
                  <button type="button" onClick={() => setMenge((m) => Math.max(1, m - 1))} aria-label="Menge verringern"><Minus size={14} strokeWidth={2.2} /></button>
                  <span>{menge}</span>
                  <button type="button" onClick={() => setMenge((m) => Math.min(99, m + 1))} aria-label="Menge erhöhen"><Plus size={14} strokeWidth={2.2} /></button>
                </div>
              </div>
            )}

            <div className="pdp__actions">
              {unit.soon ? (
                <button type="button" className="pdp__cta pdp__cta--notify" onClick={() => setNotifyOpen(true)}>
                  <BellRing size={17} strokeWidth={1.8} /> Benachrichtige mich
                </button>
              ) : kannAnfragen ? (
                <button type="button" className={`pdp__cta ${justAdded ? 'is-added' : ''}`.trim()} onClick={anfragen}>
                  {justAdded ? (<><Check size={17} strokeWidth={2} /> Im Warenkorb</>)
                    : (<>In den Warenkorb <ShoppingBag size={17} strokeWidth={1.8} /></>)}
                </button>
              ) : (
                <span className="pdp__cta pdp__cta--soon" aria-disabled="true">
                  <Info size={17} strokeWidth={1.8} /> Produktvorschau
                </span>
              )}
              <button type="button" className={`pdp__wish ${gemerkt ? 'is-on' : ''}`.trim()} onClick={merkenUndInteresse} aria-pressed={gemerkt} aria-label={gemerkt ? 'Von der Merkliste entfernen' : (unit.soon ? 'Interesse markieren' : 'Merken')}>
                <Heart size={18} strokeWidth={1.8} fill={gemerkt ? 'currentColor' : 'none'} />
              </button>
            </div>

            {unit.soon && (
              <p className="pdp__previewnote">
                Dieses Modell ist noch nicht anfragbar. Trage dich per „Benachrichtige mich" ein –
                wir melden uns einmalig, sobald es verfügbar ist. Mit dem Herz kannst du zusätzlich
                anonym Interesse zeigen (es werden dabei keine personenbezogenen Daten übertragen).
              </p>
            )}
            {!unit.soon && kannAnfragen && (
              <p className="pdp__inquirynote">{INQUIRY_DISCLAIMER}</p>
            )}
            {!unit.soon && !kannAnfragen && (
              <p className="pdp__previewnote">
                {PREVIEW_NOTE} Eine unverbindliche Anfrage ist möglich, sobald die
                finalen Produktangaben bestätigt sind.
              </p>
            )}

            <p className="pdp__ship">
              <Truck size={16} strokeWidth={1.7} />
              {unit.soon ? 'Noch nicht bestellbar – wir melden uns, sobald es losgeht.' : `Voraussichtliche Lieferzeit ${quelle.lead_time}`}
            </p>

            <p className="pdp__mockup">
              <Info size={14} strokeWidth={1.8} />
              {unit.imageStatus === 'placeholder'
                ? `Für diese Variante liegt noch kein Produktbild vor${unit.regenNote ? ` – ${unit.regenNote}` : ''}.`
                : isPlaceholderStatus(unit.imageStatus)
                  ? `Dieses Bild wird neu erstellt${unit.regenNote ? ` – ${unit.regenNote}` : ''}. Bis dahin zeigen wir bewusst kein vorläufiges Bild.`
                  : unit.soon
                    // Coming-soon: unverbindliche Produktvorschau (KI-Muster).
                    ? 'KI-Produktvorschau – Abbildung kann vom späteren Produkt abweichen.'
                    // Kaufbarer Artikel: KI-Muster ist interner Verkaufs-Blocker.
                    : 'Vorschau als KI-Muster – echte Produktfotos folgen vor dem Verkauf.'}
            </p>
          </div>
        </div>
      </section>

      <InfoBloecke product={quelle} material={unit.material} care={quelle.care} lead={quelle.lead_time} soon={unit.soon} size={groesse} sizeGuide={sizeGuide} />
      <RelatedFamilies current={family} />
      <ServiceStrip />
      <StickyBuyBar soon={unit.soon} kannAnfragen={kannAnfragen} onAdd={anfragen} onNotify={() => setNotifyOpen(true)} priceLabel={preisSichtbar && stueck != null ? formatPrice(stueck) : PRICE_ON_REQUEST} />
      {notifyOpen && (
        <NotifyModal
          product={family.label}
          productId={quelle.id}
          colors={colors.map((c) => c.label)}
          sizes={unit.sizes || []}
          onClose={() => setNotifyOpen(false)}
        />
      )}
    </main>
  )
}

/* ============================================================
   Einzelseite (Accessoires, Workwear)
   ============================================================ */

function Einzelseite({ product }) {
  const zurueck = useZurueck()
  const { wishlist, toggleWish, addInquiry, openAnfrage } = useCart()
  const [params] = useSearchParams()
  const mehrereGroessen = product.sizes?.length > 1
  const [size, setSize] = useState(product.sizes ? product.sizes[2] || product.sizes[0] : null)
  const [menge, setMenge] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }) }, [])
  useEffect(() => { if (params.get('benachrichtigen')) setNotifyOpen(true) }, [params])

  const related = useMemo(() => getRelated(product, 5).filter((p) => p.category === 'Accessoires' || p.collection === 'WORKWEAR'), [product])
  const sizeGuide = getSizeGuide(product.sizeGuide)
  const gemerkt = wishlist.includes(product.id)
  const kannAnfragen = canInquire(product)
  // Einzelprodukte (Accessoires/Workwear) sind derzeit nicht anfragbar; falls ein
  // solches Produkt künftig anfragbar wird, landet es ebenfalls in der Anfrageliste.
  const anfragen = () => {
    addInquiry({
      sku: skuFor({ colorKey: product.colors?.[0]?.key || product.sku || product.id, placementKey: 'std', size: size || 'std' }),
      productName: product.name,
      colorLabel: product.colors?.[0]?.label || 'Standard',
      colorKey: product.colors?.[0]?.key || 'std',
      sizeLabel: size || 'Einheitsgröße',
      logoLabel: '—',
      placementKey: 'std',
      unitPrice: SHOW_PUBLIC_PRICES ? product.price : null,
      qty: menge,
      note: '',
      image: product.image,
      slug: product.slug,
    })
    setJustAdded(true)
    openAnfrage()
    window.setTimeout(() => setJustAdded(false), 2500)
  }

  // § 7: anonymes Interesse beim Aktivieren des Herzens auf Coming-soon-Produkten.
  const merkenUndInteresse = () => {
    if (!gemerkt) {
      sendInterest({ productName: product.name, productId: product.id, variant: '' })
    }
    toggleWish(product.id)
  }

  const ld = useMemo(() => {
    const base = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${product.name} – VIDEKO Merch`,
      brand: { '@type': 'Brand', name: 'VIDEKO' },
      category: product.productType,
    }
    // Anfragemodell: Ohne oeffentlichen Preis kein schema.org/Offer (ein Offer
    // ohne Preis waere ungueltig, „InStock" ohne Kaufmoeglichkeit irrefuehrend).
    if (SHOW_PUBLIC_PRICES && product.price != null) {
      base.offers = {
        '@type': 'Offer',
        priceCurrency: 'EUR',
        availability: product.soon ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock',
        price: (product.price / 100).toFixed(2),
      }
    }
    return base
  }, [product])

  return (
    <main className="pdp">
      <Seo {...merchDetailHead({
        name: product.name, tagline: product.tagline, slug: product.slug,
        canonicalSlug: merchCanonicalSlug(product.slug),
        image: product.image, extraLd: ld,
      })} />
      <div className="container">
        <nav className="pdp__crumbs" aria-label="Brotkrumen">
          <button type="button" className="pdp__back" onClick={zurueck}>
            <ArrowLeft size={15} strokeWidth={1.9} /> Zurück
          </button>
          <Link to="/merch">Shop</Link>
          <span aria-hidden="true">›</span>
          <span>{product.kicker}</span>
          <span aria-hidden="true">›</span>
          <span className="pdp__crumb-now">{product.name}</span>
        </nav>
      </div>

      <section className="pdp__top">
        <div className="container pdp__grid">
          <div className="pdp__media">
            <ProductGallery images={product.gallery} alt={product.name} ai={product.imageStatus !== 'real_photo' && !isPlaceholderStatus(product.imageStatus)} />
          </div>

          <div className="pdp__info">
            <span className="pdp__kicker">{product.kicker}</span>
            <h1 className="pdp__title">{product.name}</h1>
            <p className="pdp__tagline">{product.tagline}</p>

            <div className="pdp__priceline">
              {SHOW_PUBLIC_PRICES ? (
                <span className={`pdp__price ${product.price == null ? 'pdp__price--offen' : ''}`.trim()}>
                  {product.price == null ? product.priceNote : formatPrice(product.price)}
                </span>
              ) : (
                <span className="pdp__price pdp__price--offen">{PRICE_ON_REQUEST}</span>
              )}
              {product.badge && <span className="pdp__badge">{product.badge}</span>}
            </div>
            {!SHOW_PUBLIC_PRICES && <span className="pdp__vat">{PRICE_INQUIRY_NOTE}</span>}

            <p className="pdp__desc">{product.description}</p>

            {mehrereGroessen && (
              <div className="pdp__block">
                <span className="pdp__label">Größe</span>
                <div className="pdp__chips" role="group" aria-label="Größe wählen">
                  {product.sizes.map((s) => (
                    <button type="button" key={s} className={`pdp__chip ${size === s ? 'is-active' : ''}`.trim()} onClick={() => setSize(s)} aria-pressed={size === s}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {!product.soon && (
              <div className="pdp__block">
                <span className="pdp__label">Menge</span>
                <div className="pdp__qty">
                  <button type="button" onClick={() => setMenge((m) => Math.max(1, m - 1))} aria-label="Menge verringern"><Minus size={14} strokeWidth={2.2} /></button>
                  <span>{menge}</span>
                  <button type="button" onClick={() => setMenge((m) => Math.min(99, m + 1))} aria-label="Menge erhöhen"><Plus size={14} strokeWidth={2.2} /></button>
                </div>
              </div>
            )}

            <div className="pdp__actions">
              {product.soon ? (
                <button type="button" className="pdp__cta pdp__cta--notify" onClick={() => setNotifyOpen(true)}>
                  <BellRing size={17} strokeWidth={1.8} /> Benachrichtige mich
                </button>
              ) : kannAnfragen ? (
                <button type="button" className={`pdp__cta ${justAdded ? 'is-added' : ''}`.trim()} onClick={anfragen}>
                  {justAdded ? (<><Check size={17} strokeWidth={2} /> Im Warenkorb</>)
                    : (<>In den Warenkorb <ShoppingBag size={17} strokeWidth={1.8} /></>)}
                </button>
              ) : (
                <span className="pdp__cta pdp__cta--soon" aria-disabled="true">
                  <Info size={17} strokeWidth={1.8} /> Produktvorschau
                </span>
              )}
              <button type="button" className={`pdp__wish ${gemerkt ? 'is-on' : ''}`.trim()} onClick={merkenUndInteresse} aria-pressed={gemerkt} aria-label={gemerkt ? 'Von der Merkliste entfernen' : (product.soon ? 'Interesse markieren' : 'Merken')}>
                <Heart size={18} strokeWidth={1.8} fill={gemerkt ? 'currentColor' : 'none'} />
              </button>
            </div>

            {product.soon && (
              <p className="pdp__previewnote">
                Dieses Produkt ist noch nicht anfragbar. Trage dich per „Benachrichtige mich" ein –
                wir melden uns einmalig, sobald es verfügbar ist. Mit dem Herz kannst du zusätzlich
                anonym Interesse zeigen (ohne Übertragung personenbezogener Daten).
              </p>
            )}
            {!product.soon && kannAnfragen && (
              <p className="pdp__inquirynote">{INQUIRY_DISCLAIMER}</p>
            )}
            {!product.soon && !kannAnfragen && (
              <p className="pdp__previewnote">
                {PREVIEW_NOTE} Eine unverbindliche Anfrage ist möglich, sobald die
                finalen Produktangaben bestätigt sind.
              </p>
            )}

            <p className="pdp__ship">
              <Truck size={16} strokeWidth={1.7} />
              {product.soon ? 'Noch nicht bestellbar – wir melden uns, sobald es losgeht.' : `Voraussichtliche Lieferzeit ${product.lead_time}`}
            </p>

            {product.imageStatus !== 'real_photo' && (
              <p className="pdp__mockup">
                <Info size={14} strokeWidth={1.8} />
                {product.imageStatus === 'placeholder'
                  ? 'Platzhalter – für dieses Produkt liegt noch kein Bild vor.'
                  : product.soon
                    ? 'KI-Produktvorschau – Abbildung kann vom späteren Produkt abweichen.'
                    : 'Vorschau als KI-Muster – echte Produktfotos folgen vor dem Verkauf.'}
              </p>
            )}
          </div>
        </div>
      </section>

      <InfoBloecke product={product} material={product.material} care={product.care} lead={product.lead_time} soon={product.soon} size={size} sizeGuide={sizeGuide} />

      {related.length > 0 && (
        <section className="pdp__related">
          <div className="container">
            <Reveal as="header" className="pdp__relhead">
              <span className="eyebrow">Passt dazu</span>
              <h2>Weitere Produkte, die dir gefallen könnten</h2>
            </Reveal>
            <div className="mgrid mgrid--rel">
              {related.map((p, i) => <ProductCard key={p.id} product={p} delay={(i % 4) * 0.05} />)}
            </div>
          </div>
        </section>
      )}

      <ServiceStrip />
      <StickyBuyBar soon={product.soon} kannAnfragen={kannAnfragen} onAdd={anfragen} onNotify={() => setNotifyOpen(true)} priceLabel={SHOW_PUBLIC_PRICES && product.price != null ? formatPrice(product.price) : PRICE_ON_REQUEST} />
      {notifyOpen && (
        <NotifyModal
          product={product.name}
          productId={product.id}
          colors={(product.colors || []).map((c) => c.label)}
          sizes={product.sizes || []}
          onClose={() => setNotifyOpen(false)}
        />
      )}
    </main>
  )
}
