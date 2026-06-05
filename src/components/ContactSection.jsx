import { useState } from 'react'
import { MapPin, Mail, Phone } from 'lucide-react'
import Reveal from './Reveal.jsx'

export default function ContactSection() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    // Demo only — wire to a real endpoint later.
    setSent(true)
  }

  return (
    <section className="contact">
      <div className="container contact__inner">
        <Reveal className="contact__form-wrap">
          <form className="contact__form" onSubmit={handleSubmit}>
            <div className="contact__row">
              <label className="field">
                <span>Name</span>
                <input type="text" name="name" required placeholder="Dein Name" />
              </label>
              <label className="field">
                <span>E-Mail</span>
                <input type="email" name="email" required placeholder="name@beispiel.de" />
              </label>
            </div>
            <div className="contact__row">
              <label className="field">
                <span>Telefon</span>
                <input type="tel" name="phone" placeholder="Optional" />
              </label>
              <label className="field">
                <span>Projektart</span>
                <select name="projektart" defaultValue="">
                  <option value="" disabled>Bitte wählen</option>
                  <option>Neue Küche</option>
                  <option>Renovierung</option>
                  <option>Neubau</option>
                  <option>Mietobjekt</option>
                  <option>Sonstiges</option>
                </select>
              </label>
            </div>
            <div className="contact__row">
              <label className="field">
                <span>Budgetbereich <em>(optional)</em></span>
                <select name="budget" defaultValue="">
                  <option value="" disabled>Bitte wählen</option>
                  <option>5.000–12.500 €</option>
                  <option>12.500–18.000 €</option>
                  <option>18.000–25.000 €</option>
                  <option>25.000–40.000 €</option>
                  <option>40.000 €+</option>
                </select>
              </label>
              <label className="field">
                <span>Zeitplan</span>
                <select name="zeitplan" defaultValue="">
                  <option value="" disabled>Bitte wählen</option>
                  <option>So bald wie möglich</option>
                  <option>In 1–3 Monaten</option>
                  <option>In 3–6 Monaten</option>
                  <option>In 6–12 Monaten</option>
                  <option>Nur Orientierung</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>Nachricht</span>
              <textarea name="message" rows={4} placeholder="Erzähl uns von deinem Projekt …" />
            </label>

            <button className="btn btn--primary btn--lg" type="submit">
              <span className="btn__shimmer" aria-hidden="true" />
              <span className="btn__label">Beratung anfragen</span>
            </button>

            {sent && (
              <p className="contact__ok" role="status">
                Danke! Deine Anfrage ist eingegangen — wir melden uns persönlich.
                <br />
                <em>(Demo-Formular — Versand wird später angebunden.)</em>
              </p>
            )}
          </form>
        </Reveal>

        <Reveal className="contact__info" delay={0.08}>
          <h3 className="contact__info-title">VIDEKO Küchen eG</h3>
          <ul className="contact__list">
            <li>
              <MapPin size={17} strokeWidth={1.7} />
              <span>Hertzstraße 4<br />97076 Würzburg</span>
            </li>
            <li>
              <Mail size={17} strokeWidth={1.7} />
              <a href="mailto:info@videko-kuechen.de">info@videko-kuechen.de</a>
            </li>
            <li>
              <Phone size={17} strokeWidth={1.7} />
              <a href="tel:+491605545818">0160 5545818</a>
            </li>
          </ul>
          <p className="contact__note">
            Wir melden uns persönlich. Keine Callcenter-Nummer. Kein Küchenbasar.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
