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
import imgFaq from '../assets/images/leistungen/04_intro_helle_kueche.webp'
import imgTopicPlanung from '../assets/images/inspiration/07_kueche_mit_insel.webp'
import imgTopicMaterial from '../assets/images/inspiration/06_materialien_und_details.webp'
import imgTopicInsp from '../assets/images/inspiration/10_favoriten_wohnkueche_luxus.webp'

export const categories = [
  'Alle Themen', 'Planung', 'Materialien', 'Licht', 'Stauraum', 'Geräte', 'Inspiration', 'Pflege', 'Design',
]

export const journalArticles = [
  {
    slug: 'licht-in-der-kueche',
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
