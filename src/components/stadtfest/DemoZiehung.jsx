import { useEffect, useMemo, useState } from 'react'
import { Check, LockKeyhole, Trophy } from 'lucide-react'
import logo from '../../assets/brand/logo-web-auf-dunkel.webp'

const DRAW_MS = 15000
const POLL_MS = 700
const SESSION_KEY = 'videko-stadtfest-simulation-admin'

const POTS = [
  { key: 'gold_2_5g', label: '2,5 g Gold', short: 'GOLD', total: 137, slots: 2 },
  { key: 'kuechengutschein_1000', label: '1.000 € Küchengutschein', short: 'KÜCHENGUTSCHEIN', total: 123, slots: 5 },
  { key: 'spanndecke_20qm', label: 'Spanndecke bis 20 m²', short: 'SPANNDECKE', total: 117, slots: 1 },
  { key: 'wellness_2n_2p', label: 'Wellnessurlaub – 2 Nächte / 2 Personen', short: 'WELLNESS', total: 133, slots: 1 },
]

const HAUPT_LOSE_GESAMT = POTS.reduce((summe, pot) => summe + pot.total, 0)
const BONUS_POT = { key: 'bonus', label: 'Bonus-Runde', short: 'BONUS', total: 1202, slots: 16 }

const GEWINNER = [
  { drawId: 'sim-gutschein-1', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 1, name: 'Felix Bauer', code: '1734' },
  { drawId: 'sim-gutschein-2', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 2, name: 'Anna Keller', code: '9051' },
  { drawId: 'sim-gold-1', prizeKey: 'gold_2_5g', prizeTitle: '2,5 g Gold', prizeNumber: 1, name: 'Vera Bylinski', code: '4827' },
  { drawId: 'sim-gutschein-3', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 3, name: 'Jonas Fischer', code: '7520' },
  { drawId: 'sim-spanndecke', prizeKey: 'spanndecke_20qm', prizeTitle: 'Spanndecke bis 20 m²', prizeNumber: 1, name: 'Michael Wimmer', code: '6612' },
  { drawId: 'sim-gutschein-4', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 4, name: 'Sabrina Hofmann', code: '1149' },
  { drawId: 'sim-wellness', prizeKey: 'wellness_2n_2p', prizeTitle: 'Wellnessurlaub – 2 Nächte / 2 Personen', prizeNumber: 1, name: 'Thomas Schmitt', code: '2408' },
  { drawId: 'sim-gutschein-5', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 5, name: 'Lea Wagner', code: '5377' },
  { drawId: 'sim-gold-2', prizeKey: 'gold_2_5g', prizeTitle: '2,5 g Gold', prizeNumber: 2, name: 'Anton Danner', code: '3186' },

  { drawId: 'sim-bonus-schuerze-1', drawType: 'bonus', prizeKey: 'bonus_kochschuerze', prizeTitle: 'VIDEKO Kochschürze', prizeNumber: 1, name: 'Mia Schneider', code: '2194' },
  { drawId: 'sim-bonus-schuerze-2', drawType: 'bonus', prizeKey: 'bonus_kochschuerze', prizeTitle: 'VIDEKO Kochschürze', prizeNumber: 2, name: 'Jan Weber', code: '6831' },
  { drawId: 'sim-bonus-dinner', drawType: 'bonus', prizeKey: 'bonus_dinner_2_wuerzburg', prizeTitle: 'Dinner für zwei in Würzburg', prizeNumber: 1, name: 'Paul Berger', code: '4602' },
  { drawId: 'sim-bonus-schuerze-3', drawType: 'bonus', prizeKey: 'bonus_kochschuerze', prizeTitle: 'VIDEKO Kochschürze', prizeNumber: 3, name: 'Laura Seidel', code: '5274' },
  { drawId: 'sim-bonus-gutschein-1', drawType: 'bonus', prizeKey: 'bonus_kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein – Bonuspreis', prizeNumber: 1, name: 'Daniel König', code: '6421' },
  { drawId: 'sim-bonus-schuerze-4', drawType: 'bonus', prizeKey: 'bonus_kochschuerze', prizeTitle: 'VIDEKO Kochschürze', prizeNumber: 4, name: 'Stefan Krüger', code: '1468' },
  { drawId: 'sim-bonus-vorrat', drawType: 'bonus', prizeKey: 'bonus_jahresvorrat_tabs_nudeln', prizeTitle: 'Jahresvorrat Spülmaschinentabs + Nudeln', prizeNumber: 1, name: 'Clara Hoffmann', code: '8081' },
  { drawId: 'sim-bonus-schuerze-5', drawType: 'bonus', prizeKey: 'bonus_kochschuerze', prizeTitle: 'VIDEKO Kochschürze', prizeNumber: 5, name: 'Katharina Wolf', code: '9340' },
  { drawId: 'sim-bonus-schuerze-6', drawType: 'bonus', prizeKey: 'bonus_kochschuerze', prizeTitle: 'VIDEKO Kochschürze', prizeNumber: 6, name: 'Marco Neumann', code: '2753' },
  { drawId: 'sim-bonus-wellness', drawType: 'bonus', prizeKey: 'bonus_wellness_2n_2p', prizeTitle: 'Wellnesswochenende für 2 – Bonuspreis', prizeNumber: 1, name: 'Max Richter', code: '3505' },
  { drawId: 'sim-bonus-schuerze-7', drawType: 'bonus', prizeKey: 'bonus_kochschuerze', prizeTitle: 'VIDEKO Kochschürze', prizeNumber: 7, name: 'Lisa Hartmann', code: '7016' },
  { drawId: 'sim-bonus-gutschein-2', drawType: 'bonus', prizeKey: 'bonus_kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein – Bonuspreis', prizeNumber: 2, name: 'Julia Beck', code: '8950' },
  { drawId: 'sim-bonus-schuerze-8', drawType: 'bonus', prizeKey: 'bonus_kochschuerze', prizeTitle: 'VIDEKO Kochschürze', prizeNumber: 8, name: 'Tobias Frank', code: '4137' },
  { drawId: 'sim-bonus-schuerze-9', drawType: 'bonus', prizeKey: 'bonus_kochschuerze', prizeTitle: 'VIDEKO Kochschürze', prizeNumber: 9, name: 'Sarah Lang', code: '5682' },
  { drawId: 'sim-bonus-schuerze-10', drawType: 'bonus', prizeKey: 'bonus_kochschuerze', prizeTitle: 'VIDEKO Kochschürze', prizeNumber: 10, name: 'Martin Schuster', code: '3269' },
  { drawId: 'sim-bonus-gold', drawType: 'bonus', prizeKey: 'bonus_gold_2_5g', prizeTitle: '2,5 g Gold – Bonuspreis', prizeNumber: 1, name: 'Rosemarie Minje', code: '7712' },
]

const PHASEN = [
  { art: 'start' },
  ...GEWINNER.slice(0, 9).flatMap((_, index) => [{ art: 'ziehen', index }, { art: 'gewinner', index }]),
  { art: 'bonusIntro' },
  ...GEWINNER.slice(9).flatMap((_, offset) => {
    const index = offset + 9
    return [{ art: 'ziehen', index }, { art: 'gewinner', index }]
  }),
  { art: 'ende' },
]

function begrenzen(schritt) {
  return Math.max(0, Math.min(Number(schritt) || 0, PHASEN.length - 1))
}

function preisTitel(preis) {
  if (!preis) return ''
  if (preis.prizeKey === 'bonus_kochschuerze') return preis.prizeTitle
  return preis.prizeNumber > 1 ? `${preis.prizeTitle} · Platz ${preis.prizeNumber}` : preis.prizeTitle
}

function preisKurz(preis) {
  if (!preis) return ''
  if (preis.prizeKey === 'kuechengutschein_1000' || preis.prizeKey === 'bonus_kuechengutschein_1000') return '1.000 € Küchengutschein'
  if (preis.prizeKey === 'spanndecke_20qm') return 'Spanndecke'
  if (preis.prizeKey === 'wellness_2n_2p' || preis.prizeKey === 'bonus_wellness_2n_2p') return 'Wellness'
  if (preis.prizeKey === 'gold_2_5g' || preis.prizeKey === 'bonus_gold_2_5g') return '2,5 g Gold'
  if (preis.prizeKey === 'bonus_dinner_2_wuerzburg') return 'Dinner für zwei'
  if (preis.prizeKey === 'bonus_jahresvorrat_tabs_nudeln') return 'Jahresvorrat Tabs + Nudeln'
  if (preis.prizeKey === 'bonus_kochschuerze') return 'VIDEKO Kochschürze'
  return preis.prizeTitle
}

function useSimulationState() {
  const [stand, setStand] = useState({
    schritt: 0,
    updatedAt: null,
    serverNow: null,
    clockOffset: 0,
  })
  const [fehler, setFehler] = useState('')
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    let aktiv = true
    let laeuft = false

    const laden = async () => {
      if (!aktiv || laeuft) return
      laeuft = true
      try {
        const antwort = await fetch('/api/stadtfest-simulation', { cache: 'no-store' })
        const json = await antwort.json().catch(() => ({}))
        if (!antwort.ok || !json.ok) throw new Error(json.meldung || 'Regiestand nicht erreichbar')
        if (!aktiv) return
        const serverMs = Date.parse(json.serverNow)
        setStand({
          schritt: begrenzen(json.schritt),
          updatedAt: json.updatedAt || null,
          serverNow: json.serverNow || null,
          clockOffset: Number.isFinite(serverMs) ? serverMs - Date.now() : 0,
        })
        setFehler('')
        setGeladen(true)
      } catch (error) {
        if (aktiv) {
          setFehler(error?.message || 'Regiestand nicht erreichbar')
          setGeladen(true)
        }
      } finally {
        laeuft = false
      }
    }

    void laden()
    const timer = window.setInterval(laden, POLL_MS)
    return () => {
      aktiv = false
      window.clearInterval(timer)
    }
  }, [])

  const uebernehmen = (json) => {
    const serverMs = Date.parse(json?.serverNow)
    setStand({
      schritt: begrenzen(json?.schritt),
      updatedAt: json?.updatedAt || null,
      serverNow: json?.serverNow || null,
      clockOffset: Number.isFinite(serverMs) ? serverMs - Date.now() : 0,
    })
    setFehler('')
    setGeladen(true)
  }

  return { stand, fehler, geladen, uebernehmen }
}

function MischAnimation({ total = 0 }) {
  const lose = useMemo(() => Array.from({ length: 30 }, (_, i) => i), [])
  return (
    <div className="stz-mischer stz-mischer--intensiv" aria-hidden="true">
      <div className="stz-mischer__strahl stz-mischer__strahl--a" />
      <div className="stz-mischer__strahl stz-mischer__strahl--b" />
      <div className="stz-mischer__halo stz-mischer__halo--a" />
      <div className="stz-mischer__halo stz-mischer__halo--b" />
      {lose.map((i) => (
        <span
          className="stz-los"
          key={i}
          style={{
            '--i': i,
            '--winkel': `${i * 12}deg`,
            '--delay': `${-(i * 0.13)}s`,
            '--tempo': `${2.5 + (i % 6) * 0.18}s`,
          }}
        >
          {String((i * 17 + 11) % Math.max(total, 1) + 1).padStart(4, '0')}
        </span>
      ))}
      <div className="stz-mischer__kern">
        <span className="stz-mischer__klein">IM LOSTOPF</span>
        <strong>{total}</strong>
        <span className="stz-mischer__klein">{total === BONUS_POT.total ? 'TEILNEHMER' : 'LOSE'}</span>
      </div>
    </div>
  )
}

function PotLeiste({ runde, revealed = 0 }) {
  const bisher = GEWINNER.slice(0, revealed)

  if (runde === 'bonus') {
    const gezogen = bisher.filter((w) => w.drawType === 'bonus').length
    return (
      <div className="stz-pots stz-pots--bonus" aria-label="Bonus-Lostopf">
        <div className="stz-pot stz-pot--bonus">
          <span className="stz-pot__name">BONUS-RUNDE · GLÜCKSRAD-TEILNEHMER</span>
          <strong className="stz-pot__zahl">{BONUS_POT.total}</strong>
          <span className="stz-pot__meta">Teilnehmer · {gezogen}/{BONUS_POT.slots} Bonuspreise gezogen</span>
        </div>
      </div>
    )
  }

  return (
    <div className="stz-pots stz-pots--haupt" aria-label="Hauptpreis-Lostöpfe">
      {POTS.map((pot) => {
        const gezogen = bisher.filter((w) => w.prizeKey === pot.key).length
        return (
          <div className="stz-pot" key={pot.key}>
            <span className="stz-pot__name">{pot.short}</span>
            <strong className="stz-pot__zahl">{pot.total}</strong>
            <span className="stz-pot__meta">Lose · {gezogen}/{pot.slots} gezogen</span>
          </div>
        )
      })}
    </div>
  )
}

function GewinnerBoard({ revealed = 0 }) {
  const bisher = GEWINNER.slice(0, revealed)
  if (bisher.length === 0) return null

  return (
    <aside className={`stz-winnerboard${bisher.length > 12 ? ' stz-winnerboard--voll' : ''}`} aria-label="Bisherige Gewinner">
      <div className="stz-winnerboard__kopf">
        <span>BISHERIGE GEWINNER</span>
        <strong>{bisher.length}</strong>
      </div>
      <ol>
        {bisher.map((winner, index) => (
          <li
            key={winner.drawId}
            className={index === bisher.length - 1 ? 'stz-winnerboard__item stz-winnerboard__item--neu' : 'stz-winnerboard__item'}
          >
            <span className="stz-winnerboard__nr">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>{winner.name}</strong>
              <span>{preisKurz(winner)}</span>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  )
}

function StartBild() {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--start">
      <p className="stz-kicker">WÜRZBURGER STADTFEST 2026</p>
      <h1 className="stz-title">DIE HAUPTPREIS-<span>ZIEHUNG</span></h1>
      <p className="stz-lead">{HAUPT_LOSE_GESAMT} Hauptpreis-Lose · 9 Hauptpreise</p>
      <p className="stz-sublead">Vier getrennte Lostöpfe. Die Bonus-Runde folgt danach separat.</p>
      <div className="stz-startlinie"><span /><strong>BEREIT FÜR DIE ZIEHUNG</strong><span /></div>
    </div>
  )
}

function BonusStartBild() {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--bonus">
      <p className="stz-kicker">9 VON 9 HAUPTPREISEN GEZOGEN.</p>
      <h1 className="stz-title">UND JETZT KOMMT DIE<span>BONUS-RUNDE.</span></h1>
      <p className="stz-lead">{BONUS_POT.slots} zusätzliche Preise · eigener Lostopf mit {BONUS_POT.total} Glücksrad-Teilnehmern.</p>
      <div className="stz-startlinie"><span /><strong>EXKLUSIV · ZUSÄTZLICH · DANACH</strong><span /></div>
    </div>
  )
}

function ZiehBild({ gewinner, startedAt, clockOffset = 0 }) {
  const [jetzt, setJetzt] = useState(() => Date.now() + clockOffset)
  const pot = gewinner.drawType === 'bonus' ? BONUS_POT : POTS.find((p) => p.key === gewinner.prizeKey)
  const start = startedAt ? Date.parse(startedAt) : Number.NaN
  const rest = Number.isFinite(start)
    ? Math.max(0, Math.ceil((start + DRAW_MS - jetzt) / 1000))
    : Math.ceil(DRAW_MS / 1000)

  useEffect(() => {
    const timer = window.setInterval(() => setJetzt(Date.now() + clockOffset), 100)
    return () => window.clearInterval(timer)
  }, [clockOffset, gewinner.drawId])

  return (
    <div className="stz-stage__mitte stz-stage__mitte--ziehen" key={gewinner.drawId}>
      <div className="stz-zieh-energie" aria-hidden="true" />
      <p className="stz-kicker stz-kicker--puls">
        {gewinner.drawType === 'bonus' ? 'BONUS-RUNDE · JETZT WIRD GEZOGEN' : 'JETZT WIRD GEZOGEN'}
      </p>
      <h1 className="stz-preis">{preisTitel(gewinner)}</h1>
      <MischAnimation total={pot?.total ?? 0} />
      <p className="stz-warten">{rest > 0 ? 'DER LOSTOPF WIRD GEMISCHT …' : 'BEREIT ZUM AUFDECKEN'}</p>
      <div className="stz-countdown" aria-label={`Aufdeckung frühestens in ${rest} Sekunden`}>
        <span>{rest > 0 ? 'AUFDECKUNG FRÜHESTENS IN' : 'AUFDECKUNG'}</span>
        <strong>{rest}</strong>
        <span>{rest > 0 ? 'SEKUNDEN' : 'BEREIT'}</span>
      </div>
    </div>
  )
}

function GewinnerBild({ gewinner }) {
  const schuerze = gewinner.prizeKey === 'bonus_kochschuerze'
  return (
    <div className="stz-stage__mitte stz-stage__mitte--gewinner" key={gewinner.drawId}>
      <div className="stz-reveal-ring stz-reveal-ring--a" aria-hidden="true" />
      <div className="stz-reveal-ring stz-reveal-ring--b" aria-hidden="true" />
      <div className="stz-konfetti" aria-hidden="true">
        {Array.from({ length: 36 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
      </div>
      <Trophy className="stz-pokal" size={42} strokeWidth={1.5} aria-hidden="true" />
      <p className="stz-kicker">UND DER GEWINN GEHT AN</p>
      <h1 className="stz-gewinner">{gewinner.name}</h1>
      <p className="stz-code">TEILNAHME-CODE {gewinner.code}</p>
      <div className="stz-gewinn">
        <span>GEWINNT</span>
        <strong>{preisTitel(gewinner)}</strong>
        {schuerze && <em className="stz-abholung">ABHOLUNG · HERTZSTRASSE 4</em>}
      </div>
    </div>
  )
}

function EndeBild() {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--ende">
      <Check className="stz-ende__check" size={54} strokeWidth={1.4} aria-hidden="true" />
      <p className="stz-kicker">ALLE ZIEHUNGEN ABGESCHLOSSEN</p>
      <h1 className="stz-title">9 HAUPTPREISE.<span>16 BONUSPREISE.</span></h1>
      <p className="stz-lead">Danke fürs Mitfiebern. Alle Gewinner bleiben rechts im Überblick sichtbar.</p>
    </div>
  )
}

export function DemoZiehungsBuehne({
  kompakt = false,
  schritt = 0,
  updatedAt = null,
  clockOffset = 0,
  verbindung = true,
}) {
  const index = begrenzen(schritt)
  const phase = PHASEN[index]
  const gewinner = typeof phase.index === 'number' ? GEWINNER[phase.index] : null
  const revealed = phase.art === 'ende'
    ? GEWINNER.length
    : phase.art === 'bonusIntro'
      ? 9
      : typeof phase.index === 'number'
        ? phase.index + (phase.art === 'gewinner' ? 1 : 0)
        : 0

  const bonusRunde = phase.art === 'bonusIntro'
    || phase.art === 'ende'
    || (typeof phase.index === 'number' && phase.index >= 9)

  const runde = bonusRunde ? 'bonus' : 'haupt'
  const rundenGezogen = runde === 'bonus' ? Math.max(0, revealed - 9) : Math.min(revealed, 9)
  const rundenGesamt = runde === 'bonus' ? BONUS_POT.slots : 9
  const fortschritt = (rundenGezogen / rundenGesamt) * 100

  return (
    <section className={`stz-stage${kompakt ? ' stz-stage--kompakt' : ''}${revealed > 0 ? ' stz-stage--mit-winnerboard' : ''}`}>
      <div className="stz-stage__noise" aria-hidden="true" />
      <div className="stz-stage__glow" aria-hidden="true" />
      <header className="stz-stage__kopf">
        <img className="stz-logo" src={logo} alt="VIDEKO Küchen" />
        <div className="stz-live"><span className="stz-live__punkt" aria-hidden="true" /> LIVE</div>
      </header>

      <GewinnerBoard revealed={revealed} />

      {phase.art === 'start' && <StartBild />}
      {phase.art === 'bonusIntro' && <BonusStartBild />}
      {phase.art === 'ziehen' && gewinner && (
        <ZiehBild gewinner={gewinner} startedAt={updatedAt} clockOffset={clockOffset} />
      )}
      {phase.art === 'gewinner' && gewinner && <GewinnerBild gewinner={gewinner} />}
      {phase.art === 'ende' && <EndeBild />}

      <footer className="stz-stage__fuss">
        <div className="stz-fortschritt">
          <span className="stz-fortschritt__linie"><i style={{ width: `${fortschritt}%` }} /></span>
          <strong>{rundenGezogen} / {rundenGesamt}</strong>
          <span>{runde === 'bonus' ? 'BONUSPREISE AUFGEDECKT' : 'HAUPTPREISE AUFGEDECKT'}</span>
        </div>
        <PotLeiste runde={runde} revealed={revealed} />
        <span className={`stz-sync stz-sync--simulation${verbindung ? '' : ' stz-sync--offline'}`}>
          {verbindung ? 'Simulation' : 'Simulation · Verbindung'}
        </span>
      </footer>
    </section>
  )
}

export function DemoRemoteShow() {
  const { stand, fehler } = useSimulationState()
  return (
    <DemoZiehungsBuehne
      schritt={stand.schritt}
      updatedAt={stand.updatedAt}
      clockOffset={stand.clockOffset}
      verbindung={!fehler}
    />
  )
}

function naechsterText(phase, index) {
  if (phase.art === 'start') return 'HAUPTZIEHUNG STARTEN'
  if (phase.art === 'ziehen') return 'GEWINNER AUFDECKEN'
  if (phase.art === 'gewinner' && index === 18) return 'BONUS-RUNDE EINBLENDEN'
  if (phase.art === 'bonusIntro') return 'BONUS-RUNDE STARTEN'
  if (phase.art === 'gewinner' && index === PHASEN.length - 2) return 'ABSCHLUSS EINBLENDEN'
  if (phase.art === 'gewinner') return phase.index >= 9 ? 'NÄCHSTEN BONUSPREIS ZIEHEN' : 'NÄCHSTEN HAUPTPREIS ZIEHEN'
  return 'NÄCHSTER SCHRITT'
}

export function DemoRegie() {
  const { stand, fehler, geladen, uebernehmen } = useSimulationState()
  const [schluessel, setSchluessel] = useState('')
  const [eingabe, setEingabe] = useState('')
  const [authFehler, setAuthFehler] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const [, setTakt] = useState(0)

  useEffect(() => {
    const gespeichert = window.sessionStorage.getItem(SESSION_KEY) || ''
    if (gespeichert) setEingabe(gespeichert)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setTakt((wert) => wert + 1), 250)
    return () => window.clearInterval(timer)
  }, [])

  const index = begrenzen(stand.schritt)
  const phase = PHASEN[index]
  const start = stand.updatedAt ? Date.parse(stand.updatedAt) : Number.NaN
  const elapsed = Number.isFinite(start) ? Date.now() + stand.clockOffset - start : DRAW_MS
  const ziehenGesperrt = phase.art === 'ziehen' && elapsed < DRAW_MS
  const rest = ziehenGesperrt ? Math.max(1, Math.ceil((DRAW_MS - elapsed) / 1000)) : 0

  const posten = async (body, token = schluessel) => {
    const antwort = await fetch('/api/stadtfest-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-terminal-admin': token,
      },
      body: JSON.stringify(body),
    })
    const json = await antwort.json().catch(() => ({}))
    if (!antwort.ok || !json.ok) throw new Error(json.meldung || 'Regie konnte nicht aktualisiert werden')
    uebernehmen(json)
    return json
  }

  const anmelden = async (event) => {
    event.preventDefault()
    const token = eingabe.trim()
    if (!token) return
    setLaeuft(true)
    setAuthFehler('')
    try {
      await posten({ aktion: 'pruefen' }, token)
      window.sessionStorage.setItem(SESSION_KEY, token)
      setSchluessel(token)
    } catch (error) {
      setAuthFehler(error?.message || 'Anmeldung fehlgeschlagen')
    } finally {
      setLaeuft(false)
    }
  }

  const setzen = async (neu) => {
    if (!schluessel || laeuft) return
    setLaeuft(true)
    setAuthFehler('')
    try {
      await posten({ schritt: begrenzen(neu) })
    } catch (error) {
      setAuthFehler(error?.message || 'Regie konnte nicht aktualisiert werden')
    } finally {
      setLaeuft(false)
    }
  }

  if (!schluessel) {
    return (
      <div className="stz-regie-login">
        <LockKeyhole size={28} aria-hidden="true" />
        <strong>SIMULATION · INTERNE REGIE</strong>
        <p>Mit dem bestehenden Verwaltungsschlüssel anmelden. Die Show-Seite kann nur hier gesteuert werden.</p>
        <form onSubmit={anmelden}>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Verwaltungsschlüssel"
            value={eingabe}
            onChange={(event) => setEingabe(event.target.value)}
          />
          <button type="submit" disabled={laeuft}>{laeuft ? 'PRÜFE …' : 'REGIE ÖFFNEN'}</button>
        </form>
        {authFehler && <span className="stz-regie-fehler">{authFehler}</span>}
        {fehler && <span className="stz-regie-fehler">{fehler}</span>}
      </div>
    )
  }

  return (
    <>
      <div className="stz-demo-controls">
        <strong className="stz-demo-controls__title">SIMULATION · INTERNE REGIE · SHOW SYNCHRONISIERT</strong>
        <button type="button" disabled={laeuft || index === 0} onClick={() => void setzen(index - 1)}>← ZURÜCK</button>
        <button
          type="button"
          className="is-primary"
          disabled={laeuft || index >= PHASEN.length - 1 || ziehenGesperrt}
          onClick={() => void setzen(index + 1)}
        >
          {ziehenGesperrt ? `NOCH ${rest} S` : naechsterText(phase, index)}
        </button>
        <button type="button" disabled={laeuft || index === 0} onClick={() => void setzen(0)}>NEU STARTEN</button>
        <button
          type="button"
          onClick={() => {
            window.sessionStorage.removeItem(SESSION_KEY)
            setSchluessel('')
            setEingabe('')
          }}
        >
          REGIE SPERREN
        </button>
        <span>
          Schritt {index + 1}/{PHASEN.length} · {fehler ? 'Verbindung gestört' : 'Show verbunden'}
        </span>
        {authFehler && <span className="stz-regie-fehler">{authFehler}</span>}
      </div>

      {!geladen && <div className="stz-regie-laden">REGIESTAND WIRD GELADEN …</div>}

      <DemoZiehungsBuehne
        kompakt
        schritt={stand.schritt}
        updatedAt={stand.updatedAt}
        clockOffset={stand.clockOffset}
        verbindung={!fehler}
      />
    </>
  )
}
