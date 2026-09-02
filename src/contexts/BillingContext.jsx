import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getBilling } from '../services/billingService'

/**
 * The user's credit balance, plan and the published charge table, fetched once
 * and shared.
 *
 * Why a context rather than a fetch per component: on a single shared credit
 * pool, showing the price at the moment of an action is not polish — it is what
 * makes the pool feel fair instead of arbitrary (CREDIT-SYSTEM-DESIGN.md §7).
 * That means the model picker, the voice control, the image engine picker and
 * the balance readout all need the same numbers at the same time. Fetching
 * per-component would fan out into a request per picker, and the likely
 * shortcut — hardcoding prices in the client — is exactly how the number a
 * reader is shown drifts from the number they are charged.
 *
 * The charge table is served by the backend for the same reason. There is one
 * place a price is written down, and the client reads it rather than
 * restating it.
 */
const BillingContext = createContext()

export const useBilling = () => {
  const context = useContext(BillingContext)
  if (!context) throw new Error('useBilling must be used within a BillingProvider')
  return context
}

export const BillingProvider = ({ children }) => {
  const { user } = useAuth()
  const [billing, setBilling] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setBilling(null)
      return null
    }
    setIsLoading(true)
    const result = await getBilling()
    setIsLoading(false)

    if (result.success) {
      setBilling(result)
      setError(null)
      return result
    }
    // A billing fetch that fails must not blank the balance already on screen —
    // a number flickering to zero reads as "my credits are gone", which is the
    // single most alarming thing this UI can say by accident.
    setError(result.error)
    return null
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  /**
   * Fold a fresh balance into state without a round trip.
   *
   * Every charged endpoint could return the new balance, but the actions that
   * spend credits are also the slowest (a story turn is seconds), so the
   * balance would sit stale for the whole generation if it only updated on
   * refetch. Callers apply the delta optimistically and call `refresh()` when
   * the action settles.
   */
  const applyBalance = useCallback((balance) => {
    setBilling((prev) => (prev ? { ...prev, balance: { ...prev.balance, ...balance } } : prev))
  }, [])

  const balance = billing?.balance?.total ?? 0
  const plan = billing?.plan ?? null
  const charges = billing?.charges ?? null

  /** Credits for one turn on `model` at `length`, straight from the backend table. */
  const priceOfTurn = useCallback(
    (model, length = 'medium') => charges?.turns?.[model]?.[length] ?? null,
    [charges]
  )

  /** Whether the current plan includes a model's class. Null while loading. */
  const canUseModel = useCallback(
    (tier) => (plan ? plan.tiers.includes(tier) : null),
    [plan]
  )

  const value = {
    billing,
    balance,
    // Kept separate because they behave differently: monthly credits reset and
    // can be clipped by the rollover cap, purchased ones never expire. A user
    // who cannot tell them apart has no way to understand why their total moved
    // at a period boundary.
    monthlyCredits: billing?.balance?.monthly ?? 0,
    purchasedCredits: billing?.balance?.purchased ?? 0,
    resetsAt: billing?.balance?.resetsAt ?? null,
    plan,
    subscription: billing?.subscription ?? null,
    frozen: billing?.frozen ?? null,
    charges,
    priceOfTurn,
    canUseModel,
    narrationAllowed: plan?.narration ?? false,
    isLoading,
    error,
    refresh,
    applyBalance,
  }

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
}

export default BillingContext
