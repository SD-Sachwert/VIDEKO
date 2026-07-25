# Shop-Launch-Checkliste

Diese Checkliste bezieht sich auf den **aktuellen Verkaufsumfang**: die einzige
kaufbare Blankware-Produktfamilie **SOL'S Imperial 11500** (T-Shirt, Schwarz/Weiß).
Coming-soon-Produkte sind **nicht** Teil dieses Verkaufsstarts und blockieren ihn
nicht (siehe `produktfamilien-uebersicht.md`).

Kein Punkt wird abgehakt, solange kein Nachweis vorliegt. Legende: ✅ technisch
erledigt · ⚠️ teilweise · ❌ offen · 🏢 externe Aufgabe (nicht im Code lösbar) ·
ℹ️ kein Blocker. Unterschieden wird zwischen **gesetzlichen** Anforderungen und
**interner Verkaufsfreigabe** (Qualität).

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

## Produktumfang / Kaufbarkeit

- [x] ✅ Nur die SOL'S-Imperial-Familie ist kaufbar (`purchasable: true` für die
      2 Signature-Tees); alle 49 übrigen Artikel `purchasable: false`
- [x] ✅ Coming-soon-Artikel: kein Warenkorb, kein Checkout, kein Preis
      (`add()` + Cart-Ableitung dreifach gesperrt); Button „Benachrichtige mich"
- [x] ✅ Coming-soon-Bild als unverbindliche Vorschau gekennzeichnet
      („Abbildung kann vom späteren Produkt abweichen")

## Produkte / Kennzeichnung (gesetzlich) – nur SOL'S Imperial 11500

- [x] ✅ Produktseite zeigt Marke, Produktart, SKU, Material, Pflege, Hersteller
- [x] ✅ Material mit exakten %-Angaben (Schwarz/Weiß = 100 % Baumwolle, Single
      Jersey 190 g/m²); Check erzwingt %-Angabe
- [ ] ❌ Tatsächliche Farbcodes/Weißton (102 vs. 117) + Größen per Rechnung belegen
      (siehe `sols-imperial-11500-unterlagen.md`)
- [ ] ℹ️ Herkunftsland intern erfassen/anzeigen, **sobald bekannt**
      (`COUNTRY_OF_ORIGIN`). **Kein** genereller Pflicht-Blocker
- [x] ✅ Veröffentlichungsschutz: `npm run check:products` blockt kaufbare Produkte
      mit Recht- **oder** Qualitätslücke; Coming-soon zählt nicht als Blocker

## Produktsicherheit (GPSR, gesetzlich) – nur kaufbare Familie

- [x] ✅ Blankware-Familienstruktur vorhanden (`PRODUCT_FAMILIES`, `compliance.js`)
- [ ] ❌ Blankware-/Veredelungsakte `SOLS-IMPERIAL-11500` vollständig (`complete: true`)
- [ ] 🏢 Rollen bestätigt: Hersteller SOLO INVEST SAS, Lieferant Gröner-Schulze,
      Veredelung + verantw. Wirtschaftsakteur VIDEKO Küchen eG (`operatorRoleConfirmed`)
- [ ] 🏢 Risikoanalyse fertiges Shirt, Veredelungsmaterial-Nachweise, Etikettenfotos
- [ ] ℹ️ OEKO-TEX / PETA Vegan nur intern – nicht ungeprüft fürs Endprodukt bewerben

## Interne Verkaufsfreigabe (Qualität, keine Gesetzespflicht)

- [ ] ❌ Verlässliche Produktdarstellung des kaufbaren Shirts statt KI-Mockup
      (`imageStatus` aktuell `ai_mockup`). Interner Launch-Blocker – **kein GPSR-Nachweis**

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
