import crypto from 'node:crypto'
import {
  FELD_GRENZEN,
  PHASE_LAEUFT,
  PHASE_NACHHER,
  STADTFEST_EVENT,
  STADTFEST_FIRMEN,
  STADTFEST_INTERESSEN,
  eventPhase,
} from '../src/data/stadtfest.js'

/**
 * Teilnahme-Endpoint der Stadtfest-Aktionsseite (Vercel Serverless, Node).
 *
 * Aufgaben, in dieser Reihenfolge:
 *   1. Missbrauch abwehren (Honigtopf, Ratenbegrenzung, Feldgrenzen)
 *   2. serverseitig pruefen — der Browser ist nur Vorfilter
 *   3. Phase pruefen — dieser Endpunkt nimmt ausschliesslich waehrend
 *      des Events entgegen (davor und danach: /api/stadtfest-lead)
 *   4. Doppelteilnahme aufloesen, ohne fremde E-Mail-Adressen zu verraten
 *   5. Teilnahme samt Einwilligungsnachweis speichern
 *
 * Erfolg meldet dieser Endpoint ausschliesslich gegen eine bestaetigte
 * Speicherung. Es gibt keinen Zweig, der `gespeichert: true` zurueckgibt,
 * ohne dass die Datenbank das quittiert hat.
 *
 * Es wird hier KEINE E-Mail versendet. Double-Opt-In fuer die freiwilligen
 * Werbeeinwilligungen ist vorbereitet (Spalten doi_*), aber bewusst noch
 * nicht aktiv — siehe Bericht zu Phase 1.
 *
 * Datenhaltung: die Tabelle liegt im Supabase-Projekt des VIDEKO Studio,
 * weil dort die Auswertung mit vorhandener Anmeldung und Rollenlogik
 * stattfindet. Deshalb ein eigenes Variablenpaar statt SUPABASE_URL.
 */

const {
  STADTFEST_SUPABASE_URL,
  STADTFEST_SUPABASE_SERVICE_KEY,
  /* Mandant im Studio. Die Tabelle haengt an companies(id); ohne diese
     Zuordnung greift dort keine Leseregel. */
  STADTFEST_COMPANY_ID,
  STADTFEST_IP_SALT = '',
  /* Solange das Event nicht freigegeben ist (datenBestaetigt === false in
     src/data/stadtfest.js), speichert dieser Endpoint nur, wenn diese
     Variable ausdruecklich auf '1' steht. Das ist die Sperre gegen einen
     versehentlichen Produktivbetrieb mit Platzhalterdaten. */
  STADTFEST_SCHREIBEN = '',
} = process.env

const TABELLE = 'stadtfest_teilnahmen'

/* Ratenbegrenzung, erste Stufe: pro Instanz im Speicher. Serverless-
   Instanzen sind kurzlebig, deshalb ist das nur der billige Vorfilter.
   Die belastbare Grenze zieht die Abfrage auf ip_hash weiter unten. */
const FENSTER_MS = 10 * 60 * 1000
const MAX_PRO_FENSTER = 5
const gesehen = new Map()

const INTERESSEN_KEYS = new Set(STADTFEST_INTERESSEN.map((i) => i.key))
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

/**
 * Nicht die IP selbst wird gespeichert, sondern ein gesalzener Hash.
 * Er reicht, um Serienanlagen zu erkennen, laesst sich aber nicht in eine
 * Adresse zurueckrechnen.
 */
function ipHash(ip) {
  return crypto.createHash('sha256').update(`${STADTFEST_IP_SALT}|${ip}`).digest('hex')
}

/**
 * E-Mail-Normalisierung fuer den Dublettenabgleich: Kleinschreibung und
 * Leerraum weg. Bewusst NICHT mehr — Punkte oder Plus-Adressen zu
 * entfernen wuerde bei manchen Anbietern verschiedene Postfaecher
 * zusammenwerfen.
 */
const normalisiereEmail = (email) => clean(email, FELD_GRENZEN.email).toLowerCase()

/** Vierstelliger Anzeigecode. Nur zum Vorzeigen am Stand, kein Geheimnis. */
function codeErzeugen() {
  return String(1000 + (crypto.randomInt(0, 9000))).slice(0, 4)
}

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

function pruefen(b) {
  const fehler = []
  const vorname = clean(b.vorname, FELD_GRENZEN.vorname)
  const nachname = clean(b.nachname, FELD_GRENZEN.nachname)
  const email = clean(b.email, FELD_GRENZEN.email)
  const telefon = clean(b.telefon, FELD_GRENZEN.telefon)
  const plz = clean(b.plz, FELD_GRENZEN.plz)

  if (!vorname) fehler.push('vorname')
  if (!nachname) fehler.push('nachname')
  if (!email || !EMAIL_MUSTER.test(email)) fehler.push('email')
  if (plz && !/^\d{5}$/.test(plz)) fehler.push('plz')
  if (telefon && telefon.replace(/\D/g, '').length < 6) fehler.push('telefon')
  if (b.teilnahmebedingungen !== true) fehler.push('teilnahmebedingungen')
  if (STADTFEST_EVENT.minimumAge && b.mindestalterBestaetigt !== true) fehler.push('mindestalter')

  /* Nur bekannte Interessen-Schluessel uebernehmen. */
  const interessen = Array.isArray(b.interessen)
    ? [...new Set(b.interessen.map((k) => clean(k, 40)).filter((k) => INTERESSEN_KEYS.has(k)))]
    : []

  /* Einwilligungen: nur bekannte Firmen, nur bekannte Kanaele, und ein
     Telefonkanal nur dann, wenn ueberhaupt eine Nummer vorliegt. Eine
     Telefonwerbe-Einwilligung ohne Nummer waere wertlos und irrefuehrend.

     Und: ohne mindestens einen bewusst gewaehlten Kanal entsteht gar keine
     Einwilligung. Das Frontend erzwingt das bereits, der Server verlaesst
     sich nicht darauf. */
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
 * Der Nachweis (§11): nicht nur true/false, sondern wer, wofuer, ueber
 * welchen Kanal, wann und mit welchem Wortlaut eingewilligt hat.
 */
function nachweisBauen(consent, jetztIso) {
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
      herkunft: `/stadtfest · ${STADTFEST_EVENT.id}`,
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

  /* Honigtopf: ein ausgefuelltes unsichtbares Feld kommt nicht von einem
     Menschen. Antwort bewusst unauffaellig, aber ohne Erfolgsbehauptung. */
  if (clean(b.website, 80)) {
    res.status(200).json({ ok: true, gespeichert: false, status: 'ignoriert' })
    return
  }

  const ip = klientIp(req)
  const jetztMs = Date.now()

  /* Ratenbegrenzung Stufe 1 (im Speicher). */
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

  /* Nur EVENT. Dieser Endpunkt ist ausschliesslich der Gewinnspielweg —
     die Route /stadtfest bleibt davon unberuehrt und ist dauerhaft
     erreichbar. Vor und nach dem Fest zeigt sie eine Leadseite, und die
     schreibt ueber /api/stadtfest-lead in eine andere Tabelle. Hier wird
     ausserhalb des Eventfensters nichts gespeichert, damit niemand
     nachtraeglich in den Lostopf rutscht. */
  const phaseJetzt = eventPhase(jetztMs)
  if (phaseJetzt !== PHASE_LAEUFT) {
    res.status(409).json({
      ok: false,
      gespeichert: false,
      phase: phaseJetzt,
      meldung:
        phaseJetzt === PHASE_NACHHER
          ? 'Das Gewinnspiel ist beendet. Teilnahmen nehmen wir nicht mehr entgegen.'
          : 'Das Gewinnspiel laeuft erst am Stand. Vorher nehmen wir keine Teilnahmen entgegen.',
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

  /* Freigabesperre: solange die Eventdaten Platzhalter sind, wird nichts
     geschrieben — auch nicht versehentlich. */
  if (!STADTFEST_EVENT.datenBestaetigt && STADTFEST_SCHREIBEN !== '1') {
    res.status(503).json({
      ok: false,
      gespeichert: false,
      meldung: 'Die Aktion ist noch nicht freigeschaltet.',
    })
    return
  }

  if (!konfiguriert()) {
    res.status(503).json({
      ok: false,
      gespeichert: false,
      meldung: 'Die Teilnahme ist gerade nicht erreichbar. Bitte kurz beim Team melden.',
    })
    return
  }

  const emailNorm = normalisiereEmail(daten.email)
  const hash = ipHash(ip)
  const jetztIso = new Date(jetztMs).toISOString()

  try {
    /* --- Ratenbegrenzung Stufe 2: gleiche Herkunft, kurzer Zeitraum --- */
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

    /* --- Doppelteilnahme (§12) ------------------------------------
       Wichtig: die Antwort darf nicht verraten, ob eine fremde Adresse
       bereits in der Datenbank liegt. Deshalb:
         • Name passt zur vorhandenen Teilnahme  -> „bekannt"
         • Name passt nicht                      -> exakt dieselbe Antwort
           wie bei einer neuen Teilnahme, mit den gerade eingetippten
           Angaben. Es wird nichts geschrieben und nichts veraendert.
       Von aussen sind beide Faelle nicht unterscheidbar. */
    const suche = await fetch(
      `${STADTFEST_SUPABASE_URL}/rest/v1/${TABELLE}`
        + `?select=vorname,nachname,submission_code,created_at`
        + `&event_id=eq.${encodeURIComponent(STADTFEST_EVENT.id)}`
        + `&email_normalisiert=eq.${encodeURIComponent(emailNorm)}&limit=1`,
      { headers: kopfzeilen() },
    )
    const treffer = suche.ok ? await suche.json() : []

    if (Array.isArray(treffer) && treffer.length > 0) {
      const alt = treffer[0]
      const gleicherName =
        clean(alt.vorname, 60).toLowerCase() === daten.vorname.toLowerCase()
        && clean(alt.nachname, 60).toLowerCase() === daten.nachname.toLowerCase()

      res.status(200).json({
        ok: true,
        gespeichert: true,
        status: gleicherName ? 'bekannt' : 'neu',
        code: alt.submission_code,
        zeitpunkt: gleicherName ? alt.created_at : jetztIso,
      })
      return
    }

    /* --- Neue Teilnahme ------------------------------------------- */
    const nachweis = nachweisBauen(daten.consent, jetztIso)
    const zeile = {
      company_id: STADTFEST_COMPANY_ID,
      event_id: STADTFEST_EVENT.id,
      vorname: daten.vorname,
      nachname: daten.nachname,
      email: daten.email,
      email_normalisiert: emailNorm,
      telefon: daten.telefon || null,
      plz: daten.plz || null,
      interessen: daten.interessen,

      teilnahmebedingungen_version: STADTFEST_EVENT.termsVersion,
      teilnahmebedingungen_akzeptiert_at: jetztIso,
      privacy_version: STADTFEST_EVENT.privacyVersion,
      mindestalter_bestaetigt: STADTFEST_EVENT.minimumAge ? true : null,

      consent_videko_email: Boolean(daten.consent.videko?.includes('email')),
      consent_videko_phone: Boolean(daten.consent.videko?.includes('telefon')),
      consent_videko_at: daten.consent.videko ? jetztIso : null,
      consent_atlas_email: Boolean(daten.consent.atlas?.includes('email')),
      consent_atlas_phone: Boolean(daten.consent.atlas?.includes('telefon')),
      consent_atlas_at: daten.consent.atlas ? jetztIso : null,
      consent_text_version: STADTFEST_EVENT.consentVersion,
      consent_nachweis: nachweis,

      source_slug: STADTFEST_EVENT.sourceSlug,
      utm_campaign: new URLSearchParams(clean(b.quelle, 300).replace(/^\?/, '')).get('utm_campaign'),
      ip_hash: hash,
    }

    /* Der Anzeigecode ist je Event eindeutig (Index in der Migration).
       Bei der seltenen Kollision einfach noch einmal wuerfeln. */
    let antwort = null
    let code = null
    for (let versuch = 0; versuch < 6; versuch += 1) {
      code = codeErzeugen()
      antwort = await fetch(`${STADTFEST_SUPABASE_URL}/rest/v1/${TABELLE}`, {
        method: 'POST',
        headers: kopfzeilen({ Prefer: 'return=representation' }),
        body: JSON.stringify({ ...zeile, submission_code: code }),
      })
      if (antwort.status !== 409) break
    }

    if (!antwort || !antwort.ok) {
      res.status(500).json({
        ok: false,
        gespeichert: false,
        meldung: 'Wir konnten die Teilnahme gerade nicht speichern. Bitte noch einmal antippen.',
      })
      return
    }

    const gespeicherteZeile = await antwort.json().catch(() => null)
    const erste = Array.isArray(gespeicherteZeile) ? gespeicherteZeile[0] : null

    res.status(200).json({
      ok: true,
      gespeichert: true,
      status: 'neu',
      code: erste?.submission_code ?? code,
      zeitpunkt: erste?.created_at ?? jetztIso,
    })
  } catch {
    res.status(500).json({
      ok: false,
      gespeichert: false,
      meldung: 'Wir konnten die Teilnahme gerade nicht speichern. Bitte noch einmal antippen.',
    })
  }
}
