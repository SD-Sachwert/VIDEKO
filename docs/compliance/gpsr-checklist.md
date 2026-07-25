# GPSR-Checkliste (Produktsicherheit)

Verordnung (EU) 2023/988 über die allgemeine Produktsicherheit (GPSR), gilt seit
**13.12.2024**. Betrifft auch Bekleidung/Textilien im Onlinehandel an Verbraucher.

> Kein Punkt hier wird abgehakt, ohne dass der Nachweis tatsächlich vorliegt.

## 1. Verantwortlicher Wirtschaftsakteur (Art. 16)

- [ ] Für jedes Produkt ist ein in der EU niedergelassener Wirtschaftsakteur
      benannt (Hersteller, Importeur, Bevollmächtigter oder Fulfilment-Dienstleister).
- [ ] Geklärt, ob **VIDEKO Küchen eG** diese Rolle vollständig ausfüllt oder ob ein
      separater Hersteller/Importeur der Blankware zu nennen ist.
      → `RESPONSIBLE_OPERATOR.operatorRoleConfirmed` steht noch auf `false`.
- [ ] Name + Postanschrift + elektronische Kontaktadresse des Wirtschaftsakteurs
      sind für den Kunden erreichbar (Impressum + Produktseite). **erledigt im Code**
      (Produktseite zeigt Hersteller/verantwortliches Unternehmen).

## 2. Produktbezogene Angaben & Rückverfolgbarkeit

Je Produktfamilie in `Produktakten/` bzw. `INTERNAL_RECORDS`:

- [ ] Produktidentifikation (Modell-/Typbezeichnung der Blankware)
- [ ] Artikel-, Modell- oder Chargennummer
- [ ] Tatsächlicher Hersteller der Blankware (Name + Anschrift + Kontakt)
- [ ] Lieferant / Großhändler
- [ ] Produktions-/Veredelungspartner (Druck), falls extern
- [ ] Herkunftsland → in `COUNTRY_OF_ORIGIN` (compliance.js) eintragen, sobald belegt

## 3. Sicherheit & Dokumentation

- [ ] Risikoanalyse je Produktfamilie (`Risikoanalysen/`)
- [ ] Prüfung auf notwendige Warn-/Sicherheitshinweise
      (z. B. Kordelzüge an Kinder-Hoodies – aktuell keine Kinderartikel geführt)
- [ ] Technische Unterlagen / Materialnachweise abgelegt (`Materialnachweise/`)
- [ ] Qualitäts-/Wareneingangsprüfung dokumentiert (`Qualitaetspruefungen/`)
- [ ] Aufnahmedatum in den Shop festgehalten (`dateAddedToShop`)

## 4. Meldewege & Vorfälle

- [ ] Prozess für Verbraucherbeschwerden / Sicherheitsmeldungen (`Reklamationen/`)
- [ ] Vorgehen bei Sicherheitsproblem / Rückruf definiert (`Rueckrufdoku/`)
- [ ] `recallStatus` je Produkt gepflegt (Standard: „kein Rückruf")

## Status

**Offen.** Für alle Produktfamilien steht `INTERNAL_RECORDS[...].complete` auf
`false`. Solange das so ist, meldet `npm run check:products` live-Produkte als
nicht veröffentlichungsfähig.
