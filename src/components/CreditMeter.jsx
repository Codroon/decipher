import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBilling } from '../contexts/BillingContext'
import { formatCredits } from '../services/billingService'
import './CreditMeter.css'

/**
 * The credit balance, in the app header.
 *
 * On a shared pool, a narrated passage costs fifty times a fast turn — so the
 * number moves at wildly different speeds depending on what someone is doing.
 * A static figure they have to go and look up in settings is how a reader gets
 * surprised by an empty balance mid-chapter. Keeping it in the header, and
 * showing the change as it happens, is what makes the pool legible.
 *
 * The delta flash is the point of the component, not decoration: seeing "-18"
 * leave the counter the moment a flagship turn lands is what teaches someone
 * what their choices cost, far better than a price list they read once.
 */
function CreditMeter() {
  const navigate = useNavigate()
  const { balance, monthlyCredits, purchasedCredits, plan, isLoading, billing } = useBilling()

  const [delta, setDelta] = useState(null)
  const previous = useRef(null)
  const deltaTimer = useRef(null)

  useEffect(() => {
    // Nothing to compare against on the first load — a "delta" from zero would
    // flash the entire balance as if it had just been spent.
    if (!billing) return
    if (previous.current === null) {
      previous.current = balance
      return
    }
    if (balance === previous.current) return

    const change = balance - previous.current
    previous.current = balance
    setDelta(change)

    clearTimeout(deltaTimer.current)
    deltaTimer.current = setTimeout(() => setDelta(null), 1600)
    return () => clearTimeout(deltaTimer.current)
  }, [balance, billing])

  // Hidden until there is something true to show. A meter that renders "0"
  // while the first fetch is in flight reads as "your credits are gone", which
  // is the most alarming thing this component could say by accident.
  if (!billing && isLoading) return null
  if (!billing) return null

  const allowance = plan?.monthlyCredits || 0
  const monthlyPct = allowance > 0 ? Math.max(0, Math.min(100, (monthlyCredits / allowance) * 100)) : 0

  // Thresholds are about what is still affordable, not round numbers: 50 is one
  // narrated passage, and 18 is one turn on the most expensive model. Below
  // those, the next thing someone tries is likely to be refused.
  const level = balance <= 18 ? 'empty' : balance <= 50 ? 'low' : 'ok'

  const title = [
    `${formatCredits(balance)} credits`,
    allowance > 0 ? `${formatCredits(monthlyCredits)} of ${formatCredits(allowance)} monthly` : null,
    purchasedCredits > 0 ? `${formatCredits(purchasedCredits)} purchased (never expire)` : null,
  ].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      className={`credit-meter is-${level}`}
      onClick={() => navigate('/settings#plan')}
      title={title}
      aria-label={`${title}. Open billing settings.`}
    >
      <span className="credit-meter-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.4v9.2M9.4 9.9h4a1.8 1.8 0 0 1 0 3.6h-2.8a1.8 1.8 0 0 0 0 3.6h4" />
        </svg>
      </span>

      <span className="credit-meter-figure">{formatCredits(balance)}</span>

      {allowance > 0 && (
        <span className="credit-meter-bar" aria-hidden="true">
          <i style={{ width: `${monthlyPct}%` }} />
        </span>
      )}

      {delta !== null && (
        <span
          key={delta + '-' + Date.now()}
          className={`credit-meter-delta ${delta > 0 ? 'is-gain' : 'is-spend'}`}
          aria-hidden="true"
        >
          {delta > 0 ? '+' : '−'}{formatCredits(Math.abs(delta))}
        </span>
      )}
    </button>
  )
}

export default CreditMeter
