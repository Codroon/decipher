import { useState, useEffect, useRef, useCallback } from 'react'
import { useBilling } from '../contexts/BillingContext'
import {
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
} from '../services/billingService'
import { describeBillingError } from '../utils/billingErrors'
import './Settings.css'

const AVATAR = '/author-avatar-7942f7.png'

const S = {
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  chev: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 7l4 4 5-7 5 7 4-4v11H3z" />
    </svg>
  ),
  warn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
    </svg>
  ),
}

const SECTIONS = [
  { id: 'account', label: 'Account', icon: S.user },
  { id: 'plan', label: 'Plan & Usage', icon: S.crown },
]

const DEFAULTS = {
  name: 'Aria Vale',
  username: 'ariawrites',
  email: 'aria@decipher.app',
  tagline: 'Spinning worlds out of starlight and stubbornness.',
  model: 'Decipher 32B',
  creativity: 65,
  tone: 'Mysterious',
  length: 'Medium (3–4 paragraphs)',
  rating: 'Teen',
  autoContinue: false,
  rememberChars: true,
  narrate: false,
  voice: 'sable',
  rate: 100,
  imgStyle: 'Fantasy',
  imgModel: 'Decipher Vivid',
  ratio: 'Portrait',
  imgCount: 4,
  safeImg: true,
  font: 'Spectral',
  textSize: 18,
  lineH: 175,
  paper: 'dark',
  nDigest: true,
  nFeatures: true,
  nReplies: true,
  nMarketing: false,
  trainOptOut: false,
}

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('decipher_settings') || '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

function Toggle({ on, onClick }) {
  return <button type="button" className={`sw ${on ? 'on' : ''}`} onClick={onClick} role="switch" aria-checked={on} />
}

function Row({ title, desc, children }) {
  return (
    <div className="set-row">
      <div className="rt">
        <div className="rl">{title}</div>
        {desc && <div className="rd">{desc}</div>}
      </div>
      <div className="rc">{children}</div>
    </div>
  )
}

function SecHead({ icon, title, desc }) {
  return (
    <div className="set-sechead">
      <span className="ic">{icon}</span>
      <div>
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
      </div>
    </div>
  )
}

const fmtDate = (value) => {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const fmtShortDate = (value) => {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** `$10` / `$10.50` — never a trailing `.00`. */
const fmtUsd = (n) => {
  const v = Number(n || 0)
  return `$${Number.isInteger(v) ? v : v.toFixed(2)}`
}

/** A refund has to read as a refund, not as a second charge with a plus sign. */
const isRefund = (e) => e.kind === 'release' || e.kind === 'reap' || e.action === 'billing.refund'

/** Whatever context the backend happened to attach to the row, if anything. */
const ledgerHint = (e) => {
  const m = e.meta || {}
  return m.storyTitle || m.title || m.model || m.pack || m.planKey || null
}

/** Model classes come back as raw keys (`workhorse`); title-case for display. */
const tierLabel = (t) => String(t || '').replace(/^./, (c) => c.toUpperCase())

function Settings() {
  const [s, setS] = useState(loadSettings)
  const [active, setActive] = useState('account')
  const [confirmDel, setConfirmDel] = useState(false)
  const [toast, setToast] = useState(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const firstRun = useRef(true)
  const secRefs = useRef({})
  const contentRef = useRef(null)

  const set = (k, v) => setS((prev) => ({ ...prev, [k]: v }))

  const usesPanelScroll = () => {
    const root = contentRef.current
    return Boolean(root && window.innerWidth > 1080)
  }

  useEffect(() => {
    localStorage.setItem('decipher_settings', JSON.stringify(s))
    if (firstRun.current) {
      firstRun.current = false
      return undefined
    }
    setSavedFlash(true)
    const t = setTimeout(() => setSavedFlash(false), 1400)
    return () => clearTimeout(t)
  }, [s])

  useEffect(() => {
    const onScroll = () => {
      const root = contentRef.current
      const panel = usesPanelScroll()
      const scrollPos = panel ? root.scrollTop : window.scrollY
      const pad = panel ? 48 : 140

      let cur = SECTIONS[0].id
      for (const sec of SECTIONS) {
        const el = secRefs.current[sec.id]
        if (!el) continue
        const top = panel ? el.offsetTop : el.getBoundingClientRect().top + window.scrollY
        if (top <= scrollPos + pad) cur = sec.id
      }
      setActive(cur)
    }

    const root = contentRef.current
    onScroll()
    root?.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      root?.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const go = (id) => {
    const el = secRefs.current[id]
    const root = contentRef.current
    if (!el) return

    if (usesPanelScroll() && root) {
      root.scrollTo({ top: Math.max(0, el.offsetTop - 12), behavior: 'smooth' })
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY - 88
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  const reg = (id) => (el) => {
    if (el) secRefs.current[id] = el
  }

  // ── Billing ─────────────────────────────────────────────────────────────
  const {
    billing,
    balance,
    monthlyCredits,
    purchasedCredits,
    resetsAt,
    plan,
    subscription,
    frozen,
    isLoading: billingLoading,
    error: billingError,
    refresh: refreshBilling,
  } = useBilling()

  const [catalogue, setCatalogue] = useState(null)
  const [catalogueError, setCatalogueError] = useState(null)
  // Not named `interval` / `setInterval`: that would shadow the global timer.
  const [cycle, setCycle] = useState('monthly')
  const [ledger, setLedger] = useState([])
  const [ledgerCursor, setLedgerCursor] = useState(null)
  const [ledgerBusy, setLedgerBusy] = useState(false)
  const [ledgerError, setLedgerError] = useState(null)
  const [ledgerLoaded, setLedgerLoaded] = useState(false)
  const [busy, setBusy] = useState(null)
  const [billingNote, setBillingNote] = useState(null)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteNote, setInviteNote] = useState(null)
  const pickerRef = useRef(null)

  useEffect(() => {
    let alive = true
    getPlans().then((r) => {
      if (!alive) return
      if (r.success) setCatalogue({ plans: r.plans || [], topups: r.topups || [] })
      else setCatalogueError(r.error)
    })
    return () => {
      alive = false
    }
  }, [])

  const loadLedger = useCallback(async (before = null) => {
    setLedgerBusy(true)
    setLedgerError(null)
    const r = await getLedger({ limit: 20, before })
    setLedgerBusy(false)
    // Marked as attempted either way. If a failure left this false the effect
    // below would see "not loaded, not busy" and retry in a tight loop.
    setLedgerLoaded(true)
    if (!r.success) {
      setLedgerError(r.error)
      return
    }
    const rows = r.entries || []
    setLedger((prev) => (before ? [...prev, ...rows] : rows))
    setLedgerCursor(r.nextBefore || null)
  }, [])

  // Only once there is an account to have a history — an unauthenticated fetch
  // would just paint a 401 into the history card.
  useEffect(() => {
    if (billing && !ledgerLoaded && !ledgerBusy) loadLedger(null)
  }, [billing, ledgerLoaded, ledgerBusy, loadLedger])

  /**
   * Run a billing call, and turn a refusal into copy rather than a dead end.
   * `describeBillingError` owns the wording for the codes it knows so every
   * surface says the same thing; anything else falls back to the message the
   * backend sent.
   */
  const runBilling = async (key, fn, onDone) => {
    setBusy(key)
    setBillingNote(null)
    const r = await fn()
    setBusy(null)
    if (!r.success) {
      const refusal = describeBillingError(r)
      setBillingNote(
        refusal
          ? { tone: 'warn', title: refusal.title, body: refusal.body, detail: refusal.detail }
          : { tone: 'warn', title: "That didn't go through", body: r.error, detail: null }
      )
      return null
    }
    if (onDone) onDone(r)
    return r
  }

  /** Stripe owns checkout and the portal; we only hand the browser the link. */
  const leaveFor = (r) => {
    if (r.url) {
      window.location.assign(r.url)
      return
    }
    setBillingNote({
      tone: 'warn',
      title: 'Stripe did not return a link',
      body: 'Nothing has been charged. Try again in a moment.',
      detail: null,
    })
  }

  const goPortal = (key) => runBilling(key, openPortal, leaveFor)

  const purchasablePlans = (catalogue?.plans || []).filter((p) => p.purchasable)
  const topupPacks = catalogue?.topups || []
  const currentPlanKey = plan?.planKey || null
  const catalogueEntry = purchasablePlans.find((p) => p.key === currentPlanKey) || null
  // /api/billing/me carries the plan's own monthly grant, so the progress bar
  // has a denominator without a second request. The catalogue is the fallback
  // only — reading it first would suppress the bar whenever that call fails,
  // which is a blank meter for a reason the user cannot see.
  const allowance = plan?.monthlyCredits ?? catalogueEntry?.monthlyCredits ?? 0
  const rolloverCap = plan?.rolloverCap ?? billing?.balance?.rolloverCap ?? 0
  const subStatus = subscription?.status || 'none'
  const hasSubscription = ['active', 'past_due', 'unpaid'].includes(subStatus)
  const monthlyPct = allowance > 0 ? Math.max(0, Math.min(100, (monthlyCredits / allowance) * 100)) : 0

  const planPrice = (p) => (cycle === 'annual' && p.annualUsd != null ? p.annualUsd : p.priceUsd)
  const planPer = (p) => (cycle === 'annual' && p.annualUsd != null ? '/year' : '/month')

  const choosePlan = (p) => {
    // Moving between plans is a subscription update; arriving at a first paid
    // plan is a checkout. Sending an update for someone with no subscription
    // would have nothing to update.
    if (hasSubscription) {
      return runBilling(`plan:${p.key}`, () => changePlan({ planKey: p.key, interval: cycle }), (r) => {
        flash(r.message || 'Plan updated')
        refreshBilling()
        setLedgerLoaded(false)
      })
    }
    return runBilling(`plan:${p.key}`, () => createCheckout({ planKey: p.key, interval: cycle }), leaveFor)
  }

  const buyTopup = (pack) =>
    runBilling(`topup:${pack.key}`, () => createCheckout({ topupPack: pack.key }), leaveFor)

  const doCancel = () =>
    runBilling('cancel', cancelSubscription, (r) => {
      flash(r.message || 'Your plan will not renew')
      refreshBilling()
    })

  const doResume = () =>
    runBilling('resume', resumeSubscription, (r) => {
      flash(r.message || 'Your plan will renew as normal')
      refreshBilling()
    })

  const doRedeem = async (e) => {
    e.preventDefault()
    const code = inviteCode.trim()
    if (!code) return
    setBusy('invite')
    setInviteNote(null)
    const r = await redeemInvite(code)
    setBusy(null)
    if (!r.success) {
      // The backend distinguishes revoked / expired / exhausted / already
      // redeemed, and the difference is the whole point — each one has a
      // different next step for the reader.
      setInviteNote({ ok: false, text: r.error })
      return
    }
    setInviteNote({ ok: true, text: r.message || 'Invite redeemed' })
    setInviteCode('')
    refreshBilling()
    setLedgerLoaded(false)
  }

  const billingReady = Boolean(billing)
  // A balance that flickers to zero reads as "my credits are gone", so nothing
  // numeric renders until there is a real payload behind it.
  const billingBlocked = !billingReady && !billingLoading && billingError

  return (
    <div className="settings-page">
      <div className="set-wrap">
        <div className="set-index">
          <div className="set-id-card">
            <img src={AVATAR} alt="" />
            <div>
              <div className="nm">{s.name}</div>
              <div className="pl">
                {S.crown} Casual plan
              </div>
            </div>
          </div>
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              className={`set-navitem ${active === sec.id ? 'active' : ''}`}
              onClick={() => go(sec.id)}
            >
              {sec.icon}
              <span>{sec.label}</span>
            </button>
          ))}
          <div className={`set-saved ${savedFlash ? '' : 'idle'}`}>
            {savedFlash ? S.check : S.bolt}
            {savedFlash ? 'Saved' : 'Auto-saves as you go'}
          </div>
        </div>

        <div className="set-content" ref={contentRef}>
          <div className="set-content-inner">
          <div className="set-pagehead">
            <h1>Settings</h1>
            <p>Tune Decipher to the way you create. Everything here saves automatically.</p>
          </div>

          <section className="set-sec" id="account" ref={reg('account')}>
            <SecHead icon={S.user} title="Account" desc="Your author identity across Decipher." />
            <div className="set-card">
              <div className="set-row col">
                <div className="set-avatar">
                  <img src={AVATAR} alt="" />
                  <div className="av-info">
                    <div className="av-t">Profile photo</div>
                    <div className="av-d">PNG or JPG, at least 256×256px.</div>
                    <div className="row">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => flash('Upload coming soon')}>
                        Change
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => flash('Photo removed')}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="set-row col">
                <div className="set-grid2">
                  <div>
                    <label className="set-flabel" htmlFor="set-name">
                      Display name
                    </label>
                    <input id="set-name" className="set-input" value={s.name} onChange={(e) => set('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="set-flabel" htmlFor="set-username">
                      Username
                    </label>
                    <input
                      id="set-username"
                      className="set-input"
                      value={s.username}
                      onChange={(e) => set('username', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="set-row col">
                <div>
                  <label className="set-flabel" htmlFor="set-email">
                    Email
                  </label>
                  <input
                    id="set-email"
                    className="set-input"
                    type="email"
                    value={s.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                </div>
              </div>
              <div className="set-row col">
                <div>
                  <label className="set-flabel" htmlFor="set-tagline">
                    Author tagline
                  </label>
                  <textarea
                    id="set-tagline"
                    className="set-input area"
                    value={s.tagline}
                    onChange={(e) => set('tagline', e.target.value)}
                    placeholder="A line that sums up your stories…"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="set-sec" id="plan" ref={reg('plan')}>
            <SecHead icon={S.crown} title="Plan & Usage" desc="Your plan, your credits, and where every one of them went." />

            {billingBlocked && (
              <BillingNote
                tone="warn"
                icon={S.warn}
                title="We couldn't load your billing"
                body={billingError}
                detail="Nothing has changed on your account."
              >
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => refreshBilling()}>
                  Try again
                </button>
              </BillingNote>
            )}

            {!billingReady && !billingBlocked && (
              <div className="set-plan set-plan-skel">
                <div>
                  <div className="pt">Loading your plan…</div>
                  <div className="pd">One moment while we fetch your balance.</div>
                </div>
              </div>
            )}

            {billingReady && (
              <>
                <div className="set-plan">
                  <div>
                    <div className="pt">
                      {plan.label} <span className="badge">Current</span>
                    </div>
                    <div className="pd">
                      {plan.priceUsd > 0 ? `${fmtUsd(plan.priceUsd)} a month` : 'No monthly charge'}
                      {allowance > 0 ? ` · ${formatCredits(allowance)} credits each month` : ''}
                    </div>
                    <div className="set-unlocks">
                      <span className="ul">
                        {S.check} {(plan.tiers || []).map(tierLabel).join(', ')} models
                      </span>
                      <span className={`ul ${plan.narration ? '' : 'off'}`}>
                        {plan.narration ? S.check : S.warn} {plan.narration ? 'Narration included' : 'Narration not included'}
                      </span>
                      <span className={`ul ${plan.images ? '' : 'off'}`}>
                        {plan.images ? S.check : S.warn} {plan.images ? 'Image generation' : 'No image generation'}
                      </span>
                    </div>
                  </div>
                  <div className="set-plan-acts">
                    {subscription?.cancelAtPeriodEnd ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-md"
                        disabled={busy === 'resume'}
                        onClick={doResume}
                      >
                        {S.crown} {busy === 'resume' ? 'Resuming…' : 'Resume plan'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-md"
                        onClick={() => pickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {S.crown} {hasSubscription ? 'Change plan' : 'See plans'}
                      </button>
                    )}
                    {hasSubscription && !subscription?.cancelAtPeriodEnd && (
                      <button type="button" className="btn btn-ghost btn-sm" disabled={busy === 'cancel'} onClick={doCancel}>
                        {busy === 'cancel' ? 'Cancelling…' : 'Cancel plan'}
                      </button>
                    )}
                  </div>
                </div>

                {subscription?.cancelAtPeriodEnd && (
                  <BillingNote
                    tone="warn"
                    icon={S.warn}
                    title="This plan will not renew"
                    body={
                      fmtDate(subscription.currentPeriodEnd)
                        ? `You keep ${plan.label} and everything on it until ${fmtDate(subscription.currentPeriodEnd)}. After that the account moves to the free plan.`
                        : `You keep ${plan.label} until the end of the period you have already paid for.`
                    }
                  >
                    <button type="button" className="btn btn-primary btn-sm" disabled={busy === 'resume'} onClick={doResume}>
                      {busy === 'resume' ? 'Resuming…' : 'Resume plan'}
                    </button>
                  </BillingNote>
                )}

                {subStatus === 'past_due' && (
                  <BillingNote
                    tone="warn"
                    icon={S.warn}
                    title="A payment didn't go through"
                    body={
                      fmtDate(subscription?.graceUntil)
                        ? `Your plan keeps working until ${fmtDate(subscription.graceUntil)} while we retry the card. Updating it now avoids any interruption.`
                        : 'Your plan keeps working while we retry the card. Updating it now avoids any interruption.'
                    }
                  >
                    <button type="button" className="btn btn-primary btn-sm" disabled={busy === 'portal-dunning'} onClick={() => goPortal('portal-dunning')}>
                      {busy === 'portal-dunning' ? 'Opening…' : 'Update payment'}
                    </button>
                  </BillingNote>
                )}

                {frozen && (
                  <BillingNote
                    tone="warn"
                    icon={S.warn}
                    title="Your account is on hold"
                    body="A billing issue is being resolved. Your stories are unaffected — nothing has been deleted, and you can still read and export everything you've written."
                    detail={frozen.reason || null}
                  >
                    <button type="button" className="btn btn-primary btn-sm" disabled={busy === 'portal-frozen'} onClick={() => goPortal('portal-frozen')}>
                      {busy === 'portal-frozen' ? 'Opening…' : 'Manage billing'}
                    </button>
                  </BillingNote>
                )}

                {billingNote && (
                  <BillingNote
                    tone={billingNote.tone}
                    icon={S.warn}
                    title={billingNote.title}
                    body={billingNote.body}
                    detail={billingNote.detail}
                  >
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBillingNote(null)}>
                      Dismiss
                    </button>
                  </BillingNote>
                )}

                {/* One pool, one number — then the two things it is made of. */}
                <div className="set-card" style={{ marginTop: 16 }}>
                  <div className="set-balance">
                    <div className="bal-head">
                      <div>
                        <div className="bl">Credit balance</div>
                        <div className="bv">
                          {formatCredits(balance)} <span>credits</span>
                        </div>
                      </div>
                      <div className="bal-note">
                        One pool. Everything — stories, narration, images — draws from the same balance,
                        and every action shows its price before you commit to it.
                      </div>
                    </div>

                    {allowance > 0 && (
                      <div className="set-meter">
                        <div className="mh">
                          <span className="k">Monthly credits left</span>
                          <span className="v">
                            <b>{formatCredits(monthlyCredits)}</b> / {formatCredits(allowance)}
                          </span>
                        </div>
                        <div className="bar">
                          <i className={monthlyPct < 20 ? 'warn' : ''} style={{ width: `${monthlyPct}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="set-splits">
                      <div className="set-split">
                        <div className="sl">Monthly credits</div>
                        <div className="sv">{formatCredits(monthlyCredits)}</div>
                        <div className="sd">
                          {fmtDate(resetsAt) ? `Resets ${fmtDate(resetsAt)}.` : 'This plan has no monthly refresh.'}
                          {rolloverCap > 0
                            ? ` Anything left rolls over, up to ${formatCredits(rolloverCap)} credits — beyond that it expires at the reset.`
                            : ''}
                        </div>
                      </div>
                      <div className="set-split">
                        <div className="sl">Purchased credits</div>
                        <div className="sv">{formatCredits(purchasedCredits)}</div>
                        <div className="sd">
                          Bought or granted. These never expire and are untouched by the monthly reset.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Plan picker */}
            <div className="set-card" ref={pickerRef}>
              <div className="set-row">
                <div className="rt">
                  <div className="rl">Plans</div>
                  <div className="rd">
                    An upgrade bills today and the new credits arrive with that invoice. A downgrade takes
                    effect at the end of the period you have already paid for.
                  </div>
                </div>
                <div className="rc">
                  <div className="set-seg">
                    {[
                      ['monthly', 'Monthly'],
                      ['annual', 'Yearly'],
                    ].map(([id, l]) => (
                      <button key={id} type="button" className={cycle === id ? 'on' : ''} onClick={() => setCycle(id)}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="set-row col">
                {catalogueError && <div className="set-empty">{catalogueError}</div>}
                {!catalogue && !catalogueError && <div className="set-empty">Loading plans…</div>}
                {catalogue && purchasablePlans.length === 0 && !catalogueError && (
                  <div className="set-empty">No plans are on sale right now.</div>
                )}
                {purchasablePlans.length > 0 && (
                  <div className="set-plangrid">
                    {purchasablePlans.map((p) => {
                      const current = p.key === currentPlanKey
                      const isUpgrade = (p.priceUsd ?? 0) > (plan?.priceUsd ?? 0)
                      const key = `plan:${p.key}`
                      return (
                        <div key={p.key} className={`set-plancard ${current ? 'on' : ''}`}>
                          <div className="ph">
                            <span className="pn">{p.label}</span>
                            {current && <span className="badge">Current</span>}
                          </div>
                          <div className="pp">
                            {fmtUsd(planPrice(p))}
                            <span>{planPer(p)}</span>
                          </div>
                          <div className="pc">{formatCredits(p.monthlyCredits)} credits a month</div>
                          <ul className="pf">
                            <li>
                              {S.check} {(p.tiers || []).map(tierLabel).join(', ')} models
                            </li>
                            <li className={p.narration ? '' : 'off'}>
                              {S.check} {p.narration ? 'Narration' : 'No narration'}
                            </li>
                            <li>
                              {S.check} Rolls over up to {formatCredits(p.rolloverCap)}
                            </li>
                          </ul>
                          <button
                            type="button"
                            className={`btn ${current ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                            disabled={current || busy === key || !billingReady}
                            onClick={() => choosePlan(p)}
                          >
                            {busy === key
                              ? 'Working…'
                              : current
                                ? 'Current plan'
                                : !hasSubscription
                                  ? `Choose ${p.label}`
                                  : isUpgrade
                                    ? 'Upgrade — bills today'
                                    : 'Downgrade at period end'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Top-ups */}
            <div className="set-card">
              <div className="set-row">
                <div className="rt">
                  <div className="rl">Top up credits</div>
                  <div className="rd">
                    A one-off pack for a heavy week. These credits never expire and sit alongside your
                    monthly ones.
                  </div>
                </div>
              </div>
              <div className="set-row col">
                {!catalogue && !catalogueError && <div className="set-empty">Loading packs…</div>}
                {topupPacks.length > 0 && (
                  <div className="set-topups">
                    {topupPacks.map((pack) => {
                      const key = `topup:${pack.key}`
                      return (
                        <button
                          key={pack.key}
                          type="button"
                          className="set-topup"
                          disabled={busy === key || !billingReady}
                          onClick={() => buyTopup(pack)}
                        >
                          <span className="tc">
                            {S.bolt} {formatCredits(pack.credits)}
                          </span>
                          <span className="tl">credits</span>
                          <span className="tp">{busy === key ? 'Working…' : fmtUsd(pack.priceUsd)}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Invite code */}
            <div className="set-card">
              <div className="set-row">
                <div className="rt">
                  <div className="rl">Invite code</div>
                  <div className="rd">Have a code? Redeem it for credits and whatever it unlocks.</div>
                </div>
                <div className="rc">
                  <form className="set-invite" onSubmit={doRedeem}>
                    <input
                      className="set-input"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Enter code"
                      aria-label="Invite code"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={busy === 'invite' || !inviteCode.trim()}>
                      {busy === 'invite' ? 'Redeeming…' : 'Redeem'}
                    </button>
                  </form>
                </div>
              </div>
              {inviteNote && (
                <div className="set-row">
                  <div className={`set-invite-note ${inviteNote.ok ? 'ok' : 'bad'}`}>
                    {inviteNote.ok ? S.check : S.warn}
                    <span>{inviteNote.text}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Credit history */}
            <div className="set-card">
              <div className="set-row">
                <div className="rt">
                  <div className="rl">Credit history</div>
                  <div className="rd">
                    Every charge and every refund, newest first. A refund is its own row so you can see it
                    land.
                  </div>
                </div>
                <div className="rc">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={ledgerBusy}
                    onClick={() => {
                      setLedgerCursor(null)
                      loadLedger(null)
                    }}
                  >
                    {ledgerBusy ? 'Loading…' : 'Refresh'}
                  </button>
                </div>
              </div>
              <div className="set-row col">
                {ledgerError && <div className="set-empty">{ledgerError}</div>}
                {!ledgerError && !ledgerLoaded && <div className="set-empty">Loading your history…</div>}
                {!ledgerError && ledgerLoaded && ledger.length === 0 && (
                  <div className="set-empty">Nothing here yet. Your first story will show up as a row.</div>
                )}
                {ledger.length > 0 && (
                  <div className="set-ledger">
                    {ledger.map((e, i) => {
                      const d = describeLedgerEntry(e)
                      const hint = ledgerHint(e)
                      return (
                        <div className="led-row" key={`${e.createdAt}-${i}`}>
                          <div className="led-l">
                            <div className="led-t">
                              {d.label}
                              {isRefund(e) && <span className="led-tag">Refunded</span>}
                            </div>
                            <div className="led-d">
                              {fmtShortDate(e.createdAt)}
                              {hint ? ` · ${hint}` : ''}
                            </div>
                          </div>
                          <div className="led-r">
                            <div className={`led-amt ${d.positive ? 'pos' : 'neg'}`}>{d.signed}</div>
                            {typeof e.balanceAfter === 'number' && (
                              <div className="led-bal">{formatCredits(e.balanceAfter)} left</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {ledgerCursor && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm set-loadmore"
                    disabled={ledgerBusy}
                    onClick={() => loadLedger(ledgerCursor)}
                  >
                    {ledgerBusy ? 'Loading…' : 'Load more'}
                  </button>
                )}
              </div>
            </div>

            {/* Stripe owns cards and invoices — nothing about them lives here. */}
            <div className="set-card">
              <Row title="Manage billing" desc="Payment method, address and cancellation, on Stripe's secure portal.">
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy === 'portal'} onClick={() => goPortal('portal')}>
                  {busy === 'portal' ? 'Opening…' : 'Manage'}
                </button>
              </Row>
              <Row title="Invoices & receipts" desc="Download anything you've been charged for.">
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy === 'invoices'} onClick={() => goPortal('invoices')}>
                  {S.download} {busy === 'invoices' ? 'Opening…' : 'Invoices'}
                </button>
              </Row>
            </div>
          </section>

          <section className="set-sec">
            <div className="set-card set-danger">
              <SecHead icon={S.warn} title="Danger zone" />
              <Row title="Delete account" desc="Permanently erase your account and everything in it. This cannot be undone.">
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmDel(true)}>
                  Delete account
                </button>
              </Row>
            </div>
          </section>

          </div>
        </div>
      </div>

      {confirmDel && (
        <div className="set-modal-ov" onClick={() => setConfirmDel(false)}>
          <div className="set-modal" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className="mi">{S.warn}</div>
            <h3>Delete your account?</h3>
            <p>
              Every story, character, scenario and image you&apos;ve made will be permanently removed. This action
              can&apos;t be reversed.
            </p>
            <div className="foot">
              <button type="button" className="btn btn-ghost btn-md" onClick={() => setConfirmDel(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-md"
                onClick={() => {
                  setConfirmDel(false)
                  flash('Account deletion is disabled in this demo')
                }}
              >
                Delete forever
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="set-toast">
          {S.check}
          {toast}
        </div>
      )}
    </div>
  )
}

export default Settings
