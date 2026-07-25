# Barrierefreiheitsbericht – VIDEKO Textilshop

Stand: interne Selbstprüfung des Frontends. Rechtlicher Hintergrund:
Barrierefreiheitsstärkungsgesetz (BFSG), gilt seit **28.06.2025** u. a. für
Verbraucher-Onlineshops. Dieser Bericht ist eine **technische Bestandsaufnahme**,
kein Ergebnis einer externen, zertifizierten Prüfung.

## Legende

- ✅ erfüllt / im Code umgesetzt
- ⚠️ teilweise / zu prüfen
- ❌ nicht erfüllt
- 🔎 externe Prüfung empfohlen

## Prüfpunkte

| Kriterium | Status | Anmerkung |
|---|---|---|
| Tastaturbedienbarkeit (Navigation, Buttons, Warenkorb) | ✅ | Interaktive Elemente sind native `<button>`/`<a>`; Warenkorb per ESC schließbar |
| Fokus sichtbar | ⚠️ | Browser-Standardfokus vorhanden; dedizierte, kontrastreiche `:focus-visible`-Stile stichprobenartig zu ergänzen |
| Warenkorb-Overlay nicht fokussierbar, wenn geschlossen | ✅ | `inert` + `aria-hidden` gesetzt, wenn geschlossen |
| Alt-Texte für Produkt-/Inhaltsbilder | ✅ | Produktbilder mit beschreibendem `alt`; dekorative Bilder `alt=""` |
| Sinnvolle Überschriftenstruktur | ⚠️ | h1–h3 vorhanden; vollständige Hierarchie je Seite zu prüfen |
| Formular-Labels (Kontakt, Lead, Newsletter) | ⚠️ | Labels/Platzhalter vorhanden; explizite `<label for>`-Zuordnung stichprobenartig prüfen |
| Fehlermeldungen wahrnehmbar | ⚠️ | Statushinweise vorhanden; `aria-live` für Formularfehler zu ergänzen |
| Klick-/Touch-Ziele groß genug (min. ~44px) | ⚠️ | Buttons ausreichend; kleine Icon-Buttons (Menge +/–) prüfen |
| Farbkontrast Text/Hintergrund | 🔎 | Beige/Serif-Töne messtechnisch gegen WCAG AA prüfen |
| Mobile Nutzbarkeit / Zoom bis 200 % | ⚠️ | Responsive Layout vorhanden; 200 %-Zoom testen |
| Screenreader: Warenkorb, Dialoge | ⚠️ | Warenkorb hat `aria-label`; Zoom-Lightbox hat `role="dialog"`/`aria-modal`; mit echtem Screenreader testen |
| Barrierefreier Checkout | ❌ | Es gibt (noch) keinen echten On-Site-Checkout (mailto-Flow). Bei Einführung eines Zahlungs-Checkouts erneut voll prüfen |

## Im Rahmen dieser Runde umgesetzt

- Warenkorb-Overlay erhält `inert`, wenn geschlossen → keine „unsichtbaren"
  fokussierbaren Elemente mehr.
- Alt-Texte und ARIA-Labels der Warenkorb-/Galerie-Interaktionen kontrolliert
  (bereits vorhanden).

## Offen / empfohlen

- [ ] Durchgängige `:focus-visible`-Stile mit hohem Kontrast definieren.
- [ ] Farbkontraste mit einem Tool (z. B. axe / Lighthouse) gegen **WCAG 2.1 AA** messen.
- [ ] `aria-live`-Region für Formular-Feedback ergänzen.
- [ ] Test mit echtem Screenreader (NVDA/VoiceOver) und reiner Tastaturbedienung.
- [ ] Vor Verkaufsstart eine **externe Barrierefreiheitsprüfung** beauftragen (🔎).

## Gesamteinschätzung

**Solide Grundlage, aber nicht abschließend geprüft.** Die tragenden Elemente sind
tastaturbedienbar und semantisch ausgezeichnet. Für eine belastbare BFSG-Konformität
sind Kontrastmessung, Screenreader-Test und – bei Einführung eines echten Checkouts –
eine externe Prüfung erforderlich.
