# SEO- und KI-Sichtbarkeit: Masterplan, Stand 26.11.2026

Arbeitsdokument zu den Phasen 1–6. Es enthält keine Zugangsdaten und keine
personenbezogenen Daten. Unternehmensangaben kommen ausschließlich aus
`src/data/company.js`.

**Kontaktkorrektur 26.11.2026:** Die bisherige Mobilnummer [alte Mobilnummer] ist durch die bestätigte Festnetznummer 0931 29764861 (+49 931 29764861) zu ersetzen. Google Business Profile führt noch die alte Nummer; Änderung und Abgleich der Verzeichnisse stehen aus. Die folgenden Mail-Entwürfe sind entsprechend aktualisiert. WhatsApp nicht auf die Festnetznummer umleiten, solange kein aktiver WhatsApp-Anschluss bestätigt ist.

**Ausgangswerte (GSC, Stand 26.11.2026):** 1.121 Impressionen, 60 Klicks,
durchschnittliche Position 18,4.

| Suchbegriff | Position |
|---|---|
| Küchenstudio Würzburg | 18,0 |
| Küchen Würzburg | 19,6 |
| Küchenrenovierung Würzburg | 34,1 |

Es gibt keine Bewertungen. Die Strategie hängt deshalb nicht von Bewertungen ab.

---

## Phase 1: Technik (erledigt, live)

| Maßnahme | Ergebnis und Nachweis |
|---|---|
| PR #15 (seo/local-business-2026-11-26) | Build grün (102 Routen), `npm run pruefe` mit Exit 0. Fast-Forward nach `main` (8e59d56), PR auf GitHub als merged geschlossen. |
| SSG-Prüfung für noindex-Seiten | `scripts/pruefe-ssg.mjs`: Bei noindex-Ansichten (Stadtfest) sind Text, H1 und Links nur noch Hinweise statt Fehler. |
| IndexNow | Schlüsseldatei `public/26cf528a215596ba29ddb539b4fc0565.txt` liegt live (200). Skript `npm run indexnow -- <JJJJ-MM-TT\|alle>` erstellt. Meldungen: 3 URLs mit Antwort 202, alle 36 URLs mit Antwort 200. |
| Bot-Zugriff | Mit Bingbot-User-Agent liefern `/`, die Artikel, `sitemap.xml` und `robots.txt` alle Status 200. Canonical, `hasMap`, `areaServed` und Article-JSON-LD sind vorhanden. |
| Betreiberdaten | Live gibt es keinen Treffer mehr für „Süddeutsche Sachwert“, „Tutzing“ oder „Grubenweg“. Impressum und AGB nennen die VIDEKO Küchen eG, GnR 298, AG Würzburg. Northdata führt die eG ebenfalls korrekt. |
| Search Console und Bing Webmaster | **Offen, manuell.** Hier fehlt der Zugang. Sitemap einreichen und für neue Artikel eine URL-Prüfung mit „Indexierung beantragen“ anstoßen. |

**Nicht geändert:** `/entdecken` hat keine eingehenden internen Links. Das zu
ändern wäre eine Navigationsentscheidung, deshalb ist es nur notiert.

---

## Phase 2: Wettbewerb und Lücken

Geprüft wurden öffentlich sichtbare Angaben.

| Wettbewerber | Beobachtung |
|---|---|
| PLANA Würzburg | Nürnberger Str. 111. Auf werkenntdenbesten mit 4,9 aus 232 Bewertungen gelistet, außerdem auf Gelbe Seiten und KitchenAdvisor. |
| WM Küchen Ideen Würzburg | Auf KitchenAdvisor gelistet. |
| XXXLutz Neubert | Auf KitchenAdvisor gelistet. Bekannte Marke mit großer Ausstellung. |
| MEDA | golocal: 2,7 aus 7 Bewertungen. |

| Lücke bei VIDEKO | Konkrete Maßnahme | Status |
|---|---|---|
| Keine Ratgeber zu Kaufentscheidung und Renovierung | Drei Ratgeber veröffentlicht (Checkliste Studio, Ablauf Renovierung, Angebote vergleichen) | erledigt |
| Nicht auf KitchenAdvisor (VIDEKO fehlt unter 8.155 Store-URLs) | Kostenlosen Grundeintrag anfragen (Mail-Entwurf unten) | Entwurf |
| Nicht im Küchenring- und Küchenfinder-Verzeichnis | Konditionen anfragen, nur kostenlos (Mail-Entwürfe unten) | Entwurf |
| Falsche oder abweichende Verzeichnisdaten | Korrekturen siehe Phase 3 | teilweise |
| Keine Bewertungen | Nach jeder abgeschlossenen Montage um eine Google-Bewertung bitten. Nichts kaufen, keine Anreize. | Prozess, offen |
| Keine Erwähnung in der lokalen Presse | Pitches siehe Phase 5 | Entwurf |
| Kein eigener Kostenratgeber | Erst schreiben, wenn belegbare Preisspannen vorliegen (eigene Angebotsauswertung oder zitierfähige Quelle) | geplant |

Wir behaupten keine Marktführerschaft. Gegen große Ausstellungen
positionieren wir uns mit Planung, Aufmaß, Montage und Koordination aus
einer Hand, nicht über den Preis.

---

## Phase 3: Verzeichnisse

**Neu am 26.11.2026:** Die offizielle Nummer lautet 0931 29764861. Die
Tabelle unten wurde mit der alten Mobilnummer geprüft. Ein „korrekt“ darin
heißt deshalb nur, dass Adresse und Website stimmen. Die Telefonnummer muss
**überall** umgestellt werden.

In `docs/VERZEICHNISSE-2026-11.md` stehen:

- die Korrekturliste
- 21 weitere kostenlose Portale
- die Herstellerverzeichnisse
- die Wettbewerber-Links
- Mail 5 an Küchen-Atlas

| Eintrag | Stand 26.11.2026 | Nächster Schritt |
|---|---|---|
| Würzburg macht Spaß (wuems.de, Mitgliederliste) | **Falsch:** Tel 0931 355930 und Fax 0931 3559320 (VHS-Daten), kein Website-Link | Mail 1 |
| Gelbe Seiten | Telefon und Website korrekt. „24 Stunden“ nicht mehr gefunden. | keiner |
| Das Telefonbuch | korrekt | keiner |
| 11880 | Adresse und Website korrekt, keine Öffnungszeiten | keiner |
| Das Örtliche | Zeigt „Mo–Fr 09:00–18:00“, nicht bestätigt | Formular „Eintrag ändern“ im Eintrag (Datenpool mit Gelbe Seiten und Telefonbuch). Erst nach Entscheidung zu Öffnungszeiten. |
| Geolokal | Zeigt 09:00–18:00, nicht bestätigt | Änderungsformular, nach derselben Entscheidung |
| XING | Website steht noch als `http://` | Im XING-Unternehmensprofil auf `https://videko-kuechen.de/` ändern |
| Cylex | Zuletzt „Mo–So 09–18“. Bei der Prüfung blockiert (403). | Im Cylex-Kundenbereich prüfen und korrigieren |
| KitchenAdvisor | Kein VIDEKO-Eintrag gefunden; laut Auftrag „undefined Würzburg“ | Mail 2 |

**Entscheidung offen, nicht unsere:** Öffnungszeiten. Website und
`company.js` sagen „Beratung nach Terminvereinbarung“ ohne feste Zeiten.
Das Google-Unternehmensprofil zeigte zuletzt Mo 09–18. Bis feste Zeiten
bestätigt sind, sollen alle Verzeichnisse „nach Terminvereinbarung“ zeigen.

### Mail 1: an info@wuems.de

Betreff: Korrektur Mitgliederliste: VIDEKO Küchen eG – Telefonnummer und Website

> Guten Tag,
>
> in Ihrer Mitgliederliste („Würzburg macht Spaß – unsere Mitglieder“) stehen
> bei VIDEKO Küchen eG eine Telefon- und Faxnummer, die nicht zu uns gehören
> (0931 355930 / 0931 3559320). Bitte korrigieren Sie den Eintrag:
>
> - Telefon: 0931 29764861
> - Fax: bitte entfernen
> - Website: https://videko-kuechen.de/ (bitte ergänzen)
>
> Adresse (Hertzstraße 4, 97076 Würzburg) und E-Mail stimmen bereits.
>
> Vielen Dank und freundliche Grüße
> VIDEKO Küchen eG · Hertzstraße 4 · 97076 Würzburg · 0931 29764861 · info@videko-kuechen.de

### Mail 2: an haendler@kitchenadvisor.de

Betreff: Händlereintrag VIDEKO Küchen eG, Würzburg

> Guten Tag,
>
> wir sind ein Küchenstudio in Würzburg und möchten unseren Händlereintrag
> korrekt bei Ihnen hinterlegen. Bitte prüfen Sie, ob bereits ein Eintrag existiert,
> und korrigieren Sie diesen gegebenenfalls. Andernfalls bitten wir um einen neuen Eintrag:
>
> VIDEKO Küchen eG, Hertzstraße 4, 97076 Würzburg, Tel. 0931 29764861,
> info@videko-kuechen.de, https://videko-kuechen.de/
> Leistungen: Küchenplanung, 3D-Planung, Aufmaß, Küchenmontage.
> Beratung nach Terminvereinbarung, bitte keine festen Öffnungszeiten anzeigen.
>
> Wir möchten nur den kostenlosen Grundeintrag. Falls Kosten entstehen,
> informieren Sie uns bitte vorher.
>
> Freundliche Grüße
> VIDEKO Küchen eG · Hertzstraße 4 · 97076 Würzburg · 0931 29764861 · info@videko-kuechen.de

### Mail 3: an info@kuechenring.de

Betreff: Aufnahme in die Händlersuche: VIDEKO Küchen eG, Würzburg

> Guten Tag,
>
> wir sind ein Küchenstudio in Würzburg (VIDEKO Küchen eG, Hertzstraße 4,
> 97076 Würzburg, https://videko-kuechen.de/) und Mitglied im Küchenring
> (Mitgliedsnummer 62030). Wir möchten in Ihrer Händlersuche erscheinen.
> Ist das für Mitglieder ohne Zusatzkosten möglich, und welche Angaben
> benötigen Sie von uns? Bitte nennen Sie uns mögliche Kosten, bevor etwas
> beauftragt wird.
>
> Bitte verwenden Sie ausschließlich unsere offizielle Telefonnummer
> 0931 29764861 – frühere Mobilnummern bitte nicht mehr veröffentlichen.
>
> Freundliche Grüße
> VIDEKO Küchen eG · 0931 29764861 · info@videko-kuechen.de

### Mail 4: an info@kuechenfinder.com

Betreff: Kostenloser Grundeintrag: VIDEKO Küchen eG, Würzburg

> Guten Tag,
>
> bitte nehmen Sie VIDEKO Küchen eG mit einem kostenlosen Grundeintrag auf:
> Hertzstraße 4, 97076 Würzburg, Tel. 0931 29764861, info@videko-kuechen.de,
> https://videko-kuechen.de/. Beratung nach Terminvereinbarung, keine festen
> Öffnungszeiten.
>
> Bezahlpakete möchten wir nicht. Falls bereits ein Eintrag existiert, bitte
> keinen zweiten anlegen, sondern den bestehenden korrigieren. Sollten
> Kosten entstehen, teilen Sie uns das bitte vorher mit.
>
> Freundliche Grüße
> VIDEKO Küchen eG · Hertzstraße 4 · 97076 Würzburg

---

## Phase 4: Content-Cluster

**Veröffentlicht:**

| Artikel | Pfad | Weiterführender Link |
|---|---|---|
| Küchenstudio in Würzburg finden: 10 Fragen | `/journal/kuechenstudio-wuerzburg-checkliste` | `/planung` |
| Küchenrenovierung in Würzburg: Ablauf | `/journal/kuechenrenovierung-wuerzburg-ablauf` | `/alles-aus-einer-hand` |
| Küchenangebote vergleichen | `/journal/kuechenangebote-vergleichen` | `/kuechenmontage-wuerzburg` |
| Küche im Neubau planen | `/journal/kueche-im-neubau-planen` | `/planung` |
| Alte Küche erneuern oder neu kaufen? | `/journal/kueche-erneuern-oder-neu-kaufen` | `/arbeitsplatten` |
| Küche ausmessen: Raumskizze | `/journal/kueche-ausmessen-anleitung` | `/beratung` |

**Weitere Unterlagen:**

- Budget-Rechner: `docs/KUECHENBUDGET-RECHNER-KONZEPT.md`
- Leistungsseite für Investoren und Bauträger: Entwurf in
  `docs/ENTWURF-LEISTUNG-INVESTOREN-BAUTRAEGER.md`, nicht live, weil das
  Angebot unbestätigt ist
- Presseanfragen: `docs/PRESSEANFRAGEN-2026-11.md`
- Monitoring: `docs/SEO-MONITORING.md`

**Geplant**, in dieser Reihenfolge. Jeder Artikel braucht einen eigenen
Suchintent und darf sich nicht mit bestehenden Artikeln überschneiden.

| Thema | Voraussetzung, Abgrenzung |
|---|---|
| Was kostet eine Küche? | Nur mit belegten Spannen (eigene Auswertung oder Quelle). Ohne Beleg wird er nicht veröffentlicht. |
| Kleine Küche planen | Baut auf „Mehr Stauraum“ auf, Schwerpunkt Grundriss und Maße |
| Küchen für Investoren und Mehrfamilienhäuser | Serienplanung, robuste Materialien, Koordination mehrerer Wohnungen. Nur schreiben, wenn VIDEKO dieses Angebot aktiv vertreibt. |
| Küchenmontage: Was am Montagetag passiert | Ergänzt `/kuechenmontage-wuerzburg`, kein Duplikat |
| VR-Planung | **Nur, wenn das Angebot real existiert.** |

Arbeitsplatten und Geräte sind bereits durch bestehende Artikel abgedeckt.
Diese Themen werden nicht noch einmal geschrieben, sondern bei Bedarf
aktualisiert.

**Social Media:** Jeder neue Artikel wird als Carousel-Vorlage in VIDEKO
Studio verwendet, mit echten Projektfotos statt KI-Bildern.

**Neuen Artikel veröffentlichen:**
1. Artikel in `src/data/journal.js` einfügen und in `JournalArticle.jsx`
   einen WEITER-Eintrag ergänzen.
2. `npm run build`, dann `npm run pruefe`.
3. Auf `main` pushen.
4. Nach dem Deploy `npm run indexnow -- <Datum>` ausführen.
5. In der GSC „Indexierung beantragen“.

---

## Phase 5: Presse-Pitches

Pitches enthalten nur bestätigte Fakten. Diese Fakten sind freigegeben:

- VIDEKO Küchen eG
- eingetragen am 02.09.2026, AG Würzburg GnR 298
- Studio in der Hertzstraße 4, 97076 Würzburg, im Aufbau
- Beratung nach Terminvereinbarung
- Leistungen: Planung, 3D-Planung, Aufmaß, Montage, Koordination angrenzender Gewerke

Nicht verwenden: Umsätze, Kundenzahlen, Rankings, „erste“ oder „größte“.

| Medium | Aufhänger | Kernaussage |
|---|---|---|
| Main-Post (Lokalredaktion Würzburg) | Neue Genossenschaft im Küchenhandwerk | Warum eine eG und nicht eine GmbH? Was ändert das für Kundschaft und Partnerbetriebe? |
| TV Mainfranken | Bildstarker Studioaufbau | Ein Drehtermin beim Ausbau der Hertzstraße 4, danach ein Wiederholungstermin zur Eröffnung |
| Radio Gong Würzburg | Servicethema | „Worauf man bei Küchenangeboten achten sollte“, gestützt auf den Ratgeber, kein Werbeinterview |
| Würzburger Stadtmarketing („Würzburg macht Spaß“) | VIDEKO ist bereits Mitglied | Meldung „neues Mitglied stellt sich vor“ (zusammen mit der Korrektur aus Mail 1) |
| Gerätehersteller und Zulieferer | Partnerseiten, Händlerlisten | Nur dort, wo eine echte Lieferbeziehung besteht |

**Vorlage (Main-Post), vor dem Versand anpassen:**

> Betreff: Neue Genossenschaft in Würzburg: VIDEKO Küchen eG baut Studio in der Hertzstraße auf
>
> Guten Tag,
>
> seit September 2026 ist die VIDEKO Küchen eG im Genossenschaftsregister
> Würzburg eingetragen (GnR 298). In der Hertzstraße 4 entsteht derzeit das
> Studio. Dort sollen Küchenplanung, Aufmaß und Montage aus einer Hand
> angeboten werden, angrenzende Gewerke koordiniert die eG mit Fachpartnern.
>
> Uns interessiert, ob das Modell „Genossenschaft im Küchenhandwerk“ für Ihre
> Leserinnen und Leser ein Thema ist. Gern zeigen wir Ihnen den Stand vor Ort.
>
> Freundliche Grüße
> VIDEKO Küchen eG · Hertzstraße 4 · 97076 Würzburg · 0931 29764861 · info@videko-kuechen.de

---

## Phase 6: Monitoring

**Automatisiert seit 26.11.2026:** Jeden Montag läuft der Live-Check
`scripts/seo-monitor.mjs` als GitHub Action. Er prüft Status, Titel,
Beschreibung, canonical, noindex, alte Mobilnummer und das JSON-LD-Telefon.
Ein Fehler löst eine GitHub-Mail aus. Details und die manuellen Teile stehen
in `docs/SEO-MONITORING.md`.

| Bereich | Quelle | Rhythmus | Kennzahl |
|---|---|---|---|
| Suche | Google Search Console, Leistung | wöchentlich | Impressionen, Klicks, Position je Kernbegriff (Tabelle oben) |
| Bing | Bing Webmaster Tools | monatlich | indexierte Seiten, Klicks |
| Index | GSC, Seitenindexierung | nach jedem Deploy mit neuen URLs | Status der neuen URLs „indexiert“ |
| Maps | Google-Unternehmensprofil, Leistung | monatlich | Suchaufrufe, Routen, Anrufe |
| Verzeichnisse | Tabelle Phase 3 | quartalsweise | NAP identisch, keine erfundenen Öffnungszeiten |
| Backlinks | GSC, Links | monatlich | neue verweisende Domains (wuems.de, Presse) |
| Anfragen | Kontaktformular, Telefon | monatlich | Anzahl und Quelle („Wie haben Sie uns gefunden?“) |
| KI-Erwähnungen | Abfrage-Set unten | monatlich | Wird VIDEKO genannt? Mit welchen Daten? Welche Quellen? |

**KI-Abfrage-Set.** Jede Frage wird in einem privaten Fenster gestellt,
ohne Anmeldung und ohne Verlauf. Anbieter: ChatGPT, Google (KI-Übersicht),
Perplexity, Copilot.

1. Welche Küchenstudios gibt es in Würzburg?
2. Ich möchte meine Küche in Würzburg renovieren lassen. Wen kann ich fragen?
3. Küchenplanung mit Montage in Würzburg: Welche Anbieter gibt es?
4. Was ist die VIDEKO Küchen eG?
5. Worauf sollte ich achten, wenn ich Küchenangebote vergleiche?

Je Abfrage dokumentieren: Datum, Anbieter, ob VIDEKO genannt wird, ob die
Angaben stimmen (Adresse, Telefon, Rechtsform) und welche Quellen verlinkt
sind. Falsche Angaben gehen auf ihre Quelle zurück. Diese Quelle wird
korrigiert, siehe Phase 3.

**Erste Messung:** offen. Sie muss manuell erfolgen, weil die Antworten von
Anmeldung und Standort abhängen.
