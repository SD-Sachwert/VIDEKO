# Unternehmensdaten – Konsistenz & offene Aufgaben

Ziel: Die Firmenangaben müssen **überall identisch** sein – Impressum, AGB,
Rechnungen, Bestellbestätigung, Checkout, Produktseite (Hersteller).

## Belegte Stammdaten (aus Impressum)

| Feld | Wert |
|---|---|
| Firma | VIDEKO Küchen eG |
| Anschrift | Hertzstraße 4, 97076 Würzburg, Deutschland |
| Vorstand | Vitali Freisinger, Dennis Himmel, Heiko Himmel |
| Telefon | 0160 5545818 |
| E-Mail | info@videko-kuechen.de |
| Marke | VIDEKO |

Diese Werte stehen zentral in `src/data/compliance.js` (`RESPONSIBLE_OPERATOR`)
und im Impressum. Beim Ändern **immer beide Stellen** angleichen.

## Angaben, die NUR dann Pflicht sind, wenn sie existieren/erforderlich sind

Diese Nummern sind **nur anzugeben, wenn sie für VIDEKO tatsächlich existieren bzw.
gesetzlich erforderlich sind**. Existiert eine Nummer nicht (oder ist sie nicht
erforderlich), ist das **kein Launch-Blocker** – sie wird dann schlicht nicht
angegeben. Nichts wird erfunden.

- [ ] **Register-Nr. + Registergericht** ergänzen, **falls** ein Registereintrag
      besteht (bei einer eG i. d. R. Genossenschaftsregister). Prüfen und – nur wenn
      vorhanden – im Impressum eintragen.
- [ ] **Umsatzsteuer-Identifikationsnummer (USt-IdNr.)** ergänzen, **falls vorhanden/
      erforderlich**. Eine USt-IdNr. ist nicht für jedes Unternehmen zwingend
      (§ 27a UStG) – fehlt sie zulässigerweise, ist das kein Mangel.

## Pflicht-TODO (unabhängig davon)

- [ ] **Umsatzsteuer-Status klären**: Regelbesteuerung vs. Kleinunternehmer (§ 19 UStG).
      Davon hängt ab, ob auf Rechnungen/Preisen USt ausgewiesen wird. Aktuell zeigt
      der Shop „inkl. MwSt." – das **muss** zum tatsächlichen Status passen. Dies bleibt
      ein echtes Pflicht-TODO vor Verkaufsstart.

## Gewerbe / Unternehmensgegenstand

- [ ] Prüfen, ob der Unternehmensgegenstand bzw. die Gewerbeanmeldung den
      **Online- und Einzelhandel mit Textilien, Bekleidung, Merchandisingartikeln
      und Accessoires** abdeckt, oder ob eine **Erweiterung** nötig ist.
- [ ] Bei Genossenschaft: ggf. Satzungszweck / Registereintrag prüfen lassen.

> Dies ist eine **externe, rechtlich zu prüfende Aufgabe**. Sie wird **nicht** als
> erledigt markiert, solange kein Nachweis (Registerauszug / Gewerbeummeldung) vorliegt.

## Status

**Teilweise offen.** Stammdaten belegt; Register-Nr., USt-IdNr., USt-Status und
Gewerbeumfang sind offen und vor dem Verkaufsstart zu klären.
