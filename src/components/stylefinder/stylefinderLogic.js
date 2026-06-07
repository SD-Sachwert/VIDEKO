// Pure client-side scoring for the 8-step VIDEKO Stylefinder.

export const PRIORITY_LIST = [
  'Design', 'Stauraum', 'Alltagstauglichkeit', 'Preis-Leistung', 'Hochwertige Materialien',
  'Familienfreundlichkeit', 'Offene Raumwirkung', 'Einfache Pflege', 'Besondere Details',
]

export const EMPTY_ANSWERS = {
  styleSelections: [],
  mehrwerte: [],
  materials: [],
  farbwelten: [],
  funktion: [],
  budget: '',
  prioritaeten: [...PRIORITY_LIST],
}

const has = (arr, v) => Array.isArray(arr) && arr.includes(v)

export function computeProfile(a) {
  const b = { Natürlichkeit: 18, Wärme: 18, Zeitlosigkeit: 18, Eleganz: 18, Purismus: 18, Funktionalität: 18, Offenheit: 18, Komfort: 18 }
  const inc = (k, n) => { b[k] += n }
  const S = a.styleSelections
  if (has(S, 'Warm & natürlich')) { inc('Natürlichkeit', 24); inc('Wärme', 26) }
  if (has(S, 'Landhaus modern')) { inc('Natürlichkeit', 18); inc('Wärme', 16); inc('Komfort', 8) }
  if (has(S, 'Modern & grifflos')) { inc('Purismus', 28); inc('Zeitlosigkeit', 12) }
  if (has(S, 'Hell & zeitlos')) { inc('Zeitlosigkeit', 26); inc('Offenheit', 10) }
  if (has(S, 'Dunkel & elegant')) { inc('Eleganz', 28) }
  if (has(S, 'Statement / Industrial')) { inc('Eleganz', 16); inc('Purismus', 8) }

  const M = a.mehrwerte
  if (has(M, 'Familienzeit')) inc('Komfort', 12)
  if (has(M, 'Gäste & Geselligkeit')) { inc('Offenheit', 10); inc('Komfort', 8) }
  if (has(M, 'Kochen mit Freude')) inc('Funktionalität', 10)
  if (has(M, 'Viel Stauraum')) inc('Funktionalität', 12)
  if (has(M, 'Aufgeräumte Ruhe')) inc('Purismus', 12)
  if (has(M, 'Offenes Wohnen')) inc('Offenheit', 16)
  if (has(M, 'Schnelle Alltagsküche')) inc('Funktionalität', 10)
  if (has(M, 'Statement-Design')) inc('Eleganz', 10)
  if (has(M, 'Pflegeleicht')) inc('Funktionalität', 8)
  if (has(M, 'Natürliches Wohngefühl')) { inc('Natürlichkeit', 14); inc('Wärme', 10) }
  if (has(M, 'Mehr Licht')) inc('Offenheit', 12)
  if (has(M, 'Kurze Wege')) inc('Funktionalität', 10)

  const MA = a.materials
  if (has(MA, 'Holz') || has(MA, 'Warme Hölzer')) { inc('Natürlichkeit', 12); inc('Wärme', 12) }
  if (has(MA, 'Naturstein') || has(MA, 'Dunkler Stein')) { inc('Eleganz', 8); inc('Zeitlosigkeit', 8) }
  if (has(MA, 'Keramik')) inc('Zeitlosigkeit', 8)
  if (has(MA, 'Glas')) inc('Offenheit', 8)
  if (has(MA, 'Metall')) inc('Eleganz', 8)
  if (has(MA, 'Mattlack')) inc('Purismus', 10)
  if (has(MA, 'Rillenfronten')) inc('Eleganz', 6)
  if (has(MA, 'Gebürstetes Messing')) inc('Eleganz', 8)
  if (has(MA, 'Helle Oberflächen')) inc('Zeitlosigkeit', 8)

  const F = a.farbwelten
  if (has(F, 'Hell & natürlich')) { inc('Natürlichkeit', 10); inc('Offenheit', 8) }
  if (has(F, 'Beige & Sand')) { inc('Wärme', 10); inc('Zeitlosigkeit', 6) }
  if (has(F, 'Warmes Holz')) inc('Wärme', 12)
  if (has(F, 'Dunkel & elegant')) inc('Eleganz', 12)
  if (has(F, 'Greige modern')) inc('Purismus', 10)
  if (has(F, 'Schwarz & Bronze')) inc('Eleganz', 12)
  if (has(F, 'Soft White')) { inc('Zeitlosigkeit', 10); inc('Purismus', 6) }
  if (has(F, 'Stein & Taupe')) inc('Zeitlosigkeit', 8)

  a.funktion.forEach(() => inc('Funktionalität', 4))
  if (has(a.funktion, 'Offene Wohnküche')) inc('Offenheit', 10)
  if (has(a.funktion, 'Kücheninsel')) inc('Offenheit', 8)
  if (has(a.funktion, 'Frühstücksplatz')) inc('Komfort', 8)
  if (has(a.funktion, 'Homebar')) inc('Komfort', 8)

  const bars = {}
  for (const k of Object.keys(b)) bars[k] = Math.max(6, Math.min(100, Math.round(b[k])))

  let n = 0
  if (a.styleSelections.length) n++
  if (a.mehrwerte.length) n++
  if (a.materials.length) n++
  if (a.farbwelten.length) n++
  if (a.funktion.length) n++
  if (a.budget) n++
  n++ // priorities always set
  const completeness = Math.round((n / 7) * 100)
  return { bars, completeness }
}

export function computeResultStyle(a) {
  const sc = { 'Modern & grifflos': 0, 'Warm & natürlich': 0, 'Dunkel & elegant': 0, 'Hell & zeitlos': 0, 'Landhaus modern': 0, 'Statement / Industrial': 0 }
  a.styleSelections.forEach((s) => { if (s in sc) sc[s] += 3 })
  if (has(a.farbwelten, 'Warmes Holz') || has(a.materials, 'Warme Hölzer') || has(a.materials, 'Holz')) sc['Warm & natürlich'] += 1
  if (has(a.farbwelten, 'Dunkel & elegant') || has(a.farbwelten, 'Schwarz & Bronze') || has(a.materials, 'Dunkler Stein')) sc['Dunkel & elegant'] += 1
  if (has(a.farbwelten, 'Soft White') || has(a.materials, 'Mattlack') || has(a.materials, 'Helle Oberflächen')) sc['Hell & zeitlos'] += 1
  if (has(a.materials, 'Metall') || has(a.materials, 'Gebürstetes Messing')) sc['Statement / Industrial'] += 1
  let top = 'Warm & natürlich'
  let best = -1
  for (const k of Object.keys(sc)) { if (sc[k] > best) { best = sc[k]; top = k } }
  return top
}
