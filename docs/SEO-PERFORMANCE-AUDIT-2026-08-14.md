# SEO- & Performance-Audit · videko-kuechen.de

**Datum:** 2026-08-14 · **Branch:** `merch-shop` · **Basis-Commit:** `a52e408`
**Status:** reines Audit — es wurde **keine Zeile Produktionscode geändert**.

**Messgrundlage**

| Was | Wie erhoben |
|---|---|
| HTTP-Status / Redirects / Header | `fetch(redirect:'manual')` gegen `https://videko-kuechen.de` am 14.08.2026 |
| Lighthouse | Lighthouse 13.4.1, Chrome headless, `--throttling-method=simulate`, gegen Produktion, 14.08.2026 |
| Bundle-/Asset-Größen | `npm run build` (Vite 8 / rolldown), Auswertung von `dist/` |
| Bildabmessungen & Kompressionspotenzial | `sharp` (Projekt-Dependency), reale Re-Encodes |
| Code-Befunde | Statische Analyse des Repos |

> Alle Zahlen in diesem Dokument sind gemessen, nicht geschätzt. Wo etwas nicht
> messbar war, steht das ausdrücklich dabei.

---

## 0. Die eine Sache, die alles erklärt

Die Website ist eine **Client-Side-Rendered Vite-SPA** (`index.html` + ein JS-Bundle,
`vercel.json` rewritet alles auf `/index.html`). Es gibt **kein SSR, kein
Prerendering, keine statische Generierung**.

Belegt: jede geprüfte URL liefert **exakt dasselbe 3047-Byte-HTML**:

```
https://videko-kuechen.de/leistungen                    -> 200  len=3047
https://videko-kuechen.de/journal/licht-in-der-kueche   -> 200  len=3047
https://videko-kuechen.de/diese-seite-gibt-es-nicht-xyz -> 200  len=3047
```

Daraus folgen direkt fünf der sechs P0-Befunde. Das ist der Hebel, an dem
zuerst gedreht werden muss.

---

## 1. Indexierung & technisches SEO

### 1.1 Was in Ordnung ist

| Prüfpunkt | Ergebnis | Beleg |
|---|---|---|
| `robots.txt` | ✅ korrekt, 200, Sitemap referenziert | `public/robots.txt`, live geprüft |
| `sitemap.xml` | ✅ erreichbar, 200, 7093 Bytes, valides `urlset` | live geprüft |
| http → https | ✅ 308 → `https://videko-kuechen.de/` | gemessen |
| www → non-www | ✅ 308 → `https://videko-kuechen.de/` | gemessen |
| `noindex` versehentlich | ✅ keins auf öffentlichen Seiten | `index.html` setzt `robots: index, follow` |
| `noindex` gewollt | ✅ `/vormerkung-bestaetigen` mit `noindex` | `src/pages/VormerkungBestaetigen.jsx:35` |
| HSTS | ✅ `max-age=63072000` | Response-Header |
| Sprache | ✅ `<html lang="de">` | `index.html:2` |

Kleinigkeit: `http://www.` macht zwei Hops (`308 → https://www. → 308 → https://`).
Kosmetisch, kein Ranking-Problem.

### 1.2 Was nicht in Ordnung ist

**a) Soft-404 auf allen unbekannten URLs**

```jsx
// src/App.jsx:72
<Route path="*" element={<Home />} />
```

Jede beliebige Falsch-URL rendert die **Startseite** unter HTTP **200**.
Gemessen: `/diese-seite-gibt-es-nicht-xyz` → 200, identisches HTML.
Google indexiert damit potenziell unbegrenzt viele URLs mit Startseiteninhalt.

**b) Trailing Slash nicht kanonisiert**

`/leistungen` und `/leistungen/` liefern beide 200, ohne Redirect und **ohne
Canonical** (siehe 1.2c). Zwei URLs, ein Inhalt.

**c) Canonical existiert auf 95 % der Seiten überhaupt nicht**

`index.html` enthält **kein** `<link rel="canonical">`. Gesetzt wird es nur
clientseitig durch `src/components/Seo.jsx` — und die Komponente wird von genau
**drei** Seiten benutzt:

```
src/pages/Merch.jsx:187
src/pages/ProductDetail.jsx:409, 730
src/pages/VormerkungBestaetigen.jsx:35
```

Live verifiziert an `/journal/licht-in-der-kueche`: **`canonical: FEHLT`**.

**d) Tote URLs in der Sitemap**

Abgleich `public/sitemap.xml` ↔ `src/data/products.json` (55 Produkte):

| Sitemap-URL | Problem |
|---|---|
| `/merch/t-shirt-small-logo-black` | kein Produkt mit diesem Slug |
| `/merch/t-shirt-small-logo-white` | kein Produkt mit diesem Slug |
| `/merch/sneaker-videko` | kein Produkt mit diesem Slug |

`ProductDetail.jsx:64` macht bei unbekanntem Slug `<Navigate to="/merch" replace />` —
also erneut 200 mit fremdem Inhalt. Umgekehrt fehlen **12** existierende
Produkt-Slugs in der Sitemap (u. a. `signature-vneck-black`, `pure-tee-beige`,
`signature-hoodie-white`).

**e) Fehlende Seiten in der Sitemap**

`/agb`, `/versand-lieferung`, `/rueckgabe-widerruf` sind Routen, stehen aber
nicht in der Sitemap.

### 1.3 Öffentlich indexierbare Seitentypen

| # | Typ | Route(n) | Anzahl | In Sitemap |
|---|---|---|---|---|
| 1 | Startseite | `/` | 1 | ✅ |
| 2 | Marken-/Studioseiten | `/studio`, `/ueber-uns`, `/team`, `/karriere` | 4 | ✅ |
| 3 | Leistungsseite | `/leistungen` | 1 | ✅ |
| 4 | Inspiration/Tools | `/inspiration`, `/stylefinder`, `/planung`, `/showroom` | 4 | ✅ |
| 5 | Referenzen | `/vorher-nachher` | 1 | ✅ |
| 6 | Conversion | `/beratung` | 1 | ✅ |
| 7 | 3D-Erlebnis | `/experience` | 1 | ✅ |
| 8 | Journal-Übersicht | `/journal` | 1 | ✅ |
| 9 | Journal-Artikel | `/journal/:slug` | 9 | ✅ (9/9) |
| 10 | Shop-Übersicht | `/merch` | 1 | ✅ |
| 11 | Produktseiten | `/merch/:slug` | 55 | ⚠️ 43/55 + 3 tote |
| 12 | Rechtstexte | `/impressum`, `/datenschutz`, `/agb`, `/versand-lieferung`, `/rueckgabe-widerruf` | 5 | ⚠️ 2/5 |
| 13 | Utility (noindex) | `/vormerkung-bestaetigen` | 1 | ✅ nicht drin |
| 14 | Client-Redirects | `/materialien`, `/kontakt`, `/ueber-videko`, `/kuechenwelten` | 4 | ✅ nicht drin |

Zu 14: das sind **JS-Redirects** (`<Navigate replace>`), keine HTTP-301. Für
Google verwertbar, aber schwächer als ein echter 301.

---

## 2. Metadata

### 2.1 Der Kernbefund

**21 von 24 Routen haben keinerlei eigene Metadaten.** Sie erben unverändert
den Head aus `index.html`.

Live verifiziert an `/journal/licht-in-der-kueche`:

```html
<title>VIDEKO Küchen | Küchenstudio Würzburg</title>
<meta property="og:url"   content="https://videko-kuechen.de/" />
<meta property="og:title" content="VIDEKO Küchen | Küchenstudio Würzburg" />
canonical: FEHLT
```

Der Artikel hat also den Titel der Startseite, die OG-URL der Startseite und
keinen Canonical.

### 2.2 Metadata-Matrix

| Seite | `<title>` | Description | Canonical | OG | Twitter | H1 |
|---|---|---|---|---|---|---|
| `/` | ⚠️ generisch (aus index.html) | ⚠️ generisch | ❌ | ⚠️ generisch | ⚠️ generisch | ❌ **2 H1** |
| `/ueber-uns` | ❌ Startseiten-Titel | ❌ | ❌ | ❌ falsche URL | ❌ | ✅ 1 |
| `/vorher-nachher` | ❌ Startseiten-Titel | ❌ | ❌ | ❌ falsche URL | ❌ | ✅ 1 |
| `/beratung` | ❌ Startseiten-Titel | ❌ | ❌ | ❌ falsche URL | ❌ | ✅ 1 |
| `/leistungen` | ❌ Startseiten-Titel | ❌ | ❌ | ❌ falsche URL | ❌ | ✅ 1 |
| `/studio` | ❌ Startseiten-Titel | ❌ | ❌ | ❌ falsche URL | ❌ | ✅ 1 |
| `/inspiration` | ❌ Startseiten-Titel | ❌ | ❌ | ❌ falsche URL | ❌ | ✅ 1 |
| `/karriere` | ❌ Startseiten-Titel | ❌ | ❌ | ❌ falsche URL | ❌ | ✅ 1 |
| `/journal` | ❌ Startseiten-Titel | ❌ | ❌ | ❌ falsche URL | ❌ | ✅ 1 |
| `/journal/:slug` (9×) | ❌ Startseiten-Titel | ❌ | ❌ | ❌ falsche URL + falsches Bild | ❌ | ✅ 1 |
| `/stylefinder`, `/planung`, `/team` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 1 (PageHero) |
| `/showroom` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ **keine H1** |
| `/experience` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ **keine H1** |
| Rechtstexte (5×) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 1 |
| `/merch` | ✅ eigen | ✅ eigen | ✅ | ⚠️ ohne Bild | ❌ | ✅ 1 |
| `/merch/:slug` | ✅ eigen | ✅ eigen | ✅ | ⚠️ ohne Bild | ❌ | ✅ 1 |
| `/vormerkung-bestaetigen` | ✅ + noindex | ✅ | ✅ | – | – | ✅ 1 |

### 2.3 Detailbefunde

**Zwei H1 auf der Startseite.** `Home.jsx` rendert `<Hero />` (H1 in
`Hero.jsx:113`) **und** `<HeroExperience />` (H1 in `HeroExperience.jsx:86`).

**Keine H1 auf `/showroom` und `/experience`.** Beide Seiten stehen in der
Sitemap. `Showroom.jsx` beginnt mit `ShowroomJourneySection` (nur H2/H3),
`Experience.jsx` ebenso.

**Journal: fertige Metadaten liegen ungenutzt im Repo.** `src/data/journal.js`
pflegt für **alle 9 Artikel** bereits `metaTitle` und `metaDescription` —
z. B. Zeile 28/29:

```js
metaTitle: 'Licht in der Küche richtig planen | VIDEKO Küchen',
metaDescription: 'Gute Küchenbeleuchtung ist mehr als eine Lampe an der Decke. …',
```

`src/pages/JournalArticle.jsx` liest diese Felder **nirgends**. Die Arbeit ist
bereits getan, sie kommt nur nicht in den `<head>`.

**Kein `datePublished` / `dateModified`** in `journal.js` — für ein
`Article`-Schema fehlt das Feld komplett. Muss inhaltlich ergänzt werden, kann
nicht erfunden werden.

**Twitter-Metadaten werden nie aktualisiert.** `Seo.jsx` setzt `og:*`, aber
kein `twitter:*`. Alle Seiten teilen den Twitter-Head der Startseite.

**Keine OG-Bilder pro Seite.** `Merch.jsx` übergibt kein `image`; `og:image`
bleibt überall `/og-image.jpg` (1200×630, 51 KB — Format korrekt).

**Social-Crawler sehen nur die Startseite.** Facebook, WhatsApp, LinkedIn und
X führen kein JavaScript aus. Da `Seo.jsx` rein clientseitig arbeitet, zeigt
**jeder geteilte Link** — auch der eines Journalartikels — Titel, Text und Bild
der Startseite. Das ist unabhängig von Googles Rendering-Fähigkeit ein harter
Ausfall.

---

## 3. Local SEO & Structured Data

### 3.1 Vorhanden

Genau **ein** JSON-LD-Block, statisch in `index.html:33-55`:

```json
{
  "@type": ["HomeAndConstructionBusiness", "FurnitureStore"],
  "name": "VIDEKO Küchen",
  "legalName": "Süddeutsche Sachwert eG",
  "url": "https://videko-kuechen.de",
  "image": "https://videko-kuechen.de/og-image.jpg",
  "logo": "https://videko-kuechen.de/favicon-512.png",
  "telephone": "+49 160 5545818",
  "email": "info@videko-kuechen.de",
  "address": { "streetAddress": "Hertzstraße 4", "postalCode": "97076",
               "addressLocality": "Würzburg", "addressRegion": "Bayern",
               "addressCountry": "DE" },
  "areaServed": "Würzburg",
  "description": "Premium-Küchenstudio in Würzburg: …"
}
```

Dazu clientseitig `Product`-JSON-LD auf Produktseiten
(`src/components/seo-jsonld.js`) — sauber gebaut, inkl. bewusst weggelassenem
`Offer` ohne öffentlichen Preis.

### 3.2 Fehlend

| Schema-Typ | Status | Auswirkung |
|---|---|---|
| `Organization` | ❌ | Kein Entity-Anker für die Marke |
| `LocalBusiness` (expliziter Typ) | ⚠️ nur via `HomeAndConstructionBusiness` | Grundsätzlich gültig, aber ohne `@id` nicht verknüpfbar |
| `WebSite` | ❌ | Kein Sitename, keine Sitelinks-Searchbox |
| `WebPage` | ❌ | Keine Seitenidentität |
| `BreadcrumbList` | ❌ | Keine Breadcrumbs in den SERPs |
| `Article` | ❌ | 9 Artikel ohne Autor, Datum, Bild-Auszeichnung |
| `FAQPage` | ❌ | `journal.js` enthält gepflegte FAQs (ab Zeile 206), ungenutzt |

### 3.3 `sameAs` / Social-Profile — **komplett fehlend**

Projektweite Suche nach `instagram|facebook|tiktok|linkedin|youtube|pinterest`
ergibt genau **einen** echten Profil-Link:

```
src/pages/Merch.jsx:491   href="https://instagram.com/videko.kuechen"
```

Konsequenzen:
- **Kein `sameAs`** im JSON-LD → Google verknüpft kein einziges Social-Profil mit der Entität VIDEKO.
- **Keine Social-Icons im Footer** (`Footer.jsx` hat Navigation, Service, Kontakt, Rechtliches — keine Profile).
- Der einzige Instagram-Link steckt in einem Fließtext auf der Shop-Seite.
- Facebook, TikTok & Co. sind im gesamten Projekt **nirgends hinterlegt** — die URLs sind schlicht nicht bekannt.

⚠️ **Blocker für Prompt 2:** Ohne bestätigte Profil-URLs von Dennis kann `sameAs`
nicht befüllt werden. Erfinden ist ausgeschlossen.

### 3.4 Weitere Local-SEO-Lücken

| Feld | Status |
|---|---|
| `openingHours` / `openingHoursSpecification` | ❌ — Öffnungszeiten existieren nirgends im Projekt |
| `geo` (Koordinaten) | ❌ |
| `priceRange` | ❌ |
| `hasMap` | ❌ (Footer verlinkt Google Maps als reinen `<a>`) |
| `@id` zur Entitätsverknüpfung | ❌ |
| Karte auf `/showroom` | ❌ Platzhalter: `<span>Karte / Map-Platzhalter</span>` (`Showroom.jsx:47`) |

### 3.5 ⚠️ Sachlicher Konflikt: LocalBusiness vs. Studio-Status

Das JSON-LD markiert Hertzstraße 4, 97076 Würzburg als Geschäftsadresse eines
Küchenstudios. Die Website selbst sagt an drei Stellen etwas anderes:

```
src/pages/Home.jsx:155        „das Studio in Würzburg befindet sich noch im Aufbau"
src/pages/Studio.jsx:89       Kicker: „Studio im Aufbau"
src/components/ShowroomJourneySection.jsx:163  „kein reales Studio … noch im Aufbau"
```

Das ist kein Codefehler, aber eine Entscheidung, die Dennis treffen muss:
Ein `LocalBusiness` mit physischer Adresse impliziert einen besuchbaren
Standort. Solange das Studio im Aufbau ist, ist die Frage, ob die Adresse
ausgezeichnet bleiben soll (mit Öffnungszeiten „nach Vereinbarung") oder ob
zunächst `Organization` + `areaServed` die ehrlichere Auszeichnung ist.
**Relevant auch für das Google Business Profile** — dort kann eine als offen
gemeldete, aber nicht besuchbare Adresse zur Sperrung führen.

---

## 4. Firmendaten-Konsistenz

Positiv vorweg: `src/data/company.js` ist eine saubere, dokumentierte Single
Source of Truth mit zentralem Schalter `ACTIVE_OPERATOR`. Impressum,
Datenschutz, Footer, GPSR-Angaben und E-Mail-Absender ziehen alle daraus.
**Inhaltlich gibt es keinen Widerspruch.** Der einzige Bruch ist technischer Natur:

| Fundstelle | Aktueller Wert | Problem | Empfohlener Wert |
|---|---|---|---|
| `index.html:38` | `"legalName": "Süddeutsche Sachwert eG"` (hartcodiert) | Umgeht `company.js`; bei Eintragung der VIDEKO Küchen eG bleibt der Wert stehen, während alles andere umschaltet | Aus `ACTIVE_OPERATOR.legalName` erzeugen (Build-Time-Injection oder JSON-LD clientseitig) |
| `index.html:42` | `"telephone": "+49 160 5545818"` | dito hartcodiert | aus `BRAND.phoneHref` |
| `index.html:44-51` | Adresse hartcodiert | dito | aus `BRAND.studio` |
| `index.html:36` | `"@type": [HomeAndConstructionBusiness, FurnitureStore]` | Adresse = Studio Würzburg, `legalName` = Betreiberin mit Sitz Tutzing. Formal zulässig, aber ohne `Organization`-Gegenstück verwirrend | `Organization` (Betreiberin, Tutzing) + `LocalBusiness` (Studio, Würzburg), über `@id` verknüpft |
| `index.html` | kein `sameAs` | Social-Profile nicht zugeordnet | `sameAs` nach Freigabe der URLs |
| `Footer.jsx:146` | `© 2026 Süddeutsche Sachwert eG · VIDEKO Küchen` | ✅ korrekt, zieht aus `company.js` | unverändert |
| `Impressum.jsx` | vollständig aus `company.js` | ✅ korrekt | unverändert |
| `api/lead.js:120,132` · `api/order.js:211,223` | „ein Geschäftsbereich der Süddeutsche Sachwert eG" (Literal) | Kosmetisch: hartcodiert statt aus `company.js`; Grammatik („der Süddeutsche…") | aus `OPERATOR_NOTICE` |
| `docs/compliance/*.md` | teils „VIDEKO Küchen eG" als Hersteller | Nur Doku, nicht ausgeliefert — aber inkonsistent zum Live-Stand | bei Gelegenheit angleichen |

**Kein Blocker.** Der Rechtsträger ist eindeutig: `ACTIVE_OPERATOR = SD_SACHWERT`.

---

## 5. Interne Verlinkung

### 5.1 Gemessene Link-Verteilung

Alle internen Ziele (`to="/x"` und `to: '/x'`), Vorkommen im Quellcode:

```
39 /beratung        15 /stylefinder    12 /inspiration    11 /merch
 7 /ueber-uns        7 /studio          6 /journal         5 /vorher-nachher
 4 /leistungen       4 /impressum       4 /datenschutz     2 /karriere
 2 /showroom         2 /planung
```

Ohne Header und Footer — also aus echtem Seiteninhalt heraus:

```
29 /beratung   12 /stylefinder   9 /merch   7 /inspiration   4 /ueber-uns
 3 /vorher-nachher   3 /studio   3 /journal
 0 /leistungen   0 /karriere
```

### 5.2 Befunde

**`/leistungen` bekommt null Content-Links.** Die Seite, die „Küchenplanung,
Montage, Koordination" abbildet und damit das kommerziell wichtigste
Suchvolumen bedient, wird ausschließlich über die Hauptnavigation und drei
Footer-Einträge erreicht. Die Startseite verlinkt sie **kein einziges Mal**.

Belegt: `Home.jsx` und alle direkt eingebundenen Komponenten verlinken auf
`/journal`, `/studio`, `/vorher-nachher`, `/beratung`, `/inspiration`,
`/stylefinder` — **nicht** auf `/leistungen`.

**Der Footer verwässert `/leistungen`.** Drei verschiedene Anker zeigen auf
dieselbe URL (`Footer.jsx:36-38`):

```js
{ label: 'Planung',  to: '/leistungen' },
{ label: 'Montage',  to: '/leistungen' },
{ label: 'Garantie', to: '/leistungen' },
```

Drei Themen, eine Seite, kein eigener Inhalt dahinter.

**Falsche Ankertexte auf der Startseite.** Die vier Journal-Kacheln
(`Home.jsx:95-100`) tragen Titel, die es so nicht gibt:

| Ankertext auf `/` | Tatsächlicher Artikel |
|---|---|
| „Die 7 Küchentrends, die bleiben" | „7 Küchenfehler, die du später jeden Tag bereust" |
| „Naturstein in der Küche – zeitlos schön" | „Welche Arbeitsplatte passt zu mir?" |
| „Urban Luxury in Würzburg" | „Fronten, Farben, Materialien" |
| „Beleuchtung in der Küche: So geht Atmosphäre" | „Licht in der Küche: Warum gutes Licht mehr kann …" |

Drei von vier Ankertexten beschreiben einen anderen Inhalt als das Ziel. Das
ist zugleich ein Vertrauensproblem für echte Nutzer.

**Journalartikel verlinken keine Leistungsseiten.** `JournalArticle.jsx`
schließt mit CTAs auf `/beratung` und `/stylefinder` sowie drei „Weiterlesen"-
Artikeln. Der Arbeitsplatten-Artikel verlinkt nicht auf Materialien, der
Licht-Artikel nicht auf Lichtplanung. Themen-Autorität verpufft.

**`/karriere` erhält 0 Content-Links** (nur Header + Footer).

**Hierarchie für Google schwer erkennbar:** keine Breadcrumbs (außer optisch im
Shop, ohne `BreadcrumbList`-Markup), kein Canonical, keine Metadaten. Google
hat außer der Sitemap und `<a>`-Tags nichts, woraus sich eine Struktur ableiten ließe.

---

## 6. Content-Gap: „Küche und Raum aus einer Hand"

### 6.1 Ist-Zustand

Es gibt **keine** Seite zu diesem Angebot. Der Claim existiert nur als Chip,
Bullet oder Kachel:

| Leistung | Wo erwähnt | Tiefe |
|---|---|---|
| Küchenplanung | `/leistungen` Baustein 01/02 | ✅ ausführlich |
| Elektroarbeiten | `HeroExperience.jsx:28` („Elektroplanung") | ⚠️ ein Chip |
| Boden | — | ❌ nirgends |
| Wände / Trockenbau | `journal.js:210` (Nebensatz in einer FAQ-Antwort) | ❌ faktisch nicht vorhanden |
| Spanndecken | — | ❌ **nirgends im gesamten Projekt** |
| Beleuchtung | `/leistungen` Baustein 04, Journal-Artikel „Licht in der Küche" | ✅ vorhanden |
| Arbeitsplatten | Journal-Artikel „Welche Arbeitsplatte passt zu mir" | ✅ vorhanden |
| Montage | `/leistungen` Baustein 05 | ✅ vorhanden |
| Gewerke-Koordination | `/leistungen` Baustein 07, `UeberUns.jsx:37`, `ProcessSection.jsx:18` | ⚠️ als Prozessschritt, nicht als Angebot |

Der Satz „Alles aus einer Hand" kommt viermal vor — als Überschriftenzusatz
(`Leistungen.jsx:132`), als Kachel (`UeberUns.jsx:37`) und zweimal als Chip in
einer Bullet-Liste (`Studio.jsx:26`, `KuechengefuehlSection.jsx:12`). **Nirgends
mit erklärendem Inhalt.**

### 6.2 Bewertung

Wer in Würzburg „Küche und Renovierung aus einer Hand", „Küche inkl. Boden und
Elektro" oder „Spanndecke Küche" sucht, findet auf videko-kuechen.de nichts,
was diese Frage beantwortet. Das ist zugleich das Differenzierungsmerkmal
gegenüber klassischen Küchenstudios — und es ist unsichtbar.

**Empfehlung: eigene Landingpage. Bestätigter Gap.**

### 6.3 Empfohlene Struktur (noch kein Text, nur Gerüst)

**URL:** `/alles-aus-einer-hand`
*(Alternativen wie `/kueche-und-raum` oder `/komplettumbau` sind schwächer:
Ersteres ist unverständlich, Letzteres verengt auf den Extremfall.)*

| Abschnitt | Inhalt | H-Ebene |
|---|---|---|
| Hero | Ein Ansprechpartner für Küche **und** Raum | H1 |
| Problem | Was passiert, wenn fünf Gewerke sich selbst koordinieren | H2 |
| Leistungsraster | 9 Karten: Planung · Elektro · Boden · Wände/Trockenbau · Spanndecken · Beleuchtung · Arbeitsplatten · Montage · Koordination | H2 + 9× H3 |
| Ablauf | Aufmaß → Gewerkeplan → Terminkette → Umsetzung → Übergabe | H2 |
| Abgrenzung | Was VIDEKO selbst macht vs. was Partner übernehmen — **Inhalt muss von Dennis kommen** | H2 |
| Referenz | Anriss + Link auf `/vorher-nachher` | H2 |
| FAQ | 4–6 Fragen, `FAQPage`-Schema | H2 |
| CTA | `/beratung` | H2 |

**Interne Verlinkung der neuen Seite**

Eingehend:
- Startseite: neue kompakte Sektion „Nicht nur Küche. Der ganze Raum." (siehe Prompt 2 §6)
- `/leistungen`: aus Baustein 07 „Koordination & Gewerke"
- `/ueber-uns`: aus der Kachel „Alles aus einer Hand" (`UeberUns.jsx:37`)
- `/vorher-nachher`: aus der Kachel „Komplettumbau"
- Footer `SERVICE`: „Montage" → hierher statt dreifach auf `/leistungen`
- Journal: „Licht in der Küche" (→ Beleuchtung), „Welche Arbeitsplatte passt zu mir" (→ Arbeitsplatten)
- Header: als Unterpunkt eines Dropdowns „Leistungen"

Ausgehend: `/leistungen`, `/beratung`, `/vorher-nachher`, 2–3 thematisch
passende Journalartikel.

Plus: Sitemap-Eintrag, `priority` 0.8.

---

## 7. Performance — reale Messwerte

**Lighthouse 13.4.1 · Chrome headless · simulierte Drosselung · Ziel: Produktion · 14.08.2026**

| Route | Gerät | Perf | LCP | FCP | CLS | TBT | Speed Index | TTFB | Bytes | Requests |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | **53** | **8,0 s** | 7,8 s | 0,125 | 90 ms | 7,8 s | 10 ms | **33,45 MB** | 43 |
| `/` | desktop | **62** | 4,0 s | 3,3 s | 0,004 | 20 ms | 3,3 s | 10 ms | **31,07 MB** | 46 |
| `/inspiration` | mobile | **53** | 8,9 s | 7,7 s | 0,019 | 210 ms | 10,1 s | 130 ms | **25,39 MB** | 34 |
| `/inspiration` | desktop | **57** | 5,4 s | 5,2 s | 0,001 | 10 ms | 5,2 s | 10 ms | **22,60 MB** | 35 |
| `/journal/licht-in-der-kueche` | mobile | **58** | **18,8 s** | 5,9 s | 0,022 | 60 ms | 7,2 s | 20 ms | **10,68 MB** | 18 |
| `/journal/licht-in-der-kueche` | desktop | **56** | 6,2 s | 4,2 s | 0,021 | 0 ms | 5,9 s | 30 ms | **10,70 MB** | 19 |

**Anmerkungen zur Messung**

- **INP ist im Labor nicht messbar.** Lighthouse liefert stattdessen TBT — das
  ist hier ausgewiesen. TBT ist unauffällig (0–210 ms): das Problem ist
  **nicht** JavaScript, sondern Netzwerklast.
- **Felddaten (CrUX) konnten nicht abgerufen werden** — dafür wäre ein
  PageSpeed-Insights-API-Key oder Search Console nötig. Alle Werte sind
  Labordaten.
- **TTFB ist exzellent** (10–130 ms, Vercel `X-Vercel-Cache: HIT`). Am Hosting
  liegt nichts.
- SEO-Score 92 auf `/` und `/inspiration`: Auslöser ist ausschließlich das
  Audit `robots-txt` mit der Begründung *„Fetch of robots.txt failed: Timed out
  fetching resource"*. Separat geprüft liefert `robots.txt` sauber 200 —
  **Messartefakt, kein realer Fehler.**
- Werte schwanken zwischen Läufen. Für den Vorher/Nachher-Vergleich in Prompt 2
  müssen dieselben Routen unter denselben Bedingungen erneut gemessen werden.

### 7.1 LCP im Detail

**Journalartikel mobile — 18,8 s.** Lighthouse `lcp-discovery-insight`:

```
LCP-Element: <img class="pagehero__img" src="/assets/03_wohnliche_kueche-B1MSj7TJ.png">
  fetchpriority=high should be applied ............ ✗
  Request is discoverable in initial document ..... ✗
  LCP resource should not use loading=lazy ........ ✓
```

Das LCP-Bild ist ein **2.084 KB großes PNG**, das erst existiert, nachdem React
gebootet und gerendert hat. Preload-Scanner: chancenlos.
Geschätztes Einsparpotenzial laut `image-delivery-insight`: **10.650 ms LCP**.

**Startseite mobile — 8,0 s.** LCP-Element ist hier Text
(`h1.hero__title > span.hero__line-in`), Breakdown: TTFB 82 ms, *Element render
delay 946 ms*. Der Text wird also durch die parallel laufenden Bild-Downloads
und den React-Boot ausgebremst.

**CLS 0,125 auf der Startseite mobile** — grenzwertig (Ziel < 0,1). Auf Desktop
nur 0,004. Ursache liegt in der mobilen Hero-Sequenz (Bildwechsel via
`matchMedia` nach Mount); für eine belastbare Zuordnung wäre ein Trace-Lauf nötig.

---

## 8. Bilder — der dominante Befund

### 8.1 Gesamtbild

**Build-Output (`dist/`, gemessen nach `npm run build`):**

```
TOTAL: 668,7 MB / 473 Dateien
  .png    236 Dateien   443,9 MB     ← davon 226 Dateien über 1 MB (443,4 MB)
  .webp   179 Dateien   102,0 MB
  .mp4      5 Dateien    94,1 MB
  .jpg     35 Dateien    26,3 MB
  .js       2 Dateien     1,8 MB
  .css      1 Datei      0,39 MB
  .avif     0 Dateien
```

**Quellbilder (ohne `unbenutzt/`, `_deprecated/`): 507 Dateien, 686 MB.**

### 8.2 Die entscheidende Erkenntnis

**Die Bilder sind nicht zu groß in den Abmessungen — sie sind falsch codiert.**

Breitenverteilung aller PNG/JPG (385 Dateien):

```
<1000px: 18   1000–1499px: 231   1500–1999px: 125   2000–2999px: 10   ≥3000px: 1
```

Das sind **angemessene Abmessungen**. Das Problem ist, dass fotorealistische
Motive als verlustfreie PNGs ausgeliefert werden.

**Realer Re-Encode-Test** (sharp, identische Pixelmaße, WebP q80 / AVIF q55):

| Datei | Pixel | PNG heute | WebP q80 | AVIF q55 | Ersparnis |
|---|---|---|---|---|---|
| `inspiration/03_wohnliche_kueche.png` (LCP Artikel) | 1672×941 | 2.035 KB | **119 KB** | 72 KB | −94,2 % |
| `kitchen-vision-1.png` (Footer, **jede Seite**) | 1672×941 | 2.081 KB | **105 KB** | 64 KB | −94,9 % |
| `inspiration/09_premium_architektur_kueche.png` | 1672×941 | 1.948 KB | **106 KB** | 69 KB | −94,6 % |
| `inspiration/06_materialien_und_details.png` | 1672×941 | 1.980 KB | **94 KB** | 57 KB | −95,2 % |
| `inspiration/10_favoriten_wohnkueche_luxus.png` | 1672×941 | 1.985 KB | **111 KB** | 69 KB | −94,4 % |
| `shared/hero-videko-final-16x9.png` (Hero-Poster) | 1672×941 | 2.210 KB | **137 KB** | 89 KB | −93,8 % |
| `home/Mobile.png` (Hero mobil) | 941×1672 | 2.237 KB | **147 KB** | 101 KB | −93,4 % |
| `inspiration/materials-lab/m09.png` (größte Datei) | 1122×1402 | 3.208 KB | **121 KB** | 72 KB | −96,2 % |
| **Summe Stichprobe** | | **17,3 MB** | **0,9 MB** | | **−94,7 %** |

Bei gleicher Auflösung. Ohne sichtbaren Qualitätsverlust bei Fotomotiven.
Hochgerechnet auf die Startseite mobile: **33,45 MB → ca. 2 MB**.

### 8.3 Detailtabelle der real geladenen Top-Offender

| Datei | Größe live | Pixel | Verwendung | Problem | Maßnahme |
|---|---|---|---|---|---|
| `03_wohnliche_kueche.png` | 2.084 KB | 1672×941 | **LCP-Bild** Journalartikel (`JournalArticle.jsx:20`) | PNG, kein `fetchPriority`, nicht im HTML auffindbar, kein `srcset` | WebP/AVIF + `fetchPriority="high"` + `srcset` |
| `kitchen-vision-1.png` | 2.131 KB | 1672×941 | Footer-Hintergrund **auf jeder Seite** (`Footer.jsx:106`) | PNG, `loading` nicht gesetzt → eager, obwohl immer unterhalb des Viewports | WebP + `loading="lazy"` + `decoding="async"` |
| `10_favoriten_wohnkueche_luxus.png` | 2.032 KB | 1672×941 | „Weiterlesen"-Karten | PNG in ~360 px breiter Karte | WebP + `srcset`/`sizes` (Karte braucht ~400 px) |
| `07_kueche_mit_insel.png` | 2.032 KB | 1672×941 | „Weiterlesen"-Karten | dito | dito |
| `06_materialien_und_details.png` | 2.027 KB | 1672×941 | Journal + Startseite | dito | dito |
| `s4.png` | 2.224 KB | 1448×1086 | `ProcessSection` Startseite | PNG | WebP + lazy |
| `09_premium_architektur_kueche.png` | 1.995 KB | 1672×941 | Startseiten-Galerie, als **CSS-`background-image`** (`Home.jsx:149`) | Kein `loading`, kein `srcset` möglich, kein `<picture>` | WebP + `image-set()` oder Umbau auf `<img>` |
| `scene.png` | 1.830 KB | – | Küchenfehler-Spiel (`Home.jsx:18`) | PNG, wird geladen obwohl Spiel nicht gestartet | WebP + lazy laden |
| `result.png` | 1.756 KB | – | Stylefinder-Ergebnis, CSS-Background | PNG | WebP |
| `logo-main-v2.png` | 157 KB | – | Header **und** Footer, **jede Seite** | PNG für ein Logo | WebP oder SVG (~5 KB) |
| `Header.mp4` | 33.336 KB | – | Hero-Video Desktop | 33 MB Video | Transcode; `preload="metadata"` ist bereits gesetzt (✅) |
| `verwandle-raum.mp4` | 22.047 KB | – | Startseite, `autoPlay loop` | 22 MB | Transcode + `IntersectionObserver` |

### 8.4 Weitere Bildbefunde

- **`srcset` / `sizes` / `<picture>`: 0 Vorkommen im gesamten Projekt.** Verifiziert per Grep.
- **`fetchPriority`: 3 Vorkommen** — `HomePathSection.jsx:98`, `ProductGallery.jsx:84`, `Merch.jsx:195`. Keines davon auf einem LCP-Bild einer Nicht-Shop-Seite.
- **43 Bilder werden als CSS-`background-image`** über inline `style` eingebunden. Diese können weder `loading`, `srcset` noch `fetchPriority` nutzen und sind für den Preload-Scanner unsichtbar.
- **Falsche Dateiendungen:** `kuechenwelten/stilfinderresult-modern-warm.jpg`, `stilfinderresult-natuerlich-luxurioes.jpg`, `stilfindercard-natuerlich-luxurioes.jpg` und `experience/stylefinder/exp-style-*.jpg` sind laut sharp **PNG-Dateien mit `.jpg`-Endung** (je ~2,4 MB).
- **`unsized-images`-Audit: bestanden** — `width`/`height` bzw. CSS-Aspect-Ratios sind gesetzt. Gut.
- **`cache-insight`: bestanden** — Vercel liefert gehashte Assets korrekt mit langer TTL.
- **`alt`-Attribute: bestanden**, dekorative Bilder korrekt mit `alt=""` + `aria-hidden`.
- ~~**Der Shop macht es bereits richtig:** 179 WebP-Dateien in `dist/`, ~7 MB gesamt.~~
  **Korrektur (14.08.2026, bei der Umsetzung festgestellt):** Diese Aussage war
  falsch und widersprach der eigenen Messung in Abschnitt 8.1 — dort stehen für
  dieselben 179 WebP-Dateien **102,0 MB**, nicht ~7 MB. Der Shop nutzte zwar das
  richtige *Format*, aber mit derselben zu hohen Qualitätsstufe wie der Rest:
  60 dieser Dateien mussten bei der Umsetzung nachverdichtet werden
  (95,3 MB → 1,9 MB). Das Format war übertragbar, die Kompressionseinstellung
  nicht.

---

## 9. JavaScript / CSS / Fonts

### 9.1 Gemessene Bundle-Größen

```
dist/assets/index-DVDTmYEI.js              975,6 kB │ gzip: 266,1 kB
dist/assets/ExperienceCanvas-Bhv7dlnM.js   890,8 kB │ gzip: 236,8 kB   (lazy)
dist/assets/index-BWzkiBjt.css             410,9 kB │ gzip:  68,5 kB
```

### 9.2 Bewertung

| Punkt | Befund | Bewertung |
|---|---|---|
| **Kein Route-Splitting** | `App.jsx` importiert alle 23 Seiten statisch. Ein Startseitenbesucher lädt `ProductDetail.jsx` (42 KB), `Merch.jsx` (27 KB), `Karriere.jsx` (25 KB), `StylefinderFlow.jsx` (36 KB) mit. | ⚠️ Real, aber **266 KB gzip sind nicht das Problem** — TBT liegt bei 20–90 ms. Nachrangig gegenüber 33 MB Bildern. |
| **three.js lazy** | `Experience.jsx:15` lädt `ExperienceCanvas` per `lazy()`. Eigener Chunk, wird nur auf `/experience` geladen. | ✅ Korrekt gelöst |
| **Ungenutztes JS** | Lighthouse: 116 KB Einsparpotenzial | ⚠️ gering |
| **Ungenutztes CSS** | Lighthouse: 69 KB Einsparpotenzial (von 410 KB) | ⚠️ gering |
| **Render-blocking CSS** | `index-*.css`, 78 KB übertragen, **450 ms FCP/LCP-Verlust** | ⚠️ Realer Effekt, messbar |
| **`styles.css`** | eine Datei, 536 KB Quelltext | ⚠️ Wartbarkeit, kein Laufzeitproblem |
| **Third-Party-Scripts** | **0** (Lighthouse: `Third-party: 0 req / 0 KB`) | ✅ Vorbildlich — kein GA, kein Tag Manager, keine Fremd-Fonts |
| **Fonts** | 9× woff2 selbst gehostet, latin-Subset, je 22–24 KB, `font-display: swap`, `unicode-range` gesetzt | ✅ Sauber. `font-display-insight` bestanden. |
| **`legacy-javascript-insight`** | bestanden | ✅ |
| **Ungenutzte Dependencies** | `gsap` und `@gsap/react` sind in `package.json`, werden aber **nirgends importiert** | ℹ️ Kein Laufzeitkosten (tree-shaken), nur Dependency-Ballast |
| **Hydration** | Nicht anwendbar — reines CSR, kein SSR | – |
| **Animationen** | Lenis (Smooth Scroll) + framer-motion. TBT unauffällig. | ✅ Kein belegter Handlungsbedarf |
| **Caching** | Vercel, `X-Vercel-Cache: HIT`, `cache-insight` bestanden | ✅ |

**Fazit Abschnitt 9:** Hier gibt es **keinen einzigen P0**. Die einzige mit
echter Nutzerwirkung belegte Maßnahme ist das Render-Blocking der CSS
(450 ms). Alles andere wäre Optimierung um der Metrik willen.

---

## 10. Abschlussbericht

### P0 — kritisch

---

**P0-1 · Kein Route-Metadata: 21 von 24 Seiten tragen Titel und OG-Daten der Startseite**

- **Beweis:** Live-Abruf `/journal/licht-in-der-kueche` → `<title>VIDEKO Küchen | Küchenstudio Würzburg</title>`, `og:url = https://videko-kuechen.de/`, `canonical: FEHLT`. `Seo.jsx` wird nur in 3 Dateien importiert.
- **Datei/Route:** `index.html`, `src/components/Seo.jsx`, alle Seiten außer `/merch*`
- **Auswirkung:** Google kann Seiten nicht unterscheiden; kein Snippet-Titel pro Seite; jeder geteilte Link zeigt auf Social-Plattformen die Startseite (die führen kein JS aus).
- **Lösung:** `<Seo>` auf allen Seiten; für Journalartikel die **bereits vorhandenen** `metaTitle`/`metaDescription` aus `journal.js` nutzen; `Seo.jsx` um `twitter:*` und `og:image` erweitern. Mittelfristig Prerendering (`vite-plugin-prerender` o. ä.), damit auch Social-Crawler korrekte Daten sehen.
- **Risiko:** gering
- **Aufwand:** mittel (klein pro Seite, 21 Seiten)

---

**P0-2 · Kein Canonical + Trailing-Slash-Duplikate**

- **Beweis:** `index.html` enthält kein `<link rel="canonical">`. `/leistungen` und `/leistungen/` liefern beide 200 ohne Redirect und ohne Canonical.
- **Datei/Route:** `index.html`, `vercel.json`
- **Auswirkung:** Duplicate Content, unklare Kanonisierung, verstreute Ranking-Signale.
- **Lösung:** Selbstreferenzierender Canonical im statischen `<head>` als Fallback + pro Route via `Seo.jsx`; in `vercel.json` `trailingSlash: false`.
- **Risiko:** gering
- **Aufwand:** klein

---

**P0-3 · Soft-404: jede unbekannte URL liefert 200 mit Startseiteninhalt**

- **Beweis:** `/diese-seite-gibt-es-nicht-xyz` → HTTP 200, identisches HTML. Ursache: `App.jsx:72` `<Route path="*" element={<Home />} />`.
- **Datei/Route:** `src/App.jsx:72`
- **Auswirkung:** Google kann beliebig viele Müll-URLs mit Startseiteninhalt indexieren; Crawl-Budget-Verschwendung; Soft-404-Meldungen in der Search Console.
- **Lösung:** Echte 404-Seite mit `noindex`-Meta statt Startseite. Ein echter HTTP-404 ist bei einer SPA auf Vercel ohne Routing-Umbau nicht erreichbar — `noindex` + eigene Seite ist die praktikable Lösung.
- **Risiko:** gering
- **Aufwand:** klein

---

**P0-4 · 33,45 MB Seitengewicht mobil / LCP 18,8 s auf Journalartikeln**

- **Beweis:** Lighthouse-Tabelle Abschnitt 7. `image-delivery-insight` weist für den Journalartikel **10.650 ms LCP-Einsparpotenzial** aus. 226 PNGs in `dist/` über 1 MB, zusammen 443 MB.
- **Datei/Route:** projektweit, insbesondere `src/assets/images/**/*.png`
- **Auswirkung:** Direkter Ranking-Faktor (Core Web Vitals). Auf Mobilfunk praktisch unbenutzbar. Ein Nutzer auf 4G lädt für eine Startseite ~33 MB.
- **Lösung:** Alle fotorealistischen PNGs nach WebP (q80) konvertieren — **gemessen 94,7 % kleiner bei identischen Pixelmaßen**. Bestehendes Vite-Asset-System weiter nutzen. Zusätzlich: LCP-Bild mit `fetchPriority="high"` + `<link rel="preload">`, Footer-Hintergrund `loading="lazy"`, `srcset`/`sizes` für Kartenbilder.
- **Risiko:** gering (Pixelmaße bleiben, WebP wird von allen relevanten Browsern unterstützt)
- **Aufwand:** mittel (Konvertierungsskript + Import-Pfade)

---

**P0-5 · `sameAs` fehlt vollständig — kein Social-Profil ist VIDEKO zugeordnet**

- **Beweis:** Projektweite Suche findet genau einen Profil-Link (`Merch.jsx:491`, Instagram) im Fließtext. Kein `sameAs` im JSON-LD, keine Social-Links im Footer.
- **Datei/Route:** `index.html:33-55`, `src/components/Footer.jsx`
- **Auswirkung:** Google verknüpft die Social-Präsenz nicht mit der Entität VIDEKO. Knowledge-Panel und Markenverständnis leiden.
- **Lösung:** `sameAs`-Array im JSON-LD + Social-Icons im Footer.
- **⚠️ BLOCKER:** Nur die Instagram-URL ist bestätigt. **Dennis muss die offiziellen URLs für Facebook, TikTok und ggf. LinkedIn/YouTube/Pinterest liefern.** Erfinden ist ausgeschlossen.
- **Risiko:** gering
- **Aufwand:** klein (nach Datenlieferung)

---

**P0-6 · Structured Data unvollständig: kein `Organization`, `WebSite`, `BreadcrumbList`, `Article`**

- **Beweis:** `index.html` enthält genau einen JSON-LD-Block. Keine weiteren Typen im Projekt außer `Product` im Shop.
- **Datei/Route:** `index.html:33-55`
- **Auswirkung:** Google fehlt der Entity-Anker; keine Breadcrumbs in den SERPs; 9 Journalartikel ohne Artikel-Auszeichnung.
- **Lösung:** `Organization` + `LocalBusiness` mit `@id`-Verknüpfung, `WebSite`, `BreadcrumbList` pro Seite, `Article` pro Journalartikel, `FAQPage` für die vorhandenen FAQs.
- **⚠️ Teil-Blocker:** `Article` braucht `datePublished`. `journal.js` hat **kein Datumsfeld**. Muss inhaltlich ergänzt werden.
- **Risiko:** gering
- **Aufwand:** mittel

---

### P1 — hoher Hebel

---

**P1-1 · `/leistungen` erhält null Content-Links**

- **Beweis:** Link-Inventar Abschnitt 5.1 — 0 Vorkommen außerhalb von Header/Footer. `Home.jsx` verlinkt sie nie.
- **Auswirkung:** Die kommerziell wichtigste Unterseite bekommt kaum internes Gewicht.
- **Lösung:** Verlinkung aus Startseite, Journalartikeln und `/ueber-uns`.
- **Risiko:** keins · **Aufwand:** klein

---

**P1-2 · Landingpage „Alles aus einer Hand" fehlt komplett**

- **Beweis:** Abschnitt 6.1. „Spanndecken" kommt im gesamten Projekt **nicht vor**, „Boden" nirgends als Leistung, „Trockenbau" nur in einem FAQ-Nebensatz.
- **Auswirkung:** Das Differenzierungsmerkmal ist unsichtbar; kein Ranking für Komplettumbau-Suchanfragen.
- **Lösung:** `/alles-aus-einer-hand` gemäß Struktur in 6.3.
- **⚠️ Inhaltlicher Klärungsbedarf:** Welche Gewerke führt VIDEKO selbst aus, welche über Partner? Ohne diese Auskunft entstünde eine Behauptung ins Blaue (§ 5 UWG).
- **Risiko:** mittel (inhaltliche Korrektheit) · **Aufwand:** groß

---

**P1-3 · Falsche Ankertexte auf der Startseite**

- **Beweis:** Tabelle in 5.2 — 3 von 4 Journal-Kacheln (`Home.jsx:95-100`) tragen Titel, die es nicht gibt.
- **Auswirkung:** Irreführende Ankertexte, Vertrauensverlust, falsche Relevanzsignale.
- **Lösung:** Titel und Teaser aus `journal.js` ziehen statt hartcodieren.
- **Risiko:** keins · **Aufwand:** klein

---

**P1-4 · Journalartikel ohne eigene Metadaten, obwohl gepflegt**

- **Beweis:** `journal.js` hat `metaTitle`/`metaDescription` für alle 9 Artikel; `JournalArticle.jsx` liest sie nicht.
- **Auswirkung:** 9 Artikel mit identischem Startseitentitel.
- **Lösung:** `<Seo>` in `JournalArticle.jsx` einsetzen. Teilmenge von P0-1, aber der Aufwand ist minimal und die Wirkung sofort.
- **Risiko:** keins · **Aufwand:** klein

---

**P1-5 · Sitemap fehlerhaft**

- **Beweis:** 3 tote Merch-URLs, 12 fehlende Produkt-Slugs, 3 fehlende Rechtstexte. Abgleich gegen `products.json` in 1.2d.
- **Auswirkung:** Crawl-Budget auf 404-Ersatzseiten; existierende Seiten werden nicht angemeldet.
- **Lösung:** Sitemap zur Build-Zeit aus `App.jsx`-Routen + `journal.js` + `products.json` generieren statt manuell pflegen.
- **Risiko:** gering · **Aufwand:** mittel

---

**P1-6 · Zwei H1 auf der Startseite, keine H1 auf `/showroom` und `/experience`**

- **Beweis:** `Hero.jsx:113` + `HeroExperience.jsx:86` beide auf `/`. `Showroom.jsx` und `Experience.jsx` enthalten kein `<h1>`.
- **Auswirkung:** Unklares Hauptthema; fehlende Dokumentüberschrift.
- **Lösung:** `HeroExperience`-H1 → H2. H1 in `ShowroomJourneySection` und `Experience` ergänzen.
- **Risiko:** gering (CSS-Klassen bleiben) · **Aufwand:** klein

---

**P1-7 · Render-blocking CSS kostet 450 ms**

- **Beweis:** Lighthouse `render-blocking-insight`: `index-*.css`, 78 KB, `wastedMs: 450` — auf allen drei gemessenen Routen.
- **Lösung:** Critical CSS inlinen oder `styles.css` aufteilen.
- **Risiko:** mittel (536 KB monolithisches CSS aufzutrennen ist fehleranfällig) · **Aufwand:** mittel

---

**P1-8 · Öffnungszeiten & Geodaten fehlen im LocalBusiness**

- **Beweis:** keine Öffnungszeiten irgendwo im Projekt; kein `geo`, `priceRange`, `hasMap`, `@id`.
- **⚠️ Blocker:** Öffnungszeiten müssen von Dennis kommen — und zuvor die Entscheidung, wie mit dem Studio-Status („noch im Aufbau", Abschnitt 3.5) umgegangen wird.
- **Risiko:** mittel (falsche Öffnungszeiten sind schlimmer als keine) · **Aufwand:** klein

---

### P2 — Optimierung

| # | Punkt | Beweis | Lösung | Aufwand |
|---|---|---|---|---|
| P2-1 | Kein Route-basiertes Code-Splitting | `App.jsx` importiert 23 Seiten statisch; `index.js` 266 KB gzip | `React.lazy()` pro Route | klein |
| P2-2 | 3 Footer-Anker („Planung", „Montage", „Garantie") zeigen alle auf `/leistungen` | `Footer.jsx:36-38` | „Montage" → `/alles-aus-einer-hand`; „Garantie" → eigener Anker | klein |
| P2-3 | Videos: 33 MB + 22 MB + 22 MB MP4 | `dist/`-Auswertung | Transcode auf ~2–4 MB, AV1/H.265-Variante | mittel |
| P2-4 | 4 Dateien mit `.jpg`-Endung sind PNGs | sharp-Metadaten | umbenennen + konvertieren | klein |
| P2-5 | `gsap` + `@gsap/react` ungenutzt | 0 Importe im Quellcode | aus `package.json` entfernen | klein |
| P2-6 | 43 Bilder als inline CSS-`background-image` | Grep | für Above-the-fold-Motive auf `<img>` umstellen | mittel |
| P2-7 | Client-Redirects statt HTTP-301 | `App.jsx:67-70` | in `vercel.json` als 301 | klein |
| P2-8 | Logo als 157 KB PNG auf jeder Seite | Lighthouse | SVG (~5 KB) | klein |
| P2-9 | `http://www.` macht 2 Hops | gemessen | Vercel-Redirect-Regel | klein |
| P2-10 | Karten-Platzhalter auf `/showroom` | `Showroom.jsx:47` | echte Karte (datenschutzkonform) | mittel |
| P2-11 | Ungenutztes CSS/JS (69 KB / 116 KB) | Lighthouse | nach P1-7 neu bewerten | – |
| P2-12 | ESLint: 113 Probleme (112 Fehler) | `npm run lint` | **Vorbestand.** Als Baseline festhalten, damit spätere Arbeit nicht fälschlich beschuldigt wird | groß |

---

## UMSETZUNGSPLAN

### Vorab zu klären (blockiert Teile von Prompt 2)

| # | Frage an Dennis | Blockiert |
|---|---|---|
| B1 | Offizielle URLs von Facebook, TikTok, ggf. LinkedIn/YouTube/Pinterest | P0-5 (`sameAs`) |
| B2 | Veröffentlichungsdatum je Journalartikel | P0-6 (`Article`) |
| B3 | Öffnungszeiten — und: soll das Studio Würzburg trotz „im Aufbau" als `LocalBusiness` mit Adresse ausgezeichnet werden? | P1-8, Google Business Profile |
| B4 | Welche Gewerke führt VIDEKO selbst aus, welche über Partner? | P1-2 (Landingpage-Inhalt) |

Alles andere lässt sich ohne Rückfrage umsetzen.

---

### Stufe 1 — Indexierungsfundament *(klein, sofort, keine Blocker)*

1. Canonical-Fallback in `index.html` + `trailingSlash: false` in `vercel.json` → **P0-2**
2. Echte 404-Seite mit `noindex` statt `<Route path="*" element={<Home />} />` → **P0-3**
3. `Seo.jsx` erweitern: `twitter:*`, `og:image`, `og:site_name`, robusteres Cleanup
4. `<Seo>` in `JournalArticle.jsx` (Daten liegen bereit) → **P1-4**
5. H1-Korrekturen: `HeroExperience` → H2, H1 für `/showroom` und `/experience` → **P1-6**

*Ergebnis: Google kann Seiten unterscheiden und indexiert keinen Müll mehr.*

---

### Stufe 2 — Bilder *(der eigentliche Performance-Hebel)*

6. Konvertierungsskript (`scripts/`, sharp ist bereits Dependency): alle fotorealistischen PNGs → WebP q80, identische Pixelmaße, Original als Fallback behalten
7. LCP-Bilder: `fetchPriority="high"` + `<link rel="preload">` für Hero und Artikel-Hero
8. Footer-Hintergrund `loading="lazy"` + `decoding="async"` (spart 2,1 MB **auf jeder Seite**)
9. `srcset`/`sizes` für Karten- und Rasterbilder
10. Logo → SVG

*Ergebnis: erwartete Reduktion von 33,45 MB auf ~2 MB mobil. Erst danach messen — vorher ist jede weitere Optimierung Rauschen.*

**→ Zwischenmessung: dieselben 6 Läufe wie in Abschnitt 7.**

---

### Stufe 3 — Metadata & Structured Data

11. `<Seo>` auf allen verbleibenden Seiten, individuelle Title/Description → **P0-1**
12. `Organization` + `LocalBusiness` mit `@id`, aus `company.js` gespeist statt hartcodiert → **P0-6**, Abschnitt 4
13. `WebSite`-Schema
14. `BreadcrumbList` pro Unterseite
15. `Article` je Journalartikel *(braucht B2)*
16. `sameAs` + Social-Icons im Footer *(braucht B1)* → **P0-5**
17. `FAQPage` für die vorhandenen FAQs

---

### Stufe 4 — Content & interne Verlinkung

18. Landingpage `/alles-aus-einer-hand` *(braucht B4)* → **P1-2**
19. Startseiten-Sektion „Nicht nur Küche. Der ganze Raum." → verlinkt 18
20. Ankertexte der Journal-Kacheln aus `journal.js` ziehen → **P1-3**
21. Interne Links auf `/leistungen` aus Startseite und Artikeln → **P1-1**
22. Journalartikel → thematisch passende Leistungsseiten verlinken
23. Sitemap-Generator zur Build-Zeit → **P1-5**

---

### Stufe 5 — Feinschliff *(optional, nach Nachmessung entscheiden)*

24. Critical CSS / Render-Blocking → **P1-7**
25. Route-basiertes Code-Splitting → P2-1
26. Video-Transcoding → P2-3
27. `gsap` entfernen, `.jpg`-Fehlbenennungen bereinigen → P2-4, P2-5

---

### Reihenfolge-Begründung

Stufe 1 vor Stufe 2, weil eine schnelle Seite nichts nützt, die Google als
Duplikat der Startseite einsortiert. Stufe 2 vor Stufe 3, weil 33 MB jede
weitere Messung unlesbar machen. Stufe 4 zuletzt, weil neue Inhalte auf einem
Fundament stehen sollen, das Google versteht.

---

## Nicht prüfbar mit den vorliegenden Mitteln

Ehrlichkeitshalber ausdrücklich benannt:

- **Google Search Console** — kein Zugang aus dieser Umgebung. Ob Google die SPA tatsächlich rendert, wie viele Seiten indexiert sind, ob Soft-404 gemeldet werden: **nicht geprüft, nicht behauptet.**
- **Felddaten (CrUX / PageSpeed Insights API)** — kein API-Key. Alle CWV-Werte sind Labordaten.
- **Google Business Profile** — außerhalb des Codes.
- **Tatsächliche Social-Profile** — nur Instagram ist im Code belegt.
- **Rendering durch Social-Crawler** — aus dem Code ableitbar (rein clientseitiges `Seo.jsx`), nicht praktisch getestet.

---

*Audit erstellt am 14.08.2026. Keine Produktionsdateien geändert.*
