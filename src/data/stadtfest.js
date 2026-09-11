/**
 * Zentrale Konfiguration der Stadtfest-Aktionsseite (/stadtfest).
 *
 * Alles, was das Event beschreibt, steht hier — nichts davon gehört ins JSX.
 * Die Seite, der Serverendpunkt (api/stadtfest.js) und die Rechtstexte
 * (stadtfest-recht.js) lesen dieselben Werte, damit gespeicherte Nachweise und
 * angezeigter Text nie auseinanderlaufen.
 *
 * ACHTUNG — PHASE 2 (Vorbereitung): Die mit OFFEN markierten Werte sind noch
 * NICHT bestätigt. `datenBestaetigt: false` ist die Sperre dafür: solange sie
 * false ist, darf die Seite nicht produktiv gehen. Die Kalendertage des Events
 * sind bestätigt, die Stand-/Aktionszeiten pro Tag sind es nicht — dafür gibt
 * es zusätzlich `zeitenBestaetigt`.
 *
 * Die Gewinnmechanik ist zweistufig (siehe STADTFEST_GEWINNMECHANIK):
 * Sofortgewinn am Stand vs. Qualifikation für die spätere Hauptpreis-Ziehung.
 * Diese Unterscheidung ist rechtlich relevant und darf nirgends verwischt
 * werden.
 */

/**
 * Das Event selbst.
 *
 * Zeiten stehen bewusst als ISO-Zeichenkette MIT Offset. Damit ist der
 * Zeitpunkt eindeutig, egal in welcher Zeitzone Browser oder Serverless-
 * Funktion laufen. Die Anzeige formatiert anschließend explizit nach
 * Europe/Berlin (siehe eventTagText / uhrzeitText weiter unten).
 */
export const STADTFEST_EVENT = {
  id: 'wuerzburger-stadtfest-2026',
  name: 'Würzburger Stadtfest 2026',
  ort: 'Würzburg',

  /* BESTÄTIGT (Quelle: Stadt Würzburg) sind die Kalendertage:
     Freitag, 18.09.2026 und Samstag, 19.09.2026.
     Der zuvor hinterlegte Zeitraum 11.–13.09.2026 war falsch — das ist das
     STRAMU, nicht das Stadtfest.

     Ebenfalls bestätigt: am Stand wird ganztägig gearbeitet. Es gibt bewusst
     KEINE künstliche tägliche Öffnungs- oder Schließzeit. Der Eventmodus hat
     deshalb genau eine einfache Grenze:
       Start 18.09.2026 00:00 Europe/Berlin
       Ende  20.09.2026 00:00 Europe/Berlin
     Diese Grenze beendet ausschließlich den EVENT-/Gewinnspielmodus — nicht
     die Route. Ab dem 20.09. wechselt dieselbe URL automatisch nach POST. */
  tage: [
    { datum: '2026-09-18', ganztaegig: true },
    { datum: '2026-09-19', ganztaegig: true },
  ],
  startsAt: '2026-09-18T00:00:00+02:00',
  endsAt: '2026-09-20T00:00:00+02:00',
  zeitenBestaetigt: true,

  /* OFFEN — hängt an den Teilnahmebedingungen (Teilnahmealter).
     null = keine Altersabfrage, Zahl = Pflichtcheckbox „mindestens N Jahre". */
  minimumAge: 18,

  /* Versionsstände der Texte. Werden pro Teilnahme mitgespeichert, damit
     später belegbar ist, welcher Wortlaut zugestimmt wurde. */
  termsVersion: 'stadtfest-teilnahmebedingungen-2026-09-entwurf-1',
  privacyVersion: 'stadtfest-datenschutz-2026-09-entwurf-1',
  consentVersion: 'stadtfest-einwilligung-2026-09-entwurf-2',

  /* Herkunft. Der Slug ist ein VORSCHLAG für den Event-QR-Code im bestehenden
     System (go.videko-kuechen.de/<slug>). Er ist noch NICHT angelegt. */
  sourceSlug: 'stadtfest-2026',

  /* Freigabeschalter. Muss vor dem produktiven Deployment bewusst auf true
     gesetzt werden — zusammen mit echten Daten oben und zeitenBestaetigt. */
  datenBestaetigt: false,
}

/* ------------------------------------------------------------------ */
/* Zeitraum                                                            */
/* ------------------------------------------------------------------ */

/**
 * Die drei Betriebsmodi der Seite. Die Route /stadtfest ist in allen drei
 * Modi erreichbar — es gibt keinen Zustand, in dem der QR ins Leere läuft.
 *
 *   PHASE_VORHER  (PRE)   Eventvorschau. Kein Gewinnspiel, kein Stempel,
 *                         keine Hauptpreisqualifikation, kein Lostopf.
 *   PHASE_LAEUFT  (EVENT) Voller Gewinnspielflow am Stand.
 *   PHASE_NACHHER (POST)  Gewinnspiel beendet, Seite bleibt als kurze
 *                         Leadseite stehen. Keine Nachzüglerteilnahme.
 */
export const PHASE_VORHER = 'vorher'
export const PHASE_LAEUFT = 'laeuft'
export const PHASE_NACHHER = 'nachher'

/**
 * In welcher Phase befindet sich das Event zum Zeitpunkt `jetzt`?
 *
 * Bewusst eine reine Funktion ohne Zugriff auf Date.now() im Rumpf: die Seite
 * ruft sie erst in einem Effekt auf (sonst würde der vorgerenderte HTML-Stand
 * gegen den Browserstand laufen), der Server ruft sie mit seiner eigenen Zeit.
 */
export function eventPhase(jetzt, event = STADTFEST_EVENT) {
  const start = Date.parse(event.startsAt)
  const ende = Date.parse(event.endsAt)
  if (Number.isNaN(start) || Number.isNaN(ende)) return PHASE_NACHHER
  if (jetzt < start) return PHASE_VORHER
  /* >= und nicht >: der Eventmodus endet mit dem Beginn des 20.09.,
     nicht eine Millisekunde später. */
  if (jetzt >= ende) return PHASE_NACHHER
  return PHASE_LAEUFT
}

const BERLIN = 'Europe/Berlin'

/** „Freitag, 11. September 2026" — immer in Berliner Zeit. */
export function eventTagText(ts) {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: BERLIN,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(ts))
}

/** „13:42:17" — immer in Berliner Zeit. */
export function uhrzeitText(ts) {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: BERLIN,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(ts))
}

/**
 * „Freitag, 18. September 2026 und Samstag, 19. September 2026“ — nur die
 * bereits bestätigten Kalendertage, ohne Uhrzeit.
 */
export function eventTageText(event = STADTFEST_EVENT) {
  const fmt = new Intl.DateTimeFormat('de-DE', {
    timeZone: BERLIN,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const tage = (event.tage || []).map((t) => fmt.format(new Date(Date.parse(t.datum + 'T12:00:00+02:00'))))
  if (tage.length === 0) return ''
  if (tage.length === 1) return tage[0]
  return tage.slice(0, -1).join(', ') + ' und ' + tage[tage.length - 1]
}

/**
 * Zeitraum für die Rechtstexte.
 *
 * Solange die Zeiten nicht bestätigt sind (zeitenBestaetigt), werden bewusst
 * NUR die Kalendertage genannt.
 *
 * Sind sie bestätigt und ist jeder Tag als ganztägig hinterlegt, wird auch
 * genau das geschrieben — und keine erfundene Öffnungszeit.
 */
export function zeitraumText(event = STADTFEST_EVENT) {
  if (!event.zeitenBestaetigt) return eventTageText(event)
  const tage = event.tage || []
  if (tage.length > 0 && tage.every((t) => t.ganztaegig)) {
    return `${eventTageText(event)} — jeweils ganztägig`
  }
  const tag = (iso) =>
    new Intl.DateTimeFormat('de-DE', { timeZone: BERLIN, day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(Date.parse(iso)))
  const uhr = (iso) =>
    new Intl.DateTimeFormat('de-DE', { timeZone: BERLIN, hour: '2-digit', minute: '2-digit', hour12: false })
      .format(new Date(Date.parse(iso)))
  return `${tag(event.startsAt)}, ${uhr(event.startsAt)} Uhr bis ${tag(event.endsAt)}, ${uhr(event.endsAt)} Uhr`
}

/* ------------------------------------------------------------------ */
/* Formular                                                            */
/* ------------------------------------------------------------------ */

/**
 * Interessen (§4). Freiwillig, Mehrfachauswahl, keine Auswahl erforderlich.
 * `key` wandert in die Datenbank, `label` steht auf dem Chip.
 *
 * `imLead` sagt, ob der Chip auch im Kontaktformular außerhalb des Events
 * (PRE und POST) auftaucht. „Nur wegen dem Gewinn hier" ergibt dort keinen
 * Sinn — es gibt in diesen Phasen kein Gewinnspiel.
 */
export const STADTFEST_INTERESSEN = [
  { key: 'kueche-bad', label: 'Küche & Bad', imLead: true },
  { key: 'pv', label: 'PV', imLead: true },
  { key: 'innenausbau', label: 'Innenausbau', imLead: true },
  { key: 'smart-home', label: 'Smart Home', imLead: true },
  { key: 'immobilie', label: 'Immobilie', imLead: true },
  { key: 'finanzen', label: 'Versicherung / Finanzen', imLead: true },
  { key: 'nur-gewinn', label: 'Nur wegen dem Gewinn hier', imLead: false },
]

/** Die sechs Chips des Kontaktformulars in PRE und POST. */
export const LEAD_INTERESSEN = STADTFEST_INTERESSEN.filter((i) => i.imLead)

/** Obergrenzen. Gelten im Browser als maxLength und auf dem Server als Kappung. */
export const FELD_GRENZEN = {
  vorname: 60,
  nachname: 60,
  email: 180,
  telefon: 32,
  plz: 5,
}

/* ------------------------------------------------------------------ */
/* Marketing-Einwilligungen (§6, §11)                                  */
/* ------------------------------------------------------------------ */

/**
 * Die beiden Unternehmen, für die separat eingewilligt werden kann.
 *
 * Wichtig und bewusst so gebaut:
 *  • Zwei getrennte Häkchen, keine Sammeleinwilligung.
 *  • Kanal (E-Mail / Telefon) wird pro Unternehmen einzeln gewählt und ist
 *    erst anwählbar, wenn das Unternehmen angehakt wurde.
 *  • Der hier hinterlegte `text` ist der Wortlaut, der zusammen mit
 *    Zeitpunkt, Kanal und Version als Nachweis gespeichert wird.
 *
 * `traeger` ist der rechtlich verantwortliche Rechtsträger. Für BEIDE Marken ist
 * das die Süddeutsche Sachwert eG. Weder „VIDEKO Küchen eG" noch „Atlas Wealth
 * eG" existieren im Genossenschaftsregister; diese Firmierungen dürfen deshalb
 * nirgends als Einwilligungsempfänger genannt werden. Sichtbar sind die Marken
 * (VIDEKO Küchen, ATLAS Wealth), rechtlich benannt wird der Träger.
 */
export const STADTFEST_FIRMEN = [
  {
    key: 'videko',
    label: 'VIDEKO Küchen',
    traeger: 'Süddeutsche Sachwert eG',
    text:
      'Die Süddeutsche Sachwert eG darf mich unter der Marke VIDEKO Küchen zu Küche, Bad, '
      + 'Innenausbau, Terminen und Aktionen kontaktieren. Ich kann diese Einwilligung jederzeit '
      + 'für die Zukunft widerrufen.',
    rechtsdatenVollstaendig: true,
  },
  {
    key: 'atlas',
    /* Sichtbares Label = Marke. Eine juristische Person "Atlas Wealth eG"
       existiert NICHT und darf nirgends als Firmierung auftauchen. */
    label: 'ATLAS Wealth',
    traeger: 'Süddeutsche Sachwert eG',
    text:
      'Die Süddeutsche Sachwert eG (ATLAS Wealth), Grubenweg 4b, 82327 Tutzing, '
      + 'info@atlas-wealth.de, darf mich zu ihren Angeboten aus den Bereichen Immobilie, '
      + 'Vorsorge und Finanzen kontaktieren. Ich kann diese Einwilligung jederzeit für die '
      + 'Zukunft widerrufen.',
    /* Rechtsdaten liegen vor (Quelle: atlas-wealth.de/impressum, siehe
       ATLAS_RECHTSDATEN unten). Die Bezeichnung des Verantwortlichen ist
       freigegeben und steht in ATLAS_RECHTSDATEN.rechtstextName. */
    rechtsdatenVollstaendig: true,
    wortlautGeprueft: true,
  },
]

/** Die beiden Kanäle, für die pro Unternehmen einzeln eingewilligt wird. */
export const KANAELE = [
  { key: 'email', label: 'E-Mail' },
  { key: 'telefon', label: 'Telefon' },
]

/* ------------------------------------------------------------------ */
/* Rechtsdaten ATLAS (§10)                                             */
/* ------------------------------------------------------------------ */

/**
 * Offizielle Rechtsdaten des ATLAS-Verantwortlichen.
 * Primärquelle: https://atlas-wealth.de/impressum
 *
 * ATLAS Wealth ist eine MARKE. Verantwortlich ist die Süddeutsche Sachwert eG.
 * Eine „Atlas Wealth eG" gibt es nicht und darf nirgends als Firmierung stehen.
 */
export const ATLAS_RECHTSDATEN = {
  marke: 'ATLAS Wealth',
  firmierung: 'Süddeutsche Sachwert eG',
  /* Freigegebene Kurzform für Rechtstexte und Einwilligungen. */
  rechtstextName: 'Süddeutsche Sachwert eG (ATLAS Wealth)',
  /* Langform, wenn mehr Kontext sinnvoll ist — etwa dort, wo die Kurzform in
     einer Klammer stünde und sich die Klammern verschachteln würden. */
  rechtstextNameLang: 'Süddeutsche Sachwert eG, handelnd unter der Marke ATLAS Wealth',
  strasse: 'Grubenweg 4b',
  plz: '82327',
  ort: 'Tutzing',
  vorstand: ['Vitali Freisinger', 'Heiko Himmel'],
  registerArt: 'GnR',
  registerNummer: '2855',
  registergericht: 'Amtsgericht München',
  ustId: 'DE327112614',
  email: 'info@atlas-wealth.de',
  datenschutzEmail: 'info@atlas-wealth.de',
  vermittlerstatus: 'Versicherungsmakler gemäß § 34d GewO',
  vermittlerRegisterNummer: 'D-GT90-5ZBL0-35',
  quelle: 'https://atlas-wealth.de/impressum',
}

/* ------------------------------------------------------------------ */
/* Gewinnmechanik (§1)                                                 */
/* ------------------------------------------------------------------ */

/**
 * Zwei Stufen — und die Unterscheidung ist nicht kosmetisch:
 *
 *  1. SOFORTGEWINN
 *     Jede gültige Teilnahme berechtigt vor Ort zu genau EINER Drehung am
 *     physischen Glücksrad. Ein normales Gewinnfeld führt zu einem Sofortpreis,
 *     der direkt am Stand ausgegeben wird. Diese Sofortpreise werden aktuell
 *     NICHT einzeln in der Datenbank protokolliert.
 *
 *  2. HAUPTPREIS-FELD
 *     Wer das Feld HAUPTPREIS dreht, gewinnt KEINEN Hauptpreis. Die Person
 *     qualifiziert sich ausschließlich für den Hauptpreis-Lostopf. Gezogen wird
 *     erst nach dem Stadtfest in einer Online-Live-Ziehung.
 *
 * Verbotener Wortlaut: „Du hast den Hauptpreis gewonnen."
 * Richtiger Wortlaut: siehe HAUPTPREIS_QUALIFIKATION_TEXT.
 */
export const STADTFEST_GEWINNMECHANIK = {
  drehungenProTeilnahme: 1,
  sofortgewinnProtokolliert: false,
  hauptpreisFeldName: 'HAUPTPREIS',
  /* Die Qualifikation setzt ausschließlich geschütztes Studio-Personal.
     Über das öffentliche Frontend ist sie technisch nicht erreichbar. */
  qualifikationNurDurchStaff: true,
}

/** Der einzig zulässige Satz nach einem Hauptpreis-Feld. */
export const HAUPTPREIS_QUALIFIKATION_TEXT = 'Du bist für die Hauptpreis-Verlosung qualifiziert.'

/** Kurzformen für die Staff-Ansicht (§15). Keine Gewinnbehauptung. */
export const HAUPTPREIS_STAFF_TEXT = {
  knopf: 'HAUPTPREIS QUALIFIZIERT',
  frisch: 'IM LOSTOPF. ✓',
  freigeschaltet: 'HAUPTPREIS-CHANCE FREIGESCHALTET.',
  bereits: 'BEREITS IM LOSTOPF',
}

/* ------------------------------------------------------------------ */
/* Hauptpreise (§6, §7)                                                */
/* ------------------------------------------------------------------ */

/** Bedingungen der 1.000-€-Küchengutscheine. Die Einlösefrist fehlt noch. */
export const GUTSCHEIN_BEDINGUNGEN = [
  'Einlösbar ab einem Mindestauftragswert von 10.000 €.',
  'Maximal ein 1.000-€-Gutschein pro Auftrag.',
  'Nicht mit anderen Gewinn- oder Aktionsgutscheinen kombinierbar.',
  'Keine Barauszahlung.',
  'Nicht rückwirkend auf bereits abgeschlossene Aufträge anwendbar.',
]

/**
 * Die sechs Hauptpreise. Das Feld `offen` listet je Preis die Angaben, die noch
 * nicht feststehen. Nichts davon wird erfunden; die Punkte laufen über
 * STADTFEST_OFFEN zentral zusammen.
 */
export const STADTFEST_HAUPTPREISE = [
  {
    key: 'goldbarren',
    anzahl: 1,
    titel: '5-g-Goldbarren',
    beschreibung: 'Ein Goldbarren mit 5 Gramm Feingold.',
    offen: [],
  },
  {
    key: 'wellnessurlaub',
    anzahl: 1,
    titel: 'Wellnessurlaub',
    beschreibung: null,
    offen: ['Genaue Leistung und Ziel', 'Umfang und Personenanzahl', 'Wert'],
  },
  {
    key: 'spanndecke',
    anzahl: 1,
    titel: 'Kostenlose Spanndecke',
    beschreibung: null,
    offen: ['Genauer Leistungsumfang', 'Maximale Fläche', 'Wertgrenze'],
  },
  {
    key: 'kuechengutschein',
    anzahl: 3,
    titel: '1.000-€-Küchengutschein',
    beschreibung: 'Gutschein über 1.000 € auf einen Küchenauftrag bei VIDEKO Küchen.',
    bedingungen: GUTSCHEIN_BEDINGUNGEN,
    offen: ['Einlösefrist'],
  },
]

/** 1 + 1 + 1 + 3 = 6. Gerechnet, nicht getippt. */
export const HAUPTPREISE_GESAMT = STADTFEST_HAUPTPREISE.reduce((n, preis) => n + preis.anzahl, 0)

/* ------------------------------------------------------------------ */
/* Hauptpreis-Ziehung (§8, §9)                                         */
/* ------------------------------------------------------------------ */

/**
 * Die Ziehung findet nach dem Stadtfest online im Livestream statt.
 * Termin, Uhrzeit und Kanal stehen noch nicht fest — sie bleiben null, und der
 * Rechtstext markiert die Stelle sauber als offen. Es wird ausdrücklich KEINE
 * YouTube- oder Instagram-Adresse erfunden.
 */
export const STADTFEST_ZIEHUNG = {
  art: 'online-livestream',
  terminAt: null,
  plattform: null,
  url: null,

  /* Ziehungsgrundlage: ausschließlich gültige Stadtfest-Teilnahmen mit
     hauptpreis_qualifiziert = true. Marketing-Einwilligungen, VIDEKO wie
     ATLAS, haben auf die Gewinnchance keinen Einfluss. */
  nurQualifizierte: true,
  consentBeeinflusstChance: false,

  /* Verbindlich freigegeben: eine Person kann maximal EINEN Hauptpreis
     gewinnen. Wird eine bereits gezogene Person erneut gezogen, wird für
     diesen Preis neu gezogen. Bestätigt — das erlaubt aber nicht die Ziehung
     selbst, die bleibt separat gesperrt. */
  maxGewinneProPerson: 1,
  regelBestaetigt: true,

  /* Benachrichtigung. Der Livestream ersetzt sie nicht. Die Telefonnummer darf
     ausschließlich zur Gewinnabwicklung genutzt werden — das ist KEINE
     Werbeeinwilligung und strikt von Marketing getrennt. */
  benachrichtigungKanaele: ['email', 'telefon'],
  benachrichtigungIstKeineWerbung: true,
  annahmefristTage: 7,
  nachziehungBeiKeinerReaktion: true,

  bestaetigt: false,
}

/* ------------------------------------------------------------------ */
/* Offene Punkte (§16)                                                 */
/* ------------------------------------------------------------------ */

/**
 * Zentrale Liste aller noch nicht bestätigten Angaben. Nichts davon wird
 * erfunden. Solange hier Einträge stehen, bleibt die Produktivfreigabe zu.
 */
export const STADTFEST_OFFEN = [
  'Wellnessurlaub: genaue Leistung und Ziel',
  'Wellnessurlaub: Wert, Personenanzahl, enthaltene Leistungen',
  'Spanndecke: genauer Leistungsumfang',
  'Spanndecke: maximale Fläche bzw. maximaler Wert',
  'Küchengutscheine: Einlösefrist',
  'Hauptpreis-Ziehung: Termin',
  'Hauptpreis-Ziehung: Uhrzeit',
  'Hauptpreis-Ziehung: Plattform und Streaming-Adresse',
  'Finale Speicherdauer der Teilnahmedaten',
]

/** Reine Ableitung, damit die Freigabebedingung nur an einer Stelle steht. */
export function freigabeMoeglich(event = STADTFEST_EVENT) {
  return (
    STADTFEST_OFFEN.length === 0 && Boolean(event.zeitenBestaetigt) && STADTFEST_ZIEHUNG.regelBestaetigt
  )
}

/* ------------------------------------------------------------------ */
/* Microcopy                                                           */
/* ------------------------------------------------------------------ */

/**
 * Trockene Zeilen unter der Subline. Der erste Eintrag steht fest im
 * vorgerenderten HTML; gewechselt wird erst nach der Hydration (kein
 * Math.random beim Render).
 */
export const STADTFEST_MICROCOPY = [
  'Kein Kauf. Kein Abo. Kein Vertreterbesuch.',
  'Wir hätten auch Zettel nehmen können. Wollten wir aber nicht.',
  'Der Stempel ist analog. Alles andere nicht.',
  'Pflichtfelder sind drei. Das ist weniger als beim Einwohnermeldeamt.',
  'Die Häkchen unten sind freiwillig. Wirklich.',
]

export const CTA_TEXT = 'STEMPEL FREISCHALTEN'
export const CTA_TEXT_LAEUFT = 'WIRD OFFIZIELL ...'

/* ------------------------------------------------------------------ */
/* PRE und POST                                                        */
/* ------------------------------------------------------------------ */

/**
 * Die Route /stadtfest ist dauerhaft erreichbar — vor dem Fest, während des
 * Festes und Monate danach. Was dort steht, entscheidet allein die Phase.
 *
 * Für PRE und POST gilt gleichermaßen: hier gibt es kein Gewinnspiel. Kein
 * Stempel, keine Hauptpreisqualifikation, kein Lostopf, kein nachträglicher
 * Eintritt. Das Formular in diesen Phasen ist ein Kontaktformular, sonst
 * nichts — und es wird auch getrennt gespeichert.
 */
export const STADTFEST_PRE = {
  titel: 'Das Stadtfest kommt.',
  subline: 'Den QR hast du schon mal richtig benutzt.',
  formularTitel: 'Sollen wir uns vorher melden?',
  formularText: 'Freiwillig. Das Gewinnspiel startet trotzdem erst am Stand.',
}

export const STADTFEST_POST = {
  titel: 'Das Stadtfest ist vorbei.',
  subline: 'Der QR funktioniert trotzdem noch. Praktisch.',
  hinweis: 'Das Gewinnspiel ist beendet. Neue Teilnahmen, Stempel oder Lose gibt es dafür nicht mehr.',
  formularTitel: 'Wenn wir uns bei dir melden dürfen, lass uns kurz deine Daten da.',
  formularText: 'Kurz. Freiwillig. Ohne Gewinnspiel.',
}

export const LEAD_CTA_TEXT = 'DATEN DALASSEN'
export const LEAD_CTA_TEXT_LAEUFT = 'GEHT RAUS ...'

/* Bewusst NICHT „STEMPEL FREIGEGEBEN": hier wurde nichts freigeschaltet,
   hier wurde etwas gespeichert. */
export const LEAD_ERFOLG_TITEL = 'Ist angekommen. ✓'
export const LEAD_ERFOLG_TEXT = 'Wir melden uns, wenn du uns das erlaubt hast.'
