import './Card.css'

/**
 * Card — generic content container used across dashboard and pages.
 *
 * Props:
 *   title    — optional card heading string
 *   subtitle — optional muted text below the title
 *   children — card body content
 *   className — extra CSS classes for layout overrides
 *   noPadding — set true to remove default body padding (e.g. for tables)
 */
function Card({ title, subtitle, children, className = '', noPadding = false }) {
  const bodyClass = ['card__body', noPadding ? 'card__body--no-padding' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`card ${className}`}>
      {/* Render header only when a title is provided */}
      {title && (
        <div className="card__header">
          <h3 className="card__title">{title}</h3>
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </div>
  )
}

export default Card
