import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { describeBillingError } from '../utils/billingErrors'
import './CreditPrompt.css'

const CoinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.6h-3a1.8 1.8 0 0 0 0 3.6h4" />
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="10" width="16" height="11" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
)

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M10 9v6M14 9v6" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.2l2.4 2.4 4.6-4.9" />
  </svg>
)

const MARKS = {
  credits: CoinIcon,
  plan: LockIcon,
  frozen: PauseIcon,
  replay: CheckIcon,
}

/**
 * The descriptor's body, unless it is missing the numbers it promises.
 *
 * `describeBillingError` writes "This costs N credits and you have M" out of
 * the refusal's `details`, and some of this app's services forward a refusal's
 * `code` but drop its `details` — leaving a sentence that reads "costs
 * undefined credits". The backend's own message is the honest fallback there;
 * inventing a number would be the one thing worse than saying less.
 */
const bodyOf = (refusal, error) => {
  if (refusal.body && !refusal.body.includes('undefined')) return refusal.body
  return error?.error || error?.message || null
}

/**
 * The modal a charged action gets refused into.
 *
 * CREDIT-SYSTEM-DESIGN.md §7: a refusal must say what the action costs, what
 * the reader has, and where to go next — never a bare "insufficient credits".
 * All of that copy lives in `utils/billingErrors.js`; this only renders it and
 * routes the call to action, so every surface refuses in the same words.
 *
 * @param {object|null} error  A failed service result — `{ error, code,
 *                                details }`. Anything that is not a billing
 *                                refusal (null included) renders nothing, so
 *                                callers can mount this unconditionally.
 * @param {() => void}  onClose
 * @param {() => void}  [onRefreshBilling]  Re-fetch the balance (the "Refresh"
 *                                          CTA on an idempotent replay).
 */
function CreditPrompt({ error, onClose, onRefreshBilling }) {
  const navigate = useNavigate()
  const dismissRef = useRef(null)

  useEffect(() => {
    dismissRef.current?.focus()
  }, [error])

  // Mounted unconditionally by its callers, so Esc is only ours to take while
  // something is actually on screen.
  useEffect(() => {
    if (!error) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [error, onClose])

  const refusal = describeBillingError(error)
  if (!refusal) return null

  const Mark = MARKS[refusal.kind] || CoinIcon
  const body = bodyOf(refusal, error)

  const act = () => {
    if (refusal.action === 'refresh') {
      onRefreshBilling?.()
      onClose()
      return
    }
    // Every other path — top up, upgrade, manage billing — is the same place:
    // the plan section of Settings, which owns the checkout and portal links.
    onClose()
    navigate('/settings#plan')
  }

  return (
    <div className="cp-backdrop" onClick={onClose} role="presentation">
      <div
        className={`cp-panel cp-${refusal.kind}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cp-title"
        aria-describedby="cp-body"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="cp-mark" aria-hidden="true"><Mark /></span>

        <h2 className="cp-title" id="cp-title">{refusal.title}</h2>

        <div className="cp-body" id="cp-body">
          {body && <p>{body}</p>}
          {refusal.detail && <p className="cp-detail">{refusal.detail}</p>}
        </div>

        <div className="cp-actions">
          <button type="button" className="cp-btn cp-btn-quiet" onClick={onClose} ref={dismissRef}>
            Not now
          </button>
          <button type="button" className="cp-btn cp-btn-go" onClick={act}>
            {refusal.cta}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreditPrompt
