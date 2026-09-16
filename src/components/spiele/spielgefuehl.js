/**
 * Gemeinsames Spielgefuehl fuer die Terminal-Spiele.
 *
 * Jedes Spiel hat frueher sein eigenes Ruetteln, seine eigenen Funken und
 * seine eigene Vibration gebaut. Das sah in jedem Spiel anders aus und war
 * fuenfmal derselbe Fehler. Hier liegt das gemeinsame Handwerk: Ruettler,
 * Funken, Popups, Haptik, Klang. Die Spiele entscheiden nur noch WANN etwas
 * passiert, nicht mehr WIE es aussieht.
 *
 * Zwei Welten, weil die Spiele zwei Welten sind: Jump, Merge und Fit malen
 * auf Canvas, Crush und Leitungsfinder sind DOM. Darum gibt es `funkenwerk`
 * (Canvas) und `domSchicht` (DOM) mit derselben Idee, aber eigener Technik.
 *
 * Kein React, kein Import aus einem Spiel: nur Browser-APIs, die alle
 * vertragen. Alles laeuft auch, wenn der Browser nichts davon kann.
 */

/* ------------------------------------------------------------------ *
 * Ruecksicht: reduzierte Bewegung und schwache Geraete
 * ------------------------------------------------------------------ */

let sanftMerk = null
const sanftHoerer = new Set()

/** true, wenn der Nutzer reduzierte Bewegung wuenscht. Ergebnis wird gemerkt. */
export function sanft() {
  if (sanftMerk !== null) return sanftMerk
  sanftMerk = false
  try {
    const frage = window.matchMedia('(prefers-reduced-motion: reduce)')
    sanftMerk = frage.matches
    /* Der Wunsch kann sich im laufenden Betrieb aendern. */
    const merken = (e) => {
      sanftMerk = e.matches
      sanftHoerer.forEach((fn) => {
        try {
          fn(sanftMerk)
        } catch { /* ein kaputter Hoerer darf die anderen nicht mitreissen */ }
      })
    }
    if (frage.addEventListener) frage.addEventListener('change', merken)
    else if (frage.addListener) frage.addListener(merken)
  } catch { /* alte Browser: einfach volle Bewegung */ }
  return sanftMerk
}

/**
 * Auf Aenderungen des Bewegungswunsches hoeren. Ruft `fn` sofort mit dem
 * aktuellen Wert auf und danach bei jeder Aenderung — so muss kein Spiel
 * selbst matchMedia anfassen. Gibt die Abmeldung zurueck; die gehoert in das
 * Cleanup des Effekts, sonst haelt die Menge die Komponente fest.
 */
export function sanftHoeren(fn) {
  if (typeof fn !== 'function') return () => {}
  fn(sanft())
  sanftHoerer.add(fn)
  return () => sanftHoerer.delete(fn)
}

let stufeMerk = null

/**
 * Wie viel Effekt vertraegt das Geraet?
 * 0 = nichts (reduzierte Bewegung), 1 = sparsam (schwaches Handy), 2 = voll.
 */
export function stufe() {
  if (sanft()) return 0
  if (stufeMerk !== null) return stufeMerk
  stufeMerk = 2
  try {
    const kerne = navigator.hardwareConcurrency || 8
    const ram = navigator.deviceMemory || 8
    if (kerne <= 4 || ram <= 4) stufeMerk = 1
  } catch { /* unbekannt: voll */ }
  return stufeMerk
}

/**
 * Skaliert eine gewuenschte Partikelmenge auf das Geraet herunter.
 * Ein alter Mittelklasse-Androide bekommt die Haelfte, ein stiller Modus nichts.
 */
export function menge(anzahl) {
  const s = stufe()
  if (s === 0) return 0
  if (s === 1) return Math.max(1, Math.round(anzahl * 0.45))
  return anzahl
}

/* ------------------------------------------------------------------ *
 * Haptik
 * ------------------------------------------------------------------ */

/* Gemeinsame Muster, damit sich ein Treffer in allen Spielen gleich anfuehlt. */
export const HAPTIK = {
  tipp: 8,
  treffer: [0, 18],
  gut: [0, 12, 40, 12],
  explosion: [0, 26, 30, 16],
  perfekt: [0, 10, 28, 10, 28, 18],
  fehler: [0, 40],
  fieber: [0, 18, 50, 18, 50, 28],
}

let letzteVib = 0

/**
 * Kurze Vibration. Kann der Browser das nicht, passiert einfach nichts.
 * Gedrosselt, damit eine lange Kettenreaktion das Handy nicht dauerbrummen laesst.
 */
export function vibrieren(muster) {
  if (sanft()) return
  const jetzt = Date.now()
  if (jetzt - letzteVib < 60) return
  letzteVib = jetzt
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(muster)
  } catch { /* Safari und Co.: nichts tun */ }
}

/* ------------------------------------------------------------------ *
 * Klang
 * ------------------------------------------------------------------ *
 *
 * Absichtlich synthetisch statt Audiodateien: keine Ladezeit, kein
 * zusaetzliches Gewicht im Build, keine Musik, die jemand wegdruecken muss.
 * Nur sehr kurze Toene als Quittung fuer eine Aktion. Der AudioContext
 * entsteht erst beim ersten Ton, also immer nach einer Nutzergeste, damit die
 * Autoplay-Regeln der Browser eingehalten werden. Klappt das nicht, bleibt es
 * still und das Spiel laeuft weiter.
 */

const TON_SPEICHER = 'trm-ton'
let tonAn = null
let kontext = null
let summe = null
let letzterTon = 0

/** Ist der Ton an? Standard ja, die Wahl haelt im localStorage. */
export function tonStatus() {
  if (tonAn !== null) return tonAn
  tonAn = true
  try {
    if (window.localStorage.getItem(TON_SPEICHER) === 'aus') tonAn = false
  } catch { /* privater Modus: Standard */ }
  return tonAn
}

/** Schaltet den Ton um und gibt den neuen Stand zurueck. */
export function tonUmschalten() {
  tonAn = !tonStatus()
  try { window.localStorage.setItem(TON_SPEICHER, tonAn ? 'an' : 'aus') } catch { /* egal */ }
  if (!tonAn && summe) { try { summe.gain.value = 0 } catch { /* egal */ } }
  if (tonAn && summe) { try { summe.gain.value = LAUT } catch { /* egal */ } }
  return tonAn
}

/* Leise. Das hier ist eine Quittung, kein Konzert. */
const LAUT = 0.12

function kontextHolen() {
  if (kontext) return kontext
  try {
    const Bau = window.AudioContext || window.webkitAudioContext
    if (!Bau) return null
    kontext = new Bau()
    summe = kontext.createGain()
    summe.gain.value = tonStatus() ? LAUT : 0
    summe.connect(kontext.destination)
  } catch {
    kontext = null
  }
  return kontext
}

/**
 * Die Klangfarben. Jeder Eintrag ist ein sehr kurzer Ton:
 * form, Startfrequenz, Zielfrequenz, Dauer in Sekunden.
 */
export const KLANG = {
  pop: { form: 'triangle', von: 620, bis: 880, dauer: 0.07 },
  treffer: { form: 'square', von: 180, bis: 90, dauer: 0.1 },
  sprung: { form: 'triangle', von: 340, bis: 700, dauer: 0.11 },
  landung: { form: 'sine', von: 220, bis: 130, dauer: 0.07 },
  combo: { form: 'triangle', von: 700, bis: 1250, dauer: 0.12 },
  explosion: { form: 'sawtooth', von: 260, bis: 60, dauer: 0.22 },
  kraft: { form: 'triangle', von: 480, bis: 1400, dauer: 0.26 },
  perfekt: { form: 'sine', von: 880, bis: 1600, dauer: 0.16 },
  zeit: { form: 'sine', von: 520, bis: 1040, dauer: 0.14 },
  fehler: { form: 'sawtooth', von: 200, bis: 70, dauer: 0.18 },
  tick: { form: 'square', von: 900, bis: 900, dauer: 0.03 },
}

/**
 * Spielt einen kurzen Ton.
 * `hoehe` verschiebt die Tonhoehe (1 = normal), damit eine Combo nach oben
 * klettern kann, ohne dass es dafuer zehn Klangfarben braucht.
 */
export function klang(name, hoehe = 1) {
  if (!tonStatus()) return
  const satz = KLANG[name]
  if (!satz) return
  /* Bei einer Kettenreaktion prasseln sonst dreissig Toene gleichzeitig. */
  const jetzt = Date.now()
  if (jetzt - letzterTon < 24) return
  letzterTon = jetzt
  const ctx = kontextHolen()
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') ctx.resume()
    const t = ctx.currentTime
    const osz = ctx.createOscillator()
    const hebel = ctx.createGain()
    osz.type = satz.form
    osz.frequency.setValueAtTime(satz.von * hoehe, t)
    osz.frequency.exponentialRampToValueAtTime(Math.max(40, satz.bis * hoehe), t + satz.dauer)
    hebel.gain.setValueAtTime(0.0001, t)
    hebel.gain.exponentialRampToValueAtTime(1, t + 0.008)
    hebel.gain.exponentialRampToValueAtTime(0.0001, t + satz.dauer)
    osz.connect(hebel)
    hebel.connect(summe)
    osz.start(t)
    osz.stop(t + satz.dauer + 0.02)
    osz.onended = () => { try { osz.disconnect(); hebel.disconnect() } catch { /* egal */ } }
  } catch { /* Ton ist Beiwerk, nie ein Grund fuer einen Absturz */ }
}

/** Schliesst den AudioContext. Beim Verlassen eines Spiels aufrufen. */
export function klangSchliessen() {
  if (!kontext) return
  try { kontext.close() } catch { /* egal */ }
  kontext = null
  summe = null
}

/* ------------------------------------------------------------------ *
 * Ruettler
 * ------------------------------------------------------------------ *
 *
 * Ein Zaehler, kein Timer. Das Spiel stoesst an, der Ruettler klingt von
 * selbst ab. Wer `versatz` pro Bild abfragt, bekommt eine kleine Verschiebung
 * zurueck. Ohne Stoss ist die Verschiebung exakt null, es laeuft also nichts
 * im Leerlauf mit.
 */
export function ruettler({ abfall = 0.86, max = 14 } = {}) {
  let kraft = 0
  let stand = 0
  return {
    /** Anstossen. Staerke in Pixeln, der staerkere Stoss gewinnt. */
    stoss(staerke) {
      if (sanft()) return
      kraft = Math.min(max, Math.max(kraft, staerke))
    },
    /** Verschiebung fuer dieses Bild. `dt` in Millisekunden. */
    versatz(dt = 16) {
      if (kraft < 0.15) { kraft = 0; return { x: 0, y: 0, kraft: 0 } }
      stand += dt
      /* Abfall auf 60 Bilder normiert, damit ein langsames Handy nicht laenger ruettelt. */
      kraft *= Math.pow(abfall, dt / 16.67)
      const winkel = stand * 0.05
      return {
        x: Math.cos(winkel * 1.7) * kraft,
        y: Math.sin(winkel * 2.3) * kraft * 0.7,
        kraft,
      }
    },
    /** Sofort still, etwa beim Rundenende. */
    leeren() { kraft = 0 },
    aktiv() { return kraft > 0.15 },
  }
}

/* ------------------------------------------------------------------ *
 * Funken auf Canvas
 * ------------------------------------------------------------------ *
 *
 * Fester Vorrat statt staendig neuer Objekte: ein Spiel schiesst in einer
 * Kettenreaktion hunderte Partikel, und jeder neue Objektwurf waere Arbeit
 * fuer den Garbage Collector mitten im Bild. Ist der Vorrat voll, ersetzt ein
 * neues Partikel das aelteste.
 */
export function funkenwerk(vorrat = 180) {
  const teile = []
  for (let i = 0; i < vorrat; i += 1) {
    teile.push({ leben: 0, x: 0, y: 0, vx: 0, vy: 0, dauer: 1, gr: 1, farbe: '#fff', art: 'punkt', dreh: 0, drehV: 0 })
  }
  let naechstes = 0

  const frei = () => {
    for (let i = 0; i < vorrat; i += 1) {
      const k = (naechstes + i) % vorrat
      if (teile[k].leben <= 0) { naechstes = (k + 1) % vorrat; return teile[k] }
    }
    const k = naechstes
    naechstes = (naechstes + 1) % vorrat
    return teile[k]
  }

  return {
    /**
     * Funken ausstossen. Koordinaten im Raum des Canvas.
     * `tempo` in Pixeln pro Sekunde, `schwere` in Pixeln pro Sekunde im Quadrat.
     */
    schuss({
      x, y, anzahl = 10, farbe = '#c9a050', tempo = 180, streuung = Math.PI * 2,
      richtung = -Math.PI / 2, schwere = 900, leben = 620, gr = 3, art = 'punkt',
    }) {
      const n = menge(anzahl)
      for (let i = 0; i < n; i += 1) {
        const p = frei()
        const w = richtung + (Math.random() - 0.5) * streuung
        const v = tempo * (0.45 + Math.random() * 0.75)
        p.x = x
        p.y = y
        p.vx = Math.cos(w) * v
        p.vy = Math.sin(w) * v
        p.dauer = leben * (0.7 + Math.random() * 0.6)
        p.leben = p.dauer
        p.gr = gr * (0.6 + Math.random() * 0.8)
        p.farbe = Array.isArray(farbe) ? farbe[(Math.random() * farbe.length) | 0] : farbe
        p.art = art
        p.schwere = schwere
        p.dreh = Math.random() * Math.PI * 2
        p.drehV = (Math.random() - 0.5) * 12
      }
    },
    /** Ein Bild weiter. `dt` in Millisekunden. */
    schritt(dt) {
      const s = Math.min(dt, 60) / 1000
      for (let i = 0; i < vorrat; i += 1) {
        const p = teile[i]
        if (p.leben <= 0) continue
        p.leben -= dt
        p.vy += p.schwere * s
        p.vx *= 0.99
        p.x += p.vx * s
        p.y += p.vy * s
        p.dreh += p.drehV * s
      }
    },
    /** Zeichnet alle lebenden Funken. */
    malen(ctx) {
      for (let i = 0; i < vorrat; i += 1) {
        const p = teile[i]
        if (p.leben <= 0) continue
        const rest = p.leben / p.dauer
        ctx.globalAlpha = Math.max(0, Math.min(1, rest))
        ctx.fillStyle = p.farbe
        if (p.art === 'krume') {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.dreh)
          ctx.fillRect(-p.gr, -p.gr * 0.6, p.gr * 2, p.gr * 1.2)
          ctx.restore()
        } else if (p.art === 'stern') {
          const r = p.gr * (0.6 + rest)
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.dreh)
          ctx.beginPath()
          for (let k = 0; k < 4; k += 1) {
            const w = (k / 4) * Math.PI * 2
            ctx.lineTo(Math.cos(w) * r, Math.sin(w) * r)
            ctx.lineTo(Math.cos(w + Math.PI / 4) * r * 0.32, Math.sin(w + Math.PI / 4) * r * 0.32)
          }
          ctx.closePath()
          ctx.fill()
          ctx.restore()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.gr * (0.35 + rest * 0.65), 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    },
    leeren() { for (let i = 0; i < vorrat; i += 1) teile[i].leben = 0 },
    aktiv() { return teile.some((p) => p.leben > 0) },
  }
}

/* ------------------------------------------------------------------ *
 * Schwebende Texte auf Canvas
 * ------------------------------------------------------------------ *
 *
 * Score-Popup, Combo-Popup und Zeitbonus-Popup sind dieselbe Sache mit
 * anderer Farbe. Darum ein Werk fuer alle drei.
 */
export function rufwerk(vorrat = 14) {
  const rufe = []
  for (let i = 0; i < vorrat; i += 1) rufe.push({ leben: 0 })
  let naechstes = 0

  return {
    /** `art`: 'punkte' | 'combo' | 'zeit' | 'ruf'. */
    zeigen({ x, y, text, art = 'punkte', gr = 22, farbe = null, steigen = 46 }) {
      if (sanft() && art === 'punkte') return
      let p = rufe.find((r) => r.leben <= 0)
      if (!p) { p = rufe[naechstes]; naechstes = (naechstes + 1) % vorrat }
      p.x = x
      p.y = y
      p.text = String(text)
      p.art = art
      p.gr = gr
      p.farbe = farbe
      p.steigen = steigen
      p.dauer = art === 'combo' || art === 'ruf' ? 950 : 700
      p.leben = p.dauer
    },
    schritt(dt) {
      for (let i = 0; i < vorrat; i += 1) if (rufe[i].leben > 0) rufe[i].leben -= dt
    },
    /** `farben` liefert die Tokenwerte des Spiels: { gold, creme, gruen, rot }. */
    malen(ctx, farben) {
      for (let i = 0; i < vorrat; i += 1) {
        const p = rufe[i]
        if (p.leben <= 0) continue
        const t = 1 - p.leben / p.dauer
        /* Schnell raus, dann ausschweben: das liest sich besser als linear. */
        const hoch = (1 - Math.pow(1 - t, 3)) * p.steigen
        const gross = t < 0.16 ? 0.6 + (t / 0.16) * 0.55 : 1.15 - (t - 0.16) * 0.16
        ctx.save()
        ctx.globalAlpha = Math.max(0, Math.min(1, p.leben / p.dauer * 1.8))
        ctx.translate(p.x, p.y - hoch)
        ctx.scale(gross, gross)
        ctx.font = `800 ${p.gr}px "Inter", system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const farbe = p.farbe
          || (p.art === 'zeit' ? farben.gruen : p.art === 'combo' ? farben.goldHell : farben.creme)
        ctx.lineWidth = 4
        ctx.strokeStyle = farben.nacht
        ctx.strokeText(p.text, 0, 0)
        ctx.fillStyle = farbe
        ctx.fillText(p.text, 0, 0)
        ctx.restore()
      }
      ctx.globalAlpha = 1
    },
    leeren() { for (let i = 0; i < vorrat; i += 1) rufe[i].leben = 0 },
  }
}

/* ------------------------------------------------------------------ *
 * DOM-Welt: Crush und Leitungsfinder
 * ------------------------------------------------------------------ *
 *
 * Hier waere ein React-State pro Partikel der sichere Weg in eine ruckelnde
 * Seite: sechzig Rerender pro Sekunde fuer Konfetti. Stattdessen haengen die
 * Elemente direkt am DOM, animieren per CSS und raeumen sich nach der
 * Animation selbst weg. `leeren()` beim Aufraeumen entfernt garantiert alles,
 * auch wenn ein `animationend` nie kommt (Tab im Hintergrund).
 */
/**
 * Zieht einen schon eingehaengten Ruf so weit nach innen, dass er ganz in der
 * Schicht steht. Noetig nur fuer die langen Woerter: `KOMPLETT GESTOERT` ist
 * auf einem 390er Display breiter als die halbe Buehne, und die Schicht
 * schneidet ab. Kostet ein Layout-Lesen, darum nicht fuer die haeufigen
 * kurzen Zahlen-Popups.
 */
function mitteHalten(el, knoten) {
  const raum = el.clientWidth
  const breite = knoten.offsetWidth
  if (!raum || !breite || breite + 8 >= raum) return
  const halb = breite / 2 + 4
  const ist = (parseFloat(knoten.style.left) / 100) * raum
  const soll = Math.min(Math.max(ist, halb), raum - halb)
  if (Math.abs(soll - ist) > 0.5) knoten.style.left = `${(soll / raum) * 100}%`
}

export function domSchicht(el) {
  const offen = new Set()
  let zu = false

  const weg = (knoten) => {
    if (!offen.has(knoten)) return
    offen.delete(knoten)
    if (knoten.parentNode) knoten.parentNode.removeChild(knoten)
  }

  const setzen = (knoten, dauer) => {
    offen.add(knoten)
    el.appendChild(knoten)
    knoten.addEventListener('animationend', () => weg(knoten), { once: true })
    /* Notbremse: im Hintergrundtab feuert `animationend` nicht. */
    window.setTimeout(() => weg(knoten), dauer + 400)
  }

  return {
    /** Schwebender Text. `x`/`y` in Prozent der Schicht. */
    popup({ x, y, text, art = 'punkte' }) {
      if (zu || !el) return
      if (sanft() && art === 'punkte') return
      const d = document.createElement('div')
      d.className = `sg-ruf sg-ruf--${art}`
      d.style.left = `${x}%`
      d.style.top = `${y}%`
      d.textContent = String(text)
      setzen(d, 1000)
      /* Breite Texte und die grosse Zahl duerfen nicht am Rand abgeschnitten
         werden, nur weil der Treffer dort lag. */
      if (art === 'combo' || art === 'ruf' || art === 'gross') mitteHalten(el, d)
    },
    /** Kleine Funkenwolke an einer Stelle. */
    funken({ x, y, anzahl = 8, art = 'gold', weite = 46 }) {
      if (zu || !el) return
      const n = menge(anzahl)
      for (let i = 0; i < n; i += 1) {
        const d = document.createElement('i')
        d.className = `sg-funke sg-funke--${art}`
        const w = Math.random() * Math.PI * 2
        const r = weite * (0.35 + Math.random() * 0.9)
        d.style.left = `${x}%`
        d.style.top = `${y}%`
        d.style.setProperty('--fx', `${Math.cos(w) * r}px`)
        d.style.setProperty('--fy', `${Math.sin(w) * r}px`)
        d.style.setProperty('--fd', `${420 + Math.random() * 320}ms`)
        d.style.setProperty('--fs', `${3 + Math.random() * 4}px`)
        setzen(d, 800)
      }
    },
    /** Ein kurzer Lichtblitz ueber der ganzen Schicht. */
    blitz(art = 'gold') {
      if (zu || !el || sanft()) return
      const d = document.createElement('div')
      d.className = `sg-blitz sg-blitz--${art}`
      setzen(d, 520)
    },
    /** Alles sofort entfernen. Im Cleanup aufrufen. */
    leeren() {
      offen.forEach((k) => { if (k.parentNode) k.parentNode.removeChild(k) })
      offen.clear()
    },
    schliessen() { zu = true; this.leeren() },
  }
}

/**
 * Ruetteln fuer ein DOM-Element. Setzt eine Klasse und nimmt sie wieder weg.
 * Gibt eine Aufraeumfunktion zurueck, damit ein Unmount den Timer loest.
 */
export function domRuetteln(el, staerke = 1) {
  if (!el || sanft()) return () => {}
  const klasse = staerke >= 2 ? 'sg-beben--stark' : 'sg-beben--leicht'
  el.classList.remove('sg-beben--leicht', 'sg-beben--stark')
  /* Neustart der Animation erzwingen, sonst laeuft der zweite Stoss ins Leere. */
  void el.offsetWidth
  el.classList.add(klasse)
  const timer = window.setTimeout(() => el.classList.remove(klasse), staerke >= 2 ? 420 : 260)
  return () => { window.clearTimeout(timer); el.classList.remove(klasse) }
}

/* ------------------------------------------------------------------ *
 * Kleine Helfer, die alle Spiele brauchen
 * ------------------------------------------------------------------ */

/**
 * Liest die CSS-Tokens einmal aus und liefert fertige Farben fuer Canvas.
 * Faellt auf die Markenwerte zurueck, falls der Stil noch nicht da ist.
 */
const TOKEN_RUECKFALL = {
  gold: '#c9a050',
  goldHell: '#e8c978',
  goldTief: '#8b6b38',
  nacht: '#0a0908',
  creme: '#f4efe4',
  gruen: '#57c47c',
  rot: '#e2453a',
}

const TOKEN_NAMEN = {
  gold: '--trm-gold',
  goldHell: '--trm-gold-hell',
  goldTief: '--trm-gold-tief',
  nacht: '--trm-nacht',
  creme: '--trm-creme',
  gruen: '--trm-gruen',
  rot: '--trm-rot',
}

export function farbenLesen(el) {
  const werte = { ...TOKEN_RUECKFALL }
  try {
    const stil = getComputedStyle(el || document.documentElement)
    Object.keys(TOKEN_NAMEN).forEach((k) => {
      const v = stil.getPropertyValue(TOKEN_NAMEN[k]).trim()
      if (v) werte[k] = v
    })
  } catch { /* Rueckfall genuegt */ }
  return werte
}

/**
 * Combo-Stufen. Alle Spiele benutzen dieselbe Leiter, damit sich eine 5er
 * Combo ueberall gleich anfuehlt, auch wenn sie anders verdient wurde.
 * Der Multiplikator waechst spuerbar, aber gedeckelt: sonst entscheidet ein
 * einziger Glueckslauf das Ranking.
 */
export const COMBO_STUFEN = [
  { ab: 3, wort: 'HEISS', mult: 1.5, farbe: 'gold' },
  { ab: 5, wort: 'KUECHENCHEF', mult: 2, farbe: 'gold' },
  { ab: 8, wort: 'KUECHE ESKALIERT', mult: 2.5, farbe: 'gold' },
  { ab: 10, wort: 'KOMPLETT GESTOERT', mult: 3, farbe: 'gold' },
]

/** Multiplikator zu einem Combo-Stand. Ohne Combo immer glatt 1. */
export function comboMult(combo) {
  let m = 1
  for (const s of COMBO_STUFEN) if (combo >= s.ab) m = s.mult
  return m
}

/** Die Stufe, die bei genau diesem Stand NEU erreicht wurde, sonst null. */
export function comboStufe(combo) {
  return COMBO_STUFEN.find((s) => s.ab === combo) || null
}
