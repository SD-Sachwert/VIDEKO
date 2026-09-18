/**
 * Rechtstexte der Stadtfest-Aktionsseite: Teilnahmebedingungen und
 * eventspezifische Datenschutzhinweise.
 *
 * ======================================================================
 * Alle Stellen, an denen eine verbindliche Angabe fehlt, sind mit FEHLT
 * markiert und werden im Text sichtbar als Lücke ausgegeben — bewusst,
 * damit niemand einen unfertigen Stand für fertig hält. Es wurden KEINE
 * wirtschaftlichen Bedingungen (Werte, Fristen, Termine, Streamingkanäle)
 * erfunden.
 * ======================================================================
 *
 * Die Gewinnmechanik ist zweistufig und muss es an jeder Stelle bleiben:
 *   Sofortgewinn   = wird am Stand ausgegeben, ist sofort erledigt.
 *   Hauptpreisfeld = qualifiziert NUR für den betreffenden Lostopf.
 * Der Satz „Du hast den Hauptpreis gewonnen." darf nirgends entstehen.
 *
 * Alles Unternehmensbezogene kommt aus data/company.js (Single Source of
 * Truth), alles Eventbezogene aus data/stadtfest.js.
 */
import { ACTIVE_OPERATOR, BRAND, OPERATOR_NOTICE } from './company.js'
import {
  ATLAS_RECHTSDATEN,
  GOLD_BEDINGUNGEN,
  GUTSCHEIN_BEDINGUNGEN,
  HAUPTPREISE_GESAMT,
  LOSTOEPFE_GESAMT,
  SOFORTGEWINN_BEDINGUNGEN,
  SPANNDECKE_BEDINGUNGEN,
  STADTFEST_EVENT,
  STADTFEST_GEWINNMECHANIK,
  STADTFEST_HAUPTPREISE,
  STADTFEST_SOFORTGEWINNE,
  STADTFEST_ZIEHUNG,
  WELLNESS_BEDINGUNGEN,
  zeitraumText,
} from './stadtfest.js'

/** Sichtbare Markierung für jede noch fehlende verbindliche Angabe. */
export const FEHLT = '[ NOCH ZU ERGÄNZEN ]'

const veranstalter = [
  ACTIVE_OPERATOR.legalName,
  `${ACTIVE_OPERATOR.street}, ${ACTIVE_OPERATOR.postalCode} ${ACTIVE_OPERATOR.city}`,
  `${ACTIVE_OPERATOR.registerType}: ${ACTIVE_OPERATOR.registerCourt}, ${ACTIVE_OPERATOR.registerNumber}`,
  `Vorstand: ${ACTIVE_OPERATOR.board.join(', ')}`,
  `E-Mail: ${BRAND.contactEmail}`,
].join(' · ')

/**
 * Der ATLAS-Verantwortliche als eine Zeile.
 *
 * Wichtig: ATLAS Wealth ist eine Marke, keine eigene Genossenschaft. Eine
 * „Atlas Wealth eG" existiert nicht und darf hier nicht auftauchen.
 */
const atlasAnschrift = [
  `${ATLAS_RECHTSDATEN.strasse}, ${ATLAS_RECHTSDATEN.plz} ${ATLAS_RECHTSDATEN.ort}`,
  `${ATLAS_RECHTSDATEN.registerArt} ${ATLAS_RECHTSDATEN.registerNummer}, ${ATLAS_RECHTSDATEN.registergericht}`,
  `USt-IdNr. ${ATLAS_RECHTSDATEN.ustId}`,
  `E-Mail: ${ATLAS_RECHTSDATEN.email}`,
]

/** Freigegebene Kurzform: Süddeutsche Sachwert eG (ATLAS Wealth). */
const atlasVerantwortlicher = [ATLAS_RECHTSDATEN.rechtstextName, ...atlasAnschrift].join(' · ')

/** Langform für Stellen, an denen die Klammer der Kurzform stören würde. */
const atlasVerantwortlicherLang = [ATLAS_RECHTSDATEN.rechtstextNameLang, ...atlasAnschrift].join(' · ')

/** VIDEKO und ATLAS haben denselben Rechtsträger. Das wird nicht verschleiert. */
const gleicherTraeger = ATLAS_RECHTSDATEN.firmierung === ACTIVE_OPERATOR.legalName

/**
 * Eine Zeile je Lostopf. Der Lostopfname steht vorn, damit unübersehbar
 * bleibt: das Hauptpreisfeld führt in genau einen dieser Töpfe.
 * Offene Angaben werden ausdrücklich als Lücke markiert.
 */
const hauptpreisZeilen = STADTFEST_HAUPTPREISE.map((preis) => {
  const kopf = `Lostopf ${preis.lostopf} — ${preis.anzahl} × ${preis.titel}`
  const text = preis.beschreibung ? `${kopf}: ${preis.beschreibung}` : kopf
  if (preis.offen.length === 0) return text
  const rest = `Noch nicht festgelegt: ${preis.offen.join(', ')}. ${FEHLT}`
  return preis.beschreibung ? `${text} ${rest}` : `${text} — ${rest}`
})

/**
 * Der Ziehungstermin. Das Wochenende ist verbindlich, der exakte Zeitpunkt
 * nicht — dann steht das Zeitfenster da, nicht eine erfundene Uhrzeit.
 */
const ziehungTermin = STADTFEST_ZIEHUNG.terminAt || STADTFEST_ZIEHUNG.zeitfensterText || FEHLT

/** Der Streamingkanal. Wird nicht erfunden; sonst greift der Bekanntgabesatz. */
const ziehungKanal = STADTFEST_ZIEHUNG.plattform
  ? [STADTFEST_ZIEHUNG.plattform, STADTFEST_ZIEHUNG.url].filter(Boolean).join(', ')
  : STADTFEST_ZIEHUNG.bekanntgabeText

/**
 * Teilnahmebedingungen.
 *
 * Aufbau als Liste aus { titel, absaetze }, damit dieselbe Struktur im
 * Bottom-Sheet der Seite und in einem späteren PDF/Aushang verwendbar bleibt.
 */
export const TEILNAHMEBEDINGUNGEN = {
  titel: 'Teilnahme- und Gewinnbedingungen',
  untertitel: `${STADTFEST_EVENT.name}`,
  stand: STADTFEST_EVENT.termsVersion,
  hinweis:
    'Für die Aktion am Aktionsstand gelten ausschließlich diese Teilnahme- und '
    + 'Gewinnbedingungen.',
  abschnitte: [
    {
      titel: '1. Veranstalter',
      absaetze: [
        `Veranstalterin des Gewinnspiels ist die ${veranstalter}.`,
        OPERATOR_NOTICE,
      ],
    },
    {
      titel: '2. Beteiligte Marken',
      absaetze: [
        `Das Gewinnspiel wird unter den Marken ${BRAND.name} und ${ATLAS_RECHTSDATEN.marke} `
        + 'durchgeführt.',
        gleicherTraeger
          ? `${ATLAS_RECHTSDATEN.marke} ist eine Marke derselben Genossenschaft. `
            + `Verantwortlich ist ${atlasVerantwortlicherLang}. Es findet daher keine `
            + 'Weitergabe von Teilnahmedaten an ein drittes Unternehmen statt.'
          : `Verantwortlich für ${ATLAS_RECHTSDATEN.marke}: ${atlasVerantwortlicher}.`,
        'Die Werbeeinwilligung wird als eine gemeinsame, freiwillige Einwilligung erhoben, die '
        + 'beide Marken und die Kanäle E-Mail und Telefon umfasst. Sie ist nicht Bestandteil '
        + 'dieser Teilnahmebedingungen, keine Voraussetzung für die Teilnahme und hat keinen '
        + 'Einfluss auf die Gewinnchance. Zum Nachweis werden Zeitpunkt, Wortlaut, Version und '
        + 'der Umfang der Einwilligung gespeichert.',
      ],
    },
    {
      titel: '3. Teilnahmezeitraum',
      absaetze: [
        `Die Aktion findet statt am ${zeitraumText()}.`,
        'Das Registrierungsformular auf dieser Seite kann auch vor und nach diesem Zeitraum '
        + 'ausgefüllt werden. Eine Teilnahme am Gewinnspiel entsteht dadurch nicht; sie ist '
        + 'ausschließlich innerhalb des Aktionszeitraums am Aktionsstand möglich.',
        STADTFEST_EVENT.zeitenBestaetigt
          ? 'Nach Ablauf des Zeitraums eingehende Teilnahmen werden nicht berücksichtigt.'
          : `Die Stand- und Aktionszeiten je Tag stehen noch nicht fest: ${FEHLT}. Maßgeblich `
            + 'sind die vor Ort ausgehängten Zeiten.',
      ],
    },
    {
      titel: '4. Teilnahme ist kostenlos',
      absaetze: [
        'Die Teilnahme am Gewinnspiel ist kostenlos. Es entstehen keine Kosten über die '
        + 'gegebenenfalls anfallenden Verbindungsentgelte des eigenen Internetzugangs hinaus.',
      ],
    },
    {
      titel: '5. Kein Kauf, keine Einwilligung erforderlich',
      absaetze: [
        'Die Teilnahme ist nicht vom Erwerb einer Ware oder Dienstleistung abhängig.',
        'Die Teilnahme ist außerdem nicht davon abhängig, ob eine Einwilligung in Werbung '
        + 'erteilt wird. Die Werbeeinwilligungen sind freiwillig und haben auf die '
        + 'Gewinnchance keinerlei Einfluss.',
      ],
    },
    {
      titel: '6. Teilnahmeberechtigung',
      absaetze: [
        STADTFEST_EVENT.minimumAge
          ? `Teilnahmeberechtigt sind natürliche Personen ab ${STADTFEST_EVENT.minimumAge} Jahren `
            + 'mit Wohnsitz in Deutschland.'
          : `Teilnahmealter: ${FEHLT}.`,
        'Mitarbeitende der Veranstalterin sowie deren Angehörige sind von der Teilnahme '
        + 'ausgeschlossen.',
      ],
    },
    {
      titel: '7. Einmalige Teilnahme',
      absaetze: [
        'Pro Person ist eine Registrierung und eine Teilnahme zulässig. Mehrfachregistrierungen '
        + 'unter derselben E-Mail-Adresse werden zu einem Datensatz zusammengeführt und nicht '
        + 'zusätzlich gewertet.',
      ],
    },
    {
      titel: '8. Registrierung und Teilnahme sind zweierlei',
      absaetze: [
        'Über das Formular auf dieser Seite erfolgt eine Registrierung. Erforderlich sind '
        + 'Vorname, Nachname, E-Mail-Adresse, Mobilnummer und Postleitzahl sowie die Bestätigung '
        + 'des Mindestalters und die Zustimmung zu diesen Teilnahmebedingungen und den '
        + 'Datenschutzhinweisen. Eine Anschrift und ein Geburtsdatum werden nicht erhoben.',
        'Das Absenden des Formulars allein begründet noch keine Teilnahme am Gewinnspiel. Die '
        + 'Registrierung dient dazu, den Ablauf am Aktionsstand zu beschleunigen.',
        'Nach dem Absenden wird auf dem Gerät eine Bestätigung mit einem Registrierungscode '
        + 'angezeigt. Dieser Code wird am Aktionsstand vorgezeigt.',
        'Mit dem Vorzeigen des Codes am Stand kann die Person direkt am Glücksrad teilnehmen. '
        + 'Ein weiterer Zwischenschritt ist nicht erforderlich.',
        'Die Teilnahme am Gewinnspiel entsteht dadurch, dass die Person während des '
        + 'Aktionszeitraums persönlich am Stand den Code zeigt und das Standpersonal die Drehung '
        + 'am Glücksrad bestätigt.',
      ],
    },
    {
      titel: '9. So funktioniert das Glücksrad',
      absaetze: [
        'Nach dem Vorzeigen des Codes wird direkt am physischen Glücksrad am Aktionsstand gedreht. '
        + 'Gedreht wird so lange, bis ein Sofortgewinn fällt.',
        'Die Drehung ist nur während der Aktionszeiten und nur persönlich am Stand möglich.',
        'Die Drehungen werden vom Standpersonal begleitet und bestätigt. Mit dieser Bestätigung '
        + 'gilt die Teilnahme am Gewinnspiel als erfolgt.',
        'Ist der Sofortgewinn gefallen, ist die Teilnahme am Glücksrad abgeschlossen. Eine '
        + 'weitere Teilnahmerunde ist danach ausgeschlossen.',
      ],
    },
    {
      titel: '10. Sofortgewinne',
      absaetze: [
        'Zeigt das Glücksrad ein Sofortgewinnfeld, erhält die teilnehmende Person den dort '
        + 'genannten Sofortgewinn. Er wird unmittelbar am Stand ausgegeben und ist damit '
        + 'erledigt.',
        'Als Sofortgewinne sind vorgesehen:',
        ...STADTFEST_SOFORTGEWINNE,
        ...SOFORTGEWINN_BEDINGUNGEN,
        'Sofortgewinne werden nicht einzeln dokumentiert. Ein Anspruch auf einen bestimmten '
        + 'Sofortgewinn besteht nicht; maßgeblich ist der am Stand vorhandene Bestand.',
      ],
    },
    {
      titel: `11. Feld ${STADTFEST_GEWINNMECHANIK.hauptpreisFeldName}: Qualifikation für einen Lostopf`,
      absaetze: [
        `Zeigt das Glücksrad ein Hauptpreisfeld (${STADTFEST_GEWINNMECHANIK.hauptpreisFeldName}), `
        + 'ist damit ausdrücklich KEIN Hauptpreis gewonnen.',
        'Es zählt ausschließlich das ERSTE Hauptpreisfeld. Es bedeutet allein: Qualifikation für '
        + 'den Lostopf des dort genannten Hauptpreises. Der Hauptpreis selbst ist damit noch '
        + 'nicht gewonnen; über ihn entscheidet erst die spätere Ziehung.',
        'Nach einem Hauptpreisfeld wird weitergedreht, bis ein Sofortgewinn fällt.',
        'Weitere Hauptpreisfelder zählen nicht zusätzlich. Eine Person kann nur einem einzigen '
        + 'Hauptpreis-Lostopf angehören.',
        'Sofortgewinn und Lostopf-Qualifikation schließen einander nicht aus: Eine Person kann '
        + 'zum Beispiel gleichzeitig im Lostopf „Spanndecke bis 20 m²" liegen und als '
        + 'Sofortgewinn ein „VIDEKO T-Shirt" erhalten haben.',
        'Die Qualifikation wird vom Standpersonal im geschützten internen System bestätigt. Ein '
        + 'zweites Formular ist dafür nicht auszufüllen.',
        'Ausschließlich so qualifizierte Teilnahmen nehmen an der Ziehung der Hauptpreise teil. '
        + 'Werbeeinwilligungen sind für die Aufnahme in einen Lostopf und für die Gewinnchance '
        + 'ohne jede Bedeutung.',
      ],
    },
    {
      titel: '12. Die Hauptpreise und die vier Lostöpfe',
      absaetze: [
        `Verlost werden insgesamt ${HAUPTPREISE_GESAMT} Hauptpreise in ${LOSTOEPFE_GESAMT} `
        + 'getrennten Lostöpfen:',
        ...hauptpreisZeilen,
        'Jedes Hauptpreisfeld am Glücksrad gehört zu genau einem dieser Lostöpfe. Wer das Feld '
        + 'trifft, liegt in diesem einen Lostopf — und nur dort.',
      ],
    },
    {
      titel: '13. Bedingungen der Küchengutscheine',
      absaetze: [
        'Für die Küchengutscheine gilt:',
        ...GUTSCHEIN_BEDINGUNGEN,
      ],
    },
    {
      titel: '14. Bedingungen der Spanndecke',
      absaetze: [
        'Für den Hauptpreis Spanndecke gilt:',
        ...SPANNDECKE_BEDINGUNGEN,
      ],
    },
    {
      titel: '15. Bedingungen des Wellnessaufenthalts',
      absaetze: [
        'Für den Hauptpreis Wellnessaufenthalt gilt:',
        ...WELLNESS_BEDINGUNGEN,
      ],
    },
    {
      titel: '16. Bedingungen des Goldgewinns',
      absaetze: [
        'Für den Hauptpreis Gold gilt:',
        ...GOLD_BEDINGUNGEN,
      ],
    },
    {
      titel: '17. Ziehung der Hauptpreise',
      absaetze: [
        'Die Hauptpreise werden nach dem Stadtfest in einer öffentlichen Online-Live-Ziehung '
        + 'verlost.',
        `Die Ziehung findet ${ziehungTermin} statt.`,
        ziehungKanal,
        'Jeder Lostopf wird getrennt gezogen: Gold zwei Gewinnerinnen oder Gewinner, '
        + 'Küchengutschein fünf, Spanndecke eine, Wellnessaufenthalt eine.',
        'Gezogen wird zufällig aus allen Teilnahmen, für die sowohl eine bestätigte Drehung am '
        + 'Glücksrad als auch eine bestätigte Lostopf-Qualifikation vorliegt. Eine bloße '
        + 'Registrierung über diese Seite nimmt an der Ziehung nicht teil. Eine Beeinflussung '
        + 'der Ziehung über die öffentliche Aktionsseite ist technisch nicht möglich.',
        `Eine Person kann insgesamt höchstens ${STADTFEST_ZIEHUNG.maxGewinneProPerson} Hauptpreis `
        + 'gewinnen.',
        'Jede Ziehung wird protokolliert: Lostopf, Preis, gezogene Teilnahme, Zeitpunkt und, '
        + 'falls neu gezogen wurde, der Grund.',
      ],
    },
    {
      titel: '18. Gewinnerbenachrichtigung',
      absaetze: [
        'Der Livestream ersetzt die persönliche Benachrichtigung nicht. Gewinnende Personen '
        + 'werden über die bei der Registrierung angegebenen Kontaktdaten benachrichtigt.',
        'Im Livestream und in sonstigen Veröffentlichungen werden keine vollständigen '
        + 'Kontaktdaten genannt. Genannt werden ausschließlich Vorname und erster Buchstabe des '
        + 'Nachnamens oder der Teilnahme-Code.',
        'Die bei der Registrierung angegebene Mobilnummer kann für die Abwicklung des Gewinns '
        + 'verwendet werden. Das ist ausdrücklich keine Einwilligung in Werbung; die Nummer wird '
        + 'für Werbung nur verwendet, wenn dafür gesondert eingewilligt wurde.',
        'Für die Übergabe oder Zustellung des Gewinns wird die Anschrift erst nach der '
        + 'Benachrichtigung gesondert erfragt. Bei der Teilnahme wird keine Anschrift erhoben.',
      ],
    },
    {
      titel: '19. Rückmeldefrist und Ersatzziehung',
      absaetze: [
        `Auf die Benachrichtigung ist innerhalb von ${STADTFEST_ZIEHUNG.annahmefristTage} `
        + 'Kalendertagen zurückzumelden.',
        'Erfolgt innerhalb dieser Frist keine Rückmeldung, kann der Preis dokumentiert aus '
        + 'demselben Lostopf nachgezogen werden.',
        'Dasselbe gilt, wenn die angegebenen Kontaktdaten bewusst falsch oder trotz eines '
        + 'angemessenen Versuchs nicht nutzbar sind.',
      ],
    },
    {
      titel: '20. Ausschluss bei Missbrauch',
      absaetze: [
        'Die Veranstalterin kann Personen von der Teilnahme ausschließen bei nachweislicher '
        + 'Mehrfachteilnahme, Manipulation, vorsätzlich falschen Angaben, Umgehung technischer '
        + 'Schutzmaßnahmen oder sonstigem Missbrauch.',
      ],
    },
    {
      titel: '21. Keine Barauszahlung',
      absaetze: [
        'Eine Barauszahlung, ein Umtausch oder eine Übertragung des Gewinns auf Dritte ist '
        + 'nicht möglich.',
      ],
    },
    {
      titel: '22. Rechtsweg',
      absaetze: [
        'Der Rechtsweg ist ausgeschlossen.',
      ],
    },
    {
      titel: '23. Datenschutz',
      absaetze: [
        'Welche Daten zu welchem Zweck verarbeitet werden, steht in den Datenschutzhinweisen '
        + 'zu dieser Aktion sowie in der allgemeinen Datenschutzerklärung dieser Website. Beide '
        + 'sind auf dieser Seite direkt verlinkt.',
      ],
    },
    {
      titel: '24. Vorzeitige Beendigung',
      absaetze: [
        'Die Veranstalterin behält sich vor, das Gewinnspiel aus wichtigem Grund abzubrechen '
        + 'oder zu beenden, insbesondere wenn ein ordnungsgemäßer Ablauf nicht gewährleistet '
        + 'werden kann. Bereits entstandene Ansprüche bleiben davon unberührt.',
      ],
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Kurz-Spielregeln und Aushang                                        */
/* ------------------------------------------------------------------ */

/**
 * Die sieben Kurz-Spielregeln (§15 der Vorgabe). Eine einzige Quelle für den
 * sichtbaren Block auf /stadtfest und für die Bedingungenseite — damit der
 * Wortlaut nicht an zwei Stellen auseinanderläuft.
 */
export const SPIELREGELN_KURZ = {
  titel: 'So funktioniert das Glücksrad',
  schritte: [
    'Code holen.',
    'Code am Stand zeigen.',
    'Drehen.',
    'Das erste Hauptpreisfeld qualifiziert dich für den entsprechenden Lostopf.',
    'Das Hauptpreisfeld ist noch KEIN direkter Hauptpreisgewinn.',
    'Danach weiterdrehen bis zum Sofortgewinn.',
    'Weitere Hauptpreisfelder zählen nicht zusätzlich.',
  ],
  fuss: 'Teilnahme ab 18 Jahren · kostenlos · kein Kauf erforderlich',
  linkText: 'Vollständige Teilnahme- und Gewinnbedingungen',
}

/**
 * Der druckfähige Kurzblock für den A4-Aushang am Stand (§19 der Vorgabe).
 * Steht ganz oben auf der Bedingungenseite und ist per Print-CSS allein
 * druckbar.
 */
export const AUSHANG_KURZBLOCK = {
  titel: 'Hauptpreisfeld getroffen?',
  zeilen: [
    'Das erste Hauptpreisfeld qualifiziert dich für den entsprechenden Hauptpreis-Lostopf.',
    'Es bedeutet noch KEINEN direkten Gewinn des Hauptpreises.',
    'Danach weiterdrehen bis zu deinem Sofortgewinn.',
    'Weitere Hauptpreisfelder zählen nicht zusätzlich.',
    'Teilnahme ab 18 Jahren.',
    'Kein Kauf erforderlich.',
    'Es gelten die vollständigen Teilnahme- und Gewinnbedingungen.',
  ],
}

/**
 * Eventspezifische Datenschutzhinweise.
 *
 * Bewusst in klar getrennte Blöcke aufgeteilt:
 *   A) Durchführung des Gewinnspiels — ohne jeden Werbezweck
 *   B) freiwillige Werbeeinwilligung VIDEKO Küchen
 *   C) freiwillige Werbeeinwilligung ATLAS Wealth
 *   D) Gewinnabwicklung — strikt getrennt von Werbung
 */
export const DATENSCHUTZ_EVENT = {
  titel: 'Datenschutzhinweise zur Aktion',
  stand: STADTFEST_EVENT.privacyVersion,
  hinweis:
    'Ergänzt die allgemeine Datenschutzerklärung der Website, ersetzt sie nicht.',
  abschnitte: [
    {
      titel: 'Verantwortliche',
      absaetze: [
        `Für die Durchführung des Gewinnspiels verantwortlich ist die ${veranstalter}.`,
        `Datenschutzkontakt für die Marke ${ATLAS_RECHTSDATEN.marke}: ${ATLAS_RECHTSDATEN.datenschutzEmail}.`,
        `Benannte Datenschutzbeauftragte: ${FEHLT}.`,
      ],
    },
    {
      titel: 'A) Registrierung und Durchführung des Gewinnspiels',
      absaetze: [
        'Verarbeitete Daten der Registrierung: Vorname, Nachname, E-Mail-Adresse, Mobilnummer '
        + 'und Postleitzahl als Pflichtangaben, freiwillig angegebene Interessen, Zeitpunkt der '
        + 'Registrierung, ob die Registrierung vor, während oder nach dem Stadtfest erfolgt ist, '
        + 'gegebenenfalls die Bestätigung der Teilnahmebedingungen sowie ein technischer '
        + 'Registrierungscode.',
        'Findet die Registrierung nach dem Stadtfest statt, werden keine Bestätigung der '
        + 'Teilnahmebedingungen und keine Altersbestätigung erhoben, weil dann kein Gewinnspiel '
        + 'mehr stattfindet.',
        'Zusätzlich wird für Personen, die am Aktionsstand waren, gespeichert: die Bestätigung '
        + 'des am Stand vorgezeigten Codes, die bestätigte Drehung am Glücksrad und, falls am Glücksrad das Feld '
        + 'HAUPTPREIS erreicht wurde, die Qualifikation für die Verlosung — jeweils mit '
        + 'Zeitpunkt und bestätigender Person. Diese Angaben werden ausschließlich vom '
        + 'Standpersonal im geschützten internen System gesetzt, nie über die öffentliche '
        + 'Aktionsseite. Einzelne Sofortgewinne werden nicht gespeichert.',
        'Zweck: Registrierung und Beschleunigung des Ablaufs am Stand, Durchführung des '
        + 'Gewinnspiels, Vermeidung von Mehrfachteilnahmen, Nachweis der Teilnahme am '
        + 'Aktionsstand, Ermittlung der Hauptpreis-Teilnahmen sowie Durchführung und '
        + 'Protokollierung der Verlosung.',
        'Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Durchführung des Teilnahmeverhältnisses) '
        + 'sowie Art. 6 Abs. 1 lit. f DSGVO für die Abwehr von Missbrauch (dazu wird ein '
        + 'gekürzter, nicht rückrechenbarer Prüfwert der IP-Adresse gespeichert).',
        'Speicherdauer: bis zum Abschluss der Aktion einschließlich Verlosung und Gewinnabwicklung '
        + `sowie Ablauf etwaiger Nachweis- und Verjährungsfristen. Konkrete Frist: ${FEHLT}.`,
        'Für diesen Teil A wird ausdrücklich keine Werbung versendet. Die Teilnahme ist '
        + 'unabhängig von jeder Werbeeinwilligung.',
      ],
    },
    {
      titel: `B) Freiwillige Werbeeinwilligung ${BRAND.name}`,
      absaetze: [
        'Im Formular gibt es dafür genau ein freiwilliges Häkchen. Es umfasst beide Marken und '
        + 'die Kanäle E-Mail und Telefon; ohne dieses Häkchen erfolgt keine Werbung.',
        `Nur wenn das Häkchen gesetzt wurde: Die ${ACTIVE_OPERATOR.legalName} verarbeitet Name, `
        + `E-Mail-Adresse und Mobilnummer, um über Angebote und Aktionen der Marke `
        + `${BRAND.name} zu informieren.`,
        'Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO, für Telefonwerbung zusätzlich § 7 Abs. 2 '
        + 'Nr. 1 UWG.',
        'Die Einwilligung ist freiwillig und jederzeit mit Wirkung für die Zukunft widerrufbar, '
        + `formlos an ${BRAND.contactEmail}. Die Rechtmäßigkeit der bis zum Widerruf erfolgten `
        + 'Verarbeitung bleibt unberührt.',
        'Gespeichert werden zum Nachweis der Einwilligung: Zeitpunkt, umfasste Marken und '
        + 'Kanäle, Wortlaut und Version des Einwilligungstextes.',
        'Diese Einwilligung hat keinen Einfluss auf die Teilnahme und keinen Einfluss auf die '
        + 'Gewinnchance.',
      ],
    },
    {
      titel: `C) Freiwillige Werbeeinwilligung ${ATLAS_RECHTSDATEN.marke}`,
      absaetze: [
        `Verantwortlich: ${atlasVerantwortlicher}.`,
        `${ATLAS_RECHTSDATEN.marke} ist eine Marke der Genossenschaft ${ATLAS_RECHTSDATEN.firmierung}. `
        + 'Eine eigenständige Genossenschaft „Atlas Wealth eG" besteht nicht.',
        'Nur wenn das gemeinsame freiwillige Häkchen gesetzt wurde, werden Name, E-Mail-Adresse '
        + `und Mobilnummer verwendet, um über Angebote von ${ATLAS_RECHTSDATEN.marke} aus den `
        + 'Bereichen Immobilie, Vorsorge und Finanzen zu informieren.',
        'Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO, für Telefonwerbung zusätzlich § 7 Abs. 2 '
        + 'Nr. 1 UWG.',
        `Vermittlerstatus: ${ATLAS_RECHTSDATEN.vermittlerstatus}, Registrierungsnummer `
        + `${ATLAS_RECHTSDATEN.vermittlerRegisterNummer}.`,
        `Ohne dieses Häkchen erfolgt keine Werbung unter der Marke ${ATLAS_RECHTSDATEN.marke}.`,
        'Die Einwilligung ist freiwillig und jederzeit mit Wirkung für die Zukunft widerrufbar, '
        + `formlos an ${ATLAS_RECHTSDATEN.email}.`,
        'Diese Einwilligung hat keinen Einfluss auf die Teilnahme und keinen Einfluss auf die '
        + 'Gewinnchance.',
      ],
    },
    {
      titel: 'D) Gewinnabwicklung',
      absaetze: [
        'Im Gewinnfall werden E-Mail-Adresse und Mobilnummer verwendet, um die gewinnende Person '
        + 'zu benachrichtigen und den Gewinn abzuwickeln.',
        'Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Das ist keine Werbeeinwilligung. Eine '
        + 'Verwendung dieser Kontaktdaten für Werbung erfolgt nur bei gesonderter Einwilligung '
        + 'nach B) oder C).',
        'Für die Übergabe oder Zustellung eines Gewinns kann eine Anschrift erforderlich sein. '
        + 'Sie wird erst im Gewinnfall gesondert erhoben.',
      ],
    },
    {
      titel: 'Empfänger und Auftragsverarbeiter',
      absaetze: [
        'Die Teilnahmedaten werden in einer Datenbank innerhalb der EU gespeichert; der '
        + 'Hostingdienstleister ist als Auftragsverarbeiter gebunden.',
        `Eingesetzte Auftragsverarbeiter im Einzelnen: ${FEHLT}.`,
        'Eine Übermittlung an Dritte außerhalb dieser Auftragsverarbeitung findet nicht statt.',
      ],
    },
    {
      titel: 'Deine Rechte',
      absaetze: [
        'Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch '
        + 'sowie das Recht auf Beschwerde bei einer Aufsichtsbehörde.',
        `Kontakt: ${BRAND.contactEmail}. Ausführlich beschrieben in der allgemeinen `
        + 'Datenschutzerklärung dieser Website.',
      ],
    },
  ],
}

/**
 * Alle noch offenen verbindlichen Angaben — maschinell aus den Texten
 * gezogen, damit die Liste im Bericht nicht von Hand gepflegt werden muss.
 */
export function offeneAngaben() {
  const treffer = []
  for (const doc of [TEILNAHMEBEDINGUNGEN, DATENSCHUTZ_EVENT]) {
    for (const abschnitt of doc.abschnitte) {
      for (const absatz of abschnitt.absaetze) {
        if (absatz.includes(FEHLT)) treffer.push(`${doc.titel} · ${abschnitt.titel}`)
      }
    }
  }
  return [...new Set(treffer)]
}
