import crypto from 'node:crypto'
import {
  FELD_GRENZEN,
  PHASE_LAEUFT,
  PHASE_VORHER,
  STADTFEST_EVENT,
  STADTFEST_FIRMEN,
  STADTFEST_INTERESSEN,
  eventPhase,
} from '../src/data/stadtfest.js'

/**
 * Registrierungs-Endpoint der Stadtfest-Aktionsseite (Vercel Serverless, Node).
 *
 * Drei Dinge sind hier streng getrennt, und diese Trennung traegt die ganze
 * Datei:
 *
 *   A) REGISTRIERUNG     — was dieser Endpoint tut. Jemand traegt seine Daten
 *                          ein. Vor dem Stadtfest, waehrend des Stadtfests,
 *                          nach dem Stadtfest. Immer erlaubt.
 *   B) GEWINNSPIEL-
 *      TEILNAHME         — entsteht NICHT hier. Sie entsteht erst, wenn die
 *                          Person vor Ort ist, ein Mitarbeiter den Vorgang am
 *                          Stand bestaetigt und am Gluecksrad gedreht wird.
 *   C) HAUPTPREIS-
 *      QUALIFIKATION     — entsteht nur, wenn das Gluecksrad tatsaechlich auf
 *                          HAUPTPREIS landet, bestaetigt durch das Standteam.
 *
 * Deshalb schreibt dieser Endpoint ausschliesslich Registrierungsfelder. Die
 * Standfelder (stempel_ausgegeben_at, gluecksrad_gedreht_at,
 * hauptpreis_qualifiziert, alle Mitarbeiter-IDs, jede Ziehung) kommen hier in
 * keiner Zeile vor — sie gehoeren der geschuetzten Studio-API. Ein
 * Websitebesucher kann sich nicht in den Lostopf schreiben.
 *
 * Aufgaben, in dieser Reihenfolge:
 *   1. Missbrauch abwehren (Honigtopf, Ratenbegrenzung, Feldgrenzen)
 *   2. serverseitig pruefen — der Browser ist nur Vorfilter
 *   3. Phase bestimmen — sie entscheidet, WAS gilt, nicht OB gespeichert wird
 *   4. Doppelregistrierung aufloesen, ohne fremde E-Mail-Adressen zu verraten
 *   5. Registrierung samt Einwilligungsnachweis speichern
 *
 * Erfolg meldet dieser Endpoint ausschliesslich gegen eine bestaetigte
 * Speicherung. Es gibt keinen Zweig, der `gespeichert: true` zurueckgibt,
 * ohne dass die Datenbank das quittiert hat.
 *
 * Es wird hier KEINE E-Mail versendet. Double-Opt-In fuer die freiwilligen
 * Werbeeinwilligungen ist vorbereitet (Spalten doi_*), aber bewusst noch
 * nicht aktiv.
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
  /* Notbremse, kein Freischalter. Registriert wird grundsaetzlich — das ist
     der Sinn der Seite. Nur wenn diese Variable ausdruecklich auf '0' steht,
     nimmt der Endpoint nichts mehr entgegen. Fehlt sie, wird geschrieben. */
  STADTFEST_SCHREIBEN = '',
} = process.env

const TABELLE = 'stadtfest_registrierungen'

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

/**
 * Kalenderphase -> Wert der Spalte `registrierungs_phase`.
 *
 * Das ist eine reine Tatsachenfeststellung: wann hat sich diese Person
 * eingetragen? Sie sagt ausdruecklich NICHTS darueber aus, ob die Person am
 * Gewinnspiel teilgenommen hat — das entscheidet allein der am Stand
 * bestaetigte Dreh.
 */
function registrierungsPhase(jetztMs) {
  const phase = eventPhase(jetztMs)
  if (phase === PHASE_VORHER) return 'vorher'
  if (phase === PHASE_LAEUFT) return 'event'
  return 'nachher'
}

/**
 * Gilt in dieser Phase ueberhaupt noch ein Gewinnspiel?
 *
 * Vorher und waehrend: ja — deshalb werden Teilnahmebedingungen und
 * Mindestalter abgefragt und nachgewiesen. Nachher: nein — dann gibt es
 * nichts zuzustimmen, und eine gespeicherte Zustimmung waere schlicht
 * unwahr. Die Datenbank haelt das ueber `stadtfest_bedingungen_stimmig`
 * und `stadtfest_mindestalter_stimmig` ebenfalls fest.
 */
const mitGewinnspiel = (phaseWert) => phaseWert !== 'nachher'

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

function pruefen(b, phaseWert) {
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

  /* Teilnahmebedingungen und Mindestalter nur dort, wo es ein Gewinnspiel
     gibt. Nach dem Stadtfest ist das Formular ein reines Kontaktformular —
     dann waere beides eine Huerde ohne Zweck. */
  if (mitGewinnspiel(phaseWert)) {
    if (b.teilnahmebedingungen !== true) fehler.push('teilnahmebedingungen')
    if (STADTFEST_EVENT.minimumAge && b.mindestalterBestaetigt !== true) fehler.push('mindestalter')
  }

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
 * Der Nachweis: nicht nur true/false, sondern wer, wofuer, ueber welchen
 * Kanal, wann und mit welchem Wortlaut eingewilligt hat. Fuer
 * Telefoneinwilligungen verlangt § 7a UWG genau das.
 */
function nachweisBauen(consent, jetztIso, phaseWert) {
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
      registrierungsPhase: phaseWert,
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

  /* Die Phase entscheidet, welche Regeln gelten — nicht, ob gespeichert
     werden darf. Registriert werden darf vorher, waehrenddessen und
     nachher. Der Server bestimmt sie selbst; die Uhr des Besuchers ist
     dafuer keine Grundlage. */
  const phaseWert = registrierungsPhase(jetztMs)

  const daten = pruefen(b, phaseWert)
  if (daten.fehler.length) {
    res.status(400).json({
      ok: false,
      gespeichert: false,
      phase: phaseWert,
      felder: daten.fehler,
      meldung: 'Da fehlt noch etwas.',
    })
    return
  }

  /* Notbremse. Nur ein ausdrueckliches '0' haelt den Endpoint an. */
  if (STADTFEST_SCHREIBEN === '0') {
    res.status(503).json({
      ok: false,
      gespeichert: false,
      meldung: 'Die Anmeldung ist gerade pausiert. Bitte spaeter noch einmal versuchen.',
    })
    return
  }

  if (!konfiguriert()) {
    res.status(503).json({
      ok: false,
      gespeichert: false,
      meldung: 'Die Anmeldung ist gerade nicht erreichbar. Bitte kurz beim Team melden.',
    })
    return
  }

  const emailNorm = normalisiereEmail(daten.email)
  const hash = ipHash(ip)
  const jetztIso = new Date(jetztMs).toISOString()
  const gewinnspiel = mitGewinnspiel(phaseWert)

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

    /* --- Doppelregistrierung -------------------------------------
       Ein Datensatz je E-Mail und Event. Wichtig: die Antwort darf nicht
       verraten, ob eine fremde Adresse bereits in der Datenbank liegt.
       Deshalb:
         • Name passt zur vorhandenen Registrierung -> „bekannt"
         • Name passt nicht                         -> exakt dieselbe Antwort
           wie bei einer neuen Registrierung, mit den gerade eingetippten
           Angaben. Es wird nichts geschrieben und nichts veraendert.
       Von aussen sind beide Faelle nicht unterscheidbar.

       Der einmal vergebene Code bleibt stehen. Wer sich vorab eingetragen
       hat und spaeter noch einmal absendet, bekommt denselben Code wieder
       zu sehen — genau den zeigt er am Stand vor. */
    const suche = await fetch(
      `${STADTFEST_SUPABASE_URL}/rest/v1/${TABELLE}`
        + `?select=vorname,nachname,submission_code,created_at,registrierungs_phase`
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
        phase: phaseWert,
        code: alt.submission_code,
        zeitpunkt: gleicherName ? alt.created_at : jetztIso,
      })
      return
    }

    /* --- Neue Registrierung ---------------------------------------
       Ausschliesslich Registrierungsfelder. Die Standfelder
       (stempel_ausgegeben_at, gluecksrad_gedreht_at, hauptpreis_*,
       Mitarbeiter-IDs) stehen hier bewusst nicht und duerfen hier auch
       nie stehen: sie entstehen nur am Stand, bestaetigt durch das Team,
       ueber die geschuetzte Studio-API. */
    const nachweis = nachweisBauen(daten.consent, jetztIso, phaseWert)
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
      registrierungs_phase: phaseWert,

      /* Nur wo es ein Gewinnspiel gibt, gibt es auch etwas zuzustimmen.
         Sonst bleiben die Felder leer — die Pruefregel in der Datenbank
         besteht darauf. */
      teilnahmebedingungen_version: gewinnspiel ? STADTFEST_EVENT.termsVersion : null,
      teilnahmebedingungen_akzeptiert_at: gewinnspiel ? jetztIso : null,
      privacy_version: STADTFEST_EVENT.privacyVersion,
      mindestalter_bestaetigt: gewinnspiel && STADTFEST_EVENT.minimumAge ? true : null,

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
        meldung: 'Wir konnten das gerade nicht speichern. Bitte noch einmal antippen.',
      })
      return
    }

    const gespeicherteZeile = await antwort.json().catch(() => null)
    const erste = Array.isArray(gespeicherteZeile) ? gespeicherteZeile[0] : null

    res.status(200).json({
      ok: true,
      gespeichert: true,
      status: 'neu',
      phase: phaseWert,
      code: erste?.submission_code ?? code,
      zeitpunkt: erste?.created_at ?? jetztIso,
    })
  } catch {
    res.status(500).json({
      ok: false,
      gespeichert: false,
      meldung: 'Wir konnten das gerade nicht speichern. Bitte noch einmal antippen.',
    })
  }
}
