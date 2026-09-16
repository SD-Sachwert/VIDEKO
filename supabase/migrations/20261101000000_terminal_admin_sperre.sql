-- ─────────────────────────────────────────────────────────────────────────
-- VIDEKO Terminal — Admin-Anmeldung: Fehlversuche und Sperren
--
-- Rein additiv und idempotent. Beliebig oft ausführbar, ersetzt keine
-- Tabelle, löscht keine Zeile anderer Tabellen.
--
--   videko_terminal_admin_versuche: ein Eintrag je falschem Admin-Schlüssel
--   (art = 'fehl') und je ausgelöster Sperre (art = 'sperre'). Gespeichert
--   wird nur der gesalzene IP-Hash — keine IP, kein Schlüssel, kein Name.
--   Regel (api/terminal-admin.js): 10 Fehlversuche in 10 Minuten je IP
--   → 15 Minuten gesperrt. Erfolgreiche Anmeldungen werden nicht vermerkt.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.videko_terminal_admin_versuche (
  id          uuid primary key default gen_random_uuid(),
  ip_hash     text not null,
  art         text not null check (art in ('fehl', 'sperre')),
  created_at  timestamptz not null default now()
);

create index if not exists videko_terminal_admin_versuche_ip_zeit
  on public.videko_terminal_admin_versuche (ip_hash, art, created_at);

-- Kein Zugriff über anon/authenticated: RLS an, keine Policy.
alter table public.videko_terminal_admin_versuche enable row level security;
