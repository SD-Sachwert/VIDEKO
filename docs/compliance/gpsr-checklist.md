# GPSR-Checkliste (Produktsicherheit)

Verordnung (EU) 2023/988 über die allgemeine Produktsicherheit (GPSR), gilt seit
**13.12.2024**. Betrifft auch Bekleidung/Textilien im Onlinehandel an Verbraucher.

> Kein Punkt hier wird abgehakt, ohne dass der Nachweis tatsächlich vorliegt.

> **Aktueller Umfang:** Nur die kaufbare Familie `SOLS-IMPERIAL-11500` (SOL'S
> Imperial 11500, T-Shirt) muss für den aktuellen Verkaufsstart GPSR-vollständig
> sein. Die konkrete Unterlagenliste steht in
> `sols-imperial-11500-unterlagen.md`. Coming-soon-Produkte werden erst vor ihrer
> späteren Aktivierung dokumentiert.

## 1. Verantwortlicher Wirtschaftsakteur (Art. 16)

- [ ] Für jedes kaufbare Produkt ist ein in der EU niedergelassener Wirtschaftsakteur
      benannt (Hersteller, Importeur, Bevollmächtigter oder Fulfilment-Dienstleister).
- [ ] Rollen sauber getrennt (siehe `PRODUCT_FAMILIES`):
      **Blankware-Hersteller** SOLO INVEST SAS / SOL'S · **Lieferant** Gröner-Schulze ·
      **Veredelung** VIDEKO Küchen eG (selbst) · **verantw. Wirtschaftsakteur des
      Endprodukts** VIDEKO Küchen eG. → `operatorRoleConfirmed` steht noch auf `false`.
- [ ] Name + Postanschrift + elektronische Kontaktadresse des Wirtschaftsakteurs
      sind für den Kunden erreichbar (Impressum + Produktseite). **erledigt im Code**
      (Produktseite zeigt Hersteller/verantwortliches Unternehmen).

## 2. Produktbezogene Angaben & Rückverfolgbarkeit

Je Blankware-Produktfamilie in `Produktakten/` bzw. `PRODUCT_FAMILIES`:

- [ ] Produktidentifikation (Modell-/Typbezeichnung der Blankware) — SOL'S Imperial 11500
- [ ] Artikel-, Modell- oder Chargennummer (Rechnung/Charge)
- [ ] Tatsächlicher Hersteller der Blankware bestätigt (SOLO INVEST SAS)
- [ ] Lieferant / Großhändler (Gröner-Schulze) — Rechnung/Bestellbestätigung
- [ ] Veredelungsverfahren + -material dokumentiert (VIDEKO veredelt selbst)
- [ ] Herkunftsland → in `COUNTRY_OF_ORIGIN` (compliance.js) eintragen, sobald belegt
      (kein pauschaler Pflicht-Blocker)

## 3. Sicherheit & Dokumentation

- [ ] Risikoanalyse des **fertig veredelten** Shirts (`Risikoanalysen/`)
- [ ] Prüfung auf notwendige Warn-/Sicherheitshinweise
      (z. B. Kordelzüge an Kinder-Hoodies – aktuell keine Kinderartikel geführt)
- [ ] Technische Unterlagen / Materialnachweise abgelegt (`Materialnachweise/`)
- [ ] Qualitäts-/Wareneingangsprüfung dokumentiert (`Qualitaetspruefungen/`)
- [ ] Aufnahmedatum in den Shop festgehalten (`dateAddedToShop`)

## 4. Meldewege & Vorfälle

- [ ] Prozess für Verbraucherbeschwerden / Sicherheitsmeldungen (`Reklamationen/`)
- [ ] Vorgehen bei Sicherheitsproblem / Rückruf definiert (`Rueckrufdoku/`)
- [ ] `recallStatus` je Produkt gepflegt (Standard: „kein Rückruf")

## 4a. Zertifikate der Blankware

- [ ] OEKO-TEX Standard 100 / PETA Approved Vegan nur **intern** dokumentiert,
      **nicht** ungeprüft als Aussage über das fertige VIDEKO-Shirt beworben
      (`certificatesPubliclyClaimable: false`).

## Status

**Offen.** `PRODUCT_FAMILIES['SOLS-IMPERIAL-11500'].complete` steht auf `false`.
Solange das so ist, meldet `npm run check:products` das kaufbare Shirt als nicht
veröffentlichungsfähig. Coming-soon-Produkte werden dabei bewusst nicht als
Blocker gewertet.
