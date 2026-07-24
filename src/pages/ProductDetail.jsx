import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams, useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  ShoppingBag, Heart, Bell, Check, Minus, Plus, Truck, Info,
  ShieldCheck, RotateCcw, Headphones, Ruler, ArrowLeft,
} from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import Seo from '../components/Seo.jsx'
import { familyJsonLd } from '../components/seo-jsonld.js'
import ProductGallery from '../components/merch/ProductGallery.jsx'
import ProductCard from '../components/merch/ProductCard.jsx'
import FamilyCard from '../components/merch/FamilyCard.jsx'
import PersonalisierungHinweis from '../components/merch/PersonalisierungHinweis.jsx'
import { useCart } from '../shop/cart-context.js'
import {
  getProduct, getFamilyOfProduct, getRelated, MERCH_FAMILIES,
  formatPrice, personalizationPrice, getSizeGuide,
  PERSONALIZATION_MAX, PERSONALIZATION_LABEL, FREE_SHIPPING_FROM, LOGO_STYLE_INFO,
  LOGO_COLOR_ORDER, isPlaceholderStatus, IMAGE_STATUS_TITLE,
} from '../data/merch.js'

/**
 * Erlaubt nur Zeichen, die sich sauber drucken lassen: Buchstaben, Ziffern,
 * Leerzeichen und einfache Satzzeichen. Emojis und Symbole fallen weg.
 */
const nurDruckbar = (text) => text.replace(/[^\p{L}\p{N} .,'&-]/gu, '')

const SERVICE = [
  { icon: ShieldCheck, title: 'Sicher bezahlen', text: 'SSL-verschlüsselte Übertragung' },
  { icon: Truck, title: 'Versandkostenfrei', text: `ab ${formatPrice(FREE_SHIPPING_FROM)} Bestellwert` },
  { icon: RotateCcw, title: 'Rückgabe', text: '14 Tage Widerrufsrecht' },
  { icon: Headphones, title: 'Kundenservice', text: 'Mo – Fr von 9 – 18 Uhr' },
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

function InfoBloecke({ material, care, lead, soon, size, sizeGuide }) {
  const [offen, setOffen] = useState(0)
  const infos = [
    { title: 'Material & Pflege', text: `${material}. ${care}.` },
    {
      title: 'Lieferzeit & Versand',
      text: soon
        ? `Dieser Artikel ist noch nicht bestellbar. ${lead}.`
        : `Versand innerhalb von ${lead}. Ab ${formatPrice(FREE_SHIPPING_FROM)} Bestellwert liefern wir versandkostenfrei.`,
    },
    {
      title: 'Rückgabe & Widerruf',
      text: 'Du kannst deine Bestellung innerhalb von 14 Tagen widerrufen. Bei personalisierten Artikeln gelten Einschränkungen – die Einzelheiten stehen auf unserer Seite „Rückgabe & Widerruf".',
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
            <div className="jacc__a"><div className="jacc__a-in"><p>{b.text}</p></div></div>
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
function StickyBuyBar({ price, priceNote, soon, gemeldet, onAdd, onNotify }) {
  return (
    <div className="pdp__stickybar" role="region" aria-label="Kaufaktion">
      <div className="pdp__stickyprice">
        <span>{price == null ? priceNote : formatPrice(price)}</span>
        {price != null && <small>inkl. MwSt.</small>}
      </div>
      {soon ? (
        <button type="button" className={`pdp__stickycta pdp__stickycta--notify ${gemeldet ? 'is-done' : ''}`.trim()} onClick={onNotify}>
          {gemeldet ? (<><Check size={16} strokeWidth={2} /> Vorgemerkt</>) : (<><Bell size={16} strokeWidth={1.8} /> Benachrichtige mich</>)}
        </button>
      ) : (
        <button type="button" className="pdp__stickycta" onClick={onAdd}>
          In den Warenkorb <ShoppingBag size={16} strokeWidth={1.8} />
        </button>
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
        <span>{PERSONALIZATION_LABEL} (+{formatPrice(personalizationPrice(product))})</span>
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
  const { add, wishlist, toggleWish, notified, notify } = useCart()
  // Die Variantenauswahl lebt in der URL (?style&color=&placement=&size=).
  // Dadurch ist sie teilbar, per Reload wiederherstellbar und die Zurück-/
  // Vorwärtsnavigation des Browsers funktioniert. Ungültige Werte werden beim
  // Ableiten auf die nächste existierende Variante zurückgeführt.
  const [params, setParams] = useSearchParams()
  const [menge, setMenge] = useState(1)
  const [persAn, setPersAn] = useState(false)
  const [persName, setPersName] = useState('')

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }) }, [])

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
  const gemeldet = notified.includes(quelle.id)
  const aufpreis = unit.personalizable && persAn && persName.trim() ? unit.personalizationPrice : 0
  const stueck = unit.price == null ? null : unit.price + aufpreis
  const logoColorSuffix = logoColors.length > 1 && unit.logoColorLabel ? ` · ${isFlock ? 'Flock' : 'Logo'} ${unit.logoColorLabel}` : ''
  const variantLabel = `${family.label} · ${unit.styleLabel} · ${color}${places.length > 1 ? ' · ' + unit.placementLabel : ''}${logoColorSuffix}`

  const cartPlacementLabel = [places.length > 1 ? unit.placementLabel : null, logoColors.length > 1 && unit.logoColorLabel ? `${isFlock ? 'Flock' : 'Logo'} ${unit.logoColorLabel}` : null].filter(Boolean).join(' · ') || null
  const hinzufuegen = () => add(quelle, {
    size: groesse, color, qty: menge,
    pers: persAn ? persName : null,
    placement: cartPlacementLabel ? unit.placementKey : null,
    placementLabel: cartPlacementLabel,
  })
  const vormerken = () => notify(quelle, variantLabel)

  const ld = useMemo(
    () => familyJsonLd(family, family.priceFrom == null ? null : family.priceFrom / 100),
    [family],
  )

  return (
    <main className="pdp">
      <Seo
        title={`${family.label} – VIDEKO Merch`}
        description={quelle.tagline}
        canonicalPath={`/merch/${family.slug}`}
        jsonLd={ld}
      />
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
            <ProductGallery key={`${unit.sourceId}-${unit.placementKey}-${unit.logoColorKey || ''}`} images={unit.gallery} alt={`${family.label} – ${unit.styleLabel}, ${color}`} placeholder={platzhalter} />
          </div>

          <div className="pdp__info">
            <span className="pdp__kicker">{unit.styleLabel} · {color}</span>
            <h1 className="pdp__title">{family.label}</h1>
            <p className="pdp__tagline">{quelle.tagline}</p>

            <div className="pdp__priceline">
              <span className={`pdp__price ${unit.price == null ? 'pdp__price--offen' : ''}`.trim()}>
                {unit.price == null ? unit.priceNote : formatPrice(stueck)}
              </span>
              {unit.refinement === 'flock' && <span className="pdp__badge pdp__badge--flock">PRESTIGE · FLOCK</span>}
              {unit.soon && <span className="pdp__badge">Coming Soon</span>}
            </div>
            {unit.refinement === 'flock' && (
              <p className="pdp__flocknote">PRESTIGE wird nicht bedruckt, sondern mit samtigem Flock veredelt – erhaben, matt und deutlich hochwertiger. Kontrastierend in Weiß oder Schwarz, auf Wunsch in edlem Gold.</p>
            )}
            {unit.price != null && (
              <span className="pdp__vat">
                inkl. MwSt. zzgl. Versand{aufpreis > 0 && ` · enthält ${formatPrice(aufpreis)} Namensdruck`}
              </span>
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
                <button type="button" className={`pdp__cta pdp__cta--notify ${gemeldet ? 'is-done' : ''}`.trim()} onClick={vormerken}>
                  {gemeldet ? (<><Check size={17} strokeWidth={2} /> Vorgemerkt</>) : (<><Bell size={17} strokeWidth={1.8} /> Benachrichtige mich</>)}
                </button>
              ) : (
                <button type="button" className="pdp__cta" onClick={hinzufuegen}>
                  In den Warenkorb <ShoppingBag size={17} strokeWidth={1.8} />
                </button>
              )}
              <button type="button" className={`pdp__wish ${gemerkt ? 'is-on' : ''}`.trim()} onClick={() => toggleWish(quelle.id)} aria-pressed={gemerkt} aria-label={gemerkt ? 'Von der Merkliste entfernen' : 'Merken'}>
                <Heart size={18} strokeWidth={1.8} fill={gemerkt ? 'currentColor' : 'none'} />
              </button>
            </div>

            <p className="pdp__ship">
              <Truck size={16} strokeWidth={1.7} />
              {unit.soon ? 'Noch nicht bestellbar – wir melden uns, sobald es losgeht.' : `Lieferzeit ${quelle.lead_time}`}
            </p>

            <p className="pdp__mockup">
              <Info size={14} strokeWidth={1.8} />
              {unit.imageStatus === 'placeholder'
                ? `Für diese Variante liegt noch kein Produktbild vor${unit.regenNote ? ` – ${unit.regenNote}` : ''}.`
                : isPlaceholderStatus(unit.imageStatus)
                  ? `Dieses Bild wird neu erstellt${unit.regenNote ? ` – ${unit.regenNote}` : ''}. Bis dahin zeigen wir bewusst kein vorläufiges Bild.`
                  : unit.imageStatus === 'existing_but_review'
                    ? `Vorschau als KI-Muster${unit.regenNote ? ` · ${unit.regenNote}` : ''} – echte Produktfotos folgen vor dem Verkauf.`
                    : 'Vorschau als KI-Muster – echte Produktfotos folgen vor dem Verkauf.'}
            </p>
          </div>
        </div>
      </section>

      <InfoBloecke material={unit.material} care={quelle.care} lead={quelle.lead_time} soon={unit.soon} size={groesse} sizeGuide={sizeGuide} />
      <RelatedFamilies current={family} />
      <ServiceStrip />
      <StickyBuyBar price={stueck} priceNote={unit.priceNote} soon={unit.soon} gemeldet={gemeldet} onAdd={hinzufuegen} onNotify={vormerken} />
    </main>
  )
}

/* ============================================================
   Einzelseite (Accessoires, Workwear)
   ============================================================ */

function Einzelseite({ product }) {
  const zurueck = useZurueck()
  const { add, wishlist, toggleWish, notified, notify } = useCart()
  const mehrereGroessen = product.sizes?.length > 1
  const [size, setSize] = useState(product.sizes ? product.sizes[2] || product.sizes[0] : null)
  const [menge, setMenge] = useState(1)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }) }, [])

  const related = useMemo(() => getRelated(product, 5).filter((p) => p.category === 'Accessoires' || p.collection === 'WORKWEAR'), [product])
  const sizeGuide = getSizeGuide(product.sizeGuide)
  const gemerkt = wishlist.includes(product.id)
  const gemeldet = notified.includes(product.id)
  const hinzufuegen = () => add(product, { size, color: product.colors?.[0]?.label, qty: menge })
  const vormerken = () => notify(product)

  const ld = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.name} – VIDEKO Merch`,
    brand: { '@type': 'Brand', name: 'VIDEKO' },
    category: product.productType,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      availability: product.soon ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock',
      ...(product.price != null ? { price: (product.price / 100).toFixed(2) } : {}),
    },
  }), [product])

  return (
    <main className="pdp">
      <Seo
        title={`${product.name} – VIDEKO Merch`}
        description={product.tagline}
        canonicalPath={`/merch/${product.slug}`}
        jsonLd={ld}
      />
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
            <ProductGallery images={product.gallery} alt={product.name} />
          </div>

          <div className="pdp__info">
            <span className="pdp__kicker">{product.kicker}</span>
            <h1 className="pdp__title">{product.name}</h1>
            <p className="pdp__tagline">{product.tagline}</p>

            <div className="pdp__priceline">
              <span className={`pdp__price ${product.price == null ? 'pdp__price--offen' : ''}`.trim()}>
                {product.price == null ? product.priceNote : formatPrice(product.price)}
              </span>
              {product.badge && <span className="pdp__badge">{product.badge}</span>}
            </div>

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
                <button type="button" className={`pdp__cta pdp__cta--notify ${gemeldet ? 'is-done' : ''}`.trim()} onClick={vormerken}>
                  {gemeldet ? (<><Check size={17} strokeWidth={2} /> Vorgemerkt</>) : (<><Bell size={17} strokeWidth={1.8} /> Benachrichtige mich</>)}
                </button>
              ) : (
                <button type="button" className="pdp__cta" onClick={hinzufuegen}>
                  In den Warenkorb <ShoppingBag size={17} strokeWidth={1.8} />
                </button>
              )}
              <button type="button" className={`pdp__wish ${gemerkt ? 'is-on' : ''}`.trim()} onClick={() => toggleWish(product.id)} aria-pressed={gemerkt} aria-label={gemerkt ? 'Von der Merkliste entfernen' : 'Merken'}>
                <Heart size={18} strokeWidth={1.8} fill={gemerkt ? 'currentColor' : 'none'} />
              </button>
            </div>

            <p className="pdp__ship">
              <Truck size={16} strokeWidth={1.7} />
              {product.soon ? 'Noch nicht bestellbar – wir melden uns, sobald es losgeht.' : `Lieferzeit ${product.lead_time}`}
            </p>

            {product.imageStatus !== 'real_photo' && (
              <p className="pdp__mockup">
                <Info size={14} strokeWidth={1.8} />
                {product.imageStatus === 'placeholder'
                  ? 'Platzhalter – für dieses Produkt liegt noch kein Bild vor.'
                  : 'Vorschau als KI-Muster – echte Produktfotos folgen vor dem Verkauf.'}
              </p>
            )}
          </div>
        </div>
      </section>

      <InfoBloecke material={product.material} care={product.care} lead={product.lead_time} soon={product.soon} size={size} sizeGuide={sizeGuide} />

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
      <StickyBuyBar price={product.price} priceNote={product.priceNote} soon={product.soon} gemeldet={gemeldet} onAdd={hinzufuegen} onNotify={vormerken} />
    </main>
  )
}
