import { Ikon } from './TerminalRahmen.jsx'
import { SPIEL_NACH_KEY, TEXTE, fuelle, zahl } from '../data/terminal.js'

/**
 * Gesamtranking ueber die fuenf Hauptgames — Bausteine fuer Dashboard und
 * Rangliste.
 *
 * Gerechnet wird hier nichts. Plaetze, Rangpunkte und die Luecke zum naechsten
 * Platz kommen fertig vom Server (api/_terminal-gesamtranking.js).
 */

const T = TEXTE.r

export const spielTitel = (key) => SPIEL_NACH_KEY[key]?.titel ?? key

/**
 * Die Zusatzpreise. Steht nur da, wenn in der Verwaltung mindestens ein Preis
 * eingetragen ist — ohne Eintrag wird nichts versprochen.
 */
export function GesamtPreise({ preise }) {
  const gesetzt = [1, 2, 3].filter((p) => preise?.[p])
  if (gesetzt.length === 0) return null
  return (
    <div className="trm-gr__preise" data-gr-preise="1">
      <p className="trm-gr__preise-titel">{T.grPreiseText}</p>
      <ul className="trm-gr__preisliste">
        {gesetzt.map((p) => (
          <li key={p}>
            <strong>{fuelle(T.grPreisPlatz, { platz: p })}</strong> {preise[p]}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Eine Zeile zum eigenen Stand: Platz oder Qualifikationsstand. */
export function gesamtrankingZeile(eigen) {
  if (!eigen) return null
  if (eigen.qualifiziert && eigen.platz) {
    return `${fuelle(T.grPlatz, { platz: eigen.platz, von: zahl(eigen.von) })} — ${fuelle(T.grPunkte, {
      punkte: zahl(eigen.punkte),
      max: zahl(eigen.max),
    })}`
  }
  return fuelle(T.grStand, { gespielt: eigen.gespielt, noetig: eigen.noetig })
}

/** Die Dashboard-Karte mit dem eigenen Stand. */
export default function GesamtrankingKarte({ daten }) {
  const eigen = daten?.eigen
  if (!eigen) return null

  const fehlende = eigen.fehlende.map(spielTitel).join(', ')

  return (
    <section className="trm-karte trm-gr" id="trm-gr-karte" aria-labelledby="trm-gr-titel">
      <div className="trm-karte__kopf">
        <Ikon name="pokal" size={22} className="trm-ikon" />
        <h2 className="trm-karte__titel" id="trm-gr-titel">
          {T.grTitel}
        </h2>
      </div>
      <p className="trm-karte__sub">{T.grSub}</p>

      {daten.abgeschlossen && <p className="trm-gr__hinweis">{T.grAbgeschlossen}</p>}

      <p className="trm-gr__stand" data-gr-stand="1">
        {gesamtrankingZeile(eigen)}
      </p>

      {eigen.qualifiziert ? (
        eigen.platz === 1 ? (
          <p className="trm-feld__hilfe">{T.grSpitze}</p>
        ) : eigen.bisPlatz && eigen.luecke ? (
          <p className="trm-feld__hilfe" data-gr-luecke="1">
            {fuelle(T.grBisPlatz, { punkte: zahl(eigen.luecke), ziel: eigen.bisPlatz })}
          </p>
        ) : null
      ) : (
        <p className="trm-feld__hilfe" data-gr-fehlt="1">
          {fuelle(T.grFehlt, { games: fehlende })}
        </p>
      )}

      <ul className="trm-gr__spiele">
        {eigen.spiele.map((s) => (
          <li className="trm-gr__spiel" key={s.key} data-gr-spiel={s.key}>
            <span className="trm-gr__spiel-name">{spielTitel(s.key)}</span>
            <span className="trm-gr__spiel-wert">
              {s.score == null
                ? T.grSpielLeer
                : `${fuelle(T.grSpielZeile, { punkte: zahl(s.rangpunkte), score: zahl(s.score) })} · ${fuelle(
                    T.grSpielPlatz,
                    { platz: s.platz, von: zahl(s.von) },
                  )}`}
            </span>
          </li>
        ))}
      </ul>

      {eigen.qualifiziert && eigen.oeffentlich === false && !eigen.probe && (
        <p className="trm-feld__hilfe">{T.grOhneEinwilligung}</p>
      )}

      <GesamtPreise preise={daten.preise} />
    </section>
  )
}
