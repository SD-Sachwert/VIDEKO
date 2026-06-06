// Pure client-side scoring/mapping for the VIDEKO Stylefinder.
// Honest from pragmatic budget kitchens up to architecture kitchens.

export const EMPTY_ANSWERS = {
  styleSelections: [],
  living: [],
  projectType: '',
  assembly: '',
  budgetRange: '',
  priorities: { preis: 3, pflege: 3, arbeit: 3, stauraum: 3, geraete: 3, design: 3, robust: 3, schnell: 3 },
  usage: [],
}

// text profiles (images live in the component)
export const PROFILES = {
  kompakt: {
    name: 'Kompakte Budgetküche', budget: 'bis ca. 5.000 €', form: 'Küchenzeile / kleine L-Küche',
    material: 'robuste Standardfronten, pflegeleichte Platte', appliances: 'solide Grundgeräte', assembly: 'Lieferung oder Selbstmontage',
    blurb: 'Klein, klar, bezahlbar. Hier zählt jede gute Entscheidung mehr als jedes Extra – wir holen aus wenig Platz und Budget das Beste raus.',
    tips: ['Auf Standardmaße setzen – das spart spürbar Geld.', 'Lieber wenige, gute Auszüge als viele Spielereien.', 'Pflegeleichte Front + robuste Platte = langer Alltag.'],
    tags: ['kompakt', 'preisbewusst', 'funktional', 'pragmatisch'],
  },
  miet: {
    name: 'Pragmatische Mietküche', budget: 'ca. 3.000–8.000 €', form: 'Zeile / L-Küche',
    material: 'robuste, pflegeleichte Oberflächen', appliances: 'zuverlässige Standardgeräte', assembly: 'pragmatische Montage / Objektlösung',
    blurb: 'Robust, pflegeleicht, wirtschaftlich. Eine Küche, die im Mietobjekt funktioniert, ohne dass du dich an Sonderlösungen verausgabst.',
    tips: ['Auf langlebige, austauschbare Standardteile setzen.', 'Pflegeleichte Oberflächen sparen später Ärger.', 'Klare, einfache Form statt teurer Sonderlösungen.'],
    tags: ['robust', 'pflegeleicht', 'objekt', 'wirtschaftlich'],
  },
  solide: {
    name: 'Solide Alltagsküche', budget: 'ca. 5.000–15.000 €', form: 'L- oder U-Küche',
    material: 'gute Dekorfronten, robuste Arbeitsplatte', appliances: 'starkes Preis-Leistungs-Niveau', assembly: 'Lieferung + Montage',
    blurb: 'Die ehrliche Allrounderin. Gut geplant, gut verarbeitet, ohne Schnickschnack – eine Küche, die im Alltag einfach passt.',
    tips: ['In gute Geräte investieren – die nutzt du täglich.', 'Laufwege sauber planen, das merkt man jeden Tag.', 'Ein, zwei hochwertige Akzente statt überall sparen.'],
    tags: ['alltagstauglich', 'gutes P/L', 'durchdacht'],
  },
  familie: {
    name: 'Moderne Familienküche', budget: 'ca. 12.500–25.000 €', form: 'U- oder L-Küche mit viel Stauraum',
    material: 'robuste, pflegeleichte Materialien', appliances: 'gute Marken-Geräte', assembly: 'Komplettservice',
    blurb: 'Alltag, Familie, Tempo. Viel Stauraum, robuste Oberflächen und klare Wege – schön und gleichzeitig kindersicher belastbar.',
    tips: ['Stauraum lieber großzügig als knapp planen.', 'Pflegeleichte Platten überstehen den Familienalltag.', 'Sichere, leise Auszüge zahlen sich aus.'],
    tags: ['familie', 'stauraum', 'robust', 'alltag'],
  },
  warm: {
    name: 'Warme Wohnküche', budget: 'ca. 15.000–28.000 €', form: 'offene Wohnküche',
    material: 'Holz & warme Naturtöne', appliances: 'hochwertige Geräte', assembly: 'Lieferung + Montage / Komplettservice',
    blurb: 'Küche und Wohnen verschmelzen. Warme Materialien, gutes Licht und eine Atmosphäre, in die man gerne kommt – und bleibt.',
    tips: ['Übergang zum Wohnraum bewusst gestalten.', 'Licht in Schichten planen, nicht nur eine Lampe.', 'Natürliche Materialien bringen Ruhe rein.'],
    tags: ['wohnlich', 'offen', 'natürlich', 'atmosphäre'],
  },
  hobby: {
    name: 'Hobbykoch-Küche', budget: 'ca. 18.000–32.000 €', form: 'L- oder Inselküche mit viel Arbeitsfläche',
    material: 'strapazierfähige Arbeitsplatte', appliances: 'Premium-Kochgeräte', assembly: 'Komplettservice',
    blurb: 'Für Menschen, die wirklich kochen. Arbeitsfläche, gute Geräte und kurze Wege – damit Kochen Spaß macht statt Stress.',
    tips: ['Genug zusammenhängende Arbeitsfläche einplanen.', 'In Kochfeld, Lüftung und Backofen investieren.', 'Ergonomie: Spüle, Herd, Kühlschrank im Dreieck.'],
    tags: ['kochen', 'arbeitsfläche', 'geräte', 'ergonomie'],
  },
  premium: {
    name: 'Premium Statement Küche', budget: 'ca. 25.000–45.000 €', form: 'Inselküche',
    material: 'edle Steine, Metall, Glas', appliances: 'integrierte Premiumgeräte', assembly: 'Komplettservice',
    blurb: 'Eine Küche, die etwas sagt. Edle Materialien, integrierte Technik und eine Insel als Mittelpunkt – hochwertig, nicht protzig.',
    tips: ['Materialkombination bewusst und reduziert wählen.', 'Geräte integrieren für ein ruhiges Gesamtbild.', 'Lichtkonzept macht aus gut → beeindruckend.'],
    tags: ['premium', 'insel', 'design', 'material'],
  },
  architektur: {
    name: 'Kompromisslose Architekturküche', budget: 'ab 40.000 €', form: 'Maß-Inselküche mit Wohnanschluss',
    material: 'Architekturmaterialien & Lichtkonzept', appliances: 'Top-Premium, vollintegriert', assembly: 'VIDEKO Komplettservice',
    blurb: 'Maß, Material, Licht – ohne Kompromisse. Eine Küche, die mit dem Raum eins wird und jedes Detail durchplant.',
    tips: ['Früh in die Architektur-/Bauplanung einsteigen.', 'Material- und Lichtkonzept zusammen denken.', 'Maßanfertigung dort, wo Standard nicht reicht.'],
    tags: ['architektur', 'maßküche', 'neubau', 'premium'],
  },
}

const has = (arr, v) => Array.isArray(arr) && arr.includes(v)

export function computeLeadScore(a, hasUpload = false) {
  let s = 0
  const b = a.budgetRange
  const map = { '12.500–18.000 €': 15, '18.000–25.000 €': 25, '25.000–40.000 €': 35, '40.000 €+': 45 }
  s += map[b] || 0
  if (['Eigentum', 'Neubau'].some((x) => has(a.living, x))) s += 15
  if (['komplette Neuplanung', 'Küche mit Insel', 'offene Wohnküche'].includes(a.projectType)) s += 10
  if (a.assembly === 'Komplettservice durch VIDEKO') s += 15
  if (a.priorities.geraete >= 4 || a.priorities.design >= 4) s += 10
  if (hasUpload) s += 20
  return s
}

export function computeResult(a) {
  const s = { kompakt: 0, miet: 0, solide: 0, familie: 0, warm: 0, hobby: 0, premium: 0, architektur: 0 }
  const add = (k, n) => { s[k] += n }
  const hi = (v) => v >= 4
  const p = a.priorities

  // budget
  const B = {
    'bis 3.000 €': () => { add('kompakt', 3); add('miet', 2) },
    '3.000–5.000 €': () => { add('kompakt', 2); add('miet', 2); add('solide', 1) },
    '5.000–12.500 €': () => { add('solide', 3); add('familie', 1) },
    '12.500–18.000 €': () => { add('solide', 2); add('familie', 2); add('warm', 1) },
    '18.000–25.000 €': () => { add('familie', 2); add('warm', 2); add('hobby', 1) },
    '25.000–40.000 €': () => { add('premium', 3); add('warm', 1); add('hobby', 1) },
    '40.000 €+': () => { add('architektur', 3); add('premium', 2) },
    'noch unsicher': () => { add('solide', 1) },
  }
  B[a.budgetRange]?.()

  // living
  const L = {
    'Alleine': ['kompakt', 'solide'], 'Zu zweit': ['warm', 'warm'], 'Familie': ['familie', 'familie', 'familie'],
    'WG / gemeinschaftliches Wohnen': ['kompakt', 'solide'], 'Mietwohnung': ['miet', 'solide'],
    'Eigentum': ['premium', 'familie'], 'Neubau': ['architektur', 'architektur', 'premium'],
    'Renovierung / Bestand': ['solide', 'familie'], 'Vermietung / Mietobjekt': ['miet', 'miet', 'miet'],
    'Ferienwohnung / Apartment': ['kompakt', 'kompakt', 'miet'],
  }
  a.living.forEach((l) => (L[l] || []).forEach((k) => add(k, 1)))

  // project type
  const P = {
    'Küchenzeile': ['kompakt', 'solide', 'miet'], 'L-Küche': ['solide', 'familie'], 'U-Küche': ['familie', 'solide'],
    'Küche mit Insel': ['premium', 'premium', 'hobby'], 'offene Wohnküche': ['warm', 'warm', 'premium'],
    'kleine Küche / Apartmentküche': ['kompakt', 'kompakt', 'miet'], 'Austausch bestehender Küche': ['miet', 'solide'],
    'komplette Neuplanung': ['premium', 'architektur', 'familie'], 'nur Orientierung / noch unsicher': ['solide'],
  }
  ;(P[a.projectType] || []).forEach((k) => add(k, 1))

  // assembly
  const A = {
    'Komplettservice durch VIDEKO': ['premium', 'architektur', 'familie'], 'Lieferung + Montage': ['solide', 'familie'],
    'Lieferung ohne Montage': ['kompakt', 'miet'], 'Selbstmontage geplant': ['kompakt', 'kompakt', 'kompakt'],
    'Vermieter-/Objektlösung mit pragmatischer Umsetzung': ['miet', 'miet', 'miet'], 'Ich weiß es noch nicht': [],
  }
  ;(A[a.assembly] || []).forEach((k) => add(k, 1))

  // priorities
  if (hi(p.preis)) { add('kompakt', 2); add('miet', 1); add('solide', 1) }
  if (hi(p.pflege)) { add('miet', 1); add('familie', 1) }
  if (hi(p.arbeit)) { add('hobby', 2) }
  if (hi(p.stauraum)) { add('familie', 2) }
  if (hi(p.geraete)) { add('hobby', 1); add('premium', 1) }
  if (hi(p.design)) { add('premium', 2); add('warm', 1); add('architektur', 1) }
  if (hi(p.robust)) { add('miet', 1); add('familie', 1) }
  if (hi(p.schnell)) { add('kompakt', 1); add('miet', 1) }

  // usage
  const U = {
    'schnelle Alltagsküche': ['solide', 'solide'], 'viel Kochen / Hobbykoch': ['hobby', 'hobby', 'hobby'],
    'Familie mit viel Stauraum': ['familie', 'familie', 'familie'], 'selten genutzt / Mietobjekt': ['miet', 'miet', 'miet'],
    'repräsentative Wohnküche': ['premium', 'premium', 'warm'], 'pflegeleicht und robust': ['miet', 'familie'],
    'kleine Wohnung / wenig Platz': ['kompakt', 'kompakt'], 'offene Küche mit Wohnbereich': ['warm', 'warm'],
  }
  a.usage.forEach((u) => (U[u] || []).forEach((k) => add(k, 1)))

  // style nudges
  if (has(a.styleSelections, 'Dunkel & elegant')) add('premium', 1)
  if (has(a.styleSelections, 'Statement / Industrial')) { add('premium', 1); add('architektur', 1) }
  if (has(a.styleSelections, 'Warm & natürlich')) add('warm', 1)
  if (has(a.styleSelections, 'Landhaus modern')) { add('warm', 1); add('familie', 1) }
  if (has(a.styleSelections, 'Modern & grifflos')) { add('solide', 1); add('premium', 1) }
  if (has(a.styleSelections, 'Hell & zeitlos')) { add('solide', 1); add('warm', 1) }

  let type = 'solide'
  let best = -1
  for (const k of Object.keys(s)) { if (s[k] > best) { best = s[k]; type = k } }
  const total = Object.values(s).reduce((x, y) => x + y, 0) || 1
  const score = Math.max(78, Math.min(96, Math.round(72 + (best / total) * 80)))

  return { type, score, leadScore: computeLeadScore(a) }
}
