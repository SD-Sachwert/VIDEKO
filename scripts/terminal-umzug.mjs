/**
 * Umzug des Terminals: buchhaltung (alt) -> videko-core-pilot (neu).
 *
 * Das alte Projekt ist ausschliesslich LESBAR. Jede Abfrage dorthin laeuft
 * ueber quelleLesen(), und die laesst nur eine einzelne SELECT/WITH-Abfrage
 * ohne Semikolon und ohne schreibendes Schluesselwort durch. Eine Funktion,
 * die schreibt, prueft zuerst, dass das Ziel videko-core-pilot ist.
 *
 * Zugang: ein Supabase Personal Access Token in SUPABASE_ACCESS_TOKEN oder in
 * der Datei .env.umzug.local (von .gitignore erfasst). Der Token wird nie
 * ausgegeben.
 *
 *   node scripts/terminal-umzug.mjs status      Token + Projektnamen pruefen
 *   node scripts/terminal-umzug.mjs bestand     Phase 1-3: Quelle + Ziel lesen, Backup schreiben
 *   node scripts/terminal-umzug.mjs schema      Phase 4: Migrationen im Ziel pruefen (eingespielt per db push im Core-Repo)
 *   node scripts/terminal-umzug.mjs kopieren    Phase 5: Daten Quelle -> Ziel
 *   node scripts/terminal-umzug.mjs vergleichen Phase 6: Quelle und Ziel vergleichen
 *   node scripts/terminal-umzug.mjs abgleich    nach der Umstellung: neue Zeilen nachziehen
 *   node scripts/terminal-umzug.mjs vercel-env  Phase 7: TERMINAL_SUPABASE_* in Vercel setzen
 */

import { createHash, randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const QUELLE = { ref: 'tshdfkmpkcpkeufplzda', name: 'buchhaltung' }
const ZIEL = { ref: 'ewxvgzxifeuriukfqsld', name: 'videko-core-pilot' }
const BACKUP = 'backup/terminal-migration-2026-09-15'
const API = 'https://api.supabase.com/v1'
const MUSTER = `'videko\\_terminal\\_%'`
const STUECK_BYTES = 900_000

/* ------------------------------------------------------------------ */
/* Zugang                                                              */
/* ------------------------------------------------------------------ */

function tokenLesen() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN.trim()
  if (existsSync('.env.umzug.local')) {
    for (const zeile of readFileSync('.env.umzug.local', 'utf8').split(/\r?\n/)) {
      const m = zeile.match(/^\s*SUPABASE_ACCESS_TOKEN\s*=\s*"?([^"\s]+)"?\s*$/)
      if (m) return m[1]
    }
  }
  return ''
}

const TOKEN = tokenLesen()

/** Fehlertexte koennen Zeileninhalte enthalten. E-Mails nie ausgeben. */
const schwaerzen = (text) =>
  String(text).replace(/[^\s"'(),]+@[^\s"'(),]+\.[a-z]{2,}/gi, '[email]').slice(0, 800)

async function api(methode, pfad, koerper) {
  const antwort = await fetch(API + pfad, {
    method: methode,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: koerper === undefined ? undefined : JSON.stringify(koerper),
  })
  const text = await antwort.text()
  let daten
  try {
    daten = JSON.parse(text)
  } catch {
    daten = text
  }
  return { status: antwort.status, ok: antwort.ok, daten }
}

function abbruch(text) {
  console.error(`ABBRUCH: ${schwaerzen(text)}`)
  process.exit(2)
}

/* ------------------------------------------------------------------ */
/* Lesen und Schreiben                                                 */
/* ------------------------------------------------------------------ */

const SCHREIBWORTE =
  /\b(insert|update|delete|merge|upsert|alter|create|drop|truncate|grant|revoke|comment|copy|vacuum|analyze|cluster|reindex|call|do|set|reset|lock|refresh|execute|prepare|deallocate|listen|notify|begin|commit|rollback|savepoint|start|security|nextval|setval|pg_terminate_backend|pg_cancel_backend|pg_reload_conf|dblink|lo_import|lo_export|pg_advisory_lock|pg_advisory_xact_lock|set_config|into)\b/i

function lesendeAbfrage(sql) {
  const s = sql.trim()
  if (!/^(select|with)\b/i.test(s)) return false
  if (s.includes(';')) return false
  if (SCHREIBWORTE.test(s)) return false
  return true
}

let quellWeg = null

/** Die einzige Stelle, die das alte Projekt anspricht. */
async function quelleLesen(sql) {
  if (!lesendeAbfrage(sql)) abbruch('Abfrage an buchhaltung ist nicht eindeutig lesend — nicht ausgefuehrt.')
  /* Bevorzugt der Nur-Lese-Endpunkt (eigene Datenbankrolle ohne Schreibrecht). */
  if (quellWeg !== 'normal') {
    const r = await api('POST', `/projects/${QUELLE.ref}/database/query/read-only`, { query: sql })
    if (r.ok) {
      quellWeg = 'read-only'
      return r.daten
    }
    if (quellWeg === 'read-only' || (r.status !== 404 && r.status !== 405)) {
      abbruch(`Lesen in buchhaltung fehlgeschlagen (${r.status}): ${JSON.stringify(r.daten)}`)
    }
    quellWeg = 'normal'
  }
  const r = await api('POST', `/projects/${QUELLE.ref}/database/query`, { query: sql })
  if (!r.ok) abbruch(`Lesen in buchhaltung fehlgeschlagen (${r.status}): ${JSON.stringify(r.daten)}`)
  return r.daten
}

async function zielLesen(sql) {
  if (!lesendeAbfrage(sql)) abbruch('Leseabfrage an das Ziel enthaelt schreibende Teile.')
  return zielSql(sql)
}

/** Schreibt ausschliesslich in videko-core-pilot. */
async function zielSql(sql) {
  const ref = ZIEL.ref
  if (ref === QUELLE.ref || ref !== 'ewxvgzxifeuriukfqsld') abbruch('Schreibziel ist nicht videko-core-pilot.')
  const r = await api('POST', `/projects/${ref}/database/query`, { query: sql })
  if (!r.ok) throw new Error(`Ziel (${r.status}): ${schwaerzen(JSON.stringify(r.daten))}`)
  return r.daten
}

const ident = (name) => {
  if (!/^[a-z0-9_]+$/.test(name)) abbruch(`unerwarteter Bezeichner ${name}`)
  return `"${name}"`
}

/* ------------------------------------------------------------------ */
/* Bestand                                                             */
/* ------------------------------------------------------------------ */

async function projekteSichern() {
  if (!TOKEN) {
    abbruch(
      'Kein SUPABASE_ACCESS_TOKEN. Anlegen unter https://supabase.com/dashboard/account/tokens ' +
        'und als SUPABASE_ACCESS_TOKEN=... in .env.umzug.local im Projektordner eintragen.',
    )
  }
  for (const p of [QUELLE, ZIEL]) {
    const r = await api('GET', `/projects/${p.ref}`)
    if (!r.ok) abbruch(`Projekt ${p.ref} nicht lesbar (${r.status}) — hat der Token Zugriff auf diese Organisation?`)
    if (r.daten?.name !== p.name) abbruch(`Projekt ${p.ref} heisst "${r.daten?.name}", erwartet "${p.name}".`)
    console.log(`✓ ${p.ref} = ${p.name} (${r.daten?.region || '?'}, ${r.daten?.status || '?'})`)
  }
}

async function bestandLesen(lesen) {
  const b = {}
  b.version = (await lesen(`select version() as version, current_setting('TimeZone') as zeitzone`))[0]
  b.relationen = await lesen(
    `select n.nspname as schema, c.relname as name, c.relkind as art, c.relrowsecurity as rls, c.relforcerowsecurity as rls_erzwungen from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname like ${MUSTER} and c.relkind in ('r','p','v','m','f','S') order by 1, 2`,
  )
  b.funktionen = await lesen(
    `select n.nspname as schema, p.proname as name, pg_get_function_identity_arguments(p.oid) as argumente from pg_proc p join pg_namespace n on n.oid = p.pronamespace where p.proname like ${MUSTER} order by 1, 2`,
  )
  b.spalten = await lesen(
    `select c.relname as tabelle, a.attnum as pos, a.attname as spalte, format_type(a.atttypid, a.atttypmod) as typ, a.attnotnull as pflicht, pg_get_expr(d.adbin, d.adrelid) as standard from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum where n.nspname = 'public' and c.relkind = 'r' and c.relname like ${MUSTER} and a.attnum > 0 and not a.attisdropped order by 1, 2`,
  )
  b.constraints = await lesen(
    `select cl.relname as tabelle, co.conname as name, co.contype as art, pg_get_constraintdef(co.oid) as definition from pg_constraint co join pg_class cl on cl.oid = co.conrelid join pg_namespace n on n.oid = cl.relnamespace where n.nspname = 'public' and cl.relname like ${MUSTER} order by 1, 2`,
  )
  b.indizes = await lesen(
    `select tablename as tabelle, indexname as name, indexdef as definition from pg_indexes where schemaname = 'public' and tablename like ${MUSTER} order by 1, 2`,
  )
  b.policies = await lesen(
    `select tablename as tabelle, policyname as name, permissive as permissiv, roles as rollen, cmd as befehl, qual as bedingung, with_check as pruefung from pg_policies where schemaname = 'public' and tablename like ${MUSTER} order by 1, 2`,
  )
  b.trigger = await lesen(
    `select cl.relname as tabelle, t.tgname as name, pg_get_triggerdef(t.oid) as definition from pg_trigger t join pg_class cl on cl.oid = t.tgrelid join pg_namespace n on n.oid = cl.relnamespace where not t.tgisinternal and n.nspname = 'public' and cl.relname like ${MUSTER} order by 1, 2`,
  )
  b.rechte = await lesen(
    `select table_name as tabelle, grantee as rolle, string_agg(privilege_type, ',' order by privilege_type) as rechte from information_schema.role_table_grants where table_schema = 'public' and table_name like ${MUSTER} group by 1, 2 order by 1, 2`,
  )
  b.tabellen = b.relationen.filter((r) => r.schema === 'public' && r.art === 'r').map((r) => r.name)
  b.zeilen = {}
  if (b.tabellen.length) {
    const z = await lesen(`select ${b.tabellen.map((t) => `(select count(*) from public.${ident(t)}) as ${ident(t)}`).join(', ')}`)
    for (const t of b.tabellen) b.zeilen[t] = Number(z[0][t])
  }
  return b
}

function primaerschluessel(bestand, tabelle) {
  const pk = bestand.constraints.find((c) => c.tabelle === tabelle && c.art === 'p')
  if (!pk) return null
  return pk.definition.match(/\(([^)]+)\)/)[1].split(',').map((s) => s.trim().replace(/"/g, ''))
}

function spaltenVon(bestand, tabelle) {
  return bestand.spalten.filter((s) => s.tabelle === tabelle)
}

/** Alle Zeilen einer Tabelle der Quelle, seitenweise, stabil sortiert. */
async function zeilenExportieren(bestand, tabelle, lesen = quelleLesen) {
  const pk = primaerschluessel(bestand, tabelle)
  const ordnung = pk ? pk.map(ident).join(', ') : 'x::text'
  const seite = 1000
  const alle = []
  for (let ab = 0; ; ab += seite) {
    const r = await lesen(
      `select coalesce(json_agg(x order by ${ordnung.replace(/"([a-z0-9_]+)"/g, 'x."$1"')}), '[]'::json) as zeilen from (select * from public.${ident(tabelle)} order by ${ordnung === 'x::text' ? '1' : ordnung} limit ${seite} offset ${ab}) x`,
    )
    const zeilen = r[0].zeilen || []
    alle.push(...zeilen)
    if (zeilen.length < seite) break
  }
  return alle
}

function ddlAusBestand(b) {
  const teile = [`-- Schema-Sicherung aus ${QUELLE.name} (${QUELLE.ref}), ${new Date().toISOString()}`, `-- ${b.version.version}`, '']
  for (const t of b.tabellen) {
    const spalten = spaltenVon(b, t).map(
      (s) => `  ${ident(s.spalte)} ${s.typ}${s.pflicht ? ' not null' : ''}${s.standard ? ` default ${s.standard}` : ''}`,
    )
    teile.push(`create table public.${ident(t)} (\n${spalten.join(',\n')}\n);`)
    for (const c of b.constraints.filter((c) => c.tabelle === t)) {
      teile.push(`alter table public.${ident(t)} add constraint ${ident(c.name)} ${c.definition};`)
    }
    for (const i of b.indizes.filter((i) => i.tabelle === t)) {
      const zuConstraint = b.constraints.some((c) => c.name === i.name)
      teile.push(`${zuConstraint ? '-- (Constraint-Index) ' : ''}${i.definition};`)
    }
    const rel = b.relationen.find((r) => r.name === t)
    if (rel?.rls) teile.push(`alter table public.${ident(t)} enable row level security;`)
    if (rel?.rls_erzwungen) teile.push(`alter table public.${ident(t)} force row level security;`)
    for (const p of b.policies.filter((p) => p.tabelle === t)) {
      teile.push(
        `create policy ${ident(p.name)} on public.${ident(t)} as ${p.permissiv} for ${p.befehl} to ${[].concat(p.rollen).join(', ')}${p.bedingung ? ` using (${p.bedingung})` : ''}${p.pruefung ? ` with check (${p.pruefung})` : ''};`,
      )
    }
    for (const tr of b.trigger.filter((x) => x.tabelle === t)) teile.push(`${tr.definition};`)
    teile.push('')
  }
  return teile.join('\n')
}

const sha256 = (text) => createHash('sha256').update(text).digest('hex')

function schreiben(datei, inhalt) {
  mkdirSync(path.dirname(datei), { recursive: true })
  writeFileSync(datei, inhalt)
  return sha256(inhalt)
}

/** Vergleicht zwei Bestaende und listet jede Abweichung. */
function schemaVergleich(a, b) {
  const unterschiede = []
  const schluessel = {
    spalten: (x) => `${x.tabelle}.${x.spalte}`,
    constraints: (x) => `${x.tabelle}.${x.name}`,
    indizes: (x) => `${x.tabelle}.${x.name}`,
    policies: (x) => `${x.tabelle}.${x.name}`,
    trigger: (x) => `${x.tabelle}.${x.name}`,
    relationen: (x) => `${x.schema}.${x.name}`,
    funktionen: (x) => `${x.schema}.${x.name}(${x.argumente})`,
  }
  const inhalt = {
    spalten: (x) => `${x.typ}|${x.pflicht}|${x.standard}`,
    constraints: (x) => `${x.art}|${x.definition}`,
    indizes: (x) => x.definition,
    policies: (x) => JSON.stringify([x.permissiv, x.rollen, x.befehl, x.bedingung, x.pruefung]),
    trigger: (x) => x.definition,
    relationen: (x) => `${x.art}|rls=${x.rls}|force=${x.rls_erzwungen}`,
    funktionen: () => '',
  }
  for (const art of Object.keys(schluessel)) {
    const ma = new Map(a[art].map((x) => [schluessel[art](x), inhalt[art](x)]))
    const mb = new Map(b[art].map((x) => [schluessel[art](x), inhalt[art](x)]))
    for (const [k, v] of ma) {
      if (!mb.has(k)) unterschiede.push({ art, objekt: k, nur: 'quelle', quelle: v })
      else if (mb.get(k) !== v) unterschiede.push({ art, objekt: k, quelle: v, ziel: mb.get(k) })
    }
    for (const [k, v] of mb) if (!ma.has(k)) unterschiede.push({ art, objekt: k, nur: 'ziel', ziel: v })
  }
  return unterschiede
}

async function befehlBestand() {
  await projekteSichern()

  console.log('\n— Phase 1: Quelle lesen (nur lesend)')
  const q = await bestandLesen(quelleLesen)
  console.log(`Lesepfad buchhaltung: ${quellWeg}`)
  console.log(`Postgres: ${q.version.version.split(' ').slice(0, 2).join(' ')}, Zeitzone ${q.version.zeitzone}`)
  for (const r of q.relationen) console.log(`  ${r.schema}.${r.name} art=${r.art} rls=${r.rls}${r.art === 'r' ? ` zeilen=${q.zeilen[r.name]}` : ''}`)
  if (q.funktionen.length) console.log(`  Funktionen: ${q.funktionen.map((f) => f.name).join(', ')}`)
  console.log(`  Policies: ${q.policies.length}, Trigger: ${q.trigger.length}`)

  console.log('\n— Phase 2: Backup')
  const manifest = { erstellt_am: new Date().toISOString(), quelle: QUELLE, lesepfad: quellWeg, zeilen: q.zeilen, dateien: {} }
  manifest.dateien['bestand-quelle.json'] = schreiben(`${BACKUP}/bestand-quelle.json`, JSON.stringify(q, null, 2))
  manifest.dateien['schema-quelle.sql'] = schreiben(`${BACKUP}/schema-quelle.sql`, ddlAusBestand(q))
  for (const t of q.tabellen) {
    const zeilen = await zeilenExportieren(q, t)
    if (zeilen.length !== q.zeilen[t]) {
      console.log(`  ⚠ ${t}: exportiert ${zeilen.length}, gezaehlt ${q.zeilen[t]} (laufende Aktion?)`)
    }
    manifest.dateien[`daten/${t}.json`] = schreiben(`${BACKUP}/daten/${t}.json`, JSON.stringify(zeilen, null, 1))
    manifest.zeilen_exportiert = { ...(manifest.zeilen_exportiert || {}), [t]: zeilen.length }
    console.log(`  ✓ ${t}: ${zeilen.length} Zeilen`)
  }
  schreiben(`${BACKUP}/manifest.json`, JSON.stringify(manifest, null, 2))
  /* Gegenprobe: Dateien wieder lesen und Pruefsummen vergleichen. */
  for (const [datei, summe] of Object.entries(manifest.dateien)) {
    if (sha256(readFileSync(`${BACKUP}/${datei}`)) !== summe) abbruch(`Backup-Datei ${datei} stimmt nicht.`)
  }
  console.log(`  ✓ Backup geprueft: ${BACKUP}`)

  console.log('\n— Phase 3: Ziel lesen')
  const z = await bestandLesen(zielLesen)
  schreiben(`${BACKUP}/bestand-ziel-vorher.json`, JSON.stringify(z, null, 2))
  try {
    const mig = await zielLesen(`select version, name from supabase_migrations.schema_migrations order by version`)
    console.log(`  Migrationen im Ziel: ${mig.length} (terminal: ${mig.filter((m) => /terminal/.test(m.name || '')).length})`)
  } catch {
    console.log('  Migrationen im Ziel: keine Tabelle supabase_migrations')
  }
  if (!z.relationen.length && !z.funktionen.length) {
    console.log('  ZIEL: leer — keine videko_terminal_* Objekte.')
  } else {
    for (const r of z.relationen) console.log(`  ${r.schema}.${r.name} art=${r.art} rls=${r.rls}${r.art === 'r' ? ` zeilen=${z.zeilen[r.name]}` : ''}`)
    const mitDaten = z.tabellen.filter((t) => z.zeilen[t] > 0)
    console.log(mitDaten.length ? `  ZIEL: KONFLIKT — Daten in ${mitDaten.join(', ')}` : '  ZIEL: Objekte vorhanden, alle leer')
    for (const u of schemaVergleich(q, z)) console.log(`  Δ ${JSON.stringify(u)}`)
  }
}

/* ------------------------------------------------------------------ */
/* Migrationen                                                         */
/* ------------------------------------------------------------------ */

/*
 * Eingespielt werden die Migrationen NICHT von hier, sondern im Core-Repo
 * (D:\VIDEKO\Software\Core) mit `npx supabase db push --linked`, damit dessen
 * Migrationsliste und die Datenbank deckungsgleich bleiben. Dieser Befehl
 * prueft nur das Ergebnis.
 */
async function befehlSchema() {
  await projekteSichern()
  const dateien = readdirSync('supabase/migrations').filter((d) => /_terminal_.*\.sql$/.test(d)).sort()
  const versionen = dateien.map((d) => d.split('_')[0])
  const ledger = await zielLesen(
    `select version, name from supabase_migrations.schema_migrations where version in (${versionen.map((v) => `'${v}'`).join(', ')}) order by version`,
  )
  for (const d of dateien) {
    const eintrag = ledger.find((m) => m.version === d.split('_')[0])
    console.log(`  ${eintrag ? '✓' : '✗'} ${d}${eintrag ? ` (Ledger: ${eintrag.name})` : ' fehlt im Ledger'}`)
  }

  const q = await bestandLesen(quelleLesen)
  const z = await bestandLesen(zielLesen)
  schreiben(`${BACKUP}/bestand-ziel-nach-migration.json`, JSON.stringify(z, null, 2))
  console.log('\n  Schema-Abweichungen Quelle -> Ziel:')
  for (const u of schemaVergleich(q, z)) console.log(`  Δ ${JSON.stringify(u)}`)
}

/* ------------------------------------------------------------------ */
/* Daten                                                               */
/* ------------------------------------------------------------------ */

/** Tabellen so ordnen, dass referenzierte Tabellen vorher kommen. */
function reihenfolge(b) {
  const abh = new Map(b.tabellen.map((t) => [t, new Set()]))
  for (const c of b.constraints.filter((c) => c.art === 'f')) {
    const m = c.definition.match(/REFERENCES\s+(?:public\.)?"?([a-z0-9_]+)"?/i)
    if (m && abh.has(m[1]) && m[1] !== c.tabelle) abh.get(c.tabelle).add(m[1])
  }
  const fertig = []
  const offen = new Set(b.tabellen)
  while (offen.size) {
    const naechste = [...offen].filter((t) => [...abh.get(t)].every((d) => fertig.includes(d)))
    if (!naechste.length) abbruch('Zyklische Fremdschluessel.')
    naechste.sort((x, y) => (x === 'videko_terminal_einstellungen' ? -1 : y === 'videko_terminal_einstellungen' ? 1 : x.localeCompare(y)))
    for (const t of naechste) {
      fertig.push(t)
      offen.delete(t)
    }
  }
  return fertig
}

function stuecke(zeilen) {
  const out = []
  let jetzt = []
  let groesse = 0
  for (const z of zeilen) {
    const n = JSON.stringify(z).length
    if (jetzt.length && groesse + n > STUECK_BYTES) {
      out.push(jetzt)
      jetzt = []
      groesse = 0
    }
    jetzt.push(z)
    groesse += n
  }
  if (jetzt.length) out.push(jetzt)
  return out
}

function jsonLiteral(zeilen) {
  const text = JSON.stringify(zeilen)
  let tag
  do tag = `$u${randomBytes(6).toString('hex')}$`
  while (text.includes(tag))
  return `${tag}${text}${tag}::jsonb`
}

async function vorbereiten() {
  await projekteSichern()
  const q = await bestandLesen(quelleLesen)
  const z = await bestandLesen(zielLesen)
  for (const t of q.tabellen) {
    if (!z.tabellen.includes(t)) abbruch(`Tabelle ${t} fehlt im Ziel — erst migrieren.`)
    for (const s of spaltenVon(q, t)) {
      if (!spaltenVon(z, t).some((x) => x.spalte === s.spalte)) abbruch(`Spalte ${t}.${s.spalte} fehlt im Ziel.`)
    }
    if (!primaerschluessel(q, t)) abbruch(`Tabelle ${t} hat keinen Primaerschluessel — Abgleich nicht sicher.`)
  }
  return { q, z }
}

async function befehlKopieren() {
  const { q, z } = await vorbereiten()
  for (const t of q.tabellen) {
    if (t === 'videko_terminal_einstellungen') continue
    if (z.zeilen[t] > 0) abbruch(`Ziel ${t} enthaelt schon ${z.zeilen[t]} Zeilen. Nichts kopiert.`)
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  for (const t of reihenfolge(q)) {
    const spalten = spaltenVon(q, t).map((s) => ident(s.spalte))
    const pk = primaerschluessel(q, t)
    const zeilen = await zeilenExportieren(q, t)
    schreiben(`${BACKUP}/kopie-${ts}/${t}.json`, JSON.stringify(zeilen, null, 1))
    let konflikt = ''
    if (t === 'videko_terminal_einstellungen') {
      const rest = spaltenVon(q, t).filter((s) => !pk.includes(s.spalte))
      konflikt = ` on conflict (${pk.map(ident).join(', ')}) do update set ${rest.map((s) => `${ident(s.spalte)} = excluded.${ident(s.spalte)}`).join(', ')}`
    }
    let geschrieben = 0
    for (const stueck of stuecke(zeilen)) {
      try {
        await zielSql(
          `insert into public.${ident(t)} (${spalten.join(', ')}) select ${spalten.join(', ')} from jsonb_populate_recordset(null::public.${ident(t)}, ${jsonLiteral(stueck)})${konflikt}`,
        )
      } catch (e) {
        abbruch(`${t}: ${e.message} — bisher ${geschrieben} von ${zeilen.length} geschrieben.`)
      }
      geschrieben += stueck.length
    }
    console.log(`  ✓ ${t}: ${geschrieben} Zeilen`)
  }
}

/** Zeilenweiser Vergleich im Ziel: Quelle als JSON hinein, Ziel daneben. */
async function tabelleVergleichen(q, z, t, nachziehen = false) {
  const pk = primaerschluessel(q, t)
  const spalten = spaltenVon(q, t)
  const ausdruck = (alias, s) => (s.typ === 'json' ? `${alias}.${ident(s.spalte)}::text` : `${alias}.${ident(s.spalte)}`)
  const verbindung = pk.map((k) => `z.${ident(k)} = s.${ident(k)}`).join(' and ')
  const pkListe = pk.map((k) => `s.${ident(k)}`).join(` || '/' || `)
  const zeilen = await zeilenExportieren(q, t)
  let fehlen = []
  let abweichend = []
  let nachgezogen = 0
  for (const stueck of stuecke(zeilen)) {
    const s = `(select * from jsonb_populate_recordset(null::public.${ident(t)}, ${jsonLiteral(stueck)})) s`
    const r = await zielSql(
      `select (select coalesce(json_agg((${pkListe})::text), '[]'::json) from ${s} where not exists (select 1 from public.${ident(t)} z where ${verbindung})) as fehlen, (select coalesce(json_agg((${pkListe})::text), '[]'::json) from ${s} join public.${ident(t)} z on ${verbindung} where (${spalten.map((c) => ausdruck('s', c)).join(', ')}) is distinct from (${spalten.map((c) => ausdruck('z', c)).join(', ')})) as abweichend`,
    )
    fehlen.push(...r[0].fehlen)
    abweichend.push(...r[0].abweichend)
    if (nachziehen && r[0].fehlen.length) {
      const liste = spalten.map((c) => ident(c.spalte)).join(', ')
      try {
        await zielSql(
          `insert into public.${ident(t)} (${liste}) select ${spalten.map((c) => `s.${ident(c.spalte)}`).join(', ')} from ${s} where not exists (select 1 from public.${ident(t)} z where ${verbindung})`,
        )
        nachgezogen += r[0].fehlen.length
      } catch (e) {
        console.log(`  ✗ ${t}: Nachziehen fehlgeschlagen: ${e.message}`)
      }
    }
  }
  const zielZahl = Number((await zielLesen(`select count(*) as n from public.${ident(t)}`))[0].n)
  const nurZiel = zielZahl - (zeilen.length - fehlen.length) - nachgezogen
  return { tabelle: t, quelle: zeilen.length, ziel: zielZahl, fehlen, abweichend, nurZiel, nachgezogen }
}

async function befehlVergleichen(nachziehen = false) {
  const { q, z } = await vorbereiten()
  let probleme = 0
  console.log('\n  Tabelle | Quelle | Ziel | fehlen | abweichend | nur im Ziel')
  const bericht = []
  for (const t of reihenfolge(q)) {
    const e = await tabelleVergleichen(q, z, t, nachziehen)
    bericht.push(e)
    const ok = !e.fehlen.length && !e.abweichend.length && e.nurZiel === 0
    if (!ok) probleme += 1
    console.log(
      `  ${ok ? '✓' : '✗'} ${t} | ${e.quelle} | ${e.ziel} | ${e.fehlen.length} | ${e.abweichend.length} | ${e.nurZiel}${e.nachgezogen ? ` | nachgezogen ${e.nachgezogen}` : ''}`,
    )
    if (e.fehlen.length) console.log(`      fehlen (id): ${e.fehlen.slice(0, 15).join(', ')}`)
    if (e.abweichend.length) console.log(`      abweichend (id): ${e.abweichend.slice(0, 15).join(', ')}`)
  }

  console.log('\n  Plausibilitaet (Ziel):')
  const zielAbfragen = {
    teilnehmer: `select anspruch_art, coalesce(besitz_status, '-') as besitz_status, count(*) as n, count(distinct deckel_nummer) as nummern, count(distinct instagram_handle) as handles from public.videko_terminal_teilnehmer group by 1, 2 order by 1, 2`,
    scores: `select game, status, count(*) as n, max(score) as bester, min(created_at) as erster, max(created_at) as letzter, count(distinct teilnehmer_id) as personen from public.videko_terminal_scores group by 1, 2 order by 1, 2`,
    scores_ohne_teilnehmer: `select count(*) as n from public.videko_terminal_scores s where not exists (select 1 from public.videko_terminal_teilnehmer t where t.id = s.teilnehmer_id)`,
    einstellungen: `select kampagne, follower_zahl, follower_ziel, spiele_aktiv, spiele_reihenfolge, guest_practice_game, testslot_game, gesamtranking_spiele from public.videko_terminal_einstellungen order by 1`,
  }
  const quelleAbfragen = { ...zielAbfragen }
  quelleAbfragen.einstellungen = `select kampagne, follower_zahl, follower_ziel, spiele_aktiv, spiele_reihenfolge, guest_practice_game from public.videko_terminal_einstellungen order by 1`
  for (const [name, sql] of Object.entries(zielAbfragen)) {
    const zr = await zielLesen(sql)
    const qr = await quelleLesen(quelleAbfragen[name])
    console.log(`  ${name}:\n    Quelle ${JSON.stringify(qr)}\n    Ziel   ${JSON.stringify(zr)}`)
  }

  console.log('\n  Schema-Kontrolle (Ziel):')
  const zn = await bestandLesen(zielLesen)
  const soll = [
    ['RLS auf allen Terminal-Tabellen', zn.relationen.filter((r) => r.art === 'r').every((r) => r.rls)],
    ['Policies wie Quelle', JSON.stringify(zn.policies) === JSON.stringify(q.policies)],
    ['videko_terminal_anspruch_art_chk', zn.constraints.some((c) => c.name === 'videko_terminal_anspruch_art_chk')],
    ['videko_terminal_besitz_status_chk', zn.constraints.some((c) => c.name === 'videko_terminal_besitz_status_chk')],
    ['Partial Unique Erstaktivierung', zn.indizes.some((i) => i.name === 'videko_terminal_teilnehmer_erst_uidx' && /UNIQUE/.test(i.definition) && /WHERE .*erstaktivierung/.test(i.definition))],
    ['videko_terminal_teilnehmer_nummer_idx', zn.indizes.some((i) => i.name === 'videko_terminal_teilnehmer_nummer_idx')],
    ['Tabelle gesamtranking_snapshot', zn.tabellen.includes('videko_terminal_gesamtranking_snapshot')],
    ['Tabelle gesamtranking_protokoll', zn.tabellen.includes('videko_terminal_gesamtranking_protokoll')],
    ['Index gr_snapshot_kampagne_idx', zn.indizes.some((i) => i.name === 'videko_terminal_gr_snapshot_kampagne_idx')],
    ['Index gr_protokoll_kampagne_idx', zn.indizes.some((i) => i.name === 'videko_terminal_gr_protokoll_kampagne_idx')],
    ...['gesamtranking_spiele', 'testslot_game', 'preis_gesamt_1', 'preis_gesamt_2', 'preis_gesamt_3', 'gesamtranking_abgeschlossen_am', 'guest_practice_game'].map((s) => [
      `einstellungen.${s}`,
      zn.spalten.some((x) => x.tabelle === 'videko_terminal_einstellungen' && x.spalte === s),
    ]),
  ]
  for (const [name, ok] of soll) {
    if (!ok) probleme += 1
    console.log(`  ${ok ? '✓' : '✗'} ${name}`)
  }
  console.log('\n  Schema-Abweichungen Quelle -> Ziel:')
  for (const u of schemaVergleich(q, zn)) console.log(`  Δ ${JSON.stringify(u)}`)

  schreiben(`${BACKUP}/vergleich-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, JSON.stringify(bericht, null, 2))
  console.log(probleme ? `\n✗ ${probleme} Abweichung(en)` : '\n✓ Quelle und Ziel stimmen ueberein')
  process.exitCode = probleme ? 1 : 0
}

/* ------------------------------------------------------------------ */
/* Vercel                                                              */
/* ------------------------------------------------------------------ */

function vercel(args, eingabe) {
  const r = spawnSync('npx', ['--yes', 'vercel', ...args], { input: eingabe, encoding: 'utf8', shell: true })
  return { code: r.status, text: `${r.stdout || ''}${r.stderr || ''}` }
}

async function befehlVercelEnv() {
  await projekteSichern()
  const r = await api('GET', `/projects/${ZIEL.ref}/api-keys?reveal=true`)
  if (!r.ok || !Array.isArray(r.daten)) abbruch(`API-Schluessel des Ziels nicht lesbar (${r.status}).`)
  const dienst =
    r.daten.find((k) => k.name === 'service_role' && k.api_key && !k.api_key.includes('·')) ||
    r.daten.find((k) => k.type === 'secret' && k.api_key && !k.api_key.includes('·'))
  if (!dienst) abbruch('Kein Service-Schluessel im Ziel gefunden.')
  const url = `https://${ZIEL.ref}.supabase.co`

  /* Probe: der Schluessel liest die Terminal-Tabelle im Ziel. */
  const probe = await fetch(`${url}/rest/v1/videko_terminal_einstellungen?select=kampagne&limit=1`, {
    headers: { apikey: dienst.api_key, Authorization: `Bearer ${dienst.api_key}` },
  })
  if (!probe.ok) abbruch(`Service-Schluessel (${dienst.name}) liest das Ziel nicht (${probe.status}).`)
  console.log(`  ✓ Schluessel "${dienst.name}" liest videko_terminal_einstellungen im Ziel`)

  const liste = vercel(['env', 'ls', 'production'])
  for (const [name, wert] of [
    ['TERMINAL_SUPABASE_URL', url],
    ['TERMINAL_SUPABASE_SERVICE_KEY', dienst.api_key],
  ]) {
    if (new RegExp(`\\b${name}\\b`).test(liste.text)) {
      console.log(`  = ${name} existiert bereits in Production — nicht ueberschrieben`)
      continue
    }
    let a = vercel(['env', 'add', name, 'production', '--sensitive'], wert)
    if (a.code !== 0 && /unknown|sensitive/i.test(a.text)) a = vercel(['env', 'add', name, 'production'], wert)
    if (a.code !== 0) abbruch(`vercel env add ${name} fehlgeschlagen: ${a.text.replaceAll(wert, '[wert]')}`)
    console.log(`  ✓ ${name} gesetzt (Production)`)
  }
}

/* ------------------------------------------------------------------ */

const befehl = process.argv[2]
const befehle = {
  status: projekteSichern,
  bestand: befehlBestand,
  schema: befehlSchema,
  kopieren: befehlKopieren,
  vergleichen: () => befehlVergleichen(false),
  abgleich: () => befehlVergleichen(true),
  'vercel-env': befehlVercelEnv,
}
if (!befehle[befehl]) {
  console.log(`Befehle: ${Object.keys(befehle).join(', ')}`)
  process.exit(1)
}
await befehle[befehl]()
