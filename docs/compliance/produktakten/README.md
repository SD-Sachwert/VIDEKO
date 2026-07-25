# Produktakten

Je Produktfamilie eine Akte (z. B. `signature-tee.md`) mit:

- Produktidentifikation (Modell-/Typbezeichnung der Blankware)
- Artikel-, Modell- oder Chargennummer
- Hersteller der Blankware (Name, Anschrift, elektronische Kontaktadresse)
- Lieferant / Großhändler
- Produktions-/Veredelungspartner (Druck), falls extern
- Materialzusammensetzung + Nachweis (Verweis auf `../Materialnachweise/`)
- Herkunftsland
- Verweis auf Risikoanalyse (`../Risikoanalysen/`) und Qualitätsprüfung (`../Qualitaetspruefungen/`)
- Aufnahmedatum in den Shop

Diese Angaben spiegeln die Felder in `src/data/compliance.js` → `INTERNAL_RECORDS`.
Sobald eine Akte vollständig belegt ist, im Code `complete: true` setzen.

> Noch keine Akte vollständig. Inhalte sind intern und gehören nicht in den Shop.
