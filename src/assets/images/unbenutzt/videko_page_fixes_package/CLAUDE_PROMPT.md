# Claude-Auftrag: VIDEKO Leistungsseite + Stylefinder sauber umbauen

Du arbeitest in der bestehenden VIDEKO-Website. Ziel: Die Seite soll nicht mehr wirken wie „ganz nett aus einem Template gefallen“, sondern hochwertig, klar, lebendig und verkaufsstark. Bitte setze die Änderungen direkt im bestehenden Code um und halte dich an das bestehende VIDEKO-Design: Creme/Offwhite, Anthrazit, Goldakzente, warme Premium-Bildwelt, viel Weißraum, abgerundete Karten, feine Schatten, kein Möbelhaus-Rabatt-Gebrüll.

## Referenzen im ZIP

Nutze diese Bilder als visuelle Referenzen:

- `reference_images/01_current_page_overview.png` = aktuelle Seite/Abschnitte, an denen gearbeitet werden soll.
- `reference_images/02_process_target_style_wide.png` = Zieloptik für den Abschnitt „Deine neue Küche. Ein klarer Prozess.“
- `reference_images/03_stylefinder_marker_closeup.png` = Stylefinder-Prozessmarker, bei dem der dunkle Rahmen weg soll.
- `reference_images/04_stylefinder_color_step_expert_tip.png` = Stylefinder-Seite mit Experten-Tipp und Fortschrittsprofil.

Wichtig: Bitte nicht blind kopieren, sondern die Optik hochwertig in das bestehende Projekt übertragen.

---

# 1. Hero oben: Video exakt auf Text-Höhe bringen

Aktuell ist das Video oben rechts optisch zu dominant bzw. nicht sauber proportional zum linken Textblock. Bitte den Hero so umbauen:

- Desktop: 2-spaltiges Grid, links Text/CTA, rechts Video.
- Das Video rechts soll optisch genauso hoch wirken wie der komplette Textblock links.
- Wenn der linke Block beispielsweise ca. 380–460 px hoch ist, darf das Video nicht plötzlich wie ein Kino-Leinwand-Monster daneben hängen.
- Video mit `object-fit: cover`, sauberem Radius, feinem Schatten und warmem Premium-Look.
- Beide Spalten vertikal sauber ausrichten, keine verrutschten Höhen.
- Mobile: Video unter dem Text, 16:9 oder leicht cinematisch, volle Breite, aber nicht riesig.

Technisch gerne mit CSS Grid:

```css
.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  align-items: stretch;
  gap: clamp(2rem, 5vw, 5rem);
}

.hero-video-card {
  height: 100%;
  min-height: 340px;
  max-height: 460px;
  aspect-ratio: 16 / 10;
}

.hero-video-card video,
.hero-video-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Passe die Werte an den vorhandenen Code an. Entscheidend ist das Ergebnis, nicht exakt diese CSS-Klassen.

---

# 2. Die 8 Leistungsteile größer und hochwertiger machen

Die 8 Teile von „Beratung & Planung“ bis „Nachbetreuung & Service“ sind aktuell zu klein bzw. wirken wie Nebeninhalt. Das ist Quatsch, weil das genau der Kern der Seite ist.

Bitte diesen Bereich umbauen:

- Alle 8 Leistungen müssen visuell deutlich größer werden.
- Die Leistungs-Karten/Buttons links sollen ungefähr die gleiche optische Wertigkeit und Größe bekommen wie die Bildkarten rechts.
- Keine winzigen Listenpunkte mehr, die aussehen wie ein Einstellungsmenü von 2012.
- Jede Leistung bekommt:
  - Nummer oder kleines Icon
  - klare Headline
  - 1 kurzen Nutzen-Satz
  - aktiven Zustand mit Goldakzent
  - Hover/Focus-Zustand
- Rechts bleibt/entsteht ein großer Visual-Bereich mit Bild/Video/Detailkarten passend zur aktiven Leistung.
- Immer nur eine Leistung steht wirklich im Fokus. Der Nutzer soll Lust bekommen, weiterzuklicken/weiterzuscrollen.
- Nutze eine ruhige, hochwertige Animation: Wechsel per Fade/Slide, kein Karussell-Zirkus mit Jahrmarkt-Gefühl.
- Auf Mobile als Swipe/Accordion oder horizontale Kartenstrecke, aber mit sauberem Fokus.

Die 8 Leistungen:

1. Beratung & Planung  
   Text: „Wir hören zu, sortieren Wünsche und machen daraus einen echten Küchenplan.“
2. Aufmaß & Technik  
   Text: „Wir prüfen Maße, Anschlüsse und Details, bevor später jemand flucht.“
3. Material & Auswahl  
   Text: „Fronten, Arbeitsplatten und Ausstattung passend zu Alltag, Optik und Budget.“
4. Lieferung & Koordination  
   Text: „Termine, Gewerke und Ablauf werden sauber abgestimmt.“
5. Montage & Aufbau  
   Text: „Präzise Montage, saubere Übergänge und kein improvisiertes Küchen-Tetris.“
6. Bestellung & Kontrolle  
   Text: „Wir prüfen Bestellungen, Details und offene Punkte, bevor es teuer wird.“
7. Übergabe & Einweisung  
   Text: „Du bekommst keine fertige Küche hingestellt und dann Funkstille.“
8. Nachbetreuung & Service  
   Text: „Auch nach der Montage bleiben wir erreichbar. Verrückt, aber wahr.“

Microcopy trocken halten, aber nicht albern. Premium mit einem kleinen Grinsen.

---

# 3. Abschnitt „Deine neue Küche. Ein klarer Prozess.“ in Zieloptik ausbauen

Der aktuelle Prozessbereich soll die Optik und Struktur aus `reference_images/02_process_target_style_wide.png` bekommen.

Bitte baue diesen Abschnitt neu bzw. stark um:

## Layout Desktop

Links:
- kleine Label-Zeile: „SO LÄUFT'S AB“
- Headline: „Deine neue Küche. Ein klarer Prozess.“
- kurzer Text: „Strukturiert, transparent und persönlich begleitet – von der ersten Idee bis zur letzten Schraube.“
- großes Bild mit Beratungs-/Planungsszene
- kleine Overlay-Karte auf dem Bild:  
  **„Dein Projekt im Blick“**  
  „Wir koordinieren alle Gewerke und halten dich immer auf dem Laufenden.“

Mitte:
- vertikale Timeline mit 6 Schritten, goldenen Nummern und feiner Linie.
- Schritte:
  01 Beratung & Planung  
  „Wir definieren Wünsche, Stil und Budget.“

  02 Aufmaß & Technik  
  „Wir prüfen Maße, Anschlüsse und Raumdetails.“

  03 Koordination  
  „Wir stimmen Liefertermine, Gewerke und Ablauf ab.“

  04 Bestellung  
  „Wir bestellen Küche und Komponenten in geprüfter Qualität.“

  05 Montage  
  „Unsere Profis montieren sauber, präzise und termingerecht.“

  06 Feinschliff & Übergabe  
  „Wir prüfen jedes Detail und übergeben deine Küche sauber.“

Rechts:
- Zwei übereinanderliegende Bildkarten wie in der Referenz.
- Card 1: Küchen-/Planungsbild mit Overlay:  
  **„Präzise Planung“**  
  „für perfekte Ergebnisse.“
- Card 2: Detail-/Arbeitsplatten-/Montagebild mit Overlay:  
  **„Qualität, die man sieht“**  
  „und spürt.“

## Stil

- Hintergrund hell/creme, nicht dunkel.
- Feine Schatten, Radius 20–28 px.
- Goldene Nummern, dünne Linien, viel Luft.
- Keine überladenen Textwände.
- Animation: Timeline-Schritte dürfen beim Scrollen nacheinander leicht einblenden. Bilder können leicht parallax/floaten, aber dezent.

## Mobile

- Reihenfolge: Headline → Hauptbild → Timeline → Detailkarten.
- Timeline kompakt, gut lesbar, keine Mini-Schrift.

---

# 4. Dunkle Kachel unterhalb hell machen

Unterhalb des Prozessbereichs gibt es eine dunkle Kachel/einen dunklen Abschnitt. Der soll hell werden.

Grund: Wir haben oben und unten dunkle starke Bereiche. Wenn mittendrin dunkle Blöcke auftauchen, wirkt es wie ein Seitenende. Das ist UX-mäßig ein kleiner Genickbruch mit Goldrand.

Bitte:

- Diesen Abschnitt in Creme/Offwhite umbauen.
- Text in Anthrazit.
- Goldene Akzente behalten.
- Karten hell, mit Schatten, Border und hochwertigem Premium-Look.
- Keine schwarze/dunkle Vollfläche in der Mitte der Seite.

---

# 5. Stylefinder Prozessmarker: dunklen Rahmen entfernen

Im Stylefinder-Profilmarker um das Logo/den Prozesskreis ist aktuell ein dunkler Rahmen/Container, der zu schwer wirkt. Siehe `reference_images/03_stylefinder_marker_closeup.png` und `reference_images/04_stylefinder_color_step_expert_tip.png`.

Bitte ändern:

- Entferne den dunklen Rahmen/Container um den Stylefinder-Prozessmarker.
- Der Marker soll leichter wirken: Logo-Karte darf bleiben, aber ohne schweren dunklen Außenrahmen.
- Fortschrittskreis/Schritt-Bubbles behalten, aber luftiger und sauberer.
- Goldakzente behalten.
- Die Profilkarte rechts im Stylefinder soll insgesamt hochwertig, hell und sauber bleiben.
- Keine schwarze Kiste um den Marker. Das Ding soll nicht aussehen wie ein Tresor für Küchengefühle.

---

# 6. Stylefinder: pro Seite anderer Experten-Tipp

Auf jeder Stylefinder-Seite soll im Experten-Tipp ein anderer Text stehen. Bitte abhängig vom aktuellen Schritt dynamisch ausgeben.

Wichtig: trockener VIDEKO-Humor, aber trotzdem seriös und hilfreich. Kein Klamauk, kein „Haha wir sind so lustig“-Krampf.

Nutze diese Texte:

```js
const expertTips = {
  stil: {
    title: "Experten-Tipp",
    text: "Stil ist kein Persönlichkeitstest. Es geht darum, was du jeden Morgen sehen willst, ohne innerlich zu kündigen."
  },
  mehrwerte: {
    title: "Experten-Tipp",
    text: "Mehrwerte sind keine Spielereien. Wenn ein Feature deinen Alltag nicht besser macht, ist es nur Deko mit Preisschild."
  },
  materialdetails: {
    title: "Experten-Tipp",
    text: "Material ist wie Schuhwerk: Schön bringt wenig, wenn es nach drei Wochen aussieht wie nach einem Festival."
  },
  farbwelten: {
    title: "Experten-Tipp",
    text: "Mut zur Farbe ist gut. Mut zur Farbe ohne Lichtkonzept ist manchmal nur eine sehr teure Höhle mit Spüle."
  },
  funktionsraum: {
    title: "Experten-Tipp",
    text: "Eine Küche ist kein Möbelkatalog. Laufwege, Stauraum und Griffe entscheiden, ob Kochen Spaß macht oder tägliches Tetris wird."
  },
  budget: {
    title: "Experten-Tipp",
    text: "Budget ist kein Spaßverderber. Es ist der Türsteher, der verhindert, dass Wunsch und Realität sich vor allen Leuten prügeln."
  },
  prioritaeten: {
    title: "Experten-Tipp",
    text: "Wenn alles wichtig ist, ist nichts wichtig. Hier sortieren wir aus, bevor die Küche aussieht wie ein Wunschzettel mit Fronten."
  },
  ergebnis: {
    title: "Experten-Tipp",
    text: "Dein Profil ist kein endgültiges Urteil. Es ist die Abkürzung zu einem Gespräch, bei dem wir nicht bei Adam und Arbeitsplatte anfangen."
  }
};
```

Falls die Step-Keys im Projekt anders heißen, bitte sauber auf die vorhandenen Keys mappen.

---

# 7. Abschnitt „Klarer Ablauf. Stressfrei für dich.“ entweder raus oder stark ausbauen — Entscheidung: stark ausbauen

Der aktuelle Bereich „Klarer Ablauf. Stressfrei für dich.“ wirkt lieblos und nicht fertig gedacht. Bitte nicht einfach kosmetisch pinseln. Entweder richtig oder gar nicht. Hier: bitte richtig.

Baue daraus einen starken Vertrauens-/Ablaufbereich, hell und hochwertig.

## Ziel

Der Nutzer soll nach diesem Abschnitt denken:
„Okay, die wissen wirklich, wie man ein Küchenprojekt sauber durchzieht.“

## Neuer Aufbau

Headline:
**„Klarer Ablauf. Stressfrei für dich.“**

Subline:
„Du weißt immer, was erledigt ist, was als Nächstes kommt und wer sich kümmert.“

Darunter ein hochwertiges 3- oder 4-Spalten-System mit großen Karten:

1. **Status statt Rätselraten**  
   „Wir halten dich über Planung, Bestellung, Lieferung und Montage auf dem Laufenden.“

2. **Gewerke sauber koordiniert**  
   „Aufmaß, Anschlüsse, Lieferung und Montage greifen ineinander – ohne Chaos-Ballett im Hausflur.“

3. **Details vorab geklärt**  
   „Maße, Technik, Materialien und offene Punkte werden geprüft, bevor es auf der Baustelle teuer wird.“

4. **Übergabe mit Feinschliff**  
   „Wir gehen deine Küche mit dir durch, erklären Details und kümmern uns um Restpunkte.“

Zusätzlich rechts oder darunter eine große „Projektfahrplan“-Karte:

Titel: **„Dein Küchenfahrplan“**

Checklist:
- Beratung abgeschlossen
- Planung abgestimmt
- Technik geprüft
- Bestellung freigegeben
- Montage terminiert
- Übergabe erledigt

Die Checkliste kann beim Scrollen Schritt für Schritt aktiviert werden. Goldener Fortschrittsbalken, leichte Animation, keine blinkende Diskokugel.

## Stil

- Hintergrund hell.
- Große helle Karten.
- Goldene Akzente.
- Kleine Icons möglich, aber hochwertig und minimal.
- Feine Linien, Premium-Schatten, viel Weißraum.
- Keine dunkle Vollfläche.
- Kein generisches „4 Icons und fertig“. Das wäre wieder die optische Schlaftablette.

---

# 8. Animationen / Interaktion

Bitte vorhandene Animationslösung im Projekt nutzen. Falls bereits Framer Motion, GSAP oder eine eigene IntersectionObserver-Lösung existiert, daran anschließen. Wenn nichts vorhanden ist, simple CSS + IntersectionObserver verwenden. Keine unnötig schwere Library installieren, nur damit eine Karte 12 Pixel nach oben wackelt.

Gewünschte Effekte:

- Hero Video/Visual: sanftes Einblenden.
- 8-Leistungsbereich: aktiver Wechsel per Fade/Slide.
- Prozess-Timeline: Schritte nacheinander beim Scrollen einblenden.
- Projektfahrplan: Checkpunkte nacheinander aktivieren.
- Cards: dezenter Hover-Lift, Schatten etwas stärker, Goldakzent sichtbar.
- Accessibility: Buttons, Tabs und Cards per Tastatur nutzbar, sichtbarer Focus-State.

Nicht gewünscht:

- wilde 3D-Effekte
- zu viele schwarze Blöcke
- blinkende Elemente
- übertriebene Parallax-Bewegungen
- Layout-Sprünge beim Wechseln der aktiven Karte

---

# 9. Akzeptanzkriterien

Bitte erst fertig melden, wenn diese Punkte erfüllt sind:

- Hero-Video oben ist optisch auf Höhe des linken Textblocks.
- Die 8 Leistungen wirken groß, klickbar und wichtig – nicht wie eine kleine Sidebar.
- Der Abschnitt „Deine neue Küche. Ein klarer Prozess.“ entspricht klar der Zieloptik aus `02_process_target_style_wide.png`.
- Die dunkle Kachel unterhalb wurde hell umgebaut.
- Stylefinder-Prozessmarker hat keinen schweren dunklen Rahmen mehr.
- Jede Stylefinder-Seite zeigt einen eigenen Experten-Tipp.
- „Klarer Ablauf. Stressfrei für dich.“ wurde stark ausgebaut und sieht nicht mehr nach Füllmaterial aus.
- Desktop und Mobile sauber geprüft.
- Keine toten Links, keine Konsolenfehler, keine kaputten Imports.
- Keine neuen Platzhalterbilder von außen einbinden. Bestehende Projektassets verwenden oder vorhandene Bildkomponenten sauber wiederverwenden.

---

# 10. Tonalität

VIDEKO soll wirken wie:

- hochwertig
- klar
- persönlich
- kompetent
- warm
- modern
- leicht humorvoll

VIDEKO soll nicht wirken wie:

- Möbelhaus-Prospekt
- Rabatt-Schlacht
- Baukasten-Template
- generische Agentur-Webseite
- „wir haben halt noch vier Icons eingefügt“

Bitte präzise umsetzen. Nicht nur bisschen Abstand ändern und dann „fertig“ rufen. Das sieht man. Und Dennis sieht es erst recht.
