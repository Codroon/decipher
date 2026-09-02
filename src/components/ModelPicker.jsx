import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { formatCredits } from '../services/billingService'
import './ModelPicker.css'

/**
 * The writing-model picker.
 *
 * This was a native <select>, which cannot be styled and — more to the point —
 * can only render one line of text per row. That forced every fact about a
 * model into one string ("Claude Fable 5 · 18 cr · flagship — locked, Studio
 * unlocks it") and left the catalogue's own blurbs unused, so the reader had to
 * already know what the models were to choose between them.
 *
 * Rows are grouped by tier because the tiers ARE the cost ladder — flagship 18,
 * workhorse 8, value 2, budget 1 — so the price descends as you scroll and the
 * spread is legible without a chart. The group header carries that class's
 * range, which is the fact someone scanning is actually after.
 */

const TIER_ORDER = ['flagship', 'workhorse', 'value', 'budget']

const TIER_LABELS = {
  flagship: 'Flagship',
  workhorse: 'Workhorse',
  value: 'Value',
  budget: 'Budget',
}

const TIER_NOTES = {
  flagship: 'Best prose. Save it for the scenes that matter.',
  workhorse: 'The quality sweet spot.',
  value: 'Strong writers, low cost.',
  budget: 'Fastest, cheapest, built for volume.',
}

const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const Lock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.4" />
    <path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9" />
  </svg>
)

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)

function ModelPicker({ models, value, onChange, describeModel, disabled = false }) {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState(value)
  // Where the panel goes and how tall it may be, measured rather than assumed.
  const [place, setPlace] = useState({ up: false, maxHeight: 384 })
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const triggerRef = useRef(null)

  const decorated = useMemo(
    () => models.map((m) => ({ ...m, ...describeModel(m) })),
    [models, describeModel]
  )

  const selected = decorated.find((m) => m.id === value) || null

  // Grouped, and only tiers that actually have models — an empty "Flagship"
  // header on a catalogue that has none would be a promise the list cannot keep.
  const groups = useMemo(() => {
    return TIER_ORDER
      .map((tier) => ({ tier, items: decorated.filter((m) => m.tier === tier) }))
      .filter((g) => g.items.length > 0)
      .map((g) => {
        const prices = g.items.map((m) => m.price).filter((p) => p != null)
        const low = prices.length ? Math.min(...prices) : null
        const high = prices.length ? Math.max(...prices) : null
        return {
          ...g,
          range: low == null ? null : low === high ? `${low} cr` : `${low}–${high} cr`,
        }
      })
  }, [decorated])

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])

  // Close on an outside click or Escape. Without the first, the panel survives
  // a click on the story itself, which is the most likely next thing someone does.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  /**
   * Fit the panel to the space that actually exists.
   *
   * The picker lives in a narrow right-hand rail, low on the page, so a fixed
   * 384px panel anchored below the trigger runs straight off the bottom of the
   * viewport — the last rows become unreachable without scrolling the page
   * behind an open dropdown. Measure the gap above and below, open into
   * whichever is larger, and cap the height to what is there.
   */
  useLayoutEffect(() => {
    if (!open) return

    const fit = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const GAP = 8
      const MARGIN = 16
      const below = window.innerHeight - rect.bottom - GAP - MARGIN
      const above = rect.top - GAP - MARGIN
      const up = below < 260 && above > below
      setPlace({ up, maxHeight: Math.max(200, Math.min(384, up ? above : below)) })
    }

    fit()
    window.addEventListener('resize', fit)
    window.addEventListener('scroll', fit, true)
    return () => {
      window.removeEventListener('resize', fit)
      window.removeEventListener('scroll', fit, true)
    }
  }, [open])

  // Land on the current model rather than at the top. Locked models sit above
  // the affordable ones (the list runs most to least expensive), so a free
  // reader would otherwise open the panel onto four rows they cannot pick.
  useEffect(() => {
    if (!open) return
    setActiveId(value)
    const row = listRef.current?.querySelector('[data-active="true"]')
    // 'center' rather than 'nearest' for the initial open: 'nearest' can leave
    // the selected row flush against a clipped neighbour, which reads as a
    // rendering fault rather than as a scrolled list.
    row?.scrollIntoView({ block: 'center' })
  }, [open, value])

  const commit = (m) => {
    if (m.locked) return
    onChange(m.id)
    setOpen(false)
  }

  const move = (step) => {
    if (!flat.length) return
    const at = flat.findIndex((m) => m.id === activeId)
    const next = flat[Math.max(0, Math.min(flat.length - 1, (at < 0 ? 0 : at) + step))]
    if (!next) return
    setActiveId(next.id)
    listRef.current
      ?.querySelector(`[data-id="${CSS.escape(next.id)}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    switch (e.key) {
      case 'Escape': e.preventDefault(); setOpen(false); break
      case 'ArrowDown': e.preventDefault(); move(1); break
      case 'ArrowUp': e.preventDefault(); move(-1); break
      case 'Home': e.preventDefault(); setActiveId(flat[0]?.id); break
      case 'End': e.preventDefault(); setActiveId(flat[flat.length - 1]?.id); break
      case 'Enter':
      case ' ': {
        e.preventDefault()
        const m = flat.find((x) => x.id === activeId)
        // Locked rows stay reachable by keyboard on purpose: a screen-reader
        // user should be able to hear that the model exists and what unlocks
        // it, exactly as a sighted one can see it.
        if (m) commit(m)
        break
      }
      default: break
    }
  }

  return (
    <div className={`mp ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="mp-trigger"
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {/* The model name gets the full width of a narrow rail, with the tier
            and price on a second line. Sharing one row with a price badge left
            about 148px for the name, which truncated "Gemini 3.1 Flash Lite"
            to "Gemini 3.1 Fla…" — the picker's own label unreadable. */}
        <span className="mp-trigger-main">
          <span className="mp-trigger-name">{selected?.label || 'Choose a model'}</span>
          <span className="mp-trigger-meta">
            {selected?.tier && <span className="mp-trigger-tier">{TIER_LABELS[selected.tier]}</span>}
            {selected?.price != null && (
              <span className="mp-trigger-price">{formatCredits(selected.price)} cr</span>
            )}
          </span>
        </span>
        <span className="mp-chev"><Chevron /></span>
      </button>

      {open && (
        <div
          className={`mp-panel ${place.up ? 'is-up' : ''}`}
          style={{ maxHeight: `${place.maxHeight}px` }}
          role="listbox"
          aria-label="Writing model"
          ref={listRef}
          tabIndex={-1}
          onKeyDown={onKeyDown}
        >
          {groups.map((group) => (
            <div className="mp-group" key={group.tier}>
              <div className="mp-group-head">
                <span className="mp-group-name">{TIER_LABELS[group.tier]}</span>
                {group.range && <span className="mp-group-range">{group.range}</span>}
              </div>
              <p className="mp-group-note">{TIER_NOTES[group.tier]}</p>

              {group.items.map((m) => {
                const isSelected = m.id === value
                const isActive = m.id === activeId
                return (
                  <div
                    key={m.id}
                    data-id={m.id}
                    data-active={isActive}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={m.locked}
                    className={`mp-row ${isSelected ? 'is-selected' : ''} ${isActive ? 'is-active' : ''} ${m.locked ? 'is-locked' : ''}`}
                    onMouseEnter={() => setActiveId(m.id)}
                    onClick={() => commit(m)}
                  >
                    <span className="mp-row-mark">
                      {m.locked ? <Lock /> : isSelected ? <Check /> : null}
                    </span>

                    <span className="mp-row-body">
                      <span className="mp-row-top">
                        <span className="mp-row-name">{m.label || m.id}</span>
                        {m.isDefault && <span className="mp-row-flag">Default</span>}
                      </span>
                      <span className="mp-row-note">
                        {/* A locked row spends its one line of description on
                            the way out of the lock, not on prose it cannot
                            deliver. */}
                        {m.locked
                          ? m.unlock ? `${m.unlock.label} unlocks this model` : 'Not on your plan'
                          : m.blurb}
                      </span>
                    </span>

                    {m.price != null && (
                      <span className="mp-row-price">
                        <b>{formatCredits(m.price)}</b>
                        <span>cr</span>
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {/* One line, at the bottom, because the credit column is the panel's
              organising idea and it is otherwise unlabelled — and because the
              figures move with the length setting, which is not obvious. */}
          <p className="mp-foot">Credits are per passage, at your chosen length.</p>
        </div>
      )}
    </div>
  )
}

export default ModelPicker
