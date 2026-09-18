import { Ikon } from './TerminalRahmen.jsx'
import { SPIEL_NACH_KEY, TEXTE, fuelle, spielKurz, zahl } from '../data/terminal.js'

/**
 * Gesamtranking — die besten VIER Ergebnisse aus SECHS Hauptgames. Bausteine
 * fuer Dashboard und Rangliste.
 *
 * Gerechnet wird hier nichts. Plaetze, Rangpunkte, die Luecke zum naechsten
 * Platz und vor allem die Auswahl, WELCHE vier Ergebnisse zaehlen, kommen
 * fertig vom Server (api/_terminal-gesamtranking.js). Diese Datei zeigt sie an
 * und entscheidet nichts.
 */

const T = TEXTE.r

export const spielTitel = (key) => SPIEL_NACH_KEY[key]?.titel ?? key

/**
 * Die Rankingpreise. Steht nur da, wenn in der Verwaltung mindestens ein Preis
 * eingetragen ist — ohne Eintrag wird nichts versprochen.
 */
export function GesamtPreise({ preise, texte }) {
  const gesetzt = [1, 2, 3].filter((p) => preise?.[p])
  if (gesetzt.length === 0) return null
  return (
    <div className="trm-gr__preise" data-gr-preise="1">
      <p className="trm-gr__preise-titel">{T.grPreiseText}</p>
      <ul className="trm-gr__preisliste">
        {gesetzt.map((p) => {
          /* Beschreibung und Wert sind optional und werden nur gezeigt, wenn
             sie in der Verwaltung stehen — hier wird nichts ergaenzt. */
          const t = texte?.[p] ?? {}
          return (
            <li key={p}>
              <strong>{fuelle(T.grPreisPlatz, { platz: p })}</strong> {preise[p]}
              {t.wert ? <span className="trm-gr__preisWert"> · {t.wert}</span> : null}
              {t.beschreibung ? <span className="trm-gr__preisText">{t.beschreibung}</span> : null}
            </li>
          )
        })}
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

/**
 * "NOCH 2 SPIELE BIS ZUM GESAMTRANKING" — die Huerde ist eine Zahl, kein
 * Pflichtprogramm. Welche Spiele noch fehlen, ist egal; es zaehlt, wie viele
 * verschiedene ueberhaupt gespielt sind.
 */
function fehltZeile(eigen) {
  const fehlt = Math.max(0, Number(eigen?.fehlt ?? 0))
  if (fehlt <= 0) return null
  return fehlt === 1 ? T.grNochEins : fuelle(T.grNochMehr, { fehlt })
}

/** Die vier gewerteten Spiele als kurze Kette: "Jump · Slam · Fit · Crush". */
function gewerteteKette(keys) {
  if (!Array.isArray(keys) || keys.length === 0) return null
  return keys.map(spielKurz).join(' · ')
}

/**
 * Die oeffentliche Bestenliste des Gesamtrankings.
 *
 * Wer der Veroeffentlichung nicht zugestimmt hat, steht ohne Namen in der
 * Liste — der Platz stimmt trotzdem, sonst saehen die Preisplaetze oeffentlich
 * falsch aus. Der Server schickt hier nie eine Kennung mit.
 */
export function GesamtListe({ daten }) {
  const eintraege = Array.isArray(daten?.eintraege) ? daten.eintraege : []

  return (
    <section
      className="trm-karte trm-grliste"
      id="trm-gr-liste"
      aria-labelledby="trm-grliste-titel"
      data-gr-liste="1"
    >
      <div className="trm-karte__kopf">
        <Ikon name="pokal" size={22} className="trm-ikon" />
        <h2 className="trm-karte__titel" id="trm-grliste-titel">
          {T.grTitel}
        </h2>
      </div>
      <p className="trm-grliste__beste">{T.grBeste}</p>
      <p className="trm-karte__sub">{T.grListeSub}</p>

      {daten?.abgeschlossen && <p className="trm-gr__hinweis">{T.grAbgeschlossen}</p>}

      {eintraege.length === 0 ? (
        <p className="trm-feld__hilfe" data-gr-liste-leer="1">
          {T.grListeLeer}
        </p>
      ) : (
        <>
          <div className="trm-grliste__kopfzeile" aria-hidden="true">
            <span>{T.grSpaltePlatz}</span>
            <span>{T.grSpalteSpieler}</span>
            <span>{T.grSpaltePunkte}</span>
          </div>
          <ol className="trm-grliste__liste">
            {eintraege.map((e) => {
              const kette = gewerteteKette(e.gewertet)
              return (
                <li
                  className="trm-grliste__zeile"
                  key={`${e.platz}-${e.instagram ?? 'anonym'}`}
                  data-gr-platz={e.platz}
                  data-gr-podest={e.platz <= 3 ? '1' : undefined}
                  data-gr-ich={e.ich ? '1' : undefined}
                >
                  <span className="trm-grliste__platz">{e.platz}</span>
                  <span className="trm-grliste__spieler">
                    <span className={e.instagram ? 'trm-grliste__name' : 'trm-grliste__anonym'}>
                      {e.instagram ? `@${e.instagram}` : T.grAnonym}
                    </span>
                    {kette && (
                      <span className="trm-grliste__spiele" title={T.grGewerteteSpiele}>
                        {kette}
                      </span>
                    )}
                  </span>
                  <span className="trm-grliste__punkte">{zahl(e.punkte)}</span>
                </li>
              )
            })}
          </ol>
          {daten?.gesamtZahl > eintraege.length && (
            <p className="trm-feld__hilfe">{fuelle(T.grQualifiziert, { n: zahl(daten.gesamtZahl) })}</p>
          )}
        </>
      )}

      <p className="trm-feld__hilfe">{T.grNochHilfe}</p>
      <p className="trm-feld__hilfe" data-gr-einzel="1">
        {T.grEinzelHinweis}
      </p>

      <GesamtPreise preise={daten?.preise} texte={daten?.preisTexte} />
    </section>
  )
}

/**
 * Der eigene Stand plus die oeffentliche Bestenliste.
 *
 * Die Liste steht auch dann da, wenn man selbst noch nichts gespielt hat —
 * sie ist oeffentlich und soll zeigen, worum es geht.
 */
export default function GesamtrankingKarte({ daten }) {
  if (!daten) return null
  const eigen = daten.eigen
  const fehlt = fehltZeile(eigen)

  return (
    <>
      {eigen && (
      <section className="trm-karte trm-gr" id="trm-gr-karte" aria-labelledby="trm-gr-titel">
        <div className="trm-karte__kopf">
          <Ikon name="pokal" size={22} className="trm-ikon" />
          <h2 className="trm-karte__titel" id="trm-gr-titel">
            {T.grTitel}
          </h2>
        </div>
        <p className="trm-gr__beste">{T.grBeste}</p>
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
          <>
            <p className="trm-gr__fehlt" data-gr-fehlt="1">
              {fehlt}
            </p>
            <p className="trm-feld__hilfe">{T.grNochHilfe}</p>
          </>
        )}

        <ul className="trm-gr__spiele">
          {eigen.spiele.map((s) => (
            <li
              className="trm-gr__spiel"
              key={s.key}
              data-gr-spiel={s.key}
              /* gewertet/gestrichen entscheidet der Server, nicht dieses Geraet. */
              data-gr-gewertet={s.gewertet ? '1' : undefined}
            >
              <span className="trm-gr__spiel-name">
                {spielTitel(s.key)}
                {s.score != null && (
                  <span className={s.gewertet ? 'trm-gr__marke' : 'trm-gr__marke trm-gr__marke--aus'}>
                    {s.gewertet ? T.grGewertet : T.grGestrichen}
                  </span>
                )}
              </span>
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
      </section>
      )}

      <GesamtListe daten={daten} />
    </>
  )
}
