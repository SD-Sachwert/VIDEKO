/**
 * Produkt-Vollständigkeits- und Veröffentlichungsprüfung.
 *
 * AKTUELLER VERKAUFSUMFANG: Es wird nur EINE Blankware-Produktfamilie verkauft
 * (SOL'S Imperial 11500, siehe src/data/compliance.js). Nur Produkte, die
 * tatsächlich kaufbar sind (`purchasable: true`, i. d. R. auch `status: live`),
 * werden gegen die gesetzlichen Launch-Gates geprüft.
 *
 * Coming-soon-Produkte (`purchasable: false`) BLOCKIEREN den aktuellen
 * Shirt-Launch NICHT. Sie werden separat als „noch nicht für den Verkauf
 * dokumentiert" ausgewiesen und erst vor ihrer späteren Aktivierung vollständig
 * belegt.
 *
 * Zwei Ebenen für kaufbare Produkte:
 *   RECHT/GPSR – gesetzliche Pflichtangaben (Textilkennzeichnung EU 1007/2011,
 *     Preisangaben) + vollständige interne Blankware-/GPSR-Produktakte.
 *   QUALITÄT   – interne Verkaufsfreigabe (z. B. verlässliche Produktdarstellung
 *     statt KI-Mockup). Keine Gesetzespflicht, aber selbst gesetzter Blocker.
 *
 * Erfindet nichts – meldet nur Lücken.
 *
 *   node scripts/check-products.mjs            # Bericht in die Konsole
 *   node scripts/check-products.mjs --md       # zusätzlich Markdown-Report schreiben
 *
 * Exit-Code 1, sobald ein KAUFBARES Produkt eine Recht- ODER Qualitäts-Lücke
 * hat. Dadurch als Launch-Gate (CI / pre-deploy) verwendbar.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const roh = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url)))
const { PRODUCT_FAMILIES } = await import('../src/data/compliance.js')

const FAMILY_BY_VG = Object.fromEntries(
  Object.values(PRODUCT_FAMILIES).flatMap((f) => (f.variantGroups || []).map((vg) => [vg, f])),
)
const familyOf = (p) => FAMILY_BY_VG[p.variantGroup] || null

// Kaufbar = explizit purchasable. Fail-safe: ohne Flag NICHT kaufbar.
const istKaufbar = (p) => p.purchasable === true

const REAL_IMAGE = new Set(['final', 'real_photo'])

/** Gesetzliche + interne Prüfung eines KAUFBAREN Produkts. */
function pruefeKaufbar(p) {
  const recht = [] // gesetzliche Pflicht (Textil/GPSR/Preisangaben)
  const quali = [] // interne Qualitäts-/Verkaufsfreigabe (keine Gesetzespflicht)

  if (!p.name) recht.push('Produktname')
  if (!p.sku) recht.push('SKU/Artikelnummer')
  if (!p.productType) recht.push('Produktart')
  if (!p.colors?.length) recht.push('Farbe')
  if (!p.sizes?.length && p.category !== 'Accessoires') recht.push('Größe(n)')

  // Material MIT Prozentangabe (Textilkennzeichnung verlangt exakte Anteile).
  if (!p.material) recht.push('Materialzusammensetzung')
  else if (!/\d\s*%/.test(p.material)) recht.push(`Material ohne %-Angabe ("${p.material}")`)

  if (!p.care) recht.push('Pflegehinweise')
  if (!p.lead_time) recht.push('Lieferzeit')
  if (p.price == null || Number.isNaN(p.price)) recht.push('Preis (inkl. USt)')

  // Interne Blankware-/GPSR-Produktakte der Familie (Lieferkette/Nachweise/
  // Veredelung/Risikoanalyse). Herkunftsland ist bewusst KEIN Pflicht-Blocker.
  const fam = familyOf(p)
  if (!fam) recht.push('Keiner belegten Blankware-Produktfamilie zugeordnet')
  else if (fam.complete !== true) recht.push(`Blankware-/GPSR-Akte „${fam.id}" unvollständig (Lieferkette/Veredelung/Nachweise offen)`)

  // Verlässliche Produktdarstellung statt KI-Mockup (KEIN GPSR-Nachweis).
  if (!REAL_IMAGE.has(p.imageStatus)) quali.push(`Keine verlässliche Produktdarstellung (imageStatus: ${p.imageStatus || 'fehlt'})`)

  return { recht, quali }
}

const kaufbar = roh.filter(istKaufbar).map((p) => ({ p, ...pruefeKaufbar(p) }))
const comingSoon = roh.filter((p) => !istKaufbar(p))

const rechtBlocker = kaufbar.filter((r) => r.recht.length)
const qualiBlocker = kaufbar.filter((r) => r.quali.length)
const blockiert = kaufbar.filter((r) => r.recht.length || r.quali.length)

// Coming-soon nach Produkttyp gruppieren (nur informativ, kein Blocker).
const soonNachTyp = {}
for (const p of comingSoon) {
  const t = p.productType || 'sonstige'
  soonNachTyp[t] = (soonNachTyp[t] || 0) + 1
}

console.log(`\nProdukte gesamt: ${roh.length}`)
console.log(`Aktuell kaufbar (purchasable): ${kaufbar.length}`)
console.log(`Coming soon (nicht kaufbar): ${comingSoon.length}`)
console.log(`Kaufbare mit Rechts-/GPSR-Blocker: ${rechtBlocker.length}`)
console.log(`Kaufbare mit Qualitäts-Blocker: ${qualiBlocker.length}`)

console.log(`\nA. Aktuell kaufbare Produkte`)
if (!kaufbar.length) console.log('   (keine)')
for (const r of kaufbar) {
  const status = r.recht.length || r.quali.length ? '❌ nicht freigabefähig' : '✅ vollständig'
  console.log(`   ${status}  ${r.p.id}  [${familyOf(r.p)?.id || 'ohne Familie'}]`)
}

console.log(`\nB. Coming-soon-Produkte (blockieren den aktuellen Verkauf NICHT)`)
console.log(`   Gesamt: ${comingSoon.length}`)
for (const [typ, n] of Object.entries(soonNachTyp).sort((a, b) => b[1] - a[1])) {
  console.log(`   – ${typ}: ${n}`)
}

console.log(`\nC. Rechtliche Blocker für den aktuellen Verkaufsstart`)
if (!rechtBlocker.length) console.log('   (keine)')
for (const r of rechtBlocker) {
  console.log(`   ${r.p.id}`)
  r.recht.forEach((f) => console.log(`      · ${f}`))
}

console.log(`\nD. Interne Qualitätsblocker für den aktuellen Verkaufsstart`)
if (!qualiBlocker.length) console.log('   (keine)')
for (const r of qualiBlocker) {
  console.log(`   ${r.p.id}`)
  r.quali.forEach((f) => console.log(`      · ${f}`))
}

console.log(`\nE. Spätere Aufgaben vor Aktivierung der Coming-soon-Produkte`)
console.log(`   Vor „live"-Schaltung je Coming-soon-Familie: Blankware-/Veredelungsakte,`)
console.log(`   Materialnachweise, verlässliche Produktdarstellung, Preis und Größen belegen.`)

if (process.argv.includes('--md')) {
  mkdirSync(new URL('../docs/compliance/', import.meta.url), { recursive: true })
  let md = `# Produkt-Vollständigkeit\n\n`
  md += `_Automatisch erzeugt von scripts/check-products.mjs. Nicht von Hand pflegen._\n\n`
  md += `Aktueller Verkaufsumfang: **eine Blankware-Produktfamilie** (SOL'S Imperial 11500). `
  md += `Nur kaufbare Produkte (\`purchasable: true\`) werden gegen die gesetzlichen Launch-Gates geprüft. `
  md += `Coming-soon-Produkte blockieren den aktuellen Verkauf **nicht**.\n\n`
  md += `- Produkte gesamt: **${roh.length}**\n`
  md += `- Aktuell kaufbar: **${kaufbar.length}**\n`
  md += `- Coming soon (nicht kaufbar): **${comingSoon.length}**\n`
  md += `- Kaufbare mit Rechts-/GPSR-Blocker: **${rechtBlocker.length}**\n`
  md += `- Kaufbare mit Qualitäts-Blocker: **${qualiBlocker.length}**\n\n`

  md += `## A. Aktuell kaufbare Produkte\n\n`
  md += `| Produkt | Familie | Recht/GPSR offen | Qualität/Freigabe offen |\n|---|---|---|---|\n`
  for (const r of kaufbar) {
    md += `| ${r.p.id} | ${familyOf(r.p)?.id || '–'} | ${r.recht.join('; ') || '–'} | ${r.quali.join('; ') || '–'} |\n`
  }

  md += `\n## B. Coming-soon-Produkte (kein Verkaufs-Blocker)\n\n`
  md += `Gesamt: **${comingSoon.length}**. Nach Produktart:\n\n`
  for (const [typ, n] of Object.entries(soonNachTyp).sort((a, b) => b[1] - a[1])) {
    md += `- ${typ}: ${n}\n`
  }

  md += `\n## C. Rechtliche Blocker für den aktuellen Verkaufsstart\n\n`
  if (!rechtBlocker.length) md += `Keine.\n`
  for (const r of rechtBlocker) md += `- **${r.p.id}**: ${r.recht.join('; ')}\n`

  md += `\n## D. Interne Qualitätsblocker für den aktuellen Verkaufsstart\n\n`
  if (!qualiBlocker.length) md += `Keine.\n`
  for (const r of qualiBlocker) md += `- **${r.p.id}**: ${r.quali.join('; ')}\n`

  md += `\n## E. Spätere Aufgaben (vor Aktivierung der Coming-soon-Produkte)\n\n`
  md += `Vor der „live"-Schaltung einer Coming-soon-Familie sind Blankware-/Veredelungsakte, `
  md += `Materialnachweise, eine verlässliche Produktdarstellung sowie Preis und Größen zu belegen.\n`

  writeFileSync(new URL('../docs/compliance/produkt-vollstaendigkeit.md', import.meta.url), md)
  console.log('\ndocs/compliance/produkt-vollstaendigkeit.md geschrieben.')
}

if (blockiert.length) {
  console.error(`\nAbbruch: ${blockiert.length} kaufbare(s) Produkt(e) sind nicht veröffentlichungsfähig.`)
  process.exit(1)
}
