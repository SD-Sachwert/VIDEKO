import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import Rangliste from '../components/Rangliste.jsx'
import Seo from '../components/Seo.jsx'
import TerminalRahmen, { Raute, Schriftzug, Truhe } from '../components/TerminalRahmen.jsx'
import { SPEICHER_SITZUNG, merkeLesen } from '../data/terminal-api.js'
import { TEXTE } from '../data/terminal.js'

/**
 * /terminal/rangliste — das oeffentliche Leaderboard.
 *
 * Dieselbe schwarze Marmorwelt wie das Terminal, dieselbe Truhe, dieselben
 * goldenen Rahmen — nur mit einer Bestenliste darin. Kein eigener Look.
 *
 * Die Seite braucht keinen Code und keine Aktivierung: sie ist oeffentlich.
 * Liegt zufaellig ein Sitzungsbeleg im Speicher, wird der eigene Platz
 * hervorgehoben; ohne Beleg fehlt nur diese Zeile.
 *
 * Der Beleg wird erst nach dem ersten Rendern gelesen. Die Seite wird beim
 * Bauen statisch vorgerendert, und ein Wert aus dem Browserspeicher gibt es
 * dort nicht — also muss der erste Durchlauf im Browser genauso aussehen.
 */

export default function TerminalRangliste() {
  const [sitzung, setSitzung] = useState(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSitzung(merkeLesen(SPEICHER_SITZUNG))
  }, [])

  return (
    <>
      <Seo
        title="Leaderboard | VIDEKO Küchen"
        description="Die besten Läufe aus Truhenknacker und Goldrausch."
        canonicalPath="/terminal/rangliste"
        noindex
        nofollow
      />

      <TerminalRahmen>
        <h1 className="trm-titel trm-gold">{TEXTE.r.titel}</h1>
        <p className="trm-sub">{TEXTE.r.sub}</p>
        <Raute />

        <Truhe>
          <Schriftzug />
        </Truhe>

        <Rangliste sitzung={sitzung} />

        <p className="trm-zeile">
          <span className="trm-zeile__text">{TEXTE.g.hinweis}</span>
          <Link className="trm-cta trm-cta--umriss trm-cta--klein" to="/terminal">
            <ArrowLeft size={16} aria-hidden="true" />
            Zum Terminal
          </Link>
        </p>
      </TerminalRahmen>
    </>
  )
}
