/**
 * Produkt-Vollständigkeits- und Veröffentlichungsprüfung.
 *
 * Trennt bewusst ZWEI Ebenen (siehe docs/compliance):
 *   A) RECHT/GPSR – gesetzliche Pflichtangaben für den Verkauf an Verbraucher
 *      (Textilkennzeichnungsverordnung EU 1007/2011, GPSR EU 2023/988, Preisangaben)
 *      sowie die interne GPSR-Produktakte (Lieferkette/Nachweise).
 *   B) INTERNE QUALITÄTS-/VERKAUFSFREIGABE – keine gesetzliche Pflicht, aber von
 *      uns gesetzte Freigabekriterien (z. B. verlässliche Produktdarstellung statt
 *      KI-Mockup). Blockt den Launch, ist aber KEIN GPSR-Nachweis.
 *
 * Erfindet nichts – meldet nur Lücken.
 *
 *   node scripts/check-products.mjs            # Bericht in die Konsole
 *   node scripts/check-products.mjs --md       # zusätzlich Markdown-Report schreiben
 *
 * Exit-Code 1, sobald ein als `live` markiertes Produkt eine Recht- ODER
 * Qualitäts-Lücke hat. Dadurch als Launch-Gate (CI / pre-deploy) verwendbar.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const roh = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url)))
const { INTERNAL_RECORDS } = await import('../src/data/compliance.js')

const internalRecord = (p) =>
  INTERNAL_RECORDS[p.productType] ||
  INTERNAL_RECORDS[p.category === 'Accessoires' ? 'accessory' : 'tshirt']

const REAL_IMAGE = new Set(['final', 'real_photo'])

function pruefe(p) {
  const recht = [] // A) gesetzliche Pflicht (Textil/GPSR/Preisangaben)
  const quali = [] // B) interne Qualitäts-/Verkaufsfreigabe (keine Gesetzespflicht)

  // --- A) Rechtliche Pflichtangaben ---------------------------------------
  if (!p.name) recht.push('Produktname')
  if (!p.sku) recht.push('SKU/Artikelnummer')
  if (!p.productType) recht.push('Produktart')
  if (!p.colors?.length) recht.push('Farbe')
  if (!p.sizes?.length && p.category !== 'Accessoires') recht.push('Größe(n)')

  // Material MIT Prozentangabe – Textilkennzeichnung verlangt exakte Anteile;
  // "hochwertiger Baumwollmix" o. Ä. reicht nicht.
  if (!p.material) recht.push('Materialzusammensetzung')
  else if (!/\d\s*%/.test(p.material)) recht.push(`Material ohne %-Angabe ("${p.material}")`)

  if (!p.care) recht.push('Pflegehinweise')
  if (!p.lead_time) recht.push('Lieferzeit')

  // Preis: live-Produkte brauchen einen Preis inkl. USt (Preisangabenverordnung).
  if (p.status === 'live' && (p.price == null || Number.isNaN(p.price))) recht.push('Preis (inkl. USt)')

  // Interne GPSR-Produktakte (Lieferant/Hersteller/Nachweise/Risikoanalyse).
  // Das IST rechtliche Compliance (Rückverfolgbarkeit/Produktsicherheit).
  // HINWEIS: Herkunftsland ist bewusst KEIN pauschaler Pflicht-Blocker – es wird
  // intern erfasst und angezeigt, sobald bekannt (siehe compliance.js).
  const rec = internalRecord(p)
  const gpsrOffen = !rec || rec.complete !== true
  if (gpsrOffen) recht.push('GPSR-Produktakte intern unvollständig (Lieferant/Hersteller/Nachweise offen)')

  // --- B) Interne Qualitäts-/Verkaufsfreigabe -----------------------------
  // Echtes/verlässliches Produktfoto statt KI-Mockup. KEIN GPSR-Nachweis,
  // sondern unsere eigene Freigabe für eine seriöse Produktdarstellung.
  if (!REAL_IMAGE.has(p.imageStatus)) quali.push(`Keine verlässliche Produktdarstellung (imageStatus: ${p.imageStatus || 'fehlt'})`)

  return { recht, quali }
}

const ergebnisse = roh.map((p) => ({ p, ...pruefe(p) }))
// Ein live-Produkt gilt als NICHT veröffentlichungsfähig, wenn eine Recht- ODER
// eine Qualitätslücke besteht.
const liveBlockiert = ergebnisse.filter(
  (r) => r.p.status === 'live' && (r.recht.length || r.quali.length),
)
const rechtLuecken = ergebnisse.filter((r) => r.recht.length)
const qualiLuecken = ergebnisse.filter((r) => r.quali.length)

console.log(`\nGeprüfte Produkte: ${roh.length}`)
console.log(`Davon live: ${roh.filter((p) => p.status === 'live').length}`)
console.log(`Live blockiert (Recht oder Qualität): ${liveBlockiert.length}`)
console.log(`Mit Recht-/GPSR-Lücken: ${rechtLuecken.length}`)
console.log(`Mit Qualitäts-/Freigabe-Lücken: ${qualiLuecken.length}\n`)

for (const r of ergebnisse) {
  if (!r.recht.length && !r.quali.length) continue
  const liveBlock = r.p.status === 'live' && (r.recht.length || r.quali.length)
  const flag = liveBlock ? '❌ LIVE-STOPP' : r.recht.length ? '⚠️  Recht offen' : 'ℹ️  Qualität offen'
  console.log(`${flag}  ${r.p.id}  (${r.p.status})`)
  r.recht.forEach((f) => console.log(`     Recht/GPSR: ${f}`))
  r.quali.forEach((w) => console.log(`     Qualität:   ${w}`))
}

if (process.argv.includes('--md')) {
  mkdirSync(new URL('../docs/compliance/', import.meta.url), { recursive: true })
  let md = `# Produkt-Vollständigkeit\n\n`
  md += `_Automatisch erzeugt von scripts/check-products.mjs. Nicht von Hand pflegen._\n\n`
  md += `Zwei getrennte Ebenen:\n`
  md += `- **Recht/GPSR** – gesetzliche Pflichtangaben (Textilkennzeichnung, GPSR-Produktakte, Preisangaben).\n`
  md += `- **Qualität/Freigabe** – interne Verkaufsfreigabe (z. B. verlässliche Produktdarstellung). Keine Gesetzespflicht.\n\n`
  md += `- Produkte gesamt: **${roh.length}**\n`
  md += `- Live blockiert (Recht oder Qualität): **${liveBlockiert.length}**\n`
  md += `- Mit Recht-/GPSR-Lücken: **${rechtLuecken.length}**\n`
  md += `- Mit Qualitäts-/Freigabe-Lücken: **${qualiLuecken.length}**\n\n`
  md += `| Produkt | Status | Recht/GPSR offen | Qualität/Freigabe offen |\n|---|---|---|---|\n`
  for (const r of ergebnisse) {
    if (!r.recht.length && !r.quali.length) continue
    md += `| ${r.p.id} | ${r.p.status} | ${r.recht.join('; ') || '–'} | ${r.quali.join('; ') || '–'} |\n`
  }
  writeFileSync(new URL('../docs/compliance/produkt-vollstaendigkeit.md', import.meta.url), md)
  console.log('\ndocs/compliance/produkt-vollstaendigkeit.md geschrieben.')
}

if (liveBlockiert.length) {
  console.error(`\nAbbruch: ${liveBlockiert.length} als "live" markierte(s) Produkt(e) sind nicht veröffentlichungsfähig.`)
  process.exit(1)
}
