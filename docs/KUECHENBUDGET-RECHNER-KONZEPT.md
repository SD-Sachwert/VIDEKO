# Küchenbudget-Rechner: Konzept, Stand 26.11.2026

**Status:** Konzept. Nichts ist gebaut, nichts ist veröffentlicht.
**Voraussetzung für den Bau:** VIDEKO trägt eigene Kalkulationswerte ein. Die
Grundlage sind die tatsächlichen Einkaufspreise und Kalkulationsaufschläge.
Erfundene Spannen gibt es nicht. Ohne eingetragene Werte geht der Rechner
nicht live.

## Ziel

Der Rechner ersetzt kein Angebot. Er gibt eine ehrliche erste Einordnung,
was die gewünschte Küche ungefähr kosten wird. Danach führt er zur
Beratung. Das spart Gespräche mit unrealistischen Erwartungen auf beiden
Seiten und bringt Anfragen, die schon ein Budget mitbringen.

Für die Suche schafft der Rechner eine eigene Seite zur Suchanfrage „Was
kostet eine Küche?“. Diese Seite fehlt bisher bewusst, siehe Masterplan
Phase 4, weil es keine belegten Zahlen gibt.

## Ablauf für Besucher (6 Schritte, eine Frage pro Bildschirm)

| Schritt | Frage | Eingabe |
|---|---|---|
| 1 | Welche Form? | Zeile · L · U · Zeile mit Insel · L mit Insel |
| 2 | Wie groß? | Laufmeter Unterschränke, mit Hilfe „typische Größen“ (Schieberegler) |
| 3 | Welche Ausstattung? | Basis · Komfort · Premium. Jede Stufe zeigt konkret, was sie bedeutet: Fronten, Auszüge, Beschläge |
| 4 | Welche Arbeitsplatte? | Schichtstoff · Holz · Compact · Quarz/Naturstein · Keramik |
| 5 | Welche Geräte? | Je Gerät: keins / Standard / gehoben. Kochfeld, Backofen, Dunstabzug, Kühlgerät, Geschirrspüler, Zusatzgeräte |
| 6 | Welche Leistungen? | Aufmaß, Lieferung, Montage (immer an) · Abbau alte Küche · Anschlussarbeiten · Wandabschluss/Rückwand |

**Ergebnis:**

- eine **Spanne** (von–bis), nie ein Einzelpreis;
- die Aufschlüsselung nach Möbeln, Arbeitsplatte, Geräten und Leistungen;
- der Hinweis „unverbindliche Einordnung, das Angebot entsteht nach Aufmaß“;
- der Knopf „Mit dieser Auswahl Beratung anfragen“. Er überträgt die Auswahl
  ins vorhandene Anfrageformular (`api/lead.js`). Dennis sieht dann sofort,
  worum es geht.

## Datenmodell: hier kommen später die echten Preise hinein

Eine Datei, `src/data/budget-kalkulation.json`. Nur diese Datei wird
gepflegt, der Code wird dafür nicht angefasst. Jeder Wert ist eine Spanne.
`null` heißt „noch nicht eingetragen“. Solange ein Pflichtwert `null` ist,
verweigert der Build die Veröffentlichung des Rechners. So kann keine leere
oder geratene Zahl live gehen.

```json
{
  "stand": null,
  "freigegebenVon": null,
  "waehrung": "EUR",
  "hinweis": "Bruttopreise inkl. MwSt., unverbindliche Einordnung",
  "moebelProLaufmeter": {
    "basis":   { "von": null, "bis": null },
    "komfort": { "von": null, "bis": null },
    "premium": { "von": null, "bis": null }
  },
  "formAufschlag": {
    "zeile": 1.0, "l": null, "u": null, "inselZusatz": { "von": null, "bis": null }
  },
  "arbeitsplatteProLaufmeter": {
    "schichtstoff": { "von": null, "bis": null },
    "holz":         { "von": null, "bis": null },
    "compact":      { "von": null, "bis": null },
    "quarzNaturstein": { "von": null, "bis": null },
    "keramik":      { "von": null, "bis": null }
  },
  "geraete": {
    "kochfeld":       { "standard": { "von": null, "bis": null }, "gehoben": { "von": null, "bis": null } },
    "backofen":       { "standard": { "von": null, "bis": null }, "gehoben": { "von": null, "bis": null } },
    "dunstabzug":     { "standard": { "von": null, "bis": null }, "gehoben": { "von": null, "bis": null } },
    "kuehlgeraet":    { "standard": { "von": null, "bis": null }, "gehoben": { "von": null, "bis": null } },
    "geschirrspueler":{ "standard": { "von": null, "bis": null }, "gehoben": { "von": null, "bis": null } }
  },
  "leistungen": {
    "aufmassLieferungMontage": { "proLaufmeter": { "von": null, "bis": null } },
    "abbauAltkueche":          { "pauschal": { "von": null, "bis": null } },
    "anschlussarbeiten":       { "pauschal": { "von": null, "bis": null } },
    "rueckwand":               { "proLaufmeter": { "von": null, "bis": null } }
  }
}
```

**Rechnung (bewusst einfach und nachvollziehbar):**

```
Möbel        = Laufmeter × moebelProLaufmeter[Stufe] × formAufschlag[Form] (+ inselZusatz)
Arbeitsplatte = Laufmeter × arbeitsplatteProLaufmeter[Material]   (+ Insel-Laufmeter)
Geräte       = Summe der gewählten Geräte je Stufe
Leistungen   = Montage × Laufmeter + gewählte Pauschalen
Spanne       = Summe aller „von“ … Summe aller „bis“, auf 500 € gerundet
```

## Abgleich mit den echten Einkaufspreisen

1. **Werte ableiten.** Aus den letzten echten Aufträgen und Angeboten je
   Position. Das ist kein Listenpreis, sondern der tatsächliche Endpreis
   für die Kundschaft. Wer: Dennis bzw. Einkauf.
2. **Plausibilität prüfen.** Drei echte, abgeschlossene Aufträge in den
   Rechner eingeben. Ihr Endpreis muss in der ausgegebenen Spanne liegen.
   Liegt er außerhalb, wird die Position nachgeschärft.
3. **Freigeben.** `stand` und `freigegebenVon` setzen. Erst dann baut der
   Rechner.
4. **Pflegen.** Quartalsweise oder nach Preiserhöhungen der Hersteller.
   Der Stand wird auf der Seite angezeigt („Kalkulationsstand: …“).

Einkaufspreise, Margen und Lieferantennamen stehen **nie** in der Datei.
Die Datei ist öffentlich, weil sie im Website-Code landet. Hinein kommen
nur die fertigen Endkunden-Spannen.

## Technik

- Eine neue Route `/kuechenbudget-rechner`, vorgerendert wie die übrigen
  Seiten. Die Fragen sind als statischer Text indexierbar, die Rechnung
  läuft im Browser.
- Kein Server, keine Datenbank, keine Kosten. Erst die Anfrage am Ende geht
  über das vorhandene `api/lead.js`.
- Kein Tracking über das bestehende Maß hinaus. Die Auswahl wird nur
  übertragen, wenn die Person die Anfrage abschickt.
- Im Design der bestehenden Seiten: dieselben Karten, Farben und
  CTA-Komponenten. Keine neue Gestaltung.
- Aufwand nach Freigabe der Werte: etwa 1 Arbeitstag inklusive Tests.

## Offene Entscheidungen für VIDEKO

| Frage | Warum wichtig |
|---|---|
| Sollen die Werte brutto für Endkunden angezeigt werden? | Pflicht bei Preisangaben gegenüber Verbrauchern (PAngV) |
| Wie breit darf eine Spanne sein? | Zu breit hilft niemandem, zu schmal weckt falsche Erwartungen |
| Welche Gerätemarken stehen hinter „Standard“ und „gehoben“? | Nur nennen, wenn es eine echte Lieferbeziehung gibt |
| Soll eine Mindestgröße für Aufträge sichtbar sein? | Verhindert Anfragen, die nicht passen |
