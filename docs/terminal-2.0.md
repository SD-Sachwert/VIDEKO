# VIDEKO Terminal 2.0 — Tresor, Spiele, Rangliste

Stand: 12.09.2026 · Live: https://videko-kuechen.de/terminal

Version 2.0 baut die bestehende Terminal-Seite aus, sie ersetzt sie nicht.
Gestaltung, Texte, Bauteile und CSS-Klassen (`trm-*`) von Version 1 bleiben,
dazu kommen die Inszenierung am Anfang, die Tresor-Welt, zwei Spiele und eine
serverseitige Rangliste.

**Was sich an der Aktion selbst nicht geändert hat:** Die Gewinnchance hängt
allein an der Deckelnummer. Die Ziehung liest ausschließlich
`videko_terminal_teilnehmer`, kennt die Punktetabelle nicht und wird von ihr
nicht berührt. Die Spiele und die Rangliste sind Unterhaltung.

---

## Ablauf der Seite

1. **Code-Eingabe** — optisch wie bisher. Neu sind nur Rauch hinter der Truhe,
   ein schwaches Leuchten aus den Fugen und ein leichter Puls am Schloss.
2. **ACCESS GRANTED** — erst *nach* der Antwort des Servers. Lichtschwung,
   stärkerer Rauch, die Truhe kommt optisch näher, das Schloss schnappt einmal,
   ein schmaler goldener Spalt zwischen Deckel und Korpus. Danach
   „DU HAST ZUGANG." — die Truhe bleibt geschlossen.
3. **Drei Punkte auf der Truhe**
   - Schloss → Rütteln, Funken, „Noch nicht."
   - VIDEKO-Zeichen → das Logo glüht, ein Lichtschwung läuft durch.
   - Schlüsselloch → der echte Eingang: Zoom, schwarzer Übergang, Goldstrahl,
     Landung im Tresor.
4. **Tresor** — `DEIN DECKEL`, `GEWINNE`, `GAMES`, `LEADERBOARD`, Countdown,
   aktivierte Deckel, Follower-Mission. Ohne Aktivierung steht davor das
   bekannte Aktivierungsformular; Spiele und Rangliste sind dann gesperrt.

Alle Inszenierungen respektieren `prefers-reduced-motion`. Im Sparmodus laufen
dieselben Zustände, nur ohne Bewegung (Dauer 0,001 ms statt 1150 ms).

---

## Neue Dateien

| Datei | Zweck |
| --- | --- |
| `src/components/TruhenKnacker.jsx` | Spiel 1: drei rotierende Ringe am Safeschloss |
| `src/components/Goldrausch.jsx` | Spiel 2: fliegende Objekte antippen |
| `src/components/spiel-lauf.js` | gemeinsamer Rundenablauf: Uhr, Punkte, Abgabe |
| `src/components/SpielKarte.jsx` | Rahmen einer Spielkarte im bestehenden Kartenlook |
| `src/components/Rangliste.jsx` | Bestenliste mit drei Reitern |
| `src/pages/TerminalRangliste.jsx` | eigene Seite `/terminal/rangliste` |
| `supabase/terminal-scores-schema.sql` | die Datenbankerweiterung (additiv) |
| `scripts/terminal-test.mjs` | Browser-Testlauf über die gebaute Seite |
| `scripts/terminal-live-test.mjs` | serverseitiger Testlauf gegen die Produktionsdomain |

## Geänderte Dateien

| Datei | Änderung |
| --- | --- |
| `src/pages/Terminal.jsx` | Inszenierung, Truhenpunkte, Schlüsselloch-Flug, Tresor, zwei Spielkarten, Bestwerte, eigener Platz, Tresorkönig |
| `src/terminal.css` | neue Klassen für Bühne, Truhenpunkte, Tresor, Spiele, Rangliste — bestehende Klassen unverändert |
| `src/data/terminal.js` | neue Texte (`TEXTE.g`, `TEXTE.l`), Einwilligungstext |
| `src/data/terminal-api.js` | `spielStarten`, `spielBeenden`, `ranglisteLaden` |
| `api/terminal.js` | neue Aktionen `spiel-start`, `spiel-ende`, `rangliste`; `zustand` liefert zusätzlich Bestwerte und König |
| `api/_terminal-kern.js` | Spielregeln, Laufticket, Punktespeicher, Ranglistenabfragen |
| `src/pages/TerminalTeilnahme.jsx` | Abschnitte zu Punktespeicherung, Einwilligung und Widerruf |
| `src/components/TerminalRahmen.jsx` | Navigation zur Rangliste |
| `src/pages/TerminalAdmin.jsx` | unverändert in der Logik, nur Anzeige der neuen Spalte |

Die Ziehung (`api/terminal-admin.js`, `src/pages/TerminalZiehung.jsx`) ist in
ihrer Logik unangetastet.

---

## Datenbank

Auszuführen im Supabase-SQL-Editor des Website-Projekts:
`supabase/terminal-scores-schema.sql`. Das Skript ist idempotent und rein
additiv — kein `drop`, kein `replace`, keine bestehende Zeile wird angefasst.

**Erweiterung an `videko_terminal_teilnehmer`:**

```sql
add column if not exists leaderboard_ok     boolean not null default false
add column if not exists leaderboard_ok_am  timestamptz
```

Bestehende Teilnehmer bekommen `false` — also kein Name in der öffentlichen
Liste, solange niemand zugestimmt hat.

**Neue Tabelle `videko_terminal_scores`:**

| Spalte | Bedeutung |
| --- | --- |
| `id` | Primärschlüssel |
| `teilnehmer_id` | Verweis auf `videko_terminal_teilnehmer` |
| `game` | `truhenknacker` oder `goldrausch` |
| `score` | Punktzahl des Laufs |
| `lauf_id` | die Nonce des Lauftickets — **unique**, das macht einen Lauf einmalig |
| `dauer_ms` | wie lange der Lauf wirklich dauerte (Serverzeit) |
| `runden` | Anzahl der Treffer/Ringe, nur zur Einordnung |
| `status` | `gueltig` oder `verdacht` |
| `notiz` | bei Verdacht: `dauer`, `punkte` oder `dauer+punkte` |
| `ip_hash` | gesalzener Hash, nie die IP selbst |
| `created_at` | Zeitpunkt |

Jeder Lauf bleibt als Zeile erhalten — auch die schwächeren und die
verdächtigen. Das ist die Historie für Nachprüfung und Verwaltung. Gewertet
wird immer nur der beste Lauf mit `status = 'gueltig'` pro Person und Spiel.

RLS ist aktiviert, ohne Policy. Der anonyme Schlüssel kommt also nicht an die
Tabelle; der Zugriff läuft ausschließlich über die Serverfunktionen mit dem
Service-Key.

---

## Neue API-Aktionen

Alle an `POST /api/terminal`.

### `spiel-start`
```json
{ "aktion": "spiel-start", "sitzung": "<Sitzungsbeleg>", "game": "truhenknacker" }
→ { "ok": true, "ticket": "v1.…", "dauerMs": 30000 }
```
Gibt ein signiertes Laufticket aus. Darin stehen Teilnehmer-ID, Spiel,
Startzeitpunkt und eine Zufalls-Nonce. Die Spielzeit gibt der Server vor, nicht
der Browser.

### `spiel-ende`
```json
{ "aktion": "spiel-ende", "sitzung": "…", "game": "truhenknacker",
  "ticket": "v1.…", "score": 14820, "runden": 21 }
→ { "ok": true, "gespeichert": true, "gewertet": true, "punkte": 14820,
    "beste": { "truhenknacker": 14820, "goldrausch": 19400 },
    "gesamt": 34220, "platz": 1, "gelistet": true }
```
`gespeichert` und `gewertet` sind bewusst zwei Felder: gespeichert wird jeder
Lauf, gewertet nur einer, dessen Dauer und Punktzahl zusammenpassen.

### `rangliste`
```json
{ "aktion": "rangliste", "sitzung": "…" }   // Sitzung ist optional
→ { "ok": true, "listen": { "truhenknacker": {…}, "goldrausch": {…}, "gesamt": {…} } }
```
Jede Liste: `eintraege` (max. 20, je `platz`, `instagram`, `punkte`, `ich`),
`eigenerPlatz`, `eigenePunkte`, `gelistet`. Ohne Sitzung fehlen die eigenen
Werte — sonst identisch.

### `zustand` (erweitert)
Liefert zusätzlich `spiele` (eigene Bestwerte, Gesamtpunkte, Platz) und
`koenig` (`platz`, `instagram`, `punkte`, `ich`). Ohne Sitzung sind
`teilnehmer` und `spiele` `null`; `koenig` bleibt, weil er öffentlich ist.

---

## Betrugsschutz

Ein `POST` mit `score: 999999999` ist der Normalfall, nicht die Ausnahme.
Fünf Schichten liegen dagegen:

1. **Signiertes Laufticket.** Vor jeder Runde holt der Browser ein Ticket. Es
   bindet Teilnehmer-ID, Spiel, Startzeitpunkt und eine Nonce und ist mit
   `TERMINAL_TOKEN_SECRET` per HMAC signiert. Ohne gültiges Ticket wird kein
   Punktestand angenommen. Laufzeit: 10 Minuten.
2. **Einmaligkeit.** Die Nonce landet als `lauf_id` in der Tabelle, mit einem
   Unique-Index. Ein zweites Absenden desselben Tickets endet mit HTTP 409.
   Die Sperre liegt in der Datenbank, nicht im Code — nur so halten auch zwei
   gleichzeitige Absendungen sauber auseinander.
3. **Bindung an Person und Spiel.** Ein Ticket gilt nur für den Teilnehmer, für
   den es ausgestellt wurde, und nur für das Spiel, das darin steht. Beides
   wird geprüft, beides ist getestet.
4. **Harte Obergrenze.** `truhenknacker` 120.000, `goldrausch` 150.000. Darüber
   wird gar nichts angenommen (HTTP 400). Negative Werte ebenso.
5. **Plausibilität.** Dauer unter der halben Spielzeit oder Punktzahl über dem
   Erreichbaren (45.000 bzw. 60.000) → der Lauf wird gespeichert, aber als
   `verdacht` markiert und aus jeder Rangliste und jedem Bestwert genommen.
   Die Antwort sagt dann ehrlich `gewertet: false`.

Dazu die Bremsen pro IP aus Version 1: 5 Schreibvorgänge und 40 Spielaufrufe
je 10 Minuten.

**Was das nicht leistet:** Wer das Spiel im Browser geschickt automatisiert,
kann einen Lauf erzeugen, der in Dauer und Punktzahl plausibel aussieht. Dagegen
hilft keine Grenze, sondern nur ein Blick in die Historie — dafür ist sie da.

---

## Rangliste

Drei Reiter: `TRUHENKNACKER`, `GOLDRAUSCH`, `GESAMT`, je Top 20.
`GESAMT` = bester Truhenknacker + bester Goldrausch. Bei Gleichstand gewinnt
der früher erreichte Lauf — das ist stabil und nicht von der Abfragereihenfolge
abhängig.

Öffentlich sichtbar sind ausschließlich **Platz, Instagram-Name und Punktzahl**.
E-Mail-Adressen, Deckelnummern und Teilnehmer-IDs erscheinen in keiner
öffentlichen Antwort. Die Listen werden serverseitig zusammengesetzt und kurz
zwischengespeichert; nach einer eigenen Runde wird der Speicher geleert, damit
der eigene Stand sofort stimmt.

### Einwilligung

Im Aktivierungsformular steht ein **freiwilliger** zusätzlicher Haken:

> Ich bin damit einverstanden, dass mein Instagram-Name zusammen mit meinen
> Game-Scores im öffentlichen VIDEKO Game-Leaderboard angezeigt wird.

Ohne diesen Haken gilt: Teilnahme unverändert gültig, Spiele spielbar,
Bestwerte und eigener Platz im eigenen Dashboard sichtbar — nur der Name
erscheint auf keiner öffentlichen Liste. Die Abfrage filtert auf
`leaderboard_ok = true`; der Haken ist kein Pflichtfeld.

---

## Umgebungsvariablen

Seit dem Umzug (2026-09-15) liegen die Daten in `videko-core-pilot`, mit eigenem
Variablenpaar. Die allgemeinen `SUPABASE_*`-Werte (Projekt `buchhaltung`) nutzt
das Terminal nicht mehr.

| Variable | Zweck |
| --- | --- |
| `TERMINAL_SUPABASE_URL` | Projekt-URL von `videko-core-pilot` |
| `TERMINAL_SUPABASE_SERVICE_KEY` | Service-Key, nur serverseitig, nie mit `VITE_`-Präfix |
| `TERMINAL_CODE` | die Lösung des Rätsels — steht nur hier, nie im Bundle |
| `TERMINAL_TOKEN_SECRET` | signiert Zugangsbelege, Sitzungen und Lauftickets |
| `TERMINAL_IP_SALT` | Salz für den IP-Hash; die IP selbst wird nie gespeichert |
| `TERMINAL_SCHREIBEN` | Notbremse — nur ein ausdrückliches `0` hält das Schreiben an |
| `TERMINAL_ADMIN_TOKEN` | Kopfzeile `x-terminal-admin` für `/api/terminal-admin` |

**Admin-Anmeldung gebremst:** höchstens 10 falsche Schlüssel je IP in 10 Minuten,
danach 15 Minuten Sperre (HTTP 429, `grund: 'bremse'`) — auch für den richtigen
Schlüssel. Erfolgreiche Anmeldungen und Anfragen ohne Schlüssel zählen nicht.
Die Antworten nennen keine Restversuche. Vermerkt wird nur der IP-Hash in
`videko_terminal_admin_versuche` (Schema: `supabase/terminal-admin-sperre-schema.sql`,
additiv); fehlt die Tabelle, bremst die Instanz im Speicher.
Test ohne Netz: `node scripts/terminal-admin-bremse-test.mjs`.

---

## Testen

**Im Browser über die gebaute Seite** (stubbt `/api/terminal`, weil es lokal
keinen Server dafür gibt):

```
npm run build
node scripts/serve-dist.mjs 4178
node scripts/terminal-test.mjs 4178
```

**Serverseitig gegen die Produktionsdomain** — nur das prüft Laufticket,
Plausibilität und Rangliste wirklich:

```
node scripts/terminal-live-test.mjs
```

Der Lauf schreibt echte Zeilen. Er benutzt dafür die Deckelnummern 4998/4999
mit dem Namenspräfix `zz_pruefung` und nennt am Ende, was aufzuräumen ist:

```sql
delete from videko_terminal_scores
 where teilnehmer_id in (
   select id from videko_terminal_teilnehmer where instagram_handle like 'zz\_pruefung%'
 );
delete from videko_terminal_teilnehmer where instagram_handle like 'zz\_pruefung%';
```

Zweimal hintereinander schlägt die Doppelaktivierungs-Prüfung nicht fehl,
sondern meldet HTTP 429: die Schreibbremse pro IP greift dann vor dem
Unique-Index. Zwischen zwei vollständigen Läufen zehn Minuten warten.

Die Ziehung löst der Testlauf **nicht** aus — das wäre ein echter Zug in der
laufenden Aktion. Geprüft wird, dass der Weg erreichbar und das Tor
verschlossen ist.

---

## Offen

- Die Teilnahmebedingungen unter `/terminal/teilnahmebedingungen` tragen
  weiterhin die Karte „ENTWURF — RECHTLICH NOCH NICHT FREIGEGEBEN". Offen sind
  Teilnahmealter, Ausschlüsse, Rechtsweg, Steuer und der Meta-Plattformhinweis.
- Eine Ansicht der verdächtigen Läufe in der Verwaltung wäre nützlich, sobald
  es echte Läufe gibt. Die Daten liegen bereit (`status`, `notiz`, `dauer_ms`).
