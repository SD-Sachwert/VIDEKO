import nodemailer from 'nodemailer'

/**
 * Der eine Mailweg der Website: SMTP (Strato) ueber nodemailer.
 *
 * api/notify.js und api/terminal.js teilen ihn — es gibt keine zweite
 * Mail-Loesung daneben. Zugangsdaten kommen ausschliesslich aus der Umgebung
 * und werden erst beim Aufruf gelesen.
 *
 * Der fuehrende Unterstrich haelt die Datei aus dem Routing: ein Modul, keine
 * oeffentliche URL.
 */

/** Ohne Benutzer und Passwort wird gar nicht erst versucht zu senden. */
export function mailBereit() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)
}

export function mailTransport(extra = {}) {
  const { SMTP_HOST = 'smtp.strato.de', SMTP_PORT = '465', SMTP_USER, SMTP_PASS } = process.env
  return nodemailer.createTransport({
    host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    ...extra,
  })
}

export const mailAbsender = () => `"VIDEKO Küchen" <${process.env.SMTP_USER}>`
