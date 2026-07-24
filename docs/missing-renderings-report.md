# Fehlende Renderings & echte Fotos – exakte Kombinationsliste

Automatisch aus `product-image-manifest.json` erzeugt. Jede Zeile ist eine im
Shop tatsächlich auswählbare Kombination.

## Bildstatus-Vokabular (korrigiert)

- `real_photo` – **nur** für tatsächlich fotografierte, physische Produkte.
- `ai_mockup` – KI-generierte Vorschau. **Alle** aktuell im Shop verwendeten
  Bilder sind KI-Mockups (es liegt noch kein einziges echtes Produktfoto vor).
- `placeholder` – noch gar kein Bild, nur eine ruhige „In Vorbereitung"-Kachel.
- `missing` – Kombination wählbar, aber ohne jede Datei (kommt aktuell nicht vor).

## Bildstatistik

| Kategorie | Anzahl |
|---|---|
| **Auswählbare Varianten gesamt** | 48 |
| Echtes Foto (real_photo) | 0 |
| KI-Mockup (ai_mockup) | 45 |
| Platzhalter (placeholder) | 3 |
| Komplett fehlend (missing) | 0 |

> **placeholder ist NICHT 0.** Für die unten gelisteten 11 Kombinationen liegt
> weder ein Foto noch ein KI-Rendering vor. Es wurde bewusst **kein falsches
> Produktbild** eingesetzt (z. B. ein PURE-Bild für ein Signature-Produkt).
> Sobald echte Renderings/Fotos geliefert werden, sinkt placeholder auf 0.

## 1. Platzhalter – kein Produktbild (3)

| Familie/Bereich | Logo-Stil | Farbe | Platzierung | Benötigter Bildtyp | Gewünschter Dateiname |
|---|---|---|---|---|---|
| T-Shirt Regular | ONE | Schwarz | Kleines Brustlogo | primaeres_packshot | `v3-tshirt-regular-one-black-chest.webp` |
| T-Shirt Regular | ONE | Weiß | Kleines Brustlogo | primaeres_packshot | `v3-tshirt-regular-one-white-chest.webp` |
| T-Shirt Regular | PRESTIGE | Schwarz | Kleines Brustlogo | primaeres_packshot | `v3-tshirt-regular-prestige-black-chest.webp` |

## 2. KI-Mockups – vor Verkauf durch echtes Foto ersetzen (45)

Alle sichtbaren Produktbilder sind derzeit KI-Mockups. Für die kaufbaren
T-Shirts ist echtes Fotomaterial vor dem Verkaufsstart Pflicht (siehe
`missingImageTypes` je Zeile: Front, Rückseite, Druckdetail, Stoff-/Nahtdetail,
Lifestyle, Passform, Personalisierungsbeispiel).

| Familie/Bereich | Logo-Stil | Farbe | Platzierung | Status | Gewünschter Dateiname |
|---|---|---|---|---|---|
| T-Shirt Regular | SIGNATURE | Schwarz | Kleines Brustlogo | ai_mockup | `v3-tshirt-regular-signature-black-chest.webp` |
| T-Shirt Regular | SIGNATURE | Schwarz | Großes Frontlogo | ai_mockup | `v3-tshirt-regular-signature-black-front.webp` |
| T-Shirt Regular | SIGNATURE | Weiß | Kleines Brustlogo | ai_mockup | `v3-tshirt-regular-signature-white-chest.webp` |
| T-Shirt Regular | SIGNATURE | Weiß | Großes Frontlogo | ai_mockup | `v3-tshirt-regular-signature-white-front.webp` |
| T-Shirt Regular | PURE | Schwarz | Kleines Brustlogo | ai_mockup | `v3-tshirt-regular-pure-black-chest.webp` |
| T-Shirt Regular | PURE | Schwarz | Großes Frontlogo | ai_mockup | `v3-tshirt-regular-pure-black-front.webp` |
| T-Shirt Regular | PURE | Weiß | Kleines Brustlogo | ai_mockup | `v3-tshirt-regular-pure-white-chest.webp` |
| T-Shirt Regular | PURE | Weiß | Großes Frontlogo | ai_mockup | `v3-tshirt-regular-pure-white-front.webp` |
| T-Shirt Regular | PRESTIGE | Weiß | Kleines Brustlogo | ai_mockup | `v3-tshirt-regular-prestige-white-chest.webp` |
| V-Neck | PURE | Schwarz | Kleines Brustlogo | ai_mockup | `v3-vneck-pure-black-chest.webp` |
| V-Neck | PURE | Weiß | Kleines Brustlogo | ai_mockup | `v3-vneck-pure-white-chest.webp` |
| V-Neck | PRESTIGE | Schwarz | Kleines Brustlogo | ai_mockup | `v3-vneck-prestige-black-chest.webp` |
| V-Neck | PRESTIGE | Weiß | Kleines Brustlogo | ai_mockup | `v3-vneck-prestige-white-chest.webp` |
| Polo | SIGNATURE | Schwarz | Kleines Brustlogo | ai_mockup | `v3-polo-signature-black-chest.webp` |
| Polo | SIGNATURE | Weiß | Kleines Brustlogo | ai_mockup | `v3-polo-signature-white-chest.webp` |
| Polo | PURE | Schwarz | Kleines Brustlogo | ai_mockup | `v3-polo-pure-black-chest.webp` |
| Polo | PURE | Weiß | Kleines Brustlogo | ai_mockup | `v3-polo-pure-white-chest.webp` |
| Polo | PRESTIGE | Schwarz | Kleines Brustlogo | ai_mockup | `v3-polo-prestige-black-chest.webp` |
| Polo | PRESTIGE | Weiß | Kleines Brustlogo | ai_mockup | `v3-polo-prestige-white-chest.webp` |
| Hoodie | SIGNATURE | Schwarz | Großes Frontlogo | ai_mockup | `v3-hoodie-signature-black-front.webp` |
| Hoodie | PURE | Schwarz | Kleines Brustlogo | ai_mockup | `v3-hoodie-pure-black-chest.webp` |
| Hoodie | PURE | Weiß | Kleines Brustlogo | ai_mockup | `v3-hoodie-pure-white-chest.webp` |
| Zip Hoodie | SIGNATURE | Schwarz | Kleines Brustlogo | ai_mockup | `v3-zip-hoodie-signature-black-chest.webp` |
| Zip Hoodie | PURE | Schwarz | Kleines Brustlogo | ai_mockup | `v3-zip-hoodie-pure-black-chest.webp` |
| Zip Hoodie | PURE | Weiß | Kleines Brustlogo | ai_mockup | `v3-zip-hoodie-pure-white-chest.webp` |
| Crewneck | SIGNATURE | Schwarz | Kleines Brustlogo | ai_mockup | `v3-crewneck-signature-black-chest.webp` |
| Crewneck | PURE | Schwarz | Kleines Brustlogo | ai_mockup | `v3-crewneck-pure-black-chest.webp` |
| Crewneck | PURE | Weiß | Kleines Brustlogo | ai_mockup | `v3-crewneck-pure-white-chest.webp` |
| Workwear (Teaser) | — | Schwarz | Kleines Brustlogo | ai_mockup | `v3-workwear-polo-black-main.webp` |
| Workwear (Teaser) | — | Weiß | Kleines Brustlogo | ai_mockup | `v3-workwear-polo-white-main.webp` |
| Workwear (Teaser) | — | Schwarz | Kleines Brustlogo | ai_mockup | `v3-workwear-t-shirt-black-main.webp` |
| Workwear (Teaser) | — | Schwarz | Kleines Brustlogo | ai_mockup | `v3-softshelljacke-black-main.webp` |
| Workwear (Teaser) | — | Schwarz | Kleines Brustlogo | ai_mockup | `v3-softshellweste-black-main.webp` |
| Workwear (Teaser) | — | Schwarz | Kleines Brustlogo | ai_mockup | `v3-overshirt-arbeitshemd-black-main.webp` |
| Accessoires | — | Schwarz | Standard | ai_mockup | `v3-cap-black-main.webp` |
| Accessoires | — | Schwarz | Standard | ai_mockup | `v3-beanie-black-main.webp` |
| Accessoires | — | Schwarz | Standard | ai_mockup | `v3-tote-bag-black-main.webp` |
| Accessoires | — | Schwarz | Standard | ai_mockup | `v3-schuerze-black-main.webp` |
| Accessoires | — | Schwarz | Standard | ai_mockup | `v3-handtuch-black-main.webp` |
| Accessoires | — | Schwarz | Standard | ai_mockup | `v3-badehose-black-main.webp` |
| Accessoires | — | Schwarz | Standard | ai_mockup | `v3-regenschirm-black-main.webp` |
| Accessoires | — | Schwarz | Standard | ai_mockup | `v3-sneaker-videko-main.webp` |
| Accessoires | — | Schwarz | Standard | ai_mockup | `v3-tasse-black-main.webp` |
| Accessoires | — | Schwarz | Standard | ai_mockup | `v3-trinkflasche-black-main.webp` |
| Accessoires | — | Schwarz / Gold | Standard | ai_mockup | `v3-boss-battle-main.webp` |

## Hinweise

- Brustlogo-Zielgrößen je Stil stehen im Manifest (Feld `notes`) und in
  `logo-size-spec.md`. Bei PURE/SIGNATURE-Brustlogos ist vermerkt:
  „Logo für Produktionsfoto kleiner ausführen".
- „Workwear Zip Hoodie" existiert nicht im Datensatz – es gibt nur den
  Signature Zip Hoodie (oben in Liste 1).
