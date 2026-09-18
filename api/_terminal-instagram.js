import {
  KAMPAGNE,
  TABELLE_EINSTELLUNGEN,
  einstellungenSchreiben,
  lesen,
} from './_terminal-kern.js'

/**
 * Instagram-Follower-Sync der Bierdeckel-Aktion.
 *
 * Die Followerzahl von @videko.kuechen kommt aus der offiziellen Instagram
 * Graph API (Professional Account, Feld followers_count) und landet in
 * follower_zahl — derselben Spalte, die bisher von Hand gepflegt wurde und die
 * das Terminal liest. Das Terminal selbst ruft die API nie: faellt Instagram
 * aus, zeigt es einfach den letzten gespeicherten Wert.
 *
 * Aufgerufen wird stuendlich vom Vercel Cron (api/terminal-instagram.js) und
 * auf Knopfdruck aus der Verwaltung (aktion 'instagram-sync').
 *
 * ZUGANGSDATEN
 * ------------
 * INSTAGRAM_ACCESS_TOKEN und INSTAGRAM_USER_ID stehen nur in der Server-
 * umgebung, nie mit VITE_-Praefix. Sie werden erst beim Aufruf gelesen und
 * verlassen diese Datei nicht: kein Fehlertext, kein Rueckgabewert und keine
 * Datenbankzeile enthaelt den Token oder die URL, in der er steht.
 *
 * Der fuehrende Unterstrich macht auch diese Datei zum Modul, nicht zur Route.
 */

const GRAPH_BASIS = 'https://graph.facebook.com/v21.0'

/** Wartezeit auf Instagram. Ein Cron-Lauf soll nicht an einer haengenden Anfrage kleben. */
const ZEITLIMIT_MS = 8000

/** Obergrenze wie bei der Handeingabe (terminal-admin.js, ganzzahl). */
const FOLLOWER_MAX = 10_000_000

/** Ist followers_count eine plausible Zahl? Kein String, keine Kommazahl, nichts Negatives. */
export function followerWertGueltig(roh) {
  return typeof roh === 'number' && Number.isInteger(roh) && roh >= 0 && roh <= FOLLOWER_MAX
}

/**
 * Die aktuelle Followerzahl holen. Wirft nie.
 *
 * Gibt `{ ok: true, wert }` oder `{ ok: false, grund }` zurueck. Die Gruende
 * sind bewusst kurz und frei von Zugangsdaten:
 *   nicht-konfiguriert — Token oder User-ID fehlen, es wurde nichts gefragt
 *   http-<code>        — Instagram hat abgelehnt (400/401/403: meist Token)
 *   zeitueberschreitung, netz, ungueltige-antwort, ungueltiger-wert
 */
export async function instagramFollowerHolen({ zeitlimitMs = ZEITLIMIT_MS } = {}) {
  const token = String(process.env.INSTAGRAM_ACCESS_TOKEN ?? '').trim()
  const userId = String(process.env.INSTAGRAM_USER_ID ?? '').trim()
  if (!token || !userId) return { ok: false, grund: 'nicht-konfiguriert' }

  const url = `${GRAPH_BASIS}/${encodeURIComponent(userId)}`
    + `?fields=followers_count&access_token=${encodeURIComponent(token)}`

  const abbruch = new AbortController()
  const wecker = setTimeout(() => abbruch.abort(), zeitlimitMs)
  try {
    let antwort
    try {
      antwort = await fetch(url, { headers: { Accept: 'application/json' }, signal: abbruch.signal })
    } catch (fehler) {
      /* Die Fehlermeldung von fetch kann die URL enthalten — und damit den
         Token. Sie wird deshalb nie weitergereicht, nur ihre Art. */
      return { ok: false, grund: fehler?.name === 'AbortError' ? 'zeitueberschreitung' : 'netz' }
    }
    if (!antwort.ok) return { ok: false, grund: `http-${Number(antwort.status) || 0}` }

    let daten
    try {
      daten = await antwort.json()
    } catch (fehler) {
      return { ok: false, grund: fehler?.name === 'AbortError' ? 'zeitueberschreitung' : 'ungueltige-antwort' }
    }
    const wert = daten && typeof daten === 'object' ? daten.followers_count : undefined
    if (!followerWertGueltig(wert)) return { ok: false, grund: 'ungueltiger-wert' }
    return { ok: true, wert }
  } finally {
    clearTimeout(wecker)
  }
}

/**
 * Holen und speichern. Wirft nie.
 *
 * Erfolg: follower_zahl und instagram_follower_api bekommen den Wert, der
 * Fehler wird geleert. Fehlschlag: nur Zeitpunkt und Grund werden vermerkt —
 * follower_zahl bleibt, wie es ist, damit ein Instagram-Ausfall die Anzeige
 * nie auf 0 oder einen Unsinnswert setzt.
 *
 * Geschrieben wird ueber einstellungenSchreiben, also als upsert, das nur die
 * uebergebenen Spalten anfasst. Termin, Spiele und Ziehung bleiben unberuehrt.
 *
 * Fehlen die neuen Spalten (terminal-instagram-schema.sql noch nicht
 * ausgefuehrt), lehnt die Datenbank das ganze Schreiben ab. Dann wird
 * follower_zahl allein nachgeschrieben — der Sync soll nicht an einer
 * fehlenden Protokollspalte scheitern. Das Ergebnis traegt dann
 * `hinweis: 'schema-fehlt'`.
 *
 * Rueckgabe: `{ ok, wert?, grund?, hinweis?, am }`.
 */
export async function instagramSynchronisieren(optionen = {}) {
  const am = new Date().toISOString()
  try {
    const geholt = await instagramFollowerHolen(optionen)

    if (!geholt.ok) {
      /* Nur vermerken. Scheitert auch das (Spalten fehlen), bleibt es beim
         Rueckgabewert — follower_zahl wird hier in keinem Fall angefasst. */
      const vermerkt = await einstellungenSchreiben({
        instagram_sync_am: am,
        instagram_sync_fehler: geholt.grund,
      }).catch(() => false)
      return { ok: false, grund: geholt.grund, am, ...(vermerkt ? {} : { hinweis: 'schema-fehlt' }) }
    }

    const wert = geholt.wert
    const komplett = await einstellungenSchreiben({
      follower_zahl: wert,
      instagram_follower_api: wert,
      instagram_sync_am: am,
      instagram_sync_fehler: null,
    }).catch(() => false)
    if (komplett) return { ok: true, wert, am }

    /* Rueckfall: nur die Spalte, die es sicher gibt. */
    const nurZahl = await einstellungenSchreiben({ follower_zahl: wert }).catch(() => false)
    if (nurZahl) return { ok: true, wert, am, hinweis: 'schema-fehlt' }
    return { ok: false, grund: 'server', wert, am }
  } catch {
    return { ok: false, grund: 'server', am }
  }
}

/**
 * Stand des Syncs fuer die Verwaltung. Wirft nie.
 *
 * Eigene Abfrage wie bei gesamtrankingEinstellungenLesen: fehlen die Spalten
 * oder antwortet die Datenbank nicht, kommen Nullwerte — die uebrigen
 * Verwaltungsdaten laden davon unberuehrt.
 */
export function instagramEingerichtet() {
  return Boolean(
    String(process.env.INSTAGRAM_ACCESS_TOKEN ?? '').trim()
      && String(process.env.INSTAGRAM_USER_ID ?? '').trim(),
  )
}

export async function instagramStandLesen() {
  const leer = { am: null, wert: null, fehler: null, eingerichtet: instagramEingerichtet() }
  try {
    const zeilen = await lesen(
      `${TABELLE_EINSTELLUNGEN}?select=instagram_follower_api,instagram_sync_am,instagram_sync_fehler`
      + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}&limit=1`,
    )
    const z = zeilen[0] ?? {}
    return {
      am: typeof z.instagram_sync_am === 'string' ? z.instagram_sync_am : null,
      wert: followerWertGueltig(z.instagram_follower_api) ? z.instagram_follower_api : null,
      fehler: typeof z.instagram_sync_fehler === 'string' ? z.instagram_sync_fehler.slice(0, 80) : null,
      eingerichtet: instagramEingerichtet(),
    }
  } catch {
    return leer
  }
}
