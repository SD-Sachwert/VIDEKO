/**
 * Marken, die VIDEKO führt — Grundlage für /marken und /marken/:slug.
 *
 * LEITPLANKE (Stand 26.11.2026):
 * - Bestätigt ist nur das SORTIMENT (BRAND.assortment in company.js).
 * - NICHT bestätigt: autorisierter Fachhändler, Premiumpartner, Exklusivität,
 *   Ausstellungsstücke einzelner Marken. Deshalb heißt es überall „wir führen“
 *   und nie „offizieller Partner“ oder „autorisierter Händler“.
 * - Keine Herstellerlogos und keine Herstellerbilder, solange die
 *   Nutzungsrechte nicht schriftlich vorliegen (docs/HERSTELLER-ANFRAGEN-2026-11.md).
 * - Herstellerangaben (Sitz, Technik) nur mit Quelle in `quellen`. Keine
 *   Superlative aus Herstellerwerbung („größter“, „bester“) übernehmen.
 *
 * Eine eigene Seite bekommt eine Marke nur, wenn wir dazu mehr sagen können
 * als eine Zeile: Wofür sie sich eignet, worauf man bei der Planung achtet.
 * Die übrigen Marken stehen mit einem ehrlichen Absatz auf der Übersicht.
 * Die FAQs werden auf der Seite angezeigt UND als FAQPage ausgezeichnet.
 */

import { BRAND } from './company.js'

export const MARKEN_GRUPPEN = [
  { key: 'kitchens', title: 'Küchen', lead: 'Vier Hersteller, vier unterschiedliche Preis- und Gestaltungsbereiche. Welcher passt, hängt vom Raum und vom Budget ab, nicht vom Logo.' },
  { key: 'appliances', title: 'Elektrogeräte', lead: 'Backofen, Kochfeld, Abzug, Kühlen, Spülen: Wir planen die Geräte mit der Küche, damit Nischen, Anschlüsse und Lüftung zusammenpassen.' },
  { key: 'sinksAndTaps', title: 'Spülen und Armaturen', lead: 'Spüle und Armatur sind die Teile, die jeden Tag benutzt werden. Material und Größe entscheiden wir mit der Arbeitsplatte zusammen.' },
]

export const MARKEN = [
  /* ------------------------------------------------------------ Küchen */
  {
    slug: 'schueller',
    name: 'Schüller',
    gruppe: 'kitchens',
    eigeneSeite: true,
    kurz: 'Küchenmöbel aus Herrieden in Mittelfranken. Breites Programm vom soliden Einstieg bis zur grifflosen Designküche, mit vielen Fronten, Farben und Rastermaßen.',
    title: 'Schüller Küchen in Würzburg – Beratung & Planung | VIDEKO',
    description: 'Schüller Küchen in Würzburg planen lassen: Fronten, Rastermaße und Ausstattung ehrlich verglichen. Planung, Aufmaß und Montage durch VIDEKO.',
    hero: 'Schüller-Küchen',
    heroGrad: 'aus Franken, für Würzburg geplant.',
    lead: 'Schüller baut Küchen in Herrieden, gut eine Stunde von Würzburg entfernt. Wir führen das Programm und planen damit Küchen, die zum Raum passen, statt zum Katalogbild.',
    abschnitte: [
      { title: 'Wofür wir Schüller einsetzen', text: 'Wenn eine Küche viele Gestaltungsmöglichkeiten braucht, aber kein Sonderbau sein soll. Das Programm reicht von pflegeleichten Schichtstofffronten bis zu Lack und Echtholz, mit Griffen, Griffleisten oder grifflos.' },
      { title: 'Worauf wir bei der Planung achten', text: 'Höhenraster und Sockelhöhe legen wir nach deiner Körpergröße fest, nicht nach dem Standard. Bei grifflosen Fronten prüfen wir, ob die Griffmulde im Alltag wirklich angenehm ist. Das merkt man erst nach Wochen, nicht im Studio.' },
      { title: 'Was es nicht ist', text: 'Eine Schüller-Küche ist Serienfertigung mit vielen Varianten, keine Schreinerküche. Für Dachschrägen oder ungewöhnliche Nischen planen wir mit Passblenden oder kombinieren mit Maßanfertigung.' },
    ],
    faqs: [
      { q: 'Wo werden Schüller-Küchen hergestellt?', a: 'Schüller sitzt in Herrieden im Landkreis Ansbach in Mittelfranken und fertigt dort seit der Gründung 1966.' },
      { q: 'Kann ich bei VIDEKO eine Schüller-Küche planen lassen?', a: 'Ja. Wir führen Schüller und übernehmen Beratung, Planung, Aufmaß und Montage durch unser eigenes Team.' },
      { q: 'Was ist der Unterschied zwischen Schüller und next125?', a: 'Beide kommen aus demselben Unternehmen in Herrieden. next125 ist die designorientierte Marke mit eigenem Programm und eigener Formensprache. Welche besser passt, zeigt meist schon die erste Planung.' },
    ],
    quellen: ['https://www.schueller.de/de/unternehmen/firmenhistorie'],
  },
  {
    slug: 'next125',
    name: 'next125',
    gruppe: 'kitchens',
    eigeneSeite: true,
    kurz: 'Die designorientierte Marke aus dem Hause Schüller. Klare Linien, eigene Materialien und Systeme für offene Wohnküchen.',
    title: 'next125 Küchen in Würzburg – Designküchen planen | VIDEKO',
    description: 'next125 in Würzburg: Designküchen aus Herrieden für offene Wohnräume. Was die Marke von Schüller unterscheidet und wann sie sich lohnt. Planung & Montage durch VIDEKO.',
    hero: 'next125',
    heroGrad: 'für Küchen, die Wohnraum sind.',
    lead: 'next125 kommt aus demselben Unternehmen wie Schüller, folgt aber einer eigenen Gestaltungslinie. Wir planen damit vor allem offene Küchen, die zum Wohnbereich gehören.',
    abschnitte: [
      { title: 'Wofür wir next125 einsetzen', text: 'Für offene Grundrisse, in denen die Küche mit Ess- und Wohnbereich eins wird. Hier zählen ruhige Fronten, durchgehende Linien und Schränke, die eher nach Möbel als nach Küche aussehen.' },
      { title: 'Worauf wir bei der Planung achten', text: 'In der offenen Küche hört man den Geschirrspüler und riecht man das Kochen. Deshalb planen wir Abzug, Gerätelautstärke und Stauraum mit, bevor es um Oberflächen geht. Eine schöne Front hilft wenig, wenn auf der Insel alles herumsteht.' },
      { title: 'Ehrlich gesagt', text: 'next125 ist nicht die günstigste Lösung im Sortiment. Wenn das Budget eng ist, zeigen wir, welche Schüller-Varianten einen ähnlichen Eindruck machen.' },
    ],
    faqs: [
      { q: 'Gehört next125 zu Schüller?', a: 'Ja. next125 ist neben Schüller die zweite Produktmarke des Schüller Möbelwerks in Herrieden, mit eigenem Programm.' },
      { q: 'Für welche Räume eignet sich next125?', a: 'Vor allem für offene Wohnküchen, in denen die Küche zum Wohnbereich gehört. Für eine geschlossene, kleine Küche ist sie selten die erste Wahl.' },
      { q: 'Führt VIDEKO next125?', a: 'Ja. Wir planen next125-Küchen, messen auf und montieren mit unserem eigenen Team.' },
    ],
    quellen: ['https://www.next125.com/', 'https://www.schueller.de/de/unternehmen/firmenhistorie'],
  },
  {
    slug: 'nobilia',
    name: 'nobilia',
    gruppe: 'kitchens',
    eigeneSeite: true,
    kurz: 'Küchen aus Verl in Ostwestfalen. Große Auswahl zu fairen Preisen, verlässliche Standardmaße, gut für Familienküchen und Mietwohnungen.',
    title: 'nobilia Küchen in Würzburg – Beratung & Montage | VIDEKO',
    description: 'nobilia Küchen in Würzburg: Was die Marke gut kann, wo ihre Grenzen liegen und wie wir sie planen. Beratung, Aufmaß und Montage durch VIDEKO.',
    hero: 'nobilia',
    heroGrad: 'solide geplant statt schöngeredet.',
    lead: 'nobilia baut Küchen in Ostwestfalen und steht für ein großes Programm zu vernünftigen Preisen. Wir führen nobilia und holen aus dem Programm heraus, was es kann.',
    abschnitte: [
      { title: 'Wofür wir nobilia einsetzen', text: 'Für Familienküchen, Erstausstattungen und Mietwohnungen: Wenn eine Küche gut aussehen, viel aushalten und im Budget bleiben soll. Die Auswahl an Fronten und Farben ist groß genug, dass man nicht nach Standardküche aussieht.' },
      { title: 'Worauf wir bei der Planung achten', text: 'Der Preis einer Küche entsteht im Inneren: Auszüge statt Türen, gute Innenorganisation, die richtige Arbeitshöhe. An der Front sparen ist oft klüger als am Auszug. Das rechnen wir offen gegeneinander.' },
      { title: 'Für Vermieter', text: 'Standardmaße, nachbestellbare Fronten und robuste Oberflächen machen nobilia zu einer naheliegenden Wahl für Mietwohnungen. Mehr dazu auf der Seite für Immobilieninvestoren.' },
    ],
    faqs: [
      { q: 'Woher kommen nobilia-Küchen?', a: 'nobilia wurde 1945 gegründet und hat seinen Sitz in Verl in Ostwestfalen.' },
      { q: 'Ist nobilia eine gute Küche?', a: 'Für den Preis ja. Entscheidend ist die Planung: Mit guten Auszügen, durchdachter Innenausstattung und sauberer Montage wird aus einer bezahlbaren Küche eine, die lange hält.' },
      { q: 'Plant VIDEKO auch nobilia-Küchen für Mietwohnungen?', a: 'Ja. Für Kapitalanlagen und Mietwohnungen planen wir mit pflegeleichten Fronten und Standardmaßen, damit ein späterer Tausch einfach bleibt.' },
    ],
    quellen: ['https://www.nobilia.de/fileadmin/assets/downloads/presse/2023/de/08_PM_2023_nobilia_Geschaeftsjahr_2022.pdf'],
    weiter: { to: '/kuechen-fuer-immobilieninvestoren', label: 'Küchen für Immobilieninvestoren' },
  },
  {
    slug: 'impuls',
    name: 'IMPULS',
    gruppe: 'kitchens',
    eigeneSeite: true,
    kurz: 'Küchen aus Brilon im Sauerland. Klare, alltagstaugliche Programme mit gutem Preis-Leistungs-Verhältnis.',
    title: 'IMPULS Küchen in Würzburg – Planung & Montage | VIDEKO',
    description: 'IMPULS Küchen in Würzburg: Küchen aus Brilon im Sauerland, ehrlich eingeordnet. Wofür sie sich eignen, Planung, Aufmaß und Montage durch VIDEKO.',
    hero: 'IMPULS-Küchen',
    heroGrad: 'aus dem Sauerland, sauber montiert.',
    lead: 'IMPULS baut Küchen in Brilon im Sauerland. Wir führen die Marke für Küchen, die gut funktionieren sollen, ohne dass jedes Detail ein Sonderwunsch ist.',
    abschnitte: [
      { title: 'Wofür wir IMPULS einsetzen', text: 'Für alltagstaugliche Küchen mit klarem Budget: Neubau, Renovierung, Mietwohnung. Das Programm ist übersichtlich, die Entscheidung dadurch schneller.' },
      { title: 'Worauf wir bei der Planung achten', text: 'Gerade bei günstigeren Küchen entscheidet die Montage über die Qualität: Lot und Waage, saubere Fugen an der Wand, sauber angepasste Arbeitsplatte. Das übernimmt bei uns das eigene Team.' },
      { title: 'Im Vergleich', text: 'IMPULS und nobilia liegen in einem ähnlichen Bereich. Wir legen dir beide Planungen nebeneinander, wenn das die Entscheidung leichter macht.' },
    ],
    faqs: [
      { q: 'Wo sitzt IMPULS Küchen?', a: 'IMPULS Küchen sitzt in Brilon im Hochsauerlandkreis, gehört zu den Briloner Möbelwerken und verkauft über den Fachhandel.' },
      { q: 'Für wen eignen sich IMPULS-Küchen?', a: 'Für alle, die eine solide, gut geplante Küche mit klarem Budget wollen, etwa im Neubau, bei einer Renovierung oder in einer Mietwohnung.' },
      { q: 'Montiert VIDEKO die Küche selbst?', a: 'Ja. Die Montage übernimmt unser eigenes Team, auch bei IMPULS-Küchen.' },
    ],
    quellen: ['https://www.impuls-kuechen.de/en/company/the-impuls-story.html'],
  },

  /* ------------------------------------------------------------ Geräte */
  {
    slug: 'bora',
    name: 'BORA',
    gruppe: 'appliances',
    eigeneSeite: true,
    kurz: 'Kochfeldabzüge aus Raubling in Oberbayern: Der Dunst wird direkt am Kochfeld nach unten abgesaugt. Keine Haube über dem Kopf.',
    title: 'BORA Kochfeldabzug in Würzburg – planen & einbauen | VIDEKO',
    description: 'BORA in Würzburg: Kochfeldabzug richtig planen. Abluft oder Umluft, Platz im Unterschrank, Kochinsel. Beratung, Planung und Montage durch VIDEKO.',
    hero: 'BORA',
    heroGrad: 'Abzug nach unten, Blick frei.',
    lead: 'BORA saugt den Kochdunst direkt am Kochfeld nach unten ab. Das macht die Dunsthaube überflüssig, verlangt aber eine Planung, die den Unterschrank mitdenkt.',
    abschnitte: [
      { title: 'Wofür wir BORA einsetzen', text: 'Vor allem für Kochinseln und offene Küchen, in denen eine Haube den Raum teilen oder die Sicht nehmen würde. Auch unter Dachschrägen kann ein Kochfeldabzug die Lösung sein.' },
      { title: 'Worauf wir bei der Planung achten', text: 'Der Abzug braucht Platz im Unterschrank, also weniger Schubladenraum unter dem Kochfeld. Bei Abluft muss der Kanal nach außen führen, bei Umluft planen wir Filter und Rückströmung über den Sockel. Diese Entscheidung fällt vor der Möbelplanung, nicht danach.' },
      { title: 'Neubau und Lüftungsanlage', text: 'In dichten Neubauten mit kontrollierter Wohnraumlüftung ist Abluft oft nicht vorgesehen. Dann planen wir mit Umluft und sagen dir vorher, was sie leisten kann.' },
    ],
    faqs: [
      { q: 'Wie funktioniert ein BORA-Kochfeldabzug?', a: 'Der Abzug sitzt im Kochfeld und saugt Dampf und Gerüche direkt nach unten ab, bevor sie aufsteigen. Je nach System wird die Luft nach außen geführt (Abluft) oder gefiltert in den Raum zurückgegeben (Umluft).' },
      { q: 'Abluft oder Umluft bei BORA?', a: 'Abluft entfernt Feuchtigkeit aus dem Raum, braucht aber einen Kanal nach außen. Umluft braucht keinen Kanal, verlangt aber Filterwechsel und eine geplante Rückströmung. Was im Raum möglich ist, klären wir beim Aufmaß.' },
      { q: 'Plant und montiert VIDEKO BORA-Kochfelder?', a: 'Ja. Wir führen BORA und planen das Kochfeld mit der Küche, inklusive Unterschrank und Luftführung. Die Montage übernimmt unser eigenes Team.' },
    ],
    quellen: ['https://www.bora.com/de/de/unternehmen/unternehmen-und-geschichte/'],
  },
  {
    slug: 'miele',
    name: 'Miele',
    gruppe: 'appliances',
    eigeneSeite: true,
    kurz: 'Familienunternehmen aus Gütersloh, gegründet 1899. Einbaugeräte vom Backofen bis zum Geschirrspüler.',
    title: 'Miele Einbaugeräte in Würzburg – mit der Küche geplant | VIDEKO',
    description: 'Miele Einbaugeräte in Würzburg: Backofen, Dampfgarer, Kochfeld und Geschirrspüler mit der Küche geplant. Einbaumaße, Höhen und Anschlüsse durch VIDEKO.',
    hero: 'Miele',
    heroGrad: 'mit der Küche geplant, nicht dazugekauft.',
    lead: 'Miele stellt seit 1899 Hausgeräte her und sitzt in Gütersloh. Wir führen Miele-Einbaugeräte und planen sie so, dass sie in der Küche in der richtigen Höhe sitzen.',
    abschnitte: [
      { title: 'Wofür wir Miele einsetzen', text: 'Wenn Geräte lange halten sollen und mehr können sollen als Ober- und Unterhitze: Dampfgarer, Backofen mit Dampfunterstützung, Geschirrspüler mit Besteckschublade. Was davon du wirklich nutzt, besprechen wir vorher.' },
      { title: 'Worauf wir bei der Planung achten', text: 'Backofen und Dampfgarer gehören auf Augenhöhe, nicht unter das Kochfeld. Ein hochgebauter Geschirrspüler schont den Rücken. Das klingt nach Kleinigkeit, entscheidet aber über die Schrankaufteilung der ganzen Küche.' },
      { title: 'Ehrlich gesagt', text: 'Nicht jede Küche braucht die Top-Ausstattung. Manchmal ist ein guter Standardbackofen plus ein besserer Geschirrspüler die klügere Verteilung des Budgets.' },
    ],
    faqs: [
      { q: 'Woher kommt Miele?', a: 'Miele ist ein Familienunternehmen mit Sitz in Gütersloh, gegründet 1899.' },
      { q: 'Kann ich Miele-Geräte in jede Küche einbauen?', a: 'In fast jede, wenn die Nischenmaße stimmen. Deshalb planen wir die Geräte zusammen mit den Möbeln und prüfen Einbaumaße und Anschlüsse vor der Bestellung.' },
      { q: 'Plant VIDEKO Küchen mit Miele-Geräten?', a: 'Ja. Wir führen Miele-Einbaugeräte und bauen sie bei der Montage mit ein.' },
    ],
    quellen: ['https://www.miele.de/de/m/daten-und-fakten-323.htm'],
  },
  {
    slug: 'neff',
    name: 'NEFF',
    gruppe: 'appliances',
    eigeneSeite: false,
    kurz: 'Einbaugeräte mit Wurzeln in Bretten in Baden, bekannt für die Backofentür, die beim Öffnen unter dem Garraum verschwindet (Slide&Hide). Gehört zur BSH-Gruppe.',
    quellen: ['https://www.neff-home.com/de/neff-entdecken/produkt-design-highlights/slide-and-hide'],
  },
  {
    slug: 'bosch',
    name: 'Bosch',
    gruppe: 'appliances',
    eigeneSeite: false,
    kurz: 'Hausgeräte der BSH-Gruppe. Breites Einbausortiment, gut, wenn Geräte zuverlässig laufen sollen, ohne dass jedes Extra bezahlt werden muss.',
    quellen: ['https://www.bsh-group.com/de/de/ueber-die-bsh/unternehmensprofil/'],
  },
  {
    slug: 'aeg',
    name: 'AEG',
    gruppe: 'appliances',
    eigeneSeite: false,
    kurz: 'Einbaugeräte von Backofen bis Kochfeld, viele davon mit Dampfgarfunktionen. Solide Wahl, wenn Geräte viel können sollen, ohne die Küche zu dominieren.',
    quellen: ['https://www.aeg.de/'],
  },

  /* ------------------------------------------------- Spülen, Armaturen */
  {
    slug: 'quooker',
    name: 'Quooker',
    gruppe: 'sinksAndTaps',
    eigeneSeite: true,
    kurz: 'Wasserhähne aus den Niederlanden, die neben normalem Wasser auch kochendes Wasser liefern. Der Wasserkocher kann weg.',
    title: 'Quooker in Würzburg – Kochendwasserhahn planen | VIDEKO',
    description: 'Quooker in Würzburg: Kochendwasserhahn mit der Küche planen. Platz im Spülenschrank, Stromanschluss, Kindersicherung. Beratung und Montage durch VIDEKO.',
    hero: 'Quooker',
    heroGrad: 'kochendes Wasser aus dem Hahn.',
    lead: 'Ein Quooker liefert auf Knopfdruck kochendes Wasser. Damit das im Alltag funktioniert, muss unter der Spüle Platz für den Vorratsbehälter eingeplant sein.',
    abschnitte: [
      { title: 'Wofür wir Quooker einsetzen', text: 'Für alle, die viel Tee kochen, Nudelwasser schneller auf dem Herd haben wollen oder den Wasserkocher von der Arbeitsplatte verbannen möchten. Je nach Modell kommt auch gekühltes oder sprudelndes Wasser aus demselben Hahn.' },
      { title: 'Worauf wir bei der Planung achten', text: 'Im Spülenschrank sitzt der Behälter, daneben oft Müllsystem und Wasserfilter. Das plant man vor der Bestellung, nicht beim Einbau. Dazu kommt eine Steckdose im Unterschrank.' },
      { title: 'Sicherheit', text: 'Die Kochendwasserfunktion ist durch einen Bedienmechanismus gesichert, den man bewusst auslösen muss. Ob das in deinem Haushalt mit Kindern reicht, besprechen wir offen.' },
    ],
    faqs: [
      { q: 'Wie funktioniert ein Quooker?', a: 'Unter der Spüle sitzt ein isolierter Vorratsbehälter, der Wasser heiß hält. Über den Hahn kommt es auf Knopfdruck kochend heraus, sonst liefert der Hahn normales kaltes und warmes Wasser.' },
      { q: 'Was braucht man für einen Quooker?', a: 'Platz im Spülenschrank für den Behälter, eine Steckdose im Unterschrank und einen Wasseranschluss. Das prüfen wir beim Aufmaß.' },
      { q: 'Baut VIDEKO einen Quooker ein?', a: 'Ja. Wir führen Quooker und planen ihn mit Spüle und Spülenschrank. Den Einbau übernimmt unser eigenes Team im Rahmen der Montage.' },
    ],
    quellen: ['https://www.quooker.de/ueber-quooker/geschichte'],
  },
  {
    slug: 'blanco',
    name: 'BLANCO',
    gruppe: 'sinksAndTaps',
    eigeneSeite: false,
    kurz: 'Spülen und Armaturen aus Oberderdingen in Baden-Württemberg, unter anderem aus Edelstahl und dem Granitverbundwerkstoff SILGRANIT.',
    quellen: ['https://www.blanco.com/de-de/'],
  },
  {
    slug: 'schock',
    name: 'SCHOCK',
    gruppe: 'sinksAndTaps',
    eigeneSeite: false,
    kurz: 'Spülen aus Regen im Bayerischen Wald, spezialisiert auf Quarzkomposit: matte, robuste Oberflächen in vielen Farben.',
    quellen: ['https://www.schock.de/deu_de/unternehmen/ueberschock'],
  },
]

export const MARKEN_MIT_SEITE = MARKEN.filter((m) => m.eigeneSeite)
export const markeBySlug = (slug) => MARKEN_MIT_SEITE.find((m) => m.slug === slug)

export const MARKEN_FAQS = [
  { q: 'Welche Marken führt VIDEKO?', a: `Küchen von ${MARKEN.filter((m) => m.gruppe === 'kitchens').map((m) => m.name).join(', ')}; Elektrogeräte von ${MARKEN.filter((m) => m.gruppe === 'appliances').map((m) => m.name).join(', ')}; Spülen und Armaturen von ${MARKEN.filter((m) => m.gruppe === 'sinksAndTaps').map((m) => m.name).join(', ')}.` },
  { q: 'Ist VIDEKO autorisierter Fachhändler dieser Marken?', a: 'Wir führen diese Marken im Sortiment. Einen besonderen Partnerstatus behaupten wir nur, wenn der Hersteller ihn bestätigt hat. Bis dahin steht hier schlicht: Wir führen sie.' },
  { q: 'Kann ich die Küchen ansehen?', a: `Unsere Ausstellung in der Hertzstraße 4 in Würzburg soll am ${BRAND.plannedOpeningLabel} öffnen. Bis dahin beraten wir nach Terminvereinbarung.` },
  { q: 'Muss ich mich vorher für eine Marke entscheiden?', a: 'Nein. Wir planen zuerst den Raum und die Abläufe. Danach zeigen wir, welche Marke das am besten umsetzt, und gern auch zwei im Vergleich.' },
]
