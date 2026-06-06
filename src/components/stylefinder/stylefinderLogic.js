// Pure, client-side scoring/mapping for the VIDEKO Stylefinder.
// No side effects, no imports — easy to reason about and test.

export const EMPTY_ANSWERS = {
  styleSelections: [],
  layout: '',
  budgetRange: '',
  applianceLevel: 3,
  selectedAppliances: [],
  materialMoods: [],
  countertopImportance: 3,
  cookingUsage: [],
  storageImportance: 3,
  easyCareImportance: 3,
  projectStatus: '',
  timeline: '',
}

const has = (arr, v) => Array.isArray(arr) && arr.includes(v)

function applianceText(level) {
  return [
    'solide Grundausstattung',
    'gutes Preis-Leistungs-Verhältnis',
    'einen Tick besser als Standard',
    'hochwertige Markengeräte',
    'Premium-Geräte – Technikspielzeug erlaubt',
  ][Math.min(4, Math.max(0, level - 1))]
}

function assessBudget(a) {
  const big = a.layout === 'Inselküche' || a.layout === 'Wohnküche / offen'
  const premiumWish = a.applianceLevel >= 5 || a.countertopImportance >= 5
  if (big && premiumWish && (a.budgetRange === '5.000–12.500 €' || a.budgetRange === '12.500–18.000 €')) {
    return 'sportlich – hier müssen wir clever priorisieren'
  }
  if (a.budgetRange === '5.000–12.500 €') return 'machbar, aber sauber begrenzen'
  if (a.budgetRange === '12.500–18.000 €') return 'realistisch, aber sauber priorisieren'
  if (a.budgetRange === '18.000–25.000 €') return 'gute Basis für eine starke Planung'
  if (a.budgetRange === '25.000–40.000 €' || a.budgetRange === '40.000 €+') return 'viel Spielraum für hochwertige Details'
  return 'realistisch einschätzbar, sobald wir mehr sehen'
}

export function computeLeadScore(a, hasUpload = false) {
  let s = 0
  const b = a.budgetRange
  if (b === '12.500–18.000 €') s += 10
  if (b === '18.000–25.000 €') s += 20
  if (b === '25.000–40.000 €') s += 30
  if (b === '40.000 €+') s += 40
  if (a.timeline === 'sofort / schnellstmöglich') s += 30
  if (a.timeline === '1–3 Monate') s += 20
  if (a.timeline === '3–6 Monate') s += 10
  if (['Ich plane konkret', 'Ich habe schon ein Angebot', 'Neubau / Umbau läuft', 'Küche muss bald bestellt werden'].includes(a.projectStatus)) s += 20
  if (a.applianceLevel >= 4) s += 10
  if (hasUpload) s += 20
  return s
}

export function computeResult(a) {
  const s = {
    ModernWarm: 0, DarkLuxury: 0, NaturalLiving: 0, CleanMinimal: 0,
    FamilySmart: 0, CountryModern: 0, CompactClever: 0, PremiumStatement: 0,
  }

  if (has(a.styleSelections, 'Modern & grifflos')) { s.ModernWarm += 2; s.CleanMinimal += 2 }
  if (has(a.styleSelections, 'Warm & natürlich')) { s.ModernWarm += 2; s.NaturalLiving += 2 }
  if (has(a.styleSelections, 'Dunkel & elegant')) { s.DarkLuxury += 3 }
  if (has(a.styleSelections, 'Hell & zeitlos')) { s.CleanMinimal += 2; s.ModernWarm += 1 }
  if (has(a.styleSelections, 'Landhaus modern')) { s.CountryModern += 3; s.NaturalLiving += 1 }
  if (has(a.styleSelections, 'Statement / Industrial')) { s.PremiumStatement += 2; s.DarkLuxury += 1 }

  if (a.layout === 'Inselküche' || a.layout === 'Wohnküche / offen') { s.PremiumStatement += 2; s.DarkLuxury += 1 }
  if (a.layout === 'Zeile' || a.layout === 'L-Küche') { s.CompactClever += 2 }

  if (a.budgetRange === '25.000–40.000 €' || a.budgetRange === '40.000 €+') { s.DarkLuxury += 2; s.PremiumStatement += 2 }
  if (a.budgetRange === '5.000–12.500 €') { s.CompactClever += 2 }

  if (a.applianceLevel >= 4) { s.DarkLuxury += 1; s.PremiumStatement += 1 }

  if (has(a.materialMoods, 'hochwertig & edel')) { s.DarkLuxury += 2; s.PremiumStatement += 1 }
  if (has(a.materialMoods, 'natürlich & warm') || has(a.materialMoods, 'helle Naturtöne')) { s.NaturalLiving += 2; s.ModernWarm += 1 }
  if (has(a.materialMoods, 'minimalistisch')) { s.CleanMinimal += 2 }
  if (has(a.materialMoods, 'familienfreundlich')) { s.FamilySmart += 2 }
  if (has(a.materialMoods, 'pflegeleicht')) { s.FamilySmart += 1; s.CleanMinimal += 1 }
  if (has(a.materialMoods, 'dunkle Akzente')) { s.DarkLuxury += 1 }
  if (has(a.materialMoods, 'besonders / auffällig')) { s.PremiumStatement += 1 }
  if (a.countertopImportance >= 4) { s.PremiumStatement += 1; s.DarkLuxury += 1 }

  if (has(a.cookingUsage, 'Familie & viel Stauraum')) { s.FamilySmart += 2 }
  if (has(a.cookingUsage, 'Ich empfange gerne Gäste')) { s.PremiumStatement += 1; s.ModernWarm += 1 }
  if (has(a.cookingUsage, 'Design im Fokus')) { s.DarkLuxury += 1; s.CleanMinimal += 1 }
  if (has(a.cookingUsage, 'Schnell & praktisch')) { s.CompactClever += 1; s.CleanMinimal += 1 }
  if (a.storageImportance >= 4) { s.FamilySmart += 1 }
  if (a.easyCareImportance >= 4) { s.FamilySmart += 1; s.CleanMinimal += 1 }

  let type = 'ModernWarm'
  let best = -1
  for (const k of Object.keys(s)) {
    if (s[k] > best) { best = s[k]; type = k }
  }
  const total = Object.values(s).reduce((x, y) => x + y, 0) || 1
  const score = Math.max(78, Math.min(96, Math.round(72 + (best / total) * 70)))

  return {
    type,
    score,
    budgetAssessment: assessBudget(a),
    applianceText: applianceText(a.applianceLevel),
    leadScore: computeLeadScore(a),
  }
}
