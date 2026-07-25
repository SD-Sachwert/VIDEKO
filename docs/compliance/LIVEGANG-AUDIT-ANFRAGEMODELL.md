# Livegang-Audit – Merch-Bereich als Anfragemodell

**Stand:** 2026-07-25 · **Branch:** `merch-shop` · **Verkaufsmodell:** unverbindliche
E-Mail-Anfrage (kein Web-Checkout, kein direkter Vertragsschluss über die Website).

> Dieser Bericht identifiziert die **technisch und anhand der vorhandenen Daten
> überprüfbaren** Risiken. Er ist **keine anwaltliche Einzelfallprüfung** und
> garantiert **keine** Abmahn- oder Bußgeldfreiheit. Er wendet **nicht** die
> vollen Pflichten eines Bestell-Checkouts an, sondern die des Anfragemodells.
> Es wurde **noch nichts committet**, **nichts nach `main` gemergt** und **kein
> Production-Deployment** ausgelöst.

---

## 0. Sofortiger Status

### 🟠 Reines Anfragemodell UMGESETZT · aktuell freigegebene Stufe = „preview" · Livegang wartet nur noch auf die Datenschutz-Freigabe

Die beiden früheren Blocker sind bearbeitet:

- **B2 (Warenkorb-/Kaufmodus)** → **erledigt.** Der Merch-Bereich ist vollständig
  auf ein **reines Anfragemodell** umgestellt (kein Warenkorb, kein Checkout,
  keine Bestellung, keine öffentlichen Preise). Zusätzlich wurde in diesem
  Durchgang die **„Benachrichtige-mich"-Vormerkung samt Backend (`api/notify.js`,
  Supabase-Tabelle `videko_notify`, SMTP-Versand für Merch) vollständig entfernt** –
  der Merch-Bereich löst jetzt **gar keinen** Backend-Aufruf mehr aus (nur mailto).
  Details in Abschnitt 8.
- **B1 (falsche Datenschutzerklärung)** → **technisch bereinigt, aber noch nicht
  freigegeben.** Falsche Dienste sind raus, echte Dienste sind faktisch
  dokumentiert – der Text ist jedoch eine **ungeprüfte Rohfassung** und bleibt
  damit **Livegang-Blocker**, bis ein Rechtstexte-Anbieter/Anwalt ihn finalisiert
  und die AV-Verträge vorliegen.

**Technische Freigabelogik (`src/data/release.js`, § 10):** Die Website kennt vier
Stufen `preview → inquiry → sale → shipping`. Aktuell ist **`RELEASE_STAGE = 'preview'`**
gesetzt. In dieser Stufe zeigt die Seite **keine** Anfrage-Buttons; jedes live
gestellte Produkt erscheint als **„Produktvorschau"** mit sichtbarem Vorschau-Hinweis.
Der Anfrage-Button (Stufe 2) erscheint erst, wenn **beide** Bedingungen erfüllt sind:
(a) `RELEASE_STAGE` wird auf `'inquiry'` gesetzt **und** (b) für das Produkt sind die
Materialangaben belegt (`materialConfirmed()` → Lieferantenbeleg für die konkrete
SOL'S-Imperial-Farbe). Beides ist derzeit **nicht** erfüllt → die Seite ist eine
**reine öffentliche Vorschau**.

**Kurz:** Technik, GPSR-Pflichtangaben und Anfragemodell sind live-fähig; die
**Datenschutzerklärung** ist die einzige verbleibende Gate für **Stufe 1 (Vorschau)**.

---

## 1. Technische Prüfung (tatsächlicher Anfrageprozess)

Getestet wurde der reale Code-Pfad, nicht Annahmen über ein Shop-System.

| Aspekt | Ist-Zustand | Bewertung |
|---|---|---|
| Hosting | **Vercel** (`vercel.json`, framework vite, SPA-Rewrites) | ok, **jetzt** korrekt in Datenschutz als Host genannt (statt „Strato") |
| Backend-Endpunkte | **nur noch** `api/lead.js` (Beratung/Karriere/Stylefinder); `api/notify.js` **entfernt** | Merch nutzt **kein** Backend mehr |
| Datenspeicherung | **Supabase** (`videko_leads`, Storage `lead-uploads`) – **nur** für `/api/lead`; `videko_notify` wird nicht mehr geschrieben | in Datenschutz dokumentiert |
| E-Mail-Versand | **SMTP** via nodemailer (Default `smtp.strato.de`) – **nur** für `/api/lead`-Mails | in Datenschutz generisch beschrieben; konkreter Anbieter + AV → Rechtstexte-Checkliste |
| Anfrageweg (Merch) | **`openInquiry()` → mailto** an `shop@videko-kuechen.de`, Betreff „Unverbindliche Anfrage …", Text „**stellt noch keine Bestellung dar**" | **unverbindlich**; **keine** verbotenen Begriffe (bestellen/kaufen/Auftrag/kostenpflichtig/verbindlich) |
| Warenkorb / Checkout | **entfernt** – `CartDrawer`/`NotifyModal` gelöscht, Header-Cart-Icon entfernt, `CartContext` führt nur noch die lokale Merkliste | **kein** erreichbarer Warenkorb, **keine** Checkout-Route, **kein** Bestell-/Notify-Backend |
| Vormerkung („Benachrichtige mich") | **komplett entfernt** – Modal, `notifyService`, `api/notify.js` gelöscht | Coming-Soon-Artikel zeigen nur noch das statische Label „Demnächst verfügbar" |
| **Interesse-Tracking auf Klick** | `pingInterest()` wird **nirgends** aufgerufen | **deaktiviert** (kein Speichern auf bloßen Klick) |
| Cookies / Consent-Tool | **kein** Cookie-Banner, **kein** Consent-Tool | nur funktionaler `localStorage` → **kein** Banner nötig (§ 25 Abs. 2 TDDDG); Datenschutz beschreibt das jetzt korrekt |
| Analytics / Meta Pixel / GA | **keine** gefunden | ok |
| Externe Einbettungen | Instagram-**Link** (kein Embed), lokale Google Fonts (kein Google-Request) | ok |

**Fazit Technik:** Keine heimlichen Tracker, kein Interesse-Ping, **kein**
Warenkorb/Checkout mehr. Die realen Datenflüsse (Vercel, Supabase, SMTP, mailto,
localStorage) sind jetzt in der Datenschutz-Rohfassung abgebildet.

### 1a. Verifikation „kein Kauf, keine Datenspeicherung auf Klick"

- **Anfrage-Button** (nur in Stufe `inquiry` sichtbar) ruft ausschließlich
  `openInquiry()` auf → setzt `window.location.href` auf eine `mailto:`-URL.
  **Kein** `fetch`, **kein** `localStorage`-Write, **kein** Backend-Aufruf,
  **keine** Bestellung.
- **`CartContext`** enthält **keinerlei** Warenkorb-/Bestell-/Notify-Logik mehr –
  nur noch eine rein lokale **Merkliste** (`localStorage`). `add()`/`checkout()`/
  `notify()` existieren nicht mehr. Es gibt keinen Codepfad, über die Website einen
  Warenkorb zu füllen, eine Bestellung auszulösen oder eine Vormerkung zu speichern.
- In der aktuellen Stufe `preview` wird gar **kein** Anfrage-Button gerendert;
  live gestellte Produkte zeigen den Zustand **„Produktvorschau"** samt sichtbarem
  Hinweis „Produktvorschau – die Darstellung kann vom fertig veredelten Produkt
  abweichen."
- `npm run build` läuft fehlerfrei durch.

---

## 2. Rechtliche Website-Pflichten

| Pflicht | Status | Anmerkung |
|---|---|---|
| **Impressum** (§ 5 TMG) | 🟡 fast vollständig | Firma, Rechtsform eG, Anschrift, Vorstände, Telefon, E-Mail vorhanden. **Register-Nr., Registergericht, USt-IdNr.** offen (als „wird final ergänzt" markiert – **nicht erfunden**). |
| **Datenschutzerklärung** | 🟠 **bereinigte Rohfassung, ungeprüft** | Falsche Dienste (Strato-Host, „Real Cookie Banner", Google Drive) **entfernt**, kaputtes Markup **beseitigt**, echte Dienste (Vercel, Supabase, localStorage, lokale Fonts, mailto, Formulare) **faktisch dokumentiert**. **Noch nicht anwaltlich geprüft** → bleibt Blocker (**B1**). |
| **AGB** | 🟡 Platzhalter, ehrlich markiert | Kein erfundener Vertragstext. |
| **Widerruf** | 🟡 Platzhalter, ehrlich markiert | Belehrung + Muster-Formular als TODO markiert (nicht erfunden). |
| **Versand & Lieferung** | 🟡 teils Platzhalter | Versanddienstleister/Gefahrübergang offen. |

**Erreichbarkeit:** Impressum + Datenschutz + AGB + Versand + Widerruf sind über
den **globalen Footer** auf **jeder** Seite (inkl. jeder Produktseite) verlinkt. ✅

---

## 3. Anfrageprozess (5× Ja/Nein) – nach Umstellung

| # | Frage | Antwort |
|---|-------|---------|
| 1 | Löst ein Klick auf der Website eine **Bestellung / einen Vertrag** aus? | **Nein.** Der Klick öffnet nur eine mailto-E-Mail. |
| 2 | Ist für den Nutzer **erkennbar**, dass die Anfrage unverbindlich ist? | **Ja.** Button „**Unverbindlich per E-Mail anfragen**" + Hinweis direkt daneben: „Mit dem Absenden der E-Mail wird noch keine Bestellung ausgelöst. Wir senden dir anschließend ein individuelles Angebot." |
| 3 | Werden **auf bloßen Klick** personenbezogene Daten gespeichert? | **Nein.** (Interesse-Tracking deaktiviert; mailto speichert nichts.) |
| 4 | Enthält die vorbelegte E-Mail **nur zulässige Felder** + Unverbindlichkeitsklausel? | **Ja.** Felder: Produkt, Farbe, Größe, Logoausführung, Anzahl, optionale Anmerkung. Text: „Diese Nachricht stellt noch keine Bestellung dar." Kein Preis, keine verbotenen Begriffe. |
| 5 | Ist der spätere Vertragsschluss **sauber getrennt dokumentiert**? | **Ja.** Siehe `EMAIL-VERKAUFSPROZESS.md` + `vorlagen/EMAIL-VORLAGEN.md`. |

---

## 4. Produktpflichten (auch ohne Checkout relevant)

Die **GPSR** (VO (EU) 2023/988, Art. 19) verlangt Produktangaben **auch bei einem
reinen Online-Angebot**. Geprüft auf beiden aktiv anfragbaren Shirts
(`signature_t_shirt_black`, `signature_t_shirt_white`):

| Öffentliche GPSR-/Textil-Angabe | Status |
|---|---|
| Produktbild | ✅ vorhanden (als **KI-Muster gekennzeichnet** – siehe unten) |
| Produktname | ✅ „Signature T-Shirt Schwarz/Weiß" |
| Produkttyp | ✅ „T-Shirt" |
| SKU / Artikelnummer | ✅ `VK-SIGNATURE-T-SHIRT-BLACK/WHITE` |
| Hersteller / verantwortliches Unternehmen | ✅ VIDEKO Küchen eG |
| **Vollständige Postanschrift** | ✅ Hertzstraße 4, 97076 Würzburg, Deutschland |
| **Elektronische Kontaktadresse** | ✅ info@videko-kuechen.de (verlinkt) |
| Material (Textilkennzeichnung, VO (EU) 1007/2011) | 🟡 „100 % Baumwolle" angezeigt, für die konkreten Farben **noch nicht durch Lieferantenrechnung belegt** (§ 7) |
| Pflegekennzeichnung | ✅ „30 °C auf links waschen, nicht über den Druck bügeln" |
| Warn-/Sicherheitshinweise | – (bei Standard-Textil i. d. R. nicht einschlägig) |
| Herkunftsland | offen, als „wird vor Verkaufsstart ergänzt" markiert (**kein** Blocker – für Textil keine generelle Pflicht) |

**→ Alle GPSR-Pflichtfelder, die den Anfrage-Button blockieren würden
(Herstelleranschrift, elektronischer Kontakt), sind vorhanden.**

**Bilder / Ehrlichkeit (§ 8):** Beide Shirts zeigen ein **KI-Muster**
(`imageStatus: ai_mockup`), ehrlich gekennzeichnet als „Vorschau als KI-Muster –
echte Produktfotos folgen vor dem Verkauf." Für ein **aktiv anfragbares** Produkt
ist das KI-Muster ein **interner Freigabe-Blocker** (kein Gesetzesverstoß, solange
gekennzeichnet) → vor Aktivierung von Stufe 2 durch echte Produktfotos ersetzen.

**Preisangaben (§ 2/§ 6):** Solange der **USt-Status ungeklärt** ist, werden
**keine** öffentlichen Preise und **kein** „inkl. MwSt." angezeigt
(`SHOW_PUBLIC_PRICES = false`). Stattdessen überall: „Preis und Versandkosten
erhältst du mit unserem individuellen Angebot."

---

## 5. Interne Produktakte SOLS-IMPERIAL-11500 (§ 6 / § 7)

Quelle: `src/data/compliance.js` + `docs/compliance/sols-imperial-11500-unterlagen.md`
(`complete: false`). **Nichts davon wurde erfunden** – Offenes bleibt offen.

| Punkt | Status |
|---|---|
| Blankware SOL'S Imperial 11500 / Grundmaterial / Flächengewicht (190 g/m²) | ✅ dokumentiert |
| Lieferant (Gröner-Schulze) | ✅ benannt (Händler, nicht Hersteller) |
| Blankware-Hersteller (SOLO INVEST SAS) | 🟡 aus Anbieterinfo, **durch Datenblatt/Etikett zu bestätigen** |
| Verbindlicher Blankware-Referenzlink | 🔴 offen (`referenceLink: null`) |
| Einkaufsrechnung / Bestellunterlagen | 🔴 offen |
| Farbcodes Schwarz/Weiß (z. B. Deep Black 309 / 102 vs. 117 White) | 🔴 offen – **nicht geraten** |
| Tatsächlich bezogene Größen | 🔴 offen (`sizesInUse: null`) |
| Etiketten-Fotos (Material-/Pflegeetikett) | 🔴 offen |
| Veredelungsverfahren (konkret: DTF/Flex/Siebdruck…) | 🔴 offen – **nicht geraten** |
| Veredelungsmaterial + Hersteller + Sicherheits-/Schadstoffnachweis | 🔴 offen |
| Pflege des **veredelten** Shirts / Druckwirkung | 🟡 Pflegehinweis vorhanden, veredelungsspezifisch zu bestätigen |
| Risikoanalyse (verhältnismäßig) | 🔴 offen |
| Charge / Beschwerde-/Rückrufprozess | 🔴 offen |
| Blankware-Zertifikate (OEKO-TEX, PETA Vegan) | 🟡 vorhanden, aber **nicht** öffentlich bewerbbar (`publiclyClaimable: false`) |

**Bewertung:** Für **öffentliche Vorschau** (Stufe 1) reicht der aktuelle Stand.
Für **echten Verkauf** (Stufe 3/4) muss die Produktakte belegt vervollständigt
werden.

---

## 6. Externe Voraussetzungen (vor dem **Versand**, § 10)

- **VerpackG / LUCID**-Registrierung + duales System (vor dem ersten Warenversand).
- **USt-Status** klären (Regelbesteuerung vs. § 19 UStG) – für korrekte Preise/Rechnung.
- **AV-Verträge** (Art. 28 DSGVO): Vercel, Supabase, SMTP-Anbieter.

Diese Punkte blockieren **nicht** die öffentliche Vorschau/Anfrage, wohl aber die
**Abwicklung** (Stufe 3–4). Der Versandprozess wird **erst gebaut**, wenn LUCID/
Versand bestätigt sind.

---

## 7. Verbleibende Blocker

| ID | Blocker | Muss vor … |
|----|---------|------------|
| **B1** | **Datenschutzerklärung** ist bereinigte, aber **ungeprüfte Rohfassung**; AV-Verträge (Vercel/Supabase/SMTP) fehlen. | **Stufe 1** – anwaltlich/Rechtstexte-Anbieter prüfen lassen (Checkliste: `DATENSCHUTZ-RECHTSTEXTE-CHECKLISTE.md`). |
| **B4** | **KI-Muster statt echter Produktfotos** auf den aktiv anfragbaren Shirts. | **Stufe 2** – echte Produktfotos einsetzen (§ 8). |
| **B5** | **Material „100 % Baumwolle" nicht belegt** für die konkreten Farben. | **Stufe 2** – per Lieferantenrechnung bestätigen (§ 7). |
| **B3** | **Rechtstexte für den Verkauf** (Widerrufsbelehrung, Muster-Widerrufsformular, vorvertragliche Pflichtinfos, ggf. AGB) nur als Platzhalter. | **Stufe 3** – geprüft bereitstellen. |
| **B6** | **USt-Status ungeklärt** → keine öffentlichen Preise. | **Stufe 3** (für Preis im Angebot). |
| **B7** | **Produktakte SOLS-IMPERIAL-11500** unvollständig (`complete: false`). | **Stufe 3** – belegt vervollständigen. |
| **B8** | **VerpackG/LUCID + Versandprozess**. | **Stufe 4**. |

**Kein Blocker (bewusst):** fehlendes Herkunftsland; Coming-soon-Artikel (hart
gesperrt, keine Anfrage/kein Preis); fehlende Register-/USt-Nummern, **solange**
als „wird ergänzt" gekennzeichnet und nicht erfunden. Badeschlappen bleiben in
Accessoires (nicht Teil dieses Audits).

---

## 8. In diesem Durchgang umgesetzte Änderungen

**Anfragemodell (§ 1):**
1. `src/shop/inquiry.js` (neu): `openInquiry()` baut die unverbindliche mailto-
   Anfrage (Felder: Produkt, Farbe, Größe, Logoausführung, Anzahl, Anmerkung;
   Klausel „stellt noch keine Bestellung dar"; keine verbotenen Begriffe).
2. `src/pages/ProductDetail.jsx`: beide Kaufwege (Konfigurator + Einzelseite) auf
   „**Unverbindlich per E-Mail anfragen**" umgestellt, inkl. sichtbarem
   Unverbindlichkeits-Hinweis; Sticky-Bar-CTA und `ProductCard`/`FamilyCard`
   ebenso. Service-Strip von „Sicher bezahlen/Versandkostenfrei" auf Anfrage-
   Hinweise umgeschrieben.
3. **Warenkorb/Checkout/Notify entfernt:** `CartContext` auf reine **Merkliste**
   reduziert (keine `add`/`setQty`/`remove`/`checkout`/`notify`-Logik mehr);
   `CartDrawer.jsx` und `NotifyModal.jsx` **gelöscht** und in `Layout.jsx` nicht
   mehr gemountet; Warenkorb-Icon in `Header.jsx` entfernt. → keine versteckte
   Warenkorb-/Checkout-/Vormerkungs-Route.
4. FAQ in `Merch.jsx` auf Anfragemodell umformuliert; Filter „Nur sofort
   bestellbar" → „Nur sofort verfügbar"; Benefits ohne „Sichere Bezahlung/
   Versand/Widerruf".

**„Benachrichtige mich"/Notify entfernt (§ 3):**
5. `api/notify.js`, `src/shop/notifyService.js` und `src/components/merch/NotifyModal.jsx`
   **gelöscht**. Die Supabase-Tabelle `videko_notify` und der zugehörige SMTP-Versand
   werden vom Merch-Bereich **nicht mehr** angesprochen (reine mailto-Anfrage).
   Coming-Soon-Artikel zeigen statt eines Notify-Buttons nur noch das statische
   Label **„Demnächst verfügbar"**. `videko_notify` aus der Datenschutzerklärung
   und den Service-Inventaren entfernt.

**Technische Freigabelogik (§ 10):**
6. `src/data/release.js` (neu): Stufen `preview → inquiry → sale → shipping`,
   `RELEASE_STAGE = 'preview'`, Helfer `canInquire()`/`materialConfirmed()`.
   `ProductDetail.jsx` und `ProductCard.jsx` rendern dreistufig: Coming-Soon →
   „Demnächst verfügbar"; anfragbar → Anfrage-Button; live-aber-nicht-anfragbar →
   „Produktvorschau" mit sichtbarem Vorschau-Hinweis. Der Anfrage-Button ist
   zusätzlich an `materialConfirmed()` gekoppelt (§ 9).

**Preise (§ 2):**
7. `SHOW_PUBLIC_PRICES = false` (`merch.js`) global verdrahtet: keine öffentlichen
   Preise, kein „inkl. MwSt.", stattdessen „Preis und Versandkosten erhältst du
   mit unserem individuellen Angebot." **JSON-LD** gibt ohne öffentlichen Preis
   **gar kein** `schema.org/Offer` mehr aus (kein irreführendes „InStock" ohne
   Kaufmöglichkeit).

**Datenschutz (§ 3/§ 4/§ 5):**
8. `src/pages/datenschutz-text.txt` neu gefasst: **Strato-Hosting, „Real Cookie
   Banner" und Google Drive entfernt**, kaputtes `<a>`-Markup beseitigt;
   **Vormerkungs-Absatz entfernt**; Kontakt-/Beratungs-/Bewerbungs-/Stilfinder-
   Formulare über `/api/lead` (inkl. Datei-Uploads via Supabase-Storage und
   SMTP-Mailversand) **faktisch dokumentiert**. Interner Status-Hinweis („noch
   nicht geprüft") als Code-Kommentar in `Datenschutz.jsx` (nicht im öffentlichen
   Text).
9. `docs/compliance/DATENSCHUTZ-RECHTSTEXTE-CHECKLISTE.md`: konkrete **AV-Vertrag-
   Tabelle** (§ 6) je Anbieter (Vercel/Supabase/SMTP: genutzt, AV erforderlich,
   vorhanden?, exakte externe Handlung) ergänzt; `services-datenverarbeitung.md`
   um die Notify-Entfernung bereinigt.

**Bereits zuvor:** Interesse-Tracking deaktiviert; `EMAIL-VERKAUFSPROZESS.md`,
`vorlagen/EMAIL-VORLAGEN.md`.

---

## 9. Freigabe-Bewertung in 4 Stufen (§ 12)

| Stufe | Freigabe? | Offene Blocker |
|---|---|---|
| **1 – Öffentliche Vorschau** (Bilder/Beschreibung sichtbar, keine aktive Anfrage) — **aktuell freigegebene Stufe** (`RELEASE_STAGE='preview'`) | **NEIN – nur 1 Blocker offen** | **B1** Datenschutz anwaltlich/Rechtstexte prüfen lassen + AV-Verträge. Technik, GPSR-Pflichtfelder und Preisdarstellung sind bereit. **Sobald B1 erledigt: JA.** |
| **2 – Aktive unverbindliche Anfrage** (Anfrage-Button live) | **NEIN** | **B1** + `RELEASE_STAGE` auf `'inquiry'` setzen + **B4** echte Produktfotos statt KI-Muster + **B5** Material „100 % Baumwolle" per Rechnung belegen (`materialConfirmed()` schaltet den Button erst dann frei). |
| **3 – Angebot per E-Mail** (individuelles Angebot an Verbraucher) | **NEIN** | **B3** geprüfte Rechtstexte (Widerrufsbelehrung, Muster-Widerrufsformular, vorvertragliche Pflichtinfos, ggf. AGB) + **B6** USt-Status + **B7** Produktakte SOLS-IMPERIAL-11500 belegt vervollständigen. |
| **4 – Vertragsannahme + Versand** | **NEIN** | **B8** VerpackG/LUCID + Versandprozess + alle Blocker der Stufe 3. |

### Durchgeführte Tests (§ 12)
- ✅ `npm run build` – fehlerfrei.
- ✅ Projektweiter grep-Sweep über die verbotenen Begriffe (In den Warenkorb,
  Zur Kasse, bestellen, checkout, cart, notify, Strato, Real Cookie Banner,
  Google Drive, inkl. MwSt., Versandkosten, alte Preise): alle Treffer bewertet.
  Verbleibende Treffer sind (a) **deaktivierte, dokumentierte** Preis-Zweige hinter
  `SHOW_PUBLIC_PRICES = false` (rendern öffentlich nichts), (b) **beschreibende
  Code-Kommentare** („kein Warenkorb/Checkout"), (c) **ehrlich als Platzhalter
  markierte** Rechtstext-Gerüste (AGB/Versand/Widerruf mit `RechtstextTodo`),
  (d) **tote CSS-Klassen** (`--notify`, kein gerendertes Element). Kein öffentlich
  sichtbarer Verstoß.
- ✅ Rechtslinks im Footer (Impressum/Datenschutz/AGB/Versand/Widerruf) auf jeder
  Seite verlinkt; Datenschutz-Seite rendert die neue Rohfassung (kein HTML-Rest).
- ✅ Beide Shirt-Seiten (Konfigurator) laden; in Stufe `preview` = Zustand
  „Produktvorschau" mit sichtbarem Vorschau-Hinweis; GPSR-Block vollständig.
- ✅ mailto-Text (für Stufe `inquiry`): unverbindlich, korrekte Felder, **keine**
  verbotenen Begriffe, kein Preis.
- ✅ Kein Warenkorb/Notify erreichbar (Icon entfernt, `CartDrawer`/`NotifyModal`
  gelöscht, `CartContext` nur Merkliste, keine Route, kein Backend-Aufruf).
- ✅ Kein Datenschreiben auf Klick (mailto only; Interesse-Tracking deaktiviert).
- ✅ JSON-LD ohne öffentlichen Preis: **kein** `Offer`-Objekt (kein „InStock"
  ohne Kaufmöglichkeit).

### Datenschutzhinweise, die noch externe Prüfung brauchen
Gesamter Datenschutztext (Rohfassung) + je real genutztem Dienst (Vercel, Supabase
inkl. Storage, SMTP): exakte Anbieteranschrift, AV-Vertrag (Art. 28), Drittland-/
Transfermechanismus, Speicherdauern; Klärung, ob Supabase/SMTP produktiv aktiv sind.
Siehe `DATENSCHUTZ-RECHTSTEXTE-CHECKLISTE.md` (mit konkreter AV-Vertrag-Tabelle).

### Fehlende öffentliche GPSR-Felder
Keine **blockierenden** – Hersteller, Anschrift, Kontakt, Name, Typ, SKU, Material,
Pflege sind vorhanden. Herkunftsland offen (nicht pflichtig für Textil).

### Fehlende interne Produktunterlagen
Siehe Abschnitt 5 (Farbcodes, Einkaufsrechnung, Größen, Etiketten-Fotos,
Veredelungsverfahren + -material, Risikoanalyse, Charge/Rückruf, Referenzlink).

### Gesamtempfehlung
Merch-Bereich ist als **öffentliche Vorschau + unverbindliches Anfragemodell**
technisch live-fähig; **einzige verbleibende Gate für Stufe 1 ist die
Datenschutz-Freigabe (B1)**. Aktivierung der **aktiven Anfrage (Stufe 2)** zusätzlich
erst nach echten Produktfotos und belegtem Material. **Noch nicht committet /
nicht nach `main` gemergt / kein Deployment** – Freigabe („go") abwarten.

---

*Kein Ersatz für anwaltliche Prüfung. Keine Garantie der Abmahn-/Bußgeldfreiheit.*
