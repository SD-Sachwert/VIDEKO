/**
 * Inhalte der beiden gewerblichen Leistungsseiten
 *   /kuechen-fuer-bautraeger
 *   /kuechen-fuer-immobilieninvestoren
 *
 * Wie in leistungsseiten.js: Die FAQs werden von der Seite angezeigt UND von
 * routes-meta.js als FAQPage ausgezeichnet — es sind garantiert dieselben Sätze.
 *
 * INHALTLICHE LEITPLANKE (Stand 26.11.2026, vom Betreiber bestätigt):
 * VIDEKO bietet Küchen für Bauträger und Immobilieninvestoren an. Bestätigt
 * sind Beratung, Küchenplanung inkl. 3D-Planung, Aufmaß, Arbeitsplatten und
 * Montage durch das eigene Team; angrenzende Gewerke werden mit Fachpartnern
 * abgestimmt. Lieferung deutschlandweit ist bestätigt, wenn der Kunde die
 * Lieferkosten trägt; Planung, Aufmaß und Montage bleiben regional (Würzburg
 * und Region), Montage außerhalb nur nach gesonderter Absprache – also nie
 * „bundesweite Montage“ schreiben. NICHT bestätigt und deshalb hier nicht versprochen: Projekt-
 * größen oder Mindestmengen, Referenzen, Käuferbemusterung,
 * Sonderwunschabwicklung, Lieferzeiten, Preise pro Einheit, Rahmenverträge.
 * Wer das ergänzen will, braucht vorher die Bestätigung des Betreibers
 * (siehe docs/ENTWURF-LEISTUNG-INVESTOREN-BAUTRAEGER.md, Pflichtfragen).
 */
import { BRAND } from './company.js'

const A = BRAND.assortment
const list = (xs) => xs.slice(0, -1).join(', ') + ' und ' + xs[xs.length - 1]

/** Was VIDEKO übernimmt — für beide Seiten identisch, weil bestätigt. */
export const PROJEKT_LEISTUNGEN = [
  { title: 'Beratung', text: 'Ein Gespräch über Grundrisse, Zielgruppe und Ausstattungsniveau, bevor eine Linie festgelegt wird.' },
  { title: 'Küchenplanung', text: 'Planung je Grundriss, auf Wunsch in 3D, abgestimmt auf die vorhandenen oder geplanten Anschlüsse.' },
  { title: 'Aufmaß', text: 'Millimetergenaues Aufmaß vor Ort, bevor bestellt wird. Im Rohbau dann, wenn die Wände stehen, im Bestand in jeder Wohnung einzeln.' },
  { title: 'Arbeitsplatten', text: 'Material, Kante und Ausschnitte, aufgemessen und gefertigt über unseren Naturstein- oder Keramikpartner.' },
  { title: 'Montage', text: 'Aufbau und Anschluss durch unser eigenes Team in Würzburg und der Region, mit Abnahme der fertigen Küche. Lieferung auch deutschlandweit, Lieferkosten trägt der Auftraggeber.' },
  { title: 'Angrenzende Gewerke', text: 'Elektro, Wasser, Boden oder Trockenbau stimmen wir mit Fachpartnern ab, damit die Küche nicht auf eine fehlende Leitung wartet.' },
]

export const BAUTRAEGER = {
  path: '/kuechen-fuer-bautraeger',
  kicker: 'Für Bauträger',
  title: 'Küchen für Bauträger',
  titleGrad: 'in Würzburg und der Region.',
  lead: 'Für Mehrfamilienhäuser und Neubauprojekte planen und montieren wir Küchen, die zum Installationsplan und zum Bauablauf passen. Umfang, Ausstattung und Termine klären wir im Projektgespräch, nicht auf dieser Seite.',
  klaerenTitle: 'Was wir am Anfang wissen müssen.',
  klaerenLead: 'Bevor wir etwas zusagen, schauen wir uns das Projekt an. Diese Punkte entscheiden, ob und wie wir es umsetzen.',
  klaeren: [
    { title: 'Grundrisse und Wohnungstypen', text: 'Wie viele unterschiedliche Küchengrundrisse gibt es? Je weniger Typen, desto einheitlicher Planung und Montage.' },
    { title: 'Installationsplan', text: 'Wo liegen Wasser, Abwasser und Starkstrom? Ein Spülenanschluss, der 40 cm neben der geplanten Spüle endet, ist im Rohbau eine Kleinigkeit. Nach dem Estrich ist er eine Baustelle.' },
    { title: 'Abluft oder Umluft', text: 'In dichten Neubauten mit Lüftungsanlage ist eine Abluftleitung nach außen oft nicht vorgesehen. Dann muss früh feststehen, dass mit Umluft geplant wird.' },
    { title: 'Zeitfenster im Bauablauf', text: 'Wann sind Böden, Fliesenspiegel und Malerarbeiten fertig? Die Küche kommt erst danach, und das Aufmaß erst, wenn die Wände final stehen.' },
    { title: 'Wer entscheidet', text: 'Plant der Bauträger eine einheitliche Küche für alle Einheiten, oder sollen Käufer mitreden? Das ändert den Ablauf grundlegend.' },
  ],
  wissenTitle: 'Warum die Küche früher in den Plan gehört, als man denkt.',
  wissen: [
    'Die Küche ist im Wohnungsbau oft das letzte Gewerk, aber die Anschlüsse dafür entstehen im Rohbau. Wer die Küchenplanung erst nach dem Estrich anfängt, plant um die Leitungen herum statt umgekehrt.',
    'Wir planen deshalb gern auf Basis des Installationsplans, solange Änderungen noch günstig sind. Was beim Neubau sonst früh entschieden werden muss, steht im Ratgeber zur Küche im Neubau.',
  ],
  wissenLink: { to: '/journal/kueche-im-neubau-planen', label: 'Ratgeber: Küche im Neubau planen' },
  faqs: [
    {
      q: 'Ab wie vielen Wohnungen arbeitet VIDEKO mit Bauträgern?',
      a: 'Eine feste Untergrenze nennen wir nicht. Ob und wie wir ein Projekt umsetzen, klären wir anhand von Plänen, Wohnungstypen und Zeitrahmen im Gespräch.',
    },
    {
      q: 'Was übernimmt VIDEKO in einem Bauträgerprojekt?',
      a: 'Beratung, Küchenplanung je Grundriss, Aufmaß, Arbeitsplatten und die Montage durch unser eigenes Team. Angrenzende Gewerke wie Elektro oder Wasser stimmen wir mit Fachpartnern ab. Weitere Leistungen besprechen wir projektbezogen.',
    },
    {
      q: 'Wie lang sind die Lieferzeiten?',
      a: 'Das hängt von Hersteller, Programm und Menge ab. Wir nennen Liefertermine erst, wenn sie vom Hersteller für das konkrete Projekt bestätigt sind, und nicht vorher pauschal.',
    },
    {
      q: 'Welche Küchenmarken bietet VIDEKO an?',
      a: `Küchen von ${list(A.kitchens)}, Geräte von ${list(A.appliances)}, Spülen und Armaturen von ${list(A.sinksAndTaps)}. Welche Linie zu einem Projekt passt, hängt von Zielgruppe und Budget ab.`,
    },
    {
      q: 'Liefert VIDEKO auch außerhalb der Region?',
      a: 'Ja. Planung, Aufmaß und Montage übernehmen wir in Würzburg und der Region. Küchen liefern wir auf Wunsch auch deutschlandweit; die Lieferkosten trägt der Auftraggeber und stehen vorab im Angebot. Eine Montage außerhalb der Region sagen wir nicht pauschal zu, sondern nur nach gesonderter Absprache für das jeweilige Projekt.',
    },
    {
      q: 'Kann man die Küchen vorher ansehen?',
      a: `Unsere Ausstellung in der Hertzstraße 4 in Würzburg soll am ${BRAND.plannedOpeningLabel} öffnen. Bis dahin beraten wir nach Terminvereinbarung.`,
    },
  ],
}

export const INVESTOREN = {
  path: '/kuechen-fuer-immobilieninvestoren',
  kicker: 'Für Immobilieninvestoren',
  title: 'Küchen für Immobilieninvestoren',
  titleGrad: 'Vermietbar, robust, sauber montiert.',
  lead: 'Für Kapitalanlagen, Mietwohnungen und Sanierungen im Bestand planen und montieren wir Küchen, die Mieterwechsel aushalten. Umfang und Termine stimmen wir mit Ihnen pro Objekt ab.',
  klaerenTitle: 'Was eine Mietküche anders macht.',
  klaerenLead: 'In der eigenen Küche zählt der Geschmack. In der vermieteten Küche zählt, was sie nach zehn Jahren und drei Mieterwechseln noch kann.',
  klaeren: [
    { title: 'Oberflächen, die man nicht pflegen muss', text: 'Matte Lackfronten sehen schön aus, verzeihen aber wenig. Melamin- und Schichtstofffronten sind für Mietwohnungen meist die ehrlichere Wahl.' },
    { title: 'Arbeitsplatte mit Reserve', text: 'Eine Arbeitsplatte, die Hitze, Schnitte und Feuchtigkeit an der Spüle verträgt, spart später den Tausch. Die Optionen vergleichen wir offen.' },
    { title: 'Gerätemaße nach Standard', text: 'Ein Backofen in der 60-cm-Nische lässt sich in zehn Jahren einfach ersetzen. Sondermaße machen den späteren Tausch teurer.' },
    { title: 'Aufmaß in jeder Wohnung', text: 'Im Bestand ist keine Wohnung wie die andere, auch wenn der Grundriss gleich aussieht. Wir messen jede Einheit einzeln auf.' },
    { title: 'Termin zum Leerstand', text: 'Montage und angrenzende Arbeiten stimmen wir auf das Zeitfenster zwischen Auszug und Neuvermietung ab.' },
  ],
  wissenTitle: 'Gute Mietküchen sind langweilig. Im besten Sinn.',
  wissen: [
    'Was in einer Mietwohnung zählt, merkt man erst beim zweiten Mieterwechsel: Kanten, die nicht aufquellen, Scharniere, die man nachstellen kann, Griffe, die man nachbestellen kann. Das planen wir mit ein, bevor es zur Reparatur wird.',
    'Welche Fronten und Arbeitsplatten im Alltag wenig Arbeit machen, steht im Ratgeber zur pflegeleichten Küche.',
  ],
  wissenLink: { to: '/journal/pflegeleichte-kueche', label: 'Ratgeber: pflegeleichte Küche' },
  faqs: [
    {
      q: 'Plant VIDEKO auch Küchen für einzelne Mietwohnungen?',
      a: 'Ja. Ob eine einzelne Kapitalanlage oder mehrere Wohnungen im selben Objekt: Wir planen, messen auf und montieren. Den Umfang klären wir im Gespräch.',
    },
    {
      q: 'Was übernimmt VIDEKO bei einer Sanierung im Bestand?',
      a: 'Beratung, Planung, Aufmaß, Arbeitsplatten und die Montage durch unser eigenes Team. Angrenzende Arbeiten wie Elektro, Wasser oder Boden stimmen wir mit Fachpartnern ab.',
    },
    {
      q: 'Welche Ausstattung empfiehlt VIDEKO für Mietküchen?',
      a: 'Pflegeleichte Fronten, eine robuste Arbeitsplatte und Geräte in Standardmaßen, damit ein späterer Tausch einfach bleibt. Welche Linie zur Miete und Zielgruppe passt, besprechen wir objektbezogen.',
    },
    {
      q: 'Nennt VIDEKO Preise pro Wohnung?',
      a: 'Nicht pauschal. Der Preis hängt von Grundriss, Ausstattung und Geräten ab. Nach dem Aufmaß erhalten Sie ein konkretes Angebot.',
    },
    {
      q: 'Liefert VIDEKO auch außerhalb der Region?',
      a: 'Ja. Planung, Aufmaß und Montage übernehmen wir in Würzburg und der Region. Küchen liefern wir auf Wunsch auch deutschlandweit; die Lieferkosten trägt der Auftraggeber und stehen vorab im Angebot. Eine Montage außerhalb der Region sagen wir nicht pauschal zu, sondern nur nach gesonderter Absprache für das jeweilige Projekt.',
    },
    {
      q: 'Wo sitzt VIDEKO?',
      a: `In der Hertzstraße 4 in 97076 Würzburg. Die Ausstellung soll am ${BRAND.plannedOpeningLabel} öffnen; bis dahin beraten wir nach Terminvereinbarung.`,
    },
  ],
}
