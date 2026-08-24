# Local-SEO- und NAP-Audit — VIDEKO Küchen

**Stand:** 2026-08-24 · **Phase:** SEO Phase 3 · **Erhebungsmethode:** öffentlich abrufbare
Seiten der jeweiligen Verzeichnisse, ohne Login, ohne Änderung fremder Einträge.

---

## 1. Sollwerte (Single Source of Truth)

Verbindliche Quelle im Repository: [`src/data/company.js`](../src/data/company.js).
Alle Website-Ausgaben (Header, Footer, Kontaktblöcke, `tel:`-Links, Google-Maps-Links,
WhatsApp-Link, Schema.org `LocalBusiness`) werden seit Phase 3 aus dieser einen Datei
gespeist.

| Feld | Sollwert | Quelle |
| --- | --- | --- |
| Name (Marke) | **VIDEKO Küchen** | `BRAND.name` |
| Rechtliche Betreiberin | Süddeutsche Sachwert eG, Grubenweg 4b, 82327 Tutzing | `ACTIVE_OPERATOR` |
| Studio-Straße | Hertzstraße 4 | `BRAND.studio.street` |
| PLZ / Ort | 97076 Würzburg (Stadtteil Grombühl) | `BRAND.studio.postalCode/city` |
| Land | Deutschland | `BRAND.studio.country` |
| Telefon | **0160 5545818** (`+491605545818`) | `BRAND.phone` / `BRAND.phoneHref` |
| E-Mail | info@videko-kuechen.de | `BRAND.contactEmail` |
| Website | **https://videko-kuechen.de/** (HTTPS, ohne `www`) | `SITE.origin` |
| Öffnungszeiten | **nicht belegt — offener Datenpunkt** | `BRAND.openingHours === null` |

### 1.1 Zwei Punkte, die bei jeder Korrektur mitgedacht werden müssen

**a) „eG" ist derzeit nicht zutreffend.**
Die *VIDEKO Küchen eG* ist noch **nicht** im Genossenschaftsregister eingetragen
(siehe Kopfkommentar in `company.js`). Sie darf deshalb nicht als bereits bestehende
Betreiberin, Vertragspartnerin oder Rechnungsausstellerin dargestellt werden. Die
Website führt konsequent den Marken-/Geschäftsbereichsnamen **„VIDEKO Küchen"** —
ohne Rechtsformzusatz. Mehrere externe Einträge tragen dagegen „VIDEKO Küchen eG"
bzw. „Videko Küchen eG". Das ist keine reine SEO-Frage, sondern potenziell eine
Firmierungsfrage. Empfehlung: extern überall auf **„VIDEKO Küchen"** vereinheitlichen,
bis eine Eintragung tatsächlich vorliegt.

**b) Öffnungszeiten sind nicht freigegeben.**
Im gesamten Repository sind **keine** verbindlichen Öffnungszeiten hinterlegt; es
existiert auch keine Freigabe dafür. `localBusinessLd()` schreibt deshalb bewusst
**keine** `openingHoursSpecification` in die strukturierten Daten. Drei externe
Verzeichnisse zeigen drei **unterschiedliche** Zeiten (siehe Abschnitt 2). Mindestens
zwei davon müssen falsch sein. Keine dieser Angaben wurde in die Website übernommen.

> **Offener Datenpunkt (Entscheidung erforderlich):** verbindliche Öffnungszeiten des
> Studios Hertzstraße 4. Sobald sie freigegeben sind, werden sie **ausschließlich** in
> `BRAND.openingHours` (`company.js`) eingetragen; Schema.org und alle Verzeichnisse
> werden anschließend daraus abgeglichen. Bis dahin gilt: lieber keine Angabe als eine
> falsche Zusage in den Suchergebnissen.

---

## 2. Gefundene externe Einträge (Citations)

Alle Einträge wurden am 2026-08-24 öffentlich abgerufen.

| Plattform | Name | Adresse | Telefon | Öffnungszeiten | Website | Status |
| --- | --- | --- | --- | --- | --- | --- |
| **Würzburg macht Spaß e. V.** (wuems.de, Mitgliederliste) | „Videko Küchen eG" — abweichend | Hertzstr. 4, 97076 Würzburg — korrekt | **0931 355930**, Fax **0931 3559320** — **falsch** | keine Angabe | info@videko-kuechen.de + Website-Link — korrekt | **Korrektur notwendig** |
| **Cylex** (`web2.cylex.de/firma-home/videko-kuechen-eg-17200128.html`) | „VIDEKO Küchen eG" — abweichend | Hertzstraße 4, 97076 Würzburg, Bayern — korrekt | 0160 5545818 — korrekt | **Mo–So 09:00–18:00** — unbelegt | https://videko-kuechen.de/ — korrekt | **unklar / Korrektur notwendig** (Zeiten) |
| **Das Örtliche** (`dasoertliche.de`, Suche „VIDEKO", Würzburg) | „VIDEKO Küchen" — korrekt | Hertzstraße 4, 97076 Würzburg, Grombühl — korrekt | 0160 5 54 58 18 — korrekt | „Geöffnet bis 18:00 Uhr"; laut Detailansicht **Mo–Fr 09:00–18:00, Sa/So geschlossen** — unbelegt | Website-Link vorhanden — korrekt | **unklar / Korrektur notwendig** (Zeiten) |
| **Gelbe Seiten** (`gelbeseiten.de/suche/videko/würzburg`) | „VIDEKO Küchen" — korrekt | Hertzstraße 4, 97076 Würzburg (Grombühl) — korrekt | 0160 5 54 58 18 — korrekt | **„Geöffnet – 24 Stunden Service"** — **mit hoher Wahrscheinlichkeit Fehlinformation** | Webseite-Link vorhanden — korrekt | **Korrektur notwendig** |
| **11880.com** (`11880.com/branchenbuch/wuerzburg/131903204B114143681/videko-kuechen.html`) | „VIDEKO Küchen" — korrekt | Hertzstr. 4, 97076 Würzburg (Grombühl) — korrekt | (0160) 5545818 — korrekt | **keine hinterlegt** („Öffnungszeiten hinzufügen") | https://videko-kuechen.de/ — korrekt | **korrekt** (konsistent mit dem offenen Datenpunkt) |
| **Geolokal** (`geolokal.de/firmen/videko-kuechen-wuerzburg`) | „VIDEKO Küchen" — korrekt | Hertzstraße 4, 97076 Würzburg, Deutschland — korrekt | 0160 5545818 — korrekt | „Heute (Montag) 09:00–18:00" — unbelegt | videko-kuechen.de + info@videko-kuechen.de — korrekt | **unklar** (Zeiten; zusätzlich „Keine genauen Koordinaten vorhanden") |
| **LinkedIn** (`de.linkedin.com/company/videko-kuechen-eg`) | „VIDEKO Küchen eG" — abweichend | Hauptsitz: „Würzburg" (ohne Straße) | keine Angabe | keine Angabe | videko-kuechen.de — korrekt | **abweichend** (Name) |
| **XING** (`xing.com/pages/videko-kuechen-eg`) | „VIDEKO Küchen eG" — abweichend | Hertzstraße 4, 97076 Würzburg, Deutschland — korrekt | +49 160 5545818 — korrekt | keine Angabe | **`http://videko-kuechen.de`** — Protokoll abweichend (HTTP statt HTTPS) | **abweichend** (Name, URL-Protokoll) |
| **Instagram** (`instagram.com/videko.kuechen/`) | Profilname VIDEKO Küchen | — | — | — | Profil-Link | **korrekt** (einziges in `SOCIAL_PROFILES` hinterlegtes Profil) |
| **YouTube** (Video `mESXT-HGWqo`) | Erwähnung/Video | — | — | — | — | **unklar** (kein NAP-Datensatz, kein Verzeichniseintrag) |

### 2.1 Die vier ausdrücklich benannten Abweichungen im Detail

**(1) Würzburg macht Spaß e. V. — falsche Telefon- und Faxnummer.** Bestätigt.
Der Eintrag lautet „Videko Küchen eG | Hertzstr. 4 | 97076 Würzburg | Tel. 0931 355930 |
Fax 0931 3559320 | eMail info@videko-kuechen.de". Der **unmittelbar davor** stehende
Datensatz derselben Liste (Volkshochschule Würzburg, `info@vhs-wuerzburg.de`) trägt
**exakt dieselbe Telefon- und Faxnummer**. Damit ist der Verdacht belegt: die Nummern
wurden beim Anlegen aus dem Nachbardatensatz übernommen. E-Mail-Adresse und Website
sind korrekt. **Sollwert: 0160 5545818, kein Fax.** Höchste Priorität — hier steht eine
fremde Rufnummer unter dem VIDEKO-Namen.

**(2) Cylex — Adresse und Telefon korrekt, Öffnungszeiten unbelegt.** Bestätigt:
Mo–So 09:00–18:00 (alle sieben Tage identisch). Der Eintrag ist offenbar gepflegt
(„Letzte Aktualisierung: 23.08.2026", „Verwaltet von Dennis"), es besteht also
vermutlich legitimer Zugriff. Die Zeiten wurden **nicht** in die Website übernommen und
gelten bis zu einer Freigabe nicht als bestätigt. Sonntagsöffnung eines Küchenstudios
ist zudem nach § 3 LadSchlG in Bayern grundsätzlich nicht zulässig — die Angabe
„Sonntag 09:00–18:00" sollte in jedem Fall entfernt oder korrigiert werden.

**(3) Das Örtliche — Öffnungszeiten unbelegt.** Bestätigt für die Trefferliste
(„Geöffnet bis 18:00 Uhr" am Montag), was zu Mo–Fr 09:00–18:00 passt. Auch diese Zeiten
werden **nicht** als Wahrheit angenommen; sie widersprechen den Cylex-Zeiten (dort auch
Sa/So geöffnet).

**(4) Gelbe Seiten — „24 Stunden Service".** Bestätigt: der Eintrag zeigt
„Geöffnet – 24 Stunden Service". Für ein terminbasiertes Küchenstudio ist das mit hoher
Wahrscheinlichkeit **Fehlinformation** und sollte entfernt werden. Solange keine
freigegebenen Zeiten vorliegen, ist „keine Öffnungszeiten hinterlegt" (wie bei 11880)
die ehrlichere Darstellung.

### 2.2 Widerspruchsmatrix Öffnungszeiten

| Quelle | Mo–Fr | Sa | So |
| --- | --- | --- | --- |
| Website / Schema.org | *keine Angabe* | *keine Angabe* | *keine Angabe* |
| Cylex | 09:00–18:00 | 09:00–18:00 | 09:00–18:00 |
| Das Örtliche | 09:00–18:00 | geschlossen | geschlossen |
| Gelbe Seiten | „24 Stunden Service" | „24 Stunden Service" | „24 Stunden Service" |
| Geolokal | 09:00–18:00 (Mo belegt) | unbekannt | unbekannt |
| 11880 | *keine Angabe* | *keine Angabe* | *keine Angabe* |

Drei sich gegenseitig ausschließende Varianten. Für Google ist das ein klares
Inkonsistenzsignal im lokalen Ranking. Auflösbar ist es nur durch eine einzige
freigegebene Vorgabe — nicht durch Übernahme einer der drei Varianten.

---

## 3. Was in dieser Phase am Repository geändert wurde

- `BRAND.openingHours = null` als **dokumentierter offener Datenpunkt** ergänzt;
  `localBusinessLd()` schreibt `openingHoursSpecification` nur, wenn dieser Wert
  gesetzt ist. Ohne Freigabe bleibt das Feld aus dem Schema heraus.
- Neue Exporte `STUDIO_ADRESSE`, `STUDIO_MAPS_URL` und `whatsappUrl()` in `company.js`.
- Bisher hartcodierte NAP-Strings auf diese Quelle umgestellt:
  `ContactSection.jsx`, `Beratung.jsx`, `Karriere.jsx`, `StylefinderFlow.jsx`,
  `Journal.jsx`, `Footer.jsx`, `Studio.jsx`, `UeberUns.jsx`.
  Das gerenderte HTML ist dabei unverändert geblieben (byte-gleich geprüft) — es ging
  ausschließlich darum, dass eine künftige Nummern- oder Adressänderung an **einer**
  Stelle greift.
- Organisation (Süddeutsche Sachwert eG, Tutzing) und `LocalBusiness` (Studio Würzburg)
  bleiben unverändert getrennt: `organizationLd()` mit dem Sitz der Betreiberin,
  `localBusinessLd()` mit `parentOrganization`-Verweis und der Würzburger Anschrift.

**Deployment-Status:** Commit `35bb00a`, gepusht auf `merch-shop` und `main`
(beide Branches auf demselben Stand), produktiv auf https://videko-kuechen.de/ am
2026-08-24 verifiziert: 64 Sitemap-URLs mit 21 `<lastmod>`-Einträgen, alle geprüften
Routen HTTP 200 mit korrektem Canonical und `index, follow`, `dateModified` in den
Artikel-JSON-LD, keine `openingHoursSpecification` im `LocalBusiness`.

Reine Fließtext-Erwähnungen der Straße („Beraten wird bei uns in der Hertzstraße …")
wurden bewusst **nicht** in Variablen aufgelöst — das ist Copy, keine Datenhaltung.

---

## 4. Google Business Profile — Prüf- und Korrekturliste

> **Wichtig:** Das aktuelle Google-Unternehmensprofil konnte in dieser Session **nicht**
> ausgelesen werden (kein legitimer Zugriff, keine API-Verbindung, siehe Abschnitt 5).
> Es wird deshalb **kein** Feld als „korrekt" behauptet. Die folgende Liste nennt die
> Sollwerte aus der Website und den jeweils zu prüfenden Punkt.

| Feld | Sollwert laut Website | Zu prüfen |
| --- | --- | --- |
| Unternehmensname | **VIDEKO Küchen** | Steht dort „VIDEKO Küchen eG"? Dann auf „VIDEKO Küchen" ändern (Rechtsform noch nicht eingetragen, siehe 1.1a). |
| Primäre Kategorie | **Küchenstudio** (`Kitchen furniture store` / „Küchenmöbelgeschäft") | Ist die primäre Kategorie gesetzt und passend? Sie hat den größten Einfluss auf das lokale Ranking. |
| Weitere Kategorien | Küchenplaner, Innenausstatter, Möbelgeschäft, Tischler/Schreiner (nur soweit tatsächlich zutreffend) | Nur echte Leistungen eintragen — nichts aufzählen, was nicht angeboten wird. |
| Adresse | Hertzstraße 4, 97076 Würzburg | Exakte Schreibweise inkl. „Hertzstraße" (nicht „Hertzstr."); Pin-Position im Kartendienst prüfen (Geolokal meldet fehlende Koordinaten). |
| Telefonnummer | **0160 5545818** | Muss identisch zur Website sein. Keine 0931-Nummer. |
| Website | **https://videko-kuechen.de/** | HTTPS, ohne `www`, ohne Tracking-Parameter. |
| Öffnungszeiten | **offen — nicht freigegeben** | **Nicht raten.** Entweder freigegebene Zeiten eintragen oder das Profil auf „nach Vereinbarung" / ohne Zeiten belassen. Auf keinen Fall die Cylex-, Örtliche- oder Gelbe-Seiten-Variante übernehmen. |
| Beschreibung | Küchenstudio in Würzburg; Planung, Beratung, Aufmaß, Montage, Arbeitsplatten; individuelle Küchen nach Maß | Beschreibung ohne Keyword-Stuffing, ohne Preisangaben, ohne Werbeversprechen (Google-Richtlinie). |
| Leistungen / Services | Küchenplanung, Küchenberatung, Aufmaß, Küchenmontage, Arbeitsplatten, Elektrogeräteplanung, Umbau/Renovierung | Sollte den Leistungsseiten der Website entsprechen (`/leistungen`, `/planung`, `/kuechen-nach-mass`, `/arbeitsplatten`, `/kuechenmontage-wuerzburg`, `/alles-aus-einer-hand`). |
| Fotos | Studio-, Küchen- und Detailaufnahmen aus dem vorhandenen Bildbestand | Keine Stockfotos als Studioaufnahmen ausgeben. Mindestens Außen-/Eingangsansicht, damit das Studio auffindbar ist. |
| Logo | `public/favicon-512.png` bzw. Marken-Logo | Quadratisch, ohne Rand. |
| Titelbild | Hero-Motiv der Startseite / Studio | Querformat. |
| Eröffnungsstatus | **Studio im Aufbau** — laut LinkedIn-Profil „Eröffnung 2026" | Falls das Studio noch nicht regulär geöffnet ist: Profil als „demnächst geöffnet" mit Eröffnungsdatum führen, **nicht** als regulär geöffnet. Das ist derselbe offene Punkt wie die Öffnungszeiten. |
| Attribute | z. B. „Termin erforderlich" | Passend zum terminbasierten Modell — deckt sich mit `availableService: „Küchenplanung nach Terminvereinbarung"`. |
| Inhaberschaft | — | Prüfen, ob das Profil überhaupt beansprucht („claimed") ist. Ein unbeanspruchtes Profil kann von Dritten bearbeitet werden. |

---

## 5. Google Search Console — Status und manuelle Schritte

**Befund:** Auf diesem Rechner sind **keine** legitim konfigurierten Google-Zugangsdaten
vorhanden. Geprüft und jeweils negativ:

- kein `gcloud`-CLI installiert, kein `~/.config/gcloud` und kein `%APPDATA%/gcloud`
- keine Umgebungsvariablen `GOOGLE_APPLICATION_CREDENTIALS`, `GSC_*`, `SEARCH_CONSOLE_*`
- keine Service-Account-JSON und keine `.env` im Repository (nur `.env.example`)
- **kein** `google-site-verification`-Meta-Tag in `index.html`, `src/`, `public/` oder
  den Prerender-Skripten

Es wurden **keine** neuen Zugangsdaten erzeugt und kein Zugangsschutz umgangen.
Es werden ausdrücklich **keine** Sitemap-Ping-URLs (die alten `google.com/ping`- und
`bing.com/ping`-Endpunkte sind abgeschaltet) und **keine** „Instant Indexing"-Dienste
verwendet. Die Einreichung ist damit ein **manueller Schritt**:

1. **Property anlegen** — https://search.google.com/search-console → Property hinzufügen.
   Empfohlen: **Domain-Property** `videko-kuechen.de` (deckt `www`, `http` und `https`
   gemeinsam ab). Alternativ URL-Präfix-Property `https://videko-kuechen.de/`.
2. **Inhaberschaft bestätigen.**
   - Domain-Property: TXT-Eintrag `google-site-verification=…` beim DNS-Anbieter der
     Domain hinterlegen. Kein Code-Deployment nötig.
   - URL-Präfix-Property (Alternative): Meta-Tag in `index.html` einfügen. Dafür ist ein
     Deployment nötig; das Tag muss dauerhaft bleiben. **Aktuell ist kein solches Tag
     gesetzt** — die Property ist also noch nicht über diesen Weg bestätigt.
3. **Sitemap einreichen** — in der Property unter *Sitemaps* den Pfad `sitemap.xml`
   eintragen (Vollpfad `https://videko-kuechen.de/sitemap.xml`, HTTP 200, 64 URLs).
   Die Sitemap ist bereits in `public/robots.txt` referenziert; die Einreichung
   beschleunigt die Erfassung zusätzlich.
4. **Wichtige Einstiegs-URLs prüfen** — *URL-Prüfung* für `/`, `/studio`, `/planung`,
   `/leistungen`, `/beratung`, `/kuechen-nach-mass`, `/arbeitsplatten`,
   `/kuechenmontage-wuerzburg`, `/alles-aus-einer-hand`, `/journal` und anschließend
   „Indexierung beantragen". Das Kontingent liegt bei rund 10–12 Anfragen pro Tag;
   die neuen Leistungsseiten aus Phase 2 zuerst.
5. **Nach 3–7 Tagen** die Berichte *Seiten* (Indexierungsstatus) und *Sitemaps*
   kontrollieren, danach *Leistung* für erste Impressionen.
6. **Bing Webmaster Tools** (optional, gleicher manueller Weg): Property anlegen,
   Sitemap einreichen. Bing versorgt u. a. ChatGPT-Suche und DuckDuckGo.

---

## 6. Empfohlene Korrekturreihenfolge extern

1. **Würzburg macht Spaß e. V.** — falsche Telefon-/Faxnummer korrigieren lassen
   (Ansprechpartner des Vereins kontaktieren). Größter Schaden, geringster Aufwand.
2. **Gelbe Seiten** — „24 Stunden Service" entfernen.
3. **Öffnungszeiten intern freigeben** — danach in `company.js` eintragen und
   Cylex, Das Örtliche, Geolokal, 11880 und Google Business Profile darauf abgleichen.
4. **Namensschreibweise** überall auf „VIDEKO Küchen" vereinheitlichen
   (Cylex, LinkedIn, XING, Würzburg macht Spaß), solange die eG nicht eingetragen ist.
5. **XING** — Website-Link von `http://` auf `https://` umstellen.

---

## 7. Grenzen dieser Erhebung

- Es wurden ausschließlich **öffentlich abrufbare** Seiten gelesen. Kein Login, kein
  Umgehen von Zugriffsschutz, keine automatisierte Änderung fremder Einträge.
- **Google Business Profile, Google Maps und Apple Maps** konnten nicht ausgelesen
  werden. Aussagen dazu sind daher Prüfaufträge, keine Feststellungen.
- Die Suchabdeckung ist nicht vollständig: mehrere Suchdienste liefern für deutsche
  Lokaltreffer nur eingeschränkte Ergebnisse. Weitere Verzeichnisse (z. B. Apple Maps,
  Bing Places, Herold-Netzwerke, Branchenaggregatoren) können zusätzliche, hier nicht
  erfasste Einträge enthalten und sollten bei Gelegenheit nachgeprüft werden.
- Die Öffnungszeiten von Das Örtliche wurden in der Trefferliste als „Geöffnet bis
  18:00 Uhr" (Montag) belegt; die vollständige Wochenübersicht Mo–Fr 09:00–18:00 /
  Sa+So geschlossen stammt aus der Detailansicht und ist als Angabe des Verzeichnisses
  wiedergegeben, nicht als bestätigter VIDEKO-Wert.
