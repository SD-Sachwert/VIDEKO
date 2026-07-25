# Schriftlizenzen (selbst gehostete Fonts)

Der Shop lädt keine Schriften mehr von externen Servern, sondern hostet sie selbst
(`src/assets/fonts/`, eingebunden über `src/fonts.css`). Damit das rechtlich sauber
ist, hier Herkunft und Lizenz der verwendeten Schriften.

## Verwendete Schriften

| Schrift | Dateien | Herkunft | Lizenz | Self-Hosting | Kommerzielle Nutzung |
|---|---|---|---|---|---|
| **Cormorant Garamond** | `cormorant-400/500/600/700.woff2` | Google Fonts (`fonts.googleapis.com`), Designer Christian Thalmann / Catharsis Fonts | SIL Open Font License 1.1 | ✅ erlaubt | ✅ erlaubt |
| **Inter** | `inter-300/400/500/600/700.woff2` | Google Fonts (`fonts.googleapis.com`), Designer Rasmus Andersson | SIL Open Font License 1.1 | ✅ erlaubt | ✅ erlaubt |

Bezug reproduzierbar über `scripts/fetch-fonts.mjs` (lädt die von Google Fonts
ausgelieferten woff2-Dateien, latin-Subset).

## SIL Open Font License 1.1 – Kernpunkte

Die OFL 1.1 erlaubt ausdrücklich:

- **Verwendung** (auch kommerziell) ohne Lizenzgebühr,
- **Einbetten / Self-Hosting** auf eigenen Servern und in Webseiten,
- Weitergabe und Bündelung mit eigenen Produkten.

Bedingungen (erfüllt bzw. unproblematisch für die Web-Nutzung):

- Die Schriften dürfen **nicht als solche verkauft** werden (tun wir nicht – sie sind
  Teil der Website, nicht das verkaufte Produkt).
- Bei Weitergabe muss der **Lizenztext beiliegen**; der Name „Reserved Font Name"
  darf nicht für abgeleitete Versionen genutzt werden (wir verändern die Fonts nicht).

## Lizenznachweise (lokal abgelegt)

Die vollständigen Lizenztexte liegen als Kopie in diesem Ordner:

- [`OFL-Cormorant.txt`](OFL-Cormorant.txt) – aus github.com/CatharsisFonts/Cormorant,
  „Copyright 2015 the Cormorant Project Authors", SIL Open Font License 1.1.
- [`OFL-Inter.txt`](OFL-Inter.txt) – aus github.com/rsms/inter,
  „Copyright (c) 2016 The Inter Project Authors", SIL Open Font License 1.1.

## Fazit

Self-Hosting und kommerzielle Nutzung beider Schriften sind durch die **SIL Open
Font License 1.1 gedeckt**; die Lizenztexte liegen lokal vor. **Kein Launch-Blocker.**
