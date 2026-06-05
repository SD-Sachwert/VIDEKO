import Reveal from './Reveal.jsx'

export default function SectionHeader({ kicker, title, lead, align = 'left', tone, className = '' }) {
  return (
    <Reveal
      as="header"
      className={`sec-head ${align === 'center' ? 'sec-head--center' : ''} ${tone === 'light' ? 'sec-head--light' : ''} ${className}`.trim()}
    >
      {kicker && <span className={`kicker ${tone === 'light' ? 'kicker--gold' : ''}`.trim()}>{kicker}</span>}
      <h2 className="sec-head__title">{title}</h2>
      {lead && <p className="sec-head__lead">{lead}</p>}
    </Reveal>
  )
}
