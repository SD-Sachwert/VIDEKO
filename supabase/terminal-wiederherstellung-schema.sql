-- TERMINAL 2.2 — Wieder-Login per E-Mail-Link.
-- Rein additiv und idempotent: legt nur eine neue Tabelle an, fasst keine
-- bestehende an. Gespeichert wird nie der Token selbst, nur sein SHA-256.
-- Anfragen zu unbekannten Adressen landen ohne teilnehmer_id und ohne
-- token_hash hier — nur damit das Mengenlimit fuer sie genauso greift.

create extension if not exists pgcrypto;

create table if not exists public.videko_terminal_wiederherstellung (
  id uuid primary key default gen_random_uuid(),
  kampagne text not null,
  teilnehmer_id uuid references public.videko_terminal_teilnehmer(id) on delete cascade,
  token_hash text unique,
  email_hash text not null,
  ip_hash text,
  erstellt_am timestamptz not null default now(),
  gueltig_bis timestamptz,
  verbraucht_am timestamptz
);

create index if not exists videko_terminal_wiederherstellung_ip_idx
  on public.videko_terminal_wiederherstellung (ip_hash, erstellt_am);
create index if not exists videko_terminal_wiederherstellung_mail_idx
  on public.videko_terminal_wiederherstellung (email_hash, erstellt_am);
create index if not exists videko_terminal_wiederherstellung_teilnehmer_idx
  on public.videko_terminal_wiederherstellung (teilnehmer_id);

-- Kein Zugriff ueber anon/authenticated: RLS an, keine Policy. Nur der
-- Service-Key der Serverfunktion liest und schreibt.
alter table public.videko_terminal_wiederherstellung enable row level security;
