import Reveal from './Reveal.jsx'

export default function BrandStatement() {
  return (
    <section className="statement">
      <div className="container">
        <Reveal>
          <span className="kicker kicker--gold">Markenstatement</span>
          <h2 className="statement__title">
            Kein Möbelhaus.<br />
            Keine Küche <span className="grad">von der Stange.</span>
          </h2>
          <p className="statement__text">
            VIDEKO ist kein Verkaufsraum mit Rabattschildern. Wir planen Küchen für
            Menschen mit Anspruch – ehrlich, individuell und auf höchstem Niveau.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
