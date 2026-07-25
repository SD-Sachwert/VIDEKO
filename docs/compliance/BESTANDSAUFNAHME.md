# Bestandsaufnahme – VIDEKO Textilshop

Technische und inhaltliche Analyse des Ist-Zustands vor Verkaufsstart.

## Technischer Rahmen

- **Frontend:** React 19 + Vite 8 (SPA, react-router-dom 7). Statisches Hosting
  (Vercel) mit SPA-Rewrites (`vercel.json`).
- **Produktdaten:** `src/data/products.json` (51 Einträge). Davon ist **nur eine
  Blankware-Produktfamilie kaufbar**: SOL'S Imperial 11500 (2 Einträge,
  `purchasable: true`). Die übrigen 49 sind „Coming soon" (`purchasable: false`).
  `merch.js` leitet Familien, Preise (centbasiert) und Bilder ab; die
  Blankware-/GPSR-Akte liegt in `src/data/compliance.js` (`PRODUCT_FAMILIES`).
- **Backend:** Serverless-Funktionen `api/notify.js`, `api/lead.js` (Nodemailer +
  Supabase). Ohne konfigurierte ENV-Variablen → ehrliche `configured:false`-Antwort,
  **kein Fake-Erfolg**.
- **Warenkorb:** Client-seitig (`CartContext`, `localStorage`). „Zur Kasse" öffnet
  eine vorausgefüllte Bestell-Mail (mailto) an `shop@videko-kuechen.de` – **kein
  echter Zahlungs-Checkout**.

## Was bereits gut ist

- Keine externen Tracker; Google Fonts **selbst gehostet** (DSGVO-Risiko beseitigt).
- Rechts-Seiten vorhanden und im Footer + Warenkorb verlinkt.
- Produktseite zeigt jetzt Marke, Produktart, SKU, Material, Pflege, Herkunft,
  Hersteller/verantwortliches Unternehmen mit voller Anschrift + E-Mail.
- Ehrliche Platzhalter (`RechtstextTodo`) statt erfundener Rechtstexte.
- Preise „inkl. MwSt." + Versandkosten + Lieferzeit ausgewiesen; keine Fake-Rabatte.
- Veröffentlichungsschutz per `npm run check:products`.

## Wesentliche Lücken (bezogen auf das kaufbare SOL'S-Imperial-Shirt)

Gesetzlich:
1. **Kein echter Checkout / keine Zahlung / keine automatische Bestellbestätigung
   + Rechnung.** Aktuell mailto-Flow.
2. **Rechtstexte teils Platzhalter** – juristische Endfassung + Prüfung nötig.
3. **Blankware-/GPSR-Akte `SOLS-IMPERIAL-11500` offen** (Einkaufsrechnung,
   Herstellerbestätigung, Etiketten, Veredelungsmaterial, Risikoanalyse). Konkrete
   Liste: `sols-imperial-11500-unterlagen.md`.
4. **Externe Registrierungen offen:** LUCID/VerpackG, Gewerbeumfang, USt-Status,
   AV-Verträge. (Register-Nr./USt-IdNr. nur falls vorhanden/erforderlich.)

Interne Verkaufsfreigabe (keine Gesetzespflicht):
5. **Produktdarstellung des Shirts ist ein KI-Muster** – keine verlässlichen
   Fotos. Interner Launch-Blocker, kein GPSR-Nachweis. Herkunftsland optional.

Nicht Teil dieses Verkaufsstarts:
6. Die 49 Coming-soon-Artikel sind gesperrt (`purchasable: false`) und werden erst
   vor ihrer späteren Aktivierung dokumentiert – **kein** aktueller Blocker.

## Datenbasis dieser Analyse

- Code: `src/pages/*`, `src/components/merch/*`, `src/data/*`, `api/*`,
  `vercel.json`, `index.html`.
- Prüf-Skript: `scripts/check-products.mjs` (51 Einträge, 2 kaufbar, 49 coming soon).

Details je Themenfeld: siehe die übrigen Dateien in diesem Ordner.
