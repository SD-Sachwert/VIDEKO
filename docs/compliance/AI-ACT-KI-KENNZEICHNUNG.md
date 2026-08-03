# KI-Kennzeichnung nach EU AI Act (Art. 50) – Analyse & To-do

**Stand:** 2026-08-03 · **Bearbeiter:** Claude (technisch/juristische Ersteinschätzung) · **Status:** Entwurf, anwaltlich NICHT geprüft

> **Wichtiger Hinweis / Haftungsausschluss:** Dieses Dokument ist **keine Rechtsberatung**
> und darf nicht als rechtssichere Auskunft verstanden werden. Es ist eine strukturierte
> Ersteinschätzung als Arbeitsgrundlage. Die abschließende Beurteilung – insbesondere die
> Frage, welche Bilder konkret als „Deepfake" i. S. d. AI Act gelten und ob ein Verstoß
> abmahnfähig ist – gehört in die Hand eines **Fachanwalts für IT-/Wettbewerbsrecht**.
> Mehrere hier benannte Punkte sind rechtlich (noch) **ungeklärt** und werden ehrlich als
> solche gekennzeichnet.

---

## 0. Umsetzungsstand (2026-08-03)

**Bereits umgesetzt und gebaut (grüner Build):**
- **Zentrale Komponente** `src/components/legal/KiKennzeichnung.jsx` (`KiBadge` für Bilder,
  `KiHinweis` für Bildunterschriften) + CSS (`.kimark*`). Bewusst dezent.
- **Shop:** KI-Badge direkt am Bild in Galerie **und** Lightbox (`ProductGallery.jsx`,
  `ai`-Prop aus `ProductDetail.jsx`); Coming-soon-Text sagt jetzt **„KI-Produktvorschau …"**.
- **Site-weit:** Footer-Hinweis „Ein Teil der Bilder … wurde mit KI erstellt." (`Footer.jsx`).
- **Sub-Page-Heros mit KI-Bild:** dezente Bildunterschrift „Darstellung: KI-generiert" über
  `PageHero` (`aiImage`-Prop) auf Planung, Materialien, Stylefinder, Über VIDEKO, Team; sowie
  auf den Custom-Heros **Studio, Inspiration, Vorher/Nachher**.
- **Ehrlichkeits-Fix Vorher/Nachher (§ 5 UWG):** pauschale „echt/real"-Behauptungen entschärft
  (`VorherNachher.jsx`: Hero-Titel, Lead, Keypoint, Intro; `VorherNachherShowcase.jsx`:
  „Echte Küchen. Echte Verwandlungen." → neutral, Benefit „Echte Umbauten" → „Umbau-Ideen").
  Neutrale Kennzeichnung „Beispieldarstellungen – teils KI-generiert" (weil laut Betreiber
  **gemischt/unsicher**, daher nicht pauschal „KI").

**Zweite Welle (2026-08-03, nach Betreiber-Auskunft „Gründerfotos echt, Rest KI"):**
- **Wichtige Korrektur:** `/ueber-videko` und `/materialien` sind **Weiterleitungen** –
  die live sichtbaren Seiten sind `UeberUns.jsx` (mit eigenem Hero) bzw. `/inspiration`.
  Die KI-Heros der **tatsächlich live geschalteten** Seiten sind jetzt gekennzeichnet:
  **Home-Hero (Video), Leistungen, Über uns, Showroom-Portal** (per `KiHinweis`).
- **Gründerfotos Vitali/Dennis/Heiko = echt** → bewusst **kein** KI-Label (`UeberUns.jsx`).
- **KI-Personen als „Team/Kund:innen" gekennzeichnet** (§ 5 UWG, höchstes Risiko):
  KI-Badge direkt am Bild bei Beratungs-/Kundenszenen (`UeberUns.jsx` whyImg + momentImg,
  `VorherNachher.jsx` trustImg, `Studio.jsx` teamImg); Team-Bento in `UeberUns.jsx` mit
  Hinweis „Teambereiche als Symbolbilder – KI-generiert. Die drei Gründer oben sind echt.";
  Home-Galerie mit Hinweis „Impressionen – KI-generierte Symbolbilder". `alt`-Texte dieser
  Bilder auf „(KI-generiertes Symbolbild)" umgestellt.
- **Impressum:** neuer Abschnitt „Hinweis zu Bildern (KI-Kennzeichnung)" – zentraler,
  ehrlicher Bilddisclaimer (KI-Bildwelt, Vorher/Nachher = Beispiel/teils KI, Gründerfotos echt).

**Bewusst NICHT einzeln beschriftet (Begründung):**
- Reine **Küchen-/Material-/Stimmungsbilder ohne Personen** tragen keinen Einzel-Badge –
  die AI-Act-Offenlegung läuft dort über die Hero-Hinweise, den Footer-Hinweis und den
  zentralen Impressum-Passus. Einzel-Badges auf jedem Küchenbild wären „auffällig" und
  bringen juristisch keinen Mehrwert. Der §-5-UWG-Hebel (Personen als echt) ist adressiert.
- **`alt`-Texte** flächendeckend (P1.4): nur bei den Personen-Symbolbildern erledigt, sonst offen.

Die To-do-Liste unten ist entsprechend abgehakt.

---

## 1. Worum geht es – stimmt das Datum 02.08.2026?

**Ja, das Datum ist real.** Am **2. August 2026** wird ein großer Teil der EU-KI-Verordnung
(Verordnung (EU) 2024/1689, „AI Act") anwendbar – darunter **Artikel 50**, der
**Transparenz-/Kennzeichnungspflichten für KI-generierte Inhalte** enthält.

Es handelt sich um eine **unmittelbar geltende EU-Verordnung** (kein deutsches Umsetzungsgesetz
nötig). Die Behörde für die Marktüberwachung in Deutschland wird voraussichtlich bei der
Bundesnetzagentur koordiniert.

---

## 2. Wen trifft welche Pflicht? (Die entscheidende Unterscheidung)

Art. 50 verteilt die Pflichten auf **verschiedene Rollen**. Das ist für uns zentral, weil
**nicht jede Pflicht bei Videko liegt**:

| Pflicht (Art. 50) | Adressat | Betrifft Videko? |
|---|---|---|
| **Abs. 1** – Bei KI-Chatbots Nutzer informieren, dass sie mit einer KI sprechen | Anbieter des KI-Systems | **Nein** – wir haben keinen Chatbot / keine KI-Interaktion auf der Seite. |
| **Abs. 2** – KI-Ausgaben **maschinenlesbar** als „künstlich erzeugt" markieren (Wasserzeichen/Metadaten) | **Anbieter** des generativen KI-Systems (OpenAI, Anthropic, Bildgeneratoren) | **Primär nein** – diese Pflicht trifft den Hersteller des KI-Werkzeugs, nicht uns als Nutzer. |
| **Abs. 4 UAbs. 1** – „**Deepfakes**" (KI-erzeugte/-veränderte **Bilder/Audio/Video**, die real wirken) offenlegen | **Betreiber/Verwender** (= Videko) | **JA – das ist unser Kernpunkt.** |
| **Abs. 4 UAbs. 2** – KI-erzeugte **Texte** offenlegen, wenn sie der **Information der Öffentlichkeit über Angelegenheiten von öffentlichem Interesse** dienen | Betreiber (= Videko) | **Wahrscheinlich nein** – Marketing-/Produkttexte sind kein „öffentliches Interesse" im Sinne der Norm (dazu unten mehr). |

**Kernaussage:** Für uns als **Verwender** ist vor allem **Art. 50 Abs. 4 UAbs. 1 (Deepfake-
Offenlegung bei fotorealistischen KI-Bildern)** relevant. Die maschinenlesbare Markierung
(Abs. 2) ist Aufgabe der KI-Anbieter.

### Was ist ein „Deepfake" hier?
Die Verordnung definiert ihn weit (Art. 3 Nr. 60): KI-erzeugte oder -veränderte **Bild-, Ton-
oder Videoinhalte, die real existierenden Personen, Gegenständen, Orten … ähneln und
fälschlicherweise als echt erscheinen** würden. **Fotorealistische KI-Bilder von Küchen,
Vorher/Nachher-„Fotos" und Produkt-Mockups, die ein Besucher für echte Fotos hält, fallen
sehr wahrscheinlich darunter.**

Eine **Ausnahme** gilt für „offensichtlich künstlerische/fiktionale" Werke – die greift bei
kommerzieller Produktwerbung **nicht**. Die geforderte Offenlegung muss aber nur **„klar und
erkennbar"** erfolgen; sie darf das Bild nicht zerstören (z. B. dezente Bildunterschrift genügt).

---

## 3. Was auf unserer Seite konkret betroffen ist (aus dem Audit)

| KI-Inhalt | Ort im Code | Aktuell gekennzeichnet? | AI-Act-Einstufung |
|---|---|---|---|
| **146 Produkt-Mockups** `ai_mockup` | `src/data/products.json` | **Teilweise.** „Vorschau als KI-Muster" nur bei aktiv **anfragbaren** Artikeln (`ProductDetail.jsx:633/845`). **Coming-soon-Artikel** zeigen nur „Produktvorschau…" **ohne das Wort „KI"**. Kein Hinweis direkt am Bild (`ProductGallery.jsx`). | Deepfake-nah → **kennzeichnen** |
| **Vorher/Nachher-„Fotos"** | `assets/images/vorher-nachher/*`, belegt durch `_prompts/vorher-nachher.txt` | **Nein** | **Höchstes Risiko** (s. u.) |
| **Hero-/Küchen-/Showroom-/Inspiration-Bilder** | `assets/images/…` (kitchen-vision, showroom/journey-*, kuechenwelten/*) | **Nein** | Deepfake-nah → **kennzeichnen** |
| **Personen-Platzhalter** (Gründer) | `…/05_founder_vitali_placeholder.png` etc. | Als Platzhalter geführt | Prüfen, dass keine KI-„Personen" als echte Mitarbeiter erscheinen |
| **Journal-/Marketing-Texte** | `data/journal.js`, Seiten-Texte | Nein | **Wahrscheinlich keine Pflicht** (kein „öffentliches Interesse") |
| **3D-Szenen** (three.js) | `components/experience/*` | – | **Nicht betroffen** (prozedural gerendert, kein KI-Bild) |

**Bestehende Infrastruktur:** `compliance.js` und der Ordner `docs/compliance/` behandeln KI-Bilder
bisher **nur als internen Ehrlichkeits-/Qualitäts-Blocker** (Ziel: echtes Foto statt Mockup) –
**der AI Act / Art. 50 ist bislang nirgends adressiert.** Es gibt keine zentrale, wiederverwendbare
KI-Kennzeichnungs-Logik im UI.

---

## 4. Das eigentlich größere Abmahnrisiko: § 5 UWG (Irreführung)

Ehrlich und wichtig: **Unabhängig vom AI Act** besteht in Deutschland schon heute ein
**etabliertes, sicher abmahnfähiges** Risiko nach **§ 5 UWG (irreführende geschäftliche Handlung):**

- **Vorher/Nachher-Bilder**, die wie **echte Kundenprojekte** aussehen, aber **KI-generiert**
  sind, sind der klassische Irreführungsfall (vergleichbar mit erfundenen Referenzen).
  → **Das ist das dringlichste Problem**, weil es bereits jetzt (ohne AI Act) abmahnbar ist.
- **Produkt-Mockups**, die wie echte Produktfotos wirken, können nach § 5 UWG irreführen,
  wenn das Produkt real anders aussieht.

Der Punkt: Selbst wenn man den AI Act ausklammert, sind die **als real wirkenden KI-Bilder**
schon nach geltendem Wettbewerbsrecht heikel. Die Kennzeichnung löst **beide** Themen zugleich.

---

## 5. Ehrliche Einordnung des Abmahnrisikos AI Act

- **Bußgeld:** Verstöße gegen Art. 50 können mit Geldbußen belegt werden (Größenordnung bis
  15 Mio. € bzw. 3 % Jahresumsatz), verhängt durch **Behörden** – nicht durch Wettbewerber.
- **Abmahnung durch Wettbewerber/Verbände:** Ob ein Art.-50-Verstoß über **§ 3a UWG
  (Rechtsbruch)** von Konkurrenten **abgemahnt** werden kann, ist **rechtlich noch nicht
  geklärt** (keine Rechtsprechung; hängt davon ab, ob Art. 50 als „Marktverhaltensregelung"
  eingestuft wird – gute Argumente dafür, aber unsicher).
- **Sicher** ist dagegen das **§-5-UWG-Risiko** (Abschnitt 4). Deshalb: Wer die KI-Bilder
  sauber kennzeichnet, senkt das Risiko aus **beiden** Richtungen deutlich.

**Fazit:** Kein Grund zur Panik, aber klarer Handlungsbedarf – primär getrieben durch das
schon heute geltende Irreführungsverbot, verstärkt durch den AI Act ab 02.08.2026.

---

## 6. To-do-Liste (priorisiert)

Legende: **P0** = zuerst (höchstes/sicheres Risiko) · **P1** = zeitnah · **P2** = ergänzend/defensiv

### P0 – Sicheres Risiko zuerst entschärfen
- [x] **P0.1 Vorher/Nachher-Bilder ehrlich einordnen.** ✔ Umgesetzt: pauschale „echt/real"-
      Behauptungen in `VorherNachher.jsx` und `VorherNachherShowcase.jsx` entschärft + neutrale
      Kennzeichnung „Beispieldarstellungen – teils KI-generiert". *(Weil laut Betreiber
      gemischt/unsicher, bewusst neutral statt pauschal „KI".)* **Offen:** `BeforeAfter.jsx`
      separat prüfen; das KI-Personenbild „Beratungsmoment" (s. Abschnitt 0) noch offen.
- [x] **P0.2 Shop-Mockups: „KI"-Wortlaut auch bei Coming-soon.** ✔ Umgesetzt: Coming-soon-Text
      lautet jetzt „**KI-Produktvorschau** – Abbildung kann vom späteren Produkt abweichen."
- [x] **P0.3 Hinweis direkt am Bild.** ✔ Umgesetzt: `KiBadge` in `ProductGallery.jsx` auf der
      Hauptbühne **und** in der Lightbox (gesteuert per `ai`-Prop aus `ProductDetail.jsx`).

### P1 – Flächendeckende Kennzeichnung
- [x] **P1.1 Zentrale, wiederverwendbare KI-Kennzeichnung bauen.** ✔ Umgesetzt:
      `src/components/legal/KiKennzeichnung.jsx` (`KiBadge` + `KiHinweis`) + `.kimark`-CSS.
- [x] **P1.2 Hauptseiten-Bilder kennzeichnen.** ✔ Umgesetzt: `aiImage`-Prop an `PageHero` +
      dezente Bildunterschrift „Darstellung: KI-generiert" auf Planung, Materialien, Stylefinder,
      Über VIDEKO, Team, Studio, Inspiration, Vorher/Nachher; **Footer-Hinweis** site-weit als
      Auffangnetz. **Offen (Betreiber):** Home-Hero (Video) & Showroom-Hero – möglicherweise
      echtes Material, daher bewusst nicht pauschal gelabelt.
- [x] **P1.3 Gründer-/Personen-Platzhalter prüfen.** ✔ Betreiber bestätigt: Gründerfotos
      (Vitali/Dennis/Heiko) sind **echt** → kein KI-Label. Alle **KI-Personen**, die als echtes
      Team/echte Kund:innen wirken könnten, sind jetzt als KI-Symbolbild gekennzeichnet
      (UeberUns why/moment + Team-Bento, VorherNachher trust, Studio team, Home-Galerie).
- [ ] **P1.4 `alt`-Texte / Metadaten.** Wo Bilder KI-generiert sind, im `alt`-Text bzw. in
      Metadaten „KI-generiert" vermerken – unterstützt die „maschinenlesbare" Idee des AI Act
      (auch wenn Abs. 2 primär den KI-Anbieter trifft).

### P2 – Ergänzend / defensiv / Dokumentation
- [ ] **P2.1 Texte: redaktionelle Verantwortung dokumentieren.** Nach jetziger Einschätzung
      **keine** AI-Act-Pflicht (kein „öffentliches Interesse"). Defensiv trotzdem intern
      festhalten, dass alle veröffentlichten Texte **menschlich geprüft/redigiert** wurden
      (das ist die Ausnahme in Art. 50 Abs. 4 UAbs. 2). **Kein** sichtbarer Hinweis nötig.
- [x] **P2.2 Passus in Impressum.** ✔ Umgesetzt: Abschnitt „Hinweis zu Bildern
      (KI-Kennzeichnung)" in `Impressum.jsx` – zentraler, ehrlicher Bilddisclaimer.
- [ ] **P2.3 Prozess für neue Assets.** Konvention festlegen: Jedes neu eingebundene KI-Bild
      bekommt ab sofort das Kennzeichnungs-Flag – damit die Lücke nicht wieder entsteht.
      Diesen Punkt in `docs/compliance/README.md` und `shop-launch-checklist.md` verankern.
- [ ] **P2.4 Anwaltliche Endprüfung** (Fachanwalt IT-/Wettbewerbsrecht): (a) Welche Bilder
      gelten konkret als Deepfake? (b) Reicht die gewählte Kennzeichnungsform? (c) Endgültige
      Freigabe. **Blocker für „rechtssicher".**

---

## 7. Was ausdrücklich NICHT nötig ist (kein Over-Engineering)

- **Kein** KI-Hinweis auf den 3D-Szenen (`experience/*`) – prozedural gerendert, kein KI-Bild.
- **Kein** sichtbarer „von KI geschrieben"-Hinweis unter jedem Marketing-/Journal-Text
  (kein „öffentliches Interesse" i. S. d. Art. 50 Abs. 4 UAbs. 2). Menschliche Redaktion
  intern dokumentieren genügt.
- **Keine** eigene Wasserzeichen-Technik nötig (maschinenlesbare Markierung = Pflicht der
  KI-Anbieter, nicht von Videko).

---

## 8. Nächster Schritt
**Erledigt:** P0.1–P0.3, P1.1–P1.3 sowie P2.2 sind umgesetzt und live (grüner Build) – damit ist
das **sichere** (§ 5 UWG) und der Kern des AI-Act-Risikos entschärft, die Kennzeichnung
flächendeckend + wartbar, und die heiklen KI-Personenbilder sind sauber als Symbolbild markiert.
**Noch offen:** P1.4 (`alt`-Texte flächendeckend), P2.3 (Prozesskonvention für neue Assets)
sowie – als Blocker für die belastbare Aussage „rechtssicher" – **P2.4 (anwaltliche Endprüfung)**.

> **Ehrliche Einordnung:** Mit diesem Stand ist das *reale* Abmahnrisiko deutlich gesenkt und die
> Seite transparent gekennzeichnet. „Rechtssicher" im Sinne einer Garantie ist sie damit **nicht** –
> das kann nur ein Fachanwalt nach Prüfung bestätigen (P2.4). Dieses Dokument bleibt eine
> technisch-organisatorische Ersteinschätzung, **keine Rechtsberatung**.
