# Entwurf: Leistungsseite „Küchen für Investoren und Bauträger“

**Status:** Entwurf, **nicht veröffentlicht**, keine Route angelegt.
**Grund:** Das Angebot für Bauträger und Immobilieninvestoren ist seit 26.11.2026 bestätigt; konkrete Projektleistungen, Umfang und Ansprechpartner sind noch zu klären. Der Auftrag lautet: „sofern das
Angebot bestätigt ist“. Die Seite geht erst live, wenn alle Pflichtfragen
unten beantwortet sind.

## Pflichtfragen vor der Veröffentlichung

| # | Frage | Antwort VIDEKO |
|---|---|---|
| 1 | Bietet VIDEKO Küchen für mehrere Wohneinheiten (Mehrfamilienhaus, Bauträgerprojekt, Kapitalanlage) aktiv an? | Ja, am 26.11.2026 durch den Betreiber bestätigt. |
| 2 | Ab wie vielen Einheiten bzw. welchem Umfang? | |
| 3 | Welche Leistungen genau? (Planung je Wohnungstyp, Bemusterung für Käufer, Sonderwunschabwicklung, Lieferung/Montage nach Bauzeitenplan, Abnahme je Einheit) | |
| 4 | Arbeitet VIDEKO direkt mit dem Bauträger, mit den Käufern der Wohnungen oder mit beiden? | |
| 5 | Einzugsgebiet für solche Projekte (nur Würzburg/Region oder weiter)? | |
| 6 | Gibt es bereits Projekte, die genannt werden dürfen? (Nur mit schriftlicher Freigabe des Auftraggebers. Ohne Freigabe: keine Referenzen.) | |
| 7 | Gibt es Fotos echter Projekte mit Nutzungsrecht? | |
| 8 | Wer ist Ansprechpartner für gewerbliche Anfragen? | |

Ohne Antwort auf 1, 3 und 8 wird die Seite nicht gebaut. Ohne Freigabe zu 6
und 7 erscheinen weder Referenzen noch Projektfotos.

## Textentwurf (setzt Ja bei Frage 1 voraus, `[…]` = aus den Antworten füllen)

**Title:** Küchen für Bauträger und Immobilieninvestoren in Würzburg | VIDEKO
**Description:** Küchenplanung und Montage für Mehrfamilienhäuser,
Bauträgerprojekte und Kapitalanlagen in Würzburg und der Region:
[Leistungen aus Frage 3].

**H1:** Küchen für Projekte mit mehreren Wohnungen

**Intro:** Bei einem Mehrfamilienhaus zählt bei der Küche nicht der
Showroom-Effekt. Es zählt, dass [Anzahl] Küchen zum Bauzeitenplan passen,
robust sind und sich vermieten oder verkaufen lassen. Wir planen und montieren
Küchen für [Zielgruppe aus Frage 4] in [Einzugsgebiet aus Frage 5].

**Abschnitte:**

1. **Planung je Wohnungstyp.** Ein Grundtyp je Grundriss, abgestimmt auf den
   Installationsplan. So stimmen die Anschlüsse in jeder Einheit.
2. **Bemusterung und Sonderwünsche** *(nur wenn bestätigt)*. Käuferinnen und
   Käufer wählen aus einer festgelegten Auswahl. Sonderwünsche werden je
   Einheit dokumentiert und abgerechnet.
3. **Lieferung und Montage nach Bauzeitenplan.** Die Montage wird mit dem
   Innenausbau abgestimmt, mit einem festen Ansprechpartner für die
   Bauleitung.
4. **Robuste Ausstattung für Vermietung.** Pflegeleichte Fronten und
   Arbeitsplatten, gängige Gerätemaße für einen späteren Tausch. Der Link geht
   auf den bestehenden Ratgeber `/journal/pflegeleichte-kueche`.
5. **Abnahme je Einheit.** *(nur wenn bestätigt)*

**CTA:** „Projekt anfragen“ → Anfrageformular mit dem Feld „Anzahl
Wohneinheiten“. Kontakt: [Ansprechpartner aus Frage 8] · 0931 29764861 ·
info@videko-kuechen.de

**Interne Links:** von `/journal/kueche-im-neubau-planen` (Abschnitt
„Bauträger“), von `/planung` und von `/alles-aus-einer-hand`.

**Nicht verwenden:**

- Preise pro Einheit, solange sie nicht freigegeben sind;
- erfundene Projektzahlen;
- Aussagen wie „Partner vieler Bauträger“.

## Technische Umsetzung nach Freigabe

- Route in `src/data/routes-meta.js` und Seite nach dem Muster der
  bestehenden Leistungsseiten, z. B. `/kuechenmontage-wuerzburg`. Gleiches
  Design, keine neue Gestaltung.
- Sitemap und Prerender laufen automatisch mit. Danach `npm run pruefe`,
  Deploy und IndexNow.
- Aufwand: etwa ein halber Arbeitstag, sobald die Antworten vorliegen.
