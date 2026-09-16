import { useCallback, useEffect, useRef, useState } from 'react'
import { Beer, Bomb, Cat, Coins, Gem, Mountain } from 'lucide-react'

import SpielKarte from './SpielKarte.jsx'
import { useSpielLauf } from './spiel-lauf.js'
import { GOLD_NACH_KEY, GOLD_OBJEKTE, SPIEL_NACH_KEY, TEXTE, fuelle, zahl } from '../data/terminal.js'

/**
 * GOLDRAUSCH — das zweite Spiel im Tresor.
 *
 * Von oben faellt, was in einer Truhe liegen koennte, und ein paar Dinge, die
 * dort nichts zu suchen haben. Angetippt wird das Gold: Muenze, Diamant,
 * Badeente und sehr selten die goldene Badeente. Die Bombe kostet Punkte, das
 * Bier verschwimmt den Blick, der Kater dreht die Richtung, der Stein
 * blockiert kurz.
 *
 * Dreissig Sekunden, und sie werden immer schneller: am Anfang trudelt alles
 * gemuetlich durchs Bild, nach zwanzig Sekunden ist es hektisch.
 *
 * WIE ES AUF EINEM TELEFON FLUESSIG BLEIBT
 * ----------------------------------------
 * Die Objekte sind normale Knoepfe im DOM, aber ihre Position schreibt ein
 * einziges requestAnimationFrame direkt als `transform` — kein React-Render
 * pro Frame, keine Layoutaenderung, nie mehr als ein Dutzend Elemente
 * gleichzeitig. React rendert nur beim Auftauchen und Verschwinden.
 *
 * UND WIE IMMER: das Ergebnis hat keinen Einfluss auf die Ziehung. Punkte und
 * Lostopf sind getrennte Tabellen, die Gewinnchance haengt allein an der
 * Deckelnummer.
 */

const SPIEL = SPIEL_NACH_KEY.goldrausch
const T = TEXTE.g

/**
 * DIE DREI STUFEN
 *
 * Der Anfang ist absichtlich leicht: wer zum ersten Mal spielt, soll in den
 * ersten Sekunden Muenzen fangen und nicht ratlos zusehen. Danach zieht es in
 * zwei klar spuerbaren Stufen an — bei Sekunde 15 und bei Sekunde 22.
 *
 * Frueher lief das linear ueber die ganze Runde. Linear heisst: man merkt es
 * nie. Ein Sprung an einer festen Sekunde merkt man sofort, und genau das ist
 * gewollt. Innerhalb einer Stufe laeuft es weiter leicht an, damit es kein
 * Plateau gibt.
 *
 *   abSek   ab welcher Spielsekunde die Stufe gilt
 *   tempo   Fallgeschwindigkeit in Feldhoehen pro Sekunde, Anfang → Ende
 *   takt    Abstand zwischen zwei Objekten in Millisekunden, Anfang → Ende
 *   gleich  wie viele Objekte hoechstens zugleich im Bild sind
 *   boese   Faktor auf das Gewicht aller schaedlichen Objekte
 */
const STUFEN = [
  { abSek: 0, tempo: [0.2, 0.26], takt: [720, 620], gleich: 9, boese: 0.75 },
  { abSek: 15, tempo: [0.42, 0.52], takt: [420, 340], gleich: 13, boese: 1.3 },
  { abSek: 22, tempo: [0.62, 0.8], takt: [280, 205], gleich: 17, boese: 1.9 },
]

/* Wie lange die letzte Stufe dauert, wenn die Runde laenger laeuft als geplant. */
const STUFE_ENDE_SEK = 30

const WEG_AB = 1.14 // unterhalb dieser Hoehe ist das Objekt aus dem Bild
const STOERUNG_MS = 2400

/* Combo: jeder Fang in Folge zaehlt, eine Bombe setzt zurueck. */
const COMBO_MAX_STUFE = 8

/**
 * DIE GOLDENE BADEENTE
 *
 * Sie gibt 5.000 Punkte und darf deshalb nicht in jedem Spiel vorkommen. Sie
 * laeuft nicht ueber die Gewichtstabelle, sondern wird einmal je Runde
 * ausgewuerfelt: in etwa jedem achten Spiel taucht sie auf, genau ein Mal,
 * zu einem zufaelligen Zeitpunkt in der zweiten Haelfte. Ueber die
 * Gewichtstabelle waere sie nicht steuerbar — bei langen Runden kaeme sie
 * mehrfach, und "fast nie" waere sie nur im Mittel.
 */
const ENTE_CHANCE = 0.12
const ENTE_FRUEHESTENS_SEK = 9
const ENTE_SPAETESTENS_SEK = 26

/* Alles ausser der goldenen Ente wird nach Gewicht gezogen. */
const ZIEHBAR = GOLD_OBJEKTE.filter((o) => o.key !== 'goldente')

/**
 * Ein Objekt anteilig nach Gewicht ziehen. Der Faktor der aktuellen Stufe
 * hebt die schaedlichen Objekte an, ohne dass eine zweite Tabelle noetig ist.
 */
function objektZiehen(boese) {
  let summe = 0
  for (const o of ZIEHBAR) summe += o.gut ? o.gewicht : o.gewicht * boese

  let wurf = Math.random() * summe
  for (const o of ZIEHBAR) {
    wurf -= o.gut ? o.gewicht : o.gewicht * boese
    if (wurf <= 0) return o
  }
  return ZIEHBAR[0]
}

/** Die Stufe zur verstrichenen Spielzeit, mit dem Anteil innerhalb der Stufe. */
function stufeZu(sekunden) {
  let i = 0
  for (let n = 0; n < STUFEN.length; n += 1) if (sekunden >= STUFEN[n].abSek) i = n

  const stufe = STUFEN[i]
  const bis = STUFEN[i + 1] ? STUFEN[i + 1].abSek : STUFE_ENDE_SEK
  const spanne = Math.max(1, bis - stufe.abSek)
  const anteil = Math.min(1, Math.max(0, (sekunden - stufe.abSek) / spanne))

  return {
    tempo: stufe.tempo[0] + anteil * (stufe.tempo[1] - stufe.tempo[0]),
    takt: stufe.takt[0] + anteil * (stufe.takt[1] - stufe.takt[0]),
    gleich: stufe.gleich,
    boese: stufe.boese,
  }
}

/**
 * Die Badeente. Es gibt kein Entensymbol in der Icon-Bibliothek, und eine
 * Bibliothek nur fuer eine Ente waere albern — also steht sie hier als
 * Silhouette. Sie ist das Zeichen der Aktion, sie muss erkennbar sein.
 */
function Ente({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2.6 14.6c0-2.2 2.3-3.5 5.2-3.5h6.3c2.4 0 4.4 1 4.4 2.6 0 2.7-3.2 4.8-7.5 4.8-4.6 0-8.4-1.5-8.4-3.9Z" />
      <path d="M14.5 4.6c2 0 3.6 1.5 3.6 3.4 0 1.2-.7 2.3-1.8 3l-.2 1.5h-3.4l.2-1.7c-1-.6-1.7-1.7-1.7-2.8 0-1.9 1.6-3.4 3.3-3.4Z" />
      <path d="M18.3 7.1 22.4 8l-4 1.4z" />
      <circle cx="15.2" cy="7.3" r="0.95" fill="var(--trm-nacht, #0a0908)" />
    </svg>
  )
}

/** Schluessel → Symbol. Form und Symbol unterscheiden sich, nicht nur die Farbe. */
function GoldZeichen({ typ }) {
  if (typ === 'muenze') return <Coins size={26} aria-hidden="true" />
  if (typ === 'diamant') return <Gem size={26} aria-hidden="true" />
  if (typ === 'ente' || typ === 'goldente') return <Ente size={27} />
  if (typ === 'bombe') return <Bomb size={26} aria-hidden="true" />
  if (typ === 'bier') return <Beer size={26} aria-hidden="true" />
  if (typ === 'kater') return <Cat size={26} aria-hidden="true" />
  return <Mountain size={24} aria-hidden="true" />
}

export default function Goldrausch({ sitzung, best = null, onErgebnis }) {
  const [objekte, setObjekte] = useState([])
  const [combo, setCombo] = useState(0)
  const [stoerung, setStoerung] = useState(null)
  const [meldung, setMeldung] = useState(null)
  /* Zaehler, kein Schalter: jede goldene Ente soll den Lichtblitz neu
     ausloesen, auch wenn zufaellig zwei Runden hintereinander eine haben. */
  const [blitz, setBlitz] = useState(0)

  const buehneRef = useRef(null)
  const masseRef = useRef({ breite: 300, hoehe: 300 })
  const elemente = useRef(new Map())
  const listeRef = useRef([])
  const naechsteId = useRef(0)
  const comboRef = useRef(0)
  const sperreRef = useRef(0)
  const meldungNrRef = useRef(0)
  const startRef = useRef(0)
  /* Sekunde, in der die goldene Ente faellt — null heisst: in dieser Runde nicht. */
  const enteAbRef = useRef(null)
  const sanftRef = useRef(false)
  const [sanft, setSanft] = useState(false)

  const lauf = useSpielLauf({ sitzung, game: 'goldrausch', onErgebnis })
  const { laeuft, punkteGeben, rundeZaehlen, starten: laufStarten } = lauf

  /* Die Vorliebe steht doppelt: im Ref fuer die Animationsschleife, die
     sechzigmal pro Sekunde danach fragt, und im Zustand fuer das
     `data-sanft`-Attribut, das CSS liest. Ein Ref darf beim Rendern nicht
     gelesen werden — deshalb beides. */
  useEffect(() => {
    let sanft
    try {
      sanft = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      sanft = false
    }
    sanftRef.current = sanft
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSanft(sanft)
  }, [])

  /* Die Buehne ausmessen. Die Objekte rechnen in Bruchteilen der Feldhoehe,
     damit dieselbe Runde auf 320 und auf 768 Pixeln gleich schwer ist. */
  useEffect(() => {
    const el = buehneRef.current
    if (!el) return undefined

    const messen = () => {
      masseRef.current = { breite: el.clientWidth || 300, hoehe: el.clientHeight || 300 }
    }
    messen()

    if (typeof ResizeObserver !== 'function') {
      window.addEventListener('resize', messen)
      return () => window.removeEventListener('resize', messen)
    }
    const beobachter = new ResizeObserver(messen)
    beobachter.observe(el)
    return () => beobachter.disconnect()
  }, [laeuft])

  /** Verstrichene Spielsekunden. Daraus ergibt sich die Stufe. */
  const sekunden = useCallback(() => {
    if (!startRef.current) return 0
    return Math.max(0, (Date.now() - startRef.current) / 1000)
  }, [])

  /* Die Bewegung. Ein Frame-Zyklus fuer alle Objekte. */
  useEffect(() => {
    if (!laeuft) return undefined

    let frame = 0
    let vorher = performance.now()

    const schritt = (jetzt) => {
      const dt = Math.min(0.05, (jetzt - vorher) / 1000)
      vorher = jetzt

      const { breite, hoehe } = masseRef.current
      const stufe = stufeZu(sekunden())
      const tempo = stufe.tempo * (sanftRef.current ? 0.7 : 1)

      let etwasWeg = false
      const liste = listeRef.current

      for (let i = 0; i < liste.length; i += 1) {
        const o = liste[i]
        o.y += tempo * dt
        if (o.vx) {
          o.x += o.vx * dt
          if (o.x < 8 || o.x > 92) o.vx *= -1
        }
        if (o.y > WEG_AB) {
          etwasWeg = true
          continue
        }

        const el = elemente.current.get(o.id)
        if (el) {
          const px = (o.x / 100) * breite
          const py = o.y * hoehe
          const dreh = o.dreh ? o.dreh * (o.y * 360) : 0
          el.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -50%) rotate(${dreh.toFixed(1)}deg)`
        }
      }

      if (etwasWeg) {
        listeRef.current = liste.filter((o) => o.y <= WEG_AB)
        liste
          .filter((o) => o.y > WEG_AB)
          .forEach((o) => elemente.current.delete(o.id))
        setObjekte(listeRef.current)
      }

      frame = requestAnimationFrame(schritt)
    }

    frame = requestAnimationFrame(schritt)
    return () => cancelAnimationFrame(frame)
  }, [laeuft, sekunden])

  /* Der Nachschub. Der Takt zieht mit dem Verlauf an, deshalb plant sich der
     Zeitgeber jedes Mal neu statt in einem festen Intervall zu laufen. */
  useEffect(() => {
    if (!laeuft) return undefined

    let uhr = 0

    const legen = (art) => {
      const objekt = {
        id: naechsteId.current++,
        typ: art.key,
        x: 10 + Math.random() * 80,
        y: -0.12,
        /* Nur ein Teil driftet seitlich — alles gleichzeitig waere Unruhe
           ohne Gewinn. */
        vx: Math.random() < 0.35 ? (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 12) : 0,
        dreh: sanftRef.current ? 0 : Math.random() < 0.5 ? 0 : Math.random() < 0.5 ? -0.4 : 0.4,
      }
      listeRef.current = [...listeRef.current, objekt]
      setObjekte(listeRef.current)
    }

    const nachlegen = () => {
      const jetztSek = sekunden()
      const stufe = stufeZu(jetztSek)

      /* Die goldene Ente hat ihren eigenen Termin und draengelt sich vor. Sie
         faellt immer allein in diesen Takt — sonst geht sie im Gewimmel der
         dritten Stufe unter, und das waere schade um den seltenen Moment. */
      if (enteAbRef.current != null && jetztSek >= enteAbRef.current) {
        enteAbRef.current = null
        legen(GOLD_NACH_KEY.goldente)
      } else if (listeRef.current.length < stufe.gleich) {
        legen(objektZiehen(stufe.boese))
      }

      uhr = setTimeout(nachlegen, stufe.takt)
    }

    uhr = setTimeout(nachlegen, 260)
    return () => clearTimeout(uhr)
  }, [laeuft, sekunden])

  /* Stoerung und Einblendung laufen von selbst ab. */
  useEffect(() => {
    if (!stoerung) return undefined
    const uhr = setTimeout(() => setStoerung(null), STOERUNG_MS)
    return () => clearTimeout(uhr)
  }, [stoerung])

  useEffect(() => {
    if (!meldung) return undefined
    const uhr = setTimeout(() => setMeldung(null), 900)
    return () => clearTimeout(uhr)
  }, [meldung])

  const melden = useCallback((art, text) => {
    meldungNrRef.current += 1
    setMeldung({ nr: meldungNrRef.current, art, text })
  }, [])

  const starten = useCallback(async () => {
    const begonnen = await laufStarten()
    if (!begonnen) return false
    listeRef.current = []
    elemente.current.clear()
    naechsteId.current = 0
    comboRef.current = 0
    sperreRef.current = 0
    startRef.current = Date.now()
    /* Einmal je Runde entscheiden, ob es die goldene Ente ueberhaupt gibt.
       Wird sie hier nicht eingeplant, kommt sie in diesem Spiel nicht vor. */
    enteAbRef.current =
      Math.random() < ENTE_CHANCE
        ? ENTE_FRUEHESTENS_SEK + Math.random() * (ENTE_SPAETESTENS_SEK - ENTE_FRUEHESTENS_SEK)
        : null
    setObjekte([])
    setCombo(0)
    setStoerung(null)
    setMeldung(null)
    setBlitz(0)
    return true
  }, [laufStarten])

  /** Ein Objekt wurde angetippt. */
  const fangen = useCallback(
    (objekt) => {
      if (!laeuft) return
      if (Date.now() < sperreRef.current) return

      const art = GOLD_NACH_KEY[objekt.typ]
      if (!art) return

      /* Weg ist es in jedem Fall — auch die Bombe. */
      listeRef.current = listeRef.current.filter((o) => o.id !== objekt.id)
      elemente.current.delete(objekt.id)
      setObjekte(listeRef.current)

      if (art.gut) {
        comboRef.current += 1
        setCombo(comboRef.current)
        rundeZaehlen()

        /* Die goldene Ente gibt ihre 5.000 glatt — ohne Combofaktor. Sie ist
           schon selten genug; sie zusaetzlich an eine laufende Serie zu
           koppeln, wuerde den Zufall noch einmal verstaerken. */
        if (objekt.typ === 'goldente') {
          punkteGeben(art.punkte)
          setBlitz((n) => n + 1)
          melden('gold', fuelle(T.goldente, { punkte: zahl(art.punkte) }))
          return
        }

        const faktor = 1 + Math.min(comboRef.current - 1, COMBO_MAX_STUFE) * 0.1
        const wert = Math.round(art.punkte * faktor)
        punkteGeben(wert)
        melden('treffer', `${art.name} +${zahl(wert)}`)
        return
      }

      comboRef.current = 0
      setCombo(0)

      if (art.punkte < 0) {
        punkteGeben(art.punkte)
        melden('verkantet', `${art.name} –${zahl(Math.abs(art.punkte))}`)
        return
      }
      if (art.sperre) {
        sperreRef.current = Date.now() + art.sperre
        melden('verkantet', `${art.name} — ${T.blockiert}`)
        return
      }
      if (art.stoerung) {
        setStoerung(art.stoerung)
        melden('verkantet', art.name)
      }
    },
    [laeuft, punkteGeben, rundeZaehlen, melden],
  )

  return (
    <SpielKarte
      spiel={SPIEL}
      lauf={{ ...lauf, starten }}
      best={best}
      leiste={
        <span className="trm-spiel__combo" data-an={combo >= 2 ? '1' : '0'}>
          {combo >= 2 ? fuelle(T.combo, { n: combo }) : ''}
        </span>
      }
    >
      {laeuft && (
        <>
          <div
            className="trm-gold-buehne"
            ref={buehneRef}
            data-stoerung={stoerung || 'nein'}
            data-sanft={sanft ? '1' : '0'}
          >
            {objekte.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`trm-stueck trm-stueck--${o.typ}`}
                ref={(el) => {
                  if (el) elemente.current.set(o.id, el)
                  else elemente.current.delete(o.id)
                }}
                onPointerDown={() => fangen(o)}
              >
                <GoldZeichen typ={o.typ} />
                <span className="trm-nur-sr">{GOLD_NACH_KEY[o.typ]?.name}</span>
              </button>
            ))}
          </div>

          {/* Der Tresor am unteren Rand. Dorthin faellt alles, was niemand fängt. */}
          <span className="trm-gold-tresor" aria-hidden="true" />

          {/* Der Moment der goldenen Ente: das Feld wird einmal kurz von Gold
              ueberflutet. Ueber den Schluessel neu gemountet, damit die
              Animation auch beim zweiten Mal wieder von vorn laeuft. */}
          {blitz > 0 && <span key={blitz} className="trm-gold-blitz" aria-hidden="true" />}

          {meldung && (
            <p key={meldung.nr} className={`trm-spiel__ruf trm-spiel__ruf--${meldung.art}`}>
              {meldung.text}
            </p>
          )}
        </>
      )}
    </SpielKarte>
  )
}
