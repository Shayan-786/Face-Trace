import Button from '../../components/Button/Button'

function NotFound() {
  return (
    <div className="empty-state not-found">
      <p className="muted">404</p>
      <h1>Page not found</h1>
      <p>The address may be incorrect, or the page may have moved.</p>
      <Button to="/">Go to homepage</Button>
    </div>
  )
}

export default NotFound
