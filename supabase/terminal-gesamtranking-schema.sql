-- ------------------------------------------------------------------
-- VIDEKO Terminal — Gesamtranking ueber die fuenf Hauptgames
-- ------------------------------------------------------------------
--
-- Rein additiv und idempotent. Beliebig oft ausfuehrbar. Es wird keine
-- Tabelle ersetzt, keine Zeile geloescht und kein Score veraendert.
--
-- WARUM
-- Ein Gesamtranking fuer die ganze Aktion, ohne Wochen und ohne Reset.
-- Gewertet werden die fuenf Hauptgames aus den Einstellungen; der Testslot
-- und der Practice Mode zaehlen nicht. Gerechnet wird ausschliesslich im
-- Server (api/_terminal-gesamtranking.js) aus den bestehenden Scores mit
-- status = 'gueltig' — es gibt keine zweite Score-Tabelle.
--
-- Die Rangpunkte-Formel steht in api/_terminal-gesamtranking.js.

-- Die fuenf Hauptgames als JSON-Liste von Spielschluesseln. null heisst:
-- Standard aus src/data/terminal.js (STANDARD_HAUPTGAMES).
alter table public.videko_terminal_einstellungen
  add column if not exists gesamtranking_spiele jsonb;

-- Der Testslot. Zaehlt nie ins Gesamtranking.
alter table public.videko_terminal_einstellungen
  add column if not exists testslot_game text;

-- Zusatzpreise fuer Platz 1 bis 3. Leer heisst: kein Preis angezeigt.
alter table public.videko_terminal_einstellungen
  add column if not exists preis_gesamt_1 text;

alter table public.videko_terminal_einstellungen
  add column if not exists preis_gesamt_2 text;

alter table public.videko_terminal_einstellungen
  add column if not exists preis_gesamt_3 text;

-- Gesetzt, sobald die Verwaltung das Gesamtranking abgeschlossen hat. Ab
-- dann gilt der Snapshot; spaetere Scores aendern daran nichts mehr.
alter table public.videko_terminal_einstellungen
  add column if not exists gesamtranking_abgeschlossen_am timestamptz;

-- Der eingefrorene Stand. Eine Zeile je Abschluss; gelesen wird die neueste.
-- `daten` enthaelt Teilnehmer-IDs, Rangpunkte und Bestwerte — keine E-Mail,
-- keine Deckelnummer. Die Instagram-Namen werden beim Anzeigen frisch und
-- nur mit Einwilligung gelesen.
create table if not exists public.videko_terminal_gesamtranking_snapshot (
  id          uuid primary key default gen_random_uuid(),
  kampagne    text not null,
  erstellt_am timestamptz not null default now(),
  spiele      jsonb not null,
  daten       jsonb not null
);

create index if not exists videko_terminal_gr_snapshot_kampagne_idx
  on public.videko_terminal_gesamtranking_snapshot (kampagne, erstellt_am desc);

-- RLS an, keine Policy: nur der Dienstschluessel im Server kommt heran.
alter table public.videko_terminal_gesamtranking_snapshot enable row level security;

-- Protokoll: jede Aenderung der Hauptgames, geschrieben vor dem Speichern.
-- `bestaetigt` = die zweite Bestaetigung "HAUPTGAME WIRKLICH ÄNDERN" lag vor.
-- Keine Personendaten.
create table if not exists public.videko_terminal_gesamtranking_protokoll (
  id              uuid primary key default gen_random_uuid(),
  kampagne        text not null,
  erstellt_am     timestamptz not null default now(),
  art             text not null,
  vorher          jsonb,
  nachher         jsonb,
  teilnehmer_zahl integer,
  bestaetigt      boolean not null default false
);

create index if not exists videko_terminal_gr_protokoll_kampagne_idx
  on public.videko_terminal_gesamtranking_protokoll (kampagne, erstellt_am desc);

alter table public.videko_terminal_gesamtranking_protokoll enable row level security;
