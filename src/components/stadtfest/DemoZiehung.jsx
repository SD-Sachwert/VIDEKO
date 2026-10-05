import { useEffect, useMemo, useState } from 'react'
import { Check, Trophy } from 'lucide-react'
import logo from '../../assets/brand/logo-web-auf-dunkel.webp'

const TAKT_MS = 5200

const POTS = [
  { key: 'gold_2_5g', label: '2,5 g Gold', short: 'GOLD', total: 137, slots: 2 },
  { key: 'kuechengutschein_1000', label: '1.000 € Küchengutschein', short: 'KÜCHENGUTSCHEIN', total: 123, slots: 5 },
  { key: 'spanndecke_20qm', label: 'Spanndecke bis 20 m²', short: 'SPANNDECKE', total: 117, slots: 1 },
  { key: 'wellness_2n_2p', label: 'Wellnessurlaub – 2 Nächte / 2 Personen', short: 'WELLNESS', total: 133, slots: 1 },
]

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

function preisTitel(preis) {
  if (!preis) return ''
  return preis.prizeNumber > 1 ? `${preis.prizeTitle} · Platz ${preis.prizeNumber}` : preis.prizeTitle
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
          style={{ '--i': i, '--winkel': `${i * 18}deg`, '--delay': `${-(i * 0.17)}s` }}
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

function PotLeiste({ revealed = 0 }) {
  const bisher = GEWINNER.slice(0, revealed)
  const pots = [...POTS, BONUS_POT]
  return (
    <div className="stz-pots" aria-label="Lostöpfe">
      {pots.map((pot) => {
        const gezogen = pot.key === 'bonus'
          ? bisher.filter((w) => w.drawType === 'bonus').length
          : bisher.filter((w) => w.prizeKey === pot.key).length
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

function StartBild() {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--start">
      <p className="stz-kicker">WÜRZBURGER STADTFEST 2026</p>
      <h1 className="stz-title">DIE HAUPTPREIS-<span>ZIEHUNG</span></h1>
      <p className="stz-lead">510 Hauptpreis-Lose · 9 Hauptpreise</p>
      <p className="stz-sublead">Danach: 7 Bonuspreise unter allen 202 Glücksrad-Teilnehmern.</p>
      <div className="stz-startlinie"><span /><strong>WIR STARTEN GLEICH</strong><span /></div>
    </div>
  )
}

function BonusStartBild() {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--bonus">
      <p className="stz-kicker">EIGENTLICH WÄREN WIR JETZT FERTIG.</p>
      <h1 className="stz-title">ABER IHR MUSSTET WARTEN.<span>BONUS-RUNDE.</span></h1>
      <p className="stz-lead">7 zusätzliche Preise · alle 202 Glücksrad-Teilnehmer sind dabei.</p>
      <div className="stz-startlinie"><span /><strong>WIR LEGEN NOCH EINEN DRAUF</strong><span /></div>
    </div>
  )
}

function ZiehBild({ gewinner }) {
  const pot = gewinner.drawType === 'bonus'
    ? BONUS_POT
    : POTS.find((p) => p.key === gewinner.prizeKey)
  return (
    <div className="stz-stage__mitte stz-stage__mitte--ziehen" key={gewinner.drawId}>
      <p className="stz-kicker stz-kicker--puls">
        {gewinner.drawType === 'bonus' ? 'BONUS-RUNDE · JETZT WIRD GEZOGEN' : 'JETZT WIRD GEZOGEN'}
      </p>
      <h1 className="stz-preis">{preisTitel(gewinner)}</h1>
      <MischAnimation total={pot?.total ?? 0} />
      <p className="stz-warten">DER LOSTOPF WIRD GEMISCHT …</p>
    </div>
  )
}

function GewinnerBild({ gewinner }) {
  return (
    <div className="stz-stage__mitte stz-stage__mitte--gewinner" key={gewinner.drawId}>
      <div className="stz-konfetti" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
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
      <p className="stz-kicker">16 VON 16 GEZOGEN</p>
      <h1 className="stz-title">9 HAUPTPREISE.<span>7 BONUSPREISE.</span></h1>
      <p className="stz-lead">Danke fürs Mitfiebern. Wir melden uns bei allen Gewinnern persönlich.</p>
    </div>
  )
}

export function DemoZiehungsBuehne({ kompakt = false, auto = false, schritt, onSchritt }) {
  const [intern, setIntern] = useState(0)
  const index = typeof schritt === 'number' ? schritt : intern
  const setzen = onSchritt || setIntern

  useEffect(() => {
    if (!auto) return undefined
    const timer = window.setInterval(() => {
      setzen((index + 1) % PHASEN.length)
    }, TAKT_MS)
    return () => window.clearInterval(timer)
  }, [auto, index, setzen])

  const phase = PHASEN[Math.max(0, Math.min(index, PHASEN.length - 1))]
  const gewinner = typeof phase.index === 'number' ? GEWINNER[phase.index] : null
  const revealed = phase.art === 'ende'
    ? GEWINNER.length
    : typeof phase.index === 'number'
      ? phase.index + (phase.art === 'gewinner' ? 1 : 0)
      : 0

  const bonusIntro = phase.art === 'bonusIntro'

  return (
    <section className={`stz-stage${kompakt ? ' stz-stage--kompakt' : ''}`}>
      <div className="stz-stage__noise" aria-hidden="true" />
      <div className="stz-stage__glow" aria-hidden="true" />
      <header className="stz-stage__kopf">
        <img className="stz-logo" src={logo} alt="VIDEKO Küchen" />
        <div className="stz-live"><span className="stz-live__punkt" aria-hidden="true" /> LIVE</div>
      </header>

      {phase.art === 'start' && <StartBild />}
      {bonusIntro && <BonusStartBild />}
      {phase.art === 'ziehen' && gewinner && <ZiehBild gewinner={gewinner} />}
      {phase.art === 'gewinner' && gewinner && <GewinnerBild gewinner={gewinner} />}
      {phase.art === 'ende' && <EndeBild />}

      <footer className="stz-stage__fuss">
        <div className="stz-fortschritt">
          <span className="stz-fortschritt__linie"><i style={{ width: `${(revealed / GEWINNER.length) * 100}%` }} /></span>
          <strong>{revealed} / {GEWINNER.length}</strong>
          <span>GEWINNE AUFGEDECKT</span>
        </div>
        <PotLeiste revealed={revealed} />
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
        <span>Schritt {schritt + 1}/{PHASEN.length}</span>
      </div>
      <DemoZiehungsBuehne kompakt schritt={schritt} onSchritt={setSchritt} auto={auto} />
    </>
  )
}
