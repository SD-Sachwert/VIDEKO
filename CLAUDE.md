# VIDEKO — Marketing- & Lead-Website für ein Küchenstudio (Stylefinder, Beratungsformulare, 3D-Experience).

## Stack
- **Vite 8** + **React 19** (kein Next.js, kein SSR — reine SPA)
- **React Router 7** (Client-Routing, Routen in `src/App.jsx`)
- **Supabase**: Leads (Tabelle `videko_leads`) + Storage (Bucket `lead-uploads`)
- **Strato-SMTP** via `nodemailer` in der Node-API `api/lead.js`
- 3D: **Three.js** + `@react-three/fiber` / `drei` · Animation: **GSAP**, **Framer Motion**, Smooth-Scroll: **Lenis**
- Eigene Supabase-DB „VIDEKO" (ref `lzduddprotxpybczffjx`)

## Entwicklung
- `npm run dev` — Dev-Server (Vite). ⚠️ Es ist **VITE + React, NICHT Next.js**. Startet **NUR das Frontend** — die Mail-API `api/lead.js` ist eine **Vercel-Serverless-Funktion** und läuft lokal **NICHT** (Formular-Versand erst auf Preview/Prod testbar).
- `npm run build` — Production-Build · `npm run preview` — Build lokal ansehen · `npm run lint` — ESLint

## Deploy
- GitHub-Repo: **SD-Sachwert/VIDEKO**, Branch **main** → Vercel deployt automatisch nach **videko-kuechen.de**.
- **Push nach `main` = LIVE, kundenseitig.** Kein Staging dazwischen.
- Sicheres Testen: **Feature-Branch → Preview-URL** prüfen → erst dann nach `main` mergen.

## Architektur
- `src/pages/*` — Routen-Seiten · `src/components/*` — UI-Bausteine
- `src/components/experience/*` — 3D-Szenen (React Three Fiber, opt-in-Route `/experience`)
- `src/components/stylefinder/*` — Stylefinder-Flow (Wizard → Ergebnis → Lead)
- `api/lead.js` — Serverless-Endpoint: validiert, speichert Lead in Supabase, erzeugt signierte Storage-Links, versendet interne + Kunden-Mail über Strato-SMTP. Honeypot-Feld `website`, Server-Defaults für SMTP/Bucket.
- `src/assets/_prompts/*` — interne Notizen/Prompts (kein Code; aus Vite-Watcher ausgenommen)

## ⚠️ Wichtig / Stolperfallen
- **Mail-API läuft nicht im `npm run dev`** — Versand nur auf Vercel (Preview/Prod) testbar.
- **`SHOW_MAIL_SEND = false`** in `src/components/stylefinder/StylefinderFlow.jsx` — Mail-Versand aus dem Stylefinder ist **bewusst deaktiviert**. Nicht versehentlich anschalten.
- `SUPABASE_SERVICE_KEY` ist geheim — **niemals** ins Frontend importieren, nur in `api/`.
- Vite-Watcher ignoriert `src/assets/**` und `*.txt` (verhindert EBUSY-Crash bei Asset-Drops auf Windows).
- Push nach `main` geht sofort live → siehe Deploy.

## Env-Variablen
Werte liegen verschlüsselt auf Vercel (`npx vercel env pull .env.local`). Doku in `.env.example`.
- **Frontend (öffentlich, `VITE_`-Präfix, im Browser sichtbar):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Server (`api/lead.js`, geheim, nie im Frontend):** `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `LEAD_NOTIFY_TO`
- Faustregel: nur `VITE_`-Variablen landen im Browser-Bundle; alles ohne Präfix bleibt serverseitig.
