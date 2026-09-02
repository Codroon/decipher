/**
 * Turn a billing refusal into something a person can act on.
 *
 * CREDIT-SYSTEM-DESIGN.md §7: a 402 must never be a bare "insufficient
 * credits". The backend already answers with a machine-readable `code` and the
 * numbers behind it — `{ required, balance, shortfall }` for a credit refusal,
 * the unlocking plan for a locked model — and this is the one place that gets
 * translated into copy, so every surface says the same thing.
 *
 * Returns null for anything that is not a billing refusal, so callers can use
 * it as a filter: `const refusal = describeBillingError(err); if (refusal) ...`
 */

const CREDIT_CODES = new Set(['INSUFFICIENT_CREDITS', 'MODEL_LOCKED', 'NARRATION_LOCKED', 'ACCOUNT_FROZEN', 'IDEMPOTENT_REPLAY'])

export const isBillingError = (error) => Boolean(error?.code && CREDIT_CODES.has(error.code))

export const describeBillingError = (error) => {
  if (!isBillingError(error)) return null
  const d = error.details || {}

  switch (error.code) {
    case 'INSUFFICIENT_CREDITS':
      return {
        kind: 'credits',
        title: 'Not enough credits',
        // The numbers, not just the verdict — this is the difference between a
        // dead end and a decision.
        body: `This costs ${d.required} credits and you have ${d.balance}.`,
        detail: d.shortfall ? `You need ${d.shortfall} more.` : null,
        cta: 'Get more credits',
        action: 'topup',
      }

    case 'MODEL_LOCKED':
      return {
        kind: 'plan',
        title: `${d.model || 'That model'} isn't on your plan`,
        body: d.upgradeTo
          ? `${d.upgradeTo.label} unlocks it, at $${d.upgradeTo.priceUsd}/month.`
          : 'Upgrade to use this model.',
        detail: null,
        cta: d.upgradeTo ? `Upgrade to ${d.upgradeTo.label}` : 'See plans',
        action: 'upgrade',
        planKey: d.upgradeTo?.key || null,
      }

    case 'NARRATION_LOCKED':
      return {
        kind: 'plan',
        title: 'Narration is a paid feature',
        body: d.upgradeTo
          ? `${d.upgradeTo.label} adds it, at $${d.upgradeTo.priceUsd}/month.`
          : 'Upgrade to listen to your stories.',
        detail: null,
        cta: d.upgradeTo ? `Upgrade to ${d.upgradeTo.label}` : 'See plans',
        action: 'upgrade',
        planKey: d.upgradeTo?.key || null,
      }

    case 'ACCOUNT_FROZEN':
      return {
        kind: 'frozen',
        title: 'Your account is on hold',
        // Say plainly that their work is safe. Someone told only "on hold"
        // assumes the worst about everything they have written.
        body: 'A billing issue is being resolved. Your stories are unaffected and you can still read and export everything.',
        detail: d.reason || null,
        cta: 'Manage billing',
        action: 'portal',
      }

    case 'IDEMPOTENT_REPLAY':
      return {
        kind: 'replay',
        title: 'Already done',
        body: 'This request went through the first time. Refresh to see the result.',
        detail: null,
        cta: 'Refresh',
        action: 'refresh',
      }

    default:
      return null
  }
}

export default describeBillingError
