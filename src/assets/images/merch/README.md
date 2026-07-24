# Merch-Bilder – Ordnerstruktur

Sortiert nach **Kleidungsstück**, damit man sich zurechtfindet:

| Ordner | Inhalt |
|---|---|
| `tshirts/` | T-Shirts, ONE-Tees, SIGNATURE-Tees, Small-Logo-Tees + Lifestyle |
| `vnecks/` | V-Neck-Shirts (alle Linien) |
| `polos/` | Poloshirts (PURE / PRESTIGE / SIGNATURE / Workwear-Polo) |
| `hoodies/` | Hoodies, Zip-Hoodies, Hoodie-Detailshots |
| `crewnecks/` | Crewneck-Sweatshirts |
| `sneaker/` | Sneaker (weiß / weiß-gold) |
| `workwear/` | Overshirt, Softshelljacke/-weste, Workwear-Tee |
| `accessories/` | Cap, Beanie, Mug, Tote-Bag, Handtuch, Schirm, Flasche, Badeshorts, Apron |
| `_shared/` | Seiten-Assets ohne Kleidungsstück: `merch-hero`, `v3-boss-battle`, `v5-coming-soon` (Platzhalter) |
| `_deprecated/` | Ersetzte Alt-Assets. **Bewusst vom Build ausgeschlossen** (Glob-Negation in `src/data/merch.js`). |

## Wichtig für neue Bilder

Die Live-Bilder werden in `src/data/merch.js` rekursiv geladen und **über den
reinen Dateinamen** (Basename, ohne Pfad) aufgelöst:

```js
import.meta.glob(['../assets/images/merch/**/*.webp', '!.../_deprecated/**'])
```

Daraus folgt:

1. **Die Unterordner sind rein organisatorisch.** In welchem Ordner eine Datei
   liegt, ist egal – `products.json` referenziert nur den Dateinamen.
2. **Dateinamen müssen ordnerübergreifend eindeutig sein.** Zwei gleichnamige
   Dateien in verschiedenen Ordnern würden sich gegenseitig überschreiben.
3. Neue Bilder einfach in den passenden Ordner legen und den Dateinamen in
   `src/data/products.json` (`image` / `gallery` / `placements[].image`) eintragen.
4. Assets, die nicht mehr genutzt werden, nach `_deprecated/` schieben statt
   löschen – dann sind sie rückholbar, aber nicht im Bundle.
