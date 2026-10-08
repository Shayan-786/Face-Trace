function ConfidenceBar({ value }) {
  if (!Number.isFinite(value)) {
    return <span className="muted">Not available</span>
  }

  const score = Math.min(100, Math.max(0, value))
  return (
    <div
      className="confidence"
      aria-label={`Model score: ${score}%`}
    >
      <div
        className="confidence__track"
        aria-hidden="true"
      >
        <div
          className="confidence__fill"
          style={{ width: `${score}%` }}
        />
      </div>
      <span>{score}%</span>
    </div>
  )
}

export default ConfidenceBar
