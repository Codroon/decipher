import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleIcon } from './AuthShared'

/**
 * Google sign-in, rendered as one of our own buttons.
 *
 * Uses the authorization-code popup flow (`initCodeClient`) rather than the
 * credential flow. The reason is purely presentational: the credential flow
 * requires Google's own rendered button, which is a cross-origin iframe whose
 * font, radius and colours cannot be reached from our CSS. The code flow hands
 * the result to a JS callback, so the trigger can be any element we like — this
 * one reuses `.auth-social`, so it matches the submit button exactly.
 *
 * The popup returns a one-time authorization code, not an identity. It is
 * useless on its own: only the backend can redeem it, using the client secret.
 *
 * `ux_mode: 'popup'` means there is no HTTP redirect, so nothing needs to go in
 * "Authorised redirect URIs" — but the page origin must still be listed under
 * "Authorised JavaScript origins" for this client id.
 */

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Identity only. Asking for nothing beyond this keeps the consent screen to a
// single line and avoids Google's app-verification requirements.
const SCOPE = 'openid email profile'

// One shared load across every mount — both auth forms use this component, and
// the script must not be injected twice.
let gisPromise = null
function loadGis() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gisPromise) return gisPromise

  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('load failed')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      gisPromise = null // let a later mount retry
      reject(new Error('load failed'))
    }
    document.head.appendChild(script)
  })
  return gisPromise
}

/**
 * @param {(code: string) => void} onCode called with the one-time auth code
 * @param {string} [label] button text — must keep Google's name in it
 * @param {boolean} [disabled]
 * @param {(message: string) => void} [onError]
 */
function GoogleSignInButton({
  onCode,
  label = 'Continue with Google',
  disabled = false,
  onError
}) {
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const clientRef = useRef(null)

  // Google's callbacks are registered once, so route them through refs rather
  // than capturing the props that happened to be current at init.
  const codeRef = useRef(onCode)
  const errorRef = useRef(onError)
  useEffect(() => { codeRef.current = onCode }, [onCode])
  useEffect(() => { errorRef.current = onError }, [onError])

  useEffect(() => {
    if (!CLIENT_ID) {
      setFailed(true)
      return
    }
    let cancelled = false

    loadGis()
      .then(() => {
        if (cancelled) return
        clientRef.current = window.google.accounts.oauth2.initCodeClient({
          client_id: CLIENT_ID,
          scope: SCOPE,
          ux_mode: 'popup',
          callback: (response) => {
            if (response?.code) {
              codeRef.current?.(response.code)
            } else if (response?.error && response.error !== 'access_denied') {
              errorRef.current?.('Google sign-in was not completed. Please try again.')
            }
          },
          // Fires for popup-level problems (blocked by the browser, closed
          // early). `access_denied` is the user changing their mind — silent.
          error_callback: (err) => {
            if (err?.type === 'popup_closed' || err?.type === 'popup_failed_to_open') {
              errorRef.current?.(
                err.type === 'popup_failed_to_open'
                  ? 'Your browser blocked the Google popup. Allow popups for this site and try again.'
                  : ''
              )
            }
          }
        })
        setReady(true)
      })
      .catch(() => {
        if (cancelled) return
        setFailed(true)
        errorRef.current?.('Google sign-in is unavailable right now. Use your email and password.')
      })

    return () => { cancelled = true }
  }, [])

  const handleClick = useCallback(() => {
    if (!clientRef.current) return
    clientRef.current.requestCode()
  }, [])

  // Nothing to fall back to — the email/password form is right there, so stay
  // quiet rather than showing a control that cannot work.
  if (failed) return null

  return (
    <div className="auth-social">
      <button type="button" onClick={handleClick} disabled={disabled || !ready}>
        {GoogleIcon}
        <span>{label}</span>
      </button>
    </div>
  )
}

export default GoogleSignInButton
