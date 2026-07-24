# Checkout-Gap-Report

Sachliche Bestandsaufnahme, was für einen echten Online-Checkout des VIDEKO
Merch-Shops noch fehlt. **Es wird bewusst kein Zahlungsanbieter vorausgewählt
oder angebunden** – das ist eine Geschäftsentscheidung.

## 1. Aktueller Bestellweg

- Der Warenkorb ist voll funktionsfähig (Hinzufügen, Menge, Entfernen,
  Persistenz via `localStorage`, Varianten inkl. Logo-Platzierung und
  Personalisierung).
- „Zur Kasse" erzeugt aktuell eine **vorausgefüllte E-Mail** (`mailto:`) mit
  allen Positionen, Zwischensumme, Versand und Gesamtsumme. Der Kunde schickt
  sie ab, das Team stellt eine Rechnung mit Überweisungsdaten.
- Es gibt **keine** serverseitige Bestellverarbeitung, keine Zahlung, keinen
  Bestellstatus.

## 2. Fehlende Checkout-Seite

- Keine Route `/merch/checkout` mit Adress-/Rechnungsformular, Versandart-Wahl,
  Zusammenfassung und Bestätigungsschritt.
- Keine Validierung von Liefer-/Rechnungsadresse.
- Keine Gast-/Konto-Unterscheidung.

## 3. Fehlender Zahlungsanbieter

- Kein Payment-Provider angebunden (Stripe, PayPal, Mollie o. Ä.).
- In `.env.example` sind Platzhalter für Stripe vorbereitet
  (`VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`),
  aber **nicht** aktiviert und **nicht** als Entscheidung zu verstehen.
- Es fehlt: Payment-Intent-Erzeugung (serverseitig), Client-Bezahlfeld,
  3-D-Secure-Handling, Webhook-Endpoint zur Zahlungsbestätigung.

## 4. Fehlende Versandlogik

- Versandkosten sind aktuell eine einfache Regel (`shop-config.json`:
  Pauschale, Gratis-Schwelle). Keine gewichts-/länderabhängige Berechnung.
- Keine Anbindung an einen Versanddienstleister, keine Label-Erstellung,
  kein Tracking (`SHIPPING_PROVIDER_API_KEY` ist nur ein Platzhalter).
- Keine Lieferländer-/Zonen-Konfiguration.

## 5. Fehlende Bestellbestätigung

- Keine Bestell-ID, keine Bestätigungsseite `/merch/bestellung/:id`.
- Keine automatische Bestätigungs-E-Mail mit Bestellzusammenfassung an den
  Kunden (die Infrastruktur dafür – SMTP via `api/lead.js` / `api/notify.js` –
  ist vorhanden und könnte wiederverwendet werden).
- Keine Statusmails (bezahlt, versandt).

## 6. Fehlende Lagerlogik

- Kein Bestand/Inventar. Produkte kennen nur `status: live | coming_soon`,
  keine Stückzahlen, keine Reservierung, keine „ausverkauft"-Logik.
- Keine Größen-/Variantenbestände.
- Kein Schutz gegen Überverkauf.

## 7. Bereits vorhandene, wiederverwendbare Bausteine

- **Warenkorb-Datenmodell** (`CartContext.jsx`): Positionen mit `id, size,
  color, placement, placementLabel, pers, qty` – bereits checkout-tauglich
  strukturiert.
- **Preis-/Summenlogik**: Zwischensumme, Versand, Gesamt, Personalisierungs-
  aufpreis – alles in Cent, korrekt gerundet.
- **Personalisierungsdaten**: Name, Druckposition, Zeichenlimit liegen je
  Position vor und wandern bereits in die Bestell-Mail.
- **Serverless-Mailversand** (`api/lead.js`, `api/notify.js`) inkl. Supabase-
  Speicherung – als Vorlage für einen Order-Endpoint nutzbar.
- **Produktquelle** (`products.json` + `merch.js`): eindeutige Produkt-/
  Varianten-IDs für Bestellpositionen.

## 8. Was für einen echten Checkout noch gebaut werden muss

1. **Order-Endpoint** `api/order.js`: Bestellung validieren, Bestand prüfen,
   in Supabase (`videko_orders`) anlegen, Zahlung anstoßen.
2. **Checkout-Seite** mit Adressformular, Versandart, Zusammenfassung.
3. **Payment-Integration** (nach Anbieter-Entscheidung): Client-Bezahlfeld +
   serverseitige Intent-Erzeugung + Webhook zur Bestätigung.
4. **Versand**: Zonen/Kosten-Konfiguration, optional Dienstleister-Anbindung.
5. **Bestandsverwaltung**: Inventar je Produkt/Größe, Reservierung im Checkout,
   Ausverkauft-Zustände im UI.
6. **Bestellbestätigung**: Bestell-ID, Bestätigungsseite, Kunden- und
   Team-Mails, Statusmails.
7. **Rechtliches im Kauffluss**: AGB-/Widerrufs-Checkbox, Preisangaben-
   verordnung, Bestell-Button-Beschriftung („zahlungspflichtig bestellen").

## Empfehlung

Der Mail-Bestellweg trägt für einen Soft-Launch der kaufbaren T-Shirts. Für
einen echten Shop zuerst Anbieter-Entscheidung (Payment + Versand), dann
Punkte 1–7 in dieser Reihenfolge.
