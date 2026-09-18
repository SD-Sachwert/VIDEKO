import { Link } from 'react-router-dom'

import Seo from '../components/Seo.jsx'
import { STADTFEST_EVENT } from '../data/stadtfest.js'
import { AUSHANG_KURZBLOCK, TEILNAHMEBEDINGUNGEN } from '../data/stadtfest-recht.js'

/**
 * Vollständige Teilnahme- und Gewinnbedingungen der Stadtfest-Aktion.
 *
 * Eigene, öffentlich erreichbare Route — ohne Login, ohne Layout-Header, mit
 * noindex/nofollow und nicht in der Sitemap. Sie existiert, damit der
 * Pflichthaken im Formular auf einen dauerhaften Link zeigt und damit am
 * Stand ein Ausdruck zur Hand ist.
 *
 * Der Text selbst steht nicht hier, sondern in data/stadtfest-recht.js. Diese
 * Seite rendert ihn nur — damit Bottom-Sheet, Seite und Aushang denselben
 * Wortlaut zeigen.
 *
 * Ganz oben steht der Kurzblock für den A4-Aushang. Beim Drucken der Seite
 * (Print-CSS in stadtfest.css) bleibt er stehen; die Navigation verschwindet.
 */
export default function StadtfestTeilnahme() {
  return (
    <>
      <Seo
        title={`Teilnahme- und Gewinnbedingungen | ${STADTFEST_EVENT.name}`}
        description="Vollständige Teilnahme- und Gewinnbedingungen der VIDEKO Aktion am Würzburger Stadtfest."
        canonicalPath="/stadtfest/teilnahmebedingungen"
        noindex
        nofollow
      />

      <main className="stf stf-recht">
        <div className="stf__spalte">
          <p className="stf-recht__zurueck stf-nodruck">
            <Link className="stf-link" to="/stadtfest">
              ← Zurück zur Aktionsseite
            </Link>
          </p>

          {/* Der druckfähige Kurzblock. Steht bewusst ganz oben: Wer am Stand
              nachfragt, bekommt die Antwort in sieben Zeilen. */}
          <section className="stf-aushang" aria-label={AUSHANG_KURZBLOCK.titel}>
            <p className="stf-aushang__titel">{AUSHANG_KURZBLOCK.titel}</p>
            <ul className="stf-aushang__liste">
              {AUSHANG_KURZBLOCK.zeilen.map((zeile) => (
                <li className="stf-aushang__zeile" key={zeile}>
                  {zeile}
                </li>
              ))}
            </ul>
          </section>

          <header className="stf-recht__kopf">
            <h1 className="stf-recht__titel">
              Teilnahme- und Gewinnbedingungen
              <span className="stf-recht__titel-zusatz">{TEILNAHMEBEDINGUNGEN.untertitel}</span>
            </h1>
            <p className="stf-recht__hinweis">{TEILNAHMEBEDINGUNGEN.hinweis}</p>
          </header>

          {TEILNAHMEBEDINGUNGEN.abschnitte.map((abschnitt) => (
            <section className="stf-recht__abschnitt" key={abschnitt.titel}>
              <h2 className="stf-recht__h">{abschnitt.titel}</h2>
              {abschnitt.absaetze.map((absatz) => (
                <p className="stf-recht__p" key={absatz.slice(0, 48)}>
                  {absatz}
                </p>
              ))}
            </section>
          ))}

          <section className="stf-recht__abschnitt">
            <h2 className="stf-recht__h">Datenschutz und Anbieterangaben</h2>
            <p className="stf-recht__p">
              Wie deine Daten verarbeitet werden, steht in der{' '}
              <a className="stf-recht__extern" href="/datenschutz">
                Datenschutzerklärung
              </a>
              . Die Angaben zum Anbieter stehen im{' '}
              <a className="stf-recht__extern" href="/impressum">
                Impressum
              </a>
              . Die zusätzlichen Datenschutzhinweise zur Aktion sind direkt auf der{' '}
              <Link className="stf-recht__extern" to="/stadtfest">
                Aktionsseite
              </Link>{' '}
              abrufbar.
            </p>
          </section>

          <p className="stf-recht__stand">Stand: {TEILNAHMEBEDINGUNGEN.stand}</p>
        </div>
      </main>
    </>
  )
}
