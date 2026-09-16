-- ─────────────────────────────────────────────────────────────────────────
-- VIDEKO Terminal — GAME-LAB (sieben Kandidaten)
--
-- Rein additiv und idempotent. Beliebig oft ausführbar, ersetzt keine
-- Tabelle, löscht keine Zeile.
--
--   1. Der Check auf videko_terminal_scores.game kennt die sieben neuen
--      Spiele. Der neue Check ist eine Obermenge des alten — bestehende
--      Zeilen erfüllen ihn ohnehin.
--   2. videko_terminal_einstellungen bekommt spiele_reihenfolge (jsonb-Liste
--      der Spielschlüssel; leer = Standardreihenfolge).
--   3. videko_terminal_spielstarts: ein Eintrag je ausgegebenem Laufticket.
--      Nur Spiel, Teilnehmer-ID und Lauf-ID — keine E-Mail, keine
--      Deckelnummer. Dient der Abbruchquote (Starts ohne Ergebnis).
-- ─────────────────────────────────────────────────────────────────────────

begin;
alter table public.videko_terminal_scores
  drop constraint if exists videko_terminal_scores_game;
alter table public.videko_terminal_scores
  add constraint videko_terminal_scores_game
  check (game in (
    'truhenknacker', 'goldrausch', 'kuechen_stack', 'kuechen_dash',
    'kuechen_balance', 'kuechen_fit', 'videko_jump', 'kuechen_merge',
    'leitungsfinder', 'kuechen_crush', 'kuechen_tinder'
  ));
commit;

alter table public.videko_terminal_einstellungen
  add column if not exists spiele_reihenfolge jsonb not null default '[]'::jsonb;

create table if not exists public.videko_terminal_spielstarts (
  id            uuid primary key default gen_random_uuid(),
  kampagne      text not null,
  game          text not null,
  teilnehmer_id uuid not null,
  lauf_id       text not null,
  created_at    timestamptz not null default now()
);

create unique index if not exists videko_terminal_spielstarts_lauf
  on public.videko_terminal_spielstarts (lauf_id);

create index if not exists videko_terminal_spielstarts_game_zeit
  on public.videko_terminal_spielstarts (kampagne, game, created_at);

-- Kein Zugriff über anon/authenticated: RLS an, keine Policy.
alter table public.videko_terminal_spielstarts enable row level security;
