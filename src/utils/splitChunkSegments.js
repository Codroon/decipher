/**
 * Split chunk text into TTS/stream fragments. Must stay in sync with
 * splitChunkSegments in Decipher-Backend/services/ttsService.js
 * (no [DIAG] logs in the browser build).
 */

const MAX_TTS_FRAGMENT_CHARS = 180
const MIN_TTS_FRAGMENT_CHARS = 40
const EM_DASH = '\u2014'

/**
 * @param {string} s
 * @param {number} commaIndex
 * @returns {number}
 */
function countWordsAfterCommaUntilBoundary(s, commaIndex) {
  let j = commaIndex + 1
  while (j < s.length && /\s/.test(s[j])) j++
  if (j >= s.length) return 0

  let end = j
  while (end < s.length) {
    const ch = s[end]
    if (ch === '\r') {
      end++
      continue
    }
    if (ch === '\n') break
    if (ch === EM_DASH) break
    if ('!?;'.includes(ch)) break
    if (ch === ',') break
    if (ch === ':') {
      const prevDigit = end > 0 && /\d/.test(s[end - 1])
      const nextDigit = end + 1 < s.length && /\d/.test(s[end + 1])
      if (!(prevDigit && nextDigit)) break
    }
    if (ch === '.' && s[end + 1] === '.' && s[end + 2] === '.') break
    if (ch === '.') {
      const prevDigit = end > 0 && /\d/.test(s[end - 1])
      const nextDigit = end + 1 < s.length && /\d/.test(s[end + 1])
      if (!(prevDigit && nextDigit)) break
    }
    end++
  }
  const slice = s.slice(j, end).trim()
  if (!slice) return 0
  return slice.split(/\s+/).filter(Boolean).length
}

function splitOnNaturalPunctuation(raw) {
  const s = raw.trim()
  if (!s) return []

  const fragments = []
  let buf = ''

  const flush = () => {
    const t = buf.trim()
    if (t) fragments.push(t)
    buf = ''
  }

  let i = 0
  while (i < s.length) {
    const c = s[i]

    if (c === '\r') {
      i++
      continue
    }
    if (c === '\n') {
      flush()
      i++
      continue
    }

    if (c === '.' && s[i + 1] === '.' && s[i + 2] === '.') {
      buf += '...'
      flush()
      i += 3
      continue
    }

    if (c === EM_DASH) {
      buf += EM_DASH
      flush()
      i++
      continue
    }

    if ('!?;'.includes(c)) {
      buf += c
      flush()
      i++
      continue
    }

    if (c === ':') {
      const prevDigit = i > 0 && /\d/.test(s[i - 1])
      const nextDigit = i + 1 < s.length && /\d/.test(s[i + 1])
      if (prevDigit && nextDigit) {
        buf += c
        i++
        continue
      }
      buf += c
      flush()
      i++
      continue
    }

    if (c === '.') {
      const prevDigit = i > 0 && /\d/.test(s[i - 1])
      const nextDigit = i + 1 < s.length && /\d/.test(s[i + 1])
      if (prevDigit && nextDigit) {
        buf += c
        i++
        continue
      }
      buf += c
      flush()
      i++
      continue
    }

    if (c === ',') {
      const wordsAfter = countWordsAfterCommaUntilBoundary(s, i)
      if (wordsAfter > 5) {
        buf += c
        flush()
      } else {
        buf += c
      }
      i++
      continue
    }

    buf += c
    i++
  }

  flush()
  return fragments
}

function fragmentEndsWithSentenceBoundary(s) {
  let t = s.trimEnd()
  if (!t) return false
  while (t.length > 0 && /['")\]]/.test(t[t.length - 1])) {
    t = t.slice(0, -1).trimEnd()
  }
  if (!t) return false
  if (t.endsWith('...')) return true
  const ch = t[t.length - 1]
  return ch === '.' || ch === '!' || ch === '?'
}

function mergeFragmentsUnderMinLength(fragments, minLen) {
  if (fragments.length === 0) return []
  const out = []
  let idx = 0
  while (idx < fragments.length) {
    let cur = fragments[idx++]
    while (cur.length < minLen && idx < fragments.length) {
      if (fragmentEndsWithSentenceBoundary(cur)) break
      cur += fragments[idx++]
    }
    const t = cur.trim()
    if (t) out.push(t)
  }
  return out
}

function splitFragmentAtWhitespaceMaxLen(str, maxLen) {
  const t = str.trim()
  if (!t) return []
  if (t.length <= maxLen) return [t]

  const parts = []
  let rest = t
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf(' ', maxLen)
    if (cut <= 0) {
      cut = rest.indexOf(' ', maxLen)
      if (cut <= 0) {
        parts.push(rest)
        return parts
      }
    }
    parts.push(rest.slice(0, cut).trimEnd())
    rest = rest.slice(cut).trimStart()
  }
  if (rest) parts.push(rest)
  return parts
}

function applyMaxLengthWhitespaceSplit(fragments, maxLen) {
  const out = []
  for (const f of fragments) {
    out.push(...splitFragmentAtWhitespaceMaxLen(f, maxLen))
  }
  return out
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function splitChunkSegments(text) {
  const raw = text.trim()
  if (!raw) return []

  let fr = splitOnNaturalPunctuation(raw)
  fr = mergeFragmentsUnderMinLength(fr, MIN_TTS_FRAGMENT_CHARS)
  fr = applyMaxLengthWhitespaceSplit(fr, MAX_TTS_FRAGMENT_CHARS)
  return fr.map((x) => x.trim()).filter(Boolean)
}
