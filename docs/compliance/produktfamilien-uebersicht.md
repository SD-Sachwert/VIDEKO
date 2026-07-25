# Produktfamilien-Übersicht

## Grundsatz

Der Shop zeigt viele Logo-, Farb- und Größenkombinationen. Das sind **keine 51
separaten Grundprodukte**. Rechtlich/GPSR zählt die **Blankware-Produktfamilie**:
die einzelnen Varianten erben die Blankware-Eigenschaften und unterscheiden sich
nur in Veredelung, Farbe, Größe, Bild und Preis.

## Aktuell verkauft (kaufbar)

**Eine** Produktfamilie ist tatsächlich kaufbar:

| Feld | Wert |
|---|---|
| Familien-ID | `SOLS-IMPERIAL-11500` |
| Produktart | Herren-T-Shirt |
| Blankware | SOL'S Imperial 11500 |
| Blankware-Marke | SOL'S |
| Blankware-Hersteller | SOLO INVEST SAS *(laut Anbieterinformation, zu bestätigen)* |
| Lieferant | Gröner-Schulze |
| Veredelung | VIDEKO Küchen eG (im eigenen Haus) |
| Verantw. Wirtschaftsakteur (Endprodukt) | VIDEKO Küchen eG |
| Grundmaterial | 100 % halbgekämmte, ringgesponnene Baumwolle, Single Jersey, 190 g/m² |
| Interne variantGroup | `signature-tee` |
| Kaufbare Varianten | Signature-Logo in Schwarz und Weiß, Größen S–XXL |

Die kaufbaren Produkte in `products.json`: `signature_t_shirt_black`,
`signature_t_shirt_white` (`purchasable: true`). Alles über
`PRODUCT_FAMILIES['SOLS-IMPERIAL-11500']` in `src/data/compliance.js`.

### Herstellerrollen (sauber getrennt)

- **Blankware-Hersteller:** SOLO INVEST SAS / SOL'S
- **Lieferant/Händler:** Gröner-Schulze
- **Veredelungspartner:** VIDEKO Küchen eG (Veredelung erfolgt selbst)
- **Verantwortlicher Wirtschaftsakteur des Endprodukts:** VIDEKO Küchen eG

### Vererbung Familie → Variante

| Von der Familie geerbt | Pro Variante eigen |
|---|---|
| Blankware-Hersteller & -Modell | VIDEKO-SKU |
| Grundmaterial, Flächengewicht, Grundkonstruktion | Farbe + Farbcode |
| Allgemeine Pflegehinweise | Größe |
| Technische Datenblätter, Blankware-Zertifikate | Logoausführung |
| Allgemeine Risikoanalyse | Druck-/Flockfarbe, Veredelungsverfahren |
| | Ggf. abweichende Pflege, Produktbild, Verkaufspreis |

## Coming soon (nicht kaufbar, kein Verkaufs-Blocker)

Alle übrigen Artikel (V-Necks, Polos, Hoodies, Zip-Hoodies, Crewnecks, weitere
T-Shirt-Linien, Workwear, Accessoires u. a.) sind mit `purchasable: false`
gekennzeichnet und **nicht** Teil des aktuellen Verkaufsstarts. Sie werden erst
**vor ihrer späteren Aktivierung** vollständig dokumentiert (eigene Blankware-/
Veredelungsakte je Familie). Bis dahin blockieren sie den aktuellen Shirt-Launch
nicht und erscheinen im Shop ausschließlich als unverbindliche Vorschau.
