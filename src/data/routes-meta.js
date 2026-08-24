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
 *   service     – { name, description, serviceType } fuer Service-JSON-LD.
 *                 Nur auf Seiten, die genau eine Leistung beschreiben.
 *   faqs        – Fragen aus data/leistungsseiten.js. Sie muessen sichtbar auf
 *                 der Seite stehen, sonst darf FAQPage nicht gesetzt werden.
 *   lastModified – ISO-Datum (YYYY-MM-DD) der letzten ECHTEN Inhaltsänderung
 *                 dieser Seite. Wird als <lastmod> in die sitemap.xml
 *                 geschrieben. NUR setzen, wenn das Datum belegt ist —
 *                 fehlt es, bleibt der Sitemap-Eintrag ohne <lastmod>.
 *                 Ein pauschales Build-Datum wäre ein falsches Signal:
 *                 Google würde bei jedem Deploy alle 64 URLs als geändert
 *                 gemeldet bekommen und dem Feld irgendwann nicht mehr
 *                 glauben. Deshalb wird hier von Hand gepflegt.
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
import {
  ALLES_AUS_EINER_HAND_FAQS, NACH_MASS_FAQS, ARBEITSPLATTEN_FAQS, MONTAGE_FAQS,
} from './leistungsseiten.js'

import ogNachMass from '../assets/images/inspiration/07_kueche_mit_insel.webp'
import ogArbeitsplatten from '../assets/images/inspiration/06_materialien_und_details.webp'
import ogMontage from '../assets/images/leistungen/ls-install.webp'

export const HOME_META = {
  path: '/',
  lastModified: '2026-08-24',
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
    lastModified: '2026-08-24',
    title: 'Leistungen im Überblick: Planung, Montage & Service | VIDEKO Küchen',
    description:
      'Alle Leistungen von VIDEKO auf einen Blick: Beratung, Küchenplanung, Küchen nach Maß, Arbeitsplatten, Montage und Koordination – mit dem Weg zur passenden Seite.',
    crumb: 'Leistungen',
    ogImage: ogLeistungen,
  },
  {
    path: '/alles-aus-einer-hand',
    lastModified: '2026-08-24',
    title: 'Nicht nur Küche. Der ganze Raum. | VIDEKO Küchen',
    description:
      'Küche, Elektro, Boden, Wand, Spanndecke, Licht und Montage – über VIDEKO koordiniert, mit passenden Fachpartnern geplant und abgestimmt.',
    crumb: 'Alles aus einer Hand',
    ogImage: ogAllesAusEinerHand,
    service: {
      name: 'Küchenumbau mit Koordination aller Gewerke',
      serviceType: 'Küchenumbau',
      description:
        'Küche, Elektro, Boden, Wand, Decke und Licht werden gemeinsam geplant. VIDEKO koordiniert die Fachpartner und den Terminplan.',
    },
    faqs: ALLES_AUS_EINER_HAND_FAQS,
  },
  {
    path: '/studio',
    lastModified: '2026-08-24',
    title: 'Küchenstudio Würzburg – Hertzstraße 4 | VIDEKO Küchen',
    description:
      'Das VIDEKO Küchenstudio in der Hertzstraße 4 in Würzburg: Materialien fühlen, Fronten vergleichen, Planung verstehen – nach Terminvereinbarung, ohne Verkaufsdruck.',
    crumb: 'Studio',
    ogImage: ogStudio,
  },
  {
    path: '/inspiration',
    lastModified: '2026-08-24',
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
    lastModified: '2026-08-24',
    title: 'Küchenplanung Würzburg: Ablauf, Fehler & Budget | VIDEKO Küchen',
    description:
      'Küchenplanung aus Würzburg: wie eine Küche entsteht, welche Planungsfehler typisch sind und wie ein realistisches Budget aussieht – von der Idee bis zur Abnahme.',
    crumb: 'Planung',
    ogImage: ogPlanung,
    service: {
      name: 'Küchenplanung',
      serviceType: 'Küchenplanung',
      description:
        'Von Erstgespräch, Bedarf und Budget über die 3D-Planung und das Laseraufmaß bis zu Montage und gemeinsamer Endabnahme.',
    },
  },
  {
    path: '/kuechen-nach-mass',
    lastModified: '2026-08-24',
    title: 'Küchen nach Maß in Würzburg – Einbauküchen & Designküchen | VIDEKO',
    description:
      'Einbauküche, Designküche oder Küche nach Maß: Wie VIDEKO in Würzburg Grundriss, Maße, Materialien und Stil zu einer Küche zusammenführt, die genau in deinen Raum passt.',
    crumb: 'Küchen nach Maß',
    ogImage: ogNachMass,
    service: {
      name: 'Küchen nach Maß',
      serviceType: 'Küchenplanung nach Maß',
      description:
        'Einbauküchen, die für den vorhandenen Raum geplant werden: Grundriss, Höhen, Arbeitswege, Stauraum und Geräte – mit millimetergenauem Laseraufmaß.',
    },
    faqs: NACH_MASS_FAQS,
  },
  {
    path: '/arbeitsplatten',
    lastModified: '2026-08-24',
    title: 'Arbeitsplatten für die Küche: Holz, Stein, Keramik & Compact | VIDEKO Küchen',
    description:
      'Welche Arbeitsplatte hält deinem Alltag stand? Massivholz, Naturstein, Keramik und Compact im ehrlichen Vergleich – mit Aufmaß, Kante und Ausschnitten über VIDEKO.',
    crumb: 'Arbeitsplatten',
    ogImage: ogArbeitsplatten,
    service: {
      name: 'Arbeitsplatten für die Küche',
      serviceType: 'Arbeitsplatten',
      description:
        'Beratung zu Massivholz, Naturstein, Keramik und Compact sowie Material, Kante und Ausschnitte inklusive Aufmaß beim Naturstein- oder Keramikpartner.',
    },
    faqs: ARBEITSPLATTEN_FAQS,
  },
  {
    path: '/kuechenmontage-wuerzburg',
    lastModified: '2026-08-24',
    title: 'Küchenmontage Würzburg: Aufmaß, Aufbau & Abnahme | VIDEKO Küchen',
    description:
      'Küchenmontage in Würzburg und Umgebung: Laseraufmaß, feste Termine, sauberer Aufbau, Anschluss und gemeinsame Endabnahme – koordiniert über einen Ansprechpartner.',
    crumb: 'Küchenmontage',
    ogImage: ogMontage,
    service: {
      name: 'Küchenmontage',
      serviceType: 'Küchenmontage',
      description:
        'Laseraufmaß, fester Terminplan, Aufbau und Anschluss der Küche sowie gemeinsame Endabnahme – in Würzburg und der Region.',
    },
    faqs: MONTAGE_FAQS,
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
    // Die Seite zeigt derzeit sechs Rollenkarten mit dem Namen „Platzhalter"
    // (src/pages/Team.jsx) und rund 430 Zeichen Text. Solange dort keine echten
    // Personen stehen, gehört sie nicht in den Index — die Rollen selbst sind
    // auf /ueber-uns bereits beschrieben. Die URL bleibt erreichbar; sobald das
    // Team eingepflegt ist, fallen die beiden Zeilen ersatzlos weg.
    noindex: true,
    inSitemap: false,
  },
  {
    path: '/karriere',
    lastModified: '2026-08-24',
    title: 'Karriere bei VIDEKO Küchen in Würzburg',
    description:
      'Lust auf Küchen, aber ohne Möbelhaus-Zirkus? Offene Rollen, Arbeitsweise und eine Bewerbung, die in drei Minuten geschrieben ist.',
    crumb: 'Karriere',
    ogImage: ogKarriere,
  },
  {
    path: '/beratung',
    lastModified: '2026-08-24',
    title: 'Küchenberatung Würzburg – persönlich & unverbindlich | VIDEKO Küchen',
    description:
      'Küchenberatung in Würzburg: Erzähl uns von deinem Raum und deinen Vorstellungen. Wir melden uns und sortieren gemeinsam die nächsten Schritte.',
    crumb: 'Beratung',
    ogImage: ogLeistungen,
    service: {
      name: 'Küchenberatung',
      serviceType: 'Küchenberatung',
      description:
        'Persönliches, unverbindliches Erstgespräch zu Raum, Alltag, Stil und Budget – nach Terminvereinbarung im Studio in Würzburg oder telefonisch.',
    },
  },
  {
    path: '/merch',
    lastModified: '2026-08-24',
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
    // Bewusst außerhalb der Suchmaschinen-Architektur: Die Seite ist eine reine
    // WebGL-Szene und liefert deshalb als einzige Route keinen vorgerenderten
    // Textkörper aus (OHNE_KOERPER in scripts/prerender.mjs). Eine indexierbare
    // URL ganz ohne Inhalt wäre ein Thin-Content-Signal. Für Besucher bleibt sie
    // voll erreichbar und ist aus /inspiration verlinkt.
    noindex: true,
    inSitemap: false,
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
  // /showroom und /studio bedienten dieselbe Suchintention: den Ort in Würzburg
  // ansehen und einen Termin machen. /studio war die inhaltlich stärkere Seite;
  // der Standortteil des Showrooms steht jetzt dort.
  { from: '/showroom', to: '/studio' },
]
