// VIDEKO Journal — content data (articles, faqs, myths, frag-videko, topics)
import imgFehler from '../assets/images/inspiration/09_premium_architektur_kueche.png'
import imgLicht from '../assets/images/inspiration/03_wohnliche_kueche.png'
import imgArbeitsplatte from '../assets/images/inspiration/06_materialien_und_details.png'
import imgOffen from '../assets/images/inspiration/07_kueche_mit_insel.png'
import imgFronten from '../assets/images/inspiration/10_favoriten_wohnkueche_luxus.png'
import imgBeratung from '../assets/images/vorher-nachher/11_beratung_kundenmoment.png'
import imgStauraum from '../assets/images/inspiration/08_kleine_kueche_clever_geplant.png'
import imgFaq from '../assets/images/leistungen/04_intro_helle_kueche.png'
import imgTopicPlanung from '../assets/images/inspiration/07_kueche_mit_insel.png'
import imgTopicMaterial from '../assets/images/inspiration/06_materialien_und_details.png'
import imgTopicInsp from '../assets/images/inspiration/10_favoriten_wohnkueche_luxus.png'

export const categories = [
  'Alle Themen', 'Planung', 'Materialien', 'Licht', 'Stauraum', 'Geräte', 'Inspiration', 'Pflege', 'Design',
]

export const journalArticles = [
  {
    slug: '7-kuechenfehler-die-du-spaeter-jeden-tag-bereust',
    title: '7 Küchenfehler, die du später jeden Tag bereust',
    category: 'Planung',
    read: '7 Min.',
    featured: true,
    image: imgFehler,
    teaser: 'Kleine Entscheidungen, große Wirkung. Diese typischen Fehler kosten täglich Komfort – und lassen sich mit guter Planung vermeiden.',
    metaTitle: '7 Küchenfehler, die du später jeden Tag bereust | VIDEKO Küchen',
    metaDescription: 'Diese typischen Fehler bei der Küchenplanung kosten später täglich Komfort. VIDEKO zeigt, worauf du bei Licht, Stauraum, Laufwegen, Steckdosen und Materialien achten solltest.',
    intro: 'Eine Küche kann auf den ersten Blick wunderschön aussehen und im Alltag trotzdem nerven. Das Gemeine daran: Viele Fehler merkt man erst, wenn die Küche steht. Dann sind Steckdosen plötzlich Mangelware, die Arbeitsfläche ist zu klein, der Müll steht im Weg und das Licht macht aus jedem Zwiebelwürfeln eine Höhlenexpedition. Hier sind sieben Klassiker, die du vorher vermeiden kannst.',
    sections: [
      { h: '1. Zu wenig Arbeitsfläche', p: 'Eine große Küche ist nicht automatisch praktisch. Entscheidend ist, wo die Arbeitsfläche sitzt. Besonders wichtig ist Platz zwischen Spüle und Kochfeld, weil dort im Alltag am meisten passiert: schneiden, vorbereiten, abstellen, würzen, kurz Chaos veranstalten und so tun, als wäre es ein kreativer Prozess.' },
      { h: '2. Licht wird zu spät geplant', p: 'Viele denken zuerst an Fronten, Arbeitsplatte und Geräte. Licht kommt dann irgendwann am Ende. Das ist ungefähr so sinnvoll wie ein Sportwagen mit Teelichtern als Scheinwerfer. Gutes Küchenlicht besteht aus Arbeitslicht, Raumlicht und Stimmungslicht.' },
      { h: '3. Zu wenige Steckdosen', p: 'Mixer, Kaffeemaschine, Toaster, Wasserkocher, Küchenmaschine, Handy, Tablet, Weihnachtsdeko, Raclette, Airfryer – die Steckdosenliste eskaliert schneller als ein Baumarktbesuch am Samstag.' },
      { h: '4. Der Müll wird unterschätzt', p: 'Mülltrennung ist nicht glamourös. Aber sie passiert jeden Tag. Wenn der Mülleimer zu klein, schlecht erreichbar oder falsch platziert ist, nervt das dauerhaft.' },
      { h: '5. Laufwege werden ignoriert', p: 'Kühlschrank, Spüle, Kochfeld, Backofen, Geschirr und Vorräte sollten sinnvoll zueinander stehen. Wenn du ständig Slalom um offene Auszüge läufst, wurde nicht geplant, sondern Möbel-Tetris gespielt.' },
      { h: '6. Materialien werden nur nach Optik ausgewählt', p: 'Manche Oberflächen sehen im Studio fantastisch aus und zeigen im Alltag jede Berührung, jeden Krümel und jeden Tropfen Wasser. Fronten, Arbeitsplatten und Griffe sollten zu deinem Alltag passen.' },
      { h: '7. Am falschen Ende sparen', p: 'Nicht jeder teure Punkt ist automatisch sinnvoll. Aber bei Planung, Montage, Beschlägen und wichtigen Alltagselementen zu sparen, rächt sich oft.' },
    ],
    fazit: 'Die besten Küchen wirken später selbstverständlich. Genau das ist der Punkt: Gute Planung fällt nicht auf, schlechte Planung schon.',
  },
  {
    slug: 'licht-in-der-kueche',
    title: 'Licht in der Küche',
    category: 'Licht',
    read: '5 Min.',
    image: imgLicht,
    teaser: 'Warum gutes Küchenlicht über Arbeitslicht, Stimmungslicht und Akzentlicht entscheidet – und oft wichtiger ist als die Frontfarbe.',
    metaTitle: 'Licht in der Küche richtig planen | VIDEKO Küchen',
    metaDescription: 'Gute Küchenbeleuchtung ist mehr als eine Lampe an der Decke. Erfahre, wie Arbeitslicht, Stimmungslicht und Akzentlicht deine Küche besser machen.',
    intro: 'Licht ist einer der meistunterschätzten Punkte in der Küchenplanung. Dabei entscheidet es darüber, ob eine Küche nur gut aussieht oder sich auch wirklich gut anfühlt.',
    sections: [
      { h: 'Arbeitslicht', p: 'Das wichtigste Licht sitzt dort, wo gearbeitet wird. Arbeitsflächen, Spüle und Kochbereich brauchen gleichmäßige, klare Beleuchtung.' },
      { h: 'Stimmungslicht', p: 'Indirektes Licht an Sockeln, Regalen, Griffmulden oder Nischen macht die Küche wohnlicher und hochwertiger.' },
      { h: 'Akzentlicht', p: 'Akzentlicht lenkt den Blick. Es kann eine schöne Rückwand, offene Regale oder eine Kücheninsel hervorheben.' },
      { h: 'Lichtfarbe', p: 'Warmweiß wirkt gemütlich, neutraleres Licht unterstützt konzentriertes Arbeiten. Am besten ist meist eine Kombination.' },
    ],
    fazit: 'Gute Lichtplanung sieht man nicht nur. Man spürt sie.',
  },
  {
    slug: 'welche-arbeitsplatte-passt-zu-mir',
    title: 'Welche Arbeitsplatte passt zu mir?',
    category: 'Materialien',
    read: '6 Min.',
    image: imgArbeitsplatte,
    teaser: 'Holz, Stein, Keramik, Dekor oder Compact: ein ehrlicher Wegweiser zu der Arbeitsplatte, die zu deinem Alltag passt.',
    metaTitle: 'Welche Arbeitsplatte passt zu mir? | VIDEKO Küchen',
    metaDescription: 'Holz, Stein, Keramik, Dekor oder Compact: Welche Küchenarbeitsplatte passt zu deinem Alltag, Stil und Anspruch?',
    intro: 'Die Arbeitsplatte ist eine der wichtigsten Entscheidungen in der Küche. Sie prägt die Optik, wird täglich benutzt und muss einiges aushalten.',
    sections: [
      { h: 'Dekor', p: 'Moderne Dekorplatten bieten viele Farben und Strukturen, sind pflegeleicht und preislich oft attraktiv.' },
      { h: 'Compact', p: 'Compact-Arbeitsplatten wirken filigran, modern und passen gut zu minimalistischen Konzepten.' },
      { h: 'Holz', p: 'Holz bringt Wärme und Natürlichkeit, braucht aber einen Alltag, der dazu passt.' },
      { h: 'Naturstein', p: 'Naturstein ist hochwertig und individuell, aber nicht jede Sorte passt zu jedem Alltag.' },
      { h: 'Keramik', p: 'Keramik wirkt edel, modern und hochwertig – braucht aber präzise Verarbeitung.' },
    ],
    fazit: 'Die beste Arbeitsplatte ist nicht die teuerste, sondern die, die zu deinem Alltag passt.',
  },
  {
    slug: 'offene-oder-geschlossene-kueche',
    title: 'Offene oder geschlossene Küche?',
    category: 'Planung',
    read: '5 Min.',
    image: imgOffen,
    teaser: 'Offen wirkt großzügig, geschlossen bleibt ruhig. Die echten Vor- und Nachteile für Alltag, Gerüche und Wohngefühl.',
    metaTitle: 'Offene oder geschlossene Küche? | VIDEKO Küchen',
    metaDescription: 'Offene Küche oder geschlossene Küche? VIDEKO zeigt die echten Vor- und Nachteile für Alltag, Familie, Kochen, Gerüche und Wohngefühl.',
    intro: 'Offene Küchen sehen auf Bildern fantastisch aus. Im Alltag spielen aber auch Gerüche, Geräusche und sichtbare Unordnung eine Rolle.',
    sections: [
      { h: 'Offene Küche', p: 'Sie verbindet Kochen, Essen und Wohnen. Sie macht Räume größer und kommunikativer.' },
      { h: 'Nachteile', p: 'Offen heißt auch: alles ist sichtbar. Unordnung, Geräusche und Gerüche sind im Wohnbereich präsent.' },
      { h: 'Geschlossene Küche', p: 'Sie trennt klar, ist ruhiger und oft praktischer für intensive Kochgewohnheiten.' },
      { h: 'Teiloffene Lösungen', p: 'Glaswände, Schiebetüren oder zonierende Inseln sind oft der beste Mittelweg.' },
    ],
    fazit: 'Die richtige Lösung hängt nicht vom Trend ab, sondern von deinem Alltag.',
  },
  {
    slug: 'fronten-farben-materialien',
    title: 'Fronten, Farben, Materialien',
    category: 'Design',
    read: '6 Min.',
    image: imgFronten,
    teaser: 'Wie du Fronten, Farben und Materialien stilvoll kombinierst – und worauf es bei Wirkung, Pflege und Alltag wirklich ankommt.',
    metaTitle: 'Fronten, Farben & Materialien richtig kombinieren | VIDEKO Küchen',
    metaDescription: 'Wie kombiniert man Küchenfronten, Farben und Materialien stilvoll? VIDEKO erklärt, worauf es bei Wirkung, Pflege und Alltag ankommt.',
    intro: 'Farben, Fronten und Materialien entscheiden nicht nur über den ersten Eindruck, sondern auch darüber, ob du dich jeden Tag gerne in deiner Küche aufhältst.',
    sections: [
      { h: 'Farben', p: 'Auffällige Farben können stark sein, sollten aber bewusst eingesetzt werden.' },
      { h: 'Matte Fronten', p: 'Wirken modern, elegant und ruhig – besonders in warmen, gedeckten Tönen.' },
      { h: 'Holz', p: 'Bringt Wärme und macht Küchen wohnlicher. Der richtige Holzton ist entscheidend.' },
      { h: 'Stein und Struktur', p: 'Starke Materialien brauchen ruhige Partner, sonst wird es schnell unruhig.' },
      { h: 'Details', p: 'Griffe, Armatur, Spüle und Beleuchtung tragen massiv zur Gesamtwirkung bei.' },
    ],
    fazit: 'Gutes Küchendesign ist kein Zufall und kein wildes Zusammenklicken schöner Einzelteile.',
  },
  {
    slug: 'vor-dem-beratungstermin-das-solltest-du-wissen',
    title: 'Vor dem Beratungstermin: Das solltest du wissen',
    category: 'Planung',
    read: '4 Min.',
    image: imgBeratung,
    teaser: 'Du musst nicht alles wissen – aber ein paar Vorbereitungen machen deinen Küchen-Beratungstermin deutlich besser.',
    metaTitle: 'Küchenberatung vorbereiten: Das solltest du wissen | VIDEKO Küchen',
    metaDescription: 'Was solltest du vor einer Küchenberatung wissen? VIDEKO zeigt, welche Infos, Wünsche und Fragen deinen Termin deutlich besser machen.',
    intro: 'Du musst vor einer Küchenberatung nicht alles wissen. Genau dafür ist Beratung da. Aber ein paar gute Vorbereitungen helfen enorm.',
    sections: [
      { h: 'Raumbilder', p: 'Fotos vom Raum helfen sofort – am besten aus mehreren Ecken, mit Fenstern, Türen und Anschlüssen.' },
      { h: 'Maße / Grundriss', p: 'Ein Grundriss ist ideal, grobe Maße reichen für den Einstieg oft schon aus.' },
      { h: 'Alltag', p: 'Wie lebst du? Kochst du viel? Für wie viele Personen? Wie viel Stauraum brauchst du?' },
      { h: 'Wünsche und No-Gos', p: 'Beispiele helfen – genauso wie klare Dinge, die du nicht willst.' },
      { h: 'Budgetrahmen', p: 'Ein Budget ist keine Falle. Es hilft, realistisch und sinnvoll zu planen.' },
    ],
    fazit: 'Je besser Raum, Alltag und Geschmack verstanden werden, desto besser wird das Ergebnis.',
  },
  {
    slug: 'mehr-stauraum-weniger-chaos',
    title: 'Mehr Stauraum, weniger Chaos',
    category: 'Stauraum',
    read: '5 Min.',
    image: imgStauraum,
    teaser: 'Clevere Stauraumlösungen für Auszüge, Vorräte, Müll, Ecken und Geräte – für mehr Ordnung, die im Alltag wirklich hält.',
    metaTitle: 'Mehr Stauraum in der Küche planen | VIDEKO Küchen',
    metaDescription: 'Mehr Ordnung in der Küche: VIDEKO zeigt clevere Stauraumlösungen für Auszüge, Vorräte, Müll, Ecken und Geräte.',
    intro: 'Stauraum ist nicht sexy. Bis man keinen hat. Dann wird jeder Topfdeckel zum Endgegner und jede Schublade zum Ausgrabungsgebiet.',
    sections: [
      { h: 'Auszüge statt Türen', p: 'Auszüge sind im Alltag oft deutlich angenehmer als klassische Türen.' },
      { h: 'Innenorganisation', p: 'Einsätze, Trennsysteme und Organizer wirken klein, machen aber einen großen Unterschied.' },
      { h: 'Vorräte', p: 'Vorräte brauchen Übersicht und realistische Planung.' },
      { h: 'Müll und Reinigung', p: 'Müllsysteme und Putzmittel sollten dort sitzen, wo sie gebraucht werden.' },
      { h: 'Geräte verstecken', p: 'Nicht alles muss sichtbar sein. Gerätegaragen und Nischen können Gold wert sein.' },
    ],
    fazit: 'Mehr Stauraum bedeutet nicht automatisch mehr Schränke – sondern bessere Planung.',
  },
]

export const journalFaqs = [
  { q: 'Wann sollte ich mit der Küchenplanung beginnen?', a: 'Am besten so früh wie möglich. Idealerweise startest du mehrere Wochen oder Monate vor dem geplanten Einbau. Gerade bei Neubau, Sanierung oder Umbau ist frühe Planung wichtig, damit Anschlüsse, Licht, Steckdosen und Raumaufteilung sauber abgestimmt werden.' },
  { q: 'Kann ich mit einem Grundriss starten?', a: 'Ja, absolut. Ein Grundriss ist ein sehr guter Startpunkt. Wenn du zusätzlich grobe Maße und ein paar Fotos vom Raum hast, reicht das für ein erstes sinnvolles Planungsgespräch meist völlig aus.' },
  { q: 'Was muss ich zum ersten Termin mitbringen?', a: 'Hilfreich sind Grundriss, grobe Maße, Fotos vom Raum und ein Gefühl dafür, was dir gefällt oder nicht gefällt. Perfekt vorbereitet musst du nicht sein – wir helfen genau dabei, die richtigen Entscheidungen herauszuarbeiten.' },
  { q: 'Plant ihr auch kleinere Küchen?', a: 'Ja. Gerade kleinere Küchen profitieren von guter Planung oft besonders stark. Wenn der Raum begrenzt ist, wird intelligente Stauraumlösung, Gerätewahl und Laufwegplanung noch wichtiger.' },
  { q: 'Wie lange dauert eine Küchenplanung?', a: 'Das hängt vom Projekt ab. Ein erster Termin dauert oft zwischen 1 und 2 Stunden. Bis zur finalen Planung können – je nach Entscheidungsstand, Aufmaß und Abstimmung – mehrere Schritte nötig sein. Gut geplant ist am Ende aber fast immer besser als hektisch entschieden.' },
  { q: 'Macht ihr Aufmaß und Montage?', a: 'Ja. Eine gute Planung endet nicht am Bildschirm. Aufmaß und fachgerechte Montage gehören für uns zu einem sauberen Gesamtprozess dazu.' },
  { q: 'Was kostet eine Küche bei VIDEKO?', a: 'Das lässt sich nicht pauschal seriös beantworten, weil Raum, Materialien, Geräte, Größe und Anforderungen stark variieren. Wir planen nicht nach Fantasiezahlen, sondern nach deinem Projekt, deinen Prioritäten und deinem Budgetrahmen.' },
  { q: 'Bietet ihr auch nach dem Kauf Service an?', a: 'Ja. Eine Küche ist kein Produkt, das nach dem Aufbau plötzlich vom Planeten verschwindet. Auch nach dem Kauf ist ein verlässlicher Ansprechpartner wichtig – gerade bei Rückfragen, Feinabstimmung oder Servicefällen.' },
]

export const kitchenMyths = [
  { title: 'Weiße Küchen werden schneller schmutzig.', verdict: 'Falsch', answer: 'Oder zumindest so pauschal falsch. Weiße Küchen werden nicht automatisch schneller schmutzig. Man sieht bestimmte Dinge anders, ja. Aber auf dunklen Fronten sieht man Finger, Staub oder Schlieren oft genauso gut oder sogar stärker.' },
  { title: 'Eine Insel braucht mindestens 40 m².', verdict: 'Falsch', answer: 'Eine Insel braucht vor allem gute Proportionen und ausreichend Bewegungsfläche. Die Quadratmeterzahl allein sagt fast nichts. Auch kompaktere Räume können mit einer gut geplanten Insel oder Halbinsel hervorragend funktionieren.' },
  { title: 'Grifflos ist unpraktisch.', verdict: 'Falsch', answer: 'Grifflos kann sehr alltagstauglich sein – wenn die Planung stimmt. Ergonomie, Linienführung und Beschlagsqualität sind entscheidend. Schlechte Planung ist unpraktisch. Nicht die Griffleiste.' },
  { title: 'Holz in der Küche ist pflegeintensiv.', verdict: 'Teilweise wahr', answer: 'Echtholz braucht je nach Oberfläche mehr Aufmerksamkeit als andere Materialien. Aber Holz ist nicht automatisch problematisch. Wer den natürlichen Charakter mag, bekommt dafür Wärme und echte Wohnlichkeit.' },
  { title: 'Schwarze Armaturen sind immer empfindlich.', verdict: 'Nicht immer', answer: 'Qualität, Beschichtung, Wasserhärte und Pflegeverhalten machen hier den Unterschied. Schwarze Armaturen können toll aussehen – man sollte nur wissen, was im eigenen Alltag dazu passt.' },
  { title: 'Kleine Küchen können nicht hochwertig wirken.', verdict: 'Falsch', answer: 'Gerade kleine Küchen können extrem hochwertig und durchdacht wirken, wenn Material, Licht und Stauraum gut geplant sind. Größe allein entscheidet nicht über Qualität.' },
]

export const fragVidekoQuestions = [
  { q: 'Brauche ich wirklich eine Kochinsel?', a: 'Nein. Eine Insel ist nur dann sinnvoll, wenn Raum, Laufwege und Nutzung dazu passen. Eine schlechte Insel ist teurer Wegverlust mit Showeffekt. Eine gute Insel ist Gold wert.' },
  { q: 'Keramik oder Naturstein – was ist besser?', a: 'Nicht pauschal. Keramik ist modern, stark und sehr beliebt. Naturstein ist charaktervoll und einzigartig. Entscheidend ist, was besser zu deinem Stil, Anspruch und Alltag passt.' },
  { q: 'Welche Geräte lohnen sich wirklich?', a: 'Die, die du wirklich nutzt. Ein starker Kühlschrank, ein gutes Kochfeld, sinnvoller Backofen und vernünftiger Geschirrspüler bringen meist mehr als Technik-Spielzeug, das nach drei Wochen nur noch dekorativ Staub fängt.' },
  { q: 'Matt oder Hochglanz – was ist pflegeleichter?', a: 'Kommt auf Material und Oberfläche an. Matt wirkt oft ruhiger und moderner, kann aber je nach Oberfläche ebenso empfindlich sein. Hochglanz reflektiert mehr und zeigt Nutzung anders. Nicht nur nach Optik entscheiden.' },
]

export const popularTopics = [
  { title: 'Küchenplanung', count: '7 Artikel', image: imgTopicPlanung, to: '/journal/7-kuechenfehler-die-du-spaeter-jeden-tag-bereust' },
  { title: 'Materialien', count: '4 Artikel', image: imgTopicMaterial, to: '/journal/welche-arbeitsplatte-passt-zu-mir' },
  { title: 'Inspiration', count: '5 Artikel', image: imgTopicInsp, to: '/inspiration' },
]
