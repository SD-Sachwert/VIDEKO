# Environment-Setup

Alle Variablen sind in `.env.example` aufgeführt. Diese Datei erklärt, wofür sie
gebraucht werden, was ohne sie nicht läuft und wie man sie einträgt.

---

## 1. Kurzfassung

```bash
npx vercel link                 # einmalig: Projekt "videko" verknüpfen
npx vercel env pull .env.local  # holt die echten Werte von Vercel
npm run dev
```

`.env.local` ist in `.gitignore` und darf **nie** committet werden.
`.env.example` enthält ausschließlich Platzhalter und wird versioniert.

---

## 2. Welche Variable wofür

### Formularversand (Server)

| Variable | Wofür |
|---|---|
| `SMTP_HOST` | Mailserver von Strato |
| `SMTP_PORT` | 465 für SSL |
| `SMTP_USER` | Absenderpostfach |
| `SMTP_PASS` | Passwort des Postfachs |
| `LEAD_NOTIFY_TO` | Adresse, die die Anfragen erhält |

Verwendet in `api/lead.js`. Betrifft **Beratungsformular**, **Karriereformular**
und den Abschluss des **Stylefinders**.

### Lead-Speicherung und Uploads

| Variable | Wofür |
|---|---|
| `SUPABASE_URL` | Projekt-URL, serverseitig |
| `SUPABASE_SERVICE_KEY` | Service-Role-Key, **nur serverseitig** |
| `VITE_SUPABASE_URL` | Projekt-URL für den Browser |
| `VITE_SUPABASE_ANON_KEY` | Anon-Key für den Datei-Upload im Stylefinder |

Der Service-Role-Key hat volle Rechte auf die Datenbank. Er darf niemals ein
`VITE_`-Prefix bekommen, sonst landet er im ausgelieferten JavaScript.

### Merch-Shop (vorbereitet, noch nicht verdrahtet)

| Variable | Wofür |
|---|---|
| `VITE_SHOP_ORDER_MAIL` | Zieladresse der Bestellmail |
| `VITE_SHOP_NOTIFY_MAIL` | Zieladresse für „Benachrichtige mich“ |
| `SHOP_NOTIFY_TABLE` | Tabelle für gesammelte Vormerkungen |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Öffentlicher Key des Checkouts |
| `STRIPE_SECRET_KEY` | Geheimer Key, **nur serverseitig** |
| `STRIPE_WEBHOOK_SECRET` | Signaturprüfung eingehender Webhooks |
| `SHIPPING_PROVIDER_API_KEY` | Versandlabels, optional |
| `VITE_ANALYTICS_ID` | Web-Analyse, optional |

---

## 3. Was ohne `.env.local` NICHT läuft

Lokal ohne Umgebungsvariablen:

| Funktion | Status ohne `.env.local` |
|---|---|
| Beratungsformular | **läuft nicht** – Absenden schlägt fehl |
| Karriereformular | **läuft nicht** – Absenden schlägt fehl |
| Stylefinder, Abschluss & Upload | **läuft nicht** |
| Merch-Shop, Katalog & Filter | läuft |
| Merch-Shop, Warenkorb & Persistenz | läuft |
| Merch-Shop, Bestellung per Mail | läuft (öffnet das Mailprogramm) |
| „Benachrichtige mich“ | läuft (öffnet das Mailprogramm) |
| Alle übrigen Seiten | laufen |

Der Shop ist also vollständig ohne Umgebungsvariablen testbar. Nur die drei
Formulare brauchen Zugangsdaten.

---

## 4. Variablen eintragen

### Lokal

Bevorzugt per `npx vercel env pull .env.local`. Alternativ `.env.example` nach
`.env.local` kopieren und die Platzhalter ersetzen:

```bash
cp .env.example .env.local
```

Nach jeder Änderung an `.env.local` den Dev-Server neu starten – Vite liest die
Datei nur beim Start.

### Auf Vercel

1. Vercel-Dashboard → Projekt **videko** → *Settings* → *Environment Variables*
2. Name und Wert eintragen
3. Environment wählen: *Production*, *Preview* und/oder *Development*
4. Speichern und **neu deployen** – bestehende Deployments ziehen die Werte
   nicht nachträglich

Variablen ohne `VITE_`-Prefix stehen nur den Serverless Functions unter
`api/` zur Verfügung. Variablen mit `VITE_`-Prefix werden zur Buildzeit fest
ins Bundle geschrieben; eine Änderung wirkt erst nach einem neuen Build.

---

## 5. Sicherheitsregeln

- Keine echten Werte in `.env.example`, in Commits oder in Screenshots.
- `SUPABASE_SERVICE_KEY`, `STRIPE_SECRET_KEY`, `SMTP_PASS` und
  `STRIPE_WEBHOOK_SECRET` sind Geheimnisse und bleiben serverseitig.
- Ein versehentlich committetes Geheimnis gilt als kompromittiert und muss
  beim jeweiligen Anbieter neu erzeugt werden – Löschen aus der Historie
  reicht nicht.
