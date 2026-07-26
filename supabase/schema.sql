-- =====================================================================
-- VIDEKO Merch – Supabase-Schema
-- ---------------------------------------------------------------------
-- So anlegen:  Supabase → Projekt → SQL Editor → New query → dieses
-- Skript einfügen → RUN. Alles ist idempotent (IF NOT EXISTS), kann also
-- gefahrlos mehrfach ausgeführt werden.
--
-- Tabellen:
--   videko_leads            – Beratungs-Leads (api/lead.js) + Merch-Angebots-
--                             anfragen (api/order.js, source 'merch-order')
--   videko_notify           – Produktvormerkungen mit Double-Opt-in (api/notify.js)
--   videko_interest_events  – anonyme Nachfrage-Liste vom Herzbutton (api/notify.js)
--
-- Zugriff erfolgt ausschließlich serverseitig über den SUPABASE_SERVICE_KEY
-- (umgeht RLS). RLS ist aktiviert und ohne Policy = kein Zugriff über den
-- öffentlichen anon-Key. Es werden KEINE personenbezogenen Daten in
-- videko_interest_events gespeichert (nur Produktbezug).
-- =====================================================================

-- ── Leads (Beratung + Merch-Angebotsanfragen) ────────────────────────
create table if not exists public.videko_leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  source      text,
  name        text,
  email       text,
  telefon     text,
  anliegen    text,
  kueche      text,
  status      text,
  zeitraum    text,
  budget      text,
  grundriss   text,
  nachricht   text,
  meta        jsonb
);
-- Falls die Tabelle schon existierte: fehlende Spalten sicher ergänzen.
alter table public.videko_leads add column if not exists source     text;
alter table public.videko_leads add column if not exists nachricht  text;
alter table public.videko_leads add column if not exists meta       jsonb;
alter table public.videko_leads add column if not exists created_at timestamptz not null default now();

-- ── Produktvormerkungen (Double-Opt-in) ──────────────────────────────
create table if not exists public.videko_notify (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  email         text,
  product       text,
  product_id    text,
  variant       text,
  status        text,          -- 'pending' | 'confirmed'
  consent_text  text,
  consent_at    timestamptz,
  confirmed_at  timestamptz
);

-- ── Anonyme Nachfrage-Liste (Herzbutton) ─────────────────────────────
-- Ein Datensatz pro Herz-Klick. KEINE Personendaten (keine IP/E-Mail/Name).
create table if not exists public.videko_interest_events (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  product_id    text,
  product_name  text,
  variant       text
);
create index if not exists videko_interest_events_product_idx
  on public.videko_interest_events (product_id);
create index if not exists videko_interest_events_created_idx
  on public.videko_interest_events (created_at);

-- Auswertung „welche Artikel werden oft nachgefragt?" – einfach diese View abfragen:
create or replace view public.videko_interest_top as
  select coalesce(nullif(product_id, ''), product_name) as produkt_key,
         max(product_name)                              as produkt,
         count(*)                                       as anfragen,
         max(created_at)                                as zuletzt
  from public.videko_interest_events
  group by 1
  order by anfragen desc;

-- ── RLS aktivieren (Service-Key umgeht das; anon-Key hat keinen Zugriff) ──
alter table public.videko_leads            enable row level security;
alter table public.videko_notify           enable row level security;
alter table public.videko_interest_events  enable row level security;
