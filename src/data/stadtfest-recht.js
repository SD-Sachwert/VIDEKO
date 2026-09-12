/**
 * Rechtstexte der Stadtfest-Aktionsseite: Teilnahmebedingungen und
 * eventspezifische Datenschutzhinweise.
 *
 * ======================================================================
 * ENTWURF — NOCH NICHT RECHTLICH GEPRÜFT.
 * ----------------------------------------------------------------------
 * Diese Texte sind ein Arbeitsentwurf. Sie müssen vor dem produktiven
 * Start juristisch geprüft und freigegeben werden. Alle Stellen, an denen
 * eine verbindliche Angabe fehlt, sind mit FEHLT markiert und werden im
 * Text sichtbar als Lücke ausgegeben — bewusst, damit niemand einen
 * unfertigen Stand für fertig hält. Es wurden KEINE wirtschaftlichen
 * Bedingungen (Werte, Fristen, Termine, Streamingkanäle) erfunden.
 * ======================================================================
 *
 * Die Gewinnmechanik ist zweistufig und muss es an jeder Stelle bleiben:
 *   Sofortgewinn  = wird am Stand ausgegeben, ist sofort erledigt.
 *   Hauptpreisfeld = qualifiziert NUR für die spätere Verlosung.
 * Der Satz „Du hast den Hauptpreis gewonnen." darf nirgends entstehen.
 *
 * Alles Unternehmensbezogene kommt aus data/company.js (Single Source of
 * Truth), alles Eventbezogene aus data/stadtfest.js.
 */
import { ACTIVE_OPERATOR, BRAND, OPERATOR_NOTICE } from './company.js'
import {
  ATLAS_RECHTSDATEN,
  GUTSCHEIN_BEDINGUNGEN,
  HAUPTPREISE_GESAMT,
  STADTFEST_EVENT,
  STADTFEST_GEWINNMECHANIK,
  STADTFEST_HAUPTPREISE,
  STADTFEST_ZIEHUNG,
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

/** Eine Zeile je Hauptpreis, offene Angaben ausdrücklich als Lücke markiert. */
const hauptpreisZeilen = STADTFEST_HAUPTPREISE.map((preis) => {
  const kopf = `${preis.anzahl} × ${preis.titel}`
  const text = preis.beschreibung ? `${kopf}: ${preis.beschreibung}` : kopf
  if (preis.offen.length === 0) return text
  const rest = `Noch nicht festgelegt: ${preis.offen.join(', ')}. ${FEHLT}`
  return preis.beschreibung ? `${text} ${rest}` : `${text} — ${rest}`
})

const ziehungTermin = STADTFEST_ZIEHUNG.terminAt || FEHLT
const ziehungKanal = STADTFEST_ZIEHUNG.plattform
  ? [STADTFEST_ZIEHUNG.plattform, STADTFEST_ZIEHUNG.url].filter(Boolean).join(', ')
  : FEHLT

/**
 * Teilnahmebedingungen.
 *
 * Aufbau als Liste aus { titel, absaetze }, damit dieselbe Struktur im
 * Bottom-Sheet der Seite und in einem späteren PDF/Aushang verwendbar bleibt.
 */
export const TEILNAHMEBEDINGUNGEN = {
  titel: 'Teilnahmebedingungen',
  stand: STADTFEST_EVENT.termsVersion,
  hinweis:
    'Entwurfsfassung. Vor dem Aktionsstart rechtlich zu prüfen. Mit '
    + `„${FEHLT}" markierte Stellen sind noch offen.`,
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
        'Die Werbeeinwilligungen für die beiden Marken werden dennoch getrennt erhoben, weil es '
        + 'sich um unterschiedliche Werbezwecke handelt. Beide sind freiwillig und für die '
        + 'Teilnahme ohne Bedeutung.',
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
        + 'Vorname, Nachname und E-Mail-Adresse sowie die Zustimmung zu diesen '
        + 'Teilnahmebedingungen.',
        'Das Absenden des Formulars allein begründet noch keine Teilnahme am Gewinnspiel. Die '
        + 'Registrierung dient dazu, den Ablauf am Aktionsstand zu beschleunigen.',
        'Nach dem Absenden wird auf dem Gerät eine Bestätigung mit einem Registrierungscode '
        + 'angezeigt. Dieser Code wird am Aktionsstand vorgezeigt.',
        'Gegen Vorzeigen des Codes wird am Stand ein Stempel vergeben. Die Ausgabe des Stempels '
        + 'wird vom Standpersonal im internen System bestätigt.',
        'Die Teilnahme am Gewinnspiel entsteht erst dadurch, dass die Person während des '
        + 'Aktionszeitraums persönlich am Stand ist und das Standpersonal die Drehung am '
        + 'Glücksrad bestätigt.',
      ],
    },
    {
      titel: '9. Eine Drehung am Glücksrad',
      absaetze: [
        `Jede gültige Registrierung berechtigt vor Ort zu genau ${STADTFEST_GEWINNMECHANIK.drehungenProTeilnahme} `
        + 'Drehung am Glücksrad am Aktionsstand.',
        'Die Drehung ist nur während der Aktionszeiten und nur persönlich am Stand möglich.',
        'Die Drehung wird vom Standpersonal bestätigt und dabei einmalig festgehalten. Mit '
        + 'dieser Bestätigung gilt die Teilnahme am Gewinnspiel als erfolgt. Eine zweite '
        + 'reguläre Drehung ist danach ausgeschlossen.',
      ],
    },
    {
      titel: '10. Sofortgewinne',
      absaetze: [
        'Zeigt das Glücksrad ein normales Gewinnfeld, erhält die teilnehmende Person einen '
        + 'Sofortgewinn. Der Sofortgewinn wird unmittelbar am Stand ausgegeben und ist damit '
        + 'erledigt.',
        'Sofortgewinne werden nicht einzeln dokumentiert. Ein Anspruch auf einen bestimmten '
        + 'Sofortgewinn besteht nicht; maßgeblich ist der am Stand vorhandene Bestand.',
      ],
    },
    {
      titel: '11. Feld HAUPTPREIS: Qualifikation für die Verlosung',
      absaetze: [
        `Zeigt das Glücksrad das Feld ${STADTFEST_GEWINNMECHANIK.hauptpreisFeldName}, ist damit `
        + 'ausdrücklich KEIN Hauptpreis gewonnen.',
        'Die teilnehmende Person qualifiziert sich in diesem Fall ausschließlich für die '
        + 'Verlosung der Hauptpreise. Die Qualifikation wird vom Standpersonal im geschützten '
        + 'internen System bestätigt. Ein zweites Formular ist dafür nicht auszufüllen.',
        'Die Qualifikation ist je Teilnahme nur einmal möglich.',
        'Ausschließlich so qualifizierte Teilnahmen nehmen an der Verlosung der Hauptpreise '
        + 'teil. Werbeeinwilligungen sind für die Aufnahme in die Verlosung und für die '
        + 'Gewinnchance ohne jede Bedeutung.',
      ],
    },
    {
      titel: '12. Die Hauptpreise',
      absaetze: [
        `Verlost werden insgesamt ${HAUPTPREISE_GESAMT} Hauptpreise:`,
        ...hauptpreisZeilen,
        'Für die noch nicht festgelegten Angaben gilt: Sie werden vor dem Aktionsstart ergänzt. '
        + 'Bis dahin besteht insoweit kein Anspruch auf einen bestimmten Leistungsumfang.',
      ],
    },
    {
      titel: '13. Bedingungen der Küchengutscheine',
      absaetze: [
        'Für die Küchengutscheine gilt:',
        ...GUTSCHEIN_BEDINGUNGEN,
        `Einlösefrist: ${FEHLT}.`,
      ],
    },
    {
      titel: '14. Verlosung der Hauptpreise',
      absaetze: [
        'Die Hauptpreise werden nach dem Stadtfest in einer öffentlichen Online-Live-Ziehung '
        + 'verlost.',
        `Termin und Uhrzeit der Ziehung: ${ziehungTermin}.`,
        `Streamingkanal: ${ziehungKanal}.`,
        'Gezogen wird zufällig aus allen Teilnahmen, für die sowohl eine bestätigte Drehung am '
        + 'Glücksrad als auch eine bestätigte Hauptpreis-Qualifikation vorliegt. Eine bloße '
        + 'Registrierung über diese Seite nimmt an der Verlosung nicht teil. Eine Beeinflussung '
        + 'der Ziehung über die öffentliche Aktionsseite ist technisch nicht möglich.',
        STADTFEST_ZIEHUNG.regelBestaetigt
          ? `Eine Person kann höchstens ${STADTFEST_ZIEHUNG.maxGewinneProPerson} Hauptpreis `
            + 'gewinnen. Wird eine bereits gezogene Person erneut gezogen, wird die Ziehung für '
            + 'diesen Preis wiederholt.'
          : `Vorgesehen ist: Eine Person kann höchstens ${STADTFEST_ZIEHUNG.maxGewinneProPerson} `
            + 'Hauptpreis gewinnen; bei erneuter Ziehung derselben Person wird für diesen Preis '
            + `neu gezogen. Diese Regel ist noch zu bestätigen: ${FEHLT}.`,
        'Jede Ziehung wird protokolliert: Preis, gezogene Teilnahme, Zeitpunkt und, falls neu '
        + 'gezogen wurde, der Grund.',
      ],
    },
    {
      titel: '15. Gewinnerbenachrichtigung',
      absaetze: [
        'Der Livestream ersetzt die persönliche Benachrichtigung nicht. Gewinnende Personen '
        + 'werden zusätzlich an die bei der Teilnahme angegebene E-Mail-Adresse benachrichtigt.',
        'Wurde eine Mobilnummer angegeben, kann diese für die Abwicklung des Gewinns verwendet '
        + 'werden. Das ist ausdrücklich keine Einwilligung in Werbung; die Nummer wird für '
        + 'Werbung nur verwendet, wenn dafür gesondert eingewilligt wurde.',
        'Für die Übergabe oder Zustellung des Gewinns wird die Anschrift erst nach der '
        + 'Benachrichtigung gesondert erfragt. Bei der Teilnahme wird keine Anschrift erhoben.',
      ],
    },
    {
      titel: '16. Annahmefrist und Nachziehung',
      absaetze: [
        `Der Gewinn ist innerhalb von ${STADTFEST_ZIEHUNG.annahmefristTage} Tagen nach der `
        + 'Benachrichtigung anzunehmen.',
        'Erfolgt innerhalb dieser Frist keine Reaktion, verfällt der Anspruch. Der Preis wird '
        + 'in diesem Fall dokumentiert nachgezogen.',
      ],
    },
    {
      titel: '17. Ausschluss bei Manipulation',
      absaetze: [
        'Die Veranstalterin kann Personen von der Teilnahme ausschließen, die sich unlauterer '
        + 'Hilfsmittel bedienen, falsche Angaben machen oder sich anderweitig Vorteile '
        + 'verschaffen. Bereits erfolgte Teilnahmen und Qualifikationen können in diesem Fall '
        + 'nachträglich gestrichen werden.',
      ],
    },
    {
      titel: '18. Keine Barauszahlung',
      absaetze: [
        'Eine Barauszahlung, ein Umtausch oder eine Übertragung des Gewinns auf Dritte ist '
        + 'nicht möglich.',
      ],
    },
    {
      titel: '19. Rechtsweg',
      absaetze: [
        'Der Rechtsweg ist ausgeschlossen.',
      ],
    },
    {
      titel: '20. Datenschutz',
      absaetze: [
        'Welche Daten zu welchem Zweck verarbeitet werden, steht in den Datenschutzhinweisen '
        + 'zu dieser Aktion. Diese sind auf dieser Seite direkt abrufbar.',
      ],
    },
    {
      titel: '21. Vorzeitige Beendigung',
      absaetze: [
        'Die Veranstalterin behält sich vor, das Gewinnspiel aus wichtigem Grund abzubrechen '
        + 'oder zu beenden, insbesondere wenn ein ordnungsgemäßer Ablauf nicht gewährleistet '
        + 'werden kann.',
      ],
    },
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
    'Entwurfsfassung. Ergänzt die allgemeine Datenschutzerklärung der Website, '
    + 'ersetzt sie nicht.',
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
        'Verarbeitete Daten der Registrierung: Vorname, Nachname, E-Mail-Adresse, freiwillig '
        + 'Mobilnummer und Postleitzahl, freiwillig angegebene Interessen, Zeitpunkt der '
        + 'Registrierung, ob die Registrierung vor, während oder nach dem Stadtfest erfolgt ist, '
        + 'gegebenenfalls die Bestätigung der Teilnahmebedingungen sowie ein technischer '
        + 'Registrierungscode.',
        'Findet die Registrierung nach dem Stadtfest statt, werden keine Bestätigung der '
        + 'Teilnahmebedingungen und keine Altersbestätigung erhoben, weil dann kein Gewinnspiel '
        + 'mehr stattfindet.',
        'Zusätzlich wird für Personen, die am Aktionsstand waren, gespeichert: die Ausgabe des '
        + 'Stempels, die bestätigte Drehung am Glücksrad und, falls am Glücksrad das Feld '
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
        `Nur wenn das entsprechende Häkchen gesetzt und mindestens ein Kanal gewählt wurde: Die `
        + `${ACTIVE_OPERATOR.legalName} verarbeitet Name, E-Mail-Adresse und – sofern angegeben `
        + `und für den Kanal Telefon eingewilligt – die Mobilnummer, um über Angebote und `
        + `Aktionen der Marke ${BRAND.name} zu informieren.`,
        'Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO, für Telefonwerbung zusätzlich § 7 Abs. 2 '
        + 'Nr. 1 UWG.',
        'Die Einwilligung ist freiwillig und jederzeit mit Wirkung für die Zukunft widerrufbar, '
        + `formlos an ${BRAND.contactEmail}. Die Rechtmäßigkeit der bis zum Widerruf erfolgten `
        + 'Verarbeitung bleibt unberührt.',
        'Gespeichert werden zum Nachweis der Einwilligung: Zeitpunkt, gewählter Kanal, '
        + 'Wortlaut und Version des Einwilligungstextes.',
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
        'Nur wenn das entsprechende Häkchen gesetzt und mindestens ein Kanal gewählt wurde, '
        + 'werden Name, E-Mail-Adresse und – sofern angegeben und für den Kanal Telefon '
        + `eingewilligt – die Mobilnummer verwendet, um über Angebote von `
        + `${ATLAS_RECHTSDATEN.marke} aus den Bereichen Immobilie, Vorsorge und Finanzen zu `
        + 'informieren.',
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
        'Im Gewinnfall werden E-Mail-Adresse und – sofern angegeben – Mobilnummer verwendet, um '
        + 'die gewinnende Person zu benachrichtigen und den Gewinn abzuwickeln.',
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
