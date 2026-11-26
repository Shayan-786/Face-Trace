import { useEffect, useRef } from 'react'
import Button from '../Button/Button'

function ConfirmDialog({ open, title, description, confirmLabel, onCancel, onConfirm }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
    >
      <h2 id="confirm-title">{title}</h2>
      <p>{description}</p>
      <div className="action-row">
        <Button
          variant="secondary"
          onClick={onCancel}
          autoFocus
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}

export default ConfirmDialog
