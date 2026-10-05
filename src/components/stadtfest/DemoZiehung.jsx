import { useEffect, useMemo, useState } from 'react'
import { Check, Trophy } from 'lucide-react'
import logo from '../../assets/brand/logo-web-auf-dunkel.webp'

const START_MS = 9000
const DRAW_MS = 15000
const WINNER_MS = 10000
const BONUS_INTRO_MS = 12000
const END_MS = 20000

const POTS = [
  { key: 'gold_2_5g', label: '2,5 g Gold', short: 'GOLD', total: 137, slots: 2 },
  { key: 'kuechengutschein_1000', label: '1.000 € Küchengutschein', short: 'KÜCHENGUTSCHEIN', total: 123, slots: 5 },
  { key: 'spanndecke_20qm', label: 'Spanndecke bis 20 m²', short: 'SPANNDECKE', total: 117, slots: 1 },
  { key: 'wellness_2n_2p', label: 'Wellnessurlaub – 2 Nächte / 2 Personen', short: 'WELLNESS', total: 133, slots: 1 },
]

const HAUPT_LOSE_GESAMT = POTS.reduce((summe, pot) => summe + pot.total, 0)
const BONUS_POT = { key: 'bonus', label: 'Bonus-Runde', short: 'BONUS', total: 202, slots: 7 }

const GEWINNER = [
  { drawId: 'demo-gutschein-1', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 1, name: 'Felix Bauer', code: '1734' },
  { drawId: 'demo-gutschein-2', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 2, name: 'Anna Keller', code: '9051' },
  { drawId: 'demo-gold-1', prizeKey: 'gold_2_5g', prizeTitle: '2,5 g Gold', prizeNumber: 1, name: 'Vera Bylinski', code: '4827' },
  { drawId: 'demo-gutschein-3', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 3, name: 'Jonas Fischer', code: '7520' },
  { drawId: 'demo-spanndecke', prizeKey: 'spanndecke_20qm', prizeTitle: 'Spanndecke bis 20 m²', prizeNumber: 1, name: 'Michael Wimmer', code: '6612' },
  { drawId: 'demo-gutschein-4', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 4, name: 'Sabrina Hofmann', code: '1149' },
  { drawId: 'demo-wellness', prizeKey: 'wellness_2n_2p', prizeTitle: 'Wellnessurlaub – 2 Nächte / 2 Personen', prizeNumber: 1, name: 'Thomas Schmitt', code: '2408' },
  { drawId: 'demo-gutschein-5', prizeKey: 'kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein', prizeNumber: 5, name: 'Lea Wagner', code: '5377' },
  { drawId: 'demo-gold-2', prizeKey: 'gold_2_5g', prizeTitle: '2,5 g Gold', prizeNumber: 2, name: 'Anton Danner', code: '3186' },

  { drawId: 'demo-bonus-merch', drawType: 'bonus', prizeKey: 'bonus_merchpaket', prizeTitle: 'VIDEKO Merchpaket', prizeNumber: 1, name: 'Mia Schneider', code: '2194' },
  { drawId: 'demo-bonus-dinner', drawType: 'bonus', prizeKey: 'bonus_dinner_2_wuerzburg', prizeTitle: 'Dinner für zwei in Würzburg', prizeNumber: 1, name: 'Paul Berger', code: '4602' },
  { drawId: 'demo-bonus-vorrat', drawType: 'bonus', prizeKey: 'bonus_jahresvorrat_tabs_nudeln', prizeTitle: 'Jahresvorrat Spülmaschinentabs + Nudeln', prizeNumber: 1, name: 'Clara Hoffmann', code: '8081' },
  { drawId: 'demo-bonus-wellness', drawType: 'bonus', prizeKey: 'bonus_wellness_2n_2p', prizeTitle: 'Wellnesswochenende für 2 – Bonuspreis', prizeNumber: 1, name: 'Max Richter', code: '3505' },
  { drawId: 'demo-bonus-gold', drawType: 'bonus', prizeKey: 'bonus_gold_2_5g', prizeTitle: '2,5 g Gold – Bonuspreis', prizeNumber: 1, name: 'Rosemarie Minje', code: '7712' },
  { drawId: 'demo-bonus-gutschein-1', drawType: 'bonus', prizeKey: 'bonus_kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein – Bonuspreis', prizeNumber: 1, name: 'Daniel König', code: '6421' },
  { drawId: 'demo-bonus-gutschein-2', drawType: 'bonus', prizeKey: 'bonus_kuechengutschein_1000', prizeTitle: '1.000 € Küchengutschein – Bonuspreis', prizeNumber: 2, name: 'Julia Beck', code: '8950' },
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

function phaseDauer(phase) {
  if (!phase) return WINNER_MS
  if (phase.art === 'start') return START_MS
  if (phase.art === 'ziehen') return DRAW_MS
  if (phase.art === 'bonusIntro') return BONUS_INTRO_MS
  if (phase.art === 'ende') return END_MS
  return WINNER_MS
}

function preisTitel(preis) {
  if (!preis) return ''
  return preis.prizeNumber > 1 ? `${preis.prizeTitle} · Platz ${preis.prizeNumber}` : preis.prizeTitle
}

function preisKurz(preis) {
  if (!preis) return ''
  if (preis.prizeKey === 'kuechengutschein_1000' || preis.prizeKey === 'bonus_kuechengutschein_1000') {
    return '1.000 € Küchengutschein'
  }
  if (preis.prizeKey === 'spanndecke_20qm') return 'Spanndecke'
  if (preis.prizeKey === 'wellness_2n_2p' || preis.prizeKey === 'bonus_wellness_2n_2p') return 'Wellness'
  if (preis.prizeKey === 'gold_2_5g' || preis.prizeKey === 'bonus_gold_2_5g') return '2,5 g Gold'
  if (preis.prizeKey === 'bonus_dinner_2_wuerzburg') return 'Dinner für zwei'
  if (preis.prizeKey === 'bonus_jahresvorrat_tabs_nudeln') return 'Jahresvorrat Tabs + Nudeln'
  if (preis.prizeKey === 'bonus_merchpaket') return 'VIDEKO Merchpaket'
  return preis.prizeTitle
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
          {String((i * 17 + 11) % Math.max(total, 1) + 1).padStart(3, '0')}
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

function PotLeiste({ runde, revealed = 0 }) {
  const bisher = GEWINNER.slice(0, revealed)

  if (runde === 'bonus') {
    const gezogen = bisher.filter((w) => w.drawType === 'bonus').length
    return (
      <div className="stz-pots stz-pots--bonus" aria-label="Bonus-Lostopf">
        <div className="stz-pot stz-pot--bonus">
          <span className="stz-pot__name">BONUS-RUNDE · ALLE GLÜCKSRAD-TEILNEHMER</span>
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
    <aside className="stz-winnerboard" aria-label="Bisherige Gewinner">
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
      <div className="stz-startlinie"><span /><strong>WIR STARTEN GLEICH</strong><span /></div>
    </div>
  )
}

function BonusStartBild() {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--bonus">
      <p className="stz-kicker">9 VON 9 HAUPTPREISEN GEZOGEN.</p>
      <h1 className="stz-title">UND JETZT KOMMT DIE<span>BONUS-RUNDE.</span></h1>
      <p className="stz-lead">7 zusätzliche Preise · eigener Lostopf mit {BONUS_POT.total} Glücksrad-Teilnehmern.</p>
      <div className="stz-startlinie"><span /><strong>EXKLUSIV · ZUSÄTZLICH · DANACH</strong><span /></div>
    </div>
  )
}

function ZiehBild({ gewinner }) {
  const [rest, setRest] = useState(Math.ceil(DRAW_MS / 1000))
  const pot = gewinner.drawType === 'bonus'
    ? BONUS_POT
    : POTS.find((p) => p.key === gewinner.prizeKey)

  useEffect(() => {
    const ende = Date.now() + DRAW_MS
    const aktualisieren = () => {
      setRest(Math.max(0, Math.ceil((ende - Date.now()) / 1000)))
    }
    aktualisieren()
    const timer = window.setInterval(aktualisieren, 120)
    return () => window.clearInterval(timer)
  }, [gewinner.drawId])

  return (
    <div className="stz-stage__mitte stz-stage__mitte--ziehen" key={gewinner.drawId}>
      <div className="stz-zieh-energie" aria-hidden="true" />
      <p className="stz-kicker stz-kicker--puls">
        {gewinner.drawType === 'bonus' ? 'BONUS-RUNDE · JETZT WIRD GEZOGEN' : 'JETZT WIRD GEZOGEN'}
      </p>
      <h1 className="stz-preis">{preisTitel(gewinner)}</h1>
      <MischAnimation total={pot?.total ?? 0} />
      <p className="stz-warten">DER LOSTOPF WIRD GEMISCHT …</p>
      <div className="stz-countdown" aria-label={`Aufdeckung in ${rest} Sekunden`}>
        <span>AUFDECKUNG IN</span>
        <strong>{rest}</strong>
        <span>SEKUNDEN</span>
      </div>
    </div>
  )
}

function GewinnerBild({ gewinner }) {
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
      <div className="stz-gewinn"><span>GEWINNT</span><strong>{preisTitel(gewinner)}</strong></div>
    </div>
  )
}

function EndeBild() {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--ende">
      <Check className="stz-ende__check" size={54} strokeWidth={1.4} aria-hidden="true" />
      <p className="stz-kicker">ALLE ZIEHUNGEN ABGESCHLOSSEN</p>
      <h1 className="stz-title">9 HAUPTPREISE.<span>7 BONUSPREISE.</span></h1>
      <p className="stz-lead">Danke fürs Mitfiebern. Alle Gewinner bleiben rechts im Überblick sichtbar.</p>
    </div>
  )
}

export function DemoZiehungsBuehne({ kompakt = false, auto = false, schritt, onSchritt }) {
  const [intern, setIntern] = useState(0)
  const index = typeof schritt === 'number' ? schritt : intern
  const setzen = onSchritt || setIntern
  const phase = PHASEN[Math.max(0, Math.min(index, PHASEN.length - 1))]

  useEffect(() => {
    if (!auto) return undefined
    const timer = window.setTimeout(() => {
      setzen((index + 1) % PHASEN.length)
    }, phaseDauer(phase))
    return () => window.clearTimeout(timer)
  }, [auto, index, phase, setzen])

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
  const rundenGezogen = runde === 'bonus'
    ? Math.max(0, revealed - 9)
    : Math.min(revealed, 9)
  const rundenGesamt = runde === 'bonus' ? 7 : 9
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
      {phase.art === 'ziehen' && gewinner && <ZiehBild gewinner={gewinner} />}
      {phase.art === 'gewinner' && gewinner && <GewinnerBild gewinner={gewinner} />}
      {phase.art === 'ende' && <EndeBild />}

      <footer className="stz-stage__fuss">
        <div className="stz-fortschritt">
          <span className="stz-fortschritt__linie"><i style={{ width: `${fortschritt}%` }} /></span>
          <strong>{rundenGezogen} / {rundenGesamt}</strong>
          <span>{runde === 'bonus' ? 'BONUSPREISE AUFGEDECKT' : 'HAUPTPREISE AUFGEDECKT'}</span>
        </div>
        <PotLeiste runde={runde} revealed={revealed} />
        <span className="stz-sync stz-sync--simulation">Simulation</span>
      </footer>
    </section>
  )
}

export function DemoRegie() {
  const [schritt, setSchritt] = useState(0)
  const [auto, setAuto] = useState(false)

  return (
    <>
      <div className="stz-demo-controls">
        <strong className="stz-demo-controls__title">SIMULATION · INTERNE REGIE</strong>
        <button type="button" onClick={() => setSchritt((s) => Math.max(0, s - 1))}>← Zurück</button>
        <button type="button" onClick={() => setSchritt((s) => Math.min(PHASEN.length - 1, s + 1))}>Nächster Schritt →</button>
        <button type="button" onClick={() => { setSchritt(0); setAuto(false) }}>Neu starten</button>
        <button type="button" className={auto ? 'is-active' : ''} onClick={() => setAuto((v) => !v)}>
          {auto ? 'Autoplay stoppen' : 'Autoplay'}
        </button>
        <span>
          Schritt {schritt + 1}/{PHASEN.length} · Ziehung 15 s · Gewinner 10 s
        </span>
      </div>
      <DemoZiehungsBuehne kompakt schritt={schritt} onSchritt={setSchritt} auto={auto} />
    </>
  )
}
