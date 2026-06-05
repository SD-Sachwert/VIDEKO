/**
 * Global decorative layer: faint gold light pools, a couple of drifting
 * hairlines and slow light dust. Tuned low so it reads as atmosphere, not
 * wellness-beige. Sits behind all content.
 */
export default function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden="true">
      <span className="ambient__pool ambient__pool--1" />
      <span className="ambient__pool ambient__pool--2" />
      <span className="ambient__line ambient__line--1" />
      <span className="ambient__line ambient__line--2" />
      <div className="ambient__dust" />
      <div className="ambient__grain" />
    </div>
  )
}
