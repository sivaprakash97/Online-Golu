import { useState } from 'react'
import { SMALL_SCREEN, useMedia } from '../lib/device.js'

// The Golu is at its best on a computer. On phone-sized screens we say so first, with a way to
// send the link to a computer, then let people carry on (the phone version is still new).
const SKIP_KEY = 'golu.mobileAnyway'

const readSkip = () => {
  try {
    return sessionStorage.getItem(SKIP_KEY) === '1'
  } catch {
    return false
  }
}

export function useDesktopGate() {
  const small = useMedia(SMALL_SCREEN)
  const [skipped, setSkipped] = useState(readSkip)
  const skip = () => {
    try {
      sessionStorage.setItem(SKIP_KEY, '1')
    } catch {
      /* private mode: just this visit */
    }
    setSkipped(true)
  }
  return { blocked: small && !skipped, skip }
}

export default function DesktopOnly({ onSkip }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    const url = location.origin + location.pathname + location.search
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      window.prompt('Copy this link', url)
    }
  }
  return (
    <div className="desktop-only" role="dialog" aria-label="Best on a computer">
      <div className="laptop" aria-hidden>
        <div className="laptop-screen">❋</div>
        <div className="laptop-base" />
      </div>
      <h1>
        The Internet <em>Golu</em>
      </h1>
      <h2>Best on a computer</h2>
      <p>
        You can make your Bommai on your phone, but the phone version is new and still a little rough around the edges. For the best experience, open
        this link on a laptop or desktop.
      </p>
      <button className="btn-primary" onClick={onSkip}>
        Continue on phone <span aria-hidden>→</span>
      </button>
      <button className="btn-link" onClick={copy}>
        {copied ? 'Link copied ✓' : 'Copy link for my computer'}
      </button>
    </div>
  )
}
