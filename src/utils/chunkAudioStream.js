/**
 * Concatenate two Uint8Arrays.
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {Uint8Array}
 */
export function mergeUint8(a, b) {
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0)
  out.set(b, a.length)
  return out
}

/**
 * Read a stream of uint32-LE length prefixed frames (raw bytes per frame).
 * @param {ReadableStreamDefaultReader<Uint8Array>} reader
 * @param {(frame: Uint8Array) => void} onFrame
 * @param {AbortSignal} signal
 */
export async function readLengthPrefixedFrames(reader, onFrame, signal) {
  let pending = new Uint8Array(0)

  while (true) {
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    const { done, value } = await reader.read()
    if (value?.length) {
      pending = mergeUint8(pending, value)
    }

    while (pending.length >= 4) {
      const len = new DataView(pending.buffer, pending.byteOffset, 4).getUint32(0, true)
      if (len === 0) {
        pending = pending.subarray(4)
        continue
      }
      if (len > 80 * 1024 * 1024) {
        throw new Error('Invalid audio frame length')
      }
      if (pending.length < 4 + len) {
        break
      }
      const frame = pending.slice(4, 4 + len)
      pending = pending.subarray(4 + len)
      onFrame(frame)
    }

    if (done) {
      if (pending.length > 0) {
        throw new Error('Truncated audio stream')
      }
      break
    }
  }
}
