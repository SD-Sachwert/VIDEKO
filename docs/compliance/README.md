# Compliance – VIDEKO Textilshop

Dieser Ordner bündelt die **rechtlichen und produktbezogenen Nachweise** für den
Verkauf der VIDEKO-Textilien an Verbraucher in Deutschland. Er ist **intern** und
gehört nicht in den öffentlichen Shop.

> Grundsatz: In diesem Projekt werden **keine Pflichtangaben, Nachweise oder
> Registrierungen erfunden**. Was hier steht, ist entweder belegt oder als
> **offene Aufgabe (TODO)** markiert. Nichts wird als „erledigt" ausgewiesen,
> solange kein Nachweis vorliegt.

## Was hier liegt

| Datei / Ordner | Inhalt |
|---|---|
| `gpsr-checklist.md` | Produktsicherheit (GPSR EU 2023/988) – Pflichten je Produkt |
| `verpackungsgesetz-lucid-checklist.md` | Verpackungsgesetz, LUCID-Registrierung, duales System |
| `unternehmensdaten-todo.md` | Konsistenz Firmendaten + offene Gewerbe-Erweiterung |
| `services-datenverarbeitung.md` | Inventar externer Dienste / Datenverarbeitung (DSGVO/Cookies) |
| `schrift-lizenzen.md` | Lizenznachweis selbst gehosteter Fonts (+ `OFL-*.txt`) |
| `produkt-vollstaendigkeit.md` | Auto-Report aus `scripts/check-products.mjs` (nicht von Hand pflegen) |
| `produktakten/` | Je Produktfamilie: Datenblatt, Nachweise, Etikettenfotos |
| `Lieferantenerklaerungen/` | Lieferantenerklärungen zur Materialzusammensetzung |
| `Materialnachweise/` | Materialnachweise / Prüfberichte / Etiketten |
| `Rechnungen/` | Einkaufs-/Wareneingangsrechnungen (Rückverfolgbarkeit) |
| `Produktionsinfos/` | Angaben zu Blankware-Hersteller & Veredelungs-/Druckpartner |
| `Qualitaetspruefungen/` | Ergebnisse von Qualitäts-/Wareneingangsprüfungen |
| `Risikoanalysen/` | Risikobewertung je Produktfamilie (GPSR) |
| `Reklamationen/` | Beschwerden, Sicherheitsmeldungen, Bearbeitung |
| `Rueckrufdoku/` | Dokumentation zu Rückrufen / Sicherheitswarnungen |

## Datenmodell im Code

Die maschinenlesbare Struktur liegt in `src/data/compliance.js`:

- **`RESPONSIBLE_OPERATOR`** – verantwortliches Unternehmen (aus Impressum belegt).
- **`publicCompliance(product)`** – die Angaben, die auf der Produktseite erscheinen
  (Marke, Produktart, SKU, Material, Pflege, Herkunft, Hersteller). Fehlt etwas,
  wird `null` zurückgegeben und die UI zeigt einen ehrlichen Hinweis statt einer Erfindung.
- **`INTERNAL_RECORDS`** – die interne Produktakte je Produktfamilie. Alle Felder
  stehen zunächst auf `null` / `complete: false`.

## Veröffentlichungsschutz

`scripts/check-products.mjs` (`npm run check:products`) prüft jedes Produkt auf zwei
getrennten Ebenen:

- **Recht/GPSR (gesetzlich):** Pflichtangaben (Textilkennzeichnung, Preisangaben) +
  vollständige interne GPSR-Produktakte.
- **Interne Qualitäts-/Verkaufsfreigabe (keine Gesetzespflicht):** z. B. verlässliche
  Produktdarstellung statt KI-Mockup.

Ein als `live` markiertes Produkt mit einer Recht- **oder** Qualitätslücke lässt den
Check mit Exit-Code 1 fehlschlagen. Das Skript ist als Launch-Gate gedacht (manuell
oder in CI vor einem produktiven Release), damit **unvollständige Produkte nicht in
den echten Verkauf gehen**. Ein fehlendes **Herkunftsland ist bewusst KEIN Blocker**.

## Nächste Schritte, um ein Produkt „verkaufsfertig" zu machen

1. Blankware-Hersteller, Lieferant und (falls extern) Druck-/Veredelungspartner
   dokumentieren → `Produktionsinfos/` + `INTERNAL_RECORDS[...]`.
2. Materialzusammensetzung per Lieferantenerklärung/Etikett belegen →
   `Lieferantenerklaerungen/` + `Materialnachweise/`.
3. Herkunftsland bestätigen → `COUNTRY_OF_ORIGIN` in `compliance.js` eintragen.
4. Risikoanalyse je Produktfamilie anlegen → `Risikoanalysen/`.
5. Echtes Produktfoto statt KI-Muster (`imageStatus` auf `real_photo`/`final`).
6. Produktakte auf `complete: true` setzen und `npm run check:products` grün bekommen.
