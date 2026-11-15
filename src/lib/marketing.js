/**
 * Werbe- und Statistikdienste, die erst nach Einwilligung laden (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO).
 *
 * Aktiv wird ein Dienst nur, wenn seine ID als Umgebungsvariable gesetzt ist (Vercel → Environment Variables,
 * danach neu deployen). Ohne IDs lädt nichts, und der Einwilligungsbanner erscheint gar nicht erst.
 *
 *   VITE_META_PIXEL_ID      Meta-Pixel (Facebook/Instagram), Kategorie Marketing
 *   VITE_GOOGLE_ADS_ID      Google Ads, z. B. AW-123456789, Kategorie Marketing
 *   VITE_GOOGLE_ADS_LEAD    Conversion-Label für Anfragen, z. B. AW-123456789/AbCdEf (optional)
 *   VITE_TIKTOK_PIXEL_ID    TikTok-Pixel, Kategorie Marketing
 *   VITE_GA4_ID             Google Analytics 4, z. B. G-ABC123, Kategorie Statistik
 *
 * Die Besucherzählung von Vercel (index.html) läuft unabhängig davon ohne Cookies und braucht keine Einwilligung.
 */

const env = import.meta.env
export const DIENSTE = {
  meta: env.VITE_META_PIXEL_ID || '',
  googleAds: env.VITE_GOOGLE_ADS_ID || '',
  googleAdsLead: env.VITE_GOOGLE_ADS_LEAD || '',
  tiktok: env.VITE_TIKTOK_PIXEL_ID || '',
  ga4: env.VITE_GA4_ID || '',
}

export const MARKETING_AKTIV = Boolean(DIENSTE.meta || DIENSTE.googleAds || DIENSTE.tiktok)
export const STATISTIK_AKTIV = Boolean(DIENSTE.ga4)
export const EINWILLIGUNG_NOETIG = MARKETING_AKTIV || STATISTIK_AKTIV

export const EREIGNIS = 'einwilligung-geaendert'
export const OEFFNEN = 'einwilligung-oeffnen'

function skript(src) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

let geladen = { statistik: false, marketing: false }

/** Lädt die Dienste, für die eingewilligt wurde. Mehrfacher Aufruf ist unschädlich. */
export function diensteLaden(w) {
  if (typeof window === 'undefined') return
  const f = window
  const statistik = w.statistik && STATISTIK_AKTIV && !geladen.statistik
  const marketing = w.marketing && MARKETING_AKTIV && !geladen.marketing

  if ((statistik && DIENSTE.ga4) || (marketing && DIENSTE.googleAds)) {
    if (!f.gtag) {
      f.dataLayer = f.dataLayer || []
      f.gtag = function gtag() { f.dataLayer.push(arguments) }
      f.gtag('consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
      f.gtag('js', new Date())
      skript(`https://www.googletagmanager.com/gtag/js?id=${DIENSTE.ga4 || DIENSTE.googleAds}`)
    }
    f.gtag('consent', 'update', {
      analytics_storage: w.statistik ? 'granted' : 'denied',
      ad_storage: w.marketing ? 'granted' : 'denied',
      ad_user_data: w.marketing ? 'granted' : 'denied',
      ad_personalization: w.marketing ? 'granted' : 'denied',
    })
    if (statistik && DIENSTE.ga4) f.gtag('config', DIENSTE.ga4)
    if (marketing && DIENSTE.googleAds) f.gtag('config', DIENSTE.googleAds)
  }

  if (marketing && DIENSTE.meta && !f.fbq) {
    /* Offizieller Meta-Pixel-Lader */
    const n = function (...a) { if (n.callMethod) n.callMethod(...a); else n.queue.push(a) }
    f.fbq = n
    if (!f._fbq) f._fbq = n
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []
    skript('https://connect.facebook.net/en_US/fbevents.js')
    f.fbq('init', DIENSTE.meta)
    f.fbq('track', 'PageView')
  }

  if (marketing && DIENSTE.tiktok && !f.ttq) {
    /* Offizieller TikTok-Pixel-Lader, gekürzt */
    f.TiktokAnalyticsObject = 'ttq'
    const ttq = []
    const methoden = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent']
    for (const m of methoden) ttq[m] = (...a) => { ttq.push([m, ...a]) }
    ttq.load = (id) => {
      ttq._i = ttq._i || {}
      ttq._i[id] = []
      skript(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${id}&lib=ttq`)
    }
    f.ttq = ttq
    ttq.load(DIENSTE.tiktok)
    ttq.page()
  }

  geladen = { statistik: geladen.statistik || statistik, marketing: geladen.marketing || marketing }
}

/** Seitenwechsel innerhalb der App (React Router) an die laufenden Dienste melden. */
export function meldeSeitenwechsel() {
  if (typeof window === 'undefined') return
  const f = window
  if (geladen.marketing) {
    f.fbq?.('track', 'PageView')
    f.ttq?.page?.()
  }
  if (f.gtag && (geladen.statistik || geladen.marketing)) {
    f.gtag('event', 'page_view', { page_location: location.href, page_path: location.pathname, page_title: document.title })
  }
}

/** Meldet eine abgeschickte Anfrage an die Dienste, die laufen (also nur mit Einwilligung). */
export function meldeAnfrage() {
  if (typeof window === 'undefined') return
  const f = window
  f.fbq?.('track', 'Lead')
  f.ttq?.track?.('SubmitForm')
  if (f.gtag) {
    if (geladen.statistik && DIENSTE.ga4) f.gtag('event', 'generate_lead')
    if (geladen.marketing && DIENSTE.googleAdsLead) f.gtag('event', 'conversion', { send_to: DIENSTE.googleAdsLead })
  }
}

/** Welche Dienste im Banner und in der Datenschutzerklärung genannt werden. */
export function aktiveDienste() {
  const l = []
  if (DIENSTE.ga4) l.push({ name: 'Google Analytics 4', zweck: 'statistik', anbieter: 'Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland', text: 'Misst, wie Besucher die Website nutzen (aufgerufene Seiten, Verweildauer, Herkunft). Setzt Cookies, die bis zu 2 Jahre gespeichert werden.' })
  if (DIENSTE.meta) l.push({ name: 'Meta-Pixel', zweck: 'marketing', anbieter: 'Meta Platforms Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irland', text: 'Misst, welche Anzeigen auf Facebook und Instagram zu Besuchen und Anfragen führen, und ermöglicht es, Besucher dort erneut anzusprechen. Setzt Cookies, die bis zu 90 Tage gespeichert werden.' })
  if (DIENSTE.googleAds) l.push({ name: 'Google Ads', zweck: 'marketing', anbieter: 'Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland', text: 'Misst, welche Google-Anzeigen zu Besuchen und Anfragen führen, und ermöglicht es, Besucher erneut anzusprechen. Setzt Cookies, die bis zu 90 Tage gespeichert werden.' })
  if (DIENSTE.tiktok) l.push({ name: 'TikTok-Pixel', zweck: 'marketing', anbieter: 'TikTok Technology Limited, 10 Earlsfort Terrace, Dublin 2, D02 T380, Irland', text: 'Misst, welche TikTok-Anzeigen zu Besuchen und Anfragen führen, und ermöglicht es, Besucher dort erneut anzusprechen. Setzt Cookies, die bis zu 13 Monate gespeichert werden.' })
  return l
}

export const DATENSCHUTZ_ALLGEMEIN =
  'Diese Dienste laden erst, wenn Sie im Einwilligungsbanner zustimmen (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO). ' +
  'Dabei werden unter anderem Ihre IP-Adresse, Geräte- und Browserangaben, die aufgerufenen Seiten und eine abgeschickte Anfrage (ohne deren Inhalt) an den jeweiligen Anbieter übertragen. ' +
  'Die Anbieter können diese Daten mit einem dort bestehenden Nutzerkonto verknüpfen und auch in den USA verarbeiten; die Übermittlung stützt sich auf das EU-U.S. Data Privacy Framework und Standardvertragsklauseln. ' +
  'Sie können Ihre Einwilligung jederzeit über „Cookie-Einstellungen“ am Seitenende widerrufen.'
