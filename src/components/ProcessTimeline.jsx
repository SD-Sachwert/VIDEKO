import Reveal from './Reveal.jsx'

/** steps = [{ title, text }] — numbered automatically. */
export default function ProcessTimeline({ steps }) {
  return (
    <div className="timeline">
      {steps.map((s, i) => (
        <Reveal key={s.title} delay={(i % 4) * 0.05} className="tstep">
          <span className="tstep__n">{String(i + 1).padStart(2, '0')}</span>
          <span className="tstep__dot" aria-hidden="true" />
          <h4 className="tstep__title">{s.title}</h4>
          {s.text && <p className="tstep__text">{s.text}</p>}
        </Reveal>
      ))}
    </div>
  )
}
