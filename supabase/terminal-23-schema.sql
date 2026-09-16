-- =====================================================================
-- VIDEKO Terminal 2.3 – Follower-Mission, Game-Schalter, zwei neue Spiele
-- ---------------------------------------------------------------------
-- So anlegen:  Supabase → Projekt → SQL Editor → New query → dieses
-- Skript einfügen → RUN. Alles ist idempotent und kann gefahrlos mehrfach
-- laufen.
--
-- DIESES SKRIPT ERSETZT NICHTS UND LÖSCHT NICHTS.
-- Voraussetzung: terminal-schema.sql und terminal-scores-schema.sql.
--
--   1. videko_terminal_einstellungen bekommt zwei jsonb-Spalten:
--        meilenstein_gewinne – { "1000": "Preisname", … } (optional je Stufe)
--        spiele_aktiv        – { "kuechen_dash": false, … } (fehlend = aktiv)
--   2. Der Check auf videko_terminal_scores.game kennt zusätzlich
--      'kuechen_stack' und 'kuechen_dash'. Bestehende Zeilen erfüllen den
--      neuen Check ohnehin (er ist eine Obermenge des alten).
--   3. Startwert der Follower-Mission: 750 — nur, wenn noch nichts
--      eingetragen ist (0 oder leer). Ein gepflegter Wert bleibt stehen.
-- =====================================================================

alter table public.videko_terminal_einstellungen
  add column if not exists meilenstein_gewinne jsonb not null default '{}'::jsonb;

alter table public.videko_terminal_einstellungen
  add column if not exists spiele_aktiv jsonb not null default '{}'::jsonb;

-- Check erweitern: drop if exists + add. In einer Transaktion, damit die
-- Tabelle keinen Moment ohne Prüfung dasteht.
begin;
alter table public.videko_terminal_scores
  drop constraint if exists videko_terminal_scores_game;
alter table public.videko_terminal_scores
  add constraint videko_terminal_scores_game
  check (game in ('truhenknacker', 'goldrausch', 'kuechen_stack', 'kuechen_dash'));
commit;

-- Follower-Startwert, nur wenn leer.
update public.videko_terminal_einstellungen
  set follower_zahl = 750
  where kampagne = 'bierdeckel-2026' and coalesce(follower_zahl, 0) = 0;
