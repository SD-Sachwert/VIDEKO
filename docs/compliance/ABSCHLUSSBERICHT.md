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

**Geändert**
- `src/pages/Impressum.jsx` – veralteten OS-Plattform-Link entfernt.
- `src/styles.css` – externer Font-Import → lokal; `.pdp__facts`, `.cartdr__legal`.
- `src/pages/ProductDetail.jsx` – Pflichtangaben-Block (Hersteller/SKU/Material/Herkunft).
- `src/components/merch/CartDrawer.jsx` – Rechts-Links + `inert` wenn geschlossen.
- `api/notify.js` – `event:'interest'`-Zweig (Klick-Tracking ohne E-Mail).
- `package.json` – Skript `check:products`.

## 2. Neue Funktionen

- `publicCompliance(product)`, `getInternalRecord(product)`, `INTERNAL_RECORDS`.
- `check-products.mjs`: Pflichtfeld- und GPSR-Prüfung; Exit 1 bei unvollständigem Live-Produkt.

## 3. Behobene Probleme

- DSGVO: externe Google-Fonts entfernt (selbst gehostet).
- Verbotenen OS-Plattform-Link aus Impressum entfernt.
- Pflicht-Produktangaben (Textil/GPSR) fehlten auf der Produktseite → ergänzt.
- Rechts-Links im Warenkorb fehlten → ergänzt.
- Warenkorb-Overlay war geschlossen tastaturfokussierbar → `inert`.
- Klick-Tracking (Interesse) scheiterte mit 422 → behoben.

## 4. Unvollständige Produkte (zwei getrennte Ebenen)

Der Check unterscheidet sauber:

- **Recht/GPSR (gesetzlich):** Alle 51 Produkte haben eine **offene interne
  GPSR-Produktakte** (Lieferant/Hersteller/Nachweise). Das ist der rechtliche Blocker.
- **Interne Qualitäts-/Verkaufsfreigabe (keine Gesetzespflicht):** Es fehlt eine
  verlässliche Produktdarstellung (aktuell KI-Mockups). Bewusst als **interner**
  Launch-Blocker gesetzt – **kein GPSR-Nachweis**.

Die 2 als `live` markierten Signature-Tees werden deshalb als **nicht
veröffentlichungsfähig** gemeldet. Details: `produkt-vollstaendigkeit.md`.

Ein **fehlendes Herkunftsland ist KEIN Blocker** – es wird intern erfasst/angezeigt,
sobald bekannt.

## 5. Daten, die IHR liefern müsst

- Materialherkunft/Lieferant/Hersteller der Blankware je Produktfamilie (GPSR).
- Materialnachweise (Lieferantenerklärung/Etikett).
- USt-Status (Regel/Kleinunternehmer) – Pflicht-TODO.
- Register-Nr. / USt-IdNr. **nur falls vorhanden/erforderlich** (sonst kein Mangel).
- Verlässliche Produktfotos (interne Freigabe, nicht gesetzlich).
- Herkunftsland – optional, sobald bekannt (kein Blocker).

## 6. Externe Registrierungen / Pflichten

- LUCID-Registrierung + Vertrag duales System (VerpackG).
- Prüfung/Erweiterung Gewerbe (Textil-/Merchandising-Onlinehandel).
- AV-Verträge (Vercel, Supabase, SMTP-Anbieter).

## 7. Juristisch zu prüfende Texte

Impressum (Restangaben), AGB, Datenschutz, Widerrufsbelehrung + Muster-Formular,
Versand/Zahlung. Aktuell teils ehrliche Platzhalter – **nicht als rechtssicher
ausgegeben**.

## 8. Blocker für den Verkaufsstart

**Gesetzlich:**
1. Kein echter Zahlungs-Checkout + keine automatische Bestellbestätigung/Rechnung.
2. Rechtstexte nicht final geprüft.
3. GPSR-Produktakten leer (Lieferkette/Nachweise).
4. LUCID/VerpackG, Gewerbe, USt-Status offen.

**Interne Verkaufsfreigabe (keine Gesetzespflicht, aber von uns gesetzt):**
5. Verlässliche Produktdarstellung statt KI-Mockup.

## 9. Gesamtbewertung

**NICHT STARTBEREIT** für den echten Verkauf an Verbraucher.

Der Shop ist technisch stabil und in Sachen Datenschutz/Transparenz deutlich
verbessert. Für einen rechtskonformen Verkaufsstart fehlen jedoch ein echter
Checkout mit Zahlung/Bestellbestätigung/Rechnung, geprüfte Rechtstexte, die
GPSR-Produktnachweise sowie externe Registrierungen (LUCID, Gewerbe, USt). Als
Test-/Vorschau-Deployment (mailto-Bestellung) ist er nutzbar.
