# SEO-Monitoring: was automatisch läuft, was manuell bleibt

Stand 26.11.2026. Es entstehen keine Kosten.

## Automatisch

**`scripts/seo-monitor.mjs`** prüft die Live-Seite:

- Jede URL der Sitemap muss diese Bedingungen erfüllen:
  - Status 200
  - `<title>` vorhanden
  - meta description vorhanden
  - canonical zeigt auf sich selbst
  - kein `noindex`
  - die alte Mobilnummer kommt nicht vor, in keiner Schreibweise
- Das Telefon im JSON-LD der Startseite ist `+4993129764861`.
- `robots.txt` verweist auf die Sitemap.
- Die IndexNow-Schlüsseldatei ist erreichbar.
- **Suchbegriff → Zielseite** (`SUCHBEGRIFFE` im Skript): Jede Zielseite steht
  in der Sitemap, liefert 200 und trägt alle Kernwörter des Begriffs in
  `<title>`, description oder `<h1>`. Das misst keine Position bei Google,
  sondern stellt sicher, dass die Seite für den Begriff eindeutig bleibt.

  | Suchbegriff | Zielseite |
  |---|---|
  | Schüller Küchen Würzburg | /marken/schueller |
  | next125 Würzburg | /marken/next125 |
  | nobilia Würzburg | /marken/nobilia |
  | IMPULS Küchen Würzburg | /marken/impuls |
  | BORA Würzburg | /marken/bora |
  | Miele Würzburg | /marken/miele |
  | Quooker Würzburg | /marken/quooker |
  | Küchenmarken Würzburg | /marken |
  | Küchen für Bauträger Würzburg | /kuechen-fuer-bautraeger |
  | Küchen Immobilieninvestoren Würzburg | /kuechen-fuer-immobilieninvestoren |
  | Küchen für Bauträger deutschlandweit | /kuechen-fuer-bautraeger |
  | Küchen für Immobilieninvestoren deutschlandweit | /kuechen-fuer-immobilieninvestoren |
  | Küchenstudio Eröffnung Würzburg | /studio |

  **Bewusst nicht verfolgt (26.11.2026):** „Einbauküchen deutschlandweit“ und
  „Küchenlieferung bundesweit“. Die Treffer gehören Ketten, Baumärkten und
  Marktplätzen (Höffner, Hornbach, XXXLutz, Kaufland). Dafür gibt es keine
  eigene Seite und **keine Städteseiten** für Orte ohne VIDEKO-Studio. Die
  Lieferung steht als Fakt auf /studio, den B2B-Seiten und /kuechenmontage-wuerzburg.
  | Küchenmontage Würzburg | /kuechenmontage-wuerzburg |

  Positionen und Klicks je Begriff kommen erst mit Search-Console-Zugang
  (siehe „Manuell“). Bis dahin: monatlich in einem privaten Browserfenster
  von Hand suchen und unten eintragen.

**Ausführen:**

- lokal mit `npm run seo:monitor`
- per GitHub Action `.github/workflows/seo-monitor.yml`, jeden Montag um
  06:17 UTC; von Hand über „Actions → SEO-Monitor → Run workflow“

**Alarm:** Schlägt der Lauf fehl, schickt GitHub eine Mail an alle, die das
Repository beobachten. Die Benachrichtigung für fehlgeschlagene Actions ist in
den GitHub-Einstellungen standardmäßig aktiv. Der Lauf dauert etwa eine
Minute und bleibt im kostenlosen Kontingent.

**Erster Lauf (26.11.2026, 13:40 UTC):**

- 40 Sitemap-URLs, alle mit Status 200
- JSON-LD-Telefon `+4993129764861`
- 0 Fehler
- Hinweis: 11 URLs ohne `<lastmod>`. Das sind Shop-Seiten. Das ist kein
  Fehler.

**`scripts/indexnow.mjs`** meldet neue und geänderte URLs nach jedem Deploy an
Bing, Yandex, Seznam und Naver. Bisher wird es von Hand aufgerufen.

## Manuell (braucht Logins, lässt sich ohne Zugang nicht automatisieren)

| Was | Wo | Rhythmus |
|---|---|---|
| Impressionen, Klicks, Position, Indexierung | Google Search Console | wöchentlich |
| Indexierung beantragen für neue URLs | GSC, URL-Prüfung | nach jedem neuen Artikel |
| Bing-Daten | Bing Webmaster Tools | monatlich |
| Profil-Leistung, Telefonnummer im Profil | Google-Unternehmensprofil | monatlich |
| Nummer in Verzeichnissen | Verzeichnistabelle im Masterplan | quartalsweise |
| KI-Erwähnungen | Abfrage-Set im Masterplan, Phase 6 | monatlich |

**Ausbaustufe:** Die Search-Console-API ist kostenlos und kann wöchentlich
Klicks und Positionen je Suchbegriff in eine Datei schreiben. Dafür braucht
es ein Google-Cloud-Dienstkonto mit Lesezugriff auf die Property. Das
Dienstkonto muss VIDEKO selbst anlegen. Der Schlüssel liegt danach nur als
GitHub-Secret vor, nie im Code.
