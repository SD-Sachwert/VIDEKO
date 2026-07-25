# Shop-Launch-Checkliste

Vor dem Verkaufsstart an Verbraucher müssen **alle** Punkte bestätigt sein. Kein
Punkt wird abgehakt, solange kein Nachweis vorliegt. Legende: ✅ technisch erledigt ·
⚠️ teilweise · ❌ offen · 🏢 externe Aufgabe (nicht im Code lösbar). Unterschieden wird
zwischen **gesetzlichen** Anforderungen und **interner Verkaufsfreigabe** (Qualität).

## Rechtliches & Unternehmen

- [ ] 🏢 Gewerbe/Unternehmensgegenstand deckt Textil-/Merchandising-Onlinehandel ab
- [ ] 🏢 Register-Nr. im Impressum ergänzen **nur falls ein Registereintrag besteht**
      (kein Blocker, wenn nicht vorhanden)
- [ ] 🏢 USt-IdNr. ergänzen **nur falls vorhanden/erforderlich** (§ 27a UStG; kein
      Blocker, wenn zulässigerweise keine besteht)
- [ ] 🏢 **USt-Status (Regel/Kleinunternehmer) klären** – echtes Pflicht-TODO, muss zur
      „inkl. MwSt."-Ausweisung passen
- [x] ✅ Impressum ohne veralteten OS-Plattform-Link (entfernt)
- [ ] ⚠️ Impressum, AGB, Datenschutz, Widerrufsbelehrung, Muster-Widerrufsformular,
      Versand/Zahlung, Kontakt – vorhanden, aber **juristisch final zu prüfen**
      (aktuell teils ehrliche Platzhalter `RechtstextTodo`)
- [x] ✅ Rechts-Seiten im Footer verlinkt und erreichbar
- [x] ✅ Rechts-Links auch im Warenkorb erreichbar (AGB/Widerruf/Versand/Datenschutz)

## Produkte / Kennzeichnung (gesetzlich)

- [x] ✅ Produktseite zeigt Marke, Produktart, SKU, Material, Pflege, Hersteller
- [x] ✅ Material mit exakten %-Angaben im Datenbestand (Check erzwingt %-Angabe)
- [ ] ℹ️ Herkunftsland je Produkt intern erfassen/anzeigen, **sobald bekannt**
      (`COUNTRY_OF_ORIGIN`). **Kein** genereller Pflicht-Blocker
- [x] ✅ Veröffentlichungsschutz: `npm run check:products` blockt Live-Produkte mit
      Recht- **oder** Qualitätslücke

## Produktsicherheit (GPSR, gesetzlich)

- [x] ✅ Datenstruktur öffentlich/intern vorhanden (`compliance.js`)
- [ ] ❌ Interne Produktakten je Familie vollständig (`complete: true`)
- [ ] 🏢 Verantwortlicher Wirtschaftsakteur je Produkt bestätigt (`operatorRoleConfirmed`)
- [ ] 🏢 Risikoanalysen, Lieferantenerklärungen, Materialnachweise abgelegt

## Interne Verkaufsfreigabe (Qualität, keine Gesetzespflicht)

- [ ] ❌ Verlässliche Produktdarstellung statt KI-Mockup (`imageStatus` aktuell
      `ai_mockup`/`placeholder`). Interner Launch-Blocker – **kein GPSR-Nachweis**

## Checkout / Preise / Zahlung

- [x] ✅ Preise „inkl. MwSt." + Versandkostenhinweis + Lieferzeit ausgewiesen
- [ ] ❌ Echter On-Site-Checkout mit Zahlungsanbieter (aktuell mailto-Bestell-Flow)
- [ ] ❌ Bestell-Button „Zahlungspflichtig bestellen" (erst mit echtem Checkout sinnvoll)
- [ ] ❌ Bestellbestätigungs-Mail mit allen Pflichtangaben + Widerrufsformular
- [ ] ❌ Rechnungserstellung mit korrekten Firmen-/USt-Angaben
- [x] ✅ Keine Fake-Streichpreise; Omnibus-30-Tage-Struktur nicht verletzt (keine Rabatte aktiv)

## Datenschutz / Technik

- [x] ✅ Keine externen Tracker; Google Fonts selbst gehostet
- [x] ✅ Kein nicht-notwendiger Cookie/Tracker → derzeit kein Consent-Banner nötig
- [ ] 🏢 AV-Verträge (Vercel, Supabase, SMTP) abgeschlossen
- [ ] ⚠️ Datenschutzerklärung final juristisch geprüft

## Versand / Verpackung

- [ ] 🏢 LUCID-Registrierung + duales System (VerpackG)
- [ ] ⚠️ Versand-/Lieferzeitangaben final bestätigt

## Barrierefreiheit

- [x] ✅ Grundlagen (Tastatur, Alt-Texte, Warenkorb `inert`) umgesetzt
- [ ] ⚠️ Kontrastmessung, Screenreader-Test, `:focus-visible`, `aria-live`
- [ ] 🔎 Externe BFSG-Prüfung empfohlen

## Betrieb

- [ ] Testbestellung durchgeführt und Mailfluss geprüft (SMTP/Supabase-ENV gesetzt)
- [ ] Mobile Darstellung final geprüft
- [ ] Build fehlerfrei (`npm run build`) + `npm run check:products` grün

> **Startfreigabe erst, wenn alle ❌/🏢-Punkte erledigt oder bewusst als tragbares
> Risiko dokumentiert und freigegeben sind.**
