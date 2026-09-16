-- =====================================================================
-- VIDEKO Terminal 2.0 – Spielergebnisse und Leaderboard-Einwilligung
-- ---------------------------------------------------------------------
-- So anlegen:  Supabase → Projekt → SQL Editor → New query → dieses
-- Skript einfügen → RUN. Alles ist idempotent (if not exists / add column
-- if not exists), kann also gefahrlos mehrfach ausgeführt werden.
--
-- DIESES SKRIPT ERSETZT NICHTS.
-- Es ergänzt ausschließlich. terminal-schema.sql bleibt die Grundlage und
-- muss vorher gelaufen sein; die vier bestehenden Tabellen werden hier
-- nicht angefasst, nur videko_terminal_teilnehmer bekommt zwei zusätzliche
-- Spalten (add column if not exists, mit Default — bestehende Zeilen
-- behalten ihre Daten und gelten als "keine Einwilligung").
--
-- WELCHES PROJEKT
-- Dasselbe Supabase-Projekt wie terminal-schema.sql (SUPABASE_URL /
-- SUPABASE_SERVICE_KEY der Website).
--
-- Neu:
--   videko_terminal_scores – ein Lauf pro Zeile (Truhenknacker, Goldrausch)
--
-- WICHTIG ZUR GEWINNSPIELMECHANIK
-- Die Spiele sind Unterhaltung. Diese Tabelle hat mit der Ziehung nichts zu
-- tun: gezogen wird ausschließlich aus videko_terminal_teilnehmer. Es gibt
-- absichtlich keinen Fremdschlüssel, keinen Trigger und keine View, die
-- Punkte in die Ziehung einspeisen könnte.
--
-- Zugriff ausschließlich serverseitig über den SUPABASE_SERVICE_KEY
-- (umgeht RLS). RLS ist aktiviert und ohne Policy = über den öffentlichen
-- anon-Key kommt niemand an diese Tabelle.
-- =====================================================================

-- ── Einwilligung in das öffentliche Leaderboard ──────────────────────
-- Getrennt von der Gewinnspielteilnahme: wer nicht einwilligt, nimmt
-- unverändert an der Aktion teil, erscheint aber in keiner öffentlichen
-- Liste. Default false — Einwilligung wird aktiv gegeben, nie unterstellt.
-- Bestehende Zeilen aus der Zeit vor 2.0 haben damit automatisch "nein".
alter table public.videko_terminal_teilnehmer
  add column if not exists leaderboard_ok boolean not null default false;

-- Zeitpunkt der Einwilligung. Für einen späteren Widerruf ist die Spalte
-- oben die Wahrheit; dieser Stempel dokumentiert nur, wann sie gesetzt wurde.
alter table public.videko_terminal_teilnehmer
  add column if not exists leaderboard_ok_am timestamptz;

-- ── Spielergebnisse ──────────────────────────────────────────────────
-- Eine Zeile je gespielter Runde, nicht je Spieler. Der Bestwert wird nicht
-- gespeichert, sondern berechnet: so bleibt die Historie für die Verwaltung
-- nachvollziehbar, und ein später als ungültig erkannter Lauf lässt sich
-- über status ausschließen, ohne einen Bestwert rückrechnen zu müssen.
--
-- lauf_id ist die Nonce aus dem signierten Laufticket. Der Unique-Index
-- darauf ist die technische Seite von "ein Ticket gilt genau einmal": zwei
-- gleichzeitige Absendungen desselben Laufs können nicht beide durchkommen.
--
-- status: 'gueltig' | 'verdacht' | 'verworfen'
--   'gueltig'  – Ticket stimmte, Dauer und Punktzahl plausibel
--   'verdacht' – gespeichert, aber aus jeder Rangliste ausgenommen
--   'verworfen'– von Hand in der Verwaltung aussortiert
create table if not exists public.videko_terminal_scores (
  id            uuid primary key default gen_random_uuid(),
  kampagne      text        not null,
  teilnehmer_id uuid        not null,
  game          text        not null,
  score         integer     not null,
  lauf_id       text        not null,
  dauer_ms      integer,
  runden        integer,
  status        text        not null default 'gueltig',
  notiz         text,
  created_at    timestamptz not null default now(),
  ip_hash       text,
  constraint videko_terminal_scores_game
    check (game in ('truhenknacker', 'goldrausch')),
  constraint videko_terminal_scores_bereich
    check (score between 0 and 1000000)
);

-- Ein Laufticket, ein Ergebnis.
create unique index if not exists videko_terminal_scores_lauf_uidx
  on public.videko_terminal_scores (lauf_id);

-- Die Rangliste liest je Spiel die besten gültigen Läufe.
create index if not exists videko_terminal_scores_rang_idx
  on public.videko_terminal_scores (kampagne, game, status, score desc, created_at);

-- Der eigene Bestwert im Dashboard.
create index if not exists videko_terminal_scores_person_idx
  on public.videko_terminal_scores (teilnehmer_id, game, score desc);

-- Die Ratenbegrenzung zählt Läufe desselben Hashes im Zeitfenster.
create index if not exists videko_terminal_scores_ip_idx
  on public.videko_terminal_scores (ip_hash, created_at);

-- ── RLS aktivieren (Service-Key umgeht das; anon-Key hat keinen Zugriff) ──
alter table public.videko_terminal_scores enable row level security;
