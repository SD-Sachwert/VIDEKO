import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { ACTIVE_OPERATOR, BRAND } from '../data/company.js'

/**
 * AGB der VIDEKO Kuechen eG.
 *
 * Grundlage: Vertragspaket des ersten Kuechenauftrags (Mai 2026, damals noch
 * unter der Solid Value eG), ueberarbeitet am 08.10.2026:
 *   - Vertragspartnerin, Erfuellungsort und Gerichtsstand aus ACTIVE_OPERATOR
 *     (VIDEKO Kuechen eG, Wuerzburg) statt fest verdrahtet,
 *   - Schriftform -> Textform (§ 309 Nr. 13 BGB),
 *   - Haftungsklausel vollstaendig (§ 309 Nr. 7 BGB),
 *   - Hinweis auf die abgeschaltete EU-OS-Plattform entfernt,
 *   - veralteter Verweis auf das Abzahlungsgesetz entfernt,
 *   - Abholung / Lieferung ohne Montage und Elektrogeraete ergaenzt,
 *   - Teil C fuer den Merch-Shop (Anfragemodell) ergaenzt.
 *
 * Vorgaben Heiko 08.10.2026: Zahlung 50/40/10 (Abweichung nur im Kaufvertrag),
 * Stornopauschalen 20/30/40 % bleiben, Ruecksendekosten (Shop) traegt der Kunde.
 */
const op = ACTIVE_OPERATOR
const ANSCHRIFT = `${op.legalName}, ${op.street}, ${op.postalCode} ${op.city}`

export default function AGB() {
  return (
    <section className="section section--light legal-page">
      <div className="container">
        <Reveal className="legal-head">
          <span className="kicker kicker--gold">Rechtliches</span>
          <h1 className="legal-head__title">Allgemeine Geschäftsbedingungen</h1>
        </Reveal>

        <Reveal className="legal legal--doc">
          <p className="legal__lead">
            {op.legalName} · {BRAND.name} — Stand: Oktober 2026
          </p>

          <h2>Teil A — Allgemeines</h2>

          <h3>§ 1 Geltungsbereich und Vertragspartner</h3>
          <p>
            Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge über die Lieferung, die
            Abholung und die Montage von Küchen, Küchenteilen, Elektrogeräten und
            Einrichtungsgegenständen sowie für Bestellungen aus dem {BRAND.name} Merch-Shop.
            Vertragspartner ist die {ANSCHRIFT}, eingetragen im {op.registerType} des{' '}
            {op.registerCourt} unter {op.registerNumber} (im Folgenden „Verkäufer“).
          </p>
          <p>
            Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt,
            die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit
            zugerechnet werden können (§ 13 BGB). Abweichende Bedingungen des Käufers gelten nur,
            wenn der Verkäufer ihnen ausdrücklich in Textform zustimmt. Individuelle Vereinbarungen
            im Kaufvertrag haben Vorrang vor diesen Bedingungen.
          </p>

          <h3>§ 2 Vertragsschluss</h3>
          <p>
            Darstellungen auf der Website, in Prospekten und im Studio sind unverbindlich. Ein
            Vertrag kommt zustande, wenn der Käufer den Kaufvertrag bzw. das Angebot des Verkäufers
            unterschreibt oder in Textform annimmt – im Studio, bei einem Termin vor Ort oder nach
            Zusendung der Vertragsunterlagen. Der Käufer erhält den Vertragstext mit allen Anlagen
            in Textform; der Verkäufer speichert ihn.
          </p>

          <h2>Teil B — Küchen und Einrichtung</h2>

          <h3>§ 3 Planung, Aufmaß und Änderungen</h3>
          <p>
            Grundlage der Fertigung sind die Planung und das Aufmaß. Findet das Aufmaß in einem
            Rohbau statt, werden 1,5 cm Putzstärke zuzüglich gegebenenfalls der Fliesenstärke
            eingerechnet. Der Käufer sorgt dafür, dass diese Werte nicht überschritten werden, und
            teilt Abweichungen unverzüglich mit. Ein erneutes Aufmaß wegen baulicher Veränderungen
            nach dem Aufmaß wird nach Aufwand berechnet. Nimmt der Käufer das Aufmaß selbst vor
            oder liefert er die Maße, trägt er das Risiko ihrer Richtigkeit.
          </p>
          <p>
            Serienmäßig hergestellte Möbel werden nach Muster oder Abbildung verkauft. Ein Anspruch
            auf Lieferung von Ausstellungsstücken besteht nur bei ausdrücklicher Vereinbarung.
            Handelsübliche und zumutbare Abweichungen in Farbe und Maserung, insbesondere bei Holz,
            Naturstein, Keramik und Glas, bleiben vorbehalten, soweit sie den vereinbarten
            Gebrauch nicht beeinträchtigen.
          </p>

          <h3>§ 4 Lieferfrist</h3>
          <p>
            Kann der Verkäufer eine vereinbarte Lieferfrist nicht einhalten, setzt ihm der Käufer
            eine angemessene Nachfrist. Nach deren erfolglosem Ablauf kann der Käufer vom Vertrag
            zurücktreten. Vom Verkäufer nicht zu vertretende Störungen, etwa bei Vorlieferanten
            oder durch höhere Gewalt, verlängern die Lieferfrist um die Dauer der Störung; der
            Verkäufer informiert den Käufer darüber unverzüglich. Ansprüche auf Schadensersatz
            richten sich nach § 12.
          </p>

          <h3>§ 5 Montage</h3>
          <p>
            Ist die Montage vereinbart, stellt der Käufer sicher, dass die Räume zum vereinbarten
            Termin montagereif sind. Strom-, Wasser- und Abluftanschlüsse sind bauseits bis zum
            Übergabepunkt herzustellen. Hat der Verkäufer Bedenken gegen die Eignung von Wänden
            oder Decken zur Befestigung, teilt er dies dem Käufer unverzüglich mit.
          </p>
          <p>
            Elektro- und Wasseranschlüsse, die über den Anschluss der gelieferten Geräte an
            vorhandene Anschlussstellen hinausgehen, sind nur geschuldet, wenn sie vereinbart
            sind, und werden durch zugelassene Fachbetriebe ausgeführt. Mitarbeiter und
            Nachunternehmer des Verkäufers dürfen keine Arbeiten übernehmen, die über die
            vereinbarte Leistung hinausgehen. Der Verkäufer darf geeignete Nachunternehmer
            einsetzen.
          </p>
          <p>
            Vom Käufer gestellte Geräte, Spülen oder Zubehör werden nur montiert, wenn dies
            vereinbart ist und sie vollständig, unbeschädigt und für den Einbau geeignet sind.
            Für deren Funktion haftet der Verkäufer nicht.
          </p>

          <h3>§ 6 Lieferung ohne Montage und Abholung</h3>
          <p>
            Ist keine Montage vereinbart, schuldet der Verkäufer nur die Lieferung bzw. die
            Bereitstellung der Ware. Bei Abholung stellt der Verkäufer die Ware zum vereinbarten
            Termin in seinem Lager bzw. Studio bereit; der Käufer sorgt für ein geeignetes
            Fahrzeug und ausreichende Ladehilfe. Bei Lieferung ohne Montage wird die Ware bis
            hinter die erste verschließbare Tür an der Lieferanschrift gebracht, sofern nichts
            anderes vereinbart ist.
          </p>
          <p>
            Der Käufer prüft die Ware bei der Übergabe auf Vollständigkeit und sichtbare
            Transportschäden und vermerkt Beanstandungen möglichst im Lieferschein; seine
            gesetzlichen Mängelrechte bleiben davon unberührt. Für Schäden und Funktionsmängel,
            die durch unsachgemäßen Aufbau oder Anschluss durch den Käufer oder von ihm
            beauftragte Dritte entstehen, haftet der Verkäufer nicht. Elektro-, Gas- und
            Wasseranschlüsse dürfen nur von zugelassenen Fachbetrieben ausgeführt werden.
          </p>

          <h3>§ 7 Zahlung</h3>
          <p>Sofern im Kaufvertrag nichts anderes vereinbart ist, ist der Kaufpreis wie folgt fällig:</p>
          <ul>
            <li>50 % bei Auftragserteilung,</li>
            <li>40 % vor Auslieferung, Abholung bzw. Beginn der Montage,</li>
            <li>10 % nach Fertigstellung und Übergabe der montierten Küche; ohne Montage mit der Auslieferung bzw. Abholung.</li>
          </ul>
          <p>
            Abweichende Zahlungsbedingungen werden im Kaufvertrag festgehalten. Rechnungen sind
            innerhalb von 10 Tagen nach Rechnungsdatum ohne Abzug zu zahlen. Der Käufer kann nur
            mit unbestrittenen oder rechtskräftig festgestellten Forderungen aufrechnen; seine
            Rechte wegen Mängeln bleiben unberührt.
          </p>

          <h3>§ 8 Eigentumsvorbehalt und Gefahrübergang</h3>
          <p>
            Die Ware bleibt bis zur vollständigen Zahlung Eigentum des Verkäufers. Der Käufer
            behandelt sie pfleglich und teilt Pfändungen oder andere Eingriffe Dritter
            unverzüglich mit. Die Gefahr geht mit der Übergabe der Ware auf den Käufer über, bei
            vereinbarter Montage mit deren Fertigstellung, bei Abholung mit der Übergabe im Lager
            bzw. Studio.
          </p>

          <h3>§ 9 Rücktritt des Käufers ohne Grund (Stornierung)</h3>
          <p>
            Tritt der Käufer ohne Rechtsgrund vom Vertrag zurück oder verweigert er die Abnahme,
            kann der Verkäufer pauschalen Schadensersatz verlangen:
          </p>
          <ul>
            <li>vor Aufmaß und vor Bestellung beim Hersteller: 20 % des Kaufpreises,</li>
            <li>nach Aufmaß oder nach Bestellung beim Hersteller: 30 % des Kaufpreises,</li>
            <li>nach Anlieferung der Ware: 40 % des Kaufpreises.</li>
          </ul>
          <p>
            Dem Käufer bleibt der Nachweis ausdrücklich gestattet, dass kein oder ein wesentlich
            geringerer Schaden entstanden ist. Der Verkäufer kann einen nachgewiesenen höheren
            Schaden geltend machen. Ein gesetzliches Widerrufsrecht bleibt unberührt.
          </p>

          <h3>§ 10 Mängelrechte</h3>
          <p>
            Es gelten die gesetzlichen Mängelrechte. Naturstein, Keramik und Glas sind
            Naturprodukte; Farb- und Strukturunterschiede, Adern und feine Poren sind
            warentypisch und kein Mangel, soweit sie die Gebrauchstauglichkeit nicht
            beeinträchtigen.
          </p>

          <h3>§ 11 Elektrogeräte</h3>
          <p>
            Für mitverkaufte Elektrogeräte gelten die gesetzlichen Mängelrechte gegenüber dem
            Verkäufer. Garantien der Gerätehersteller bestehen zusätzlich nach deren
            Bedingungen und lassen die gesetzlichen Rechte unberührt. Angaben zur
            Energieeffizienz und die Produktdatenblätter stellt der Verkäufer mit dem Angebot
            bzw. im Studio zur Verfügung.
          </p>
          <p>
            Altgeräte dürfen nicht über den Hausmüll entsorgt werden; sie gehören zu einer
            Sammelstelle für Elektroaltgeräte, etwa dem kommunalen Wertstoffhof. Personenbezogene
            Daten auf Altgeräten löscht der Käufer vor der Abgabe selbst. Die Mitnahme von
            Altgeräten durch den Verkäufer erfolgt, soweit sie im Kaufvertrag vereinbart oder
            gesetzlich vorgeschrieben ist.
          </p>

          <h3>§ 12 Haftung</h3>
          <p>
            Der Verkäufer haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei der
            Verletzung von Leben, Körper oder Gesundheit, nach dem Produkthaftungsgesetz und im
            Umfang einer übernommenen Garantie. Bei leicht fahrlässiger Verletzung einer
            wesentlichen Vertragspflicht, deren Erfüllung die ordnungsgemäße Durchführung des
            Vertrags überhaupt erst ermöglicht und auf deren Einhaltung der Käufer regelmäßig
            vertrauen darf, ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden
            begrenzt. Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen. Diese
            Regelung gilt für alle Teile dieser Bedingungen.
          </p>

          <h2>Teil C — Merch-Shop</h2>

          <h3>§ 13 Anfrage, Angebot und Vertragsschluss im Merch-Shop</h3>
          <p>
            Die Anfrage über den Merch-Shop ist unverbindlich. Der Verkäufer schickt daraufhin ein
            individuelles Angebot mit Preis, Versandkosten und Zahlungsweg per E-Mail. Der Vertrag
            kommt zustande, wenn der Käufer dieses Angebot in Textform annimmt. Gezahlt wird wie im
            Angebot angegeben; die Ware wird nach Zahlungseingang versandt. Angaben zu Versand und
            Lieferzeiten stehen unter <Link to="/versand-lieferung">Versand &amp; Lieferung</Link>.
          </p>
          <p>
            Bei personalisierten Artikeln (z. B. Namensdruck) ist der Käufer dafür verantwortlich,
            dass der gewünschte Inhalt keine Rechte Dritter verletzt. Der Verkäufer darf Aufträge
            mit rechtswidrigen oder beleidigenden Inhalten ablehnen.
          </p>

          <h2>Teil D — Widerruf und Schlussbestimmungen</h2>

          <h3>§ 14 Widerrufsrecht</h3>
          <p>
            Verbrauchern steht bei Verträgen, die im Fernabsatz oder außerhalb der Geschäftsräume
            des Verkäufers geschlossen werden, ein gesetzliches Widerrufsrecht nach Maßgabe der
            jeweiligen Widerrufsbelehrung zu. Für Bestellungen aus dem Merch-Shop gilt die{' '}
            <Link to="/rueckgabe-widerruf">Widerrufsbelehrung auf dieser Website</Link>; für
            Küchenverträge, die nicht im Studio unterschrieben werden, erhält der Käufer die
            Widerrufsbelehrung mit den Vertragsunterlagen. Für Verträge, die der Käufer im Studio
            abschließt, besteht kein gesetzliches Widerrufsrecht.
          </p>
          <p>
            Das Widerrufsrecht besteht nicht bei Waren, die nicht vorgefertigt sind und für deren
            Herstellung eine individuelle Auswahl oder Bestimmung durch den Verbraucher maßgeblich
            ist oder die eindeutig auf die persönlichen Bedürfnisse des Verbrauchers zugeschnitten
            sind (§ 312g Abs. 2 Nr. 1 BGB).
          </p>

          <h3>§ 15 Recht, Gerichtsstand, Streitbeilegung</h3>
          <p>
            Es gilt das Recht der Bundesrepublik Deutschland. Gegenüber Verbrauchern gilt diese
            Rechtswahl nur, soweit ihnen dadurch nicht der Schutz zwingender Bestimmungen des
            Staates entzogen wird, in dem sie ihren gewöhnlichen Aufenthalt haben. Ist der Käufer
            Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches
            Sondervermögen, ist Gerichtsstand {op.city}.
          </p>
          <p>
            Der Verkäufer ist nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren
            vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h3>§ 16 Datenschutz und Schlussbestimmungen</h3>
          <p>
            Informationen zur Verarbeitung personenbezogener Daten stehen in der{' '}
            <Link to="/datenschutz">Datenschutzerklärung</Link>. Sollten einzelne Bestimmungen
            dieser Bedingungen unwirksam sein, bleibt der Vertrag im Übrigen wirksam; an die Stelle
            der unwirksamen Bestimmung treten die gesetzlichen Vorschriften.
          </p>

          <p className="legal__note">
            Verwandte Seiten: <Link to="/rueckgabe-widerruf">Rückgabe &amp; Widerruf</Link>,{' '}
            <Link to="/versand-lieferung">Versand &amp; Lieferung</Link>,{' '}
            <Link to="/datenschutz">Datenschutz</Link> und <Link to="/impressum">Impressum</Link>.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
