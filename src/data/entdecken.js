import { BRAND } from './company.js'
import { SOCIAL_PROFILES, socialUrl } from './site.js'
import entdeckenVideo from '../assets/images/studio/bilder/Umbau.mp4'
import entdeckenPoster from '../assets/images/studio/bilder/02_intro_showroom_hell.webp'
import texturNacht from '../assets/images/studio/bilder/08_split_section_showroom_gross.webp'
import texturFinale from '../assets/images/studio/bilder/10_final_cta_studio_banner.webp'

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

/**
 * Baufortschritt.
 *
 * WICHTIG — bewusst keine Prozentzahlen:
 * Fuer keinen dieser Bereiche liegt ein bestaetigter Fortschrittswert vor.
 * Erfundene Prozente waeren eine Behauptung gegenueber jedem, der den QR-Code
 * scannt. Deshalb steht ueberall `percent: null` und ein ehrlicher Status.
 *
 * Sobald echte Werte feststehen, hier eintragen:
 *   percent: 60           -> Ring fuellt sich anteilig, Zahl erscheint im Ring
 *   percent: null         -> neutraler Status-Ring, keine Zahl
 *   status: 'Fast fertig' -> freier Text, erscheint als Pille unter dem Titel
 *
 * `note` ist Ton, keine Aussage ueber den Bauzustand.
 */
export const ENTDECKEN_FORTSCHRITT = [
  {
    key: 'ausstellung',
    label: 'Ausstellung',
    icon: 'ausstellung',
    percent: null,
    status: 'Im Aufbau',
    note: 'Hier stehen bald Küchen, die du anfassen darfst.',
  },
  {
    key: 'kuechen',
    label: 'Küchen',
    icon: 'kuechen',
    percent: null,
    status: 'Im Aufbau',
    note: 'Hier wird’s heiß. Demnächst.',
  },
  {
    key: 'bar',
    label: 'Bar',
    icon: 'bar',
    percent: null,
    status: 'Im Aufbau',
    note: 'Kaffee fließt noch nicht. Ideen schon.',
  },
  {
    key: 'empfang',
    label: 'Empfang',
    icon: 'empfang',
    percent: null,
    status: 'Im Aufbau',
    note: 'Der erste Eindruck braucht noch einen Moment.',
  },
  {
    key: 'beleuchtung',
    label: 'Beleuchtung',
    icon: 'beleuchtung',
    percent: null,
    status: 'Im Aufbau',
    note: 'Wir bringen Licht ins Dunkel.',
  },
  {
    key: 'toiletten',
    label: 'Toiletten',
    icon: 'toiletten',
    percent: null,
    status: 'Im Aufbau',
    note: 'Fast fertig. Fast. Wie immer.',
  },
]

export const FORTSCHRITT_HINWEIS = 'Ändert sich öfter als uns lieb ist.'

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
export const ENTDECKEN_SPOTIFY = socialUrl('spotify')
export const ENTDECKEN_SPOTIFY_KACHEL = {
  key: 'spotify',
  label: 'Spotify',
  note: 'Der Baustellen-Soundtrack. Kommt, wenn er steht.',
  badge: 'Bald',
  cta: 'Anhören',
  bild: bildSpotify,
}

export const STUDIO_ADRESSE = `${BRAND.studio.street}, ${BRAND.studio.postalCode} ${BRAND.studio.city}`
export const STUDIO_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STUDIO_ADRESSE)}`
