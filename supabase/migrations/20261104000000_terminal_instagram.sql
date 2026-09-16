-- ------------------------------------------------------------------
-- VIDEKO Terminal — Instagram-Follower-Sync
-- ------------------------------------------------------------------
--
-- Rein additiv und idempotent. Beliebig oft ausfuehrbar. Es wird keine
-- Tabelle ersetzt, keine Zeile geloescht und kein Wert veraendert.
--
-- WARUM
-- Die Followerzahl von @videko.kuechen wird stuendlich ueber die offizielle
-- Instagram Graph API geholt (api/terminal-instagram.js, Vercel Cron) und in
-- follower_zahl geschrieben — dieselbe Spalte, die bisher von Hand gepflegt
-- wird und die das Terminal liest. Die Handeingabe bleibt als Rueckfall.
--
-- Fehlen diese Spalten, laeuft der Sync trotzdem: follower_zahl wird dann
-- allein geschrieben, nur Zeitpunkt und Fehler des letzten Laufs gehen
-- verloren.

-- Der zuletzt erfolgreich von der API gelieferte Wert. null heisst: noch nie.
alter table public.videko_terminal_einstellungen
  add column if not exists instagram_follower_api integer;

-- Zeitpunkt des letzten Sync-Versuchs — erfolgreich oder nicht.
alter table public.videko_terminal_einstellungen
  add column if not exists instagram_sync_am timestamptz;

-- Kurzer Fehlergrund des letzten Versuchs (etwa 'http-400'). null heisst:
-- der letzte Versuch hat geklappt. Nie ein Token, nie eine URL.
alter table public.videko_terminal_einstellungen
  add column if not exists instagram_sync_fehler text;
