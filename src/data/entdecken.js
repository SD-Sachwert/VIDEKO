import { BRAND } from './company.js'
import { SOCIAL_PROFILES, socialUrl } from './site.js'
import { INDEX_BASIS, INDEX_ZIEL, MODUS } from '../lib/baustellenindex.js'
import entdeckenVideo from '../assets/images/studio/bilder/Umbau.mp4'
import entdeckenPoster from '../assets/images/studio/bilder/02_intro_showroom_hell.webp'
import texturNacht from '../assets/images/studio/bilder/08_split_section_showroom_gross.webp'
import texturFinale from '../assets/images/studio/bilder/10_final_cta_studio_banner.webp'
import karteHertzstrasse from '../assets/images/studio/karte-hertzstrasse-osm.webp'
import soundtrack from '../assets/audio/videko-soundtrack.mp3'

// Flaechenmotive der Social-Kacheln. Bewusst KEINE Screenshots echter Posts —
// die liegen nicht im Repo und duerften nicht erfunden werden. Stattdessen
// eigene VIDEKO-Studio-Renderings, in styles.css stark abgedunkelt und
// entsaettigt: sie tragen die Kachel als Material und Licht, nicht als
// Inhaltsversprechen. Reihenfolge = SOCIAL_REIHENFOLGE weiter unten.
import bildInstagram from '../assets/images/studio/bilder/03_studio_card_ankommen_lounge.webp'
import bildTiktok from '../assets/images/studio/bilder/06_studio_card_planung_erleben.webp'
import bildYoutube from '../assets/images/studio/bilder/04_studio_card_kuechenwelten_entdecken.webp'
import bildFacebook from '../assets/images/studio/bilder/09_team_beratung_auf_augenhoehe.webp'
import bildLinkedin from '../assets/images/studio/bilder/07_studio_card_beratung_vertiefen.webp'
import bildSpotify from '../assets/images/studio/bilder/05_studio_card_materialien_fuehlen.webp'

/* ------------------------------------------------------------------ *
 * Eroeffnung
 * ------------------------------------------------------------------ */

/**
 * Eroeffnungszustand — die einzige Stelle, an der steht, ob wir offen haben.
 *
 * `plannedDate` ist der oeffentlich angekuendigte Termin und bleibt stehen, auch
 * wenn er verstreicht. Ab da zaehlt die Seite von selbst weiter, aber sie
 * behauptet NICHT, dass geoeffnet ist: „Wir haben geoeffnet.“ erscheint
 * ausschliesslich, wenn hier jemand `actualOpen: true` setzt. Das ist Absicht —
 * ein Datum im Kalender ist kein offenes Studio.
 *
 * Wenn es tatsaechlich soweit ist: `actualOpen: true` und `actualOpeningDate`
 * auf den echten Tag setzen. Die Seite rechnet daraus selbst aus, wie viel
 * spaeter es geworden ist.
 */
export const OPENING = {
  plannedDate: '2026-12-01T00:00:00+01:00',
  actualOpen: false,
  actualOpeningDate: null,
}

/**
 * Einzige Quelle der Wahrheit fuer /entdecken.
 *
 * /entdecken ist das dauerhafte Ziel der Offline-QR-Codes (Aufkleber, Stadtfest,
 * Taschen, Banner). Alles, was sich waehrend der Bauphase aendert, steht hier —
 * nicht in der Seite. Social-URLs bleiben in `site.js`, die Adresse in
 * `company.js`. Keine Duplikate.
 */
export const ENTDECKEN_CONFIG = {
  // Eroeffnungstermin. Steht genau einmal im Projekt, naemlich in OPENING.
  openingDate: OPENING.plannedDate,
  // Einziges echtes Baustellen-Motiv im Repo. Kein Stock, kein Fake.
  video: {
    src: entdeckenVideo,
    poster: entdeckenPoster,
    label: 'Studio im Aufbau',
  },
  // Dezente Texturen fuer die dunklen Baender. Eigene Studio-Renderings, stark
  // abgedunkelt und rein als Flaeche — sie behaupten keinen Bauzustand.
  texturen: {
    nacht: texturNacht,
    finale: texturFinale,
  },
}

/* ------------------------------------------------------------------ *
 * Soundtrack
 * ------------------------------------------------------------------ */

/**
 * Hintergrund-Soundtrack der Seite.
 *
 * Die Quelle ist unsere eigene Aufnahme — kein fremdes Audio, kein Stream, kein
 * Drittanbieter. Das Original liegt als 48-kHz-24-Bit-WAV vor (52 MB, 3:09) und
 * bleibt unangetastet; ausgeliefert wird eine daraus erzeugte MP3 mit 160 kbit/s
 * (3,6 MB). Eine 52-MB-WAV in einen Seitenaufruf zu haengen waere niemandem
 * zuzumuten, hoerbar billig komprimieren wollen wir den Track aber auch nicht.
 *
 * Geladen wird die Datei erst, wenn sie wirklich gebraucht wird: Das <audio>
 * steht auf `preload="none"`, der Ton startet ausschliesslich nach einer
 * eindeutigen Nutzergeste, und wer ihn ausschaltet, bekommt ihn nie wieder
 * ungefragt zu hoeren (siehe `speicher`).
 */
export const SOUNDTRACK = {
  datei: soundtrack,
  typ: 'audio/mpeg',
  titel: 'VIDEKO Baustellen-Soundtrack',
  // Leise im Hintergrund, nie auf voller Lautstaerke.
  lautstaerke: 0.24,
  // Merker fuer die Entscheidung des Besuchers. localStorage, damit „aus“ auch
  // beim naechsten Besuch „aus“ bleibt — ausgeschalteter Ton wird nie wieder
  // von selbst eingeschaltet.
  speicher: 'videko:sound',
  labelAn: 'Sound an',
  labelAus: 'Sound aus',
  // Pfad der ausgelieferten Webfassung im Repo.
  erwarteterPfad: 'src/assets/audio/videko-soundtrack.mp3',
}

/* ------------------------------------------------------------------ *
 * VIDEKO-Baustellenindex
 * ------------------------------------------------------------------ */

/**
 * Gates des Baustellenindex — echte Ereignisse, nicht Kalenderarithmetik.
 *
 * Solange `kitchensDeliveredAt` auf `null` steht, sind die davon abhaengigen
 * Bereiche eingefroren: Kuechen und Beleuchtung stehen auf 0, Bar und Empfang
 * ruehren sich nicht, die Ausstellung kommt nicht ueber ihre Obergrenze hinaus.
 * Kein taeglicher Pflegeaufwand, kein Nachtragen von Prozenten.
 *
 * Sobald die Kuechen wirklich geliefert sind, hier EIN Datum eintragen
 * (`'2026-10-15'`) — ab diesem Tag laufen alle vier Bereiche von selbst los und
 * die Ausstellung waechst ueber ihren bisherigen Deckel hinaus.
 */
export const BAUSTELLEN_GATES = {
  kitchensDeliveredAt: null,
}

/**
 * Bereiche des Baustellenindex.
 *
 * WICHTIG: Die Prozentwerte sind KEIN belegter Baufortschritt, und sie laufen
 * ausdruecklich NICHT auf den Eroeffnungstermin zu. Jeder Bereich waechst fuer
 * sich — oder eben gar nicht:
 *
 *   MODUS.AUTO           waechst taeglich mit `dailyPace` gegen `softCap`.
 *   MODUS.AUTO_BIS_GATE  waechst nur bis `preDeliveryCap`; erst nach dem Gate
 *                        weiter gegen `softCap`.
 *   MODUS.GATED          steht exakt auf `basePercent`, bis das Gate faellt.
 *
 * `variance` streut das Tagestempo (deterministisch, aus Bereich + Datum), damit
 * es Tage ohne Bewegung und Tage mit zwei Punkten gibt. `softCap` wird nie ganz
 * erreicht, 100 % gibt es nur ueber `completedAt` — die Rechnung in
 * lib/baustellenindex.js deckelt sonst bei 99.
 *
 * `text` ist die Hauptaussage des Bereichs und bleibt handgeschrieben.
 * `gateText` ersetzt die Tagesdifferenz, solange der Bereich blockiert ist.
 *
 * Reihenfolge = Anzeigereihenfolge.
 */
export const BAUSTELLEN_BEREICHE = [
  {
    id: 'ausstellung',
    label: 'Ausstellung',
    icon: 'ausstellung',
    modus: MODUS.AUTO_BIS_GATE,
    basePercent: 14,
    dailyPace: 0.46,
    variance: 0.5,
    // Ohne Kuechen ist bei rund einem Drittel Schluss — Boden, Wand und Licht
    // bringen einen Ausstellungsraum nur so weit.
    preDeliveryCap: 35,
    softCap: 82,
    gatePace: 0.6,
    gate: 'kitchensDeliveredAt',
    gateText: 'Wartet auf Küchen',
    baseDate: INDEX_BASIS,
    completedAt: null,
    text: '600 m². Wir hätten auch kleiner anfangen können.',
  },
  {
    id: 'kuechen',
    label: 'Küchen',
    icon: 'kuechen',
    modus: MODUS.GATED,
    basePercent: 0,
    dailyPace: 0.95,
    variance: 0.5,
    softCap: 88,
    gate: 'kitchensDeliveredAt',
    gateText: 'Wartet auf Lieferung',
    gateBadge: 'Wartet',
    baseDate: INDEX_BASIS,
    completedAt: null,
    text: 'Noch keine Küche da. Für ein Küchenstudio mutig.',
  },
  {
    id: 'bar',
    label: 'Bar',
    icon: 'bar',
    modus: MODUS.GATED,
    basePercent: 9,
    dailyPace: 0.62,
    variance: 0.5,
    softCap: 70,
    gate: 'kitchensDeliveredAt',
    gateText: 'Pausiert',
    gateBadge: 'Pausiert',
    baseDate: INDEX_BASIS,
    completedAt: null,
    text: 'Zapfen können wir gedanklich schon.',
  },
  {
    id: 'empfang',
    label: 'Empfang',
    icon: 'empfang',
    modus: MODUS.GATED,
    basePercent: 12,
    dailyPace: 0.66,
    variance: 0.5,
    softCap: 72,
    gate: 'kitchensDeliveredAt',
    gateText: 'Pausiert',
    gateBadge: 'Pausiert',
    baseDate: INDEX_BASIS,
    completedAt: null,
    text: 'Der erste Eindruck kommt. Irgendwann.',
  },
  {
    id: 'beleuchtung',
    label: 'Beleuchtung',
    icon: 'beleuchtung',
    modus: MODUS.GATED,
    basePercent: 0,
    dailyPace: 0.72,
    variance: 0.5,
    softCap: 75,
    gate: 'kitchensDeliveredAt',
    // Beleuchtung haengt technisch an den Kuechen: Wo nichts steht, wird auch
    // nichts beleuchtet.
    gateText: 'Blockiert von: Küchen',
    gateBadge: 'Blockiert',
    baseDate: INDEX_BASIS,
    completedAt: null,
    text: 'Licht ist grundsätzlich vorgesehen.',
  },
  {
    id: 'luxusklo',
    label: 'Luxusklo',
    icon: 'luxusklo',
    modus: MODUS.AUTO,
    basePercent: 20,
    dailyPace: 1.15,
    variance: 0.55,
    softCap: 78,
    baseDate: INDEX_BASIS,
    completedAt: null,
    text: 'Vorwände hängen schon. Eine Wand steht. Luxus ist relativ.',
    // Die Klos gehoeren inzwischen zur Geschichte — sie duerfen auffallen.
    akzent: true,
  },
  {
    id: 'mitarbeiterklo-1',
    label: 'Mitarbeiterklo 1',
    icon: 'dusche',
    modus: MODUS.AUTO,
    basePercent: 10,
    dailyPace: 0.89,
    variance: 0.55,
    softCap: 65,
    baseDate: INDEX_BASIS,
    completedAt: null,
    text: 'Duschen und aufs Klo gehen reicht. Mehr war nicht versprochen.',
    akzent: true,
  },
  {
    id: 'mitarbeiterklo-2',
    label: 'Mitarbeiterklo 2',
    icon: 'tropfen',
    modus: MODUS.AUTO,
    // Ausdruecklich der langsamste Bereich der Seite.
    basePercent: 5,
    dailyPace: 0.5,
    variance: 0.6,
    softCap: 45,
    baseDate: INDEX_BASIS,
    completedAt: null,
    text: 'Wände stehen. Der Rest hält sich noch bedeckt.',
    akzent: true,
  },
  {
    id: 'aufenthaltsraum',
    label: 'Aufenthaltsraum',
    icon: 'aufenthalt',
    modus: MODUS.AUTO,
    basePercent: 5,
    dailyPace: 0.5,
    variance: 0.55,
    softCap: 38,
    baseDate: INDEX_BASIS,
    completedAt: null,
    text: 'Billardtisch, PS5 und Beamer sind da. Prioritäten sitzen.',
  },
]

/** Texte rund um das Dashboard. Der Ton macht klar, wie ernst der Index ist. */
export const BAUSTELLEN_TEXTE = {
  kicker: 'Höchst wissenschaftlich',
  sub: 'Täglich neu berechnet. Vom Bauleiter ausdrücklich nicht geprüft.',
  gesamtLabel: 'VIDEKO Baustellenindex',
  gesamtNote: 'wissenschaftlich ungefähr',
  standLabel: 'Stand',
  hinweis: 'Ändert sich öfter als uns lieb ist.',
  // Ausdrueckliche Einordnung. Steht sichtbar unter dem Dashboard.
  disclaimer:
    'Der Baustellenindex ist ein Stimmungsbarometer, kein Bautagebuch: Die Prozente rechnen sich automatisch. Manche Bereiche wachsen langsam von selbst, andere stehen still, bis wirklich etwas passiert. Ein gemessener Baufortschritt ist das nicht.',
  zielDatum: INDEX_ZIEL,
}

/* ------------------------------------------------------------------ *
 * Easter Egg
 * ------------------------------------------------------------------ */

/**
 * Easter Egg „Drück nicht.“
 * Reiner Spass, nur in der Session. Keine Datenbank, kein Tracking, keine API.
 * `{tage}` wird zur Laufzeit durch die verbleibenden Tage ersetzt.
 */
/**
 * „Drueck nicht." — der Knopf im Hero.
 *
 * Drei Ebenen, alle rein lokal: bei jedem Klick eine zufaellige Zeile aus
 * `meldungen`, mit `seltenChance` stattdessen eine aus `selten`, und bei
 * bestimmten Klickzahlen zwingend die Zeile aus `meilensteine`. Kein
 * Speicher, keine Datenbank, kein Tracking, kein Netzaufruf — der Zaehler
 * lebt nur in der laufenden Session.
 *
 * Platzhalter in den Texten werden in Entdecken.jsx ersetzt:
 *   {count}    Anzahl der Klicks in dieser Session
 *   {days}     Resttage bis zum geplanten Termin (auch {tage})
 *   {index}    aktueller Gesamt-Baustellenindex in Prozent
 *   {kuechen}  Prozentwert des Bereichs „Kuechen"
 *   {klo}      Prozentwert des Bereichs „Luxusklo"
 * Die Werte kommen aus derselben Rechnung wie der Baustellenindex — der
 * Knopf erfindet keine Zahlen.
 */
export const DRUECK_NICHT = {
  label: 'Drück nicht.',
  sub: 'Es passiert eh nichts … oder?',
  ruhe: 'Der Knopf tut nichts. Versprochen.',

  meldungen: [
    'Ich hab doch gesagt: nicht drücken.',
    'Nichts passiert. Wie angekündigt.',
    'Das war der teuerste Button auf dieser Seite.',
    'Danke. Jetzt dauert die Eröffnung einen Tag länger.',
    'Der Bauleiter wurde informiert.',
    'Das Luxusklo bleibt trotzdem bei {klo} %.',
    'Küchenlieferung wurde dadurch nicht beschleunigt.',
    'Sehr gut. Genau diese Energie fehlt auf der Baustelle.',
    'Du hast gerade aktiv nichts beigetragen.',
    'Bitte nicht nochmal. Also wirklich.',
    'Stark. Der Knopf funktioniert.',
    'Wir prüfen gerade, was du kaputt gemacht hast.',
    'Fortschritt: weiterhin wissenschaftlich ungefähr.',
    'Eine Wand ist gerade nicht umgefallen.',
    'Irgendwo hat ein Handwerker kurz gezuckt.',
    'Das Licht geht davon auch nicht schneller an.',
    'Der Empfang bleibt trotzdem stehen.',
    'Die Küchen sind immer noch nicht da.',
    'Wir hätten den Knopf besser verstecken sollen.',
    'Das stand so nicht im Bauzeitenplan.',
    'Heiko sagt, du sollst aufhören.',
    'Vitali war’s.',
    'Danke für den zusätzlichen Druck.',
    'Das wird schon irgendwie.',
    'Kurze Systemprüfung: Chaos vorhanden.',
    'Bitte warten. Baustelle lädt.',
    'Fehler 404: Küche nicht gefunden.',
    'Erfolgreich gedrückt. Sinn weiterhin unklar.',
    'Das war jetzt wirklich unnötig.',
    'Noch einmal und du bekommst einen Akkuschrauber.',
    'Du bist hartnäckiger als unsere Liefertermine.',
    'Wir zählen das übrigens mit.',
    'Der Knopf merkt sich alles.',
    'Das war Klick Nummer {count}.',
    'Du könntest stattdessen eine Küche kaufen.',
    'Kleiner Hinweis: Beratung funktioniert auch.',
    'Irgendwann passiert hier bestimmt was.',
    'Vielleicht beim nächsten Mal.',
    'Nein.',
    'Auch nein.',
    'Immer noch nein.',
    'Jetzt erst recht nicht.',
    'Überraschung: nichts.',
    'Immerhin läuft jetzt der Sound.',
    'Der Countdown läuft. Wir eher hinterher.',
    '{kuechen} % Küchen. Aber der Button glänzt.',
    'Noch {days} Tage. Danke für den zusätzlichen Druck.',
    'Baustellenindex: {index} %. Unverändert seit dem Klick.',
  ],

  // Seltene Zeilen. Kein Gewinnspiel, kein Achievement-System — nur ein
  // trockener Gag, der eben nicht bei jedem Klick kommt.
  selten: [
    'BREAKING: Eine Schraube wurde gefunden.',
    'Der Vorstand wurde soeben informiert. Leider.',
    'Du hast einen geheimen Baustellenstatus freigeschaltet: Ahnungslos.',
    'Glückwunsch. Dieser Klick war komplett kostenlos.',
    'VIDEKO Achievement unlocked: Knopfdrücker.',
    'Ein Kollege behauptet, kurz Licht gesehen zu haben.',
    'Der Bauzeitenplan wurde daraufhin neu ausgedruckt.',
    'Der Statiker sagt: unbedenklich. Diesmal.',
    'Ein Kabel wurde beschriftet. Mehr ist nicht passiert.',
    'Zwischenstand nach {count} Klicks: du bist immer noch hier.',
  ],

  seltenChance: 0.08,

  // Feste Klickzahlen schlagen den Zufall. Die Reihe ist bewusst kurz — sie
  // soll auffallen, nicht zum Sammelspiel werden.
  meilensteine: {
    1: 'Ich hab doch gesagt: nicht drücken.',
    3: 'Okay. Du lernst es offensichtlich nicht.',
    5: 'NICHT NOCHMAL.',
    7: 'Du bist ab jetzt offiziell Bauhelfer. Unbezahlt.',
    10: '10-mal gedrückt. Produktivität: überschaubar.',
    15: 'Dennis wurde soeben nervös.',
    20: 'Luxusklo +0 %. Danke fürs Nachfragen.',
    25: 'Baustelle erfolgreich neu gestartet.',
    50: 'Du hast eindeutig zu viel Zeit. Wir hätten Arbeit für dich.',
    100: 'Herzlichen Glückwunsch. Es ist immer noch nichts fertig.',
    250: 'Bitte geh jetzt wirklich nach Hause.',
  },

  zaehler: (n) => `${n}× gedrückt`,
}

/* ------------------------------------------------------------------ *
 * Socials
 * ------------------------------------------------------------------ */

const SOCIAL_TEXTE = {
  instagram: 'Baustelle, Küchen, Alltag. Der direkteste Draht zu uns.',
  tiktok: 'Kurz, schnell, ungefiltert.',
  youtube: 'Längere Einblicke in Umbau und Planung.',
  facebook: 'Für alle, die dort lesen.',
  linkedin: 'Die Firma hinter der Baustelle.',
}

// Beschriftung des Kachel-Buttons. Reine Handlungsaufforderung, keine Aussage
// ueber Reichweite oder Inhalte.
const SOCIAL_CTA = {
  instagram: 'Folgen',
  tiktok: 'Folgen',
  youtube: 'Abonnieren',
  facebook: 'Folgen',
  linkedin: 'Folgen',
}

const SOCIAL_BILDER = {
  instagram: bildInstagram,
  tiktok: bildTiktok,
  youtube: bildYoutube,
  facebook: bildFacebook,
  linkedin: bildLinkedin,
}

const SOCIAL_REIHENFOLGE = ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin']

export const ENTDECKEN_SOCIALS = SOCIAL_REIHENFOLGE.map((key) => {
  const profil = SOCIAL_PROFILES.find((p) => p.key === key)
  return {
    key,
    label: profil?.label || key,
    url: profil?.url || null,
    note: SOCIAL_TEXTE[key] || '',
    cta: SOCIAL_CTA[key] || 'Ansehen',
    bild: SOCIAL_BILDER[key] || null,
  }
})

// Spotify ist ueber site.js belegt und damit ein normaler Link wie die
// anderen Kacheln auch. Es steht hier bewusst KEINE zweite Spotify-Adresse:
// Faellt der Eintrag in site.js weg, schaltet sich die Kachel von selbst
// wieder ab, statt ins Leere zu zeigen.
export const ENTDECKEN_SPOTIFY = socialUrl('spotify')
export const ENTDECKEN_SPOTIFY_KACHEL = {
  key: 'spotify',
  label: ENTDECKEN_SPOTIFY ? 'VIDEKO Soundtrack' : 'Spotify',
  note: 'Der Soundtrack zur Baustelle. Läuft hier auch im Hintergrund.',
  // Nur noch der Ruecktritt fuer den Fall, dass die URL wieder verschwindet.
  badge: 'Bald',
  cta: 'Anhören',
  bild: bildSpotify,
}

/* ------------------------------------------------------------------ *
 * Standort
 * ------------------------------------------------------------------ */

export const STUDIO_ADRESSE = `${BRAND.studio.street}, ${BRAND.studio.postalCode} ${BRAND.studio.city}`
export const STUDIO_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STUDIO_ADRESSE)}`

/**
 * Kartenbild des Standorts.
 *
 * ECHTE Geografie, kein gezeichneter Fantasieplan: Das Bild ist ein Ausschnitt
 * der OpenStreetMap-Standardkarte (Zoom 17), zentriert auf die Hertzstrasse 4,
 * einmalig gerendert und selbst gehostet. Selbst gehostet aus zwei Gruenden:
 *
 *   1. Datenschutz. Die Datenschutzerklaerung dieser Website sagt zu, dass beim
 *      Aufruf keine Drittanbieter-Inhalte geladen werden; /studio verzichtet aus
 *      demselben Grund bereits bewusst auf eine eingebettete Karte. Ein
 *      Maps-Embed oder ein Live-Tile-Server wuerde bei jedem Aufruf ungefragt
 *      die IP des Besuchers an einen Dritten geben. Ein Bild aus dem eigenen
 *      Build tut das nicht.
 *   2. Verlaesslichkeit. Kein API-Schluessel, kein Kontingent, kein Dienst, der
 *      irgendwann seine Bedingungen aendert.
 *
 * Der Marker liegt in styles.css exakt in der Bildmitte — deshalb darf das
 * Seitenverhaeltnis des Rahmens nicht veraendert werden, sonst wandert die
 * Nadel von der Adresse weg.
 *
 * Lizenz: OpenStreetMap, ODbL. Die Namensnennung ist Pflicht und steht sichtbar
 * an der Karte.
 */
export const STUDIO_KARTE = {
  bild: karteHertzstrasse,
  alt: `Kartenausschnitt mit dem Standort ${STUDIO_ADRESSE} in der Bildmitte`,
  attribution: '© OpenStreetMap-Mitwirkende',
  attributionUrl: 'https://www.openstreetmap.org/copyright',
  routeCta: 'Route starten',
}

/** Routenlink auf die Studio-Anschrift — oeffnet die Navigation in Google Maps. */
export const STUDIO_ROUTE_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(STUDIO_ADRESSE)}`
