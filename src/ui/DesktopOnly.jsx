import { useEffect, useState } from 'react'

// The Golu is built for desktop for now. On phone-sized screens we show this instead of loading
// the 3D scene at all, with a way to send the link to a computer and an escape hatch.
const SMALL = '(max-width: 899px), (max-height: 499px)'
const SKIP_KEY = 'golu.mobileAnyway'

const readSkip = () => {
  try {
    return sessionStorage.getItem(SKIP_KEY) === '1'
  } catch {
    return false
  }
}

export function useDesktopGate() {
  const [small, setSmall] = useState(() => window.matchMedia(SMALL).matches)
  const [skipped, setSkipped] = useState(readSkip)
  useEffect(() => {
    const mq = window.matchMedia(SMALL)
    const on = () => setSmall(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
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
      <p>The Golu and its little Bommais are built for a bigger screen for now. Open this link on your laptop or desktop to add yours.</p>
      <button className="btn-primary" onClick={copy}>
        {copied ? 'Link copied ✓' : 'Copy link'}
      </button>
      <button className="btn-link" onClick={onSkip}>
        Open it anyway
      </button>
    </div>
  )
}
