import { useEffect, useRef, useState } from 'react'
import './ConfirmDialog.css'

const WarnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
)

const SpinnerIcon = () => <span className="cd-spinner" aria-hidden="true" />

/**
 * Destructive-action confirmation.
 *
 * Replaces window.confirm so the moment reads as part of the product: it
 * names what is about to go, spells out what goes with it, and keeps the
 * cancel path the easy one (autofocused, Esc, backdrop click). The action
 * runs inline — the dialog holds a pending state and surfaces a failure
 * here rather than closing and firing an alert.
 *
 * @param {string}   title      Question in the header, e.g. "Delete this story?"
 * @param {string}   name       The item's own name, quoted in the body.
 * @param {string[]} [details]  What else the delete takes with it.
 * @param {string}   [note]     Reassurance about what survives, if anything.
 * @param {string}   [confirmLabel]
 * @param {() => Promise<{success: boolean, error?: string}>} onConfirm
 * @param {() => void} onClose
 */
function ConfirmDialog({
  title,
  name,
  details = [],
  note,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  // Esc dismisses, but never mid-request — cancelling the dialog would
  // not cancel the delete already in flight.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !pending) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, pending])

  const confirm = async () => {
    setPending(true)
    setError(null)
    const result = await onConfirm()
    if (result?.success) {
      onClose()
      return
    }
    setPending(false)
    setError(result?.error || `Couldn't ${confirmLabel.toLowerCase()} this yet. Try again.`)
  }

  return (
    <div
      className="cd-backdrop"
      onClick={() => { if (!pending) onClose() }}
      role="presentation"
    >
      <div
        className="cd-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cd-title"
        aria-describedby="cd-body"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="cd-mark" aria-hidden="true"><WarnIcon /></span>

        <h2 className="cd-title" id="cd-title">{title}</h2>

        <div className="cd-body" id="cd-body">
          <p>
            <strong>{name}</strong> will be permanently removed. This can't be undone.
          </p>
          {details.length > 0 && (
            <ul className="cd-details">
              {details.map((d) => <li key={d}>{d}</li>)}
            </ul>
          )}
          {note && <p className="cd-note">{note}</p>}
        </div>

        {error && <p className="cd-error" role="alert">{error}</p>}

        <div className="cd-actions">
          <button
            type="button"
            className="cd-btn cd-btn-quiet"
            onClick={onClose}
            disabled={pending}
            ref={cancelRef}
          >
            Keep it
          </button>
          <button
            type="button"
            className="cd-btn cd-btn-danger"
            onClick={confirm}
            disabled={pending}
          >
            {pending ? <><SpinnerIcon /> Deleting…</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
