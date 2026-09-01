/**
 * Werte der Entdecken-Seite (/entdecken).
 *
 * WOZU
 * ----
 * /entdecken ist das Ziel der gedruckten QR-Codes. Die Codes zeigen NICHT auf
 * diese Route, sondern auf go.videko-kuechen.de/<slug>; dort wird der Scan
 * gezaehlt und danach hierher weitergeleitet. Diese Seite braucht davon nichts
 * zu wissen — sie muss nur normal funktionieren, auch mit angehaengten
 * UTM-Parametern. Es gibt hier deshalb bewusst keine Tracking-Logik.
 *
 * WAS HIER STEHT
 * --------------
 * Nur Werte, die sich ohne Code-Aenderung verschieben koennen: Eroeffnung und
 * Video. Adresse kommt aus company.js, Social-URLs aus site.js — beides bleibt
 * die einzige Quelle, hier wird nichts dupliziert.
 */
import { BRAND } from './company.js'
import { SOCIAL_PROFILES, socialUrl } from './site.js'

import entdeckenVideo from '../assets/images/studio/bilder/Umbau.mp4'
import entdeckenPoster from '../assets/images/studio/bilder/02_intro_showroom_hell.webp'

export const ENTDECKEN_CONFIG = {
  /**
   * Eroeffnungstermin als ISO-String MIT Zeitzone.
   *
   * 01.12.2026, Europe/Berlin — im Dezember gilt MEZ, also +01:00. Der Offset
   * gehoert zwingend dazu: ohne ihn wuerde der Browser die Angabe als UTC
   * lesen und in Deutschland eine Stunde zu spaet zaehlen.
   *
   * Dieser Wert ist die einzige Quelle fuer Zaehlung UND Klartext-Datum auf
   * /entdecken; das ausgeschriebene Datum wird daraus formatiert, nicht
   * daneben gepflegt. `null` bleibt als ehrlicher Notfall-Zustand moeglich
   * (siehe Entdecken.jsx), ist aber nicht mehr der Normalfall.
   */
  openingDate: '2026-12-01T00:00:00+01:00',

  /**
   * Video im Hero. Umbau.mp4 ist das einzige Motiv im Projekt, das den
   * Studio-Aufbau zeigt — und mit 1,8 MB / 11 s das leichteste. Es ist 16:9
   * (1280x720). Der Rahmen auf /entdecken bleibt deshalb bewusst breit
   * (4:3 mobil, 16:9 ab Tablet): ein hochformatiger Ausschnitt wuerde vom
   * vorhandenen Bild rund die Haelfte wegschneiden. Sobald ein echtes
   * 9:16-Motiv existiert: hier tauschen und den Rahmen anpassen.
   */
  video: {
    src: entdeckenVideo,
    poster: entdeckenPoster,
    label: 'Studio im Aufbau',
  },
}

/**
 * Reihenfolge und Kurztext der Social-Kacheln. Die URL kommt aus site.js —
 * Plattformen ohne belegte Adresse werden nicht gerendert, damit keine toten
 * Kacheln entstehen. Spotify hat einen eigenen Block und fehlt hier deshalb.
 */
const SOCIAL_TEXTE = {
  instagram: 'Baustelle, Küchen, Alltag. Der direkteste Draht zu uns.',
  tiktok: 'Kurz, schnell, ungefiltert.',
  youtube: 'Längere Einblicke in Umbau und Planung.',
  facebook: 'Für alle, die dort lesen.',
  linkedin: 'Die Firma hinter der Baustelle.',
}

const SOCIAL_REIHENFOLGE = ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin']

/** Alle Plattformen inkl. der unbestaetigten — fuer Anzeige-Entscheidungen. */
export const ENTDECKEN_SOCIALS = SOCIAL_REIHENFOLGE.map((key) => {
  const profil = SOCIAL_PROFILES.find((p) => p.key === key)
  return {
    key,
    label: profil?.label || key,
    url: profil?.url || null,
    note: SOCIAL_TEXTE[key] || '',
  }
})

/** Spotify separat: eigener Block, aber nur mit belegter Profil-URL. */
export const ENTDECKEN_SPOTIFY = socialUrl('spotify')

/**
 * Kartenlink ohne API und ohne Key — identisch zu dem, was der Footer schon
 * benutzt. Die Adresse selbst kommt aus company.js, nicht aus einer Kopie.
 */
export const STUDIO_ADRESSE = `${BRAND.studio.street}, ${BRAND.studio.postalCode} ${BRAND.studio.city}`
export const STUDIO_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  STUDIO_ADRESSE
)}`
