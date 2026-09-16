/**
 * Der schmale Draht zwischen Terminalseite und Serverfunktion.
 *
 * Die Seite spricht ausschliesslich ueber /api/terminal mit der Datenbank.
 * Kein Supabase-Client im Browser, kein anon key im Bundle — genau wie bei
 * /stadtfest. Die Serverfunktion haelt den Dienstschluessel, prueft den
 * Raetselcode und entscheidet ueber jede Aktivierung.
 *
 * ZU DEN BEIDEN MERKZETTELN IM BROWSER
 * ------------------------------------
 * `zugang`  — Beleg, dass der Code stimmte. Kurzlebig, damit ein Reload
 *             waehrend des Ausfuellens nicht auf Zustand A zurueckwirft.
 * `sitzung` — Beleg, dass ein Deckel aktiviert wurde. Er macht das
 *             Dashboard nach einem Reload wieder auffindbar.
 * `tresor`  — nur ein Merkzettel, kein Beleg: wer einmal durchs Schlüsselloch
 *             gegangen ist, landet nach einem Reload wieder im Tresor und muss
 *             die Inszenierung nicht erneut ansehen. Er oeffnet nichts — ohne
 *             `zugang` oder `sitzung` fuehrt er zurueck zum Codefeld.
 *
 * Beide sind serverseitig signiert (HMAC) und tragen ein Ablaufdatum. Wer
 * sie im Browser faelscht, kommt nicht weiter: die Funktion prueft die
 * Signatur bei jeder Verwendung neu. Im Zettel steht nie eine E-Mail-
 * Adresse, und der Raetselcode steht dort erst recht nicht.
 */

const PFAD = '/api/terminal'

export const SPEICHER_ZUGANG = 'videko.terminal.zugang'
export const SPEICHER_SITZUNG = 'videko.terminal.sitzung'
export const SPEICHER_TRESOR = 'videko.terminal.tresor'

/**
 * Der Testbeleg des Admin-Testlabors. Er liegt in sessionStorage und nicht in
 * localStorage: der Testmodus endet mit dem Tab. Ein Testmodus, den man
 * versehentlich behaelt, waere genau das Gegenteil dessen, wofuer er da ist.
 *
 * Ausgegeben wird er ausschliesslich von /api/terminal-admin nach erfolgreicher
 * Anmeldung. Der Admin-Schluessel selbst steht nie in der Adresszeile und nie
 * im Bundle — der Beleg ist ein signiertes Stueck Papier, mehr nicht.
 */
export const SPEICHER_PROBE = 'videko.terminal.probe'

/**
 * Merkzettel: die Introsequenz lief in diesem Tab schon. Ebenfalls
 * sessionStorage — ein Reload soll sie ueberspringen, ein neuer Besuch sie
 * wieder zeigen.
 */
export const SPEICHER_INTRO = 'videko.terminal.intro'

/**
 * Einmaliger Wunsch: "Intro nochmal ansehen". Steht dieser Zettel da, laeuft
 * die Sequenz beim naechsten Laden auch dann, wenn sie in diesem Tab schon
 * gelaufen ist. Er wird beim Start sofort wieder weggeworfen.
 */
export const SPEICHER_INTRO_WUNSCH = 'videko.terminal.introWunsch'

/**
 * Der Zustandswunsch aus dem Testlabor. Das Labor legt hier ab, welche Szene
 * die Aktionsseite nach dem Wechsel zeigen soll; die Seite liest ihn genau
 * einmal und raeumt ihn weg.
 */
export const SPEICHER_SZENE = 'videko.terminal.szene'

/**
 * Praefix fuer alle Merkzettel im Testmodus.
 *
 * Das ist die zweite Haelfte der Trennung von Test und Ernstfall: die erste
 * liegt auf dem Server (dort wird im Testmodus nichts geschrieben), die
 * zweite hier. Solange ein Testbeleg vorliegt, landen Zugang, Sitzung und
 * Tresorvermerk unter diesem Praefix in sessionStorage — der echte Login
 * dieses Browsers bleibt unberuehrt liegen und ist nach dem Verlassen des
 * Testmodus unveraendert da.
 */
const PROBE_PRAEFIX = 'videko.terminal.probe.'

/**
 * Ruft die Serverfunktion. Wirft nie — ein Netzfehler kommt als
 * `{ ok: false, grund: 'netz' }` zurueck, damit die Seite immer eine
 * Meldung zeigen kann statt stumm stehen zu bleiben.
 */
export async function terminalRuf(nutzlast, signal) {
  try {
    /* Liegt ein Testbeleg vor, faehrt er bei jeder Anfrage mit. Der Server
       beantwortet sie dann virtuell und fasst keine Tabelle an. */
    const beleg = probeBeleg()
    const antwort = await fetch(PFAD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(beleg ? { ...nutzlast, probe: beleg } : nutzlast),
      signal,
    })
    const daten = await antwort.json().catch(() => ({}))
    /* Der Teststand (aktiviert, Bestwerte) steht im Beleg selbst. Schickt der
       Server einen neuen, ersetzt er den alten — aber nur, solange ueberhaupt
       ein Testmodus laeuft. */
    if (beleg && typeof daten?.probe === 'string') probeSetzen(daten.probe)
    if (!antwort.ok) return { ok: false, grund: daten.grund || 'server', status: antwort.status }
    return daten
  } catch (fehler) {
    if (fehler?.name === 'AbortError') return { ok: false, grund: 'abbruch' }
    return { ok: false, grund: 'netz' }
  }
}

/* localStorage kann werfen: Safari im privaten Modus, abgeschaltete
   Website-Daten, eingebettete Ansichten. Die Seite muss auch dann
   funktionieren — sie verliert dann nur die Wiedererkennung.

   Im Testmodus wird umgeleitet: dann liegen dieselben Merkzettel unter einem
   eigenen Praefix in sessionStorage. Deshalb geht jeder Zugriff durch diese
   beiden Funktionen und nirgends direkt an localStorage. */
export function merkeLesen(schluessel) {
  if (probeAktiv()) return sitzungLesen(PROBE_PRAEFIX + schluessel)
  try {
    return window.localStorage.getItem(schluessel) || null
  } catch {
    return null
  }
}

export function merkeSchreiben(schluessel, wert) {
  if (probeAktiv()) {
    sitzungSchreiben(PROBE_PRAEFIX + schluessel, wert)
    return
  }
  try {
    if (wert) window.localStorage.setItem(schluessel, wert)
    else window.localStorage.removeItem(schluessel)
  } catch {
    /* kein Speicher, kein Drama */
  }
}

/**
 * Dieses Geraet abmelden.
 *
 * Loescht ausschliesslich die lokalen Belege. Der Deckel bleibt in der
 * Datenbank aktiviert — hier wird nichts deaktiviert, nichts geloescht und
 * kein Server gefragt. Danach sieht der Browser wieder den Ersteinstieg.
 */
export function sitzungBeenden() {
  merkeSchreiben(SPEICHER_SITZUNG, null)
  merkeSchreiben(SPEICHER_ZUGANG, null)
  merkeSchreiben(SPEICHER_TRESOR, null)
}

/* ------------------------------------------------------------------ */
/* Testmodus                                                           */
/* ------------------------------------------------------------------ */

/** Der aktuelle Testbeleg oder null. */
export function probeBeleg() {
  return sitzungLesen(SPEICHER_PROBE)
}

/** Laeuft gerade ein Testmodus? */
export function probeAktiv() {
  return Boolean(probeBeleg())
}

/** Testbeleg setzen oder (mit null) den Testmodus verlassen. */
export function probeSetzen(beleg) {
  sitzungSchreiben(SPEICHER_PROBE, beleg)
}

/**
 * Alle Merkzettel der Testsitzung wegwerfen.
 *
 * Betrifft ausschliesslich Schluessel unter dem Testpraefix. Der echte Login
 * dieses Browsers liegt in localStorage und wird hier nicht einmal
 * angefasst.
 */
export function probeZettelLeeren() {
  try {
    const weg = []
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const name = window.sessionStorage.key(i)
      if (name && name.startsWith(PROBE_PRAEFIX)) weg.push(name)
    }
    weg.forEach((name) => window.sessionStorage.removeItem(name))
  } catch {
    /* kein Speicher, kein Drama */
  }
  sitzungSchreiben(SPEICHER_INTRO, null)
  sitzungSchreiben(SPEICHER_SZENE, null)
}

/** Testmodus verlassen: Beleg weg, Testzettel weg, echter Stand unberuehrt. */
export function probeVerlassen() {
  probeZettelLeeren()
  probeSetzen(null)
}

/* ------------------------------------------------------------------ */
/* Intro                                                               */
/* ------------------------------------------------------------------ */

/**
 * Lief die Sequenz in diesem Browser schon?
 *
 * Seit 2.3 dauerhaft: der Ersteinstieg ist fuer den ersten Scan gedacht, nicht
 * fuer jedes Neuladen. Der Zettel steht deshalb in localStorage (ueber
 * merkeSchreiben — im Testmodus also unter dem Testpraefix und damit mit dem
 * Labor zuruecksetzbar) und zusaetzlich wie bisher im Tab.
 */
export function introGesehen() {
  return Boolean(sitzungLesen(SPEICHER_INTRO) || merkeLesen(SPEICHER_INTRO))
}

/** Merken, dass sie gelaufen ist. */
export function introMerken() {
  sitzungSchreiben(SPEICHER_INTRO, '1')
  merkeSchreiben(SPEICHER_INTRO, '1')
}

/**
 * "Intro nochmal ansehen": Merkzettel weg, Wunsch hin, neu laden. Das Neuladen
 * ist Absicht — nur so kann das kleine Skript im Dokumentkopf die Seite wieder
 * vor dem ersten Bild abdunkeln.
 */
export function introNochmal(ziel) {
  sitzungSchreiben(SPEICHER_INTRO, null)
  merkeSchreiben(SPEICHER_INTRO, null)
  sitzungSchreiben(SPEICHER_INTRO_WUNSCH, '1')
  try {
    window.location.assign(ziel || '/terminal')
  } catch {
    /* nichts zu tun */
  }
}

/* ------------------------------------------------------------------ */
/* Spiele                                                              */
/* ------------------------------------------------------------------ */

/**
 * Eine Runde anmelden. Der Server gibt ein signiertes Laufticket zurueck; ohne
 * dieses Ticket nimmt er spaeter keinen Punktestand an.
 *
 * Das Ticket bleibt im Speicher der Komponente. Es in localStorage zu legen
 * braeuchte es nicht — eine Runde ueberlebt keinen Reload.
 */
export async function spielStarten(sitzung, game, signal) {
  return terminalRuf({ aktion: 'spiel-start', sitzung, game }, signal)
}

/**
 * Eine Runde abschliessen. Der Punktestand gilt nur mit dem Ticket aus
 * spielStarten, und jedes Ticket gilt genau einmal.
 *
 * Die Dauer des Laufs rechnet der Server selbst aus dem Ticket — sie wird
 * hier bewusst nicht mitgeschickt, denn sonst waere sie das erste, was jemand
 * zurechtbiegen wuerde.
 */
export async function spielBeenden({ sitzung, game, ticket, score, runden }, signal) {
  return terminalRuf({ aktion: 'spiel-ende', sitzung, game, ticket, score, runden }, signal)
}

/**
 * Die drei oeffentlichen Bestenlisten in einer Anfrage. Der Sitzungsbeleg ist
 * freiwillig: ohne ihn kommt die Liste ohne eigene Platzierung.
 */
/**
 * Die Einwilligung ins oeffentliche Leaderboard setzen oder zuruecknehmen.
 * Scores, Teilnahme und Ziehung bleiben davon unberuehrt — der Server aendert
 * nur die Einwilligung und ihren Zeitstempel.
 */
export async function einwilligungSetzen(sitzung, ok, signal) {
  return terminalRuf({ aktion: 'leaderboard', sitzung, ok: Boolean(ok) }, signal)
}

export async function ranglisteHolen(sitzung, signal) {
  return terminalRuf({ aktion: 'rangliste', sitzung: sitzung || undefined }, signal)
}

/* ------------------------------------------------------------------ */
/* Wieder-Login                                                        */
/* ------------------------------------------------------------------ */

/**
 * Einen Zugangslink fuer einen schon aktivierten Deckel anfordern. Die
 * Antwort ist immer dieselbe — ob die Adresse bekannt ist oder nicht.
 */
export async function wiederAnfordern(email, signal) {
  return terminalRuf({ aktion: 'wieder-anfordern', email }, signal)
}

/**
 * Den Token aus dem Zugangslink gegen einen Sitzungsbeleg tauschen. Danach
 * ist der Link verbraucht.
 */
export async function wiederEinloesen(token, signal) {
  return terminalRuf({ aktion: 'wieder-einloesen', token }, signal)
}

/* ------------------------------------------------------------------ */
/* Verwaltung                                                          */
/* ------------------------------------------------------------------ */

const ADMIN_PFAD = '/api/terminal-admin'

/**
 * Der Schluessel liegt in sessionStorage, nicht in localStorage: mit dem
 * Schliessen des Tabs ist er weg. Im Bundle steht er ohnehin nicht — die
 * Seite fragt ihn ab, der Server entscheidet.
 */
export const SPEICHER_ADMIN = 'videko.terminal.admin'

export async function terminalAdminRuf(schluessel, nutzlast, signal) {
  try {
    const antwort = await fetch(ADMIN_PFAD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-terminal-admin': schluessel || '',
      },
      body: JSON.stringify(nutzlast),
      signal,
    })
    const daten = await antwort.json().catch(() => ({}))
    /* Zusatzfelder der Absage (etwa teilnehmerZahl bei "bestaetigung") bleiben erhalten. */
    if (!antwort.ok) return { ...daten, ok: false, grund: daten.grund || 'server', status: antwort.status }
    return daten
  } catch (fehler) {
    if (fehler?.name === 'AbortError') return { ok: false, grund: 'abbruch' }
    return { ok: false, grund: 'netz' }
  }
}

export function sitzungLesen(schluessel) {
  try {
    return window.sessionStorage.getItem(schluessel) || null
  } catch {
    return null
  }
}

export function sitzungSchreiben(schluessel, wert) {
  try {
    if (wert) window.sessionStorage.setItem(schluessel, wert)
    else window.sessionStorage.removeItem(schluessel)
  } catch {
    /* kein Speicher, kein Drama */
  }
}
