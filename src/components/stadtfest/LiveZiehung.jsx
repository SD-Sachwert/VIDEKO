import { createElement, useEffect, useMemo, useState } from 'react'
import { Check, Coins, Gift, PanelTop, Radio, Trophy, Waves } from 'lucide-react'
import logo from '../../assets/brand/logo-web-auf-dunkel.webp'

const POLL_MS = 1200
const PROBE_TAKT_MS = 5200

const PROBE_POTS = [
  { key: 'gold_2_5g', label: '2,5 g Gold', short: 'GOLD', total: 37, slots: 2 },
  { key: 'kuechengutschein_1000', label: '1.000 € Küchengutschein', short: 'KÜCHENGUTSCHEIN', total: 23, slots: 5 },
  { key: 'spanndecke_20qm', label: 'Spanndecke bis 20 m²', short: 'SPANNDECKE', total: 17, slots: 1 },
  { key: 'wellness_2n_2p', label: 'Wellnessurlaub – 2 Nächte / 2 Personen', short: 'WELLNESS', total: 33, slots: 1 },
]

const PROBE_GEWONNEN = [
  { drawId: 'probe-gold-1', prizeKey: 'gold_2_5g', prizeTitle: '2,5 g Gold', prizeNumber: 1, name: 'Sophie M.', code: '4827' },
  { drawId: 'probe-gutschein-1', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 1, name: 'Lukas B.', code: '1734' },
  { drawId: 'probe-gutschein-2', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 2, name: 'Mara K.', code: '9051' },
  { drawId: 'probe-spanndecke', prizeKey: 'spanndecke_20qm', prizeTitle: 'Spanndecke bis 20 m²', prizeNumber: 1, name: 'Daniel R.', code: '6612' },
  { drawId: 'probe-wellness', prizeKey: 'wellness_2n_2p', prizeTitle: 'Wellnessurlaub – 2 Nächte / 2 Personen', prizeNumber: 1, name: 'Nina S.', code: '2408' },
  { drawId: 'probe-gold-2', prizeKey: 'gold_2_5g', prizeTitle: '2,5 g Gold', prizeNumber: 2, name: 'Tobias H.', code: '3186' },
  { drawId: 'probe-gutschein-3', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 3, name: 'Anna W.', code: '7520' },
  { drawId: 'probe-gutschein-4', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 4, name: 'Jonas F.', code: '1149' },
  { drawId: 'probe-gutschein-5', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 5, name: 'Lea P.', code: '5377' },
]

/* Preis-Motive: nur Form, kein erfundener Inhalt. Welches Icon ein Topf
   bekommt, entscheidet sein Schluessel; alles Unbekannte bleibt beim Pokal. */
const PREIS_MOTIVE = [
  [/gold/i, Coins],
  [/gutschein|kuechen|küchen/i, Gift],
  [/spanndecke|decke/i, PanelTop],
  [/wellness|urlaub|hotel|spa/i, Waves],
]

function preisMotiv(key = '') {
  const treffer = PREIS_MOTIVE.find(([muster]) => muster.test(key || ''))
  return treffer ? treffer[1] : Trophy
}

/* Als eigene Komponente, damit im Koerper von ZiehBild und GewinnerBild
   keine grossgeschriebene Variable mehr eine Komponente haelt
   (react-hooks/static-components). */
function PreisMotiv({ prizeKey, ...rest }) {
  return createElement(preisMotiv(prizeKey), rest)
}

function probeErlaubt() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app')
}

function probeDaten(zustand) {
  const basis = {
    ok: true,
    eventId: 'wuerzburger-stadtfest-2026',
    lostopfGesamt: 110,
    hauptpreiseGesamt: 9,
    pots: PROBE_POTS,
    current: null,
    winners: [],
  }

  if (zustand === 'ziehen') {
    return {
      ...basis,
      winners: PROBE_GEWONNEN.slice(0, 2),
      current: {
        status: 'spinning',
        drawId: 'probe-spanndecke',
        prizeKey: 'spanndecke_20qm',
        prizeTitle: 'Spanndecke bis 20 m²',
        prizeNumber: 1,
        startedAt: new Date().toISOString(),
        revealedAt: null,
        winner: null,
      },
    }
  }

  if (zustand === 'gewinner') {
    const gewinner = PROBE_GEWONNEN[3]
    return {
      ...basis,
      winners: PROBE_GEWONNEN.slice(0, 4),
      current: {
        status: 'revealed',
        drawId: gewinner.drawId,
        prizeKey: gewinner.prizeKey,
        prizeTitle: gewinner.prizeTitle,
        prizeNumber: gewinner.prizeNumber,
        startedAt: new Date().toISOString(),
        revealedAt: new Date().toISOString(),
        winner: { name: gewinner.name, code: gewinner.code },
      },
    }
  }

  if (zustand === 'ende') {
    return { ...basis, winners: PROBE_GEWONNEN }
  }

  return basis
}

function probeZustandAusAdresse() {
  if (!probeErlaubt()) return null
  const wert = new URLSearchParams(window.location.search).get('probe')
  if (['start', 'ziehen', 'gewinner', 'ende', 'auto'].includes(wert)) return wert
  return null
}

function preisTitel(preis) {
  if (!preis) return ''
  return preis.prizeNumber > 1
    ? `${preis.prizeTitle} · Platz ${preis.prizeNumber}`
    : preis.prizeTitle
}

function useLiveZiehung() {
  const [daten, setDaten] = useState(null)
  const [fehler, setFehler] = useState('')
  const [letztesUpdate, setLetztesUpdate] = useState(null)

  useEffect(() => {
    const probe = probeZustandAusAdresse()
    if (probe) {
      const setzen = () => {
        const zustand = probe === 'auto'
          ? ['start', 'ziehen', 'gewinner', 'start', 'ziehen', 'gewinner', 'ende'][
              Math.floor(Date.now() / PROBE_TAKT_MS) % 7
            ]
          : probe
        setDaten(probeDaten(zustand))
        setFehler('')
        setLetztesUpdate(Date.now())
      }

      setzen()
      if (probe !== 'auto') return undefined
      const timer = window.setInterval(setzen, 350)
      return () => window.clearInterval(timer)
    }

    let aktiv = true
    let timer = null
    let laeuft = false

    const laden = async () => {
      if (laeuft || !aktiv) return
      laeuft = true
      try {
        const antwort = await fetch('/api/stadtfest-ziehung')
        const json = await antwort.json().catch(() => ({}))
        if (!antwort.ok || !json.ok) throw new Error(json.meldung || 'Live-Stand nicht erreichbar')
        if (!aktiv) return
        setDaten(json)
        setFehler('')
        setLetztesUpdate(Date.now())
      } catch (e) {
        if (aktiv) setFehler(e?.message || 'Live-Stand nicht erreichbar')
      } finally {
        laeuft = false
      }
    }

    const takten = () => {
      void laden()
      timer = window.setInterval(laden, POLL_MS)
    }

    takten()
    const sichtbar = () => {
      if (document.visibilityState === 'visible') void laden()
    }
    document.addEventListener('visibilitychange', sichtbar)

    return () => {
      aktiv = false
      if (timer) window.clearInterval(timer)
      document.removeEventListener('visibilitychange', sichtbar)
    }
  }, [])

  return { daten, fehler, letztesUpdate }
}

function LiveMarke() {
  return (
    <div className="stz-live">
      <span className="stz-live__punkt" aria-hidden="true" />
      <Radio size={15} strokeWidth={2.2} aria-hidden="true" />
      LIVE
    </div>
  )
}

function PotLeiste({ pots = [], winners = [], aktiverKey = null }) {
  return (
    <div className="stz-pots" aria-label="Lostöpfe">
      {pots.map((pot) => {
        const gezogen = winners.filter((w) => w.prizeKey === pot.key).length
        const fertig = gezogen >= pot.slots
        const aktiv = pot.key === aktiverKey
        const Motiv = preisMotiv(pot.key)
        return (
          <div className={`stz-pot${aktiv ? ' stz-pot--aktiv' : ''}${fertig ? ' stz-pot--fertig' : ''}`} key={pot.key}>
            <span className="stz-pot__motiv" aria-hidden="true">
              <Motiv size={26} strokeWidth={1.4} />
            </span>
            <span className="stz-pot__name">{pot.short}</span>
            <span className="stz-pot__zeile">
              <strong className="stz-pot__zahl">{pot.total}</strong>
              <span className="stz-pot__meta">LOSE</span>
              <strong className="stz-pot__zahl stz-pot__zahl--zwei">{gezogen}/{pot.slots}</strong>
              <span className="stz-pot__meta">GEWINNER</span>
            </span>
            {/* Füllstand kommt aus denselben Gewinnerzeilen wie die Zahl links
                daneben — keine zweite Quelle, keine gemalte Kurve. */}
            <span className="stz-pot__balken" aria-hidden="true">
              <i style={{ width: `${Math.min(100, (gezogen / Math.max(pot.slots, 1)) * 100)}%` }} />
            </span>
            {fertig && <Check className="stz-pot__haken" size={14} strokeWidth={3} aria-hidden="true" />}
          </div>
        )
      })}
    </div>
  )
}

function GewinnerTafel({ winners = [], gesamt = 9, aktuellerDrawId = null }) {
  const letzter = winners.length > 0 ? winners[winners.length - 1].drawId : null
  return (
    <aside className={`stz-tafel${winners.length >= 7 ? ' stz-tafel--eng' : ''}`} aria-label="Bisherige Gewinner">
      <div className="stz-tafel__kopf">
        <Trophy size={19} strokeWidth={1.6} aria-hidden="true" />
        <span>BISHERIGE GEWINNER</span>
        <strong>{winners.length}<i>/{gesamt}</i></strong>
      </div>
      {winners.length === 0 ? (
        <p className="stz-tafel__leer">Noch kein Hauptpreis aufgedeckt.</p>
      ) : (
        <ol className="stz-tafel__liste">
          {winners.map((w, i) => {
            const Motiv = preisMotiv(w.prizeKey)
            const frisch = w.drawId === aktuellerDrawId
            const neu = w.drawId === letzter
            return (
              <li
                className={`stz-tafel__zeile${frisch ? ' stz-tafel__zeile--frisch' : ''}${neu ? ' stz-tafel__zeile--neu' : ''}`}
                key={w.drawId}
              >
                <span className="stz-tafel__nr">{String(i + 1).padStart(2, '0')}</span>
                <span className="stz-tafel__name">{w.name}</span>
                <span className="stz-tafel__code">CODE {w.code}</span>
                <span className="stz-tafel__preis">
                  <Motiv size={14} strokeWidth={1.8} aria-hidden="true" />
                  {preisTitel(w)}
                </span>
              </li>
            )
          })}
        </ol>
      )}
      <p className="stz-tafel__fuss">Öffentlich nur Vorname, Nachnamensinitial und Teilnahme-Code.</p>
    </aside>
  )
}

/* Feste Plätze in der Kugel, von Hand gesetzt: so überlappen die Lose nicht
   und die Kugel wird nach unten hin dichter. */
const LOS_PLAETZE = [
  [50, 63], [33, 70], [67, 71], [41, 50], [60, 47], [25, 55],
  [75, 56], [50, 81], [35, 36], [65, 34], [19, 40], [81, 41],
  [44, 25], [57, 23],
]

/**
 * Der Lostopf: die grosse Glaskugel mit sichtbaren Losen, Orbitringen,
 * Lichtbahnen und Funken.
 *
 * Alles hier ist ausschliesslich Buehne. Die Nummern auf den Losen sind
 * sichtbare Papierschnipsel und niemals ein Ziehungsergebnis — gezogen wird
 * serverseitig, und der Gewinner erscheint erst im Aufdeck-Bild.
 */
function Lostopf({ total = 0 }) {
  const innen = useMemo(
    () => LOS_PLAETZE.map(([x, y], i) => ({
      x,
      y,
      i,
      dreh: (i % 5) * 7 - 14,
      nummer: String(((i * 13 + 7) % Math.max(total, 1)) + 1).padStart(2, '0'),
    })),
    [total],
  )
  const umlauf = useMemo(() => Array.from({ length: 9 }, (_, i) => i), [])
  const funken = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({
      i,
      x: [6, 92, 18, 80, 48, 12, 88, 32, 68, 4, 96, 24, 74, 56][i],
      y: [22, 30, 74, 68, 6, 48, 52, 90, 14, 60, 84, 10, 94, 96][i],
      gr: 3 + (i % 4),
      dauer: 2.4 + (i % 5) * 0.6,
      delay: -(i * 0.43),
    })),
    [],
  )

  return (
    <div className="stz-topf" aria-hidden="true">
      <span className="stz-topf__aura" />
      <span className="stz-topf__ring stz-topf__ring--a" />
      <span className="stz-topf__ring stz-topf__ring--b" />
      <span className="stz-topf__ring stz-topf__ring--c" />
      <span className="stz-topf__ring stz-topf__ring--d" />

      {funken.map((f) => (
        <span
          className="stz-topf__funke"
          key={f.i}
          style={{ '--x': f.x, '--y': f.y, '--gr': `${f.gr}px`, '--dauer': `${f.dauer}s`, '--d': `${f.delay}s` }}
        />
      ))}

      <div className="stz-topf__kugel">
        {innen.map((l) => (
          <span
            className="stz-topf__los"
            key={l.i}
            style={{ '--x': l.x, '--y': l.y, '--dreh': `${l.dreh}deg`, '--d': `${-(l.i * 0.41)}s` }}
          >
            {l.nummer}
          </span>
        ))}
        <span className="stz-topf__kante" />
        <span className="stz-topf__glanz" />
      </div>

      {umlauf.map((i) => (
        <span className="stz-topf__orbit" key={i} style={{ '--w': `${i * 40}deg`, '--d': `${-(i * 0.8)}s` }} />
      ))}

      <span className="stz-topf__sockel" />
    </div>
  )
}

/* Lichtstaub ueber der ganzen Buehne. Feste Bahnen, damit bei jedem Aufruf
   dasselbe Bild entsteht und nichts springt. */
function StaubSchicht() {
  const koerner = useMemo(
    () => Array.from({ length: 30 }, (_, i) => ({
      i,
      x: (i * 17 + (i % 3) * 5) % 100,
      gr: 2 + (i % 3),
      hoch: 55 + ((i * 7) % 45),
      seite: ((i % 7) - 3) * 14,
      dauer: 9 + ((i * 3) % 11),
      delay: -((i * 1.37) % 14),
    })),
    [],
  )
  return (
    <div className="stz-staub" aria-hidden="true">
      {koerner.map((k) => (
        <i
          key={k.i}
          style={{
            '--x': k.x,
            '--gr': `${k.gr}px`,
            '--hoch': k.hoch,
            '--seite': `${k.seite}px`,
            '--dauer': `${k.dauer}s`,
            '--d': `${k.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

function StartBild({ daten }) {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--start">
      <div className="stz-startkopf">
        <p className="stz-kicker">WÜRZBURGER STADTFEST 2026</p>
        <h1 className="stz-title">
          DIE HAUPTPREIS-
          <span>ZIEHUNG</span>
        </h1>
      </div>
      <Lostopf total={daten?.lostopfGesamt ?? 0} />
      <div className="stz-schild">
        <p className="stz-lead">
          {daten?.lostopfGesamt ?? 110} Lose. 9 Hauptpreise. Eine Ziehung.
        </p>
        <div className="stz-startlinie">
          <span />
          <strong>WIR STARTEN GLEICH</strong>
          <span />
        </div>
      </div>
    </div>
  )
}

function ZiehBild({ current, pot }) {
  /* Bewusst kein Countdown: der Zuschauer soll sehen, DASS gemischt wird,
     nicht wie lange noch. Aufgedeckt wird weiterhin serverseitig; die
     Anspannung baut allein die Animation auf (siehe stz-anspannung). */
  return (
    <div className="stz-stage__mitte stz-stage__mitte--ziehen" key={current.drawId}>
      <Lostopf total={pot?.total ?? 0} />

      <div className="stz-schild">
        <p className="stz-warten">
          <span className="stz-warten__punkt" aria-hidden="true" />
          DER LOSTOPF WIRD GEMISCHT
          <span className="stz-warten__drei" aria-hidden="true"><i /><i /><i /></span>
        </p>
        <div className="stz-schild__preis">
          <PreisMotiv prizeKey={current?.prizeKey} className="stz-schild__motiv" size={44} strokeWidth={1.3} aria-hidden="true" />
          <span className="stz-schild__text">
            <span className="stz-kicker stz-kicker--puls">JETZT WIRD GEZOGEN</span>
            <h1 className="stz-preis">{preisTitel(current)}</h1>
          </span>
        </div>
        <p className="stz-schild__lose">{pot?.total ?? 0} LOSE IM TOPF</p>
      </div>
    </div>
  )
}

function GewinnerBild({ current }) {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--gewinner" key={current.drawId}>
      <div className="stz-konfetti" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => <i key={i} style={{ '--i': i, '--x': (i * 37) % 100 }} />)}
      </div>
      <Trophy className="stz-pokal" size={42} strokeWidth={1.5} aria-hidden="true" />
      <p className="stz-kicker">UND DER GEWINN GEHT AN</p>
      <h1 className="stz-gewinner">{current.winner?.name || '—'}</h1>
      <p className="stz-code">TEILNAHME-CODE {current.winner?.code || '—'}</p>
      <div className="stz-gewinn">
        <PreisMotiv prizeKey={current?.prizeKey} className="stz-gewinn__motiv" size={34} strokeWidth={1.3} aria-hidden="true" />
        <span className="stz-gewinn__text">
          <small>GEWINNT</small>
          <strong>{preisTitel(current)}</strong>
        </span>
      </div>
    </div>
  )
}

function EndeBild() {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--ende">
      <Check className="stz-ende__check" size={54} strokeWidth={1.4} aria-hidden="true" />
      <p className="stz-kicker">9 VON 9 GEZOGEN</p>
      <h1 className="stz-title">
        DAS WAREN UNSERE
        <span>GEWINNER</span>
      </h1>
      <p className="stz-lead">Danke fürs Mitfiebern. Wir melden uns bei allen Gewinnern persönlich.</p>
    </div>
  )
}

export function ZiehungsBuehne({ kompakt = false }) {
  const { daten, fehler, letztesUpdate } = useLiveZiehung()
  const current = daten?.current ?? null
  const winners = daten?.winners ?? []
  const gesamt = daten?.hauptpreiseGesamt ?? 9
  const revealZeit = current?.status === 'revealed' && current.revealedAt
    ? Date.parse(current.revealedAt)
    : Number.NaN
  const revealVorbei =
    winners.length >= gesamt
    && current?.status === 'revealed'
    && Number.isFinite(revealZeit)
    && Date.now() - revealZeit >= 15000
  const fertig = Boolean(
    daten
    && winners.length >= gesamt
    && (current?.status !== 'revealed' || revealVorbei),
  )
  const pot = current ? daten?.pots?.find((p) => p.key === current.prizeKey) : null

  /* Nur fuer Styling und die optische Abnahme: welches Bild steht gerade auf
     der Buehne. Steuert keinen Ablauf und deckt nichts auf. */
  let art = 'laden'
  if (daten && fertig) art = 'ende'
  else if (daten && current?.status === 'revealed') art = 'reveal'
  else if (daten && current?.status === 'spinning') art = 'ziehen'
  else if (daten) art = 'start'
  else if (fehler) art = 'fehler'

  return (
    <section
      className={`stz-stage${kompakt ? ' stz-stage--kompakt' : ''}${kompakt ? '' : ' stz-stage--show'}`}
      data-art={art}
    >
      <div className="stz-stage__noise" aria-hidden="true" />
      <div className="stz-stage__glow" aria-hidden="true" />
      <div className="stz-stage__spot" aria-hidden="true" />
      <div className="stz-stage__boden" aria-hidden="true" />
      <div className="stz-stage__strahlen" aria-hidden="true" />
      <div className="stz-stage__gitter" aria-hidden="true" />
      <div className="stz-stage__vignette" aria-hidden="true" />
      <StaubSchicht />

      <header className="stz-stage__kopf">
        <img className="stz-logo" src={logo} alt="VIDEKO Küchen" />
        {!kompakt && (
          <span className="stz-stage__titel">
            <strong>STADTFEST HAUPTPREISZIEHUNG</strong>
            <small>Würzburger Stadtfest 2026</small>
          </span>
        )}
        {kompakt && daten?.stream?.url && (
          <a
            className="stz-stream-link"
            href={daten.stream.url}
            target="_blank"
            rel="noreferrer"
          >
            <span aria-hidden="true">▶</span>
            {daten.stream.label || 'ZUM LIVESTREAM'}
          </a>
        )}
        <LiveMarke />
      </header>

      {!daten && !fehler && (
        <div className="stz-stage__mitte">
          <div className="stz-lader" aria-label="Live-Ziehung wird geladen" />
        </div>
      )}

      {daten && !fertig && !current && <StartBild daten={daten} />}
      {daten && !fertig && current?.status === 'spinning' && <ZiehBild current={current} pot={pot} />}
      {daten && !fertig && current?.status === 'revealed' && <GewinnerBild current={current} />}
      {daten && fertig && <EndeBild />}

      {fehler && !daten && (
        <div className="stz-stage__mitte stz-stage__mitte--fehler">
          <p className="stz-kicker">VERBINDUNG UNTERBROCHEN</p>
          <h1 className="stz-preis">Die Live-Bühne verbindet sich neu …</h1>
        </div>
      )}

      {!kompakt && daten && (
        <GewinnerTafel
          winners={winners}
          gesamt={gesamt}
          aktuellerDrawId={current?.status === 'revealed' ? current.drawId : null}
        />
      )}

      <footer className="stz-stage__fuss">
        <div className="stz-fortschritt">
          <span className="stz-fortschritt__titel">FORTSCHRITT HAUPTPREISZIEHUNG</span>
          {/* Eine Marke je Hauptpreis, gefuellt wird nur was wirklich gezogen
              ist — dieselbe Quelle wie die Zahl rechts daneben. */}
          <span className="stz-fortschritt__punkte" aria-hidden="true">
            {Array.from({ length: gesamt }, (_, i) => (
              <i className={i < winners.length ? 'stz-ist' : undefined} key={i} />
            ))}
          </span>
          <strong>
            {winners.length} / {gesamt}
            <span>GEZOGEN</span>
          </strong>
          <span
            className={`stz-sync${fehler ? ' stz-sync--offline' : ''}`}
            title={letztesUpdate ? new Date(letztesUpdate).toLocaleTimeString('de-DE') : ''}
          >
            {fehler ? 'VERBINDUNG WIRD NEU AUFGEBAUT' : 'LIVE SYNCHRONISIERT'}
          </span>
        </div>
        {daten && <PotLeiste pots={daten.pots} winners={winners} aktiverKey={current?.prizeKey ?? null} />}
      </footer>
    </section>
  )
}

export function GewinnerListe() {
  const { daten, fehler } = useLiveZiehung()
  const winners = daten?.winners ?? []

  return (
    <section className="stz-ergebnisse">
      <div className="stz-ergebnisse__kopf">
        <div>
          <p className="stz-kicker">LIVE-STAND</p>
          <h2>Bisherige Gewinner</h2>
        </div>
        <strong>{winners.length} / {daten?.hauptpreiseGesamt ?? 9}</strong>
      </div>

      {winners.length === 0 ? (
        <p className="stz-ergebnisse__leer">
          Noch ist kein Hauptpreis aufgedeckt. Gleich geht’s los.
        </p>
      ) : (
        <ol className="stz-ergebnisliste">
          {winners.map((w, index) => (
            <li key={w.drawId} className="stz-ergebnis">
              <span className="stz-ergebnis__nr">{String(index + 1).padStart(2, '0')}</span>
              <div className="stz-ergebnis__person">
                <strong>{w.name}</strong>
                <span>Code {w.code}</span>
              </div>
              <div className="stz-ergebnis__preis">
                <span>{w.prizeNumber > 1 ? `Platz ${w.prizeNumber}` : 'Gewinn'}</span>
                <strong>{w.prizeTitle}</strong>
              </div>
            </li>
          ))}
        </ol>
      )}

      {fehler && daten && (
        <p className="stz-ergebnisse__offline">
          Live-Verbindung kurz weg – der letzte bestätigte Stand bleibt sichtbar.
        </p>
      )}

      <p className="stz-ergebnisse__recht">
        Gewinner werden zusätzlich persönlich benachrichtigt. Öffentlich zeigen wir nur Vorname,
        Nachnamensinitial und Teilnahme-Code.
      </p>
    </section>
  )
}
