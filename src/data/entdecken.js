import { BRAND } from './company.js'
import { SOCIAL_PROFILES, socialUrl } from './site.js'
import { INDEX_BASIS, INDEX_ZIEL } from '../lib/baustellenindex.js'
import entdeckenVideo from '../assets/images/studio/bilder/Umbau.mp4'
import entdeckenPoster from '../assets/images/studio/bilder/02_intro_showroom_hell.webp'
import texturNacht from '../assets/images/studio/bilder/08_split_section_showroom_gross.webp'
import texturFinale from '../assets/images/studio/bilder/10_final_cta_studio_banner.webp'
import karteHertzstrasse from '../assets/images/studio/karte-hertzstrasse-osm.webp'

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

/**
 * Einzige Quelle der Wahrheit fuer /entdecken.
 *
 * /entdecken ist das dauerhafte Ziel der Offline-QR-Codes (Aufkleber, Stadtfest,
 * Taschen, Banner). Alles, was sich waehrend der Bauphase aendert, steht hier —
 * nicht in der Seite. Social-URLs bleiben in `site.js`, die Adresse in
 * `company.js`. Keine Duplikate.
 */
export const ENTDECKEN_CONFIG = {
  // Eroeffnungstermin. Bestaetigt. Nicht raten, nicht verschieben.
  openingDate: '2026-12-01T00:00:00+01:00',
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
 * `datei` ist bewusst `null`: Im Repo liegt derzeit KEINE eigene Audiodatei
 * (durchsucht wurden src/ und public/ nach mp3/ogg/wav/m4a/aac/flac/opus —
 * gefunden wurde nur ein Video). Fremdes Audio einzubinden oder einen Stream
 * von Spotify als Quelle zu missbrauchen kommt nicht in Frage, und ein Player
 * ohne Quelle waere ein kaputter Player.
 *
 * Solange `datei` null ist, rendert die Seite die Sound-Steuerung schlicht
 * nicht — die komplette Logik dahinter steht aber bereits und schaltet sich von
 * selbst frei, sobald hier eine echte Datei eingetragen wird:
 *
 *   1. eigene VIDEKO-Aufnahme als MP3 nach
 *      `src/assets/audio/videko-soundtrack.mp3` legen
 *   2. oben importieren:
 *      import soundtrack from '../assets/audio/videko-soundtrack.mp3'
 *   3. hier eintragen: datei: soundtrack
 *
 * Mehr ist nicht zu tun. Lautstaerke, Autoplay-Regel, Ein/Aus-Schalter und die
 * gespeicherte Entscheidung des Besuchers haengen daran.
 */
export const SOUNDTRACK = {
  datei: null,
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
  // Pfad, unter dem die Datei erwartet wird.
  erwarteterPfad: 'src/assets/audio/videko-soundtrack.mp3',
}

/* ------------------------------------------------------------------ *
 * VIDEKO-Baustellenindex
 * ------------------------------------------------------------------ */

/**
 * Bereiche des Baustellenindex.
 *
 * WICHTIG: Die Prozentwerte sind KEIN belegter Baufortschritt. `basePercent`
 * ist der Startwert am `baseDate`, `targetPercent` der Wert, den der Bereich am
 * Eroeffnungstag rechnerisch erreicht — dazwischen rechnet
 * lib/baustellenindex.js eine deterministische, taeglich leicht andere Kurve.
 * Der Ton der Seite macht das ausdruecklich kenntlich; hier wird nichts
 * gemessen, hier wird gerechnet.
 *
 * `text` ist die Hauptaussage des Bereichs und bleibt handgeschrieben — die
 * automatische Statusstufe (STATUS_STUFEN in lib/baustellenindex.js) steht nur
 * als kleine zweite Zeile darunter.
 *
 * Reihenfolge = Anzeigereihenfolge.
 */
export const BAUSTELLEN_BEREICHE = [
  {
    id: 'ausstellung',
    label: 'Ausstellung',
    icon: 'ausstellung',
    basePercent: 14,
    targetPercent: 100,
    baseDate: INDEX_BASIS,
    text: '600 m². Wir hätten auch kleiner anfangen können.',
  },
  {
    id: 'kuechen',
    label: 'Küchen',
    icon: 'kuechen',
    basePercent: 11,
    targetPercent: 100,
    baseDate: INDEX_BASIS,
    text: 'Die wichtigste Kleinigkeit fehlt teilweise noch: Küchen.',
  },
  {
    id: 'bar',
    label: 'Bar',
    icon: 'bar',
    basePercent: 9,
    targetPercent: 100,
    baseDate: INDEX_BASIS,
    text: 'Zapfen können wir gedanklich schon.',
  },
  {
    id: 'empfang',
    label: 'Empfang',
    icon: 'empfang',
    basePercent: 12,
    targetPercent: 100,
    baseDate: INDEX_BASIS,
    text: 'Der erste Eindruck kommt. Irgendwann.',
  },
  {
    id: 'beleuchtung',
    label: 'Beleuchtung',
    icon: 'beleuchtung',
    basePercent: 7,
    targetPercent: 100,
    baseDate: INDEX_BASIS,
    text: 'Licht ist grundsätzlich vorgesehen.',
  },
  {
    id: 'luxusklo',
    label: 'Luxusklo',
    icon: 'luxusklo',
    basePercent: 20,
    targetPercent: 100,
    baseDate: INDEX_BASIS,
    text: 'Vorwände hängen schon. Eine Wand steht. Luxus ist relativ.',
    // Die Klos gehoeren inzwischen zur Geschichte — sie duerfen auffallen.
    akzent: true,
  },
  {
    id: 'mitarbeiterklo-1',
    label: 'Mitarbeiterklo 1',
    icon: 'dusche',
    basePercent: 10,
    targetPercent: 100,
    baseDate: INDEX_BASIS,
    text: 'Duschen und aufs Klo gehen reicht. Mehr war nicht versprochen.',
    akzent: true,
  },
  {
    id: 'mitarbeiterklo-2',
    label: 'Mitarbeiterklo 2',
    icon: 'tropfen',
    basePercent: 5,
    targetPercent: 100,
    baseDate: INDEX_BASIS,
    text: 'Wände stehen. Der Rest hält sich noch bedeckt.',
    akzent: true,
  },
  {
    id: 'aufenthaltsraum',
    label: 'Aufenthaltsraum',
    icon: 'aufenthalt',
    basePercent: 5,
    targetPercent: 95,
    baseDate: INDEX_BASIS,
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
    'Der Baustellenindex ist ein Stimmungsbarometer, kein Bautagebuch: Die Prozente rechnen sich automatisch aus Startwert und Eröffnungstermin. Sie sind kein gemessener Baufortschritt.',
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
export const DRUECK_NICHT = {
  label: 'Drück nicht.',
  sub: 'Es passiert eh nichts … oder?',
  ruhe: 'Der Knopf tut nichts. Versprochen.',
  meldungen: [
    'Zu spät. Jetzt bist du Teil der Baustelle.',
    'Nichts passiert. Genau wie versprochen.',
    'Das war der teuerste Button auf dieser Seite.',
    'Du hast wirklich gedrückt. Stark.',
    'Noch {tage} Tage. Danke für den zusätzlichen Druck.',
    'Immer noch nichts. Aber schön, dass du bleibst.',
  ],
  zaehler: (n) => `Du hast ihn ${n}-mal gedrückt.`,
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

// Spotify ist bewusst nicht bestaetigt (siehe site.js). Solange keine echte URL
// existiert, erscheint die Kachel deaktiviert — statt eine URL zu erfinden.
// Sobald in site.js eine belegte Profiladresse steht, wird die Kachel hier von
// selbst zum Link; an dieser Datei ist dafuer nichts zu aendern.
export const ENTDECKEN_SPOTIFY = socialUrl('spotify')
export const ENTDECKEN_SPOTIFY_KACHEL = {
  key: 'spotify',
  label: ENTDECKEN_SPOTIFY ? 'VIDEKO Soundtrack' : 'Spotify',
  note: 'Der Baustellen-Soundtrack. Kommt, wenn er steht.',
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
