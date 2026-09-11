import crypto from 'node:crypto'
import {
  FELD_GRENZEN,
  LEAD_INTERESSEN,
  PHASE_LAEUFT,
  PHASE_NACHHER,
  STADTFEST_EVENT,
  STADTFEST_FIRMEN,
  eventPhase,
} from '../src/data/stadtfest.js'

/**
 * Lead-Endpoint der Stadtfest-Seite (Vercel Serverless, Node).
 *
 * Das ist NICHT der Gewinnspielweg. Die Seite /stadtfest ist dauerhaft
 * erreichbar; vor und nach dem Fest steht dort ein kurzes, freiwilliges
 * Kontaktformular. Dessen Daten sind Anfragen, keine Teilnahmen.
 *
 * Daraus folgt die strikte Trennung, und zwar auf allen drei Ebenen:
 *   · eigener Endpunkt (dieser hier)
 *   · eigene Tabelle (stadtfest_leads)
 *   · kein einziges Gewinnspielfeld — weder hauptpreis_qualifiziert noch
 *     gluecksrad_verifiziert noch submission_code. Es gibt hier keinen
 *     Anzeigecode, keinen Stempel und keine Qualifikation, weil es nichts
 *     zu qualifizieren gibt.
 *
 * Der Lostopf liest ausschliesslich aus stadtfest_teilnahmen. Ein Lead
 * kann deshalb auch dann nicht in die Ziehung geraten, wenn dieselbe
 * E-Mail-Adresse spaeter noch einmal eingetragen wird.
 *
 * Zeitlich ist es genau umgekehrt zum Gewinnspiel-Endpunkt: dieser hier
 * nimmt vor und nach dem Event entgegen, waehrend des Events nicht — dort
 * laeuft der richtige Weg ueber /api/stadtfest.
 *
 * Erfolg gibt es auch hier ausschliesslich gegen eine bestaetigte
 * Speicherung. Kein Zweig meldet `gespeichert: true` ohne Quittung der
 * Datenbank.
 */

const {
  STADTFEST_SUPABASE_URL,
  STADTFEST_SUPABASE_SERVICE_KEY,
  STADTFEST_COMPANY_ID,
  STADTFEST_IP_SALT = '',
  /* Eigene Sperre, getrennt von STADTFEST_SCHREIBEN. Solange die Tabelle
     stadtfest_leads nicht produktiv angelegt ist, bleibt dieser Endpunkt
     ehrlich stumm (503) — und das Formular wird im Frontend ueber
     VITE_STADTFEST_LEADS gar nicht erst angezeigt. */
  STADTFEST_LEADS_SCHREIBEN = '',
} = process.env

const TABELLE = 'stadtfest_leads'

const FENSTER_MS = 10 * 60 * 1000
const MAX_PRO_FENSTER = 5
const gesehen = new Map()

const INTERESSEN_KEYS = new Set(LEAD_INTERESSEN.map((i) => i.key))
const FIRMEN_KEYS = new Set(STADTFEST_FIRMEN.map((f) => f.key))

const clean = (s, max = 200) =>
  String(s ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max)

const EMAIL_MUSTER = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return {} }
  }
  const raw = await new Promise((res) => {
    let d = ''
    req.on('data', (c) => (d += c))
    req.on('end', () => res(d))
    req.on('error', () => res(''))
  })
  try { return JSON.parse(raw) } catch { return {} }
}

function klientIp(req) {
  const weiter = String(req.headers['x-forwarded-for'] || '')
  return weiter.split(',')[0].trim() || req.socket?.remoteAddress || 'unbekannt'
}

function ipHash(ip) {
  return crypto.createHash('sha256').update(`${STADTFEST_IP_SALT}|${ip}`).digest('hex')
}

const normalisiereEmail = (email) => clean(email, FELD_GRENZEN.email).toLowerCase()

function konfiguriert() {
  return Boolean(STADTFEST_SUPABASE_URL && STADTFEST_SUPABASE_SERVICE_KEY && STADTFEST_COMPANY_ID)
}

function kopfzeilen(extra = {}) {
  return {
    apikey: STADTFEST_SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${STADTFEST_SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

/* ------------------------------------------------------------------ */
/* Pruefung                                                            */
/* ------------------------------------------------------------------ */

/**
 * Bewusst kuerzer als die Pruefung der Gewinnspielteilnahme: keine
 * Teilnahmebedingungen, keine Altersbestaetigung. Beides gehoert zum
 * Gewinnspiel, und das findet hier nicht statt.
 */
function pruefen(b) {
  const fehler = []

  const vorname = clean(b.vorname, FELD_GRENZEN.vorname)
  const nachname = clean(b.nachname, FELD_GRENZEN.nachname)
  const email = clean(b.email, FELD_GRENZEN.email)
  const telefon = clean(b.telefon, FELD_GRENZEN.telefon)
  const plz = clean(b.plz, FELD_GRENZEN.plz)

  if (vorname.length < 2) fehler.push('vorname')
  if (nachname.length < 2) fehler.push('nachname')
  if (!EMAIL_MUSTER.test(email)) fehler.push('email')
  if (plz && !/^\d{5}$/.test(plz)) fehler.push('plz')
  if (telefon && telefon.replace(/\D/g, '').length < 6) fehler.push('telefon')

  const interessen = Array.isArray(b.interessen)
    ? [...new Set(b.interessen.map((k) => clean(k, 40)).filter((k) => INTERESSEN_KEYS.has(k)))]
    : []

  /* Einwilligungen wie beim Gewinnspiel: nur bekannte Firmen, nur bewusst
     gewaehlte Kanaele, Telefon nur mit vorliegender Nummer. Ohne Kanal
     entsteht keine Einwilligung. */
  const consent = {}
  const roh = b.consent && typeof b.consent === 'object' ? b.consent : {}
  for (const [firma, kanaele] of Object.entries(roh)) {
    if (!FIRMEN_KEYS.has(firma) || !Array.isArray(kanaele)) continue
    const erlaubt = kanaele
      .map((k) => clean(k, 20))
      .filter((k) => k === 'email' || (k === 'telefon' && telefon))
    if (erlaubt.length) consent[firma] = [...new Set(erlaubt)]
  }

  return { fehler, vorname, nachname, email, telefon, plz, interessen, consent }
}

/**
 * Einwilligungsnachweis: wer, wofuer, ueber welchen Kanal, wann, mit
 * welchem Wortlaut. Die Herkunft nennt ausdruecklich die Phase, damit
 * spaeter nachvollziehbar bleibt, dass hier kein Gewinnspiel im Spiel war.
 */
function nachweisBauen(consent, jetztIso, phase) {
  return Object.entries(consent).map(([firma, kanaele]) => {
    const eintrag = STADTFEST_FIRMEN.find((f) => f.key === firma)
    return {
      firma,
      unternehmen: eintrag?.label ?? firma,
      rechtstraeger: eintrag?.traeger ?? null,
      zweck: 'Werbliche Ansprache zu eigenen Angeboten',
      kanaele,
      wortlaut: eintrag?.text ?? null,
      textVersion: STADTFEST_EVENT.consentVersion,
      erteiltAt: jetztIso,
      herkunft: `/stadtfest (${phase}, kein Gewinnspiel) · ${STADTFEST_EVENT.id}`,
    }
  })
}

/* ------------------------------------------------------------------ */
/* Handler                                                             */
/* ------------------------------------------------------------------ */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ ok: false, gespeichert: false, meldung: 'Nur POST.' })
    return
  }

  const b = await readBody(req)

  if (clean(b.website, 80)) {
    res.status(200).json({ ok: true, gespeichert: false, status: 'ignoriert' })
    return
  }

  const ip = klientIp(req)
  const jetztMs = Date.now()

  const eintraege = (gesehen.get(ip) || []).filter((t) => jetztMs - t < FENSTER_MS)
  if (eintraege.length >= MAX_PRO_FENSTER) {
    res.status(429).json({
      ok: false,
      gespeichert: false,
      meldung: 'Das ging uns gerade zu schnell. Bitte einen Moment warten.',
    })
    return
  }
  eintraege.push(jetztMs)
  gesehen.set(ip, eintraege)

  /* Spiegelbild zu /api/stadtfest: waehrend des Events gehoert jede
     Eingabe in den Gewinnspielweg, nicht hierher. Sonst entstuenden
     parallel zwei Datensaetze zur selben Person, von denen nur einer
     im Lostopf liegt — und niemand wuesste hinterher, welcher. */
  const phaseJetzt = eventPhase(jetztMs)
  if (phaseJetzt === PHASE_LAEUFT) {
    res.status(409).json({
      ok: false,
      gespeichert: false,
      phase: phaseJetzt,
      meldung: 'Waehrend des Stadtfests laeuft die Anmeldung ueber die Teilnahme am Stand.',
    })
    return
  }

  const daten = pruefen(b)
  if (daten.fehler.length) {
    res.status(400).json({
      ok: false,
      gespeichert: false,
      felder: daten.fehler,
      meldung: 'Da fehlt noch etwas.',
    })
    return
  }

  /* Ohne produktiv angelegte Tabelle wird hier nichts geschrieben — und
     vor allem nichts behauptet. Lieber ein ehrliches 503 als ein Haken,
     hinter dem nichts steht. */
  if (STADTFEST_LEADS_SCHREIBEN !== '1' || !konfiguriert()) {
    res.status(503).json({
      ok: false,
      gespeichert: false,
      meldung: 'Das Formular ist gerade nicht erreichbar. Bitte spaeter noch einmal versuchen.',
    })
    return
  }

  const emailNorm = normalisiereEmail(daten.email)
  const hash = ipHash(ip)
  const jetztIso = new Date(jetztMs).toISOString()

  try {
    const seit = new Date(jetztMs - FENSTER_MS).toISOString()
    const zaehlung = await fetch(
      `${STADTFEST_SUPABASE_URL}/rest/v1/${TABELLE}`
        + `?select=id&ip_hash=eq.${hash}&created_at=gte.${encodeURIComponent(seit)}`,
      { headers: kopfzeilen({ Prefer: 'count=exact' }) },
    )
    const bereich = zaehlung.headers.get('content-range') || ''
    const anzahl = Number(bereich.split('/')[1] || 0)
    if (zaehlung.ok && anzahl >= MAX_PRO_FENSTER) {
      res.status(429).json({
        ok: false,
        gespeichert: false,
        meldung: 'Das ging uns gerade zu schnell. Bitte einen Moment warten.',
      })
      return
    }

    /* Doppelter Eintrag: keine zweite Zeile und keine andere Antwort.
       Von aussen ist nicht erkennbar, ob diese Adresse schon vorlag —
       dieselbe Ruecksicht wie beim Gewinnspiel. Wer seine Einwilligung
       aendern oder widerrufen will, tut das ueber den Widerrufsweg, nicht
       ueber ein stilles Ueberschreiben durch ein zweites Formular. */
    const suche = await fetch(
      `${STADTFEST_SUPABASE_URL}/rest/v1/${TABELLE}`
        + `?select=id,created_at`
        + `&event_id=eq.${encodeURIComponent(STADTFEST_EVENT.id)}`
        + `&email_normalisiert=eq.${encodeURIComponent(emailNorm)}&limit=1`,
      { headers: kopfzeilen() },
    )
    const treffer = suche.ok ? await suche.json() : []
    if (Array.isArray(treffer) && treffer.length > 0) {
      res.status(200).json({ ok: true, gespeichert: true, status: 'bekannt' })
      return
    }

    /* Die Zeile enthaelt ausschliesslich Kontakt-, Interessen- und
       Einwilligungsfelder. Kein submission_code, keine Qualifikation,
       kein Glueckrad — diese Spalten gibt es in stadtfest_leads nicht
       einmal. */
    const zeile = {
      company_id: STADTFEST_COMPANY_ID,
      event_id: STADTFEST_EVENT.id,
      phase: phaseJetzt === PHASE_NACHHER ? 'nachher' : 'vorher',
      vorname: daten.vorname,
      nachname: daten.nachname,
      email: daten.email,
      email_normalisiert: emailNorm,
      telefon: daten.telefon || null,
      plz: daten.plz || null,
      interessen: daten.interessen,

      privacy_version: STADTFEST_EVENT.privacyVersion,
      consent_videko_email: Boolean(daten.consent.videko?.includes('email')),
      consent_videko_phone: Boolean(daten.consent.videko?.includes('telefon')),
      consent_videko_at: daten.consent.videko ? jetztIso : null,
      consent_atlas_email: Boolean(daten.consent.atlas?.includes('email')),
      consent_atlas_phone: Boolean(daten.consent.atlas?.includes('telefon')),
      consent_atlas_at: daten.consent.atlas ? jetztIso : null,
      consent_text_version: STADTFEST_EVENT.consentVersion,
      consent_nachweis: nachweisBauen(daten.consent, jetztIso, phaseJetzt),

      source_slug: STADTFEST_EVENT.sourceSlug,
      utm_campaign: new URLSearchParams(clean(b.quelle, 300).replace(/^\?/, '')).get('utm_campaign'),
      ip_hash: hash,
    }

    const antwort = await fetch(`${STADTFEST_SUPABASE_URL}/rest/v1/${TABELLE}`, {
      method: 'POST',
      headers: kopfzeilen({ Prefer: 'return=representation' }),
      body: JSON.stringify(zeile),
    })

    if (!antwort.ok) {
      res.status(500).json({
        ok: false,
        gespeichert: false,
        meldung: 'Das hat gerade nicht geklappt. Bitte noch einmal antippen.',
      })
      return
    }

    const gespeicherteZeile = await antwort.json().catch(() => null)
    const erste = Array.isArray(gespeicherteZeile) ? gespeicherteZeile[0] : null

    res.status(200).json({
      ok: true,
      gespeichert: true,
      status: 'neu',
      zeitpunkt: erste?.created_at ?? jetztIso,
    })
  } catch {
    res.status(500).json({
      ok: false,
      gespeichert: false,
      meldung: 'Das hat gerade nicht geklappt. Bitte noch einmal antippen.',
    })
  }
}
