/**
 * Inhalte, die sich eine Leistungsseite mit ihren Metadaten teilt.
 *
 * Hintergrund: Eine FAQPage darf nur ausgezeichnet werden, wenn die Fragen auch
 * sichtbar auf der Seite stehen. Damit beides garantiert dieselben Sätze sind
 * — und damit das JSON-LD schon im vorgerenderten HTML steht statt erst nach
 * der Hydration —, liegen die Fragen hier und werden von zwei Stellen gelesen:
 *
 *   • von der Seitenkomponente, die sie anzeigt
 *   • von routes-meta.js, aus dem head.js das FAQPage-Objekt baut
 *
 * INHALTLICHE LEITPLANKE (wie in AllesAusEinerHand.jsx): VIDEKO plant,
 * koordiniert und montiert die Küche. Gewerke wie Elektro, Boden, Trockenbau
 * oder Spanndecke werden über VIDEKO organisiert und von Fachpartnern
 * ausgeführt; Arbeitsplatten werden beim Naturstein- oder Keramikpartner
 * aufgemessen und gefertigt. Keine Antwort hier behauptet etwas anderes.
 * Ebenso stehen hier keine Preise, Quadratmeterzahlen, Lieferzeiten oder
 * Garantien, die im Projekt nicht belegt sind.
 */

/**
 * /alles-aus-einer-hand — unverändert aus der Seitenkomponente hierher gezogen.
 * Dort wurde das FAQPage-Objekt bisher erst zur Laufzeit gesetzt und stand
 * damit nicht im ausgelieferten HTML.
 */
export const ALLES_AUS_EINER_HAND_FAQS = [
  {
    q: 'Führt VIDEKO alle Arbeiten selbst aus?',
    a: 'Nein. VIDEKO plant deine Küche und koordiniert das Projekt. Gewerke wie Elektro, Boden, Trockenbau oder Spanndecke werden über VIDEKO organisiert und von passenden Fachpartnern ausgeführt. Du hast trotzdem nur einen Ansprechpartner.',
  },
  {
    q: 'Was bringt mir das gegenüber einzelnen Aufträgen?',
    a: 'Die Gewerke werden aufeinander abgestimmt geplant: Aufbauhöhen, Anschlüsse, Leitungswege und Licht passen zusammen, weil sie gemeinsam betrachtet wurden. Und du musst die Termine nicht selbst zwischen mehreren Betrieben sortieren.',
  },
  {
    q: 'Kann ich einzelne Gewerke selbst beauftragen?',
    a: 'Ja. Wenn du deinen eigenen Elektriker oder Bodenleger hast, binden wir ihn in die Planung und den Terminplan ein. Du entscheidest, wie viel über VIDEKO läuft.',
  },
  {
    q: 'Wie lange dauert so ein Umbau?',
    a: 'Das hängt vom Umfang und von den Lieferzeiten der Küche ab. Eine belastbare Aussage bekommst du erst nach der Aufnahme vor Ort – vorher wäre jede Zahl geraten.',
  },
  {
    q: 'Was kostet das?',
    a: 'Der Preis ergibt sich aus den tatsächlich benötigten Gewerken und dem Umfang der Küche. Nach dem Aufmaß bekommst du eine Aufstellung, in der du siehst, welcher Posten wofür steht.',
  },
]

/** /kuechen-nach-mass */
export const NACH_MASS_FAQS = [
  {
    q: 'Was heißt „Küche nach Maß“ bei VIDEKO konkret?',
    a: 'Die Küche wird für deinen Raum geplant, nicht aus einem festen Katalograster zusammengesteckt. Grundriss, Höhen, Arbeitswege, Stauraum und Geräte legen wir gemeinsam fest, das Aufmaß erfolgt millimetergenau per Laser. Gefertigt wird anschließend passend zu dieser Planung.',
  },
  {
    q: 'Ist das dasselbe wie eine Einbauküche?',
    a: 'Eine Einbauküche ist fest mit dem Raum verbunden statt frei aufgestellt. Nach Maß beschreibt, wie genau sie an den Raum angepasst ist. Beides gehört bei uns zusammen: Wir planen Einbauküchen, die auf die vorhandenen Wände, Anschlüsse und Höhen abgestimmt sind.',
  },
  {
    q: 'Lohnt sich das auch bei einer kleinen Küche?',
    a: 'Gerade dann. Je enger der Raum, desto mehr entscheidet jeder Zentimeter über Stauraum und Arbeitswege. Schiefe Wände, Nischen und ungünstige Anschlüsse fallen in kleinen Räumen stärker ins Gewicht als in großen.',
  },
  {
    q: 'Wie fange ich am besten an?',
    a: 'Mit einem Gespräch über deinen Raum und deinen Alltag. Wenn du vorher eine Richtung suchst, hilft der Stylefinder bei Stil und Budgetrahmen. Maße und Materialien klären wir danach gemeinsam.',
  },
  {
    q: 'Was kostet eine Küche nach Maß?',
    a: 'Der Preis hängt von Größe, Materialien, Geräten und Umfang ab. Eine belastbare Zahl entsteht erst nach Planung und Aufmaß – vorher wäre sie geraten. Du bekommst dann eine Aufstellung, in der du siehst, welcher Posten wofür steht.',
  },
]

/** /arbeitsplatten */
export const ARBEITSPLATTEN_FAQS = [
  {
    q: 'Welche Arbeitsplatte ist die robusteste?',
    a: 'Keramik steckt Hitze, Kratzer und Flecken am besten weg. Naturstein ist ebenfalls sehr stabil, reagiert je nach Sorte aber empfindlicher auf Säuren. Compact ist robust und pflegeleicht, Massivholz braucht am meisten Zuwendung.',
  },
  {
    q: 'Was kostet eine neue Arbeitsplatte?',
    a: 'Das hängt von Material, Plattengröße, Kantenausführung und den nötigen Ausschnitten ab. Deshalb steht der Preis erst nach dem Aufmaß fest – jede Zahl davor wäre eine Schätzung ins Blaue.',
  },
  {
    q: 'Kann ich nur die Arbeitsplatte tauschen?',
    a: 'Oft ja, wenn Unterschränke, Maße und Ausschnitte es hergeben. Ob das in deinem Fall sinnvoll ist, zeigt sich beim Blick auf den Bestand vor Ort.',
  },
  {
    q: 'Wer misst die Platte auf?',
    a: 'Das Aufmaß für Naturstein und Keramik macht der jeweilige Fachpartner, mit dem wir zusammenarbeiten. Material, Kante und Ausschnitte werden vorher gemeinsam mit dir festgelegt, koordiniert wird das Ganze über VIDEKO.',
  },
  {
    q: 'Kann ich Materialien vorher ansehen?',
    a: 'Ja. Oberflächen wirken auf dem Bildschirm anders als in echt – deshalb schauen wir sie im Studio in Würzburg gemeinsam an, im Licht und im Zusammenspiel mit den Fronten.',
  },
]

/** /kuechenmontage-wuerzburg */
export const MONTAGE_FAQS = [
  {
    q: 'Montiert VIDEKO die Küche selbst?',
    a: 'Die Küchenmontage übernimmt unser eigenes Team. Angrenzende Gewerke wie Elektro, Boden oder Trockenbau werden über VIDEKO organisiert und von passenden Fachpartnern ausgeführt. Dein Ansprechpartner bleibt derselbe.',
  },
  {
    q: 'Montiert ihr auch Küchen, die woanders gekauft wurden?',
    a: 'Sprich uns an. Ob das möglich ist, hängt vom Umfang, vom Zustand der Ware und vom Terminplan ab – das klären wir vorab und nicht am Montagetag.',
  },
  {
    q: 'Wie lange dauert eine Küchenmontage?',
    a: 'Das richtet sich nach Größe, Geräten und Vorarbeiten im Raum. Nach dem Aufmaß bekommst du einen Terminrahmen, auf den du dich einstellen kannst – statt einer vagen Zusage.',
  },
  {
    q: 'Warum ist das Aufmaß so wichtig?',
    a: 'Weil Wände selten gerade und Anschlüsse selten dort sind, wo man sie erwartet. Wir messen millimetergenau per Laser, bevor bestellt wird. Was hier auffällt, kostet in der Planung wenig – am Montagetag deutlich mehr.',
  },
  {
    q: 'Was passiert am Ende der Montage?',
    a: 'Eine gemeinsame Endabnahme. Wir gehen die Küche mit dir durch, erklären Details und halten offene Punkte fest, statt sie stillschweigend liegen zu lassen.',
  },
]
