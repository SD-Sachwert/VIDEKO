# Dienste & Datenverarbeitung (DSGVO / Cookies)

Inventar aller Dienste, die personenbezogene Daten verarbeiten oder auf dem Endgerät
speichern könnten. Grundlage für Datenschutzerklärung und die Entscheidung, ob ein
Cookie-/Consent-Banner nötig ist.

## Ist-Zustand (im Code geprüft)

| Dienst / Technik | Eingesetzt? | Kategorie | Consent nötig? |
|---|---|---|---|
| Google Analytics / andere Analyse | **nein** | – | – |
| Meta-Pixel / TikTok-Pixel / Ads | **nein** | – | – |
| Google Fonts (extern geladen) | **nein – selbst gehostet** (`src/assets/fonts/`) | – | nein |
| YouTube / Vimeo / Spotify-Embeds | **nein** | – | – |
| Externe Bilder / CDN-Skripte | **nein** (alle Assets lokal gebündelt) | – | nein |
| Social-Media-Buttons mit Tracking | **nein** | – | – |
| Warenkorb (`localStorage`) | **ja** | technisch notwendig / funktional | **nein** |
| Kontakt-/Lead-Formular → `api/lead` | **ja** | Auftragsverarbeitung (E-Mail/Supabase) | nein (Vertragsanbahnung) |
| Bestell-/Interesse-Meldung → `api/notify` | **ja** | Auftragsverarbeitung (E-Mail/Supabase) | nein (Vertragsanbahnung) |
| Hosting (Vercel) | **ja** | Server-Logs / Auslieferung | AV-Vertrag prüfen |
| Supabase (Datenspeicher) | **ja, falls konfiguriert** | Auftragsverarbeitung | AV-Vertrag prüfen |
| SMTP-Versand (Nodemailer) | **ja, falls konfiguriert** | Auftragsverarbeitung | AV-Vertrag prüfen |

## Bewertung Cookie-/Consent-Banner

Aktuell werden **keine nicht-notwendigen Cookies oder Tracker** gesetzt. Es gibt nur
funktional notwendigen `localStorage` (Warenkorb). Nach § 25 Abs. 2 TDDDG ist dafür
**keine Einwilligung** erforderlich → ein Cookie-Consent-Banner ist derzeit **nicht
zwingend**.

> **Wichtig:** Sobald ein Analyse-/Marketing-Dienst, ein externes Embed, ein
> Zahlungs-Widget mit eigenem Tracking oder ein Newsletter-Tool hinzukommt, ist ein
> Consent-Banner mit **gleichwertigen** Schaltflächen („Alle akzeptieren" /
> „Ablehnen" / „Einstellungen") **ohne Dark Patterns** nötig. Nicht-notwendige
> Cookies dürfen dann **erst nach aktiver Einwilligung** geladen werden.

## Offene Aufgaben

- [ ] Auftragsverarbeitungsverträge (AV / Art. 28 DSGVO) mit **Vercel**, **Supabase**
      und dem **SMTP-/Mailanbieter** abschließen und ablegen.
- [ ] Datenschutzerklärung final prüfen lassen; obige Dienste dort benennen.
- [ ] Bei künftigem Zahlungsanbieter (z. B. Stripe/PayPal): erneut Consent-Bedarf
      und AV-Vertrag prüfen.
- [ ] Serverstandorte / Drittlandtransfer der Dienste dokumentieren.

## Status

**Technisch schlank (gut).** Keine Tracker, Fonts lokal, keine externen Embeds.
Offen sind die **AV-Verträge** und die finale juristische Prüfung der Datenschutzerklärung.
