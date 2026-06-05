import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin } from 'lucide-react'

export default function CareerRoleCard({ title, location = 'Würzburg', to = '/beratung' }) {
  return (
    <Link className="rolecard" to={to}>
      <span className="rolecard__title">{title}</span>
      <span className="rolecard__meta">
        <MapPin size={13} strokeWidth={1.8} /> {location}
      </span>
      <span className="rolecard__arrow" aria-hidden="true">
        <ArrowUpRight size={18} strokeWidth={1.8} />
      </span>
    </Link>
  )
}
