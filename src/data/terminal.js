/**
 * Zentrale Konfiguration der Bierdeckel-Aktion (/terminal).
 *
 * Alles, was die Kampagne beschreibt, steht hier — nichts davon gehoert ins
 * JSX. Seite, Serverendpunkte (api/terminal.js, api/terminal-admin.js) und die
 * Teilnahmebedingungen lesen dieselben Werte, damit angezeigter Text und
 * gespeicherte Daten nie auseinanderlaufen.
 *
 * WAS HIER BEWUSST NICHT STEHT
 * ----------------------------
 * 1. Der Raetselcode. Er wird ausschliesslich serverseitig geprueft
 *    (api/terminal.js, Variable TERMINAL_CODE). Stuende er hier, laege er im
 *    Browser-Bundle — jeder, der den QR-Code scannt, koennte ihn in zwei
 *    Klicks auslesen, und das Raetsel waere wertlos.
 * 2. Ziehungstermin, Followerzahl und Live-Schalter. Das sind laufende Werte,
 *    die im Betrieb ohne Deploy aenderbar sein muessen. Sie liegen in der
 *    Tabelle videko_terminal_einstellungen und kommen ueber /api/terminal zur
 *    Seite. Hier stehen nur die Startwerte fuer das erste Anlegen.
 *
 * Die Zahlen aus den Design-Mockups (#1847, #3482, 672 aktivierte Deckel, die
 * Countdown-Werte) sind ausdruecklich Platzhalter der Gestaltung und tauchen
 * deshalb in dieser Datei nicht als Daten auf.
 *
 * Diese Datei bleibt frei von Bildimporten. Sie wird auch von den
 * Serverless-Funktionen unter api/ gelesen, und die laufen in Node ohne
 * Vite — ein `import ... from '...webp'` wuerde dort sofort scheitern. Die
 * Gewinnmotive stehen deshalb in terminal-gewinne.js.
 */

/* ------------------------------------------------------------------ */
/* Kampagne                                                            */
/* ------------------------------------------------------------------ */

export const TERMINAL_KAMPAGNE = {
  id: 'bierdeckel-2026',

  /** Gedruckte Deckel. Gueltige Nummern sind 1 bis einschliesslich diesem Wert. */
  deckelGesamt: 5000,

  /** Instagram-Konto ohne fuehrendes @ — die Anzeige setzt es selbst davor. */
  instagramHandle: 'videko.kuechen',
  instagramUrl: 'https://www.instagram.com/videko.kuechen/',

  /** Meldefrist nach einer Ziehung, in Stunden. Danach darf neu gezogen werden. */
  meldefristStunden: 48,

  /**
   * Rueckfallwert fuer die Follower-Mission, falls die Einstellungszeile noch
   * nicht existiert. Angezeigt wird ueberall der naechste echte Meilenstein
   * aus MEILENSTEINE, nicht dieser Wert.
   */
  followerZiel: 1500,

  /** Startwert der Follower-Mission, solange die Admin-Ansicht nichts anderes sagt. */
  followerStart: 750,

  /** Laenge des Tresor-Codes = Anzahl der Eingabefelder. */
  codeLaenge: 8,
}

/* ------------------------------------------------------------------ */
/* Follower-Mission                                                    */
/* ------------------------------------------------------------------ */

/**
 * Die Stufen der Follower-Mission. Bei jeder kommt ein Zusatzgewinn in die
 * Truhe. Welcher, pflegt der Betrieb in der Verwaltung (Spalte
 * meilenstein_gewinne) — steht dort nichts, heisst er MEILENSTEIN_LEER.
 * Kein Preis wird hier erfunden.
 *
 * Getaktet in 500er-Schritten ab 1.500: darunter liegt der Kanal laengst,
 * eine schon erreichte Stufe ist kein Ziel. Die letzte Stufe ist keine
 * weitere unter vielen, sondern das Ende der Fahnenstange — sie heisst
 * MEGA_MEILENSTEIN und wird ueberall anders behandelt als die Stufen davor.
 */
export const MEILENSTEINE = [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000]
export const MEGA_MEILENSTEIN = 5000
export const MEILENSTEIN_LEER = 'ZUSATZGEWINN'
export const MEGA_LEER = 'MEGA-PREIS'

/**
 * Die Mission zu einer Followerzahl: welche Stufen offen sind, welche als
 * naechste kommt und wie weit es bis dahin ist. Gerechnet wird immer aus der
 * echten Zahl — es gibt keinen festen Text „noch 439".
 *
 * `megaFrei` sagt, ob die letzte Stufe schon steht; `megaNaechste`, ob der
 * naechste Schritt bereits der MEGA-PREIS ist. Beide bestimmen nur den
 * Wortlaut, nicht die Rechnung. Ueber 5.000 bleibt `fehlt` bei 0 — eine
 * negative Differenz gibt es nirgends.
 */
export function missionStand(followerRoh, gewinne = {}) {
  const follower = Math.max(0, Math.trunc(Number(followerRoh) || 0))
  const stufen = MEILENSTEINE.map((ziel) => {
    const mega = ziel === MEGA_MEILENSTEIN
    const name = String(gewinne?.[ziel] ?? gewinne?.[String(ziel)] ?? '').trim()
    return {
      ziel,
      mega,
      frei: follower >= ziel,
      gewinn: name || (mega ? MEGA_LEER : MEILENSTEIN_LEER),
      benannt: Boolean(name),
    }
  })
  const naechste = stufen.find((st) => !st.frei) ?? null
  /* Der Balken misst die ganze Mission — von null bis zum MEGA-PREIS. Er
     duerfte auch nur den Weg zur naechsten Stufe zeigen; dann faellt er aber
     bei jedem erreichten Meilenstein auf null zurueck, und bei 4.500
     Followern stuende ein leerer Balken unter sieben freigeschalteten
     Stufen. Ueber die volle Strecke waechst er, wie die Frage darueber es
     verspricht. */
  const anteil = Math.min(1, Math.max(0, follower / MEGA_MEILENSTEIN))
  return {
    follower,
    stufen,
    naechste,
    fehlt: naechste ? Math.max(0, naechste.ziel - follower) : 0,
    anteil,
    megaFrei: follower >= MEGA_MEILENSTEIN,
    megaNaechste: Boolean(naechste?.mega),
  }
}

/** Feldlaengen. Gelten im Browser als maxLength und im Server als harte Grenze. */
export const FELD_GRENZEN = {
  instagram: 40,
  email: 120,
  nachricht: 600,
  name: 80,
}

/* ------------------------------------------------------------------ */
/* Texte                                                               */
/* ------------------------------------------------------------------ */

/**
 * Die Kampagnentexte. Wortlaut aus der Kampagnenvorlage; wer etwas aendert,
 * aendert es hier und nicht in der Komponente.
 */
export const TEXTE = {
  schriftzug: 'Kleine Deckel. Große Gewinne.',
  schild: 'ÜBERALL, WO GENUSS ZU HAUSE IST.',

  /* Zustand A — Landing, verschlossen */
  a: {
    titel: 'EIN DECKEL VON {gesamt} ÖFFNET DIESE TRUHE.',
    sub: 'Vielleicht hältst du ihn gerade in der Hand.',
    codeLabel: 'TRESOR-CODE',
    cta: 'ZUGANG PRÜFEN',
    hinweis: 'Rätsel lösen. Code eingeben. Deckel aktivieren.',
    fehler: 'Code noch nicht geknackt.',
    /* Das Probespiel steht jetzt vor dem Codefeld: erst spielen, dann
       erklaeren. Es laeuft ohne Konto, ohne Ticket und ohne Score — der
       Text sagt das vorher, damit niemand glaubt, hier sei schon etwas
       gewertet worden. */
    probeTitel: 'ERST SPIELEN. DANN GEWINNEN.',
    probeLead:
      'Teste dich kostenlos – ohne Anmeldung. Mit einem offiziellen Account zählt dein Score fürs Ranking und die Game-Preise.',
    probeCta: 'JETZT KOSTENLOS SPIELEN',
    probeSub: 'Keine Anmeldung nötig.',
    probeNotiz:
      'Diese Runde ist ein Probespiel: kein offizieller Score, keine Rangliste, kein Los in der Deckelziehung.',
    /* Die zwei Wege hinein, angerissen — ausgespielt wird beides erst
       hinter dem Code. */
    /* Es wird MEHR als eine Nummer gezogen: die Aktion hat mehrere
       ausgeschriebene Gewinne. Die Anzahl steht nicht hier, sondern kommt
       aus terminal-gewinne.js — wer dort einen Preis ergänzt, ändert diesen
       Satz mit, ohne ihn anzufassen. */
    deckelTitel: '{gesamt} NUMMERIERTE DECKEL. MEHRERE GEWINNER.',
    deckelText:
      'Jeder Deckel trägt eine handschriftliche Nummer von 1 bis {gesamt}. Gezogen wird mehr als eine Nummer — {gewinne} Gewinne sind ausgeschrieben. Jeder nummerierte Deckel ist eine Chance in der Deckelziehung.',
    /* Drei getrennte Wege zu einem Gewinn. Der Abschnitt steht auf der
       Landing, weil sonst der Eindruck bleibt, ohne Deckel sei nichts zu
       holen — das stimmt seit den Game-Preisen nicht mehr. */
    gewinnTitel: 'NICHT NUR ZUM SPASS.',
    gewinnSub: 'Es gibt drei getrennte Wege zu einem Gewinn.',
    gewinnNotiz:
      'Deckelziehung und Game-Preise sind getrennt. Ohne Deckel kannst du spielen, in den Ranglisten stehen und Game-Preise gewinnen — nur an der Deckelziehung nimmst du dann nicht teil.',
    einladungTitel: 'ODER DU WIRST EINGELADEN.',
    einladungText:
      'Wer schon dabei ist, kann Einladungen weitergeben. Eine Einladung öffnet dieselbe Tür wie ein Code — mit Deckel bleibt sie trotzdem nötig, um zu gewinnen.',
  },

  /* Zustand B — Code akzeptiert, Aktivierung */
  b: {
    titel: 'CODE AKZEPTIERT.',
    sub: 'Aktiviere jetzt deinen Deckel.',
    cta: 'DECKEL AKTIVIEREN',
    instagramCta: 'AUF INSTAGRAM FOLGEN',
    doppelt: 'Diese Deckelnummer wurde bereits aktiviert.',
    /* Warnfenster bei einer schon aktivierten Nummer. Ein weiterer
       Besitzanspruch ist erlaubt, erzeugt aber kein zusaetzliches Los —
       im Gewinnfall zaehlt allein der Originaldeckel. */
    belegt: {
      titel: 'DIESER DECKEL WURDE BEREITS AKTIVIERT.',
      frage: 'Bist du sicher, dass du den physischen Deckel mit dieser Nummer besitzt?',
      hinweis: '{gesamt} NUMMERIERTE DECKEL, MEHRERE GEWINNER. JEDE GEZOGENE NUMMER MUSS MIT DEM ORIGINALDECKEL NACHGEWIESEN WERDEN.',
      ja: 'JA, ICH HABE DEN DECKEL',
      nein: 'NEIN, ZURÜCK',
    },
    ohne: 'Ohne Originaldeckel kein Gewinn.',
    erklaerTitel: 'SO EINFACH GEHT’S',
    erklaerSub: 'Deine Teilnahme in 4 Schritten.',
    felder: {
      nummer: 'Deckel-Nr.',
      nummerPlatz: 'z. B. 1847',
      nummerHilfe: 'Die handschriftliche Nummer auf deinem Deckel, 1 bis {gesamt}.',
      instagram: 'Instagram-Name',
      instagramPlatz: 'z. B. @deinname',
      email: 'E-Mail-Adresse',
      emailPlatz: 'z. B. name@beispiel.de',
      emailHilfe: 'Nur für die Benachrichtigung im Gewinnfall. Nie öffentlich sichtbar.',
      haken: 'Ich folge @{handle}',
      /* Wortlaut der Einwilligung. Sie steht getrennt vom Pflichthaken und
         ist ausdruecklich freiwillig — deshalb der zweite Satz. */
      leaderboard:
        'Ich bin damit einverstanden, dass mein Instagram-Name zusammen mit meinen Game-Scores im öffentlichen VIDEKO Game-Leaderboard angezeigt wird.',
      leaderboardHilfe:
        'Freiwillig. Ohne diese Einwilligung nimmst du genauso am Gewinnspiel teil — dein Instagram-Name erscheint dann nur auf keiner öffentlichen Liste.',
    },
    fehler: {
      nummer: 'Bitte eine Zahl von 1 bis {gesamt} eintragen.',
      instagram: 'Bitte deinen Instagram-Namen eintragen.',
      email: 'Bitte eine gültige E-Mail-Adresse eintragen.',
      folgt: 'Bitte bestätige, dass du @{handle} folgst.',
      allgemein: 'Gerade keine Verbindung. Bitte noch einmal versuchen.',
    },
  },

  /* Zwischenschritt — Code stimmt, die Truhe ist noch zu */
  z: {
    gewaehrt: 'ACCESS GRANTED',
    titel: 'DU HAST ZUGANG.',
    /* Der dritte Schlag der Sequenz. Er kommt nach einer Pause, damit der
       zweite Satz vorher stehen bleiben darf. */
    offen: 'DAS SCHLOSS IST OFFEN.',
    sub: 'Tippe die Truhe an.',
    hinweis: 'Das Schloss hat sich gelöst. Der Weg hinein ist es noch nicht.',
    /* Die drei Punkte auf der Truhe. Zwei reagieren, einer führt hinein. */
    schlossLabel: 'Das Schloss der Truhe',
    schlossText: 'Noch nicht.',
    zeichenLabel: 'Das VIDEKO Zeichen auf der Truhe',
    zeichenText: 'VIDEKO.',
    schluesselLabel: 'Das Schlüsselloch — hier geht es in den Tresor',
    schluesselText: 'Der Weg hinein.',
    eintritt: 'IN DEN TRESOR',
    /* Der Unterschied zum Blick vor dem Code: jetzt geht es wirklich hinein. */
    flugText: 'Vorher durftest du nur reinschauen. Jetzt darfst du rein.',
    /* Der Weg hinein steht dreimal da: als Punkt auf dem Motiv, als Satz
       darunter und als Knopf. Wer das Bild nicht antippen mag oder es gar
       nicht als antippbar erkennt, braucht trotzdem einen Weg. */
    cta: 'TRUHE ANTIPPEN',
  },

  /* Der Tresor — dieselbe Welt, ein Raum weiter innen */
  t: {
    titel: 'VIDEKO TRESOR',
    sub: 'Du bist drin.',
    gateTitel: 'FAST DRIN.',
    gateText: 'Bevor du den Tresor vollständig betreten kannst, aktiviere deinen Deckel.',
    freiTitel: 'ZUGANG VOLLSTÄNDIG FREIGESCHALTET',
    freiText: 'Games und Leaderboard sind offen.',
    deckelLabel: 'DEIN DECKEL',
    gamesLabel: 'GAMES',
    leaderboardLabel: 'LEADERBOARD',
    koenigLabel: 'AKTUELLER TRESORKÖNIG',
    koenigLeer: 'Noch hat niemand vier Spiele abgeschlossen. Der Platz ist frei.',
    koenigPunkte: '{punkte} / 4.000 Punkte im Gesamtranking',
    koenigFrage: 'Schlägst du ihn?',
    koenigCta: 'ZU DEN GAMES',
    zurueck: 'ZURÜCK ZUR TRUHE',
  },

  /* Die beiden Spiele */
  g: {
    label: 'GAMES',
    hinweis:
      'Deine offiziellen Scores zählen für die Ranglisten und das Gesamtranking — dafür gibt es eigene Game-Preise. Auf die Deckelziehung haben sie keinen Einfluss: die hängt allein an deiner Deckelnummer.',
    start: 'RUNDE STARTEN',
    nochmal: 'NOCH EINE RUNDE',
    punkte: 'PUNKTE',
    zeit: 'ZEIT',
    runde: 'RUNDE',
    stoppen: 'Ring stoppen',
    fangen: 'Antippen, was Punkte bringt',
    best: 'DEIN BESTWERT',
    bestLeer: 'Noch keine Runde gespielt.',
    neuerBest: 'NEUER PERSÖNLICHER REKORD',
    ergebnis: 'DEIN SCORE',
    /* Der eigene Stand direkt nach der Runde. Das ist der Grund, noch einmal
       zu druecken — deshalb steht er hier und nicht nur im Leaderboard. */
    platzVon: 'PLATZ {platz} VON {von}',
    bisPlatz: 'NOCH {punkte} PUNKTE BIS PLATZ {ziel}',
    spitze: 'PLATZ 1 — NIEMAND ÜBER DIR.',
    nochmalKurz: 'NOCHMAL',
    zurRangliste: 'RANGLISTE',
    /* Die eine Zeile, die den naechsten Lauf begruendet (spiel-motivation.js). */
    motivRekord: 'NEUER REKORD. DA GEHT NOCH WAS.',
    motivHebel: '1 {wort} MEHR HÄTTE FÜR PLATZ {ziel} GEREICHT',
    motivTop3: 'NOCH {punkte} PUNKTE BIS ZU DEN TOP 3',
    motivTop10: 'NOCH {punkte} PUNKTE BIS ZU DEN TOP 10',
    motivVorMir: 'NOCH {punkte} PUNKTE BIS PLATZ {ziel} ({name})',
    motivKnapp: 'KNAPP! NUR {punkte} PUNKTE UNTER DEINEM BESTWERT',
    motivBest: 'DEIN BESTWERT: {best}. DER NÄCHSTE LAUF HOLT IHN.',
    spielen: 'SPIELEN',
    laedt: 'Spiel wird geladen …',
    besterHeute: 'BESTER HEUTE',
    besterHeuteLeer: '—',
    deinBester: 'DEIN BESTER SCORE',
    gespeichert: 'Ergebnis gespeichert.',
    speichert: 'Ergebnis wird gespeichert …',
    startet: 'Runde wird vorbereitet …',
    nichtGewertet:
      'Dieser Lauf wurde gespeichert, aber nicht gewertet. Bei Fragen dazu gerne kurz melden.',
    fehler: 'Das Ergebnis konnte nicht gespeichert werden. Die Runde zählt dann leider nicht.',
    ticketFehler: 'Die Runde ließ sich nicht starten. Bitte noch einmal versuchen.',
    /* Die gemeinsame Game-Shell: dieselben Tasten in jedem Spiel, damit
       niemand raten muss, wo der Ton sitzt oder wie man wieder rauskommt. */
    shellVollbild: 'VOLLBILD',
    shellVollbildAus: 'VOLLBILD BEENDEN',
    /* Die kurze Fassung steht auf der Taste selbst — "VOLLBILD BEENDEN" waere
       bei 390 px die halbe Zeile. Der volle Satz bleibt als `aria-label`. */
    shellVollbildKurz: 'VOLLBILD',
    shellVollbildKurzAus: 'BEENDEN',
    shellTonAn: 'Musik und Effekte an',
    shellTonAus: 'Musik und Effekte aus',
    shellVerlassen: 'VERLASSEN',
    shellVerlassenHilfe: 'Runde beenden und zurück zur Seite',
    shellAnleitung: 'ANLEITUNG',
    shellAnleitungHilfe: 'Kurze Anleitung zu diesem Spiel',
    shellMinimieren: 'MINIMIEREN',
    shellMinimierenHilfe: 'Runde pausieren und die Seite wieder freigeben',
    /* Minimieren haelt die Runde an: die Uhr steht, die Simulation friert
       ein, der Body-Scroll ist sofort wieder frei. */
    pauseTitel: 'RUNDE PAUSIERT',
    pauseSub: 'Deine Zeit steht still. Der Score bleibt.',
    pauseWeiter: 'WEITERSPIELEN',
    pauseBeenden: 'BEENDEN',
    /* Die Anleitung: fuenf kurze Bloecke, nie mehr. Wer laenger als ein
       paar Sekunden liest, spielt in der Zeit nicht. */
    anleitungZiel: 'ZIEL',
    anleitungSteuerung: 'STEUERUNG',
    anleitungBesonders: 'BESONDERHEITEN',
    anleitungEnde: 'WIE ENDET DIE RUNDE?',
    anleitungGewinn: 'WAS KANN ICH GEWINNEN?',
    anleitungGewinnText:
      'Dein offizieller Score kann für die Rangliste dieses Games und die ausgeschriebenen Game-Preise zählen.',
    anleitungGewinnProbe:
      'Dieser Probelauf zählt nicht. Mit einem offiziellen Account kann dein Score für die Rangliste dieses Games und die ausgeschriebenen Game-Preise zählen.',
    anleitungZu: 'VERSTANDEN',
    /* Practice Mode: ein Game zum Reinspielen, ohne Konto. Der Lauf wird
       nicht gewertet, taucht in keiner Rangliste auf und zaehlt auch nicht
       im Gesamtranking. Danach gibt es genau zwei Wege ins Ranking: eine
       Einladung oder ein eigener Deckel. Beide fuehren zum selben Konto. */
    practiceLabel: 'PRACTICE MODE',
    practiceSub: 'Ein Game zum Reinspielen. Dieser Lauf wird nicht gewertet und steht in keiner Rangliste.',
    practiceScore: 'DEIN SCORE',
    practiceFrage: 'WILLST DU AUF DIE RANGLISTE?',
    practiceCta: 'HOL DIR EINE EINLADUNG ODER AKTIVIERE DEINEN DECKEL',
    practiceEchtCta: 'SCORE OFFIZIELL MACHEN',
    /* Was unter dem Knopf steht. Der Probe-Score wird bewusst NICHT
       uebernommen: nach der Anmeldung laeuft ein neuer, offizieller Lauf.
       Das ist fairer und nimmt jeden Anreiz, hier zu tricksen. */
    practiceEchtSub: '@videko.kuechen folgen, anmelden und richtig mitspielen.',
    practiceEchtDrei: '3 Freunde einladen. Rankings knacken. Preise freischalten.',
    practiceEchtNeu: 'Der Probe-Score bleibt Vorschau. Danach läuft ein neuer, offizieller Run. Jetzt zählt’s.',
    /* Der Vergleich nach dem Probespiel. Er liest die oeffentliche
       Rangliste und rechnet nur nach, wie viele Eintraege darueber liegen.
       Reicht der Score nicht in die veroeffentlichte Liste, wird keine Zahl
       erfunden — dann sagt practiceRangKnapp genau das.

       Und solange die Liste fast leer ist, wird ueberhaupt kein Platz
       genannt: „PLATZ 3“ unter drei Eintraegen ist rechnerisch richtig und
       trotzdem wertlos — es klingt nach viel und ist nichts. Dann sagen
       practiceRangJung und practiceRangJungBis lieber, was wirklich der
       Fall ist: vorne ist noch alles frei. */
    practiceRang: 'DAMIT WÄRST DU AKTUELL PLATZ {platz}.',
    practiceRangEins: 'DU WÄRST GERADE PLATZ 1.',
    practiceRangKnapp: 'MIT {punkte} PUNKTEN REICHT ES NOCH NICHT IN DIE TOP {top}.',
    practiceRangJung: 'DIE BESTENLISTE FÜLLT SICH GERADE.',
    practiceRangJungBis: 'JETZT KANNST DU DICH NOCH GANZ VORNE FESTSETZEN.',
    /* Nur wenn die veroeffentlichte Liste wirklich drei Eintraege hat —
       sonst gibt es keine Top 3, an der sich etwas messen liesse. */
    practiceRangBis: 'NOCH {fehlt} PUNKTE BIS TOP {top}.',
    practiceRangLeer: 'DER ERSTE PLATZ WARTET NOCH.',
    practiceRangLaedt: 'Rangliste wird geprüft …',
    practiceRangFehler: 'Die Rangliste ist gerade nicht erreichbar.',
    gesperrt: 'ERST ANMELDEN',
    /* Rückmeldungen im Spiel */
    perfekt: 'PERFECT',
    gut: 'GUT',
    treffer: 'TREFFER',
    combo: 'COMBO x{n}',
    verkantet: 'SCHLOSS VERKANTET',
    strafe: '–{sek} SEK.',
    blockiert: 'KURZ BLOCKIERT',
    /* Der seltene Moment im Goldrausch. Etwa jedes achte Spiel. */
    goldente: 'GOLDENE BADEENTE! +{punkte}',
    /* Kuechen-Stack und Kuechen-Dash */
    hoehe: 'HÖHE',
    strecke: 'METER',
    tippen: 'Tippen',
    stapeln: 'Modul absetzen',
    springen: 'Springen',
    daneben: 'DANEBEN!',
    crash: 'CRASH!',
    pause: 'PAUSE — zum Weiterspielen tippen',
    schneller: 'TEMPO +',
    /* Die seltenen Baustellen-Gags im Kuechen-Dash */
    gagToilette: 'MINI-TOILETTE?!',
    gagFuesse: '2.500 MÖBELFÜSSE',
    gagFuesseKiste: '2.500 MÖBELFÜSSE',
    gagBald: 'BALD FERTIG',
    gagTage: '90 TAGE',
  },

  /* Das öffentliche Leaderboard */
  r: {
    titel: 'LEADERBOARD',
    sub: 'Die besten Läufe der Aktion.',
    tabs: {
      truhenknacker: 'TRUHENKNACKER',
      goldrausch: 'GOLDRAUSCH',
      kuechen_stack: 'KÜCHEN-STACK',
      kuechen_dash: 'KÜCHEN-DASH',
      kuechen_balance: 'BALANCE',
      kuechen_fit: 'FIT',
      videko_jump: 'JUMP',
      kuechen_merge: 'MERGE',
      leitungsfinder: 'LEITUNGSFINDER',
      kuechen_crush: 'CRUSH',
      kuechen_tinder: 'TINDER',
      videko_slam: 'SLAM',
      gesamtranking: 'GESAMTRANKING',
      gesamt: 'GESAMT',
    },
    /* Vor dem Start der Aktion gibt es noch keine Scores. Eine leere
       Tabelle sieht nach Fehler aus; ein freier Thron nach Einladung. */
    thronTitel: 'NOCH IST DER THRON FREI.',
    thronText: 'Hol dir den ersten Platz.',
    thronTaste: 'JETZT SPIELEN',
    deinPlatz: 'DEIN PLATZ: #{platz}',
    ohnePlatz: 'Du stehst noch nicht in dieser Liste.',
    ohneEinwilligung:
      'Dein Name erscheint nicht öffentlich: du hast der Anzeige im Leaderboard nicht zugestimmt. Deine Teilnahme an der Aktion ist davon unberührt.',
    gesamtNotiz: 'Gesamt = bester Truhenknacker-Lauf plus bester Goldrausch-Lauf.',
    /* Gesamtranking: beste vier aus sechs Hauptgames */
    grTitel: 'GESAMTRANKING',
    grBeste: 'BESTE 4 AUS 6',
    grSub: 'Für das Gesamtranking zählen deine besten vier Ergebnisse aus sechs Spielen.',
    grPreiseText: 'DIE DREI BESTEN SPIELER DES GESAMTRANKINGS GEWINNEN DIE AUSGESCHRIEBENEN RANKINGPREISE.',
    grPreisPlatz: 'PLATZ {platz}',
    grFormel:
      'Je Game zählt dein bester gültiger Score. Daraus wird dein Platz in diesem Game und daraus Rangpunkte: Platz 1 = 1.000, der letzte Platz = 0, dazwischen gleichmäßig verteilt (1.000 × (N − Platz) ÷ (N − 1), N = Spieler im Game). Gleichstand teilt sich den besseren Platz. Von deinen sechs möglichen Ergebnissen zählen nur die besten vier; die übrigen werden gestrichen. Gesamtpunkte = Summe dieser vier, maximal 4.000. Bei gleicher Summe gewinnt, wer seinen Stand früher erreicht hat.',
    grAnonym: 'nicht öffentlich',
    grAbgeschlossen: 'GESAMTRANKING ABGESCHLOSSEN. Der Endstand steht fest.',
    grStand: 'GESAMTRANKING: {gespielt}/{noetig} GAMES GESPIELT',
    /* Die Huerde ist eine Zahl, kein Pflichtprogramm: es zaehlt, WIE VIELE
       verschiedene Spiele gespielt sind, nicht welche. */
    grNochEins: 'NOCH 1 SPIEL BIS ZUM GESAMTRANKING',
    grNochMehr: 'NOCH {fehlt} SPIELE BIS ZUM GESAMTRANKING',
    grNochHilfe: 'Du musst mindestens vier verschiedene Spiele gespielt haben.',
    grPlatz: 'PLATZ {platz} VON {von}',
    grPunkte: '{punkte} / {max} PUNKTE',
    grBisPlatz: 'Noch {punkte} Punkte bis Platz {ziel}',
    grSpitze: 'Du führst das Gesamtranking an.',
    grSpielZeile: '{punkte} Rangpunkte · Bestwert {score}',
    grSpielPlatz: 'Platz {platz} von {von}',
    grSpielLeer: 'noch nicht gespielt',
    grGewertet: 'gewertet',
    grGestrichen: 'gestrichen',
    grGewerteteSpiele: 'GEWERTETE SPIELE',
    grOhneEinwilligung: 'Dein Name erscheint nicht öffentlich — dein Platz zählt trotzdem.',
    /* Die oeffentliche Liste */
    grListeSub: 'Die besten vier Ergebnisse aus sechs Spielen, zusammengezählt.',
    grListeLeer: 'Noch hat niemand vier Spiele abgeschlossen.',
    grSpaltePlatz: 'PLATZ',
    grSpalteSpieler: 'SPIELER',
    grSpaltePunkte: 'PUNKTE',
    grQualifiziert: '{n} qualifiziert',
    grEinzelHinweis:
      'Einzel-Bestenlisten dienen der Wertung und dem Vergleich; daraus entsteht kein eigener Gewinnanspruch.',
    hinweis: 'Das Leaderboard ist Unterhaltung. Es hat keinen Einfluss auf die Ziehung.',
    cta: 'LEADERBOARD ANSEHEN',
    laedt: 'Lade Bestenliste …',
    fehler: 'Die Bestenliste ist gerade nicht erreichbar.',
  },

  /* Zustand C — aktiviert, Dashboard */
  c: {
    titel: 'DEIN DECKEL IST IM TRESOR.',
    sub: 'Deckel {deckel} wurde erfolgreich aktiviert.',
    status: 'AKTIVIERT',
    countdownLabel: 'LIVE-ZIEHUNG IN',
    statusLabel: 'DEIN STATUS',
    deckelLabel: 'AKTIVIERTE DECKEL',
    followerLabel: 'FOLLOWER-MISSION',
    truheTitel: 'Noch verschlossen.',
    truheText: 'Vielleicht ist dein Deckel der nächste.',
    countdownNotiz: 'Bis sich ein weiterer Deckel öffnet.',
    countdownOffen: 'Termin wird hier bekannt gegeben.',
    deckelNotiz: 'Gemeinsam näher an die nächste Ziehung.',
    followerNotiz: 'Bei {ziel} Followern kommt ein weiterer Gewinn in die Truhe.',
    followerNotizMega: 'Bei {ziel} Followern öffnet sich der MEGA-PREIS.',
    /* Die Follower-Mission im Dashboard.
       Kein Satz nennt hier eine feste Zahl: `fehlt` und die Stufen kommen
       aus missionStand und damit aus dem echten Followerstand. */
    mission: {
      label: 'MISSION',
      frage: 'WIE WEIT SCHAFFEN WIR ES?',
      follower: '{zahl} FOLLOWER',
      fehlt: 'Noch {fehlt} bis zum nächsten Zusatzgewinn.',
      fehltMega: 'Noch {fehlt} bis zum MEGA-PREIS.',
      alle: 'MEGA-PREIS FREIGESCHALTET.',
      takt: 'Alle 500 neuen Follower knacken wir den nächsten Zusatzgewinn.',
      megaZeile: '{zahl} FOLLOWER = MEGA-PREIS',
      frei: 'FREIGESCHALTET',
      zu: 'Gesperrt',
      naechstesZiel: 'NÄCHSTES ZIEL',
      megaWort: 'MEGA-PREIS',
      megaWortFrei: 'MEGA-PREIS FREIGESCHALTET',
    },
    /* Die Einwilligung ins oeffentliche Leaderboard, jederzeit aenderbar */
    einwilligung: {
      titel: 'ÖFFENTLICHES LEADERBOARD',
      haken: 'Meinen Instagram-Namen zusammen mit meinen Game-Scores öffentlich im VIDEKO-Leaderboard anzeigen.',
      an: 'Aktuell: ÖFFENTLICH',
      aus: 'Aktuell: NICHT ÖFFENTLICH',
      speichern: 'EINSTELLUNG SPEICHERN',
      speichert: 'Wird gespeichert …',
      noch: 'Du bist noch nicht öffentlich im Leaderboard sichtbar.',
      freischalten: 'JETZT FREISCHALTEN',
      gespeichertAn: 'Gespeichert. Dein Name erscheint jetzt im Leaderboard.',
      gespeichertAus: 'Gespeichert. Dein Name ist aus allen öffentlichen Ranglisten entfernt.',
      hinweis: 'Freiwillig und jederzeit widerrufbar. Deine Teilnahme, deine Scores und die Ziehung bleiben davon unberührt.',
      fehler: 'Das hat nicht geklappt. Bitte noch einmal versuchen.',
    },
    /* Die Statuszeilen. Die dritte sagt bewusst "angegeben" und nicht
       "bestätigt": geprüft wird der Follow von Hand, und nur im Gewinnfall. */
    statusZeilen: [
      'Code korrekt.',
      'Deckel {deckel} aktiviert.',
      'Instagram-Follow angegeben.',
      'Originaldeckel aufheben.',
    ],
    statusNotiz: 'Der Follow wird im Gewinnfall von Hand geprüft.',
  },

  /* Zustand D — oeffentliche Live-Ziehung */
  d: {
    titel: 'LIVE-ZIEHUNG',
    sub: '{gesamt} Deckel. Aktivierte Nummern im Lostopf. Mehrere Gewinne.',
    zeile: 'ECHTE GEWINNE. ECHTE MENSCHEN. LIVE BEI VIDEKO.',
    live: 'JETZT LIVE',
    liveZusatz: 'ZIEHUNG LÄUFT',
    ruhig: 'Die Ziehung läuft gerade nicht.',
    gesucht: 'GESUCHT:',
    nochNicht: 'Es ist noch keine Nummer gezogen.',
    gewonnenTitel: 'DU HAST GEWONNEN?',
    gewonnenText: 'Melde dich jetzt und sichere dir deinen Gewinn.',
    cta: 'GEWINN MELDEN',
    ohne: 'Ohne Originaldeckel kein Gewinn.',
    behalten: 'NOCH NICHT GEZOGEN? Deckel behalten.',
    behaltenText: 'Jeder aktivierte Deckel bleibt im Lostopf.',
    ablaufTitel: 'SO FUNKTIONIERT DIE ZIEHUNG',
    naechsteLabel: 'NÄCHSTE ZIEHUNG',
    fristLabel: 'MELDEFRIST ENDET',
  },

  /* Gewinn melden (Zustand D, Formular) */
  m: {
    titel: 'GEWINN MELDEN',
    sub: 'Wir prüfen deine Meldung von Hand und melden uns bei dir.',
    cta: 'MELDUNG ABSCHICKEN',
    hinweis:
      'Ein Gewinn ist erst gültig, wenn Deckelnummer, Originaldeckel, Teilnahme und Instagram-Follow geprüft sind und die Meldefrist eingehalten wurde.',
    dank: 'MELDUNG EINGEGANGEN.',
    dankText:
      'Wir prüfen deine Angaben und melden uns über die angegebene E-Mail-Adresse. Bewahre deinen Originaldeckel bis dahin sicher auf.',
  },

  /* Der Ersteinstieg. Wer den Bierdeckel scannt, kommt hier an — und soll
     nicht das Gefuehl haben, eine Seite zu laden, sondern etwas zu betreten.
     Mehr Wort als hier braucht es dafuer nicht: die Sequenz erzaehlt sich
     selbst, Text wuerde sie nur erklaeren. */
  intro: {
    marke: 'VIDEKO TERMINAL',
    label: 'Der Tresorraum öffnet sich',
    ueberspringen: 'ÜBERSPRINGEN',
    nochmal: 'INTRO NOCHMAL ANSEHEN',
  },

  /* Zustand A — die Truhe steht verschlossen da, reagiert aber schon.
     Die Rufe erscheinen absichtlich nicht bei jedem Antippen: eine Truhe, die
     jedes Mal denselben Satz sagt, ist ein Knopf. Eine, die meistens nur
     ruckelt und manchmal etwas sagt, ist ein Gegenstand. */
  wach: {
    truheLabel: 'Die verschlossene Truhe',
    schlossLabel: 'Das Schloss der Truhe — verriegelt',
    zeichenLabel: 'Das VIDEKO Zeichen auf der Truhe',
    schluesselLabel: 'Das Schlüsselloch — ohne Code verschlossen',
    rufe: ['Verschlossen.', 'Da fehlt etwas …', 'Ohne Code keine Chance.', 'Keinen Millimeter.'],
    schloss: 'Verriegelt.',
    zeichen: 'VIDEKO.',
    verweigert: 'ZUGANG VERWEIGERT',
    codeNoetig: 'CODE ERFORDERLICH',
    /* 2.3: die Truhe reagiert noch deutlicher, und durchs Schluesselloch
       darf man einen Blick werfen — nur einen Blick. */
    truheRufe: ['VERSCHLOSSEN.', 'DA FEHLT NOCH WAS.', 'OHNE CODE KEINE CHANCE.'],
    spaehen: 'EIN BLICK IN DEN TRESOR',
    spaehenSperre: 'ZUGANG GESPERRT',
    spaehenCode: 'KNACK ERST DEN CODE.',
    spaehenMehr: 'UND NOCH MEHR …',
  },

  /* Das Admin-Testlabor. Diese Woerter sieht nur, wer eine gueltige
     Testsitzung hat — im normalen Betrieb steht davon nichts auf der Seite. */
  probe: {
    marke: 'TESTMODUS',
    markeTitel: 'Testmodus — virtuelle Sitzung, keine echten Daten',
    titel: 'TESTLABOR',
    knopf: 'Testlabor öffnen',
    schliessen: 'Testlabor schließen',
    person: '@videko_test · Deckel TEST',
    hinweis: 'Virtuelle Testsitzung. Nichts davon wird gespeichert.',
    zustandTitel: 'ZUSTAND WÄHLEN',
    reset: 'SESSION ZURÜCKSETZEN',
    verlassen: 'TESTMODUS VERLASSEN',
    gameOver: 'TEST: GAME OVER',
    gameOverHinweis: 'Beendet den laufenden Game-Lauf sofort.',
    zustaende: [
      { key: 'ersteinstieg', wort: 'ERSTEINSTIEG' },
      { key: 'code', wort: 'CODE-EINGABE' },
      { key: 'code-ok', wort: 'CODE KORREKT' },
      { key: 'truhe', wort: 'INTERAKTIVE TRUHE' },
      { key: 'flug', wort: 'SCHLÜSSELLOCH-FLUG' },
      { key: 'aktivieren', wort: 'DECKEL AKTIVIEREN' },
      { key: 'dashboard', wort: 'AKTIVIERTES DASHBOARD' },
      { key: 'truhenknacker', wort: 'TRUHENKNACKER' },
      { key: 'goldrausch', wort: 'GOLDRAUSCH' },
      { key: 'kuechen_stack', wort: 'KÜCHEN-STACK' },
      { key: 'kuechen_dash', wort: 'KÜCHEN-DASH' },
      { key: 'kuechen_balance', wort: 'KÜCHEN-BALANCE' },
      { key: 'kuechen_fit', wort: 'KÜCHEN-FIT' },
      { key: 'videko_jump', wort: 'VIDEKO JUMP' },
      { key: 'kuechen_merge', wort: 'KÜCHEN-MERGE' },
      { key: 'leitungsfinder', wort: 'LEITUNGSFINDER' },
      { key: 'kuechen_crush', wort: 'KÜCHEN-CRUSH' },
      { key: 'kuechen_tinder', wort: 'KÜCHEN-TINDER' },
      { key: 'videko_slam', wort: 'VIDEKO SLAM' },
      { key: 'mission', wort: 'FOLLOWER-MISSION' },
      { key: 'einwilligung', wort: 'LEADERBOARD OPT-IN / OPT-OUT' },
      { key: 'spaehen', wort: 'KEYHOLE-PREVIEW VOR CODE' },
      { key: 'leaderboard', wort: 'LEADERBOARD' },
      { key: 'ziehung', wort: 'LIVE-ZIEHUNGSANSICHT' },
      { key: 'wieder', wort: 'WIEDER-LOGIN TESTEN' },
    ],
  },

  /* Der Punkt im Menue, mit dem man diesen Browser wieder abmeldet. Er loescht
     ausschliesslich den lokalen Beleg — der Deckel bleibt aktiviert. */
  abmelden: {
    wort: 'SITZUNG AUF DIESEM GERÄT BEENDEN',
    frage: 'Nur dieses Gerät abmelden? Dein Deckel bleibt aktiviert.',
  },

  /* Wieder-Login fuer Deckel, die schon aktiviert sind. Die Antwort auf die
     Anfrage steht als WIEDER_NEUTRAL unten — Server und Seite teilen sie. */
  wieder: {
    frage: 'BEREITS AKTIVIERT?',
    sub: 'Neues Handy, anderer Browser? Trag die E-Mail-Adresse ein, mit der du deinen Deckel aktiviert hast. Wir schicken dir einen Zugangslink.',
    label: 'E-Mail-Adresse',
    hilfe: 'Der Link ist 15 Minuten gültig und funktioniert nur einmal.',
    cta: 'ZUGANGSLINK ANFORDERN',
    sendet: 'Wird gesendet …',
    fehlerEmail: 'Bitte eine gültige E-Mail-Adresse eintragen.',
    bremse: 'Das ging uns gerade zu schnell. Bitte in ein paar Minuten noch einmal versuchen.',
    link: 'Dieser Zugangslink ist ungültig, abgelaufen oder wurde schon benutzt. Fordere einfach einen neuen an.',
    testLink: 'TESTLINK ÖFFNEN',
  },

  /* Einladungen im Dashboard — jeder Spieler hat welche, egal ob er über
     einen Deckel oder über eine Einladung hereingekommen ist.
     Der Wortlaut hier hat eine Aufgabe, die wichtiger ist als der Ton: er
     darf nie den Eindruck erwecken, Einladen bringe Gewinnchancen bei der
     Deckel-Verlosung. Ein echter Deckel ist ein Los. Drei Einladungen sind
     null Lose. Was Einladen bringt, steht daneben: Follower, Reichweite und
     drei Leute, die den eigenen Score jagen. */
  team: {
    label: 'DEINE {anzahl} EINLADUNGEN',
    sub: 'Hol deine {anzahl} Leute rein. Jeder von ihnen spielt voll mit und bekommt selbst wieder {anzahl} Einladungen.',
    unlock: 'Noch {fehlt} Follower bis zum nächsten Unlock.',
    unlockAlle: 'Alle Follower-Meilensteine sind frei.',
    keinLos:
      'Einladen bringt dir keine zusätzliche Chance in der Deckel-Verlosung. Ein echter Deckel ist ein Los — daran ändert kein Team etwas. Was du bekommst: Leute, die voll mitspielen und deinen Score jagen.',
    slotFrei: 'FREIER PLATZ',
    slotOffen: 'EINGELADEN',
    slotBesetzt: 'IM TRESOR',
    erzeugen: 'EINLADUNG ERSTELLEN',
    erzeugt: 'Wird erstellt …',
    teilen: 'LINK TEILEN',
    qr: 'QR ZEIGEN',
    kopieren: 'EINLADUNG KOPIEREN',
    kopiert: 'KOPIERT',
    widerrufen: 'ZURÜCKZIEHEN',
    widerrufFrage: 'Diesen Einladungslink ungültig machen? Der Platz wird danach wieder frei.',
    qrTitel: 'ZUM SCANNEN',
    qrText: 'Handy davorhalten. Der Link öffnet den Tresoreingang.',
    schliessen: 'SCHLIESSEN',
    standDeckel: 'SPIELT MIT · HAT EINEN EIGENEN DECKEL',
    standSpieler: 'SPIELT MIT',
    geoeffnet: '{n}× geöffnet',
    nochNicht: 'Noch nicht geöffnet.',
    leer: 'Noch niemand eingeladen.',
    teilenText:
      'Ich hab noch einen Platz für dich im VIDEKO Tresor. Reinkommen, @{handle} folgen und meinen Score schlagen.',
    teilenTitel: 'VIDEKO Tresor',
    scoreTeilen: 'SCORE TEILEN',
    scoreKopiert: 'KOPIERT',
    scoreTeilenText: 'Ich bin im VIDEKO Tresor. 🔐 Schlag meinen Score und hol dir deinen Platz im Ranking.',
    fehler: {
      konto: 'Dieses Konto kann gerade keine Einladungen vergeben.',
      'keine-slots': 'Alle Plätze sind vergeben.',
      geschlossen: 'Einladungen sind gerade geschlossen.',
      'nicht-offen': 'Dieser Platz lässt sich nicht mehr zurückziehen.',
      allgemein: 'Gerade keine Verbindung. Bitte noch einmal versuchen.',
    },
  },

  /* Die Landingpage hinter einem Einladungslink und alles, was ein
     eingeladener Spieler danach sieht.

     Der wichtigste Satz steht ganz oben und nicht im Kleingedruckten: wer
     ueber eine Einladung hereinkommt, ist ein vollwertiger Spieler. Alle
     Games, gewertete Scores, alle Ranglisten, Preise in den Games und drei
     eigene Einladungen. Der einzige Unterschied zu einem Deckelbesitzer ist
     die grosse Deckel-Ziehung — dafuer braucht es einen echten physischen
     Deckel, und das ist auch das einzige, was hier darueber steht.

     Bedingung fuer gewertete Scores ist in beiden Wegen dieselbe: ein
     Instagram-Name und die Bestaetigung, dass man @{handle} folgt. Die
     Feldtexte dafuer sind bewusst dieselben wie in Zustand B. */
  einladung: {
    marke: 'EINLADUNG',
    pruefen: 'Einladung wird geprüft …',
    titel: 'DU BIST EINGELADEN.',
    vonLabel: 'EINGELADEN VON',
    sub: 'Sichere dir deinen Spielernamen und jag die Bestenliste.',
    klartextTitel: 'DU SPIELST VOLL MIT.',
    klartext:
      'Alle Games, gewertete Scores, dein Platz in jeder Rangliste und drei eigene Einladungen — genau wie jeder andere Spieler. Nur die große Verlosung der {gesamt} nummerierten Deckel läuft getrennt: dort kommt rein, wer einen echten Deckel in der Hand hat.',
    was: [
      'Alle Games, voller Zugang.',
      'Deine Scores zählen in den Ranglisten und im Gesamtranking.',
      'Du spielst um die Plätze 1 bis 3 und die Game-Preise mit.',
      'Du bekommst selbst drei Einladungen.',
      'Für die Deckel-Verlosung brauchst du einen echten Deckel.',
    ],
    cta: 'SPIELERNAMEN SICHERN',
    laeuft: 'Wird eingerichtet …',
    felder: {
      instagram: 'Instagram-Name',
      instagramPlatz: 'z. B. @deinname',
      email: 'E-Mail-Adresse',
      emailPlatz: 'z. B. name@beispiel.de',
      emailHilfe:
        'Nur damit du deine Scores auf einem anderen Gerät wiederfindest. Nie öffentlich sichtbar.',
      /* Wortgleich mit Zustand B. Derselbe Haken, dieselbe Pflicht, egal ob
         jemand ueber einen Deckel oder ueber eine Einladung hereinkommt. */
      haken: 'Ich folge @{handle}',
      hakenHilfe:
        'Pflicht. Ohne Instagram-Name und diese Bestätigung werden deine Scores nicht gewertet.',
      leaderboard:
        'Ich bin damit einverstanden, dass mein Instagram-Name zusammen mit meinen Game-Scores im öffentlichen VIDEKO Game-Leaderboard angezeigt wird.',
      leaderboardHilfe:
        'Freiwillig. Ohne diese Einwilligung spielst du genauso mit — dein Instagram-Name erscheint dann nur auf keiner öffentlichen Liste.',
      bedingungen: 'Ich akzeptiere die Teilnahmebedingungen und die Datenschutzerklärung.',
    },
    fehler: {
      instagram: 'Bitte deinen Instagram-Namen eintragen.',
      email: 'Bitte eine gültige E-Mail-Adresse eintragen.',
      folgt: 'Bitte bestätige, dass du @{handle} folgst.',
      bedingungen: 'Bitte Teilnahmebedingungen und Datenschutzerklärung akzeptieren.',
      link: 'Diese Einladung ist ungültig oder gehört zu keinem Platz mehr.',
      felder: 'Bitte die markierten Felder prüfen.',
      widerrufen: 'Diese Einladung wurde zurückgezogen.',
      verbraucht: 'Diese Einladung wurde bereits eingelöst.',
      abgelaufen: 'Diese Einladung ist abgelaufen.',
      bremse: 'Gerade zu viele Versuche. Bitte in ein paar Minuten noch einmal.',
      allgemein: 'Gerade keine Verbindung. Bitte noch einmal versuchen.',
    },
    /* Der Link geht nicht mehr. Kein Drama, aber auch keine Ausrede: der Weg
       zum Terminal steht daneben, und er funktioniert auch ohne Einladung —
       nur eben mit eigenem Deckel. */
    fehlerTitel: 'DIESER LINK FÜHRT NICHT WEITER.',
    fehlerText: 'Frag die Person, die dich eingeladen hat, nach einem neuen Link. Mit einem eigenen VIDEKO-Deckel kommst du auch ohne Einladung hinein.',
    zurueck: 'ZUM TERMINAL',
    /* Auf dem Geraet liegt schon ein Zugang. Dann ist Einloesen fast immer ein
       Versehen — und es wuerde einen der drei Plaetze der einladenden Person
       verbrauchen, ohne dass jemand Neues dazukommt. */
    schonDa: 'Auf diesem Gerät ist schon ein Zugang gespeichert. Wenn du das bist, brauchst du diese Einladung nicht — du spielst längst mit, und der Platz bleibt für jemand Neues frei.',
    schonDaCta: 'ZU MEINEM TRESOR',
    trotzdem: 'Ich bin jemand anderes — Einladung einlösen',
    /* Das Dashboard nach dem Einloesen. Erst die Beruhigung, dann der
       einzige echte Unterschied: die Deckel-Ziehung. */
    gastLabel: 'SPIELER',
    gastTitel: 'DEINE SCORES SIND SICHER.',
    gastText:
      'Alles, was du spielst, wird gespeichert und gewertet. Mit einem echten Deckel kommst du zusätzlich in die große Deckel-Verlosung — deine Scores, dein Ranking und deine Einladungen bleiben dabei unverändert.',
    gastCta: 'DECKEL AKTIVIEREN',
    gastBestleistungen: 'DEINE BESTLEISTUNGEN',
    gastKeinRanking:
      'Du stehst in allen Ranglisten. Für die Verlosung der nummerierten Deckel brauchst du einen echten Deckel.',
    gastVon: 'Eingeladen von @{name}',
    konvertiertTitel: 'DEIN DECKEL IST AKTIVIERT.',
    konvertiertText: 'Du bist jetzt zusätzlich in der Deckel-Verlosung. Deine Scores sind alle da.',
  },

  gewinneTitel: 'DAS KÖNNTE IN DER TRUHE AUF DICH WARTEN',

  /* Der Verweis auf die oeffentliche Ziehung. Steht auf mehreren Seiten. */
  ziehungZeile: 'Gezogen wird öffentlich und live.',
  ziehungCta: 'LIVE-ZIEHUNG',
}

/**
 * Platzhalter in einem Text ersetzen: `fuelle('1 bis {gesamt}', { gesamt: 5000 })`.
 *
 * So bleibt der komplette Wortlaut in TEXTE stehen — auch die Saetze, in
 * denen eine Zahl vorkommt, die anderswo konfiguriert wird. Wer die Aktion
 * auf 10.000 Deckel vergroessert, aendert genau einen Wert.
 */
export function fuelle(vorlage, werte = {}) {
  return String(vorlage ?? '').replace(/\{(\w+)\}/g, (treffer, name) =>
    Object.prototype.hasOwnProperty.call(werte, name) ? String(werte[name]) : treffer,
  )
}

/** Zahl in deutscher Schreibweise: 5000 -> "5.000". */
export const zahl = (n) => Number(n ?? 0).toLocaleString('de-DE')

/**
 * Der Satz nach einem Probespiel: "MIT 12.430 PUNKTEN WAERST DU AKTUELL
 * PLATZ 7."
 *
 * Rein gerechnet, damit er pruefbar ist. Hineingereicht wird der Stand des
 * Abrufs und die oeffentliche Rangliste — nur die Punktwerte, absteigend.
 * Die Liste ist immer die veroeffentlichte Liste, also hoechstens die ersten
 * zwanzig Eintraege; mehr gibt der Server ohne Sitzung nicht heraus, und mehr
 * wird hier auch nicht behauptet:
 *
 *   - hat die veroeffentlichte Liste weniger als PROBE_MINDEST Eintraege,
 *     wird gar kein Platz genannt. Nicht weil er falsch waere, sondern
 *     weil er nichts bedeutet: wer bei zwei Eintraegen „Platz 3“ liest,
 *     liest eine leere Rangliste und glaubt, er habe etwas erreicht;
 *   - liegt der Wert ueber mindestens einem Eintrag, ist der Platz exakt
 *     abzaehlbar — er wird genannt;
 *   - liegt er unter allen, ist der echte Platz unbekannt. Dann wird keine
 *     Zahl erfunden, sondern gesagt, dass es noch nicht in die Top N reicht,
 *     wobei N die Laenge der Liste ist, die wirklich da war;
 *   - laedt der Abruf noch, schlug er fehl oder gibt es fuer dieses Spiel
 *     keine veroeffentlichte Liste, sagt der Satz genau das.
 *
 * Gibt `null` zurueck, wenn es nichts zu sagen gibt.
 */
export const PROBE_SPITZE = 3

/* Die zweite Marke darunter. Wer weit hinten liegt, dem nuetzt der
   Abstand zur Top 3 nichts — das naechste erreichbare Ziel ist die
   Top 10. Genannt wird sie nur, wenn die Liste so weit reicht. */
export const PROBE_MITTE = 10

/* Ab so vielen echten Eintraegen ist ein Platz eine Aussage. Darunter
   ist die Rangliste noch im Aufbau und der Satz sagt genau das. */
export const PROBE_MINDEST = 5

export function probeRangSatz(stand, liste, punkte) {
  if (stand === 'laedt') return { art: 'laedt', text: TEXTE.g.practiceRangLaedt }
  if (stand === 'fehler') return { art: 'fehler', text: TEXTE.g.practiceRangFehler }
  if (stand === 'leer') return { art: 'leer', text: TEXTE.g.practiceRangLeer }
  if (stand !== 'da' || !Array.isArray(liste) || !liste.length) return null
  const wert = Number(punkte) || 0

  /* Eine Rangliste mit drei Eintraegen macht aus jedem Score einen
     Spitzenplatz. Das ist korrekt gezaehlt und trotzdem das Gegenteil
     einer Auszeichnung — wer es liest, sieht sofort, dass niemand da ist.
     Also wird unterhalb von PROBE_MINDEST kein Platz behauptet, auch kein
     knapper: die Liste ist jung, und genau das steht dann da. */
  if (liste.length < PROBE_MINDEST) {
    return {
      art: 'jung',
      text: TEXTE.g.practiceRangJung,
      zusatz: TEXTE.g.practiceRangJungBis,
    }
  }

  const besser = liste.filter((p) => p > wert).length
  const platz = besser + 1

  /* Der Abstand zur naechsten Marke — aber nur zu einer, die in der
     veroeffentlichten Liste wirklich steht. Wer hinter Platz 10 liegt,
     bekommt die Top 10 genannt; naeher dran zaehlt nur noch die Top 3.
     Gerechnet wird gegen den letzten Platz, der noch dazugehoert: ein Punkt
     mehr als diese Punktzahl reicht. Nichts davon ist geschaetzt — beide
     Schwellen sind Werte aus der Liste selbst. */
  const marke =
    platz > PROBE_MITTE && liste.length >= PROBE_MITTE
      ? PROBE_MITTE
      : platz > PROBE_SPITZE && liste.length >= PROBE_SPITZE
        ? PROBE_SPITZE
        : null
  let zusatz = null
  if (marke) {
    const schwelle = liste[marke - 1]
    const fehlt = Math.max(1, schwelle - wert + 1)
    zusatz = fuelle(TEXTE.g.practiceRangBis, { fehlt: zahl(fehlt), top: marke })
  }

  if (besser >= liste.length) {
    return {
      art: 'knapp',
      text: fuelle(TEXTE.g.practiceRangKnapp, { punkte: zahl(wert), top: liste.length }),
      zusatz,
    }
  }
  if (platz === 1) return { art: 'platz', text: TEXTE.g.practiceRangEins, zusatz: null }
  return {
    art: 'platz',
    text: fuelle(TEXTE.g.practiceRang, { punkte: zahl(wert), platz }),
    zusatz,
  }
}

/**
 * Die Punktwerte eines Spiels aus einer Ranglisten-Antwort — absteigend.
 *
 * Steht hier und nicht in der Seite, weil genau diese Stelle einmal falsch
 * lag und es niemandem auffiel: der Server liefert je Spiel ein Objekt
 * (`{ eintraege: [...], eigenerPlatz, ... }`), die Seite las es als flaches
 * Array. `Array.isArray` sagte nein, der Vergleich meldete "keine
 * oeffentliche Rangliste" — und zwar immer, auch wenn eine da war. Getestet
 * wurde das damals gegen einen selbstgebauten Stub, der die Liste direkt
 * lieferte; der Fehler konnte so gar nicht auffallen.
 *
 * Darum werden beide Formen angenommen, und darum liegt die Umwandlung als
 * reine Funktion hier, wo ein Test die echte Serverform nachstellen kann.
 *
 * Gibt `null` zurueck, wenn die Antwort fuer dieses Spiel nichts hergibt —
 * das ist etwas anderes als eine leere Liste und wird auch anders gesagt.
 */
export function probeListeAus(antwort, key) {
  if (!antwort?.ok) return null
  const roh = antwort.listen?.[key]
  const eintraege = Array.isArray(roh) ? roh : Array.isArray(roh?.eintraege) ? roh.eintraege : null
  if (!eintraege) return null
  return eintraege
    .map((eintrag) => Number(eintrag?.punkte))
    .filter((p) => Number.isFinite(p) && p > 0)
    .sort((a, b) => b - a)
}

/** Die drei Stufen des Fortschrittsanzeigers in Zustand B. */
export const SCHRITTE = ['Rätsel lösen', 'Code knacken', 'Deckel aktivieren']

/** Erklaerkarten unter dem Aktivierungsformular (Zustand B). */
export const AKTIVIER_KARTEN = [
  {
    key: 'nummer',
    icon: 'nummer',
    titel: 'Deckelnummer eintragen',
    text: 'Die handschriftliche Nummer auf deinem Deckel. Jede Nummer ist genau ein Los.',
  },
  {
    key: 'instagram',
    icon: 'instagram',
    titel: 'Instagram folgen',
    text: 'Wir prüfen den Follow von Hand — und nur dann, wenn deine Nummer gezogen wurde.',
  },
  {
    key: 'deckel',
    icon: 'deckel',
    titel: 'Originaldeckel aufheben',
    text: 'Der Deckel selbst ist dein Los. Ohne ihn lässt sich ein Gewinn nicht einlösen.',
  },
  {
    key: 'ziehung',
    icon: 'uhr',
    titel: 'Live-Ziehung abwarten',
    text: 'Gezogen wird öffentlich. Den Termin findest du hier und auf Instagram.',
  },
]

/* Drei Wege zu einem Gewinn — und sie haengen NICHT voneinander ab.
   Lange stand auf der Landing sinngemaess, ohne Deckel sei nichts zu holen;
   seit es Game-Preise gibt, ist das falsch. Die Karten trennen deshalb
   sauber: zwei Wege ueber das Spielen, einer ueber den physischen Deckel.
   Die Zahl der Hauptspiele kommt aus STANDARD_HAUPTGAMES, damit der Text
   mitzieht, wenn die Aufstellung sich aendert. Konkrete Preise stehen
   bewusst nicht hier — die sind ausgeschrieben, nicht erfunden. */
export const GEWINN_WEGE = [
  {
    key: 'game',
    icon: 'pokal',
    titel: 'Game-Ranglisten',
    text: 'Jedes Game hat seine eigene Bestenliste. Dein offizieller Score kann dort f\u00fcr die ausgeschriebenen Game-Preise z\u00e4hlen \u2014 ganz ohne Deckel.',
  },
  {
    key: 'gesamt',
    icon: 'krone',
    titel: 'Gesamtranking',
    text: 'Deine besten Scores aus den {hauptspiele} Hauptspielen ergeben zusammen deinen Platz im Gesamtranking. Daf\u00fcr gibt es eigene Gewinne.',
  },
  {
    key: 'deckel',
    icon: 'nummer',
    titel: 'Deckelziehung',
    text: 'Jeder physische, nummerierte Deckel ist zus\u00e4tzlich eine Chance in der Deckelziehung. Die l\u00e4uft getrennt von den Spielen \u2014 gut spielen hilft dort nicht, ein Deckel bei den Spielen nicht.',
  },
]

/** Erklaerkarten der Live-Ziehung (Zustand D). */
export const ZIEHUNG_KARTEN = [
  {
    key: 'original',
    icon: 'deckel',
    titel: 'Gewinn nur mit Originaldeckel',
    text: 'Jede gezogene Nummer muss auf dem echten, handschriftlich beschrifteten Deckel stehen.',
  },
  {
    key: 'follow',
    icon: 'instagram',
    titel: 'Instagram-Follow erforderlich',
    text: 'Der Follow auf @videko.kuechen wird beim Gewinn von Hand geprüft.',
  },
  {
    key: 'frist',
    icon: 'uhr',
    titel: '48 Stunden Meldefrist',
    text: 'Nach der Ziehung bleiben 48 Stunden Zeit, sich zu melden.',
  },
  {
    key: 'neu',
    icon: 'wuerfel',
    titel: 'Danach neue Ziehung',
    text: 'Meldet sich niemand, wird erneut gezogen — unter allen aktivierten Deckeln.',
  },
]

/**
 * Der schmale Schrittstreifen unter dem Codefeld (Zustand A). Bewusst nur
 * Symbol und Wort: er steht auf einem Handy in einer Zeile und wiederholt
 * damit TEXTE.a.hinweis in sichtbarer Form.
 */
export const ABLAUF = [
  { key: 'raetsel', icon: 'raetsel', titel: 'Rätsel lösen' },
  { key: 'code', icon: 'schloss', titel: 'Code eingeben' },
  { key: 'aktivieren', icon: 'nummer', titel: 'Deckel aktivieren' },
]

/* ------------------------------------------------------------------ */
/* Spiele                                                              */
/* ------------------------------------------------------------------ */

/**
 * Die beiden Spiele im Tresor. Die Schluessel sind dieselben wie auf dem
 * Server (api/_terminal-kern.js, SPIELE) und in der Datenbank — sie stehen in
 * den Laufzetteln und in den Ranglisten.
 *
 * Spielzeit und Punkteregeln liegen in den Komponenten, nicht hier: sie sind
 * Spielmechanik, kein Kampagnentext. Hier steht nur, was auf der Karte steht.
 */
export const SPIELE_LISTE = [
  {
    key: 'truhenknacker',
    titel: 'TRUHENKNACKER',
    icon: 'schloss',
    zeile: 'Drei Ringe, ein Moment. Stoppe jeden Ring im goldenen Feld.',
    regel: 'Perfekt getroffen gibt Bonus, verkantet kostet Zeit.',
  },
  {
    key: 'goldrausch',
    titel: 'GOLDRAUSCH',
    icon: 'muenze',
    zeile: 'Gold, Diamanten, Badeenten. Finger weg von den Bomben.',
    regel: 'Die goldene Badeente gibt 5.000 — und kommt fast nie.',
  },
  {
    key: 'kuechen_stack',
    titel: 'KÜCHEN-STACK',
    icon: 'stapel',
    zeile: 'Ein Tipp, ein Modul. Stapel die Küche so hoch es geht.',
    regel: 'Was übersteht, fällt ab. Perfekt abgesetzt gibt Multiplikator.',
    ohneZeit: true,
  },
  {
    key: 'kuechen_dash',
    titel: 'KÜCHEN-DASH',
    icon: 'lauf',
    zeile: 'Die Baustelle läuft. Tippen zum Springen.',
    regel: 'Kartons, Rohre, Farbeimer — ein Treffer und die Runde ist vorbei.',
    ohneZeit: true,
  },
  /* GAME-LAB: sieben Kandidaten im Test. Eigene Ranglisten, nicht in GESAMT. */
  {
    key: 'kuechen_balance',
    titel: 'KÜCHEN-BALANCE',
    icon: 'waage',
    zeile: 'Kühlschrank auf Spüle auf Karton. Was soll schon passieren.',
    regel: 'Ziehen zum Ausrichten, loslassen zum Absetzen. Kippt der Turm, ist Schluss.',
    ohneZeit: true,
    hochformat: true,
  },
  {
    key: 'kuechen_fit',
    titel: 'KÜCHEN-FIT',
    icon: 'raster',
    zeile: 'Schränke einpassen, Reihen abräumen.',
    regel: 'Wischen zum Schieben, tippen zum Drehen, nach unten wischen zum Absetzen.',
    ohneZeit: true,
    hochformat: true,
  },
  {
    key: 'videko_jump',
    titel: 'VIDEKO JUMP',
    icon: 'hoch',
    zeile: 'Von Arbeitsplatte zu Arbeitsplatte. Nur nach oben.',
    regel: 'Links oder rechts tippen und halten. Gesprungen wird von allein.',
    ohneZeit: true,
    hochformat: true,
  },
  {
    key: 'kuechen_merge',
    titel: 'KÜCHEN-MERGE',
    icon: 'verbinden',
    zeile: 'Zwei Tassen, ein Toaster. Bis zur Kücheninsel.',
    regel: 'Ziehen zum Zielen, loslassen zum Fallenlassen. Über der Linie ist Schluss.',
    ohneZeit: true,
    hochformat: true,
  },
  {
    key: 'leitungsfinder',
    titel: 'LEITUNGSFINDER',
    icon: 'blitz',
    zeile: 'Hier bohren? Die Zahlen wissen, wo Leitungen liegen.',
    regel: 'Tippen zum Bohren. Die Zahl nennt die Leitungen ringsum. Eine Leitung, und es wird teuer.',
    ohneZeit: true,
    hochformat: true,
  },
  {
    key: 'kuechen_crush',
    titel: 'KÜCHEN-CRUSH',
    icon: 'funkeln',
    zeile: 'Drei gleiche in einer Reihe. 40 Sekunden.',
    regel: 'Wischen zum Tauschen. Vier geben einen Booster, fünf die VIDEKO-BOMBE.',
    hochformat: true,
  },
  {
    key: 'kuechen_tinder',
    titel: 'KÜCHEN-TINDER',
    icon: 'herz',
    zeile: 'Zehn Aufgaben, dreißig Sekunden. Passt es oder nicht?',
    regel: 'Lies die Aufgabe über der Karte. Rechts heißt JA, links heißt NEIN. Richtige Serien bringen Combo, Fehler kosten 2 s.',
    hochformat: true,
  },
  {
    key: 'videko_slam',
    titel: 'VIDEKO SLAM',
    icon: 'hammer',
    zeile: 'Aus den Fronten kommt alles. Auch Mist. 50 Sekunden.',
    regel: 'Tippen, was ins Haus gehört. Mist kostet Zeit. Gold, Kühlschrank, Backofen und die Sirene ändern die Lage.',
    hochformat: true,
  },
]

/**
 * Welche Spiele zaehlen in die Gesamtwertung und damit in den Tresorkoenig.
 * Die beiden neuen Spiele bekommen eigene Listen, veraendern die Gesamtwertung
 * aber nicht — sonst waeren alle bisherigen Gesamtstaende auf einen Schlag
 * nicht mehr vergleichbar.
 */
/*
 * DIE ANLEITUNGEN — eine je Spiel, und bewusst kurz.
 *
 * Wer eine Anleitung aufmacht, spielt in dieser Zeit nicht. Deshalb hoechstens
 * fuenf Bloecke: Ziel, Steuerung, ein paar Besonderheiten, wie die Runde endet
 * und was zu gewinnen ist. Der Gewinnsatz steht nicht hier, sondern einmal in
 * TEXTE.g (anleitungGewinnText / anleitungGewinnProbe) — er gilt fuer alle
 * Spiele gleich und darf nie mehr versprechen als die Teilnahmebedingungen.
 *
 * `punkte` ist eine Liste aus [Ueberschrift, Satz]. Alles hier ist aus der
 * jeweiligen Spiellogik abgelesen, nicht ausgedacht.
 */
export const ANLEITUNGEN = {
  videko_jump: {
    ziel: 'Spring so hoch wie möglich und sammle Punkte.',
    steuerung: 'Links oder rechts gedrückt halten. Gesprungen wird von allein.',
    punkte: [
      ['FEDERPLATTE', 'Gibt extra Schub nach oben.'],
      ['SCHÜRZE', 'Fängt genau einen Treffer ab und zerspringt dabei.'],
      ['MÜTZE & SUPERKOCH', 'Deine Punkte zählen doppelt bzw. dreifach.'],
      ['MAGNET', 'Zieht das Gold in der Nähe zu dir.'],
    ],
    ende: 'Ein Treffer ohne Schürze beendet die Runde. Wer unten aus dem Bild fällt, auch.',
  },
  kuechen_merge: {
    ziel: 'Bring gleiche Teile zusammen, bis die Kücheninsel entsteht.',
    steuerung: 'Finger waagerecht bewegen zum Zielen, loslassen wirft ab.',
    punkte: [
      ['VORSCHAU', 'Oben steht, welches Teil als Nächstes kommt.'],
      ['KOMBO', 'Verschmelzungen kurz nacheinander zählen höher.'],
      ['LAGE', 'Wo ein Teil landet, entscheidet mehr als wie schnell du wirfst.'],
    ],
    ende: 'Ragt der Stapel zu lange über die Linie, ist Schluss.',
  },
  kuechen_crush: {
    ziel: 'Drei gleiche in einer Reihe — so viele Züge wie möglich.',
    steuerung: 'Von einem Stein zum Nachbarn wischen. Oder erst den einen, dann den anderen antippen.',
    punkte: [
      ['VIER', 'Gibt einen Booster.'],
      ['FÜNF', 'Gibt die VIDEKO-BOMBE.'],
      ['KOMBO', 'Kaskaden und Tempo heben den Multiplikator.'],
      ['ZEIT', 'Gute Züge geben Zeit zurück.'],
    ],
    ende: 'Die Runde endet, wenn die Uhr abgelaufen ist.',
  },
  kuechen_fit: {
    ziel: 'Passe die Schränke ein und räume volle Reihen ab.',
    steuerung: 'Waagerecht ziehen schiebt, kurzer Tipp dreht, Wisch nach unten setzt sofort ab.',
    punkte: [
      ['PERFECT FIT', 'Sauber eingepasst gibt deutlich mehr Punkte.'],
      ['MEHRERE REIHEN', 'Zwei, drei oder vier Reihen auf einmal zählen überproportional.'],
      ['TEMPO', 'Alle paar Sekunden fällt es etwas schneller.'],
    ],
    ende: 'Passt kein Teil mehr ins Feld, ist Schluss.',
  },
  leitungsfinder: {
    ziel: 'Bohr die Wand auf, ohne eine Leitung zu treffen.',
    steuerung: 'Tippen zum Bohren. Lange drücken oder MARKIEREN umlegen setzt eine Markierung.',
    punkte: [
      ['DIE ZAHLEN', 'Eine Zahl nennt die Leitungen in den acht Feldern ringsum.'],
      ['ERSTER TIPP', 'Der erste Tipp jeder Wand ist immer sicher.'],
      ['SERIE', 'Zügig weiterbohren gibt bis zu +50 % auf die Fliesenpunkte.'],
    ],
    ende: 'Eine getroffene Leitung beendet die Runde. Wand geschafft heißt: die nächste wird dichter.',
  },
  videko_slam: {
    ziel: 'Tipp an, was ins Haus gehört. Der Mist bleibt liegen.',
    steuerung: 'Antippen. Mehr braucht es nicht.',
    punkte: [
      ['MIST', 'Kostet Zeit und beendet deine Serie.'],
      ['SERIE', 'Richtige Treffer hintereinander zählen höher.'],
      ['GOLD, KÜHLSCHRANK, BACKOFEN, SIRENE', 'Ändern kurz die Lage.'],
    ],
    ende: '50 Sekunden, dann ist Schluss.',
  },
  kuechen_balance: {
    ziel: 'Stapel den Turm so hoch wie möglich.',
    steuerung: 'Ziehen richtet aus, loslassen setzt ab. Ein kurzer Tipp legt drehbare Teile quer.',
    punkte: [
      ['SCHWERPUNKT', 'Entscheidend ist, ob der Schwerpunkt noch auf der Auflage liegt.'],
      ['RISKANT', 'Knapp gesetzte Teile geben mehr Punkte — und wackeln.'],
    ],
    ende: 'Kippt der Turm, ist Schluss.',
  },
  kuechen_stack: {
    ziel: 'Stapel die Küche so hoch es geht.',
    steuerung: 'Ein Tipp setzt das Modul ab.',
    punkte: [
      ['ÜBERSTAND', 'Was übersteht, wird abgeschnitten — das nächste Modul ist schmaler.'],
      ['PERFECT', 'Genau getroffen schneidet nichts ab und hebt den Faktor bis ×4.'],
      ['ZURÜCK', 'Ab drei perfekten Landungen wächst das Modul ein Stück nach.'],
    ],
    ende: 'Wer ganz danebentippt, beendet die Runde.',
  },
  kuechen_dash: {
    ziel: 'Lauf so weit wie möglich.',
    steuerung: 'Tippen zum Springen. Genau ein Sprung, keiner in der Luft.',
    punkte: [
      ['METER', 'Punkte sind Meter.'],
      ['TEMPO', 'Es wird schneller, bis rund 400 m.'],
      ['FAIR', 'Jedes Hindernis ist mit einem sauberen Sprung zu schaffen.'],
    ],
    ende: 'Ein Treffer, und die Runde ist vorbei.',
  },
  truhenknacker: {
    ziel: 'Stopp jeden der drei Ringe im goldenen Feld.',
    steuerung: 'Tippen stoppt den aktiven Ring.',
    punkte: [
      ['PERFEKT', 'Genau getroffen gibt Bonus.'],
      ['VERKANTET', 'Danebengetroffen kostet Spielzeit.'],
      ['SPÄTER', 'Die Felder werden enger, die Ringe schneller, und es tauchen falsche Markierungen auf.'],
    ],
    ende: 'Die Runde endet mit der Uhr.',
  },
  goldrausch: {
    ziel: 'Tipp das Gold an. Finger weg von den Bomben.',
    steuerung: 'Antippen.',
    punkte: [
      ['GOLDENE BADEENTE', 'Gibt 5.000 — und kommt fast nie.'],
      ['BOMBE', 'Kostet Punkte.'],
      ['BIER, KATER, STEIN', 'Verschwimmen den Blick, drehen die Richtung, blockieren kurz.'],
    ],
    ende: 'Dreißig Sekunden, und sie werden immer schneller.',
  },
  kuechen_tinder: {
    ziel: 'Entscheide, ob es passt oder nicht.',
    steuerung: 'Rechts heißt JA, links heißt NEIN. Die Aufgabe steht über der Karte.',
    punkte: [
      ['SERIE', 'Richtige Serien bringen Combo.'],
      ['FEHLER', 'Kosten 2 Sekunden.'],
    ],
    ende: 'Zehn Aufgaben oder dreißig Sekunden.',
  },
}

export const GESAMT_SPIELE = ['truhenknacker', 'goldrausch']

/**
 * Das Gesamtranking der Aktion: die sechs Hauptgames. Ohne Eintrag in der
 * Verwaltung gelten diese sechs; der Testslot zaehlt nie. Server und Seite
 * lesen dieselben Standards.
 *
 * VIDEKO Slam ist seit dem Stadtfest-Umbau kein Testslot mehr, sondern ein
 * regulaeres Hauptgame wie jedes andere. Kuechen-Tinder bleibt draussen und
 * zaehlt nirgends.
 */
export const STANDARD_HAUPTGAMES = [
  'leitungsfinder', 'kuechen_merge', 'kuechen_crush', 'videko_jump', 'kuechen_fit', 'videko_slam',
]
export const HAUPTGAMES_ANZAHL = 6

/**
 * BESTE VIER AUS SECHS. Nur die vier staerksten Game-Ergebnisse einer Person
 * zaehlen; die zwei schwaechsten werden gestrichen. Dieselbe Zahl ist auch
 * die Huerde: wer vier verschiedene Hauptgames gespielt hat, ist im Ranking.
 *
 * Warum nicht alle sechs: sechs Pflichtspiele sind an einem Stadtfestabend
 * zu viel. Vier aus sechs laesst zwei Fehlgriffe zu und belohnt trotzdem,
 * wer mehr spielt — jedes weitere Game kann ein schwaches ersetzen.
 */
export const GEWERTETE_GAMES = 4

/** Rangpunkte fuer Platz 1 eines Games. Maximum gesamt: 4 × 1.000. */
export const RANGPUNKTE_MAX = 1000

/**
 * Das eine Game, das jemand ohne Konto zur Probe spielen darf — der
 * anonyme Koeder vor der Anmeldung. Der Probelauf wird nicht gewertet und
 * taucht in keiner Rangliste auf. Die Verwaltung kann einen anderen Slot
 * eintragen; ohne Eintrag gilt dieser. Kuechen-Tinder ist hier bewusst
 * nicht vorgesehen: der ist nur noch Altbestand.
 *
 * Seit dem Funnel-Umbau ist das VIDEKO Jump: es startet ohne Erklaerung,
 * eine Runde dauert unter zwei Minuten, und man will sofort noch einmal.
 * Kuechen-Merge bleibt Hauptgame, ist aber nicht mehr das Probespiel.
 * Muss mit PRACTICE_STANDARD in api/_terminal-kern.js uebereinstimmen.
 */
export const PRACTICE_STANDARD = 'videko_jump'

/**
 * Ohne Eintrag ausgeblendet. Der Server schickt die Schalter ohnehin
 * vollstaendig (Hauptgames und ein eingetragener Testslot an); diese Liste
 * greift nur, wenn ein Eintrag fehlt. Kuechen-Tinder steht darin, weil er
 * nur noch Altbestand ist: er bleibt erhalten, ist aber ausgeblendet und
 * zaehlt in keiner Wertung.
 */
export const STANDARD_AUS = ['kuechen_stack', 'kuechen_dash', 'kuechen_balance', 'truhenknacker', 'goldrausch', 'kuechen_tinder']

/** Ist ein Spiel sichtbar? Ein ausdrueckliches true/false gewinnt, sonst der Standard. */
export const spielAktiv = (schalter, key) =>
  schalter?.[key] === true ? true : schalter?.[key] === false ? false : !STANDARD_AUS.includes(key)

/**
 * Die sichtbaren Spiele in der Reihenfolge aus der Verwaltung. Unbekannte
 * Schluessel fallen weg, fehlende haengen in der Standardreihenfolge hinten an.
 */
export function aktiveSpiele(schalter = {}, reihenfolge = null) {
  return spieleSortiert(reihenfolge).filter((s) => spielAktiv(schalter, s.key))
}

/**
 * Standardreihenfolge ohne Eintrag in der Verwaltung: die sechs staerksten
 * Kandidaten vorn, der Rest dahinter. Server (reihenfolgeSaeubern) und Seite
 * lesen dieselbe Liste.
 */
export const STANDARD_REIHENFOLGE = [
  'leitungsfinder', 'kuechen_merge', 'kuechen_crush', 'videko_jump', 'kuechen_fit', 'videko_slam',
  'kuechen_tinder', 'kuechen_balance', 'truhenknacker', 'goldrausch', 'kuechen_stack', 'kuechen_dash',
]

export function spieleSortiert(reihenfolge = null) {
  const liste = Array.isArray(reihenfolge) ? reihenfolge : []
  const standard = (key) => {
    const i = STANDARD_REIHENFOLGE.indexOf(key)
    return i >= 0 ? i : STANDARD_REIHENFOLGE.length + SPIELE_LISTE.findIndex((s) => s.key === key)
  }
  const rang = (key) => {
    const i = liste.indexOf(key)
    return i >= 0 ? i : liste.length + standard(key)
  }
  return [...SPIELE_LISTE].sort((a, b) => rang(a.key) - rang(b.key))
}

/** Spielschluessel → Kartentext. Praktisch fuer die Ergebnisanzeige. */
export const SPIEL_NACH_KEY = Object.fromEntries(SPIELE_LISTE.map((s) => [s.key, s]))

/**
 * Kurzform fuer enge Stellen — die Zeile "Jump · Slam · Fit · Crush" in der
 * Gesamtrangliste muss auf 390 px passen. Nur wo der volle Titel zu lang ist;
 * alles andere faellt auf den Titel zurueck.
 */
const SPIEL_KURZ = {
  videko_jump: 'Jump',
  kuechen_merge: 'Merge',
  kuechen_crush: 'Crush',
  kuechen_fit: 'Fit',
  leitungsfinder: 'Leitung',
  videko_slam: 'Slam',
}

/** Kurzes Wort fuer ein Spiel. Ohne Eintrag: der Titel, wie er ist. */
export const spielKurz = (key) => SPIEL_KURZ[key] ?? SPIEL_NACH_KEY[key]?.titel ?? key

/**
 * Goldrausch — was durch das Bild fliegt.
 *
 * `gewicht` ist die relative Haeufigkeit, nicht eine Wahrscheinlichkeit: die
 * Summe darf beliebig sein, gezogen wird anteilig. Die goldene Badeente hat
 * bewusst ein Gewicht unter eins — sie soll die Ausnahme sein, an die man sich
 * erinnert, nicht der Normalfall.
 *
 * `gut` heisst: dafuer gibt es Punkte. Alles andere will nicht angetippt
 * werden — die Bombe kostet Punkte, Bier und Kater stoeren, der Stein
 * blockiert kurz.
 */
export const GOLD_OBJEKTE = [
  { key: 'muenze', name: 'GOLDMÜNZE', punkte: 120, gewicht: 40, gut: true },
  { key: 'diamant', name: 'DIAMANT', punkte: 320, gewicht: 12, gut: true },
  { key: 'ente', name: 'BADEENTE', punkte: 650, gewicht: 8, gut: true },
  { key: 'goldente', name: 'GOLDENE BADEENTE', punkte: 5000, gewicht: 0.6, gut: true },
  { key: 'bombe', name: 'BOMBE', punkte: -250, gewicht: 14 },
  { key: 'bier', name: 'BIER', punkte: 0, gewicht: 6, stoerung: 'bier' },
  { key: 'kater', name: 'KATER', punkte: 0, gewicht: 5, stoerung: 'kater' },
  { key: 'stein', name: 'STEIN', punkte: 0, gewicht: 10, sperre: 420 },
]

export const GOLD_NACH_KEY = Object.fromEntries(GOLD_OBJEKTE.map((o) => [o.key, o]))

/* ------------------------------------------------------------------ */
/* Hilfsfunktionen                                                     */
/* ------------------------------------------------------------------ */

/**
 * Instagram-Name vereinheitlichen: fuehrendes @, Leerraum und eine
 * mitkopierte Profil-URL fallen weg. Gespeichert wird ohne @, angezeigt mit —
 * so liegt in der Datenbank genau ein Format.
 */
export function instagramNormalisieren(roh) {
  return String(roh ?? '')
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/^@+/, '')
    .trim()
    .slice(0, FELD_GRENZEN.instagram)
}

/** Instagram-Name fuer die Anzeige — immer mit @. */
export const instagramAnzeige = (handle) => `@${instagramNormalisieren(handle)}`

export const EMAIL_MUSTER = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Die Antwort auf jede Anfrage nach einem Zugangslink — ob die Adresse
 * bekannt ist oder nicht. Server und Seite nutzen denselben Satz, damit er
 * nie auseinanderlaeuft und nichts verraet.
 */
export const WIEDER_NEUTRAL =
  'Wenn zu dieser E-Mail ein aktivierter Deckel gehört, haben wir dir einen Zugangslink geschickt.'

/**
 * Deckelnummer pruefen. Akzeptiert wird ausschliesslich eine ganze Zahl
 * zwischen 1 und deckelGesamt. Fuehrende Nullen sind erlaubt (auf dem Deckel
 * steht vielleicht "0042"), alles andere nicht.
 *
 * @returns {number|null} die Nummer, oder null wenn sie nicht gueltig ist
 */
export function deckelNummer(roh) {
  const text = String(roh ?? '').trim()
  if (!/^\d{1,7}$/.test(text)) return null
  const n = Number(text)
  if (!Number.isInteger(n) || n < 1 || n > TERMINAL_KAMPAGNE.deckelGesamt) return null
  return n
}

/** Deckelnummer in der Schreibweise der Seite: #1847. */
export const deckelText = (n) => `#${n}`

/**
 * Restzeit in Tage/Stunden/Minuten/Sekunden.
 * Liegt das Ziel in der Vergangenheit, sind alle Werte 0 und `vorbei` true.
 */
export function restzeit(zielMs, jetztMs) {
  const diff = Math.max(0, zielMs - jetztMs)
  const sek = Math.floor(diff / 1000)
  return {
    vorbei: diff === 0,
    tage: Math.floor(sek / 86400),
    stunden: Math.floor((sek % 86400) / 3600),
    minuten: Math.floor((sek % 3600) / 60),
    sekunden: sek % 60,
  }
}

/** Datum und Uhrzeit, immer in Europe/Berlin — egal wo Browser oder Funktion laufen. */
export function terminText(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
