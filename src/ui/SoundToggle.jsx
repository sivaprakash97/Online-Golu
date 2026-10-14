import { setMuted, useMuted } from '../lib/music.js'

// Turns the background music on and off. Quiet by design: a secondary control.
export default function SoundToggle({ className = '' }) {
  const muted = useMuted()
  const label = muted ? 'Turn music on' : 'Mute music'
  return (
    <button className={`sound-toggle ${className}`} onClick={() => setMuted(!muted)} aria-pressed={muted} aria-label={label} title={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
        {muted ? (
          <path d="M17 9l5 6M22 9l-5 6" />
        ) : (
          <>
            <path d="M16.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 6a8.5 8.5 0 0 1 0 12" />
          </>
        )}
      </svg>
      <span>{muted ? 'Muted' : 'Music'}</span>
    </button>
  )
}
