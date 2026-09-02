// Billing Service
// Credits, plans, the ledger, and everything that moves money.

import { API_ENDPOINTS, getHeaders } from './server'

/**
 * Shape every call here returns, matching the other services in this folder:
 * `{ success, ...payload }` or `{ success: false, error, code, details }`.
 *
 * `code` and `details` are carried through deliberately. The backend answers a
 * refusal with a machine-readable code and the numbers behind it —
 * INSUFFICIENT_CREDITS comes with `{ required, balance, shortfall }`,
 * MODEL_LOCKED with the plan that unlocks it — and dropping those on the floor
 * is what turns a helpful refusal into "something went wrong". See
 * CREDIT-SYSTEM-DESIGN.md §7.
 */
const unwrap = async (response) => {
  const data = await response.json().catch(() => ({}))
  if (response.ok) return { success: true, ...data }
  return {
    success: false,
    status: response.status,
    error: data.message || data.error || 'Request failed',
    code: data.code || null,
    details: data.details || null,
  }
}

const networkError = (label, error) => {
  console.error(`${label} Error:`, error)
  return { success: false, error: 'Network error. Please try again.', code: 'NETWORK' }
}

/**
 * Balance, plan, entitlements and the published charge table.
 *
 * One call, because a picker needs to price every option it renders. Fetching
 * prices per-option would either fan out into a request per model or, more
 * likely, lead to the prices being hardcoded in the client — which is exactly
 * how the number a reader is shown drifts from the number they are charged.
 */
export const getBilling = async () => {
  try {
    return unwrap(await fetch(API_ENDPOINTS.BILLING.ME, { headers: getHeaders(true) }))
  } catch (error) {
    return networkError('Get Billing', error)
  }
}

/** The plan catalogue and price list. Readable without an account. */
export const getPlans = async () => {
  try {
    return unwrap(await fetch(API_ENDPOINTS.BILLING.PLANS, { headers: getHeaders(false) }))
  } catch (error) {
    return networkError('Get Plans', error)
  }
}

/**
 * The user's own credit history, newest first.
 *
 * Cursor-paginated on `createdAt` rather than by page number: the ledger only
 * grows at the head, so an offset page would shift under the reader every time
 * they spent a credit mid-scroll. Pass the previous response's `nextBefore`.
 */
export const getLedger = async ({ limit = 50, before = null } = {}) => {
  try {
    const url = new URL(API_ENDPOINTS.BILLING.LEDGER)
    url.searchParams.set('limit', String(limit))
    if (before) url.searchParams.set('before', before)
    return unwrap(await fetch(url, { headers: getHeaders(true) }))
  } catch (error) {
    return networkError('Get Ledger', error)
  }
}

/**
 * Start a Stripe Checkout session, then send the browser to it.
 *
 * Pass either `{ planKey, interval }` for a subscription or `{ topupPack }`
 * for a credit pack. Returns the URL rather than navigating, so the caller
 * decides when to leave the page.
 */
export const createCheckout = async ({ planKey, interval = 'monthly', topupPack } = {}) => {
  try {
    return unwrap(await fetch(API_ENDPOINTS.BILLING.CHECKOUT, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(topupPack ? { topupPack } : { planKey, interval }),
    }))
  } catch (error) {
    return networkError('Create Checkout', error)
  }
}

/**
 * A link to Stripe's hosted billing portal — cards, invoices, cancellation.
 * Hosted rather than hand-rolled so no card detail ever touches this app.
 */
export const openPortal = async () => {
  try {
    return unwrap(await fetch(API_ENDPOINTS.BILLING.PORTAL, {
      method: 'POST',
      headers: getHeaders(true),
    }))
  } catch (error) {
    return networkError('Open Portal', error)
  }
}

/**
 * Cancel at the end of the paid period — never immediately. The response
 * carries the date access actually ends, which is the thing to show.
 */
export const cancelSubscription = async () => {
  try {
    return unwrap(await fetch(API_ENDPOINTS.BILLING.CANCEL, {
      method: 'POST',
      headers: getHeaders(true),
    }))
  } catch (error) {
    return networkError('Cancel Subscription', error)
  }
}

/** Undo a pending cancellation while the plan is still running. */
export const resumeSubscription = async () => {
  try {
    return unwrap(await fetch(API_ENDPOINTS.BILLING.RESUME, {
      method: 'POST',
      headers: getHeaders(true),
    }))
  } catch (error) {
    return networkError('Resume Subscription', error)
  }
}

/**
 * Move between plans. An upgrade bills immediately and the credits arrive with
 * that invoice; a downgrade takes effect at the period boundary. Either way the
 * caller should refetch billing rather than assume a new balance.
 */
export const changePlan = async ({ planKey, interval = 'monthly' }) => {
  try {
    return unwrap(await fetch(API_ENDPOINTS.BILLING.CHANGE_PLAN, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ planKey, interval }),
    }))
  } catch (error) {
    return networkError('Change Plan', error)
  }
}

/** Redeem an invite code. */
export const redeemInvite = async (code) => {
  try {
    return unwrap(await fetch(API_ENDPOINTS.INVITES.REDEEM, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ code }),
    }))
  } catch (error) {
    return networkError('Redeem Invite', error)
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────
// Shared so every surface says the same thing about a charge. Two components
// each writing their own "1,240 credits" is how one of them ends up saying
// something subtly different.

/** `1240` -> `"1,240"`. */
export const formatCredits = (n) => Number(n || 0).toLocaleString()

/**
 * Human label for a ledger row. The ledger is what turns a dispute into a
 * conversation instead of a chargeback (design §7), so it has to read as
 * events rather than as database rows.
 */
export const LEDGER_LABELS = {
  hold: 'Used',
  release: 'Refunded',
  reap: 'Refunded',
  grant: 'Added',
  purchase: 'Purchased',
  expire: 'Expired',
  adjust: 'Adjusted',
}

export const ACTION_LABELS = {
  'story.create': 'Started a story',
  'story.continue': 'Continued a story',
  'story.regenerate': 'Regenerated a passage',
  'story.edit': 'Revised a passage',
  'story.submit_answers': 'Wrote the opening',
  'story.initialize': 'Story setup',
  'story.suggest_characters': 'Character suggestions',
  'story.narrate': 'Narration',
  'image.generate': 'Image',
  'llm.chat': 'Direct model call',
  'llm.embeddings': 'Embeddings',
  'billing.signup_grant': 'Welcome credits',
  'billing.invite_grant': 'Invite credits',
  'billing.topup': 'Credit top-up',
  'billing.subscription_create': 'Plan started',
  'billing.subscription_cycle': 'Monthly credits',
  'billing.subscription_update': 'Plan changed',
  'billing.subscription_ended': 'Plan ended',
  'billing.dunning_lapsed': 'Plan lapsed',
  'billing.refund': 'Refund',
}

export const describeLedgerEntry = (entry) => ({
  label: ACTION_LABELS[entry.action] || LEDGER_LABELS[entry.kind] || entry.action || entry.kind,
  // A refund the user cannot see is indistinguishable from never having been
  // charged, and they only remember the charge — so signs are always explicit.
  signed: `${entry.amount > 0 ? '+' : ''}${formatCredits(entry.amount)}`,
  positive: entry.amount > 0,
})

export default {
  getBilling,
  getPlans,
  getLedger,
  createCheckout,
  openPortal,
  cancelSubscription,
  resumeSubscription,
  changePlan,
  redeemInvite,
  formatCredits,
  describeLedgerEntry,
}
