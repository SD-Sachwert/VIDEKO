# VIDEKO SEO & Performance 1.0 — Umsetzungsbericht

**Datum:** 14.08.2026
**Grundlage:** `docs/SEO-PERFORMANCE-AUDIT-2026-08-14.md` (verbindlich, nicht neu auditiert)
**Ausgangsstand:** `a52e408` — *Marketing-Claims entschärfen (§5 UWG) + Shop-KI-Kennzeichnung präzisieren*
**Branch:** `merch-shop`

---

## 1. Geänderte Dateien

Im Commit: **847 neue, 126 geänderte, 3 gelöschte** Dateien. Der ganz
überwiegende Teil davon sind Bilddateien unter `src/assets/` (WebP-Konvertate
und Responsive-Varianten). Ohne Assets bleiben **83 Einträge**.

Nicht mitcommittet: neun Bilddateien, die schon vor Beginn dieser Arbeit
unversioniert im Arbeitsverzeichnis lagen (Roh-Generate wie
`image-gen-7(38).png`, ein Ordner „Neuer Ordner", die Prestige-Polo-Rohbilder).
Die gehören nicht zu dieser Umsetzung und bleiben unangetastet.

### Neu

| Datei | Zweck |
|---|---|
| `src/data/site.js` | Zentrale Site-Konfiguration + schema.org-Bausteine (Organization, LocalBusiness, WebSite, WebPage, BreadcrumbList, Article, FAQPage) |
| `src/data/routes-meta.js` | Metadaten je Route: Title, Description, Canonical, Breadcrumb, OG-Bild, Preload |
| `src/data/head.js` | Ableitung des fertigen Kopf-Objekts pro Route — von React *und* vom Prerender-Skript genutzt |
| `src/data/image-meta.js` | Zugriff auf Breite/Höhe/srcSet eines Bildes, auch außerhalb von `<img>` |
| `src/assets/images/variants.generated.js` | Generierte Variantenliste (Maße + srcSet), Erzeugnis von `optimize-images.mjs` |
| `src/components/Img.jsx` | `<img>` mit srcSet/sizes, width/height, lazy/eager, decoding, fetchPriority |
| `src/components/LazyVideo.jsx` | Video, das erst per IntersectionObserver lädt |
| `src/components/RouteSeo.jsx` | Setzt für Routen ohne eigene Seitenkomponente den Kopf aus `routes-meta.js` |
| `src/pages/AllesAusEinerHand.jsx` | Neue Landingpage (P10) |
| `src/pages/NotFound.jsx` | Eigene 404-Seite (P5) |
| `scripts/optimize-images.mjs` | Reproduzierbare PNG/JPG → WebP-Konvertierung + Varianten |
| `scripts/optimize-videos.mjs` | Reproduzierbare MP4-Neukodierung mit Manifest-Schutz |
| `scripts/rewrite-image-imports.mjs` | Einmaliges Umschreiben der Referenzen im Quellcode |
| `scripts/prerender.mjs` | Schreibt pro Route eine eigene `index.html` mit korrektem Kopf + `sitemap.xml` + `404.html` |
| `scripts/_prerender-data.js` | SSR-Brücke: liefert dem Node-Skript die gehashten Asset-URLs |
| `scripts/lib/` | Gemeinsame Helfer der Skripte |
| `scripts/serve-dist.mjs` | Statischer Server ohne SPA-Fallback — für die Prüfung ohne JavaScript |
| `docs/SEO-PERFORMANCE-AUDIT-2026-08-14.md` | Der Audit aus Prompt 1 (war noch nicht eingecheckt) |

### Geändert (Auswahl)

`index.html`, `vite.config.js`, `vercel.json`, `package.json`, `src/App.jsx`,
`src/components/Seo.jsx`, `src/components/Hero.jsx`, `src/components/HeroExperience.jsx`,
`src/components/Footer.jsx`, `src/components/Header.jsx`, `src/components/PageHero.jsx`,
`src/pages/Home.jsx`, `src/pages/Leistungen.jsx`, `src/pages/UeberUns.jsx`,
`src/pages/JournalArticle.jsx`, `src/pages/Journal.jsx`, `src/pages/Inspiration.jsx`,
`src/data/journal.js`, `src/data/merch.js`, `src/data/performance.js`, `src/styles.css`
— sowie 30 weitere Komponenten, deren Bildreferenzen auf `.webp` und auf `<Img>`
umgestellt wurden.

### Gelöscht

`public/sitemap.xml` — wird jetzt zur Build-Zeit erzeugt.

Die beiden ebenfalls als gelöscht gemeldeten Merch-Bilddateien
(`polos/pure/pure silber.webp`, `polos/signature/videko-polo-weiss-komplettes-logo.png`)
standen bereits vor Beginn dieser Arbeit so im Arbeitsverzeichnis und stammen
nicht aus dieser Umsetzung.

---

## 2. P0-Findings aus dem Audit: vorher → nachher

| # | Finding | vorher | nachher |
|---|---|---|---|
| P0-1 | Fotorealistische PNGs mit 2–3 MB im Bundle | 236 PNG / 443,9 MB + 35 JPG / 26,3 MB in `dist/` | **6 PNG / 0,2 MB, 1 JPG / 0,05 MB** — nur noch Logos, Favicons, `og-image.jpg` |
| P0-2 | Kein Route-Metadata — 21 Routen erbten den Startseiten-Kopf | 1 Titel für die ganze Site | **86 Routen mit eigenem Title, Description, Canonical, OG, Twitter, JSON-LD** |
| P0-3 | Kein Prerendering, leeres `<div id="root">` für Crawler | Social-Crawler und JS-lose Abrufe sahen nur den Startseiten-Kopf | **Kopf pro Route statisch im HTML** (Body weiterhin React — siehe Abschnitt 5, Einschränkung) |
| P0-4 | `<Route path="*" element={<Home />} />` — jede Falsch-URL lieferte HTTP 200 mit Startseite | 200 + Startseite | **echter HTTP 404 + eigene 404-Seite mit `noindex, follow`** |
| P0-5 | Header-Video 31,8 MB | 5 MP4 / 94,1 MB | **5 MP4 / 22,9 MB** (−75,7 %), Header 31,8 → 4,2 MB |

---

## 3. P1-Findings: vorher → nachher

| # | Finding | vorher | nachher |
|---|---|---|---|
| P1-1 | LCP-Bild lazy geladen | `loading="lazy"` auf dem Hero | `priority` → `loading="eager"`, `fetchpriority="high"`, `decoding="sync"`, Preload im Kopf |
| P1-2 | Keine `width`/`height` → Layoutsprünge | fehlten flächendeckend | aus `variants.generated.js` automatisch gesetzt |
| P1-3 | Keine Responsive Images | ein Bild für alle Breiten | 521 Varianten (480w/960w) für Karten und Galerien, srcSet + sizes |
| P1-4 | Below-the-fold-Bilder eager | u. a. `kitchen-vision-1` im Footer | `loading="lazy"` + `decoding="async"` als Standard in `<Img>` |
| P1-5 | Falsch benannte `.jpg`-Dateien (waren PNG) | 35 Dateien | vollständig ersetzt, keine `.png`/`.jpg`-Referenz mehr in `src/` (außer Logos/Favicons) |
| P1-6 | Videos starten sofort | alle `<video>` mit `preload` | `LazyVideo` mit IntersectionObserver (300 px Vorlauf); **Hero-Video bewusst nicht verzögert** |
| P1-7 | Kein Canonical / kein `trailingSlash` | fehlte | `trailingSlash: false` + Canonicals auf `https://videko-kuechen.de` |
| P1-8 | Keine Sitemap-Pflege | statische `public/sitemap.xml` | Build-Zeit-Generierung, **85 URLs** |
| P1-9 | Zwei H1 auf der Startseite | Hero + HeroExperience | HeroExperience → H2; `/showroom` und `/experience` haben jetzt eine H1 |
| P1-10 | JSON-LD hartcodiert in `index.html`, dupliert Firmendaten | Doppelpflege | zentral in `site.js`, gespeist aus `company.js` |
| P1-11 | Startseiten-Journalkacheln mit hartcodierten Fantasietiteln | Freitext im JSX | Titel und Teaser direkt aus `journal.js` |
| P1-12 | `/leistungen` nirgends verlinkt | Waise | verlinkt aus Startseite, Über uns und den Journalartikeln |

---

## 4. Neue Landingpage `/alles-aus-einer-hand`

Aufbau exakt nach Vorgabe:

1. **Hero** — H1: *„Nicht nur Küche. Der ganze Raum."*
2. **Problem** — was schiefgeht, wenn jedes Gewerk einzeln beauftragt wird
3. **Leistungsraster** — Küchenplanung, Elektroarbeiten/Elektroplanung, Boden,
   Wände/Trockenbau, Spanndecken, Beleuchtung, Arbeitsplatten, Montage,
   Koordination der Gewerke
4. **Ablauf** — von der Aufnahme bis zur Abnahme
5. **Vorteil zentraler Ansprechpartner**
6. **Verweis auf `/vorher-nachher`**
7. **FAQ** — sichtbar auf der Seite, deshalb mit `FAQPage`-Auszeichnung
8. **Beratungs-CTA**

**Sprachliche Sorgfalt:** Nirgends steht, dass VIDEKO die Gewerke mit eigenen
Mitarbeitern ausführt. Durchgängig formuliert als *„über VIDEKO koordiniert"*,
*„mit passenden Fachpartnern"*, *„aus einer Hand geplant und abgestimmt"*. Keine
Preisversprechen, keine Rabattsprache, keine Superlative.

**P11 — Startseite:** kompakte Sektion *„Nicht nur Küche. Der ganze Raum."* mit
den sieben Kacheln Küche, Elektro, Boden, Wand, Spanndecke, Licht, Montage und
CTA auf die Landingpage. Kein Redesign, bestehende Sektionsoptik übernommen.

---

## 5. SEO-Metadaten — Prüfung ohne JavaScript

Geprüft gegen den gebauten `dist/`-Stand über `scripts/serve-dist.mjs`
(kein SPA-Fallback, gzip an), mit `curl` ohne JavaScript-Ausführung.

| Route | HTTP | eigener Title | Description | Canonical | robots | og:type | eigenes og:image | Twitter | JSON-LD |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 200 | ✅ | ✅ | ✅ | index, follow | website | og-image.jpg | summary_large_image | Organization, WebSite, WebPage, HomeAndConstructionBusiness+FurnitureStore |
| `/leistungen` | 200 | ✅ | ✅ | ✅ | index, follow | website | `ls-hero.webp` | summary_large_image | Organization, WebSite, WebPage, BreadcrumbList |
| `/ueber-uns` | 200 | ✅ | ✅ | ✅ | index, follow | website | `ls-feature.webp` | summary_large_image | Organization, WebSite, WebPage, BreadcrumbList |
| `/vorher-nachher` | 200 | ✅ | ✅ | ✅ | index, follow | website | `02_hero_dark_kitchen_banner.webp` | summary_large_image | Organization, WebSite, WebPage, BreadcrumbList |
| `/alles-aus-einer-hand` | 200 | ✅ | ✅ | ✅ | index, follow | website | `09_premium_architektur_kueche.webp` | summary_large_image | Organization, WebSite, WebPage, BreadcrumbList |
| `/journal/licht-in-der-kueche` | 200 | ✅ | ✅ | ✅ | index, follow | **article** | `03_wohnliche_kueche.webp` | summary_large_image | Organization, WebSite, **Article**, BreadcrumbList |
| `/gibt-es-nicht` | **404** | „Seite nicht gefunden" | ✅ | — | **noindex, follow** | — | — | — | — |

Journalartikel verwenden die bereits in `journal.js` gepflegten
`metaTitle`/`metaDescription` — es wurde nichts neu erfunden. Als OG-Bild dient
jeweils das Artikelbild.

### Einschränkung, die im Bericht stehen muss

Prerendert wird nur der **`<head>`**. Der `<body>` wird weiterhin von React
erzeugt. Damit gilt:

- ✅ Title, Description, Canonical, OG, Twitter, JSON-LD stehen ohne JavaScript im HTML.
- ❌ **Die `<h1>` steht auf keiner Route im initialen HTML.** Für Google ist das
  unkritisch (rendert JS), für Social-Crawler und einfache Text-Fetcher aber ein
  Unterschied.

Das war die bewusst gewählte **kleinste robuste Lösung** (Vorgabe: *„Prüfe die
kleinste robuste Lösung"*, keine Next.js-Migration). Eine vollständige
Body-Vorrendierung ist die nächste Ausbaustufe — siehe Abschnitt 11.

Zweite kleine Abweichung: Auf `/alles-aus-einer-hand` liefert der React-Render
zusätzlich `FAQPage`-JSON-LD; im prerenderten Kopf steht es nicht, weil dafür der
FAQ-Text in `routes-meta.js` dupliziert werden müsste. Google sieht es nach dem
Rendern.

---

## 6. Structured Data

Zentral in `src/data/site.js`, Firmendaten ausschließlich aus `src/data/company.js`.
Das hartcodierte JSON-LD in `index.html` wurde entfernt.

| Typ | Wo | Anmerkung |
|---|---|---|
| `Organization` | alle Seiten | `legalName` = `ACTIVE_OPERATOR.legalName` (SD Sachwert). **Keine „VIDEKO Küchen eG" erfunden.** |
| `HomeAndConstructionBusiness` + `FurnitureStore` | `/` | **Bewusst ohne `openingHours`.** Statt dessen `availableService: „Küchenplanung nach Terminvereinbarung"` — das Studio ist im Aufbau, offene Ladenöffnung wäre eine falsche Zusage. |
| `WebSite` | alle Seiten | |
| `WebPage` | alle statischen Seiten | |
| `BreadcrumbList` | alle Unterseiten | aus `routes-meta.js` |
| `Article` | 9 Journalartikel | ohne `datePublished` — siehe Blocker B2 |
| `Product` | Shop | unverändert erhalten |
| `FAQPage` | `/alles-aus-einer-hand` | nur weil die Fragen sichtbar auf der Seite stehen |

`sameAs` enthält **ausschließlich** `https://instagram.com/videko.kuechen`.
Facebook, TikTok, LinkedIn, YouTube sind auskommentiert mit dem Vermerk
*„offen – nicht raten"*. Im Footer steht nur der bestätigte Instagram-Link.

---

## 7. Bildoptimierung

### Durchgang 1 — PNG/JPG → WebP

| | |
|---|---|
| Konvertierte Dateien | **285** |
| vorher | **511,9 MB** |
| nachher | **28,3 MB** |
| Einsparung | **−94,5 %** |

Qualität ~q80, `effort 6`. **Nicht konvertiert:** Logos, Favicons,
Transparenz-Grafiken, UI-Assets, `public/og-image.jpg` (bleibt JPEG 1200×630,
52 kB — Social-Plattformen mögen WebP nicht durchgehend).

### Durchgang 2 — bereits vorhandene, zu groß gespeicherte WebP

Der Audit behauptete in Abschnitt 8.4, der Shop mache es „bereits richtig" mit
~7 MB. Das war falsch und widersprach der eigenen Messung in Abschnitt 8.1
(102,0 MB). Die Aussage ist im Auditdokument korrigiert worden.

| | |
|---|---|
| Nachverdichtete Dateien | **60** |
| vorher | **95,3 MB** |
| nachher | **1,9 MB** |
| Einsparung | **−98,0 %** |

### Responsive Varianten

521 zusätzliche Varianten (480w/960w) nur für Bilder ab
`VARIANT_MIN_BYTES = 60 kB` — kleine Bilder bekommen keine. Damit steigt die
Dateianzahl, die ausgelieferte Bytemenge sinkt trotzdem deutlich, weil pro
Viewport nur eine Variante geladen wird.

### `dist/` gesamt

| | alt (`a52e408`) | neu | Δ |
|---|---|---|---|
| Dateien | 473 | 1091 | +618 (Varianten + 86 Route-HTMLs) |
| **Gesamtgröße** | **668,7 MB** | **76,2 MB** | **−88,6 %** |
| PNG | 236 / 443,9 MB | 6 / 0,2 MB | −99,95 % |
| JPG | 35 / 26,3 MB | 1 / 0,05 MB | −99,8 % |
| WebP | 179 / 102,0 MB | 974 / 49,9 MB | −51,1 % bei 5,4× Dateianzahl |
| MP4 | 5 / 94,1 MB | 5 / 22,9 MB | −75,7 % |

### Videos

H.264, CRF 24, 30 fps, max. 1080p, ohne Tonspur, `+faststart`.

| Datei | vorher | nachher |
|---|---|---|
| `Header.mp4` | 31,79 MB | **4,16 MB** |
| `verwandle-raum.mp4` | 21,03 MB | **7,70 MB** |
| `vorher-nachher.mp4` | 21,99 MB | **4,65 MB** |
| `transforming-kitchen.mp4` | 12,67 MB | **4,57 MB** |
| `Umbau.mp4` | 6,65 MB | **1,80 MB** |
| **Summe** | **94,13 MB** | **22,88 MB** (−75,7 %) |

Das Hero-Video wurde bewusst nicht härter komprimiert und nicht lazy gestartet —
Vorgabe: *„Hero-Video nicht kaputtoptimieren."* Sichtprüfung: keine erkennbaren
Artefakte in Bewegung.

Beide Skripte sind idempotent: `optimize-videos.mjs` führt ein Manifest
(`scripts/.video-manifest.json`), damit ein zweiter Lauf nicht erneut kodiert
(Generationsverlust).

---

## 8. Lighthouse vorher / nachher

### Messbedingungen — bitte mitlesen

Der Audit hatte gegen **Production** gemessen; der neue Stand ist **nicht
deployt**. Ein direkter Vergleich Audit-Zahl ↔ neue Zahl wäre unsauber. Deshalb:

- Git-Worktree auf `a52e408` unter `C:/FINAL/videko-baseline` angelegt und
  gebaut → das ist der exakte Vor-Zustand.
- **Beide** Builds lokal unter identischen Bedingungen gemessen: gleicher
  Node-Static-Server, **gzip an** (Level 6, wie Vercel), gleiche Cache-Header,
  Lighthouse 13.4.1, `--throttling-method=simulate`, Desktop mit `--preset=desktop`.
- Der alte Build wird mit SPA-Catch-all serviert (so lief er auf Vercel), der
  neue dateisystem-first (so läuft er mit dem neuen `vercel.json`).
- Ohne gzip misst Lighthouse 414 kB CSS statt 69 kB und das Render-Blocking
  springt von ~750 ms auf ~4350 ms. Wer lokal ohne gzip misst, misst Unsinn.

### Ergebnis (12 Läufe)

| Route | Gerät | Perf | LCP | FCP | CLS | TBT | Speed Index | TTFB | Bytes | Requests | Render-Blocking |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile **vorher** | 68 | 11,0 s | 2,6 s | 0,000 * | 85 ms | 4,6 s | 1 ms | 74,25 MB | 43 | 753 ms |
| `/` | mobile **nachher** | **67** | **8,9 s** | 2,7 s | **0,000** | **65 ms** | 5,1 s | 1 ms | **3,07 MB** | 40 | 752 ms |
| `/` | desktop **vorher** | 74 | 23,7 s | 0,5 s | 0,000 * | 6 ms | 1,2 s | 1 ms | 112,90 MB | 50 | 161 ms |
| `/` | desktop **nachher** | **93** | **1,6 s** | 0,6 s | **0,000** | 24 ms | 1,4 s | 0 ms | **7,23 MB** | 41 | 162 ms |
| `/inspiration` | mobile **vorher** | 70 | 11,0 s | 2,4 s | 0,000 * | 102 ms | 4,1 s | 1 ms | 52,13 MB | 37 | 753 ms |
| `/inspiration` | mobile **nachher** | **68** | **8,6 s** | 2,7 s | **0,000** | **69 ms** | 4,7 s | 2 ms | **2,33 MB** | 31 | 753 ms |
| `/inspiration` | desktop **vorher** | 75 | 17,4 s | 0,5 s | 0,000 * | 6 ms | 1,0 s | 1 ms | 53,09 MB | 38 | 162 ms |
| `/inspiration` | desktop **nachher** | **94** | **1,5 s** | 0,6 s | **0,000** | **1 ms** | 1,2 s | 0 ms | **2,48 MB** | 32 | 162 ms |
| `/journal/licht-in-der-kueche` | mobile **vorher** | 71 | 36,8 s | 2,4 s | 0,025 | 54 ms | 3,3 s | 1 ms | 10,66 MB | 18 | 752 ms |
| `/journal/licht-in-der-kueche` | mobile **nachher** | **75** | **5,5 s** | 2,7 s | 0,025 | **10 ms** | **2,7 s** | 2 ms | **0,84 MB** | 19 | 752 ms |
| `/journal/licht-in-der-kueche` | desktop **vorher** | 76 | 5,9 s | 0,5 s | 0,022 | 0 ms | 0,9 s | 0 ms | 10,68 MB | 19 | 162 ms |
| `/journal/licht-in-der-kueche` | desktop **nachher** | **98** | **1,0 s** | 0,6 s | 0,026 | 0 ms | **0,7 s** | 1 ms | **0,88 MB** | 19 | 162 ms |

TTFB ist lokal überall 0–2 ms und deshalb ohne Aussagekraft; auf Vercel gilt die
Audit-Messung weiter.

### Ehrliche Einordnung — was diese Zahlen NICHT sagen

**\* Die CLS-Werte 0,000 in den „vorher"-Läufen sind ein Messartefakt.** Bei einer
74-MB-Seite war das 2,4-MB-Hero-PNG innerhalb des Trace-Fensters nie fertig
geladen — kein Bild, kein Versatz, kein Dekodieraufwand. Deshalb sehen auch TBT
und Speed Index im alten Stand streckenweise *besser* aus als sie sind. Die
Production-Messung im Audit weist für `/` mobile **CLS 0,125** aus. Genau diesen
Wert habe ich im alten Code reproduziert, sobald das Hero-Bild tatsächlich malt.

**Der Performance-Score mobil auf `/` und `/inspiration` bewegt sich kaum** (68→67,
70→68), obwohl die Seite von 74 MB auf 3 MB fällt. Grund: Der mobile Score wird
jetzt von FCP (2,7 s) und Speed Index dominiert, und die stammen aus dem
render-blockierenden CSS plus dem JS-Bundle — beides war ausdrücklich nicht
Auftrag. Die *Nutzerwirkung* steckt in den Metriken darunter: LCP 11,0 → 8,9 s
und 74,25 → 3,07 MB.

**Desktop zeigt den Effekt unverstellt:** 74 → 93 und 75 → 94, LCP 23,7 → 1,6 s
und 17,4 → 1,5 s.

### CLS-Regression: gefunden und behoben

Zwischenstand der Messung war `/` mobile **CLS 0,128**. Ursache experimentell
eingegrenzt:

1. Lighthouse zeigte einen einzigen Shift am Hero-Bild — aber mit
   `old_rect == new_rect`, das Bild selbst war es also nicht.
2. `decoding="async"` entfernt → unverändert 0,128.
3. Hero auf das alte, einfache `<img>` zurückgesetzt → **0,125**, exakt der
   Audit-Wert. Die neue `Img`-Komponente war nicht die Ursache.
4. `font-display: swap` → `optional` in `src/fonts.css` → **CLS 0, kein Shift.**
   → **Ursache: der Webfont-Tausch.** Die 7 woff2-Dateien starteten erst ~171 ms
   nach dem CSS, also nach dem ersten Textbild.

**Gewählte Lösung:** `font-display: swap` bleibt (Markentypografie soll auch dann
erscheinen, wenn ein Preload mal zu spät kommt); statt dessen preloadet
`scripts/prerender.mjs` die vier Above-the-fold-Schnitte (Cormorant 600,
Inter 400/500/600) aus dem Vite-Manifest. **Null zusätzliche Bytes** — die
Dateien wurden ohnehin geladen, nur später.

Ergebnis: `/` mobile 62 → **67** und CLS 0,128 → **0,000**; Desktop CLS **0,000**.

---

## 9. Build- und Teststatus

| Prüfung | Ergebnis |
|---|---|
| Typecheck | **nicht vorhanden** — reines JS-Projekt ohne `tsconfig`, kein `typecheck`-Skript |
| Tests | **nicht vorhanden** — kein Test-Runner, kein `test`-Skript im Projekt |
| `npm run lint` | **113 Probleme (113 Fehler, 0 Warnungen)** — Baseline vor der Arbeit: 113 Probleme (112 Fehler + 1 Warnung). **Keine Regression.** Die Fehler sind Alt-Befunde (überwiegend `react-hooks/set-state-in-effect`) und lagen nicht im Auftrag. |
| `npm run build` | **grün** — Vite-Build + Prerender: 86 Routen (22 statisch · 9 Journal · 55 Shop) + `404.html`, `sitemap.xml` mit 85 URLs |
| `npm run check:products` | bricht mit „6 kaufbare Produkte nicht veröffentlichungsfähig" ab — **identisch im Baseline-Worktree**, also Alt-Zustand, keine Regression |
| HTTP-Prüfung ohne JS | 6/6 Pflichtrouten HTTP 200 mit eigenem Kopf, unbekannte URL HTTP 404 |

Drei Lint-Fehler waren zwischenzeitlich **von mir** eingeschleppt
(`react-refresh/only-export-components` in `Img.jsx` und `Seo.jsx`,
`react-hooks/set-state-in-effect` in `LazyVideo.jsx`) und wurden vor dem Commit
behoben: `imageMeta` in `src/data/image-meta.js` ausgelagert, doppeltes
`absoluteUrl` zugunsten von `absUrl` aus `site.js` entfernt, `useState` mit
Lazy-Initializer statt `setState` im Effekt.

---

## 10. Offene Blocker

Nichts davon wurde geraten oder ersatzweise erfunden. Alle davon unabhängigen
Arbeiten sind durchgeführt.

| # | Blocker | Was fehlt | Auswirkung |
|---|---|---|---|
| **B1** | **Social-Profile** | Facebook-URL, TikTok-URL, ggf. LinkedIn/YouTube. Bestätigt ist nur Instagram. | `sameAs` und Footer enthalten nur Instagram. Struktur in `site.js` ist vorbereitet: eine Zeile einkommentieren, fertig. |
| **B2** | **Veröffentlichungsdaten der Journalartikel** | `datePublished` / `dateModified` je Artikel | `Article`-JSON-LD ohne Datum. Google zeigt dann kein Datum im Snippet. Ein erfundenes Datum wäre schlechter als keins. Sobald die Daten vorliegen: Feld in `journal.js` ergänzen und in `articleLd()` in `site.js` durchreichen (dort als Kommentar vermerkt). |
| **B3** | **Öffnungszeiten / Status des Studios** | verbindliche Zeiten — oder die Bestätigung, dass es bei Terminvereinbarung bleibt | `LocalBusiness` bewusst ohne `openingHours`. Aktuell steht dort `availableService: „Küchenplanung nach Terminvereinbarung"`. Nichts behauptet reguläre Öffnung. |
| **B4** | **Eigenleistung vs. Partnerleistung** | Welche Gewerke führt VIDEKO tatsächlich selbst aus? | `/alles-aus-einer-hand` formuliert durchgängig „koordiniert / mit Fachpartnern". Sobald geklärt ist, wo eigene Ausführung stimmt, kann der Text dort präziser (und stärker) werden. |
| **B5** | **Body-Prerendering** | siehe Abschnitt 11 — Architekturentscheidung, kein Datenmangel | H1 und Fließtext stehen nicht im initialen HTML. |

---

## 11. Risiken und Empfehlungen

### Risiken dieser Umsetzung

1. **Wegfall des SPA-Catch-alls.** `vercel.json` hat kein
   `rewrite → /index.html` mehr. Jede öffentliche URL muss jetzt in
   `routes-meta.js`, `journal.js` oder `products.json` stehen, sonst landet sie
   auf der 404. Das ist beabsichtigt (P5), aber es heißt: **jede neue Route muss
   registriert werden**, sonst ist sie nach dem Deploy tot. Vor dem Livegang die
   Server-Logs auf 404-Spitzen ansehen.

2. **Hash-Änderung aller Bild-URLs.** Sämtliche Assets haben neue Dateinamen.
   Extern verlinkte oder in Social-Posts eingebettete alte Bild-URLs sind danach
   tot. Für Seiten-URLs gilt das nicht.

3. **`trailingSlash: false` ist Vercel-Verhalten.** Lokal nicht reproduzierbar —
   der Messserver liefert `/leistungen/` mit 200 aus, Vercel schickt ein 308 auf
   die Variante ohne Slash. **Nach dem Deploy einmal mit `curl -I` gegenprüfen.**

4. **Prerender-Skript hängt am Vite-Manifest.** Wenn Vite die Manifest-Struktur
   ändert oder ein Asset unter `assetsInlineLimit` fällt, muss
   `scripts/prerender.mjs` mitgezogen werden. Das Skript sammelt fehlende Assets
   und meldet sie beim Build, bricht aber nicht ab.

5. **Bildqualität.** q80 ist sichtgeprüft, aber nicht auf einem kalibrierten
   Display. Bei Kachelflächen und dunklen Verläufen bitte einmal am guten
   Monitor gegenlesen; einzelne Motive lassen sich in
   `scripts/optimize-images.mjs` gezielt höher fahren.

### P12 — Render-blockierendes CSS: bewertet, bewusst nicht angefasst

Vorgabe war: *„Erst NACH den großen Bild- und SEO-Arbeiten angehen. Keine
riskante Komplettzerlegung des Stylesheets nur für einen Lighthouse-Punkt."*
Nach der Nachmessung lautet die Bewertung: **dokumentieren, nicht zerlegen.**

Befund:

- `src/styles.css` ist **eine Datei mit 14.075 Zeilen**. Größte Blöcke:
  Stylefinder ~1748, Karriere-Deck 967, Multi-Page 856, Budget Compass 653,
  Simulator 529 Zeilen. Es gibt **keine saubere Schnittkante** — Selektoren,
  Variablen und Media Queries greifen quer.
- Im Build: **405,0 kB roh, 67,4 kB gzip** — eine einzige CSS-Datei.
- Gemessene Blockierzeit **mit gzip**: **752 ms mobil / 162 ms Desktop** —
  und **identisch zwischen altem und neuem Stand** (753 vs. 752 ms). Der
  Audit-Wert von ~450 ms stammt aus der Production-Messung mit besserem TTFB.

Eine Aufteilung müsste Critical CSS extrahieren und den Rest asynchron nachladen.
Bei einem quer verwobenen Stylesheet dieser Größe ist das ein realistisches
Risiko für sichtbares Flackern und kaputte Sektionen — gegen wenige Score-Punkte,
die mobil ohnehin von FCP dominiert werden. Das ist der falsche Tausch.

**Empfehlung als eigenes, abgegrenztes Vorhaben:** `styles.css` entlang der
bereits existierenden Blockgrenzen in Route-CSS-Dateien schneiden und über die
Seitenkomponenten importieren, damit Vite per Route splittet. Das ist eine
Refactoring-Aufgabe mit visueller Regressionsprüfung, kein Performance-Ticket.

### Nächstbeste Architektur, falls der Body ins HTML soll (B5)

Ausdrücklich **keine** Next.js-Migration. Der kleinste Schritt wäre
`vite-plugin-ssr`/`vike` oder ein eigener SSR-Build, der die bestehenden
Seitenkomponenten mit `renderToString` in dieselben `dist/<route>/index.html`
schreibt, die `prerender.mjs` heute schon anlegt. Die Bausteine dafür stehen
bereits: `scripts/_prerender-data.js` baut die Komponenten schon SSR-fähig, und
die Marker `<!--seo:start-->`/`<!--seo:end-->` im HTML zeigen, wo eingesetzt wird.
Hürden sind die three.js-Szenen und alles, was `window` beim ersten Render
anfasst — die müssten hinter `<ClientOnly>`. Das ist ein eigenes Vorhaben, kein
Anhängsel dieses.

---

## 12. Commit

```
SEO & Performance 1.0: Bilder/Videos, Route-Metadaten, Prerendering, 404

Umsetzung von docs/SEO-PERFORMANCE-AUDIT-2026-08-14.md.

Performance
- 285 PNG/JPG nach WebP konvertiert (511,9 MB -> 28,3 MB, -94,5 %)
- 60 zu gross gespeicherte WebP nachverdichtet (95,3 MB -> 1,9 MB, -98,0 %)
- 521 Responsive-Varianten (480w/960w) ab 60 kB Ausgangsgroesse
- 5 Videos neu kodiert (94,1 MB -> 22,9 MB, -75,7 %)
- neue Img-Komponente: srcSet/sizes, width/height, lazy/eager, fetchPriority
- LazyVideo mit IntersectionObserver, Hero-Video bewusst ausgenommen
- Font-Preload der vier Above-the-fold-Schnitte: CLS 0,128 -> 0,000
- dist gesamt 668,7 MB -> 76,2 MB

SEO
- Route-Metadaten fuer 86 Routen: Title, Description, Canonical, OG, Twitter
- Prerendering des <head> pro Route, ohne JavaScript nachweisbar
- Sitemap zur Build-Zeit (85 URLs), robots.txt
- trailingSlash false, Canonicals auf die Produktionsdomain, 4 Redirects
- echter HTTP 404 mit eigener Seite statt heimlicher Startseite
- JSON-LD zentral aus company.js: Organization, LocalBusiness, WebSite,
  WebPage, BreadcrumbList, Article, FAQPage
- H1 je Seite genau einmal; /showroom und /experience ergaenzt
- /leistungen aus Startseite, Ueber uns und Journalartikeln verlinkt
- Journalkacheln der Startseite ziehen Titel und Teaser aus journal.js

Inhalt
- neue Landingpage /alles-aus-einer-hand ("Nicht nur Kueche. Der ganze Raum.")
- kompakte Startseiten-Sektion mit CTA dorthin

Keine erfundenen Unternehmensdaten: nur Instagram als bestaetigtes Profil,
keine Oeffnungszeiten, keine eG als Rechtstraeger, keine Behauptung eigener
Gewerkeausfuehrung. Offene Punkte in docs/SEO-PERFORMANCE-UMSETZUNG-2026-08-14.md.
```
