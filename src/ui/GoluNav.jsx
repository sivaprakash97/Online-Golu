// The carousel's controls (nothing shows while there is only one Golu). GoluArrow sits beside the
// main button and turns the stage to the next Golu that way; when the Golu facing you is full and
// that one has room, it pulses. GoluNow says which Golu is facing you.
const mod = (a, n) => ((a % n) + n) % n

const spotsLeft = (n) => (n ? `${n} ${n === 1 ? 'spot' : 'spots'} free` : 'Full')

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      <path d={dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function GoluArrow({ dir, count, active, free, onTurn }) {
  if (count < 2) return null
  const g = mod(active - 1 + dir, count) + 1
  const roomy = !free[active - 1] && free[g - 1] > 0
  const label = `Golu ${g} · ${spotsLeft(free[g - 1])}`
  return (
    <button className={`golu-arrow ${dir < 0 ? 'is-left' : 'is-right'}${roomy ? ' is-roomy' : ''}`} onClick={() => onTurn(dir)} aria-label={`Turn to ${label}`} title={label}>
      <Chevron dir={dir} />
      <span className="golu-arrow-label" aria-hidden>
        Golu {g}
      </span>
    </button>
  )
}

export function GoluNow({ count, active, free }) {
  if (count < 2) return null
  return (
    <div className="golu-now" aria-live="polite">
      <span className="golu-dots" aria-hidden>
        {Array.from({ length: count }, (_, i) => (
          <i key={i} className={i + 1 === active ? 'on' : undefined} />
        ))}
      </span>
      <b>Golu {active}</b>
      <span className="golu-now-free">{spotsLeft(free[active - 1])}</span>
    </div>
  )
}
