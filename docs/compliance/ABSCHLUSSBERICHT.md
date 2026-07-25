# Abschlussbericht – Verkaufsvorbereitung VIDEKO Textilshop

## 1. Geänderte / neue Dateien

**Neu**
- `src/data/compliance.js` – Compliance-Datenschicht (öffentlich vs. intern, GPSR/Textil).
- `scripts/check-products.mjs` – Produkt-Vollständigkeitsprüfung + Launch-Gate.
- `scripts/fetch-fonts.mjs` – lädt Google-Fonts-woff2 zum Selbst-Hosten.
- `src/fonts.css` + `src/assets/fonts/*.woff2` – selbst gehostete Schriften.
- `docs/compliance/` – README, GPSR-, VerpackG/LUCID-, Unternehmensdaten-,
  Services-, Barrierefreiheits-Report, Launch-Checkliste, Bestandsaufnahme,
  Produkt-Vollständigkeitsreport + interne Ablageordner.

**Neu (Korrektur Verkaufsumfang)**
- `docs/compliance/produktfamilien-uebersicht.md` – eine kaufbare Blankware-Familie
  vs. Coming-soon.
- `docs/compliance/sols-imperial-11500-unterlagen.md` – konkrete fehlende-Unterlagen-Liste.

**Geändert**
- `src/data/products.json` – Feld `purchasable` je Produkt (nur SOL'S-Imperial-Tees
  `true`, alle übrigen 49 `false`).
- `src/data/compliance.js` – Blankware-Familienmodell `PRODUCT_FAMILIES`
  (SOL'S Imperial 11500), Herstellerrollen, Veredelungsprofile, Zertifikate intern.
- `src/data/merch.js` – `purchasable` in die abgeleiteten Produktdaten übernommen.
- `src/shop/CartContext.jsx` – Warenkorb/Checkout dreifach gegen nicht-kaufbare
  Artikel gesperrt.
- `scripts/check-products.mjs` – gate nur kaufbare Produkte; Ausgabe A–E.
- `src/pages/Impressum.jsx` – veralteten OS-Plattform-Link entfernt.
- `src/styles.css` – externer Font-Import → lokal; `.pdp__facts`, `.cartdr__legal`.
- `src/pages/ProductDetail.jsx` – Pflichtangaben-Block + Coming-soon-Vorschauhinweis.
- `src/components/merch/CartDrawer.jsx` – Rechts-Links + `inert` wenn geschlossen.
- `api/notify.js` – `event:'interest'`-Zweig (Klick-Tracking ohne E-Mail).
- `package.json` – Skript `check:products`.

## 2. Neue Funktionen

- `publicCompliance(product)`, `PRODUCT_FAMILIES`, `getProductFamily(product)`.
- `check-products.mjs`: prüft nur kaufbare Produkte; Exit 1 bei unvollständigem
  kaufbarem Produkt; Coming-soon nur informativ (Abschnitte A–E).

## 3. Behobene Probleme

- DSGVO: externe Google-Fonts entfernt (selbst gehostet).
- Verbotenen OS-Plattform-Link aus Impressum entfernt.
- Pflicht-Produktangaben (Textil/GPSR) fehlten auf der Produktseite → ergänzt.
- Rechts-Links im Warenkorb fehlten → ergänzt.
- Warenkorb-Overlay war geschlossen tastaturfokussierbar → `inert`.
- Klick-Tracking (Interesse) scheiterte mit 422 → behoben.

## 4. Verkaufsumfang & unvollständige Produkte

**Aktuell kaufbar ist nur eine Blankware-Produktfamilie:** SOL'S Imperial 11500
(T-Shirt, Schwarz/Weiß, `purchasable: true`). Die verschiedenen Logo-, Farb- und
Größenvarianten sind **keine 51 Einzelprodukte**, sondern Varianten dieser einen
Familie. Die 49 übrigen Artikel sind „Coming soon" (`purchasable: false`) und
**nicht** Teil des aktuellen Verkaufsstarts.

Der Check (`npm run check:products`) prüft nur kaufbare Produkte und unterscheidet:

- **Recht/GPSR (gesetzlich):** Die Blankware-/GPSR-Akte `SOLS-IMPERIAL-11500` ist
  noch **unvollständig** (Rechnung/Hersteller/Etiketten/Veredelung/Risikoanalyse).
  Das ist der rechtliche Blocker.
- **Interne Qualitäts-/Verkaufsfreigabe (keine Gesetzespflicht):** Für das Shirt
  fehlt eine verlässliche Produktdarstellung (aktuell KI-Muster). Interner
  Launch-Blocker – **kein GPSR-Nachweis**.

Coming-soon-Produkte werden als „noch nicht für den Verkauf dokumentiert"
ausgewiesen, blockieren den Shirt-Launch aber **nicht**. Ein **fehlendes
Herkunftsland ist KEIN Blocker**. Details: `produkt-vollstaendigkeit.md`,
`sols-imperial-11500-unterlagen.md`.

## 5. Daten, die IHR liefern müsst (für das kaufbare Shirt)

- Einkaufsrechnung/Bestellbestätigung (Gröner-Schulze) + Chargenzuordnung.
- Bestätigung Blankware-Hersteller SOLO INVEST SAS + technisches Datenblatt.
- Tatsächliche Farbcodes/Weißton (102 vs. 117) + Etikettenfotos.
- Veredelungsverfahren + -material inkl. Sicherheits-/Schadstoffnachweisen
  (Veredelung durch VIDEKO selbst).
- Risikoanalyse des fertig veredelten Shirts.
- USt-Status (Regel/Kleinunternehmer) – Pflicht-TODO.
- Register-Nr. / USt-IdNr. **nur falls vorhanden/erforderlich** (sonst kein Mangel).
- Verlässliche Produktfotos des Shirts (interne Freigabe, nicht gesetzlich).
- Herkunftsland – optional, sobald bekannt (kein Blocker).

Vollständige Liste: `sols-imperial-11500-unterlagen.md`.

## 6. Externe Registrierungen / Pflichten

- LUCID-Registrierung + Vertrag duales System (VerpackG).
- Prüfung/Erweiterung Gewerbe (Textil-/Merchandising-Onlinehandel).
- AV-Verträge (Vercel, Supabase, SMTP-Anbieter).

## 7. Juristisch zu prüfende Texte

Impressum (Restangaben), AGB, Datenschutz, Widerrufsbelehrung + Muster-Formular,
Versand/Zahlung. Aktuell teils ehrliche Platzhalter – **nicht als rechtssicher
ausgegeben**.

## 8. Blocker für den Verkaufsstart (nur SOL'S Imperial 11500)

**Gesetzlich:**
1. Kein echter Zahlungs-Checkout + keine automatische Bestellbestätigung/Rechnung.
2. Rechtstexte nicht final geprüft.
3. Blankware-/GPSR-Akte `SOLS-IMPERIAL-11500` unvollständig (Lieferkette/Veredelung/
   Nachweise) – siehe `sols-imperial-11500-unterlagen.md`.
4. LUCID/VerpackG, Gewerbe, USt-Status offen.

**Interne Verkaufsfreigabe (keine Gesetzespflicht, aber von uns gesetzt):**
5. Verlässliche Produktdarstellung des Shirts statt KI-Muster.

**Nicht Teil dieses Verkaufsstarts:** Die 49 Coming-soon-Artikel sind gesperrt und
werden erst vor ihrer späteren Aktivierung dokumentiert – kein aktueller Blocker.

## 9. Gesamtbewertung

**Kaufbares Shirt (SOL'S Imperial 11500): NOCH NICHT STARTBEREIT** für den echten
Verkauf an Verbraucher.

Der Verkaufsumfang ist jetzt sauber begrenzt: Nur die SOL'S-Imperial-Familie ist
kaufbar, alle übrigen Artikel sind hart als „Coming soon" gesperrt (kein
Warenkorb/Checkout/Preis) und ziehen die Bewertung **nicht** mehr pauschal nach
unten. Für den rechtskonformen Verkaufsstart des Shirts fehlen jedoch weiterhin ein
echter Checkout mit Zahlung/Bestellbestätigung/Rechnung, geprüfte Rechtstexte, die
vollständige Blankware-/GPSR-Akte inkl. Veredelungsnachweisen sowie externe
Registrierungen (LUCID, Gewerbe, USt). Zusätzlich ist die KI-Vorschau durch eine
verlässliche Produktdarstellung zu ersetzen (interne Freigabe). Als Test-/
Vorschau-Deployment (mailto-Anfrage) ist der Shop nutzbar.

Die Coming-soon-Artikel (Hoodies, Polos, V-Necks, Sneaker u. a.) sind **nicht**
„nicht startbereit", sondern lediglich noch nicht zur späteren Verkaufsaktivierung
freigegeben.
