import { useEffect, useMemo, useState } from 'react'
import { Check, Radio, Trophy } from 'lucide-react'
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
        const antwort = await fetch('/api/stadtfest-ziehung', { cache: 'no-store' })
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

function PotLeiste({ pots = [], winners = [] }) {
  return (
    <div className="stz-pots" aria-label="Lostöpfe">
      {pots.map((pot) => {
        const gezogen = winners.filter((w) => w.prizeKey === pot.key).length
        return (
          <div className="stz-pot" key={pot.key}>
            <span className="stz-pot__name">{pot.short}</span>
            <strong className="stz-pot__zahl">{pot.total}</strong>
            <span className="stz-pot__meta">
              Lose · {gezogen}/{pot.slots} gezogen
            </span>
          </div>
        )
      })}
    </div>
  )
}

function MischAnimation({ total = 0 }) {
  const lose = useMemo(() => Array.from({ length: 20 }, (_, i) => i), [])
  return (
    <div className="stz-mischer" aria-hidden="true">
      <div className="stz-mischer__halo stz-mischer__halo--a" />
      <div className="stz-mischer__halo stz-mischer__halo--b" />
      {lose.map((i) => (
        <span
          className="stz-los"
          key={i}
          style={{
            '--i': i,
            '--winkel': `${i * 18}deg`,
            '--delay': `${-(i * 0.17)}s`,
          }}
        >
          {String((i * 7 + 11) % Math.max(total, 1) + 1).padStart(2, '0')}
        </span>
      ))}
      <div className="stz-mischer__kern">
        <span className="stz-mischer__klein">IM LOSTOPF</span>
        <strong>{total}</strong>
        <span className="stz-mischer__klein">LOSE</span>
      </div>
    </div>
  )
}

function StartBild({ daten }) {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--start">
      <p className="stz-kicker">WÜRZBURGER STADTFEST 2026</p>
      <h1 className="stz-title">
        DIE HAUPTPREIS-
        <span>ZIEHUNG</span>
      </h1>
      <p className="stz-lead">
        {daten?.lostopfGesamt ?? 110} Lose. 9 Hauptpreise. Eine Ziehung.
      </p>
      <div className="stz-startlinie">
        <span />
        <strong>WIR STARTEN GLEICH</strong>
        <span />
      </div>
    </div>
  )
}

function ZiehBild({ current, pot }) {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--ziehen" key={current.drawId}>
      <p className="stz-kicker stz-kicker--puls">JETZT WIRD GEZOGEN</p>
      <h1 className="stz-preis">{preisTitel(current)}</h1>
      <MischAnimation total={pot?.total ?? 0} />
      <p className="stz-warten">DER LOSTOPF WIRD GEMISCHT …</p>
    </div>
  )
}

function GewinnerBild({ current }) {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--gewinner" key={current.drawId}>
      <div className="stz-konfetti" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
      </div>
      <Trophy className="stz-pokal" size={42} strokeWidth={1.5} aria-hidden="true" />
      <p className="stz-kicker">UND DER GEWINN GEHT AN</p>
      <h1 className="stz-gewinner">{current.winner?.name || '—'}</h1>
      <p className="stz-code">TEILNAHME-CODE {current.winner?.code || '—'}</p>
      <div className="stz-gewinn">
        <span>GEWINNT</span>
        <strong>{preisTitel(current)}</strong>
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

  return (
    <section className={`stz-stage${kompakt ? ' stz-stage--kompakt' : ''}`}>
      <div className="stz-stage__noise" aria-hidden="true" />
      <div className="stz-stage__glow" aria-hidden="true" />

      <header className="stz-stage__kopf">
        <img className="stz-logo" src={logo} alt="VIDEKO Küchen" />
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

      <footer className="stz-stage__fuss">
        <div className="stz-fortschritt">
          <span className="stz-fortschritt__linie">
            <i style={{ width: `${Math.min(100, ((winners.length || 0) / (daten?.hauptpreiseGesamt || 9)) * 100)}%` }} />
          </span>
          <strong>{winners.length} / {daten?.hauptpreiseGesamt ?? 9}</strong>
          <span>HAUPTPREISE AUFGEDECKT</span>
        </div>
        {daten && <PotLeiste pots={daten.pots} winners={winners} />}
        <span
          className={`stz-sync${fehler ? ' stz-sync--offline' : ''}`}
          title={letztesUpdate ? new Date(letztesUpdate).toLocaleTimeString('de-DE') : ''}
        >
          {fehler ? 'VERBINDUNG WIRD NEU AUFGEBAUT' : 'LIVE SYNCHRONISIERT'}
        </span>
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
