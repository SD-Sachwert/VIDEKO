# Bestandsaufnahme – VIDEKO Textilshop

Technische und inhaltliche Analyse des Ist-Zustands vor Verkaufsstart.

## Technischer Rahmen

- **Frontend:** React 19 + Vite 8 (SPA, react-router-dom 7). Statisches Hosting
  (Vercel) mit SPA-Rewrites (`vercel.json`).
- **Produktdaten:** `src/data/products.json` (51 Produkte, Array). `merch.js` leitet
  Familien, Preise (centbasiert) und Bilder ab.
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

## Wesentliche Lücken

Gesetzlich:
1. **Kein echter Checkout / keine Zahlung / keine automatische Bestellbestätigung
   + Rechnung.** Aktuell mailto-Flow.
2. **Rechtstexte teils Platzhalter** – juristische Endfassung + Prüfung nötig.
3. **GPSR-Produktakten leer** (Lieferant, Hersteller, Nachweise, Risikoanalyse offen).
4. **Externe Registrierungen offen:** LUCID/VerpackG, Gewerbeumfang, USt-Status,
   AV-Verträge. (Register-Nr./USt-IdNr. nur falls vorhanden/erforderlich.)

Interne Verkaufsfreigabe (keine Gesetzespflicht):
5. **Produktdarstellung sind KI-Muster/Platzhalter** – keine verlässlichen Fotos.
   Interner Launch-Blocker, kein GPSR-Nachweis. Herkunftsland optional (kein Blocker).

## Datenbasis dieser Analyse

- Code: `src/pages/*`, `src/components/merch/*`, `src/data/*`, `api/*`,
  `vercel.json`, `index.html`.
- Prüf-Skript: `scripts/check-products.mjs` (51 Produkte, 2 live).

Details je Themenfeld: siehe die übrigen Dateien in diesem Ordner.
