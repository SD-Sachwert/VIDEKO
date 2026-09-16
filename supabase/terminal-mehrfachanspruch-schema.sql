-- ------------------------------------------------------------------
-- VIDEKO Terminal — Mehrfachanspruch auf eine Deckelnummer
-- ------------------------------------------------------------------
--
-- Rein additiv und idempotent. Beliebig oft ausfuehrbar. Es wird keine
-- Tabelle ersetzt und keine Zeile geloescht.
--
-- WARUM
-- Eine physische Deckelnummer ist genau ein Los. Mehrere Personen duerfen
-- aber einen Besitzanspruch auf dieselbe Nummer anmelden — wer den
-- Originaldeckel wirklich hat, klaert sich erst im Gewinnfall von Hand.
--
--   anspruch_art = 'erstaktivierung'          die erste Aktivierung (je Nummer genau eine)
--   anspruch_art = 'weiterer_besitzanspruch'  jede weitere, nach ausdruecklicher Bestaetigung
--
-- Der Lostopf liest nur Erstaktivierungen und bildet zusaetzlich eine Menge
-- eindeutiger Nummern. Weitere Ansprueche erzeugen deshalb nie ein Los.
--
-- besitz_status haelt die Pruefung im Gewinnfall fest:
--   null               noch nicht geprueft
--   'bestaetigt'       Originaldeckel vorgelegt
--   'nicht_bestaetigt' ein anderer Anspruch derselben Nummer wurde bestaetigt

alter table public.videko_terminal_teilnehmer
  add column if not exists anspruch_art text not null default 'erstaktivierung';

alter table public.videko_terminal_teilnehmer
  add column if not exists besitz_status text;

alter table public.videko_terminal_teilnehmer
  add column if not exists besitz_geprueft_am timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'videko_terminal_anspruch_art_chk') then
    alter table public.videko_terminal_teilnehmer
      add constraint videko_terminal_anspruch_art_chk
      check (anspruch_art in ('erstaktivierung', 'weiterer_besitzanspruch'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'videko_terminal_besitz_status_chk') then
    alter table public.videko_terminal_teilnehmer
      add constraint videko_terminal_besitz_status_chk
      check (besitz_status is null or besitz_status in ('bestaetigt', 'nicht_bestaetigt'));
  end if;
end $$;

-- Je Kampagne und Nummer genau EINE Erstaktivierung. Erst anlegen, dann den
-- alten, strengeren Index entfernen — so ist die Nummer zu keinem Zeitpunkt
-- ungeschuetzt. Bestehende Zeilen sind alle Erstaktivierungen (Standardwert)
-- und hatten schon eindeutige Nummern, der neue Index passt also.
create unique index if not exists videko_terminal_teilnehmer_erst_uidx
  on public.videko_terminal_teilnehmer (kampagne, deckel_nummer)
  where anspruch_art = 'erstaktivierung';

create index if not exists videko_terminal_teilnehmer_nummer_idx
  on public.videko_terminal_teilnehmer (kampagne, deckel_nummer);

drop index if exists public.videko_terminal_teilnehmer_nummer_uidx;

-- Das eine Game, das ohne aktivierten Deckel im Practice Mode spielbar ist.
alter table public.videko_terminal_einstellungen
  add column if not exists guest_practice_game text not null default 'leitungsfinder';
