# Fehlende finale Produktbilder

Stand: Shop-UX-Umbau (Familienstruktur). Zwei Ebenen:

1. **Platzhalter** (`imageStatus: "placeholder"`) – für diese Produkte/Varianten
   gibt es noch gar kein brauchbares Bild. Sie erscheinen **nicht** mit einem
   lauten „PRODUKTBILD FOLGT" im Hauptgrid: Workwear ist in der Teaser-Sektion
   gebündelt, die übrigen tragen eine ruhige „Bald verfügbar"-Kachel.
2. **Mockup** (`imageStatus: "mockup"`) – KI-generierte Musteransicht, gut genug
   zur Darstellung, aber vor dem Verkauf durch ein echtes Foto zu ersetzen.

Austausch später: Datei im gleichen Namen ablegen bzw. in `products.json` unter
`placements[].gallery` / `image` eintragen und `imageStatus` auf `"final"`
setzen. Layout und Komponenten bleiben unverändert.

---

## 1. Platzhalter – Bild fehlt vollständig (11)

| Produkt-ID | Produktname | Platzierung | Aktuelle Datei | Fehlender Bildtyp |
|---|---|---|---|---|
| `signature_zip_hoodie_black` | Signature Zip Hoodie Schwarz | Großes Frontlogo | `ph-signature-zip-hoodie-black.webp` | kompletter Packshot (Front) |
| `signature_crewneck_black` | Signature Crewneck Schwarz | Großes Frontlogo | `ph-signature-crewneck-black.webp` | kompletter Packshot (Front) |
| `signature_polo_white` | Signature Polo Weiß | Großes Frontlogo | `ph-signature-polo-white.webp` | kompletter Packshot (Front) |
| `workwear_polo_black` | Workwear Polo Schwarz | Kleines Brustlogo | `ph-workwear-polo-black.webp` | kompletter Packshot |
| `workwear_polo_white` | Workwear Polo Weiß | Kleines Brustlogo | `ph-workwear-polo-white.webp` | kompletter Packshot |
| `softshelljacke_black` | Softshelljacke Schwarz | Großes Frontlogo | `ph-softshelljacke-black.webp` | kompletter Packshot |
| `softshellweste_black` | Softshellweste Schwarz | Großes Frontlogo | `ph-softshellweste-black.webp` | kompletter Packshot |
| `workwear_t_shirt_black` | Workwear T-Shirt Schwarz | Großes Frontlogo | `ph-workwear-t-shirt-black.webp` | kompletter Packshot |
| `overshirt_arbeitshemd_black` | Overshirt / Arbeitshemd Schwarz | Großes Frontlogo | `ph-overshirt-arbeitshemd-black.webp` | kompletter Packshot |
| `pure_cap` | PURE Cap | Standard | `ph-pure-cap.webp` | kompletter Packshot |
| `pure_beanie` | PURE Beanie | Standard | `ph-pure-beanie.webp` | kompletter Packshot |

**Hinweis zum Prüfbericht-Wunsch:** In der Vorgabe war „Workwear Zip Hoodie"
genannt. Ein solches Produkt existiert im Datensatz nicht – der einzige Zip
Hoodie ist `signature_zip_hoodie_black` (Linie SIGNATURE). Er steht oben in der
Liste. Falls zusätzlich ein Workwear-Zip-Hoodie geführt werden soll, lege ich
ihn gern an.

---

## 2. Mockup – KI-Muster, vor Verkauf echtes Foto nötig

Diese Varianten haben ein brauchbares, aber KI-generiertes Bild. Für die sechs
**kaufbaren** T-Shirts ist echtes Fotomaterial vor dem Verkaufsstart Pflicht:

| Produkt-ID | Produktname | Status |
|---|---|---|
| `signature_t_shirt_black` | Signature T-Shirt Schwarz | **live/kaufbar** |
| `signature_t_shirt_white` | Signature T-Shirt Weiß | **live/kaufbar** |
| `t_shirt_small_logo_black` | Signature T-Shirt Schwarz · Brustlogo | **live/kaufbar** |
| `t_shirt_small_logo_white` | Signature T-Shirt Weiß · Brustlogo | **live/kaufbar** |
| `oversized_tee_black` | Oversized Tee Schwarz | **live/kaufbar** |
| Accessoires (`cap-black`, `beanie-black`, `tote-bag-black`, `schuerze-black`, `handtuch-black`, `badehose-black`, `regenschirm-black`, `sneaker-videko`, `tasse-black`, `trinkflasche-black`) | – | coming soon |
| `boss-battle` | Boss-BATTLE | coming soon |

Für die kaufbaren T-Shirts gilt weiterhin die vollständige Aufnahmeliste:
Frontansicht, Rückansicht, Druckdetail, Stoff-/Nahtdetail, getragenes
Lifestylebild, Größen-/Passformbild, Personalisierungsbeispiel.

---

## 3. Echte Fotos bereits vorhanden (`final`)

Aus dem V2-Asset-Paket sauber eingebunden – kein Handlungsbedarf:
PURE (Front + Brustlogo für Tee, V-Neck, Hoodie, Polo, Crewneck in Schwarz/Weiß),
ONE Tee Schwarz/Weiß, BLACK LINE und WHITE LINE (Tee, V-Neck, Hoodie, Crewneck,
Polo), Signature Hoodie (5-teilige Galerie), Signature Polo Schwarz.
