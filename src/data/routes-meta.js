/**
 * Metadaten aller statischen Routen — eine Quelle für drei Verbraucher:
 *
 *  1. `RouteSeo` setzt daraus zur Laufzeit Title, Description, Canonical, OG
 *     und Twitter Card.
 *  2. `scripts/prerender.mjs` schreibt dieselben Werte zur Build-Zeit fest ins
 *     ausgelieferte HTML, damit Crawler ohne JavaScript sie sehen.
 *  3. Derselbe Lauf schreibt daraus die sitemap.xml.
 *
 * Die Texte beschreiben ausschließlich, was auf der jeweiligen Seite auch
 * wirklich steht. Keine Leistungsversprechen, die die Seite nicht einlöst.
 *
 * Felder:
 *   path        – Pfad ohne Trailing Slash (Startseite: '/')
 *   title       – vollständiger <title>
 *   description – Meta-Description
 *   crumb       – Name in der Breadcrumb (fehlt = keine Breadcrumb)
 *   ogImage     – Vorschaubild fuer Social-Links. Fehlt es, greift das
 *                 Marken-Standardbild aus site.js. Gesetzt wird das Motiv, das
 *                 auch oben auf der Seite steht — nichts anderes.
 *   noindex     – Utility-Seiten, die nicht in den Index gehören
 *   inSitemap   – false für noindex-/Alias-Routen
 *   preload     – LCP-Bild(er) der Seite; prerender.mjs schreibt daraus
 *                 <link rel="preload" as="image">. Nur setzen, wo das Motiv
 *                 sicher above the fold und das LCP-Element ist — ein falscher
 *                 Preload kostet Bandbreite, statt sie zu sparen.
 */
import heroDesktop from '../assets/images/shared/hero-videko-final-16x9.webp'
import heroMobile from '../assets/images/home/Mobile.webp'
import inspHero from '../assets/images/inspiration/insp-hero-dark.webp'

/* Vorschaubilder = die jeweiligen Seiten-Heros. Bewusst dieselben Dateien wie
   in den Seitenkomponenten: ein Link-Preview soll zeigen, was der Besucher
   danach tatsaechlich sieht. */
import ogLeistungen from '../assets/images/leistungen/ls-hero.webp'
import ogAllesAusEinerHand from '../assets/images/inspiration/09_premium_architektur_kueche.webp'
import ogStudio from '../assets/images/studio/bilder/01_hero_studio_showroom.webp'
import ogStylefinder from '../assets/images/stylefinder-assets/01_hero_dark_premium_kitchen.webp'
import ogPlanung from '../assets/images/shared/hero-kitchen-arch.webp'
import ogVorherNachher from '../assets/images/vorher-nachher/02_hero_dark_kitchen_banner.webp'
import ogJournal from '../assets/images/inspiration/01_hero_atmosphaerische_kueche.webp'
import ogUeberUns from '../assets/images/leistungen/ls-feature.webp'
import ogTeam from '../assets/images/showroom/journey-07-verstehen.webp'
import ogKarriere from '../assets/images/karriere/01_hero_team_beratung.webp'

export const HOME_META = {
  path: '/',
  title: 'VIDEKO Küchen | Küchenstudio Würzburg',
  description:
    'VIDEKO Küchen – dein Küchenstudio in Würzburg. Küchenplanung, ehrliche Beratung und maßgeschneiderte Küchen für deinen Alltag.',
  // Mobil zeigt der Hero ein 9:16-Foto, ab 721 px ein Video mit Poster. Die
  // media-Bedingungen spiegeln exakt den Breakpoint aus Hero.jsx, damit nie
  // beide Motive geladen werden. Das Poster hat kein srcset (es haengt am
  // <video poster>), deshalb responsive: false.
  preload: [
    { src: heroMobile, sizes: '100vw', media: '(max-width: 720px)' },
    { src: heroDesktop, media: '(min-width: 721px)', responsive: false },
  ],
}

export const STATIC_ROUTES = [
  HOME_META,
  {
    path: '/leistungen',
    title: 'Leistungen: Küchenplanung, Montage & Service | VIDEKO Küchen',
    description:
      'Von der Beratung über die Planung bis zu Aufmaß, Montage und Abnahme: So begleitet VIDEKO dein Küchenprojekt Schritt für Schritt.',
    crumb: 'Leistungen',
    ogImage: ogLeistungen,
  },
  {
    path: '/alles-aus-einer-hand',
    title: 'Nicht nur Küche. Der ganze Raum. | VIDEKO Küchen',
    description:
      'Küche, Elektro, Boden, Wand, Spanndecke, Licht und Montage – über VIDEKO koordiniert, mit passenden Fachpartnern geplant und abgestimmt.',
    crumb: 'Alles aus einer Hand',
    ogImage: ogAllesAusEinerHand,
  },
  {
    path: '/studio',
    title: 'Küchenstudio Würzburg – Küchen erleben | VIDEKO Küchen',
    description:
      'Materialien fühlen, Fronten vergleichen, Planung verstehen: Was dich bei einem Termin im VIDEKO Studio in Würzburg erwartet.',
    crumb: 'Studio',
    ogImage: ogStudio,
  },
  {
    path: '/showroom',
    title: 'Showroom & Standort Würzburg | VIDEKO Küchen',
    description:
      'Der VIDEKO Showroom in der Hertzstraße 4 in Würzburg: Anfahrt, Umgebung und was du vor Ort sehen kannst.',
    crumb: 'Showroom',
    ogImage: ogStudio,
  },
  {
    path: '/inspiration',
    title: 'Küchen-Inspiration: Stile, Materialien & Ideen | VIDEKO Küchen',
    description:
      'Stilwelten, Materialien und Details für deine neue Küche – zum Durchsehen, Vergleichen und Ideensammeln.',
    crumb: 'Inspiration',
    ogImage: inspHero,
    preload: [{ src: inspHero, sizes: '100vw' }],
  },
  {
    path: '/stylefinder',
    title: 'Stylefinder: Welcher Küchenstil passt zu dir? | VIDEKO Küchen',
    description:
      'In wenigen Minuten zu einer ersten Einschätzung: Der VIDEKO Stylefinder zeigt dir, welcher Küchenstil und welches Budget zu dir passen.',
    crumb: 'Stylefinder',
    ogImage: ogStylefinder,
  },
  {
    path: '/planung',
    title: 'Küchenplanung: Ablauf, Fehler & Budget | VIDEKO Küchen',
    description:
      'Wie eine Küche entsteht, welche Planungsfehler typisch sind und wie ein realistisches Budget aussieht – von der Idee bis zur Abnahme.',
    crumb: 'Planung',
    ogImage: ogPlanung,
  },
  {
    path: '/vorher-nachher',
    title: 'Vorher / Nachher: Küchen-Verwandlungen | VIDEKO Küchen',
    description:
      'Aus alt wird Lieblingsraum: Vergleiche im Schieberegler zeigen, was sich bei Raumgefühl, Licht, Stauraum und Abläufen verändert.',
    crumb: 'Vorher / Nachher',
    ogImage: ogVorherNachher,
  },
  {
    path: '/journal',
    title: 'Journal: Wissen rund um die Küche | VIDEKO Küchen',
    description:
      'Praktische Tipps und ehrliche Planungshilfe zu Licht, Materialien, Stauraum, Geräten und Pflege – ohne Verkaufstheater.',
    crumb: 'Journal',
    ogImage: ogJournal,
  },
  {
    path: '/ueber-uns',
    title: 'Über uns: Die Menschen hinter VIDEKO | VIDEKO Küchen',
    description:
      'Wer hinter VIDEKO steht, wofür wir stehen und wie wir arbeiten – persönlich, ehrlich und ohne Möbelhaus-Zirkus.',
    crumb: 'Über uns',
    ogImage: ogUeberUns,
  },
  {
    path: '/team',
    title: 'Team: Menschen, die Küchen ernst nehmen | VIDEKO Küchen',
    description:
      'Planung, Beratung, Umsetzung: die Rollen im VIDEKO Team und wie wir an deinem Projekt zusammenarbeiten.',
    crumb: 'Team',
    ogImage: ogTeam,
  },
  {
    path: '/karriere',
    title: 'Karriere bei VIDEKO Küchen in Würzburg',
    description:
      'Lust auf Küchen, aber ohne Möbelhaus-Zirkus? Offene Rollen, Arbeitsweise und eine Bewerbung, die in drei Minuten geschrieben ist.',
    crumb: 'Karriere',
    ogImage: ogKarriere,
  },
  {
    path: '/beratung',
    title: 'Beratung anfragen – persönlich & unverbindlich | VIDEKO Küchen',
    description:
      'Erzähl uns von deinem Raum und deinen Vorstellungen. Wir melden uns und sortieren gemeinsam die nächsten Schritte.',
    crumb: 'Beratung',
    ogImage: ogLeistungen,
  },
  {
    path: '/merch',
    title: 'VIDEKO Merch – Kollektion zum Anziehen',
    description:
      'T-Shirts, Polos, Hoodies und mehr aus der VIDEKO Kollektion – schlicht, hochwertig und ohne Logo-Geschrei.',
    crumb: 'Merch',
  },
  {
    path: '/experience',
    title: 'VIDEKO Experience – Küche in 3D erleben',
    description:
      'Die interaktive 3D-Ansicht von VIDEKO: Küchenwelten drehen, erkunden und Materialien in Bewegung sehen.',
    crumb: 'Experience',
  },

  /* --- Rechtliches: indexierbar, aber ohne Breadcrumb-Kette --- */
  {
    path: '/impressum',
    title: 'Impressum | VIDEKO Küchen',
    description: 'Anbieterkennzeichnung nach § 5 DDG für videko-kuechen.de.',
    crumb: 'Impressum',
  },
  {
    path: '/datenschutz',
    title: 'Datenschutzerklärung | VIDEKO Küchen',
    description: 'Wie wir personenbezogene Daten auf videko-kuechen.de verarbeiten – Zwecke, Rechtsgrundlagen und deine Rechte.',
    crumb: 'Datenschutz',
  },
  {
    path: '/agb',
    title: 'Allgemeine Geschäftsbedingungen | VIDEKO Küchen',
    description: 'Die Allgemeinen Geschäftsbedingungen für Bestellungen über videko-kuechen.de.',
    crumb: 'AGB',
  },
  {
    path: '/versand-lieferung',
    title: 'Versand & Lieferung | VIDEKO Küchen',
    description: 'Versandarten, Lieferzeiten und Versandkosten für Bestellungen aus dem VIDEKO Shop.',
    crumb: 'Versand & Lieferung',
  },
  {
    path: '/rueckgabe-widerruf',
    title: 'Rückgabe & Widerruf | VIDEKO Küchen',
    description: 'Widerrufsrecht, Rücksendung und Erstattung für Bestellungen aus dem VIDEKO Shop.',
    crumb: 'Rückgabe & Widerruf',
  },

  /* --- Utility: nie in Index oder Sitemap --- */
  {
    path: '/vormerkung-bestaetigen',
    title: 'Vormerkung bestätigen | VIDEKO Küchen',
    description: 'Bestätigung deiner Produktvormerkung.',
    noindex: true,
    inSitemap: false,
  },
]

/** Schneller Zugriff auf die Metadaten eines Pfads. */
export const ROUTE_META = new Map(STATIC_ROUTES.map((r) => [r.path, r]))

/**
 * Alte Pfade, die auf ihr Ziel zeigen. Werden als echte 308-Weiterleitung in
 * vercel.json ausgeliefert; die React-Routen bleiben als Fallback bestehen.
 */
export const REDIRECTS = [
  { from: '/materialien', to: '/inspiration' },
  { from: '/kontakt', to: '/beratung' },
  { from: '/ueber-videko', to: '/ueber-uns' },
  { from: '/kuechenwelten', to: '/stylefinder' },
]
