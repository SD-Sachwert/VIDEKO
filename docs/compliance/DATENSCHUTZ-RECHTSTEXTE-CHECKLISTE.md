# Übergabe an Rechtstexte-Anbieter / Anwalt

**Stand:** 2026-07-25 · **Status:** offen (Livegang-Blocker)

Diese Datei bündelt exakt die Informationen, die einem Rechtstexte-Anbieter
(z. B. eRecht24, IT-Recht Kanzlei, Händlerbund) oder einer Anwaltskanzlei
übergeben werden müssen, damit rechtssichere Endtexte erstellt werden können.
Sie ersetzt **keine** Rechtsberatung. Nichts davon darf selbst „erfunden“ oder
als geprüft ausgegeben werden.

---

## A) Datenschutzerklärung — was der Anbieter/Anwalt braucht

Die aktuelle öffentliche Fassung (`src/pages/datenschutz-text.txt`) ist eine
technisch bereinigte **Rohfassung** und noch **nicht geprüft**.

### A1) Unternehmensangaben (verantwortliche Stelle)
- VIDEKO Küchen eG, Hertzstraße 4, 97076 Würzburg
- Telefon: 0160 5545818 · E-Mail: info@videko-kuechen.de
- **Zu bestätigen:** vertretungsberechtigte Person(en), Register-/Genossenschaftsdaten,
  ob eine/ein Datenschutzbeauftragte/r bestellt ist (dann mit Kontakt ergänzen),
  zuständige Datenschutz-Aufsichtsbehörde.

### A2) Tatsächlich eingesetzte Dienste (im Code verifiziert)
Nur diese benennen — **keine** weiteren Dienste erfinden.

| Dienst | Zweck | Verarbeitete Daten | Rechtsgrundlage (Entwurf) | Drittland |
|---|---|---|---|---|
| **Vercel** (Hosting/Auslieferung) | Bereitstellung der Website, Server-Logs | IP-Adresse, Zugriffszeit, URL, Browser/OS | Art. 6 (1) f | USA |
| **Supabase** (Datenbank + Datei-Speicher/Storage) | Speicherung der Formulardaten und hochgeladener Dateien aus `/api/lead` (Beratung, Bewerbung inkl. Unterlagen, Stilfinder inkl. Bilder) | Name, Kontaktdaten, Nachricht, Projekt-/Stilangaben, hochgeladene Dateien | Art. 6 (1) b / f | USA (zu bestätigen) |
| **SMTP-/Mailanbieter** (Nodemailer, Default `smtp.strato.de`) | Versand der Eingangs-/Bestätigungs- und internen Team-Mails zu `/api/lead`-Anfragen | E-Mail-Inhalt, Absender/Empfänger | Art. 6 (1) b / f | zu bestätigen |
| **localStorage** (funktional) | Merkliste im Merch-Bereich | rein lokal, kein Transfer an uns | Art. 6 (1) f, § 25 (2) TDDDG | — |
| **Google Fonts (lokal)** | Schriftdarstellung | keine Verbindung zu Google | — | — |
| **mailto-Anfrage** (Merch) | „Unverbindlich per E-Mail anfragen“ | vom Nutzer im E-Mail-Entwurf eingegebene Angaben | Art. 6 (1) b / f | — |

> Hinweis: Der frühere Merch-Endpunkt `/api/notify` samt „Benachrichtige-mich“-
> Vormerkung wurde vollständig entfernt. Supabase/SMTP werden **ausschließlich**
> noch für die site-weiten `/api/lead`-Formulare verwendet, nicht mehr für den
> Merch-Bereich (dort nur mailto).

### A2a) AV-Verträge nach Art. 28 DSGVO — konkret (§ 6 der Vorgabe)

| Anbieter | Tatsächlich genutzt | AV-Vertrag erforderlich | Bereits vorhanden | Exakte externe Handlung |
|---|---|---|---|---|
| **Vercel Inc.** | Ja — Hosting/Auslieferung der Gesamtseite, Server-Logs | Ja (Auftragsverarbeitung von Zugriffsdaten) | **Offen / zu prüfen** | Vercel DPA im Vercel-Dashboard unter *Settings → Legal / Data Processing Addendum* aktiv akzeptieren und PDF ablegen. |
| **Supabase Inc.** | Ja — Datenbank + Storage für `/api/lead`-Formulardaten und Uploads | Ja | **Offen / zu prüfen** | Supabase DPA anfordern/abschließen (Supabase-Dashboard *Organization → Legal Documents* bzw. per E-Mail an privacy@supabase.io) und ablegen. |
| **SMTP-/Mailanbieter** (aktuell zu bestätigen, Default `smtp.strato.de`) | Ja — Versand der `/api/lead`-Mails | Ja | **Offen / zu prüfen** | Zuerst den **tatsächlich** in Produktion gesetzten SMTP-Host bestätigen (ENV `SMTP_HOST`); mit diesem Anbieter AV-Vertrag abschließen und ablegen. |

Kein AV-Vertrag erforderlich für: lokale Google Fonts (keine Datenübermittlung),
localStorage (keine Auftragsverarbeitung), mailto-Anfrage (Übermittlung direkt an
das eigene Postfach der eG, kein externer Auftragsverarbeiter).

**Nicht im Einsatz** (bewusst nicht benennen): Google Analytics/andere Analyse,
Meta-/TikTok-Pixel, externe Google-Fonts, YouTube/Vimeo/Spotify-Embeds, externe
Bilder/CDN-Skripte, Social-Media-Tracking, Real Cookie Banner, Google Drive,
Strato-Hosting. Interesse-/Verhaltens-Tracking bleibt deaktiviert.

### A3) Pro Dienst noch zu klären (offene Pflichtangaben)
Für **jeden** der real eingesetzten Dienste (Vercel, Supabase, SMTP-Anbieter):
1. **Genaue Anbieteranschrift** (in der Rohfassung bewusst nur „mit Sitz in den USA“).
2. **AV-Vertrag nach Art. 28 DSGVO** — abschließen und ablegen (aktuell **offen**).
3. **Drittlandtransfer**: Serverstandort + Transfermechanismus (SCC/DPF-Zertifizierung)
   dokumentieren und belegen.
4. **Speicherdauer** je Datenkategorie konkretisieren.
5. Klären, ob Supabase **und/oder** SMTP in der Produktivumgebung tatsächlich aktiv
   sind (hängt von den gesetzten Environment-Variablen ab) — nur aktive Dienste
   dürfen im Endtext bleiben.

### A4) Grundlage
Technisches Inventar: `docs/compliance/services-datenverarbeitung.md`
(Cookie-/Consent-Bewertung: aktuell kein Banner nötig, da nur funktionale
Speicherung — bei Zukauf von Analyse/Marketing/Zahlungs-Widgets neu bewerten).

---

## B) Rechtstexte für den späteren E-Mail-Verkauf (§ 9 der Vorgabe)

Diese Texte sind **noch nicht** erforderlich für Stufe 1 (öffentliche Vorschau)
und Stufe 2 (unverbindliche Anfrage). Sie müssen **vor dem ersten konkreten
Angebot an eine/einen Verbraucher/in** (Stufe 3) vorliegen — als **geprüfte
Endtexte**, nicht als selbst formulierte Entwürfe:

- [ ] Anbieterinformationen / Impressumsangaben im Angebot
- [ ] Produktbeschreibung (wesentliche Eigenschaften)
- [ ] Gesamtpreis inkl. Steuern + Hinweis zur USt-Behandlung der eG (siehe C)
- [ ] Versandkosten
- [ ] Liefer-/Leistungszeit
- [ ] Zahlungsbedingungen
- [ ] Regelung zum Vertragsschluss (wann/wie kommt der Vertrag zustande)
- [ ] Mängelhaftung / Gewährleistung
- [ ] Widerrufsbelehrung für Verbraucher
- [ ] Muster-Widerrufsformular
- [ ] ggf. AGB
- [ ] Sonderfall personalisierte Artikel (§ 312g Abs. 2 Nr. 1 BGB — Ausschluss/
      Einschränkung des Widerrufsrechts) sauber belehren

Vorbereiteter Ablauf/Vorlagen (unverbindlich, ungeprüft):
`docs/compliance/EMAIL-VERKAUFSPROZESS.md`, `docs/compliance/vorlagen/EMAIL-VORLAGEN.md`.

---

## C) Steuerliche / preisrechtliche Klärung (Voraussetzung für öffentliche Preise)

Blockiert aktuell die Anzeige öffentlicher Preise (`SHOW_PUBLIC_PRICES = false`).

- [ ] USt-Status der VIDEKO Küchen eG für den Merch-Verkauf klären
      (§ 19 UStG Kleinunternehmer? § 27a USt-IdNr.? Regelbesteuerung?).
- [ ] Erst danach entscheiden, ob und mit welcher Angabe („inkl. MwSt.“ / ohne
      USt-Ausweis) Preise öffentlich gezeigt werden dürfen (PreisangabenVO).
- [ ] Bis zur Klärung: keine öffentlichen Preise, kein pauschales „inkl. MwSt.“.

---

## D) Verpackungs-/Versandrecht (vor echtem Verkauf mit Versand, § 10 der Vorgabe)

- [ ] LUCID-Registrierung (VerpackG) prüfen/abschließen, bevor mit Versand verkauft wird.
- [ ] Versandprozess erst aufbauen, wenn D bestätigt ist.
