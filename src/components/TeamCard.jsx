import { User } from 'lucide-react'

/** Placeholder-friendly team card. Pass `image` later for real photos. */
export default function TeamCard({ name = 'Platzhalter', role, image }) {
  return (
    <article className="teamcard">
      <div className="teamcard__photo">
        {image ? (
          <img src={image} alt={name} loading="lazy" />
        ) : (
          <span className="teamcard__placeholder" aria-hidden="true">
            <User size={36} strokeWidth={1.2} />
          </span>
        )}
      </div>
      <span className="teamcard__name">{name}</span>
      {role && <span className="teamcard__role">{role}</span>}
    </article>
  )
}
