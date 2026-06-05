export default function CardGrid({ cols = 3, className = '', children }) {
  return <div className={`cardgrid cardgrid--${cols} ${className}`.trim()}>{children}</div>
}
