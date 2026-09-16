-- ------------------------------------------------------------------
-- VIDEKO Terminal — Einladungen und Gastspieler
-- ------------------------------------------------------------------
--
-- Rein additiv und idempotent. Beliebig oft ausfuehrbar. Es wird keine
-- Tabelle ersetzt, keine Spalte entfernt und keine Zeile geloescht.
--
-- WARUM
-- Ein physischer Deckel ist genau ein Los. Daran aendert diese Migration
-- nichts. Eine Einladung bringt keinen Deckel, kein Los, keinen Platz im
-- Gesamtranking — sie bringt nur einen weiteren Menschen ins Terminal.
--
--   teilnahme_status = 'offiziell'  Deckel aktiviert. Verlosung, Ranking,
--                                   eigene Einladungsslots.
--   teilnahme_status = 'gast'       Ueber eine Einladung angelegt. Spielt
--                                   alle Hauptgames, Scores werden
--                                   gespeichert — aber kein Los, kein
--                                   Eintrag im offiziellen Gesamtranking,
--                                   keine eigenen Einladungen.
--
-- `anspruch_art` bleibt unangetastet. Der Mehrfachanspruch auf eine
-- Deckelnummer ist eine andere Frage als offiziell-oder-Gast, und die
-- beiden Semantiken werden hier ausdruecklich nicht vermischt.
--
-- Aus einem Gast wird ein offizieller Teilnehmer ausschliesslich dadurch,
-- dass er einen echten Deckel aktiviert. Dabei wird dieselbe Zeile
-- fortgeschrieben — es entsteht nie ein zweiter Datensatz, und die schon
-- gespielten Scores haengen unveraendert an derselben id.

-- ------------------------------------------------------------------
-- 1. Teilnehmer: Gaststatus und Herkunft
-- ------------------------------------------------------------------

-- Ein Gast hat keinen Deckel. Die Spalte muss deshalb leer bleiben duerfen.
-- Die bestehende Bereichspruefung (1..5000) stoert das nicht: eine CHECK-
-- Bedingung scheitert nur an FALSE, nicht an NULL. Der partielle UNIQUE-
-- Index auf (kampagne, deckel_nummer) stoert es ebenfalls nicht: NULL-Werte
-- gelten in Postgres als voneinander verschieden.
alter table public.videko_terminal_teilnehmer
  alter column deckel_nummer drop not null;

alter table public.videko_terminal_teilnehmer
  add column if not exists teilnahme_status text not null default 'offiziell';

-- Wer hat eingeladen, wann, und ueber welche Einladung. Bleibt auch nach
-- der Konvertierung stehen: die Herkunft eines Accounts soll nachvollziehbar
-- bleiben, ohne dass daraus je ein Vorteil entsteht.
alter table public.videko_terminal_teilnehmer
  add column if not exists eingeladen_von uuid;

alter table public.videko_terminal_teilnehmer
  add column if not exists eingeladen_am timestamptz;

-- Der Zeitpunkt, an dem aus dem Gast ein offizieller Teilnehmer wurde.
-- Nur gesetzt, wenn wirklich ein Deckel aktiviert wurde.
alter table public.videko_terminal_teilnehmer
  add column if not exists gast_konvertiert_am timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'videko_terminal_teilnahme_status_chk') then
    alter table public.videko_terminal_teilnehmer
      add constraint videko_terminal_teilnahme_status_chk
      check (teilnahme_status in ('offiziell', 'gast'));
  end if;

  -- Offiziell ohne Deckelnummer darf es nicht geben. Das ist die Sperre,
  -- die verhindert, dass ein Gast per Statuswechsel ins Los kommt, ohne
  -- je einen Deckel vorgelegt zu haben.
  if not exists (select 1 from pg_constraint where conname = 'videko_terminal_offiziell_deckel_chk') then
    alter table public.videko_terminal_teilnehmer
      add constraint videko_terminal_offiziell_deckel_chk
      check (teilnahme_status <> 'offiziell' or deckel_nummer is not null);
  end if;

  -- Und umgekehrt: ein Gast traegt nie eine Deckelnummer. Sonst waere die
  -- Nummer im Lostopf blockiert, ohne dass ein Los daraus entsteht.
  if not exists (select 1 from pg_constraint where conname = 'videko_terminal_gast_ohne_deckel_chk') then
    alter table public.videko_terminal_teilnehmer
      add constraint videko_terminal_gast_ohne_deckel_chk
      check (teilnahme_status <> 'gast' or deckel_nummer is null);
  end if;
end $$;

-- Jede Leseabfrage, die Gaeste ausschliessen muss (Lostopf, oeffentliche
-- Listen, Gesamtranking), filtert ueber diese beiden Spalten.
create index if not exists videko_terminal_teilnehmer_status_idx
  on public.videko_terminal_teilnehmer (kampagne, teilnahme_status);

create index if not exists videko_terminal_teilnehmer_einlader_idx
  on public.videko_terminal_teilnehmer (eingeladen_von)
  where eingeladen_von is not null;

-- ------------------------------------------------------------------
-- 2. Die Einladungen
-- ------------------------------------------------------------------
--
-- Der Token steht NICHT in dieser Tabelle. Er wird serverseitig aus der
-- Zeilen-id und dem Terminal-Geheimnis abgeleitet (HMAC-SHA256) und ist
-- damit ohne das Geheimnis nicht erratbar. Gespeichert wird nur sein
-- SHA-256-Hash, damit der Server einen ankommenden Token zuordnen kann.
-- Ein Datenbankleck gibt deshalb keine benutzbaren Einladungslinks her.
--
-- Bewusst ohne Fremdschluessel — wie videko_terminal_scores. Eine Einladung
-- soll niemals dafuer sorgen koennen, dass beim Aufraeumen irgendwo echte
-- Teilnehmerzeilen mitgerissen werden.
create table if not exists public.videko_terminal_einladungen (
  id uuid primary key default gen_random_uuid(),
  kampagne text not null,
  einlader_teilnehmer_id uuid not null,
  slot_nummer integer not null,
  token_hash text not null,
  erstellt_am timestamptz not null default now(),
  abgelaufen_am timestamptz,
  -- Nur Zaehler, keine Personen: fuer die Auswertung "wie oft wurde ein
  -- Einladungslink ueberhaupt geoeffnet".
  geoeffnet_am timestamptz,
  oeffnungen integer not null default 0,
  verwendet_am timestamptz,
  gast_teilnehmer_id uuid,
  widerrufen_am timestamptz,
  ip_hash text,
  constraint videko_terminal_einladung_slot_chk check (slot_nummer >= 1)
);

-- Ein Token gehoert zu genau einer Einladung.
create unique index if not exists videko_terminal_einladung_hash_uidx
  on public.videko_terminal_einladungen (token_hash);

-- Je Einlader ist ein Slot nur einmal offen. Wird eine Einladung
-- widerrufen, wird der Slot wieder frei und kann neu vergeben werden.
create unique index if not exists videko_terminal_einladung_slot_uidx
  on public.videko_terminal_einladungen (kampagne, einlader_teilnehmer_id, slot_nummer)
  where widerrufen_am is null;

-- Ein Gastaccount haengt an genau einer Einladung. Verhindert, dass
-- dieselbe Person ueber mehrere Einladungen doppelt gezaehlt wird.
create unique index if not exists videko_terminal_einladung_gast_uidx
  on public.videko_terminal_einladungen (gast_teilnehmer_id)
  where gast_teilnehmer_id is not null;

create index if not exists videko_terminal_einladung_einlader_idx
  on public.videko_terminal_einladungen (kampagne, einlader_teilnehmer_id);

-- Wie alle Terminal-Tabellen: RLS an, keine Policy. Nur der Dienst-
-- schluessel auf dem Server kommt heran, der anon key im Browser nie.
alter table public.videko_terminal_einladungen enable row level security;

-- ------------------------------------------------------------------
-- 3. Einstellung: wie viele Einladungen pro offiziellem Teilnehmer
-- ------------------------------------------------------------------
--
-- Wird der Wert spaeter gesenkt, bleiben bereits erzeugte Einladungen
-- gueltig. Die Zahl begrenzt nur, wie viele NEUE Slots belegt werden
-- duerfen — eingeloeste Einladungen werden nie nachtraeglich entwertet.
alter table public.videko_terminal_einstellungen
  add column if not exists einladungen_pro_teilnehmer integer not null default 3;
