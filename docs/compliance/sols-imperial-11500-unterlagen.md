# SOL'S Imperial 11500 – benötigte Unterlagen (einzige aktive Produktfamilie)

Aktuell wird **nur diese eine Blankware-Produktfamilie** verkauft. Alle kaufbaren
Logo-, Farb- und Größenvarianten des Shirts gehören zu ihr (Familien-ID
`SOLS-IMPERIAL-11500`, siehe `src/data/compliance.js`). Diese Liste enthält die
Nachweise, die für den rechtssicheren Verkauf des **fertig veredelten VIDEKO-Shirts**
noch fehlen. Nichts davon wird erfunden – jeder Punkt ist zu belegen.

## Blankware & Lieferkette

| # | Unterlage | Status |
|---|---|---|
| 1 | Tatsächliche Einkaufsrechnung / Bestellbestätigung (Gröner-Schulze) | ❌ offen |
| 2 | Verbindlicher Blankware-Produktlink als Referenz (intern hinterlegen) | ❌ offen |
| 3 | Bestätigung Blankware-Hersteller **SOLO INVEST SAS** (Datenblatt/Etikett) | ❌ offen |
| 4 | Aktuelles technisches Datenblatt SOL'S Imperial 11500 | ❌ offen |
| 5 | Produktionsdatenblatt, soweit verfügbar | ❌ offen |
| 6 | Foto der vorhandenen Hersteller-, Material- und Pflegeetiketten | ❌ offen |
| 7 | Nachvollziehbare Chargen- / Bestellzuordnung | ❌ offen |

## Farben & Größen (keine Vermutung!)

| # | Unterlage | Status |
|---|---|---|
| 8 | Tatsächlich verwendete Farbcodes laut Rechnung | ❌ offen |
| 9 | **Weißton klären:** „102 White" vs. „117 Absolute White" | ❌ offen |
| 10 | **Schwarz klären:** „Deep Black 309" bestätigen | ❌ offen |
| 11 | Tatsächlich angebotene Größen laut Bestellung | ❌ offen |

> Hinweis Material: Für Schwarz und Weiß gilt laut SOL'S grundsätzlich
> **100 % Baumwolle** (Single Jersey, 190 g/m²). Nur die Farben *300 Ash*
> (98 % BW / 2 % Viskose) und *350 Grey Melange* (85 % BW / 15 % Viskose) weichen
> ab – diese werden aktuell **nicht** verkauft. Die exakte Farbzuordnung ist
> trotzdem per Rechnung zu bestätigen.

## Veredelung (macht VIDEKO Küchen eG selbst)

| # | Unterlage | Status |
|---|---|---|
| 12 | Konkretes Veredelungsverfahren (DTF / Flex / Siebdruck / Flock / Stick) | ❌ offen |
| 13 | Eingesetztes Druck-/Flex-/Flockmaterial + Hersteller + Produktbezeichnung | ❌ offen |
| 14 | Sicherheits-/Schadstoffnachweise des Veredelungsmaterials (z. B. OEKO-TEX) | ❌ offen |
| 15 | Klebstoff/Trägermaterial + Verarbeitungsparameter (Temperatur etc.) | ❌ offen |
| 16 | Pflegehinweise des **fertig veredelten** Shirts | ❌ offen |
| 17 | Lieferanten-/Chargennachweis des Veredelungsmaterials | ❌ offen |

## Zertifikate

| # | Unterlage | Status |
|---|---|---|
| 18 | Aktuelles OEKO-TEX-Standard-100-Zertifikat (Modell + Farbe), soweit verfügbar | ❌ offen |
| 19 | PETA-Approved-Vegan-Nachweis der Blankware | ❌ offen |

> Zertifikate gelten für die **Blankware**, nicht automatisch für das fertig
> veredelte VIDEKO-Shirt. Öffentliche Werbeaussagen erst nach Prüfung, dass das
> Zertifikat für Modell + Farbe gilt, aktuell ist und die Veredelungsmaterialien
> die Aussage nicht unzulässig erweitern. Bis dahin **nur intern** dokumentieren.

## Produktsicherheit & Unternehmen

| # | Unterlage | Status |
|---|---|---|
| 20 | Eigene Risikoanalyse des fertigen VIDEKO-Shirts | ❌ offen |
| 21 | Korrekte VIDEKO-Unternehmensdaten (verantw. Wirtschaftsakteur) | ⚠️ Pflicht-TODO |

## Freigabe

Erst wenn 1–20 belegt sind, wird `PRODUCT_FAMILIES['SOLS-IMPERIAL-11500'].complete`
auf `true` gesetzt und der GPSR-Blocker im Launch-Gate (`npm run check:products`)
fällt für die Shirts. Punkt 21 (Unternehmensdaten/USt) bleibt zusätzlich ein
allgemeines Pflicht-TODO (siehe `unternehmensdaten-todo.md`).
