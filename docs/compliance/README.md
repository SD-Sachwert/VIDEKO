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
| `produktfamilien-uebersicht.md` | Aktueller Verkaufsumfang: **eine** kaufbare Blankware-Familie (SOL'S Imperial 11500) vs. Coming-soon; Rollen + Vererbung |
| `sols-imperial-11500-unterlagen.md` | Konkrete Liste der noch fehlenden Unterlagen **nur** für die kaufbare Familie |
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

- **`RESPONSIBLE_OPERATOR`** – verantwortliches Unternehmen (aus Impressum belegt):
  VIDEKO Küchen eG (zugleich Veredelungspartner).
- **`publicCompliance(product)`** – die Angaben, die auf der Produktseite erscheinen
  (Marke, Produktart, SKU, Material, Pflege, Herkunft, Hersteller). Fehlt etwas,
  wird `null` zurückgegeben und die UI zeigt einen ehrlichen Hinweis statt einer Erfindung.
- **`PRODUCT_FAMILIES`** – die interne Blankware-/GPSR-Akte je **Produktfamilie**
  (aktuell nur `SOLS-IMPERIAL-11500`). Enthält Blankware (Hersteller SOLO INVEST SAS /
  Marke SOL'S, Lieferant Gröner-Schulze), Material, Farben/Größen (nicht geraten),
  Veredelungsprofile (VIDEKO selbst), Zertifikate (intern) und `complete: false`.
  Kaufbare Varianten erben von der Familie; nur variantenspezifische Felder (SKU,
  Farbe, Größe, Logo, Veredelung, Bild, Preis) weichen ab. `getProductFamily(product)`
  liefert die Familie zu einem Produkt.

## Veröffentlichungsschutz

`scripts/check-products.mjs` (`npm run check:products`) prüft **nur kaufbare Produkte**
(`purchasable: true` bzw. `status: live`) auf zwei getrennten Ebenen:

- **Recht/GPSR (gesetzlich):** Pflichtangaben (Textilkennzeichnung, Preisangaben) +
  Zuordnung zur Blankware-Familie + vollständige Familienakte (`complete: true`).
- **Interne Qualitäts-/Verkaufsfreigabe (keine Gesetzespflicht):** z. B. verlässliche
  Produktdarstellung statt KI-Mockup.

Ein kaufbares Produkt mit einer Recht- **oder** Qualitätslücke lässt den Check mit
Exit-Code 1 fehlschlagen. **Coming-soon-Produkte werden nur informativ gelistet und
blockieren nie** (Ausgabe-Abschnitte A kaufbar · B coming soon · C Rechtsblocker ·
D Qualitätsblocker · E spätere Aufgaben). Das Skript ist als Launch-Gate gedacht,
damit **unvollständige kaufbare Produkte nicht in den echten Verkauf gehen**. Ein
fehlendes **Herkunftsland ist bewusst KEIN Blocker**.

## Nächste Schritte, um die kaufbare Familie „verkaufsfertig" zu machen

Bezieht sich **nur** auf `SOLS-IMPERIAL-11500` – konkrete Liste:
`sols-imperial-11500-unterlagen.md`.

1. Blankware-Hersteller (SOLO INVEST SAS), Lieferant (Gröner-Schulze) und Veredelung
   (VIDEKO selbst) dokumentieren → `Produktionsinfos/` + `PRODUCT_FAMILIES[...]`.
2. Materialzusammensetzung + Farbcodes/Größen per Rechnung/Etikett belegen (nicht
   raten) → `Lieferantenerklaerungen/` + `Materialnachweise/`.
3. Herkunftsland bestätigen → `COUNTRY_OF_ORIGIN` in `compliance.js` eintragen.
4. Risikoanalyse des fertig veredelten Shirts anlegen → `Risikoanalysen/`.
5. Echtes Produktfoto statt KI-Muster (`imageStatus` auf `real_photo`/`final`).
6. Familienakte auf `complete: true` setzen und `npm run check:products` grün bekommen.
