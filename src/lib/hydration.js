/**
 * Merker, ob React die vom Build ausgelieferte Seite bereits hydriert hat.
 *
 * WARUM
 * -----
 * Seit dem Body-Prerendering (scripts/prerender.mjs) existiert jede Route als
 * fertiges HTML. Der erste Client-Render ist deshalb kein freier Render mehr,
 * sondern muss exakt das reproduzieren, was der Build geschrieben hat — sonst
 * verwirft React den Teilbaum und der Besucher sieht ein Flackern.
 *
 * Zustand, der aus localStorage/sessionStorage kommt, kann das nicht: Der Build
 * kennt diesen Speicher nicht. Solche Werte duerfen darum erst NACH der
 * Hydration in den Render einfliessen. Das Flag hier macht diesen Zeitpunkt
 * abfragbar, ohne dass jede Komponente ein eigenes Effekt-Konstrukt braucht.
 *
 * Gesetzt wird es in einem Effekt in Layout.jsx — Effekte laufen erst nach dem
 * ersten Commit, also garantiert nach dem Hydrationsdurchlauf.
 */
let hydriert = false

/** true, sobald der erste Render committet ist. Waehrend der Hydration false. */
export const istHydriert = () => hydriert

/** Nur aus Layout.jsx aufrufen. */
export const markiereHydriert = () => { hydriert = true }
