# Arbeitsbericht: Google Business Profile, Öffnungszeiten, NAP, Search Console

**Datum:** 2026-08-24 · **Sollname extern:** VIDEKO Küchen eG · **Sollanschrift:** Hertzstraße 4, 97076 Würzburg ·
**Solltelefon:** 0160 5545818 · **Sollwebsite:** https://videko-kuechen.de/

Alle Werte in diesem Bericht wurden am 2026-08-24 live erhoben. Wo eine Angabe nicht
verifiziert werden konnte, steht das ausdrücklich dabei. Es wurde nichts geschätzt,
ergänzt oder aus einem Screenshot abgeleitet.

> **NACHTRAG 2026-08-24, Teil B (Verwaltungsansicht).** Der Zugriff auf die eingeloggte
> Google-Sitzung wurde inzwischen hergestellt. Die Verwaltungsansicht hat mehrere Befunde
> aus Teil A widerlegt (Beschreibung war NICHT leer, Facebook war NICHT ohne Eintrag,
> Öffnungszeiten sind vollständig hinterlegt). **Maßgeblich ist ab hier Teil B am Ende
> dieses Dokuments** (Abschnitt 7 ff.). Die Abschnitte 1.1, 1.5, 1.6, 2.1 und 6 sind
> überholt.

**Zugriffslage (bestimmt den Umfang dieses Berichts):** Die Verwaltungsansicht des Google
Business Profile und die Search Console waren **nicht erreichbar**. Der eingeloggte
Chrome-Nutzer existiert (`Dennis.himmel@videko-kuechen.de` ist im lokalen Chrome-Profil
hinterlegt), aber Chrome läuft und hält seinen Cookie-Speicher exklusiv gesperrt; ein
Kopieren des Profils schlägt fehl, Adminrechte für eine Schattenkopie liegen nicht vor,
und `restore_on_startup` ist nicht gesetzt, ein erzwungener Neustart würde also die
offenen Tabs verwerfen. Deshalb wurde **nichts** am GBP geändert. Details und der
notwendige Schritt stehen in Abschnitt 6.

---

## 1. Google Business Profile

### 1.1 Ist-Zustand (öffentlich auslesbar, Google Maps, 2026-08-24)

| Feld | Gefundener Wert | Bewertung |
| --- | --- | --- |
| Unternehmensname | VIDEKO Küchen eG | **korrekt** – entspricht dem Sollnamen |
| Primäre Kategorie | Küchenmöbelgeschäft | **korrekt** – siehe Kategorierecherche 1.3 |
| Weitere Kategorien | öffentlich nicht sichtbar | nur in der Verwaltungsansicht prüfbar |
| Adresse | Hertzstraße 4, 97076 Würzburg (Google-Label „Würzburg-Lengfeld") | **korrekt** |
| Koordinaten / Plus Code | 49,7997 / 9,9726 · QXXF+V2 Würzburg | plausibel, deckt sich mit Cylex (49,799718 / 9,972572) |
| Telefon | 0160 5545818 | **korrekt** |
| Website | videko-kuechen.de | **korrekt** |
| Öffnungszeiten | öffentlich nur `Montag 09:00–18:00`; Statuszeile „Geschlossen · Öffnet Di um 09:00" | **unvollständig** – siehe Abschnitt 2 |
| Sonderöffnungszeiten | öffentlich nicht sichtbar | nicht prüfbar |
| Unternehmensbeschreibung | in der Maps-Ansicht kein Beschreibungsblock vorhanden | vermutlich leer, nicht sicher belegbar |
| Leistungen / Services | öffentlich keine Leistungsliste sichtbar | vermutlich leer, nicht sicher belegbar |
| Attribute | ein Barrierefreiheits-/Rollstuhl-Icon neben der Kategorie | vorhanden, Umfang nicht prüfbar |
| Eröffnungsdatum | öffentlich nicht sichtbar; Inhaber-Beitrag nennt „Eröffnung im Winter 2026" | siehe 1.2 |
| Fotos | ein Titel-/Heldenbild (Rendering eines Küchenstudios mit VIDEKO-Theke), Fotobereich mit etwa einer Kachel, dazu das Bild des Inhaber-Beitrags | **deutlich zu wenig** – siehe 1.6 |
| Logo | nicht als eigenes Logo-Element erkennbar | offen |
| Social-/weitere Links | keine im Profil sichtbar | offen |
| Termin-/Kontaktmöglichkeiten | Anruf-Button, Website-Button, Routenplanung; kein Terminlink | offen |
| Rezensionen | **keine** | siehe Abschnitt 5 |
| Inhaber-Beiträge | 1 Beitrag vom 13.08.2026 | siehe 1.2 |

### 1.2 Der Inhaber-Beitrag vom 13.08.2026 (offizielle Unternehmensquelle)

> „Noch sieht es nach Baustelle aus. Das ist kein Fehler – wir sind einfach noch nicht
> fertig. In der Hertzstraße 4 entsteht VIDEKO Küchen: ein neues Küchenstudio für
> Würzburg mit individueller Küchenplanung und kompletten Raumlösungen aus einer Hand.
> **Bis zur Eröffnung im Winter 2026** gibt es noch einiges zu tun. Den ganzen Wahnsinn
> zeigen wir auf Instagram unter @videko.kuechen."

Das ist nach der Prioritätenordnung des Auftrags eine **Quelle erster Priorität** und hat
unmittelbare Folgen für die Öffnungszeiten-Frage: Ein Studio, das erst im Winter 2026
eröffnet, hat aktuell keinen regulären Publikumsbetrieb. Veröffentlichte Öffnungszeiten
wären derzeit auch dann fragwürdig, wenn sie vollständig bekannt wären.

**Unabhängig bestätigt** durch die zweite selbst gepflegte Unternehmensquelle: Die
LinkedIn-Unternehmensseite (`linkedin.com/company/videko-kuechen-eg`) nennt im Untertitel
„Küchenstudio in Würzburg – 1.250 m², Eröffnung 2026" und im Info-Text „Eröffnung ist
2026". Beide Quellen stammen vom Unternehmen selbst und stimmen überein.

### 1.3 Kategorierecherche – tatsächlich bei Google existierende Kategorien

Da die Kategorieliste des GBP-Backends ohne Verwaltungszugriff nicht lesbar ist, wurden
die real vergebenen Kategoriebezeichnungen **aus den Google-Maps-Ergebnissen selbst**
erhoben (sechs Suchen im Raum Würzburg, 84 Ergebniskarten). Jede folgende Bezeichnung ist
damit eine von Google tatsächlich verwendete Kategorie, keine erfundene.

| Kategorie (live bei Google gefunden) | Häufigkeit | Für VIDEKO? |
| --- | --- | --- |
| Küchenmöbelgeschäft | 25× | **Hauptkategorie beibehalten** – die dominante Kategorie der Branche vor Ort |
| Möbelgeschäft | 14× | eher nein – VIDEKO ist Küchenspezialist; das Unternehmen führt auf LinkedIn zwar „Möbelhandel" als Spezialgebiet, ein allgemeines Möbelsortiment ist aber nirgends belegt |
| Küchenumbauunternehmen | 8× | **ja, als Zusatzkategorie** – belegt durch `/alles-aus-einer-hand` („Komplettumbau") |
| Auftragnehmer für den Innenausbau | 4× | **ja, als Zusatzkategorie** – das Unternehmen führt „Innenausbau" selbst als Spezialgebiet auf seiner LinkedIn-Seite |
| Trockenbauunternehmen | 4× | nein – Trockenbau wird laut Website koordiniert, nicht selbst ausgeführt |
| Fachhandel für Arbeitsplatten | 1× | **ja, als Zusatzkategorie** – belegt durch `/arbeitsplatten` |
| Innenarchitekt | 1× | nein – kein Nachweis einer Innenarchitekturleistung |
| Möbeltischler / Möbelhersteller | je 1× | nein – kein Nachweis eigener Fertigung |
| Baumarkt, Steinmetz, Fliesenleger, Maler, Zimmermann, Allround-Handwerker | 1–2× | nein |

**Empfehlung:** Hauptkategorie `Küchenmöbelgeschäft` unverändert lassen, ergänzen um
`Küchenumbauunternehmen`, `Fachhandel für Arbeitsplatten` und `Auftragnehmer für den
Innenausbau`. Die ersten beiden sind durch die eigene Website belegt, die dritte durch die
Spezialgebiete-Liste der eigenen LinkedIn-Seite. Nicht eintragen: reine Handwerkskategorien
(Trockenbau, Maler, Fliesenleger, Zimmermann) – diese Gewerke werden laut
`/alles-aus-einer-hand` **koordiniert** und nicht selbst ausgeführt.

### 1.4 Leistungen – Abgleich mit dem tatsächlichen Angebot

Grundlage sind ausschließlich Inhalte der eigenen Website (`src/pages/Leistungen.jsx`,
`AllesAusEinerHand.jsx`, `routes-meta.js`). Alle zehn im Auftrag genannten Leistungen sind
belegt und dürfen eingetragen werden:

| Leistung | Beleg |
| --- | --- |
| Küchenberatung | `/beratung`, Leistungsblock „Beratung & Planung" |
| Küchenplanung | `/planung`, „Aufmaß & 3D-Planung" |
| Einbauküchen | `/kuechen-nach-mass` („Einbauküchen & Designküchen") |
| Küchen nach Maß | `/kuechen-nach-mass` |
| Küchenmontage | `/kuechenmontage-wuerzburg`, „Lieferung & Montage" |
| Arbeitsplatten | `/arbeitsplatten` |
| Küchenumbau | `/alles-aus-einer-hand` |
| Komplettumbau | `/alles-aus-einer-hand`, Kicker „Komplettumbau" |
| Raumplanung | `/alles-aus-einer-hand` („Nicht nur Küche. Der ganze Raum.") |
| Lichtplanung | Leistungsblock „Lichtplanung & Ambiente" |

Zusätzlich belegt und eintragbar: **Geräte- und Technikplanung**, **Materialberatung**,
**Koordination der Gewerke**, **Nachbetreuung/Service**.

Gegengeprüft mit der Spezialgebiete-Liste, die das Unternehmen selbst auf LinkedIn führt –
sie deckt sich vollständig mit der Website und nennt zusätzlich: Küchenstudio,
Küchenverkauf, Raumkonzepte, Aufmaß, Elektrogeräte, Innenausbau, Möbelhandel.

### 1.5 Unternehmensbeschreibung – Entwurf

Da im öffentlichen Profil kein Beschreibungstext erscheint, ist von einem leeren Feld
auszugehen.

Der Entwurf wurde **nicht frei erfunden**, sondern aus dem Text gekürzt, den das
Unternehmen selbst auf seiner LinkedIn-Seite veröffentlicht hat (Abschnitt „Info"), ergänzt
um Formulierungen der eigenen Website. Damit bleibt die Beschreibung in der Stimme des
Unternehmens und enthält keine Aussage ohne Beleg. Länge 714 Zeichen (Google-Limit 750):

> In Würzburg entsteht VIDEKO: Aus einer rund 1.250 m² großen Halle bauen wir in der
> Hertzstraße 4 ein Küchenstudio, das weder wie ein klassisches Möbelhaus aussehen noch so
> funktionieren soll. Eröffnung Winter 2026. VIDEKO Küchen ist eine Genossenschaft – die
> Grundlage für langfristige Entscheidungen. Wir planen und
> verkaufen Küchen und komplette Raumkonzepte für Würzburg und die Region: von der
> Bedarfsanalyse über Entwurf, Aufmaß und 3D-Planung bis zu Arbeitsplatten, Geräten,
> Lichtplanung, Lieferung und Montage. Auf Wunsch übernehmen wir den ganzen Raum und
> koordinieren die beteiligten Gewerke. Feste Ansprechpartner, ehrliche Beratung,
> nachvollziehbare Abläufe. Termine bis zur Eröffnung nach Vereinbarung.

**Hinweis zur Konsistenz:** Der LinkedIn-Text nennt „Eröffnung ist 2026", der
GBP-Inhaber-Beitrag vom 13.08.2026 „Eröffnung im Winter 2026". Das widerspricht sich nicht,
ist aber unterschiedlich genau. Empfehlung: überall dieselbe Formulierung verwenden –
„Eröffnung Winter 2026" ist die konkretere und damit für Google und Interessenten die
nützlichere.

### 1.6 Fotos – Bestand und Lücken

**Vorhanden:** ein Titel-/Heldenbild (gerendertes Küchenstudio), das Beitragsbild
„HIER ENTSTEHT WÜRZBURGS NEUES KÜCHENSTUDIO", insgesamt etwa eine Kachel im Fotobereich.
Alles Grafik/Rendering, kein Foto des realen Standorts.

**Fehlend** (keine Bilder erfunden oder generiert – das ist eine Aufnahmeliste):
Außenansicht des Gebäudes · Eingang mit Beschilderung · Studio innen · Ausstellungsküchen ·
realisierte Kundenküchen · Detailaufnahmen (Fronten, Arbeitsplatten, Beschläge, Licht) ·
Team · Vorher/Nachher · Logo als eigenes Profilbild · echtes Titelbild.

Solange das Studio Baustelle ist, sind Baufortschritts-Fotos die realistische
Zwischenlösung – sie sind echt, aktuell und passen zur Kommunikation des Inhaber-Beitrags.

### 1.7 Was geändert wurde

**Nichts.** Ohne Verwaltungszugriff war keine Änderung möglich. Es wurde bewusst auch
kein öffentlicher „Änderung vorschlagen"-Weg genutzt: Vorschläge Dritter sind im
verwalteten Profil der schlechtere Weg und teils nicht sauber zurücknehmbar.

---

## 2. Öffnungszeiten

### 2.1 Alle gefundenen Werte mit Quelle

| Quelle | Priorität laut Auftrag | Gefundener Wert | Stand |
| --- | --- | --- | --- |
| Repository (`src`, `public`, `scripts`, `index.html`, `dist`) | 1 – interne Unternehmensquelle | **keine Öffnungszeiten vorhanden**; das Wort „Uhr" kommt in den ausgelieferten Seiten nicht vor | 2026-08-24 |
| `src/data/site.js` (Kommentar) | 1 | „Das Studio befindet sich im Aufbau, Termine laufen über die Beratungsanfrage." | 2026-08-24 |
| GBP Inhaber-Beitrag 13.08.2026 | 1 | „Bis zur **Eröffnung im Winter 2026** gibt es noch einiges zu tun." | 2026-08-24 |
| LinkedIn-Unternehmensseite (selbst gepflegt) | 1 | keine Öffnungszeiten; „Küchenstudio in Würzburg – 1.250 m², **Eröffnung 2026**" | 2026-08-24 |
| Google Business Profile (öffentlich) | 2 | nur `Montag 09:00–18:00`; Statuszeile belegt zusätzlich Dienstag ab 09:00 | 2026-08-24 |
| Website live (videko-kuechen.de) | 3 | keine Öffnungszeiten veröffentlicht | 2026-08-24 |
| Cylex | 4 | Mo–So 09:00–18:00 | 2026-08-24 |
| Das Örtliche | 4 | „öffnet morgen um 09:00 Uhr" (entspricht Mo–Fr 09:00–18:00) | 2026-08-24 |
| Gelbe Seiten | 4 | „Geöffnet – 24 Stunden Service" | 2026-08-24 |
| Geolokal | 4 | „Heute (Montag) 09:00 – 18:00" | 2026-08-24 |
| 11880 | 4 | keine Öffnungszeiten hinterlegt | 2026-08-24 |
| Würzburg macht Spaß | 4 | keine Öffnungszeiten | 2026-08-24 |
| XING | 4 | keine Öffnungszeiten | 2026-08-24 |
| LinkedIn (als Verzeichnis betrachtet) | 4 | keine Öffnungszeiten | 2026-08-24 |
| Bing / Apple Maps | 4 | kein Eintrag vorhanden | 2026-08-24 |

### 2.2 Bewertung

Die externen Verzeichnisse widersprechen sich (Mo–So, Mo–Fr, 24 Stunden, gar nichts).
Nach der ausdrücklichen Vorgabe ist Mehrheit kein Beweis; der scheinbare Konsens
„09:00–18:00" stammt zudem erkennbar aus derselben Datenherkunft und ist damit kein
unabhängiger Beleg.

Die einzige **verwaltete** Quelle – das Google Business Profile – gibt öffentlich nur
Montag 09:00–18:00 her. Alle Versuche, den Wochenplan aufzuklappen, liefern konsistent nur
diese eine Zeile; auch die von Maps im Hintergrund geladenen Daten enthalten ausschließlich
den Montags-Eintrag. Googles Statustext „Öffnet Di um 09:00" belegt zusätzlich einen
Dienstagsbeginn um 09:00. Mittwoch bis Sonntag sind öffentlich nicht ermittelbar.

Gleichzeitig sagt die höchstpriorisierte Quelle – das Unternehmen selbst – dass das Studio
erst im Winter 2026 eröffnet.

### 2.3 Ergebnis

> **Der Sollwert für die Öffnungszeiten ist nicht sicher bestätigt.**
>
> Belegt sind ausschließlich: Montag 09:00–18:00 sowie ein Dienstagsbeginn um 09:00,
> beides aus dem verwalteten Google-Profil. Der vollständige Wochenplan ist ohne
> Verwaltungszugriff nicht feststellbar. Es wurden keine Öffnungszeiten in das
> Repository, in die strukturierten Daten oder in ein Verzeichnis eingetragen.
> `BRAND.openingHours` bleibt `null`, `localBusinessLd()` schreibt weiterhin keine
> `openingHoursSpecification`.
>
> **Empfehlung, sobald Verwaltungszugriff besteht:** Solange das Studio Baustelle ist,
> ist die ehrliche Variante nicht ein voller Wochenplan, sondern das GBP-Feld
> „Eröffnungsdatum" plus Terminvereinbarung. Ein Wochenplan, den niemand einhalten kann,
> ist in den Suchergebnissen eine falsche Zusage und erzeugt genau die
> Ein-Stern-Bewertungen, die ein neues Profil am wenigsten verträgt.

### 2.4 Nebenbefund: Stadtteil Grombühl oder Lengfeld

Google beschriftet die Adresse mit „Würzburg-Lengfeld", OpenStreetMap und die daraus
gespeisten Verzeichnisse (Das Örtliche, Gelbe Seiten) mit „Grombühl". Eine Reverse-Abfrage
auf die von Google selbst genannten Koordinaten (49,7997447 / 9,9726029) liefert bei
OpenStreetMap ebenfalls „Grombühl", PLZ 97076.

**Bewertung:** Der Stadtteil ist **kein NAP-Feld** – die postalische Anschrift ist überall
identisch und korrekt. Der Widerspruch wurde nicht „korrigiert", weil kein belastbarer
Sollwert vorliegt und eine Änderung an Google-Kartendaten nicht eindeutig reversibel ist.
Dokumentiert, nicht angefasst.

---

## 3. NAP – Abgleich aller geprüften Plattformen

Sollwerte: **VIDEKO Küchen eG** · **Hertzstraße 4, 97076 Würzburg** · **0160 5545818** ·
**https://videko-kuechen.de/**

| Plattform | Name | Adresse | Telefon | Website | Öffnungszeiten | Abweichung | Priorität |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Google Business Profile | VIDEKO Küchen eG ✔ | Hertzstraße 4, 97076 Würzburg ✔ | 0160 5545818 ✔ | videko-kuechen.de ✔ | nur Montag | Wochenplan unvollständig; Profil inhaltlich fast leer | **hoch** |
| Würzburg macht Spaß (wuems.de) | Videko Küchen eG ✔ | Hertzstr. 4 ✔ | **0931 355930 ✘** + Fax **0931 3559320 ✘** | keine | keine | **Fremde Telefon- und Faxnummer.** Identisch mit dem unmittelbar davorstehenden Eintrag „vhs Würzburg & Umgebung e.V." – nachweislich aus dem Nachbardatensatz übernommen | **kritisch** |
| Gelbe Seiten | Videko Küchen eG ✔ | Hertzstraße 4 ✔ | 0160 5545818 ✔ | vorhanden | **„Geöffnet – 24 Stunden Service" ✘** | Falsche Öffnungsangabe | **hoch** |
| Cylex | Videko Küchen eG ✔ | Hertzstraße 4 ✔ | 0160 5545818 ✔ | vorhanden | **Mo–So 09:00–18:00 ✘** | Nicht belegte Öffnungszeiten; Eintrag-ID 17200128 | hoch |
| Das Örtliche | Videko Küchen eG ✔ | Hertzstraße 4, Grombühl | 0160 5545818 ✔ | vorhanden | **Mo–Fr 09:00–18:00 ✘** | Nicht belegte Öffnungszeiten | hoch |
| Geolokal | Videko Küchen ✔ | Hertzstraße 4 ✔ | 0160 5545818 ✔ | vorhanden | **Mo 09:00–18:00 ✘** | Nicht belegte Zeiten; zusätzlich „Keine genauen Koordinaten vorhanden" | mittel |
| 11880 | Videko Küchen ✔ | Hertzstraße 4 ✔ | 0160 5545818 ✔ | vorhanden | keine | keine NAP-Abweichung; Stand 23.08.2026 | niedrig |
| XING (`/pages/videko-kuechen-eg`) | VIDEKO Küchen eG ✔ | Hertzstraße 4, 97076 Würzburg ✔ | +49 160 5545818 ✔ | **http://videko-kuechen.de ✘** | keine | Website ohne HTTPS und ohne abschließenden Schrägstrich; „Über uns"-Text ist noch der **XING-Platzhaltertext**; 1–10 Mitarbeitende | mittel |
| Instagram (`@videko.kuechen`) | Profil erreichbar | – | – | – | – | Inhalte nur nach Login prüfbar; offizieller Kanal laut `site.js` und GBP-Beitrag | – |
| Bing / Bing Maps | **kein Eintrag** | – | – | – | – | Bing Maps kennt nur die Adresse, kein Unternehmen. Bing Places fehlt vollständig | mittel |
| Apple Maps (über DuckDuckGo-Places geprüft) | **kein Eintrag** | – | – | – | – | Apple Business Connect fehlt vollständig | mittel |
| Yelp | **kein Eintrag** (`/biz/videko-küchen-würzburg` → 404) | – | – | – | – | – | niedrig |
| LinkedIn (`/company/videko-kuechen-eg`) | VIDEKO Küchen eG ✔ | Hertzstraße 4, 97076 Würzburg ✔ | **nicht hinterlegt** | videko-kuechen.de ✔ | keine | Telefonnummer fehlt; die Kopfzeile nennt als Hauptsitz nur „Würzburg" ohne Straße (im Orte-Block steht sie korrekt). Sonst vollständig und gut gepflegt: Branche, Größe 2–10, gegründet 2026, 13 Spezialgebiete, ausführlicher Info-Text | niedrig |
| Facebook | nicht öffentlich prüfbar (Seitensuche nur nach Login) | – | – | – | – | offen | niedrig |

### 3.0 Nebenbefund zum Rechtsformzusatz „eG"

Die Registerrecherche über `northdata.de` fand am 2026-08-24 **keinen** deutschen
Registereintrag zu einer „VIDEKO Küchen eG". Auf der selbst gepflegten LinkedIn-Seite
schreibt das Unternehmen jedoch ausdrücklich „VIDEKO Küchen ist eine Genossenschaft" und
nennt als Gründungsjahr 2026. Das erklärt den Befund plausibel – Eintragungen aus dem
laufenden Jahr sind bei northdata häufig noch nicht erfasst – und stützt die Vorgabe, das
„eG" zu führen. Ein Registerauszug ersetzt es nicht. Konsequenz unverändert: „VIDEKO Küchen
eG" ist der Sollname für **externe Einträge**; Betreiberin/Vertragspartnerin im Impressum
bleibt `ACTIVE_OPERATOR` (Süddeutsche Sachwert eG). Details in
`docs/LOCAL-SEO-NAP-AUDIT-2026-08-24.md`, Abschnitt 1.1a.

### 3.1 Bereits korrigierte Einträge

**Keine.** Für keines der fehlerhaften Portale besteht ein bestehender, legitimer
Account-Zugang. Kein Portal erlaubt eine anonyme, eindeutige und risikolose Korrektur:
Cylex, Gelbe Seiten, Das Örtliche und 11880 verlangen für Datenänderungen eine
Eintragsübernahme mit Identitätsnachweis, wuems.de ist ein redaktionell gepflegtes
Mitgliederverzeichnis ohne Selbstverwaltung. Es wurden auftragsgemäß keine neuen Accounts
angelegt, keine Identitätsprüfung umgangen und keine kostenpflichtigen Pakete gebucht.

### 3.2 Noch offene Einträge – ermittelter Korrekturweg

| Portal | Korrekturweg (live ermittelt) | Vorbereitet |
| --- | --- | --- |
| **Würzburg macht Spaß** | Kontaktformular https://wuems.de/kontakt (Felder: Vor-/Nachname, E-Mail, E-Mail-Bestätigung, Telefon, Nachricht, Datenschutz-Häkchen) oder E-Mail an **info@wuems.de**, Telefon +49 931 3536754. Eintrag liegt unter https://wuems.de/mitgliederliste-1 | Textvorlage 3.3 |
| **Cylex** | Eintrag https://web2.cylex.de/firma-home/videko-kuechen-eg-17200128.html · Übernahme/Bearbeitung über das Firmen-Dashboard https://web2.cylex.de/admin/edit-company/company-dashboard/17200128 (Login nach Eintragsübernahme) · Kontakt https://web2.cylex.de/deutsch/html/kontakt.htm | Textvorlage 3.3 |
| **Gelbe Seiten** | „Inhalt melden" https://www.gelbeseiten.de/gsservice/inhaltmelden · dauerhafte Pflege über „Eintrag übernehmen" | Textvorlage 3.3 |
| **Das Örtliche** | „Inhalte melden" https://www.dasoertliche.de/inhaltemelden/ · Geschäftseinträge werden über Das Telefonbuch Marketing gepflegt: https://www.dtme.de/ihr-eintrag/ | Textvorlage 3.3 |
| **11880** | https://unternehmen.11880.com/kontakt · Eintrag https://www.11880.com/branchenbuch/wuerzburg/131903204B114143681/videko-kuechen.html | derzeit keine Abweichung |
| **XING** | Seitenverwaltung durch eine berechtigte Person: Website auf `https://videko-kuechen.de/` ändern, Platzhalter-„Über uns"-Text durch den Entwurf aus 1.5 ersetzen | Textvorlage 1.5 |
| **LinkedIn** | Seitenverwaltung (Dennis Himmel ist als Beschäftigter gelistet): Telefonnummer 0160 5545818 nachtragen, Eröffnungsformulierung auf „Winter 2026" vereinheitlichen | Kleinigkeit, kein Fehler |
| **Bing Places** | Neuanlage über https://www.bingplaces.com – setzt Microsoft-Account und Verifizierung voraus | Entscheidung Dennis |
| **Apple Business Connect** | Neuanlage über https://businessconnect.apple.com – setzt Apple-ID und Verifizierung voraus | Entscheidung Dennis |

### 3.3 Fertige Korrekturtexte (nur absenden, nichts mehr formulieren)

**Würzburg macht Spaß (info@wuems.de bzw. Kontaktformular):**

> Betreff: Korrektur unseres Eintrags – VIDEKO Küchen eG, Hertzstraße 4
>
> Sehr geehrte Damen und Herren,
>
> in Ihrer Mitgliederliste ist unser Eintrag „Videko Küchen eG, Hertzstr. 4" mit einer
> falschen Telefon- und Faxnummer hinterlegt. Angegeben sind Tel. 0931 355930 und
> Fax 0931 3559320 – das sind die Nummern des unmittelbar davorstehenden Eintrags
> „vhs Würzburg & Umgebung e.V." und nicht unsere.
>
> Bitte korrigieren Sie den Eintrag wie folgt:
> Name: VIDEKO Küchen eG
> Anschrift: Hertzstraße 4, 97076 Würzburg
> Telefon: 0160 5545818
> Fax: bitte ersatzlos streichen
> Website: https://videko-kuechen.de/
>
> Öffnungszeiten bitte nicht eintragen – unser Studio eröffnet erst im Winter 2026,
> Termine laufen bis dahin nach Vereinbarung.
>
> Vielen Dank und freundliche Grüße

**Gelbe Seiten („Inhalt melden") und Das Örtliche („Inhalte melden"):**

> Der Eintrag „Videko Küchen eG, Hertzstraße 4, 97076 Würzburg" enthält Öffnungszeiten,
> die wir nicht hinterlegt haben und die nicht zutreffen (Gelbe Seiten: „24 Stunden
> Service" / Das Örtliche: Mo–Fr 09:00–18:00). Unser Küchenstudio eröffnet erst im
> Winter 2026; es gibt derzeit keine regulären Öffnungszeiten, Termine erfolgen nach
> Vereinbarung. Bitte entfernen Sie die Öffnungszeiten ersatzlos.
> Alle übrigen Daten sind korrekt: VIDEKO Küchen eG, Hertzstraße 4, 97076 Würzburg,
> Telefon 0160 5545818, https://videko-kuechen.de/.

**Cylex (nach Eintragsübernahme oder über das Kontaktformular):**

> Im Eintrag 17200128 („Videko Küchen eG") sind Öffnungszeiten Mo–So 09:00–18:00
> hinterlegt, die von uns nicht stammen und nicht zutreffen. Unser Küchenstudio in der
> Hertzstraße 4 eröffnet erst im Winter 2026. Bitte entfernen Sie die Öffnungszeiten.
> Name, Anschrift, Telefon (0160 5545818) und Website (https://videko-kuechen.de/)
> sind korrekt.

### 3.4 Durchgeführte Repo-Änderungen

Die einzigen Korrekturen, die ohne fremden Portalzugang eindeutig und risikolos möglich
waren, betreffen das eigene Repository:

| Datei | Änderung | Grund |
| --- | --- | --- |
| `src/data/company.js` | neues Feld `BRAND.listingName = 'VIDEKO Küchen eG'` | Sollname für externe Einträge, getrennt von der Website-Marke `BRAND.name`. Setzt die Vorgabe vom 2026-08-24 um |
| `src/data/company.js` | Kommentar an `BRAND.openingHours` erweitert | dokumentiert den Recherchestand und warum der Wert `null` bleibt |
| `src/data/site.js` | `SOCIAL_PROFILES` um **LinkedIn** und **XING** ergänzt | beide Profile am 2026-08-24 live als offiziell verifiziert; fließen über `SAME_AS` in `organizationLd().sameAs` und stärken die Entitätszuordnung bei Google. Rein strukturelle Daten – die Profile werden nirgends im Frontend gerendert, es ändert sich also nichts am Design |
| `docs/LOCAL-SEO-NAP-AUDIT-2026-08-24.md` | Abschnitt 1.1a neu gefasst, Sollwert- und GBP-Tabellen angepasst, Genossenschafts-Nachtrag | die frühere Empfehlung, das „eG" extern zu streichen, ist aufgehoben |
| `docs/GBP-NAP-ARBEITSBERICHT-2026-08-24.md` | dieses Dokument | Arbeitsbericht |

**Nicht geändert:** `BRAND.openingHours` (bleibt `null`), `ACTIVE_OPERATOR`, die Telefon-
nummer, sämtliche Frontend-Komponenten, Routen und Inhalte.

---

## 4. Google Search Console

| Punkt | Status |
| --- | --- |
| Zugriff auf eine eingeloggte Google-Sitzung | **nein** – siehe Abschnitt 6 |
| Property `videko-kuechen.de` vorhanden | **nicht feststellbar** |
| Sitemap eingereicht | **nicht feststellbar** |
| Sitemap-Status | **nicht feststellbar** |
| Indexierungsstatus der Hauptseiten | **nicht feststellbar** |

Ohne Search Console lässt sich der Indexierungsstand nicht seriös ermitteln: Die
Google-Websuche blockt automatisierte Abfragen („ungewöhnlicher Datenverkehr aus Ihrem
Computernetzwerk"), und Bing hat zu `videko-kuechen.de` überhaupt keine Treffer. Es wurde
auftragsgemäß kein Zugangsschutz umgangen.

**Was stattdessen technisch verifiziert wurde** (live gegen https://videko-kuechen.de/,
2026-08-24, alles grün): Alle geprüften Routen liefern HTTP 200 mit korrektem Canonical und
`index, follow` (`/experience` und `/team` planmäßig `noindex, follow`), `robots.txt`
verweist auf die Sitemap, `sitemap.xml` enthält 64 URLs mit 21 `<lastmod>`-Einträgen,
unbekannte Pfade liefern echtes HTTP 404 mit `noindex`, alle Redirects antworten mit 308
auf das richtige Ziel. Die Voraussetzungen auf Seiten der Website sind also erfüllt; es
fehlt ausschließlich die Verifizierung und Anmeldung in der Search Console.

**Nächster Schritt, sobald eine eingeloggte Sitzung verfügbar ist:** Domain-Property
`videko-kuechen.de` anlegen. Die Verifizierung erfordert einen DNS-TXT-Eintrag beim
Registrar; den exakten Wert gibt Google erst im Anlageprozess aus, er lässt sich nicht
vorab erzeugen. Alternative ohne DNS-Zugriff: URL-Präfix-Property
`https://videko-kuechen.de/` mit HTML-Datei-Verifizierung – die Datei kann direkt in
`public/` abgelegt und mitdeployt werden.

---

## 5. Ranking-Basis: die drei größten verbleibenden Lücken

**1. Null Google-Rezensionen.**
Das Profil hat keine einzige Bewertung. Bewertungsanzahl und -qualität sind neben Nähe und
Relevanz der stärkste Hebel im lokalen Ranking, und ein Profil ohne jede Rezension wird im
Local Pack praktisch nicht ausgespielt. Das ist die mit Abstand größte Lücke – und die
einzige, die sich nicht durch Konfiguration lösen lässt.

**2. Das Google Business Profile ist inhaltlich fast leer.**
Eine Kategorie, keine Leistungen, keine Beschreibung, ein einziges Renderbild, keine Fotos
des realen Standorts, unvollständige Öffnungszeiten. Google hat damit kaum Signale, für
welche Suchanfragen das Profil überhaupt relevant sein soll. Kategorien, Leistungen,
Beschreibung und Fotoliste sind in den Abschnitten 1.3 bis 1.6 fertig vorbereitet.

**3. Keine Search-Console-Property und fehlerhafte Citations.**
Ohne Search Console ist unbekannt, ob und wie Google die 64 Sitemap-URLs indexiert –
Indexierungsprobleme bleiben unentdeckt. Parallel streuen die Verzeichnisse
widersprüchliche Daten: wuems.de führt eine **fremde Telefonnummer**, drei Portale zeigen
drei verschiedene, nicht belegte Öffnungszeiten, und auf Bing Places sowie Apple Business
Connect existiert das Unternehmen überhaupt nicht – zwei Plattformen, auf denen ein
Küchenstudio ohne nennenswerten Aufwand auffindbar wäre.

---

## 6. Der eine offene Blocker: Zugriff auf die eingeloggte Google-Sitzung

Die Abschnitte 1 (Verwaltungsansicht), 4 (Search Console) und die Umsetzung aller
GBP-Verbesserungen hängen an genau einem Punkt.

**Befund:** Im lokalen Chrome-Profil sind drei Google-Konten hinterlegt, darunter
`Dennis.himmel@videko-kuechen.de`. Chrome läuft (35 Prozesse) und hält
`Default\Network\Cookies` exklusiv gesperrt. `Copy-Item` und ein .NET-`FileStream` mit
`FileShare.ReadWrite` scheitern beide; für eine Schattenkopie (VSS) fehlen Adminrechte;
eine Verbindung über das DevTools-Protokoll ist nicht möglich, weil Chrome ohne
`--remote-debugging-port` gestartet wurde. `restore_on_startup` ist nicht gesetzt – ein
erzwungener Neustart würde also die offenen Tabs verwerfen.

**Notwendiger Schritt (eine der beiden Varianten):**

1. Chrome einmal selbst schließen. Danach ist das Profil lesbar, und die
   Verwaltungsansicht sowie die Search Console lassen sich auswerten und die
   vorbereiteten Änderungen umsetzen.
2. Oder: die vorbereiteten Werte aus den Abschnitten 1.3 bis 1.6 direkt im
   Google-Business-Profil-Backend eintragen – Kategorien, Leistungen und Beschreibung
   sind fertig formuliert und belegt.

Ohne einen dieser Schritte bleiben die Abschnitte 1 und 4 offen.

---

# TEIL B — Arbeit in der Verwaltungsansicht (2026-08-24, nach Chrome-Neustart)

Zugriffsweg: Chrome wurde mit gesicherter Sitzung beendet und mit demselben Benutzerprofil
neu gestartet. Remote-Debugging (CDP) ist ab Chrome 136 auf dem Standardprofil bewusst
deaktiviert — das wurde **nicht umgangen**. Stattdessen wurde der real eingeloggte Browser
über Windows UI Automation bedient. Angemeldet: `dhimmel55@gmail.com` (Chrome-Profil „Dennis").

Sitzungssicherung vor dem Neustart:
`scratchpad/session-backup/OFFENE-TABS-2026-08-24.txt` — 211 dedupliziert gesicherte URLs
(offene Tabs inkl. Navigationsverlauf), zusätzlich `Sessions/` und `Preferences.bak`.

---

## 7. Korrektur der Befunde aus Teil A

Vier Aussagen aus Teil A waren nur öffentlich erhoben und sind durch die Verwaltungsansicht
widerlegt:

| Aussage in Teil A | Tatsächlicher Stand in der Verwaltungsansicht |
| --- | --- |
| Beschreibung leer | **Vorhanden**, unternehmenseigener Text (siehe 8.3) |
| Facebook: kein Eintrag | **Vorhanden**: `https://www.facebook.com/videko.kuechen/` |
| Öffnungszeiten nur teilweise sichtbar | **Vollständig hinterlegt**, So–Sa je 09:00–18:00 |
| Search Console: Zugriff unklar | **Property existiert seit 14.08.2026**, bestätigter Inhaber |

---

## 8. Google Business Profile — Feldbestand vorher

Geschäftscode-Ansicht: 2 bestätigte Unternehmen im Konto (100 % bestätigt), davon
„VIDEKO Küchen eG, Hertzstraße 4, 97076 Würzburg". Profilstärke: „Vollständige Informationen",
120 Kundeninteraktionen.

### 8.1 Unverändert gelassen (entsprachen den bestätigten Sollwerten)

| Feld | Wert |
| --- | --- |
| Unternehmensname | `VIDEKO Küchen eG` |
| Telefonnummer | `0160 5545818` |
| Website | `https://videko-kuechen.de/` |
| Adresse | `Hertzstraße 4, 97076 Würzburg` |
| Einzugsgebiet | `Würzburg, Deutschland` |
| Chat | `https://wa.me/491605545818` |
| Soziale Profile | Facebook, Instagram, YouTube, TikTok (4 Einträge) |
| Barrierefreiheit | Rollstuhlgerechter Eingang / Parkplatz / Sitzgelegenheiten |
| Eröffnungsdatum | leer — **bewusst leer gelassen**, siehe 9.4 |

### 8.2 Vorher vorhanden, aber leer bzw. unvollständig

| Feld | Vorher |
| --- | --- |
| Leistungen / Dienstleistungen | **0 Einträge** |
| Unternehmenskategorie | nur `Küchenmöbelgeschäft` (primär), keine Zweitkategorie |
| Fotos | Titelbild + Logo + 5 Unternehmensfotos |

### 8.3 Beschreibung — vorhanden, nicht überschrieben

Hinterlegter Text (unverändert übernommen):

> VIDEKO Küchen ist ein modernes Küchenstudio in Würzburg für individuell geplante Küchen
> und komplette Raumlösungen. Wir verbinden persönliche Beratung, ehrliche Planung und
> hochwertige Materialien mit klarem, modernem Design. Auf Wunsch erhalten unsere Kundinnen
> und Kunden bei uns alles aus einer Hand: Küche, Elektroarbeiten, Boden, Wände, Spanndecken
> und weitere Ausbauleistungen – abgestimmt, koordiniert und ohne unnötige Schnittstellen.
> Von der ersten Idee bis zur fertigen Küche begleiten wir jedes Projekt persönlich. Unser
> Studio befindet sich aktuell noch im Aufbau. Den Weg bis zur Eröffnung zeigen wir auf
> Instagram unter @videko.kuechen.

**Entscheidung: nicht ersetzt.** Der Text ist unternehmenseigen, sachlich, ohne
Keyword-Stuffing und deckt Kernleistung, „alles aus einer Hand" und den Aufbaustatus ab.
Der in Teil A (Abschnitt 1.5) vorbereitete Entwurf wurde **verworfen** — ein Überschreiben
wäre eine schlecht umkehrbare Änderung ohne belegbaren Vorteil.

---

## 9. Google Business Profile — was konkret geändert wurde

### 9.1 Kategorien

| | Vorher | Nachher |
| --- | --- | --- |
| Primär | Küchenmöbelgeschäft | Küchenmöbelgeschäft (unverändert) |
| Weitere | — | **Küchenumbauunternehmen** (neu) |

Vorgehen: Googles Live-Autocomplete wurde abgefragt, um zu prüfen, welche Kategorien
tatsächlich existieren. Ergebnis: `Küchenumbauunternehmen`, `Fachhandel für Arbeitsplatten`,
`Innenausbauunternehmen` und `Auftragnehmer für den Innenausbau` existieren;
`Einbauküchen` existiert **nicht** als Kategorie.

**Bewusst nicht ergänzt:**

- `Fachhandel für Arbeitsplatten` — [Arbeitsplatten.jsx](../src/pages/Arbeitsplatten.jsx)
  stellt ausdrücklich fest, dass Material, Kante und Ausschnitte in die Küchenplanung
  gehören, „nicht in ein separates Projekt". Arbeitsplatten sind also keine eigenständige
  Kundenleistung.
- `Innenausbauunternehmen` / `Auftragnehmer für den Innenausbau` — der Ausbauteil ist
  laut eigener GBP-Beschreibung eine **koordinierte Zusatzleistung „auf Wunsch"**, kein
  eigenständiges Geschäftsfeld. „Innenausbau" auf LinkedIn ist als Beleg ausdrücklich
  nicht ausreichend. Eine solche Kategorie würde außerdem die lokale Relevanz für
  „Küchenstudio Würzburg" verwässern.

Status: gespeichert, Prüfung durch Google abgeschlossen — Kategorie ist **live sichtbar**.

### 9.2 Leistungen: 0 → 12

Google bietet für diese Kategorie keine vordefinierten Leistungen an; alle Einträge wurden
als „Eigene Dienstleistung" angelegt. Jeder Eintrag ist durch eine ausgelieferte Seite
oder einen Abschnitt der Website belegt:

| # | Leistung | Beleg |
| --- | --- | --- |
| 1 | Küchenplanung | `/planung` |
| 2 | Küchenberatung | `/beratung` |
| 3 | Küchen nach Maß | `/kuechen-nach-mass` |
| 4 | Einbauküchen | `/kuechen-nach-mass`, `/leistungen` |
| 5 | 3D-Planung | `/planung` |
| 6 | Aufmaß vor Ort | `/planung`, `/beratung` |
| 7 | Arbeitsplatten | `/arbeitsplatten` |
| 8 | Küchenmontage | `/kuechenmontage-wuerzburg` |
| 9 | Elektrogeräte | `/leistungen` |
| 10 | Lichtplanung | `/leistungen` (Leistung 04 „Lichtplanung & Ambiente") |
| 11 | Raumkonzepte | `/leistungen`, `/alles-aus-einer-hand` |
| 12 | Alles aus einer Hand | `/alles-aus-einer-hand` |

Alle 12 wurden vor dem Speichern zurückgelesen und stehen inzwischen **live** unter der
Primärkategorie im Leistungen-Dialog.

### 9.3 Öffnungszeiten — nichts geändert, Befund dokumentiert

Vollständig hinterlegter Stand (Modus „Geöffnet mit Angabe der Öffnungszeiten"):

| Tag | Zeit |
| --- | --- |
| Sonntag | 09:00–18:00 |
| Montag | 09:00–18:00 |
| Dienstag | 09:00–18:00 |
| Mittwoch | 09:00–18:00 |
| Donnerstag | 09:00–18:00 |
| Freitag | 09:00–18:00 |
| Samstag | 09:00–18:00 |

Kein einziges „Geschlossen"-Häkchen gesetzt.

**Bewertung: kein belastbarer Sollwert, sehr wahrscheinlich Altbestand.** Begründung:

1. Sonntag 09:00–18:00 ist für ein stationäres Küchenstudio in Deutschland nach dem
   Ladenschlussrecht nicht zulässig — der Wert kann nicht bewusst gepflegt sein.
2. Das Studio ist laut eigener GBP-Beschreibung „aktuell noch im Aufbau"; verbindliche
   Publikumszeiten kann es zum jetzigen Zeitpunkt nicht geben.
3. Ein über alle sieben Tage identisches 09:00–18:00 ist das typische Muster einer
   Erstbefüllung, nicht einer gepflegten Angabe.

**Ergebnis: unverändert gelassen und als offen dokumentiert.** Es wurde nichts geraten.
Nebenbefund: die in Teil A gefundene Cylex-Angabe „Mo–So 09:00–18:00" ist damit keine
unabhängige Quelle, sondern eine Spiegelung genau dieses GBP-Werts.

**Offen für Dennis:** verbindliche Zeiten festlegen oder — solange das Studio nicht
eröffnet ist — auf „Vorübergehend geschlossen" bzw. reine Terminvereinbarung umstellen.

### 9.4 Eröffnungsdatum — bewusst leer gelassen

„Winter 2026" ist kein eindeutiges Datum. Ein gesetztes Eröffnungsdatum schaltet das Profil
zudem in eine „demnächst"-Darstellung um — eine halb irreversible Änderung ohne belegten Wert.

### 9.5 Fotos / Logo / Titelbild — nichts geändert

| Element | Stand |
| --- | --- |
| Titelbild | vorhanden |
| Logo | vorhanden |
| Unternehmensfotos | 5 |

Es wurden **keine Bilder generiert** und keine hochgeladen. Zusätzliche echte
VIDEKO-Aufnahmen (Studio im Bau, Team, fertige Projekte) wären der wirksamste nächste
Hebel, müssen aber von Dennis kommen.

---

## 10. Google Search Console

### 10.1 Property

| | |
| --- | --- |
| Property vorhanden | **ja** |
| Typ | **Domain-Property** (`sc-domain:videko-kuechen.de`) |
| Eigentumsstatus | **bestätigter Inhaber** — keine DNS-Aktion nötig |
| Zum Konto hinzugefügt | 14.08.2026 |
| robots.txt | alle Dateien gültig |
| Crawling-Anfragen (90 Tage) | 239 |
| Klicks aus der Websuche | 37 |

Eine Neuanlage und damit ein TXT-Record waren **nicht** erforderlich.

### 10.2 Sitemap

| | |
| --- | --- |
| Eingereichte Sitemap | `https://videko-kuechen.de/sitemap.xml` |
| Erstmals eingereicht | 15.08.2026 |
| Zuletzt gelesen | 22.08.2026 |
| Status | Erfolgreich |
| Erkannte Seiten | 85 |
| URLs in der Live-Sitemap | 64 |

Da das letzte Lesen (22.08.) **vor** dem SEO-Deploy von heute liegt, wurde die Sitemap
erneut eingereicht → „Sitemap wurde eingereicht".

### 10.3 Indexierungsstatus der zehn Haupt-URLs (Stand vor der Beantragung)

| URL | Status | Detail | Letztes Crawling |
| --- | --- | --- | --- |
| `/` | auf Google | Seite ist indexiert | 15.08.2026, 10:32 |
| `/studio` | auf Google | Seite ist indexiert | 15.08.2026, 09:49 |
| `/leistungen` | auf Google | Seite ist indexiert | 15.08.2026, 09:46 |
| `/planung` | **nicht auf Google** | Gefunden – zurzeit nicht indexiert | – |
| `/beratung` | **nicht auf Google** | URL ist Google nicht bekannt | – |
| `/kuechen-nach-mass` | **nicht auf Google** | URL ist Google nicht bekannt | – |
| `/arbeitsplatten` | **nicht auf Google** | Gefunden – zurzeit nicht indexiert | – |
| `/kuechenmontage-wuerzburg` | **nicht auf Google** | Gefunden – zurzeit nicht indexiert | – |
| `/alles-aus-einer-hand` | **nicht auf Google** | Gefunden – zurzeit nicht indexiert | – |
| `/journal` | **nicht auf Google** | Gefunden – zurzeit nicht indexiert | – |

**7 von 10 Hauptseiten sind nicht im Index.** Die drei indexierten wurden zuletzt am
15.08.2026 gecrawlt — also vor allen Änderungen aus SEO-Phase 2 und 3.

### 10.4 Beantragte Indexierungen

Bestätigt („URL wurde einer bevorzugten Crawling-Warteschlange hinzugefügt"):

`/planung` · `/beratung` · `/kuechen-nach-mass` · `/arbeitsplatten` ·
`/kuechenmontage-wuerzburg` · `/alles-aus-einer-hand` · `/journal` · `/studio` · `/leistungen`

= **9 von 10.**

`/` (Startseite) lief wiederholt in „Hoppla. Ein Fehler ist aufgetreten". Die Startseite ist
bereits indexiert; der Antrag war ausschließlich wegen des alten Crawl-Datums gedacht und
bringt laut Googles eigenem Hinweis ohnehin keine Priorität. Die neu eingereichte Sitemap
deckt sie ab. **Kein Blocker.**

---

## 11. Verbleibende echte Blocker

| # | Punkt | Warum blockiert |
| --- | --- | --- |
| 1 | Öffnungszeiten | Kein belastbarer Sollwert ermittelbar. Nur Dennis kann die verbindlichen Zeiten bzw. „Vorübergehend geschlossen" festlegen. |
| 2 | Eröffnungsdatum | „Winter 2026" ist kein Datum. Braucht eine Entscheidung. |
| 3 | Echte Fotos | Dürfen nicht generiert werden. Neues Bildmaterial muss aus dem Unternehmen kommen. |
| 4 | Indexierung der 7 Seiten | Liegt jetzt bei Google. Ergebnis in 1–14 Tagen erneut prüfen. |
| 5 | Fremdportale aus Teil A, Abschnitt 3.2 | Erfordern Accounts/Identitätsprüfung — bewusst nicht angelegt. |

**Nicht blockiert und erledigt:** Kategorien, Leistungen, Beschreibung (bestätigt),
NAP-Felder (bestätigt), Search-Console-Property, Sitemap, Indexierungsanträge.
