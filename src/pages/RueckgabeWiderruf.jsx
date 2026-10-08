import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { ACTIVE_OPERATOR } from '../data/company.js'

/**
 * Widerrufsbelehrung und Muster-Widerrufsformular.
 *
 * Wortlaut nach dem gesetzlichen Muster (Anlage 1 und 2 zu Art. 246a EGBGB,
 * Fassung seit 28.05.2022) fuer Kaufvertraege ueber Waren, die als Paket
 * versandt werden (Merch-Shop). Nur die Angaben der Betreiberin sind
 * eingesetzt (aus ACTIVE_OPERATOR) – den Mustertext nicht umformulieren, sonst
 * entfaellt die gesetzliche Musterwirkung (Art. 246a § 1 Abs. 2 S. 2 EGBGB).
 *
 * Entscheidung 08.10.2026 (vorbehaltlich Freigabe): Der Kunde traegt die
 * unmittelbaren Kosten der Ruecksendung.
 *
 * Kuechenvertraege ausserhalb der Geschaeftsraeume bekommen ihre eigene
 * Belehrung mit den Vertragsunterlagen (Abholung durch uns).
 */
const op = ACTIVE_OPERATOR

export default function RueckgabeWiderruf() {
  return (
    <section className="section section--light legal-page">
      <div className="container">
        <Reveal className="legal-head">
          <span className="kicker kicker--gold">Rechtliches</span>
          <h1 className="legal-head__title">Rückgabe &amp; Widerruf</h1>
        </Reveal>

        <Reveal className="legal legal--doc">
          <p className="legal__lead">
            Verbraucherinnen und Verbraucher haben bei Verträgen, die im Fernabsatz geschlossen
            werden – zum Beispiel über eine Anfrage in unserem Merch-Shop und die Annahme unseres
            Angebots per E-Mail –, ein gesetzliches Widerrufsrecht von 14 Tagen.
          </p>

          <h2>Widerrufsbelehrung</h2>

          <h3>Widerrufsrecht</h3>
          <p>
            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
            widerrufen.
          </p>
          <p>
            Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen
            benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben
            bzw. hat.
          </p>
          <p>
            Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({op.legalName}, {op.street},{' '}
            {op.postalCode} {op.city}, Telefon: {op.operatorPhone}, E-Mail:{' '}
            <a href={`mailto:${op.operatorEmail}`}>{op.operatorEmail}</a>) mittels einer eindeutigen
            Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss,
            diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte
            Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
          </p>
          <p>
            Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung
            des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
          </p>

          <h3>Folgen des Widerrufs</h3>
          <p>
            Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen
            erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten,
            die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns
            angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens
            binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren
            Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir
            dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben,
            es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall
            werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
          </p>
          <p>
            Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben
            oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je
            nachdem, welches der frühere Zeitpunkt ist.
          </p>
          <p>
            Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab
            dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns
            zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf
            der Frist von vierzehn Tagen absenden.
          </p>
          <p>Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.</p>
          <p>
            Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser
            Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise
            der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.
          </p>

          <h2>Ausschluss des Widerrufsrechts</h2>
          <p>
            Das Widerrufsrecht besteht nicht bei Verträgen zur Lieferung von Waren, die nicht
            vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder Bestimmung
            durch den Verbraucher maßgeblich ist oder die eindeutig auf die persönlichen
            Bedürfnisse des Verbrauchers zugeschnitten sind (§ 312g Abs. 2 Nr. 1 BGB). Das betrifft
            insbesondere T-Shirts mit Namensdruck oder anderer Personalisierung. Wir weisen in
            unserem Angebot noch einmal darauf hin.
          </p>

          <h2>Küchen und Einrichtung</h2>
          <p>
            Küchenverträge, die Sie in unserem Studio abschließen, sind keine Fernabsatz- oder
            Außergeschäftsraumverträge; dafür besteht kein gesetzliches Widerrufsrecht. Schließen
            Sie einen Küchenvertrag außerhalb unserer Geschäftsräume, zum Beispiel bei Ihnen zu
            Hause, erhalten Sie die dafür geltende Widerrufsbelehrung zusammen mit den
            Vertragsunterlagen.
          </p>

          <h2>Muster-Widerrufsformular</h2>
          <p>
            (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und
            senden Sie es zurück.)
          </p>
          <p>
            – An {op.legalName}, {op.street}, {op.postalCode} {op.city}, E-Mail: {op.operatorEmail}:
            {'\n'}– Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über
            den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)
            {'\n'}– Bestellt am (*)/erhalten am (*)
            {'\n'}– Name des/der Verbraucher(s)
            {'\n'}– Anschrift des/der Verbraucher(s)
            {'\n'}– Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)
            {'\n'}– Datum
          </p>
          <p>(*) Unzutreffendes streichen.</p>

          <p className="legal__note">
            Fragen zur Rückgabe beantworten wir gern unter{' '}
            <a href={`mailto:${op.operatorEmail}`}>{op.operatorEmail}</a>. Angaben zu Versandkosten
            und Lieferzeiten findest du unter <Link to="/versand-lieferung">Versand &amp; Lieferung</Link>,
            unsere Bedingungen in den <Link to="/agb">AGB</Link>.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
