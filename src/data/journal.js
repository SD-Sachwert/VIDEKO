// VIDEKO Journal — content data (articles, faqs, myths, frag-videko, topics)
import imgFehler from '../assets/images/inspiration/09_premium_architektur_kueche.webp'
import imgLicht from '../assets/images/inspiration/03_wohnliche_kueche.webp'
import imgArbeitsplatte from '../assets/images/inspiration/06_materialien_und_details.webp'
import imgOffen from '../assets/images/inspiration/07_kueche_mit_insel.webp'
import imgFronten from '../assets/images/inspiration/10_favoriten_wohnkueche_luxus.webp'
import imgBeratung from '../assets/images/vorher-nachher/11_beratung_kundenmoment.webp'
import imgStauraum from '../assets/images/inspiration/08_kleine_kueche_clever_geplant.webp'
import imgGeraete from '../assets/images/inspiration/02_moderne_kueche.webp'
import imgPflege from '../assets/images/inspiration/05_helle_kueche.webp'
import imgTopicPlanung from '../assets/images/inspiration/07_kueche_mit_insel.webp'
import imgTopicMaterial from '../assets/images/inspiration/06_materialien_und_details.webp'
import imgTopicInsp from '../assets/images/inspiration/10_favoriten_wohnkueche_luxus.webp'

export const categories = [
  'Alle Themen', 'Planung', 'Materialien', 'Licht', 'Stauraum', 'Geräte', 'Inspiration', 'Pflege', 'Design',
]

export const journalArticles = [
  {
    "slug": "kueche-im-neubau-planen",
    "lastModified": "2026-11-26",
    "title": "Küche im Neubau planen: Was du wann entscheiden musst",
    "category": "Planung",
    "read": "6 Min.",
    "teaser": "Im Neubau wird die Küche oft zu spät geplant – dann liegen Wasser und Strom schon an der falschen Stelle. Was vor Rohinstallation, Estrich und Fliesen feststehen sollte.",
    "metaTitle": "Küche im Neubau planen: Zeitplan und Anschlüsse | VIDEKO",
    "metaDescription": "Küchenplanung im Neubau: wann Anschlüsse, Insel, Dunstabzug, Boden und Aufmaß entschieden werden müssen – mit Hinweisen für Bauträger-Wohnungen.",
    "intro": "Im Neubau hast du einen großen Vorteil: Wasser, Strom und Abluft können genau dort hin, wo die Küche sie braucht. Der Vorteil verschwindet aber, sobald Leitungen verlegt und Wände verputzt sind. Wer die Küche erst plant, wenn der Rohbau fertig ist, plant um bestehende Anschlüsse herum. Hier steht, was du in welcher Bauphase entscheiden solltest.",
    "sections": [
      {
        "h": "Vor der Rohinstallation: Grundriss der Küche festlegen",
        "p": "Bevor Elektriker und Installateur Leitungen ziehen, sollte die Küche zumindest im Grundriss stehen: Wo sitzt die Spüle, wo das Kochfeld, wo Kühlschrank und Backofen? Gibt es eine Insel oder Halbinsel? Diese Entscheidung bestimmt alle weiteren Anschlüsse. Eine Entwurfsplanung reicht dafür – Fronten, Farben und Griffe können später folgen."
      },
      {
        "h": "Wasser und Abwasser",
        "p": "Spüle und Geschirrspüler brauchen Zu- und Abwasser, der Abfluss zusätzlich ausreichend Gefälle. Liegt die Spüle in einer Insel, müssen die Leitungen im Boden geführt werden – das geht nur vor dem Estrich. Plane auch gleich mit, ob ein Wasseranschluss für Kühlschrank oder Kaffeevollautomat gewünscht ist."
      },
      {
        "h": "Strom: Kochfeld, Geräte und Steckdosen",
        "p": "Kochfeld und Backofen brauchen in der Regel einen eigenen Herdanschluss, viele Großgeräte einen eigenen Stromkreis. Lege fest, wo über der Arbeitsplatte Steckdosen sitzen sollen – zu wenige Steckdosen gehören zu den häufigsten Ärgernissen in fertigen Küchen. Auch Zuleitungen für Unterbau- und Nischenbeleuchtung, Hängelampen über Insel oder Tisch und gegebenenfalls Steckdosen in der Insel müssen jetzt eingeplant werden."
      },
      {
        "h": "Dunstabzug: Abluft oder Umluft klären",
        "p": "Neubauten sind sehr dicht gebaut und haben oft eine Lüftungsanlage. Ob Abluft nach außen möglich und sinnvoll ist, hängt von Wanddurchbruch, Lüftungskonzept und einer eventuell vorhandenen Feuerstätte ab. Das muss mit Architekt oder Lüftungsplaner abgestimmt werden, bevor die Fassade fertig ist. Umluft kommt ohne Durchbruch aus, braucht aber Platz für Filter und regelmäßige Filterpflege."
      },
      {
        "h": "Boden: unter der Küche durch oder nicht?",
        "p": "Früh entscheiden solltest du, ob der Bodenbelag unter der Küche durchläuft oder an der Sockelkante endet. Das beeinflusst Arbeitshöhe, Sockelhöhe und spätere Umbauten. Läuft der Belag durch, lässt sich die Küche später leichter tauschen; endet er an der Küche, sparst du Material, legst dich aber auf den Grundriss fest."
      },
      {
        "h": "Wohnung vom Bauträger: Fristen für Sonderwünsche beachten",
        "p": "Kaufst du eine Neubauwohnung, ist die Küche häufig nicht im Kaufpreis enthalten. Die Lage der Anschlüsse ist dann im Installationsplan des Bauträgers festgelegt. Änderungen sind meist nur als Sonderwunsch und nur bis zu einer bestimmten Bauphase möglich. Fordere den Installationsplan früh an, plane die Küche darauf und reiche gewünschte Änderungen rechtzeitig ein."
      },
      {
        "h": "Nach Putz und Estrich: verbindliches Aufmaß",
        "p": "Die Planung entsteht nach Bauplänen, bestellt wird aber erst nach einem Aufmaß im fertigen Raum. Pläne und Wirklichkeit weichen im Bau oft um einige Zentimeter ab, und genau diese Zentimeter entscheiden über Passstücke, Arbeitsplatte und Geräte. Lieferzeiten der Hersteller solltest du dabei einplanen, damit die Küche zum Einzug fertig ist – frag beim Studio nach dem aktuellen Stand."
      },
      {
        "h": "Kurzer Zeitplan",
        "p": "Entwurfsplanung: vor der Rohinstallation. Anschlüsse und Lüftung: mit Elektriker, Installateur und Architekt abstimmen, bevor Leitungen verlegt werden. Bodenaufbau: vor dem Estrich. Feinplanung von Fronten, Arbeitsplatte und Geräten: parallel zum Innenausbau. Aufmaß und Bestellung: nach Putz und Estrich. Montage: nach Malerarbeiten und Bodenbelag."
      },
      {
        "h": "Neubauküche mit VIDEKO",
        "p": "Wir planen Küchen in Würzburg und der Region mit 3D-Planung, Aufmaß und Montage. Wenn du früh kommst, können wir die Anschlusspositionen aus der Küchenplanung an deine Handwerker weitergeben – das spart Änderungen auf der Baustelle."
      }
    ],
    "fazit": "Im Neubau ist der beste Zeitpunkt für die Küchenplanung früher, als die meisten denken: bevor die erste Leitung liegt. Dann passt die Küche zum Haus und nicht umgekehrt.",
    "image": imgOffen
  },
  {
    "slug": "kueche-erneuern-oder-neu-kaufen",
    "lastModified": "2026-11-26",
    "title": "Alte Küche erneuern oder neue kaufen? Eine Entscheidungshilfe",
    "category": "Planung",
    "read": "5 Min.",
    "teaser": "Fronten, Arbeitsplatte oder Geräte tauschen – oder gleich ganz neu? Woran du erkennst, ob sich ein Teiltausch lohnt und wann eine neue Küche die bessere Wahl ist.",
    "metaTitle": "Küche erneuern oder neu kaufen? Entscheidungshilfe | VIDEKO",
    "metaDescription": "Fronten tauschen, neue Arbeitsplatte, neue Geräte oder komplett neue Küche? Kriterien zu Korpus, Grundriss, Anschlüssen und Alltag für eine ehrliche Entscheidung.",
    "intro": "Nicht jede Küche, die alt aussieht, muss raus. Und nicht jede Küche, die noch gut aussieht, funktioniert im Alltag. Die Frage „erneuern oder neu?“ lässt sich mit ein paar Prüfpunkten ziemlich ehrlich beantworten. Entscheidend ist, ob das Problem an der Oberfläche liegt oder in der Planung.",
    "sections": [
      {
        "h": "Zuerst prüfen: Ist der Korpus noch gut?",
        "p": "Die Schrankkörper sind das Gerüst der Küche. Schau dir besonders den Spülenschrank an: Ist der Boden aufgequollen oder fleckig, gab es einen Wasserschaden? Hängen Türen schief, obwohl die Scharniere nachgestellt wurden? Lassen sich Schubkästen leicht und vollständig öffnen? Ist der Korpus beschädigt, lohnt sich ein Tausch von Fronten oder Arbeitsplatte meist nicht."
      },
      {
        "h": "Wenn nur die Optik stört: Fronten tauschen",
        "p": "Sind Korpus und Beschläge in Ordnung und gefällt dir nur die Optik nicht, können neue Fronten viel verändern. Voraussetzung ist, dass passende Fronten für Maße und Bohrbild deiner Schränke erhältlich sind. Bei älteren Küchen oder Herstellern, die es nicht mehr gibt, ist das nicht immer der Fall. Neue Griffe und eine neue Arbeitsplatte verstärken die Wirkung."
      },
      {
        "h": "Wenn die Arbeitsfläche das Problem ist: Arbeitsplatte tauschen",
        "p": "Eine abgenutzte, aufgequollene oder zu kleine Arbeitsplatte lässt sich häufig einzeln ersetzen. Dafür müssen die Unterschränke stabil und waagerecht stehen. Spüle und Kochfeld werden dabei aus- und wieder eingebaut oder gleich mit erneuert. Wichtig: Neue Ausschnitte müssen zu den Geräten passen, die du behalten oder neu kaufen willst."
      },
      {
        "h": "Wenn Geräte schwächeln: einzeln ersetzen",
        "p": "Viele Einbaugeräte folgen gängigen Nischenmaßen, sodass ein Backofen, Geschirrspüler oder Kühlschrank einzeln getauscht werden kann. Prüfe vor dem Kauf das Nischenmaß im Datenblatt des neuen Geräts und miss die vorhandene Nische nach. Bei Kühlgeräten unterscheiden sich außerdem Montagearten wie Schlepptür oder Festtür."
      },
      {
        "h": "Wann eine neue Küche die bessere Wahl ist",
        "p": "Eine neue Küche ist meist sinnvoll, wenn das Problem in der Planung liegt: zu wenig Arbeitsfläche, umständliche Laufwege, zu wenig Stauraum, Türen statt Auszüge oder ein Grundriss, der nicht mehr zu deinem Alltag passt. Auch wenn Anschlüsse verlegt werden sollen, eine Wand fällt oder Wasserschäden den Korpus angegriffen haben, kommst du mit einem Teiltausch nicht weit."
      },
      {
        "h": "Entscheidungshilfe in fünf Fragen",
        "p": "Ist der Korpus intakt? Wenn nein: neu. Funktioniert der Grundriss im Alltag? Wenn nein: neu. Stört vor allem die Optik? Dann Fronten und gegebenenfalls Arbeitsplatte prüfen. Ist vor allem die Arbeitsplatte verschlissen? Dann Arbeitsplatte tauschen. Fallen einzelne Geräte aus? Dann Geräte einzeln ersetzen. Wenn drei oder mehr Punkte zusammenkommen, rechne beide Varianten nebeneinander – oft liegt eine neue Küche dann näher als gedacht."
      },
      {
        "h": "Ehrliche Einschätzung bei VIDEKO",
        "p": "Bei einem Beratungstermin in Würzburg schauen wir uns an, was deine Küche noch kann und wo es hakt. Wenn eine neue Arbeitsplatte reicht, sagen wir das. Wenn sich ein Teiltausch nicht lohnt, sagen wir das auch."
      }
    ],
    "fazit": "Erneuern lohnt sich, wenn der Korpus gut ist und dich vor allem Oberfläche oder einzelne Geräte stören. Liegt das Problem in Grundriss, Stauraum oder Anschlüssen, ist eine neue Küche die ehrlichere Lösung.",
    "image": imgFehler
  },
  {
    "slug": "kueche-ausmessen-anleitung",
    "lastModified": "2026-11-26",
    "title": "Küche ausmessen: So skizzierst du deinen Raum für die Planung",
    "category": "Planung",
    "read": "5 Min.",
    "teaser": "Mit Zollstock, Papier und Handy zur brauchbaren Raumskizze: welche Maße, Anschlüsse und Hindernisse für die erste Küchenplanung wirklich zählen.",
    "metaTitle": "Küche ausmessen: Anleitung für die Raumskizze | VIDEKO",
    "metaDescription": "Küche selbst ausmessen: Wandlängen, Raumhöhe, Fenster, Türen, Wasser- und Stromanschlüsse richtig erfassen – als Grundlage für die erste Küchenplanung.",
    "intro": "Für eine erste Küchenplanung brauchst du keinen Laser und keinen Bauplan. Eine saubere Skizze mit den richtigen Maßen reicht, damit aus Ideen ein realistischer Entwurf wird. Diese Anleitung zeigt, was du messen solltest – und was du getrost dem verbindlichen Aufmaß überlassen kannst.",
    "sections": [
      {
        "h": "Was du brauchst",
        "p": "Einen Zollstock oder ein Maßband, Papier und Stift, dein Handy für Fotos und etwa eine halbe Stunde Zeit. Zeichne den Raum von oben als einfache Skizze. Sie muss nicht maßstäblich sein; wichtig ist, dass jedes Maß eindeutig einer Wand zugeordnet ist."
      },
      {
        "h": "Wandlängen messen",
        "p": "Beginne an einer Ecke und miss im Uhrzeigersinn jede Wand. Miss möglichst auf drei Höhen: knapp über dem Boden, auf Arbeitshöhe und unter der Decke. Weichen die Werte voneinander ab, ist die Wand nicht gerade oder die Ecke nicht rechtwinklig – das ist im Altbau normal und wichtig für die Planung. Notiere alle Maße durchgehend in derselben Einheit."
      },
      {
        "h": "Raumhöhe, Fenster und Türen",
        "p": "Miss die Raumhöhe an mehreren Stellen. Bei Fenstern brauchst du Breite, Höhe, Brüstungshöhe vom Boden bis zur Fensterbank und den Abstand zur nächsten Ecke. Notiere, ob das Fenster nach innen aufgeht und ob ein Heizkörper darunter sitzt. Bei Türen: Breite, Abstand zur Ecke und in welche Richtung die Tür aufschlägt."
      },
      {
        "h": "Anschlüsse eintragen",
        "p": "Markiere in der Skizze, wo Wasserzulauf und Abfluss aus der Wand kommen, jeweils mit Höhe vom Boden und Abstand zur nächsten Ecke. Genauso für die Herdanschlussdose, vorhandene Steckdosen, Lichtauslässe, einen Gasanschluss und eine eventuelle Abluftöffnung. Diese Punkte entscheiden, wo Spüle und Kochfeld ohne Umbau stehen können."
      },
      {
        "h": "Hindernisse nicht vergessen",
        "p": "Heizkörper, Rohre, Vorsprünge, Schornsteinzüge, Fensterbänke, Lüftungsgitter und Sicherungskästen sind in der Planung genauso wichtig wie Wände. Miss ihre Breite, Tiefe und Höhe und trage sie mit Abstand zur Ecke ein."
      },
      {
        "h": "Fotos machen",
        "p": "Fotografiere jede Wand frontal und jede Ecke. Fotos zeigen Details, die in keiner Skizze stehen: wie die Leitungen aus der Wand kommen, wo Fliesen enden, wie der Boden aussieht. Bring sie zum Beratungstermin mit oder schick sie vorab."
      },
      {
        "h": "Was die Skizze nicht ersetzt",
        "p": "Deine Skizze reicht für einen ersten Entwurf und eine realistische Einschätzung. Bestellt wird eine Küche aber nur nach einem verbindlichen Aufmaß vor Ort, bei dem Wände, Winkel und Anschlüsse genau erfasst werden. Bei VIDEKO übernehmen wir dieses Aufmaß im Rahmen der Planung."
      },
      {
        "h": "Checkliste",
        "p": "Skizze von oben. Alle Wandlängen auf drei Höhen. Raumhöhe. Fenster mit Brüstungshöhe und Öffnungsrichtung. Türen mit Aufschlagrichtung. Wasser, Abfluss, Herdanschluss, Steckdosen, Licht, Gas, Abluft mit Höhe und Abstand. Heizkörper und Vorsprünge. Fotos jeder Wand."
      }
    ],
    "fazit": "Eine gute Raumskizze spart im ersten Gespräch viel Rätselraten. Messen musst du dafür nicht perfekt – nur vollständig.",
    "image": imgStauraum
  },
  {
    "slug": "kuechenangebote-vergleichen",
    "lastModified": "2026-11-26",
    "title": "Küchenangebote vergleichen: So legst du zwei Angebote richtig nebeneinander",
    "category": "Planung",
    "read": "6 Min.",
    "teaser": "Zwei Küchenangebote, zwei Endsummen – und trotzdem kaum vergleichbar. So bringst du Positionen, Geräte, Leistungen und Zahlungsplan auf einen gemeinsamen Nenner.",
    "metaTitle": "Küchenangebote vergleichen: Positionen richtig prüfen | VIDEKO",
    "metaDescription": "Küchenangebote sinnvoll vergleichen: Leistungsumfang, Gerätemodelle, Arbeitsplatte, Aufmaß, Montage, Anschlüsse und Zahlungsplan Schritt für Schritt prüfen.",
    "intro": "Wer zwei oder drei Küchenangebote vor sich liegen hat, schaut zuerst auf die Endsumme. Das ist verständlich, führt aber oft in die Irre: Das eine Angebot enthält Montage und Anschlüsse, das andere nicht. Hier stehen konkrete Gerätemodelle, dort nur „Backofen, Edelstahl“. Bevor du Preise vergleichst, musst du die Angebote vergleichbar machen. Diese Anleitung zeigt dir, wie – Position für Position.",
    "sections": [
      {
        "h": "Schritt 1: Gleiche Grundlage schaffen",
        "p": "Ein Vergleich funktioniert nur, wenn beide Angebote auf demselben Raum und denselben Wünschen beruhen. Prüfe zuerst: Liegt beiden derselbe Grundriss zugrunde, mit gleichen Wandlängen, Fenstern und Türen? Sind Anzahl und Breite der Schränke ungefähr gleich? Ist es dieselbe Zeile, dasselbe L oder dieselbe Insel? Wenn ein Studio mit einer Skizze vom Handy plant und das andere nach einem Aufmaß vor Ort, sind das zwei verschiedene Küchen – auch wenn sie auf dem Bildschirm ähnlich aussehen."
      },
      {
        "h": "Schritt 2: Leistungen als Liste nebeneinanderlegen",
        "p": "Nimm ein Blatt und schreib links die Positionen untereinander, daneben eine Spalte je Angebot. Für jede Position trägst du ein: enthalten, nicht enthalten oder unklar. Die wichtigsten Zeilen sind: Planung und Beratung, verbindliches Aufmaß vor Ort, Lieferung bis in den Raum, Montage der Möbel, Einbau der Geräte, Ausschnitte für Spüle und Kochfeld, Anschluss von Wasser und Abwasser, Elektroanschluss der Geräte, Wandabschluss oder Nischenrückwand, Beleuchtung, Abbau und Entsorgung der alten Küche, Verpackungsentsorgung. Jedes „unklar“ ist eine Frage an das Studio, bevor du weiter vergleichst."
      },
      {
        "h": "Schritt 3: Geräte mit Modellnummer prüfen",
        "p": "Bei Elektrogeräten entscheidet die genaue Modellbezeichnung. „Kochfeld mit Dunstabzug“ oder „Geschirrspüler vollintegriert“ sagt wenig über Ausstattung, Lautstärke, Energieeffizienz oder Garantie. Bitte um die vollständige Modellnummer jedes Geräts. Damit kannst du Datenblätter vergleichen und siehst, ob ein Angebot nur günstiger ist, weil einfachere Geräte eingeplant sind. Achte auch darauf, ob Zubehör wie Umluftset, Filter oder Teleskopauszüge separat berechnet wird."
      },
      {
        "h": "Schritt 4: Arbeitsplatte genau beschreiben lassen",
        "p": "Die Arbeitsplatte ist eine der Positionen, die sich zwischen Angeboten am stärksten unterscheiden. Gleiche ab: Material und Dekor, Stärke, Kantenausführung, Anzahl und Art der Ausschnitte (aufgesetzt, flächenbündig, unterbaut), Wandabschlussleiste oder Rückwand, und ob die Platte nach Aufmaß gefertigt wird. Bei Stein- und Keramikplatten wird meist erst nach Montage der Unterschränke gemessen – frag nach, ob das im Preis enthalten ist und wie lange es dauert."
      },
      {
        "h": "Schritt 5: Was nicht im Angebot steht",
        "p": "Viele Unterschiede stecken in dem, was fehlt. Typische Lücken: Elektro- und Wasserinstallation, die über den reinen Geräteanschluss hinausgeht, etwa neue Steckdosen oder verlegte Leitungen. Wand- und Bodenarbeiten, wenn die alte Küche Spuren hinterlässt. Anpassungen an schiefe Wände oder Dachschrägen. Zusätzliche Anfahrten, falls die Montage unterbrochen werden muss. Frag ausdrücklich: Was müsste ich selbst organisieren, damit diese Küche fertig benutzbar ist?"
      },
      {
        "h": "Schritt 6: Termine, Zahlung und Änderungen",
        "p": "Zum Vergleich gehört auch das Kleingedruckte. Wie viel Anzahlung wird verlangt, und wann ist der Rest fällig – bei Lieferung oder nach abgeschlossener Montage? Gibt es einen verbindlichen Liefertermin oder nur eine Kalenderwoche? Was passiert, wenn du nach der Bestellung noch etwas ändern möchtest? Und wer ist dein Ansprechpartner, wenn nach der Montage eine Tür nachjustiert werden muss?"
      },
      {
        "h": "Schritt 7: Erst jetzt den Preis vergleichen",
        "p": "Wenn beide Angebote denselben Raum, dieselben Leistungen und vergleichbare Geräte abbilden, ist die Endsumme aussagekräftig. Rechne die Positionen, die in einem Angebot fehlen, als Schätzung hinzu oder lass sie dir nachreichen. Erst dann siehst du, welches Angebot für dein Budget tatsächlich mehr Küche liefert. Ein hoher Rabatt auf einen hohen Listenpreis ist dabei kein Qualitätsmerkmal, sondern nur eine andere Art, denselben Endpreis zu zeigen."
      },
      {
        "h": "Kurze Checkliste zum Ausdrucken",
        "p": "Gleicher Grundriss und Aufmaß vor Ort? Alle Leistungen von Lieferung bis Entsorgung aufgelistet? Gerätemodelle mit Nummer? Arbeitsplatte mit Material, Stärke, Kante und Ausschnitten? Anschlüsse Wasser und Strom enthalten? Eigenleistungen klar benannt? Zahlungsplan und Termin schriftlich? Ansprechpartner nach der Montage bekannt? Wenn du jede Frage für jedes Angebot beantworten kannst, vergleichst du wirklich Küchen – und nicht nur Zahlen."
      },
      {
        "h": "Wie wir unsere Angebote aufbauen",
        "p": "Bei VIDEKO in Würzburg gehören Beratung, 3D-Planung, Aufmaß und Küchenmontage zu unserem Angebot; angrenzende Arbeiten koordinieren wir auf Wunsch mit Fachpartnern. Wenn dir in unserem Angebot eine Position unklar ist, frag nach – du sollst es genau so prüfen können, wie hier beschrieben. Und gern auch neben ein anderes legen."
      }
    ],
    "fazit": "Ein gutes Küchenangebot ist eines, das du ohne Rückfragen verstehst. Je klarer Positionen, Geräte und Leistungen beschrieben sind, desto weniger Überraschungen gibt es bei Lieferung und Montage.",
    "image": imgBeratung
  },
  {
    "slug": "kuechenstudio-wuerzburg-checkliste",
    "lastModified": "2026-11-26",
    "title": "Küchenstudio in Würzburg finden: 10 Fragen vor dem Küchenkauf",
    "category": "Planung",
    "read": "6 Min.",
    "teaser": "Was gehört in ein vergleichbares Küchenangebot? Zehn Fragen zu Aufmaß, Geräten, Montage, Umbau und Kosten, die du jedem Küchenstudio stellen kannst.",
    "metaTitle": "Küchenstudio Würzburg: Checkliste für den Küchenkauf | VIDEKO",
    "metaDescription": "Küchenstudios in Würzburg vergleichen: 10 konkrete Fragen zu Planung, Angebot, Aufmaß, Elektrogeräten, Montage und Küchenrenovierung.",
    "intro": "Wer in Würzburg eine Küche kaufen möchte, hat mehrere Anlaufstellen. Entscheidend ist nicht allein die schönste Ausstellung oder der größte Rabatt, sondern was du für dein Budget tatsächlich bekommst. Mit diesen zehn Fragen kannst du Angebote unterschiedlicher Küchenstudios sinnvoll vergleichen – auch unser eigenes.",
    "sections": [
      {
        "h": "1. Was ist im Angebot enthalten?",
        "p": "Bitte um eine nachvollziehbare Aufstellung von Möbeln, Arbeitsplatte, Geräten, Lieferung, Montage und optionalen Arbeiten. Vergleiche die Gesamtsumme bei gleichem Umfang, nicht nur den Rabatt auf einen Ausgangspreis."
      },
      {
        "h": "2. Welche Geräte sind konkret eingeplant?",
        "p": "Lass dir Hersteller und Modellbezeichnungen geben. Zwei optisch ähnliche Backöfen können unterschiedliche Funktionen haben. Nur mit Modellnummern kannst du Ausstattung, Verbrauch und Preis sinnvoll vergleichen."
      },
      {
        "h": "3. Wer nimmt das verbindliche Aufmaß?",
        "p": "Ein Grundriss ist eine gute Basis, ersetzt aber kein Aufmaß am tatsächlichen Raum. Kläre, wann Wände, Fenster, Leitungen und Höhen aufgenommen werden und wer Abweichungen vor der Bestellung prüft."
      },
      {
        "h": "4. Kann ich den Entwurf vor der Bestellung prüfen?",
        "p": "Eine 3D-Ansicht hilft bei Optik und Anordnung. Prüfe zusätzlich Maße, Öffnungsrichtungen, Auszüge, Steckdosen, Durchgänge und Gerätehöhen. Lass dir erläutern, welche Details im Vertrag festgehalten werden."
      },
      {
        "h": "5. Welche Eigenschaften haben Fronten und Arbeitsplatte?",
        "p": "Frage nach Material, Oberfläche, Kanten, Pflege und Herstellervorgaben. Bei Keramik, Naturstein, Holz und Schichtstoff unterscheiden sich unter anderem Gewicht, Empfindlichkeit und Pflegeaufwand."
      },
      {
        "h": "6. Wer übernimmt die Montage?",
        "p": "Kläre, wer die Küche liefert und montiert, was mit Anschlüssen passiert und welche Arbeiten nicht enthalten sind. Frage auch, wie die Endabnahme und die Bearbeitung offener Punkte organisiert werden."
      },
      {
        "h": "7. Wer kümmert sich um den Raum?",
        "p": "Bei einer Renovierung müssen alte Küche, Elektroanschlüsse, Wasser, Boden, Wände, Decke und Licht zeitlich zusammenpassen. Kläre, welche Gewerke separat beauftragt werden und wer die Abstimmung übernimmt."
      },
      {
        "h": "8. Wie verbindlich sind Termine?",
        "p": "Frage nach dem geplanten Liefer- und Montagezeitraum, notwendigen Vorarbeiten und dem Vorgehen bei Änderungen. Wenn ein Termin für deinen Einzug entscheidend ist, sollte er im Vertrag entsprechend geklärt sein."
      },
      {
        "h": "9. Wie werden Zahlung und spätere Änderungen geregelt?",
        "p": "Lies Zahlungsplan, Leistungsumfang und Regelungen zu Änderungen vor der Unterschrift. Lass dir Zusatzkosten schriftlich bestätigen, bevor weitere Arbeiten beauftragt werden."
      },
      {
        "h": "10. Was passiert nach der Montage?",
        "p": "Kläre, wer bei Fehlteilen, Nacharbeiten oder Fragen zu Geräten und Pflege erreichbar ist. Eine gemeinsame Abnahme mit dokumentierten offenen Punkten schafft Klarheit."
      },
      {
        "h": "So arbeitet VIDEKO in Würzburg",
        "p": "VIDEKO Küchen eG sitzt in der Hertzstraße 4, 97076 Würzburg. Wir bieten individuelle Küchenberatung, 3D-Planung, Aufmaß und Küchenmontage an. Auf Wunsch koordinieren wir auch angrenzende Ausbauarbeiten mit Fachpartnern. Persönliche Beratung ist nach Terminvereinbarung möglich; den aktuellen Stand der Ausstellung findest du auf unserer Studio-Seite."
      }
    ],
    "fazit": "Vergleiche Leistungen und vertragliche Zusagen statt Werberabatte. Ein gutes Angebot beantwortet deine Fragen, bevor du unterschreibst.",
    "image": imgBeratung
  },
  {
    "slug": "kuechenrenovierung-wuerzburg-ablauf",
    "lastModified": "2026-11-26",
    "title": "Küchenrenovierung in Würzburg: In welcher Reihenfolge wird umgebaut?",
    "category": "Planung",
    "read": "5 Min.",
    "teaser": "Neue Küche, neuer Boden, neue Anschlüsse? Ein praktischer Ablaufplan für die Abstimmung von Küchenplanung und Handwerk.",
    "metaTitle": "Küchenrenovierung Würzburg: Ablauf und Gewerke | VIDEKO Küchen",
    "metaDescription": "Küche renovieren: Welche Reihenfolge ist sinnvoll? Planung, Rückbau, Elektro, Wasser, Boden, Wände, Decke und Küchenmontage im Überblick.",
    "intro": "Wer eine alte Küche durch eine neue ersetzt, tauscht oft nicht nur Möbel aus. Werden Boden, Anschlüsse, Beleuchtung oder Wände geändert, hängen mehrere Gewerke voneinander ab. Eine gute Reihenfolge vermeidet, dass die neue Küche schon geliefert wird, während der Raum noch nicht bereit ist.",
    "sections": [
      {
        "h": "1. Bestand und Wunschgrundriss klären",
        "p": "Dokumentiere Raummaße, Fenster, Türen, vorhandene Anschlüsse, Bodenaufbau und Geräte. Kläre, welche Teile bleiben und welche verändert werden sollen. Die genaue Reihenfolge richtet sich nach dem Bestand und muss im Einzelfall abgestimmt werden."
      },
      {
        "h": "2. Küche und Anschlüsse gemeinsam planen",
        "p": "Lege Positionen von Spüle, Geschirrspüler, Kochfeld, Kühlschrank und Beleuchtung fest, bevor Installationsarbeiten beginnen. Aus dem Küchenentwurf lassen sich die Anforderungen an Strom, Wasser und Abluft ableiten. Die technische Ausführung und Prüfung übernimmt das zuständige Fachgewerk."
      },
      {
        "h": "3. Umfang und Schnittstellen schriftlich festhalten",
        "p": "Bestimme, wer Rückbau, Entsorgung, Elektroarbeiten, Wasseranschlüsse, Boden, Malerarbeiten oder Deckenarbeiten übernimmt. Halte fest, wer welche Leistung beauftragt und welche Vorleistungen bis zum Montagetermin abgeschlossen sein müssen."
      },
      {
        "h": "4. Rückbau und Rohinstallation",
        "p": "Nach der fachgerechten Trennung der betroffenen Anschlüsse kann die alte Küche demontiert werden. Wenn Leitungen oder Wände verändert werden, sollten die notwendigen Arbeiten vor dem endgültigen Oberflächenaufbau koordiniert sein. Trocknungs- und Prüfzeiten müssen berücksichtigt werden."
      },
      {
        "h": "5. Boden, Wände und Decke abstimmen",
        "p": "Der endgültige Bodenaufbau verändert Höhen und damit möglicherweise die Küchenplanung. Bei schwimmend verlegten Belägen sind die Herstellervorgaben zur Aufstellung schwerer Einbauten zu beachten. Auch die Reihenfolge von Decken-, Wand- und Bodenarbeiten hängt von Material und Bauweise ab."
      },
      {
        "h": "6. Kontrollaufmaß und Bestellung",
        "p": "Ob das endgültige Aufmaß vor oder nach einzelnen Vorarbeiten erfolgt, hängt von den vereinbarten Maßen und dem Projekt ab. Entscheidend ist, dass die Bestellung auf einer belastbaren Planung basiert und relevante spätere Änderungen berücksichtigt werden."
      },
      {
        "h": "7. Montage und Endabnahme",
        "p": "Wenn Raum und vereinbarte Vorleistungen bereit sind, folgen Lieferung, Montage und die erforderlichen fachgerechten Anschlüsse. Prüfe am Ende Oberflächen, Funktionen und Vollständigkeit gemeinsam mit den Verantwortlichen; dokumentiere offene Punkte."
      },
      {
        "h": "Küchenrenovierung mit VIDEKO",
        "p": "Wir planen die Küche und auf Wunsch den gesamten Küchenraum gemeinsam. Angrenzende Gewerke wie Elektro, Boden, Trockenbau oder Spanndecke koordinieren wir mit Fachpartnern. Welche Leistungen benötigt werden und wie die Beauftragung im konkreten Projekt erfolgt, klären wir in der Beratung."
      }
    ],
    "fazit": "Die Küche und die Vorarbeiten müssen zusammen geplant werden. Ein abgestimmter Terminplan ist wichtiger als eine starre Standardreihenfolge.",
    "image": imgOffen
  },
  {
    slug: 'licht-in-der-kueche',
    lastModified: '2026-08-24',
    title: 'Licht in der Küche: Warum gutes Licht mehr kann als nur hell machen',
    category: 'Licht',
    read: '4 Min.',
    image: imgLicht,
    teaser: 'Hauptsache hell? Von wegen. Warum Arbeitslicht, indirektes Licht und Lichtfarbe darüber entscheiden, ob deine Küche wirkt – oder nur leuchtet.',
    metaTitle: 'Licht in der Küche richtig planen | VIDEKO Küchen',
    metaDescription: 'Gute Küchenbeleuchtung ist mehr als eine Lampe an der Decke. Erfahre, wie Arbeitslicht, indirektes Licht und Lichtfarbe deine Küche besser machen.',
    intro: 'Küchenlicht wird oft unterschätzt. Hauptsache hell, denkt man. Dann steht man abends am Schneidebrett, wirft sich selbst Schatten auf die Zwiebel und fragt sich, warum Kochen plötzlich nach OP-Saal mit schlechter Laune aussieht.',
    sections: [
      { p: 'Gutes Licht in der Küche hat mehrere Aufgaben. Es soll Arbeitsflächen klar ausleuchten, den Raum angenehm machen und die Materialien so zeigen, wie sie wirklich wirken. Eine Küche mit schöner Front, starker Arbeitsplatte und warmem Holz kann mit falschem Licht aussehen wie Lagerhalle auf Diät. Andersherum kann ein sauber geplantes Lichtkonzept selbst eine ruhige Küche richtig hochwertig wirken lassen.' },
      { h: 'Die richtige Mischung', p: 'Wichtig ist die Mischung: Arbeitslicht, indirektes Licht und Stimmungslicht. Über der Arbeitsfläche brauchst du klares, blendfreies Licht. Unter Hängeschränken, in Nischen oder Regalen kann indirektes Licht Tiefe schaffen. Und für den Abend darf es gern wärmer werden, damit die Küche nicht aussieht, als würdest du gleich eine Steuerprüfung vorbereiten.' },
      { h: 'Lichtfarbe', p: 'Auch die Lichtfarbe spielt eine Rolle. Zu kalt wirkt schnell technisch. Zu warm kann Farben verfälschen. Gerade bei Fronten, Arbeitsplatten und Böden ist das wichtig. Was im Studio schön aussieht, sollte bei dir zuhause nicht plötzlich komplett anders wirken.' },
      { p: 'VIDEKO plant Licht nicht als Deko am Ende, sondern als Teil des Raums. Denn Licht entscheidet, ob eine Küche nur gut fotografiert aussieht – oder jeden Tag gut funktioniert.' },
    ],
    fazit: 'Licht ist kein Extra. Licht ist Planung.',
  },
  {
    slug: 'welche-arbeitsplatte-passt-zu-mir',
    lastModified: '2026-08-24',
    title: 'Welche Arbeitsplatte passt zu mir? Holz, Stein, Keramik oder Compact',
    category: 'Materialien',
    read: '5 Min.',
    image: imgArbeitsplatte,
    teaser: 'Hier landet Einkauf, heißer Topf, Rotweinfleck und halbe Familie. Ein ehrlicher Wegweiser zur Arbeitsplatte, die deinen Alltag überlebt.',
    metaTitle: 'Welche Arbeitsplatte passt zu mir? | VIDEKO Küchen',
    metaDescription: 'Holz, Stein, Keramik oder Compact: Welche Küchenarbeitsplatte passt zu deinem Alltag, Stil und Anspruch? VIDEKO hilft bei der ehrlichen Entscheidung.',
    intro: 'Die Arbeitsplatte ist der Ort, an dem deine Küche wirklich leben muss. Hier landet der Einkauf, der heiße Topf, das Frühstücksbrett, der Rotweinfleck, der Brotteig und manchmal auch die halbe Familie. Wer hier nur nach Optik entscheidet, spielt Küchenroulette – mit Einsatz.',
    sections: [
      { p: 'Es gibt nicht die eine perfekte Arbeitsplatte. Es gibt nur die passende für deinen Alltag.' },
      { h: 'Holz', p: 'Holz wirkt warm, natürlich und wohnlich. Es bringt Charakter in den Raum, braucht aber Pflege und verzeiht nicht alles. Wer Holz liebt, muss akzeptieren, dass es lebt. Kleine Spuren gehören dazu. Das ist charmant – außer du erwartest sterile Perfektion. Dann wird es eine Beziehung mit Konfliktpotenzial.' },
      { h: 'Naturstein', p: 'Naturstein ist stark, individuell und wirkt hochwertig. Jede Platte ist ein Unikat. Je nach Stein kann sie aber empfindlicher gegenüber Säuren oder Flecken sein. Zitrone, Rotwein und Öl sind dann keine Freunde, sondern kleine Endgegner mit Haushaltsrolle.' },
      { h: 'Keramik', p: 'Keramik ist sehr robust, hitzebeständig und pflegeleicht. Sie wirkt modern und hochwertig, kann aber je nach Ausführung kantiger und kühler erscheinen. Für viele Küchen ist Keramik eine starke Lösung, weil sie Alltag ziemlich gut wegsteckt.' },
      { h: 'Compact & Schichtstoff', p: 'Compact- oder Schichtstoffplatten sind oft unterschätzt. Sie können optisch stark aussehen, sind preislich meist attraktiver und im Alltag pflegeleicht. Nicht jede Küche braucht gleich den Material-Endboss, wenn eine saubere, robuste Lösung besser zum Budget passt.' },
      { p: 'Entscheidend ist nicht, welches Material am teuersten klingt. Entscheidend ist, wie du kochst, putzt, lebst und was dich im Alltag nervt. Bei VIDEKO schauen wir deshalb nicht nur auf Musterstücke. Wir fragen: Wie nutzt du deine Küche wirklich? Erst dann ergibt die Arbeitsplatte Sinn.' },
    ],
    fazit: 'Die beste Arbeitsplatte ist nicht die teuerste. Es ist die, die deinen Alltag überlebt und dabei gut aussieht.',
  },
  {
    slug: 'offene-oder-geschlossene-kueche',
    lastModified: '2026-08-24',
    title: 'Offene oder geschlossene Küche? Die ehrliche Antwort hängt von deinem Alltag ab',
    category: 'Planung',
    read: '4 Min.',
    image: imgOffen,
    teaser: 'Viel Pinterest, wenig gespülte Pfanne? Die echten Vor- und Nachteile von offen, geschlossen und dem cleveren Mittelweg.',
    metaTitle: 'Offene oder geschlossene Küche? | VIDEKO Küchen',
    metaDescription: 'Offene Küche oder geschlossene Küche? VIDEKO zeigt die echten Vor- und Nachteile für Alltag, Familie, Gerüche und Wohngefühl.',
    intro: 'Offene Küchen sehen auf Bildern fast immer gut aus. Viel Raum, schöne Insel, Licht, Menschen mit Wein in der Hand und niemand hat jemals eine Pfanne gespült. Die Realität ist manchmal weniger Pinterest und mehr: „Warum riecht das Sofa nach Bratkartoffeln?"',
    sections: [
      { h: 'Was offen wirklich bringt', p: 'Eine offene Küche verbindet Kochen, Essen und Wohnen. Das kann großartig sein. Du bist mittendrin, statt allein in einem kleinen Raum zu verschwinden. Gäste, Familie und Alltag laufen zusammen. Gerade wenn die Küche ein zentraler Lebensbereich werden soll, ist offen oft die richtige Richtung.' },
      { p: 'Aber offen bedeutet auch: Die Küche ist immer sichtbar. Teller, Geräte, Krümel und der eine Topf, der angeblich „gleich" gespült wird, gehören dann zum Wohnbild. Wer Ordnung liebt, muss planen. Wer Ordnung nur theoretisch sympathisch findet, braucht clevere Stauraumlösungen.' },
      { h: 'Wofür geschlossen punktet', p: 'Eine geschlossene Küche hat ebenfalls Vorteile. Gerüche bleiben besser getrennt, Geräusche stören weniger und man kann die Tür schließen, wenn es aussieht wie nach einem kleinen Mehlunfall. Für manche Grundrisse ist geschlossen sogar die bessere Lösung, weil der Raum dadurch klarer und ruhiger funktioniert.' },
      { h: 'Der Mittelweg', p: 'Dann gibt es noch den Mittelweg: halb offen, mit Schiebetüren, Glas, Durchgängen oder einer klaren Zonierung. Das ist oft spannender als die Grundsatzfrage offen oder geschlossen. Gute Planung fragt nicht: Was ist gerade Trend? Sie fragt: Wie lebst du wirklich? Bei VIDEKO geht es nicht darum, dir eine Kücheninsel einzureden, nur weil sie gut aussieht. Wenn sie passt: geil. Wenn nicht: lassen wir den Quatsch.' },
    ],
    fazit: 'Offen ist schön. Geschlossen ist praktisch. Richtig ist, was zu deinem Alltag passt.',
  },
  {
    slug: 'fronten-farben-materialien',
    lastModified: '2026-08-24',
    title: 'Fronten, Farben und Materialien: Warum Küche mehr ist als „hell oder dunkel"',
    category: 'Design',
    read: '4 Min.',
    image: imgFronten,
    teaser: 'Vor 47 Frontmustern und plötzlich Hunger? Warum nicht das Einzelmaterial zählt, sondern das Zusammenspiel aus Farbe, Licht und Pflege.',
    metaTitle: 'Fronten, Farben & Materialien richtig kombinieren | VIDEKO Küchen',
    metaDescription: 'Küche ist mehr als hell oder dunkel. VIDEKO erklärt, warum es bei Fronten, Farben und Materialien auf Zusammenspiel, Licht und Pflege ankommt.',
    intro: 'Viele Küchenentscheidungen beginnen mit einer scheinbar einfachen Frage: hell oder dunkel? Matt oder glänzend? Holz oder Stein? Klingt überschaubar. Bis man vor 47 Frontmustern steht und plötzlich nicht mehr weiß, ob man „Greige" mag oder nur Hunger hat.',
    sections: [
      { h: 'Das Zusammenspiel zählt', p: 'Fronten, Farben und Materialien bestimmen, wie eine Küche wirkt. Eine dunkle Küche kann edel und ruhig sein, aber in einem kleinen Raum auch schwer wirken. Helle Fronten schaffen Weite, können aber ohne Kontraste schnell langweilig werden. Holz bringt Wärme, Stein bringt Ruhe, Metall bringt Spannung. Die Kunst liegt nicht im Einzelmaterial, sondern im Zusammenspiel.' },
      { h: 'Licht verändert alles', p: 'Wichtig ist auch das Licht. Eine Farbe sieht im Studio anders aus als bei dir zuhause. Tageslicht, Kunstlicht, Boden, Wandfarbe und Raumgröße verändern die Wirkung. Deshalb ist es gefährlich, nur nach einem einzelnen Muster zu entscheiden. Ein Material muss im Raum gedacht werden.' },
      { h: 'Pflege nicht vergessen', p: 'Auch Pflege spielt eine Rolle. Manche Oberflächen sind wunderschön, aber empfindlich. Andere sind pflegeleicht, wirken dafür nüchterner. Es bringt nichts, wenn deine Küche im ersten Monat aussieht wie ein Designmagazin und danach wie ein Tatort für Fingerabdrücke.' },
      { p: 'Bei VIDEKO planen wir Materialien nicht isoliert. Wir schauen auf Raum, Licht, Nutzung und deinen Stil. Das Ziel ist keine Materialschlacht. Das Ziel ist ein Raum, der jeden Tag funktioniert und trotzdem besonders wirkt.' },
    ],
    fazit: 'Eine gute Küche entsteht nicht durch ein schönes Muster. Sie entsteht durch die richtige Komposition.',
  },
  {
    slug: 'vor-dem-beratungstermin-das-solltest-du-wissen',
    lastModified: '2026-08-24',
    title: 'Vor dem Beratungstermin: Das solltest du wirklich wissen',
    category: 'Planung',
    read: '3 Min.',
    image: imgBeratung,
    teaser: 'Du musst nicht alles wissen – aber Raum, Alltag und ein bisschen Ehrlichkeit machen deinen Termin deutlich besser. Den Rest machen wir zusammen.',
    metaTitle: 'Küchenberatung vorbereiten: Das solltest du wissen | VIDEKO Küchen',
    metaDescription: 'Was solltest du vor einer Küchenberatung wissen? VIDEKO zeigt, welche Infos, Wünsche und Fragen deinen Termin deutlich besser machen.',
    intro: 'Viele Menschen glauben, sie müssten vor dem ersten Beratungstermin schon alles wissen. Frontfarbe, Geräte, Maße, Budget, Insel ja oder nein, Griffleiste oder Griff, Spüle links, Backofen oben, Leben im Griff. Muss man nicht. Genau dafür ist Beratung da.',
    sections: [
      { h: 'Die Basics', p: 'Trotzdem hilft es, wenn du dir vorher ein paar Gedanken machst. Wichtig sind zuerst die Basics: Gibt es einen Grundriss? Maße? Fotos vom Raum? Wo sind Wasser, Strom, Fenster und Türen? Wenn du nichts davon hast, ist das kein Weltuntergang. Dann starten wir eben dort. Aber je mehr wir wissen, desto schneller wird aus Rätselraten Planung.' },
      { h: 'Dein Alltag', p: 'Dann kommt dein Alltag. Kochst du viel oder eher selten? Brauchst du viel Stauraum? Isst du in der Küche? Gibt es Kinder, Haustiere, Gäste, Chaos, Thermomix, Siebträgermaschine oder den berühmten Schrank voller Tupperdeckel ohne passende Dose? Genau diese Dinge entscheiden über eine gute Küche.' },
      { h: 'Budget als Rahmen', p: 'Auch Budget ist wichtig. Nicht als Druckmittel, sondern als Rahmen. Niemandem ist geholfen, wenn wir dir eine Traumküche planen, die am Ende nur als schöner Screenshot existiert. Lieber ehrlich planen als später traurig rechnen.' },
      { p: 'Du musst also nicht mit fertiger Lösung kommen. Bring lieber echte Informationen mit: Was nervt dich an deiner aktuellen Küche? Was soll besser werden? Was gefällt dir? Was darf auf keinen Fall passieren?' },
    ],
    fazit: 'Du musst keine perfekte Planung mitbringen. Nur deinen Raum, deinen Alltag und ein bisschen Ehrlichkeit. Den Rest machen wir zusammen.',
  },
  {
    slug: 'mehr-stauraum-weniger-chaos',
    lastModified: '2026-08-24',
    title: 'Mehr Stauraum, weniger Chaos: Warum gute Küche innen anfängt',
    category: 'Stauraum',
    read: '4 Min.',
    image: imgStauraum,
    teaser: 'Außen schön, innen Trümmerfeld? Warum bessere Nutzung mehr bringt als mehr Schränke – und gute Küche hinter der Front beginnt.',
    metaTitle: 'Mehr Stauraum in der Küche planen | VIDEKO Küchen',
    metaDescription: 'Mehr Ordnung in der Küche: VIDEKO zeigt, warum guter Stauraum bei Innenaufteilung, Ergonomie und Alltag beginnt – nicht bei mehr Schränken.',
    intro: 'Eine Küche kann außen wunderschön sein und innen trotzdem ein Trümmerfeld. Wenn Töpfe, Deckel, Gewürze, Backbleche und Vorräte sich gegenseitig bekämpfen, hilft auch die schönste Front nicht. Dann ist die Küche zwar hübsch, aber jeden Tag ein kleiner Nervenzusammenbruch mit Griffleiste.',
    sections: [
      { h: 'Bessere Nutzung statt mehr Schränke', p: 'Stauraum bedeutet nicht einfach mehr Schränke. Stauraum bedeutet bessere Nutzung. Ein breiter Auszug kann mehr bringen als drei schmale Türen. Eine gute Inneneinteilung spart Suchzeit. Hohe Schränke können Vorräte, Geräte und Alltagszeug sauber bündeln. Und tote Ecken? Die gibt es öfter, als man denkt. Manche sind unvermeidbar, viele sind einfach schlecht geplant.' },
      { h: 'Passend zu deinem Alltag', p: 'Wichtig ist, dass Stauraum zu deinem Alltag passt. Wer viel kocht, braucht andere Zonen als jemand, der hauptsächlich Kaffee macht und Lieferando moralisch unterstützt. Backen, Vorräte, Getränke, Geschirr, Reinigungsmittel, Mülltrennung – alles braucht seinen Platz.' },
      { h: 'Ergonomie zählt', p: 'Auch Ergonomie spielt rein. Was du täglich nutzt, sollte erreichbar sein. Was schwer ist, gehört nicht in den obersten Schrank. Und wer sich jeden Morgen für die Pfanne bücken muss, während hinten der Deckel klemmt, hat keine Küche. Der hat ein Möbel-Labyrinth.' },
      { p: 'Bei VIDEKO planen wir Stauraum von innen nach außen. Erst wenn klar ist, was wirklich untergebracht werden muss, ergibt die äußere Form Sinn. Sonst sieht es schön aus und funktioniert trotzdem nicht.' },
    ],
    fazit: 'Gute Küche beginnt hinter der Front. Da, wo der Alltag wohnt.',
  },
  {
    slug: '7-kuechenfehler-die-du-spaeter-jeden-tag-bereust',
    lastModified: '2026-08-24',
    title: 'Typische Küchenfehler – und welche gar keine sind',
    category: 'Planung',
    read: '6 Min.',
    image: imgFehler,
    teaser: 'Manche Fehler nerven dich täglich, andere sind clevere Kompromisse für einen schwierigen Raum. Neun Klassiker – ehrlich eingeordnet.',
    metaTitle: 'Typische Küchenfehler – und welche gar keine sind | VIDEKO Küchen',
    metaDescription: 'Nicht jeder Küchenfehler ist wirklich ein Fehler. VIDEKO ordnet neun Klassiker fair ein – von Arbeitsfläche und Laufwegen bis Stauraum und schwierigen Räumen.',
    intro: 'Nicht jeder Küchenfehler ist wirklich ein Fehler. Manche Dinge sehen auf dem Papier komisch aus, sind aber die beste Lösung für einen schwierigen Raum. Andere wirken erst harmlos und nerven dich später jeden Tag. Genau deshalb lohnt es sich, genauer hinzuschauen.',
    sections: [
      { h: '1. Zu wenig Arbeitsfläche', p: 'Eine schöne Küche ohne nutzbare Fläche ist wie ein Sportwagen ohne Lenkrad. Sieht gut aus, bringt aber wenig. Zwischen Spüle und Kochfeld sollte genug Platz sein, damit Vorbereitung wirklich funktioniert.' },
      { h: '2. Schlechte Laufwege', p: 'Wenn Kühlschrank, Spüle, Kochfeld und Stauraum ungünstig liegen, läufst du beim Kochen Marathon. Das klingt gesund, ist aber nervig. Gute Planung denkt Wege kurz und logisch.' },
      { h: '3. Zu wenig Durchgang', p: 'Eine Insel ist toll. Eine Insel, an der keiner vorbeikommt, ist ein Möbelstück mit Ego-Problem. Zwischen Insel und Zeile braucht es genug Platz, sonst wird jede geöffnete Schublade zur Straßensperre.' },
      { h: '4. Falsche Gerätehöhe', p: 'Backofen, Spülmaschine und Kühlschrank sollten so sitzen, dass du sie bequem nutzt. Wer sich täglich unnötig bückt, merkt irgendwann: Design ist schön, Rücken ist schöner.' },
      { h: '5. Türen statt Auszüge', p: 'Türenschränke sind nicht automatisch falsch. Aber bei vielen Unterschränken sind Auszüge oft übersichtlicher und ergonomischer. Sonst suchst du hinten unten den Topf wie einen verschollenen Schatz.' },
      { h: '6. Zu wenig Steckdosen', p: 'Heute braucht fast alles Strom: Kaffeemaschine, Mixer, Wasserkocher, Toaster, Handy, Küchenmaschine. Zu wenige Steckdosen merkt man meist erst, wenn es zu spät ist. Dann beginnt das Verlängerungskabel-Ballett.' },
      { h: '7. Licht nur von oben', p: 'Eine Deckenlampe macht den Raum hell, aber nicht automatisch die Arbeitsfläche. Wenn du dir selbst Schatten wirfst, wird Schneiden unnötig spannend. Arbeitslicht gehört dahin, wo gearbeitet wird.' },
      { h: '8. Stauraum falsch gedacht', p: 'Viele Schränke bedeuten nicht automatisch viel Ordnung. Ohne sinnvolle Innenaufteilung entsteht Chaos mit Türdämpfung. Gute Küche plant Vorräte, Geräte, Geschirr und Müll mit.' },
      { h: '9. Der Raum gibt nicht alles her', p: 'Und jetzt der wichtige Punkt: Manchmal ist etwas kein Fehler, sondern ein Kompromiss. Fenster, Wasseranschlüsse, Türen, Schrägen oder geringe Raumgröße setzen Grenzen. Gute Planung erkennt, was möglich ist – und macht daraus die beste Lösung, statt blind Ideale durchzudrücken.' },
      { p: 'Bei VIDEKO geht es nicht darum, Küchenfehler zu sammeln wie Panini-Bilder. Es geht darum, deinen Raum ehrlich zu verstehen. Manche Probleme lösen wir. Manche entschärfen wir. Und manche erklären wir dir so, dass du später nicht überrascht bist.' },
    ],
    fazit: 'Der größte Küchenfehler ist nicht ein schwieriger Raum. Der größte Fehler ist, so zu tun, als wäre er keiner.',
  },
  {
    slug: 'geraete-richtig-planen',
    lastModified: '2026-08-24',
    title: 'Geräte richtig planen: Nicht jedes Feature macht deinen Alltag besser',
    category: 'Geräte',
    read: '4 Min.',
    image: imgGeraete,
    teaser: 'Dampfgarer, Muldenlüfter, Smart-Funktionen – klingt beeindruckend. Aber nicht alles ist für jeden sinnvoll. Wie du Geräte nach Nutzen planst.',
    metaTitle: 'Küchengeräte richtig planen | VIDEKO Küchen',
    metaDescription: 'Nicht jedes Feature macht den Alltag besser. VIDEKO zeigt, wie du Küchengeräte nach echtem Nutzen, Position und Bedienung planst – statt nach „mehr ist mehr".',
    intro: 'Küchengeräte können viel. Manche können sogar so viel, dass man sich fragt, ob sie nebenbei noch Steuererklärung machen. Dampfgarer, Muldenlüfter, Wärmeschublade, Weinkühler, Pyrolyse, Smart-Funktionen – klingt alles beeindruckend. Aber nicht alles ist für jeden sinnvoll.',
    sections: [
      { h: 'Erst der Alltag, dann die Marke', p: 'Gute Geräteplanung beginnt nicht mit Marken, sondern mit deinem Alltag. Kochst du täglich? Backst du viel? Brauchst du einen großen Kühlschrank? Wird bei dir wirklich gedämpft oder klingt Dampfgarer nur nach gesundem Zukunfts-Ich? Genau da trennt sich sinnvolle Ausstattung von teurer Dekoration.' },
      { h: 'Die Position entscheidet', p: 'Auch die Position ist wichtig. Ein hochgebauter Backofen ist bequem. Eine Spülmaschine auf angenehmer Höhe kann im Alltag Gold wert sein. Der Kühlschrank sollte dort sitzen, wo man ihn logisch erreicht – nicht irgendwo, nur weil dort noch ein Loch in der Planung war. Beim Kochfeld geht es um mehr als Breite: Abluft, Umluft, Muldenlüfter, Haube, Raumgröße und Kochverhalten spielen zusammen.' },
      { h: 'Bedienung im Alltag', p: 'Und dann ist da die Bedienung. Manche Geräte sehen stark aus, sind aber im Alltag nervig. Wenn du für die Timer-Funktion erst ein Studium brauchst, wird es schwierig. Technik soll helfen, nicht beleidigen.' },
      { p: 'Bei VIDEKO planen wir Geräte nicht nach „mehr ist mehr", sondern nach Nutzen. Was du brauchst, bekommt Platz. Was nur gut klingt, prüfen wir kritisch. Spart Geld, Platz und spätere Flüche.' },
    ],
    fazit: 'Das beste Gerät ist nicht das mit den meisten Funktionen. Es ist das, das du wirklich nutzt.',
  },
  {
    slug: 'pflegeleichte-kueche',
    lastModified: '2026-08-24',
    title: 'Pflegeleichte Küche: Schön wohnen, ohne jeden Fingerabdruck zu adoptieren',
    category: 'Pflege',
    read: '3 Min.',
    image: imgPflege,
    teaser: 'Manche Oberflächen sammeln Fingerabdrücke wie Bonuspunkte. Wie du eine Küche planst, die schön bleibt, ohne tägliche Zuneigung mit Mikrofasertuch.',
    metaTitle: 'Pflegeleichte Küche planen | VIDEKO Küchen',
    metaDescription: 'Wie wird eine Küche pflegeleicht? VIDEKO erklärt, worauf es bei Fronten, Arbeitsplatten und Griffen ankommt – schön wohnen ohne ständiges Putzen.',
    intro: 'Eine Küche darf schön sein. Sie sollte aber nicht beleidigt sein, sobald man sie benutzt. Manche Oberflächen sehen im Studio fantastisch aus und zeigen zuhause jeden Fingerabdruck, jeden Tropfen und jede Brotkrume mit der Leidenschaft eines Tatort-Ermittlers.',
    sections: [
      { h: 'Es beginnt beim Material', p: 'Pflegeleicht beginnt bei der Materialwahl. Matte Fronten können ruhig und edel wirken, unterscheiden sich aber stark in ihrer Oberfläche. Manche sind erstaunlich unempfindlich, andere sammeln Fingerabdrücke wie Bonuspunkte. Hochglanz kann leicht zu reinigen sein, zeigt aber je nach Farbe und Licht jede Spur.' },
      { h: 'Arbeitsplatten und Details', p: 'Auch Arbeitsplatten unterscheiden sich stark. Manche Materialien verzeihen Hitze, Säure und Flecken besser als andere. Andere brauchen mehr Aufmerksamkeit. Das ist nicht schlimm – solange du es vorher weißt und nicht erst nach dem ersten Zitronenmassaker. Griffe, Griffmulden und grifflose Fronten haben ebenfalls Einfluss: Was gut aussieht, muss auch gut zu bedienen und zu reinigen sein.' },
      { p: 'Pflegeleicht heißt nicht langweilig. Es heißt klug kombiniert. Ein Material darf Charakter haben, aber es sollte zu deinem Alltag passen. Wenn du nicht gern putzt, planen wir keine Küche, die tägliche Zuneigung mit Mikrofasertuch verlangt.' },
    ],
    fazit: 'Eine Küche darf glänzen. Aber bitte nicht nur, wenn du daneben wohnst und sie nie benutzt.',
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
  { q: 'Welche Maße sollte ich zum ersten Termin unbedingt dabeihaben?', a: 'Am besten alles, was später Ärger spart: Wandmaße, Raumhöhe, Fensterbreiten, Brüstungshöhen, Türmaße und – ganz wichtig – die Position von Wasser, Abfluss und Strom. Je besser die Infos, desto ehrlicher kann die erste Planung werden. Glaskugel ist bei uns nicht im Lieferumfang.' },
  { q: 'Was wird bei einem Küchentermin am häufigsten vergessen?', a: 'Klassiker: Brüstungshöhe, Deckenhöhe, Heizkörper, Fenstergriffe, Unterlichter, Vorsprünge, Nischenmaße und die Frage, ob das Fenster noch aufgeht, wenn der Wasserhahn davor sitzt. Genau diese kleinen Details machen später oft den Unterschied zwischen „passt schon" und „passt wirklich".' },
  { q: 'Warum ist die Brüstungshöhe so wichtig?', a: 'Weil sie entscheidet, wie hoch Arbeitsplatte, Fensterbank und mögliche Armaturen zusammenspielen. Klingt unspektakulär, ist aber genau so ein Punkt, der später richtig nervt, wenn man ihn vorher nicht sauber klärt.' },
  { q: 'Was bedeutet Unterlicht beim Fenster – und warum ist das relevant?', a: 'Ein Unterlicht kann Einfluss auf die Planung rund ums Spülbecken, die Arbeitsplatte und mögliche Armaturen haben. Vor allem dann, wenn das Fenster vor oder über der Spüle sitzt. Kurz gesagt: lieber einmal vorher prüfen als später jeden Morgen gegen den Wasserhahn planen.' },
  { q: 'Kann ich das Fenster noch öffnen, wenn der Wasserhahn davor sitzt?', a: 'Vielleicht – vielleicht auch nicht. Genau deshalb prüfen wir so etwas früh. Je nach Fensterart, Griffposition und Armatur kann das problemlos funktionieren oder eben gar nicht. Das ist kein Detail, das man „mal schauen" sollte.' },
  { q: 'Reicht ein Grundriss für die erste Planung?', a: 'Ein Grundriss ist ein sehr guter Start. Noch besser wird’s mit Fotos vom Raum, Maßen und Infos zu Anschlüssen. Dann können wir schneller einschätzen, was wirklich sinnvoll ist – und was auf Pinterest nur in Häusern ohne Alltag funktioniert.' },
  { q: 'Soll ich auch Fotos vom Raum mitbringen?', a: 'Unbedingt. Fotos helfen enorm – vor allem bei Fenstern, Heizkörpern, Dachschrägen, Vorsprüngen oder Anschlüssen. Ein Bild ersetzt nicht jedes Maß, aber oft zehn Rückfragen.' },
  { q: 'Welche technischen Punkte sollte ich vorab prüfen?', a: 'Wasseranschluss, Abfluss, Steckdosen, Starkstrom, Abluft/Umluft, Heizkörper, Fensteröffnung und Raumhöhe. Das klingt erstmal unromantisch – ist aber genau der Stoff, aus dem gute Küchenplanung gemacht ist.' },
  { q: 'Muss ich schon genau wissen, was ich will?', a: 'Nein. Du musst nicht mit dem perfekten Plan kommen. Aber je klarer dein Alltag, deine Wünsche und dein Budget sind, desto besser können wir dich beraten. Es geht nicht darum, schon alles zu wissen – nur darum, nicht komplett im Nebel anzureisen.' },
  { q: 'Ist die Deckenhöhe für die Planung wichtig?', a: 'Ja. Gerade bei hohen Schränken, Beleuchtung, Trockenbau oder Sonderlösungen ist die Deckenhöhe kein Deko-Wissen, sondern Planungsgrundlage. Lieber einmal nachmessen als später feststellen, dass der Hochschrank rechnerisch im Erdgeschoss endet.' },
  { q: 'Was sollte ich bei Neubau oder Sanierung beachten?', a: 'Bei Neubau und Sanierung lassen sich Anschlüsse oft noch sinnvoll verschieben. Genau deshalb lohnt es sich, die Küche früh zu planen – bevor Wand, Elektrik und Wasser schon entschieden haben, wo später alles stehen muss.' },
  { q: 'Was, wenn ich die Maße nicht genau weiß?', a: 'Kein Drama. Wir helfen dir, die richtigen Punkte zu finden. Aber je mehr brauchbare Infos du mitbringst, desto genauer und ehrlicher wird die erste Planung. Pi mal Daumen ist bei Küchen ein eher schlechter Architekt.' },
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
