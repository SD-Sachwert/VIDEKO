import Reveal from '../components/Reveal.jsx'
import legalText from './datenschutz-text.txt?raw'

/**
 * ACHTUNG – INTERNER STATUS (nicht im öffentlichen Text sichtbar):
 *
 * Diese Datenschutzerklärung ist eine FAKTISCHE ROHFASSUNG. Sie wurde technisch
 * bereinigt (falsche Dienste Strato-Hosting, „Real Cookie Banner“ und Google
 * Drive entfernt, defektes HTML-Markup beseitigt) und benennt nur die
 * tatsächlich eingesetzten Dienste (Vercel, Supabase inkl. Datei-Speicher,
 * SMTP-Mailversand, funktionaler localStorage, lokale Google Fonts,
 * mailto-Anfrage im Merch-Bereich, Kontakt-/Beratungs-/Bewerbungs-/
 * Stilfinder-Formulare über /api/lead).
 *
 * Sie ist NOCH NICHT anwaltlich bzw. durch einen Rechtstexte-Anbieter geprüft
 * und bleibt damit ein Livegang-Blocker. Vor Freischaltung offen (siehe
 * docs/compliance/DATENSCHUTZ-RECHTSTEXTE-CHECKLISTE.md): AV-Verträge nach
 * Art. 28 DSGVO (Vercel, Supabase, ggf. SMTP-Anbieter), Bestätigung der
 * Anbieteranschriften und Drittland-/Transfermechanismen sowie die finale
 * juristische Prüfung des Gesamttextes.
 */

// line-based parser: numbered lines -> h2, short heading-like lines -> h3, rest -> p
const ELEMENTS = legalText
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l, idx) => {
    if (/^\d+\.\s/.test(l)) return { tag: 'h2', text: l, key: idx }
    const headingLike = l.length < 95 && /[A-ZÄÖÜ0-9]/.test(l[0]) && !/[.:,;]$/.test(l)
    return { tag: headingLike ? 'h3' : 'p', text: l, key: idx }
  })

export default function Datenschutz() {
  return (
    <>
      <section className="section section--light legal-page">
        <div className="container">
          <Reveal className="legal-head">
            <span className="kicker kicker--gold">Rechtliches</span>
            <h1 className="legal-head__title">Datenschutz</h1>
          </Reveal>
          <Reveal className="legal legal--doc">
            {ELEMENTS.map((el) =>
              el.tag === 'h2' ? <h2 key={el.key}>{el.text}</h2>
                : el.tag === 'h3' ? <h3 key={el.key}>{el.text}</h3>
                  : <p key={el.key}>{el.text}</p>
            )}
          </Reveal>
        </div>
      </section>
    </>
  )
}
