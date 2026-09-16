-- =====================================================================
-- VIDEKO Bierdeckel-Aktion (/terminal) – Supabase-Schema
-- ---------------------------------------------------------------------
-- So anlegen:  Supabase → Projekt → SQL Editor → New query → dieses
-- Skript einfügen → RUN. Alles ist idempotent (if not exists), kann also
-- gefahrlos mehrfach ausgeführt werden.
--
-- WELCHES PROJEKT
-- Dasselbe Supabase-Projekt wie die übrige Website (SUPABASE_URL /
-- SUPABASE_SERVICE_KEY), nicht das Studio-Projekt der Stadtfest-Daten:
-- die Aktion bringt ihre eigene Verwaltungsansicht unter /terminal/admin
-- mit und wird nicht im Studio ausgewertet.
--
-- Tabellen:
--   videko_terminal_teilnehmer    – eine Zeile pro aktiviertem Deckel
--   videko_terminal_einstellungen – eine Zeile pro Kampagne (laufende Werte)
--   videko_terminal_ziehungen     – Protokoll jeder Ziehung
--   videko_terminal_meldungen     – eingegangene Gewinnmeldungen
--
-- Zugriff ausschließlich serverseitig über den SUPABASE_SERVICE_KEY
-- (umgeht RLS). RLS ist aktiviert und ohne Policy = über den öffentlichen
-- anon-Key kommt niemand an diese Tabellen.
--
-- IP-Adressen werden NICHT gespeichert. In ip_hash steht nur ein gesalzener
-- SHA-256-Hash (TERMINAL_IP_SALT), ausschließlich zur Ratenbegrenzung.
-- =====================================================================

-- ── Aktivierte Deckel ────────────────────────────────────────────────
-- Die beiden Regeln der Aktion stehen als Datenbankbedingung da, nicht nur
-- in der Serverfunktion: eine Nummer liegt zwischen 1 und 5000, und jede
-- Nummer gibt es je Kampagne genau einmal. Zwei gleichzeitige Anfragen mit
-- derselben Nummer können damit nicht beide durchkommen — die zweite läuft
-- in den Unique-Fehler und erhält die Antwort "bereits aktiviert".
create table if not exists public.videko_terminal_teilnehmer (
  id                          uuid primary key default gen_random_uuid(),
  kampagne                    text        not null,
  deckel_nummer               integer     not null,
  instagram_handle            text        not null,
  email                       text        not null,
  folgt_bestaetigt_von_nutzer boolean     not null default false,
  aktiviert_am                timestamptz not null default now(),
  status                      text        not null default 'aktiv',
  ip_hash                     text,
  constraint videko_terminal_deckel_bereich
    check (deckel_nummer between 1 and 5000)
);

create unique index if not exists videko_terminal_teilnehmer_nummer_uidx
  on public.videko_terminal_teilnehmer (kampagne, deckel_nummer);

-- Die Ratenbegrenzung zählt Aktivierungen desselben Hashes im Zeitfenster.
create index if not exists videko_terminal_teilnehmer_ip_idx
  on public.videko_terminal_teilnehmer (ip_hash, aktiviert_am);

create index if not exists videko_terminal_teilnehmer_zeit_idx
  on public.videko_terminal_teilnehmer (kampagne, aktiviert_am desc);

-- ── Laufende Werte der Kampagne ──────────────────────────────────────
-- Eine Zeile je Kampagne, Primärschlüssel ist der Kampagnenschlüssel: die
-- Serverfunktion schreibt per upsert (Prefer: resolution=merge-duplicates)
-- und muss die Zeile deshalb nicht vorher anlegen.
--
-- gezogene_nummer und meldefrist_bis sind der öffentliche Aushang: die Seite
-- /terminal/ziehung liest sie in einer einzigen Abfrage. Das vollständige
-- Protokoll steht daneben in videko_terminal_ziehungen.
create table if not exists public.videko_terminal_einstellungen (
  kampagne           text primary key,
  naechste_ziehung   timestamptz,
  follower_zahl      integer     not null default 0,
  follower_ziel      integer     not null default 1000,
  live_modus         boolean     not null default false,
  gezogene_nummer    integer,
  meldefrist_bis     timestamptz,
  meldefrist_stunden integer     not null default 48,
  aktualisiert_am    timestamptz not null default now()
);

-- Falls die Tabelle schon existierte: fehlende Spalten sicher ergänzen.
alter table public.videko_terminal_einstellungen
  add column if not exists naechste_ziehung   timestamptz;
alter table public.videko_terminal_einstellungen
  add column if not exists follower_zahl      integer not null default 0;
alter table public.videko_terminal_einstellungen
  add column if not exists follower_ziel      integer not null default 1000;
alter table public.videko_terminal_einstellungen
  add column if not exists live_modus         boolean not null default false;
alter table public.videko_terminal_einstellungen
  add column if not exists gezogene_nummer    integer;
alter table public.videko_terminal_einstellungen
  add column if not exists meldefrist_bis     timestamptz;
alter table public.videko_terminal_einstellungen
  add column if not exists meldefrist_stunden integer not null default 48;
alter table public.videko_terminal_einstellungen
  add column if not exists aktualisiert_am    timestamptz not null default now();

-- Startzeile. Fehlt sie, arbeitet die Seite mit den Vorgaben aus
-- src/data/terminal.js weiter; mit Zeile ist der Stand in der Verwaltung
-- änderbar.
insert into public.videko_terminal_einstellungen (kampagne)
  values ('bierdeckel-2026')
  on conflict (kampagne) do nothing;

-- ── Protokoll der Ziehungen ──────────────────────────────────────────
-- status: 'offen' | 'geclaimt' | 'abgelaufen' | 'neu_gezogen'
-- Eine Nummer darf nur einmal gezogen werden. Der Unique-Index hält das auch
-- dann, wenn zwei Ziehungen gleichzeitig ausgelöst werden.
create table if not exists public.videko_terminal_ziehungen (
  id               uuid primary key default gen_random_uuid(),
  kampagne         text        not null,
  deckel_nummer    integer     not null,
  gezogen_am       timestamptz not null default now(),
  meldefrist_bis   timestamptz,
  status           text        not null default 'offen',
  notiz            text,
  abgeschlossen_am timestamptz,
  constraint videko_terminal_ziehung_bereich
    check (deckel_nummer between 1 and 5000)
);

create unique index if not exists videko_terminal_ziehungen_nummer_uidx
  on public.videko_terminal_ziehungen (kampagne, deckel_nummer);

create index if not exists videko_terminal_ziehungen_zeit_idx
  on public.videko_terminal_ziehungen (kampagne, gezogen_am desc);

-- ── Gewinnmeldungen ──────────────────────────────────────────────────
-- status: 'offen' | 'geprueft' | 'bestaetigt' | 'abgelehnt'
-- gezogene_nummer hält fest, welche Nummer zum Zeitpunkt der Meldung gesucht
-- war. Ohne diesen Stempel ließe sich später nicht mehr beurteilen, ob die
-- Meldung zur richtigen Ziehung gehörte.
create table if not exists public.videko_terminal_meldungen (
  id               uuid primary key default gen_random_uuid(),
  kampagne         text        not null,
  deckel_nummer    integer     not null,
  instagram_handle text,
  email            text,
  nachricht        text,
  gezogene_nummer  integer,
  gemeldet_am      timestamptz not null default now(),
  status           text        not null default 'offen',
  notiz            text,
  ip_hash          text
);

create index if not exists videko_terminal_meldungen_zeit_idx
  on public.videko_terminal_meldungen (kampagne, gemeldet_am desc);

create index if not exists videko_terminal_meldungen_ip_idx
  on public.videko_terminal_meldungen (ip_hash, gemeldet_am);

-- ── RLS aktivieren (Service-Key umgeht das; anon-Key hat keinen Zugriff) ──
alter table public.videko_terminal_teilnehmer    enable row level security;
alter table public.videko_terminal_einstellungen enable row level security;
alter table public.videko_terminal_ziehungen     enable row level security;
alter table public.videko_terminal_meldungen     enable row level security;
