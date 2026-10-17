// The carousel's controls: an arrow at each side of the screen turns the stage to the next Golu
// (named underneath, with how many spots it has left), and, with `title`, a label says which Golu
// is facing you. Nothing shows while there is only one Golu.
const mod = (a, n) => ((a % n) + n) % n

const spotsLeft = (n) => (n ? `${n} ${n === 1 ? 'spot' : 'spots'} free` : 'Full')

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path d={dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function GoluNav({ count, active, free, onTurn, title = true }) {
  if (count < 2) return null
  const at = (d) => mod(active - 1 + d, count) + 1
  return (
    <>
      {[-1, 1].map((d) => {
        const g = at(d)
        return (
          <button key={d} className={`golu-arrow ${d < 0 ? 'is-left' : 'is-right'}`} onClick={() => onTurn(d)} aria-label={`Turn to Golu ${g} (${spotsLeft(free[g - 1])})`}>
            <span className="golu-arrow-icon">
              <Chevron dir={d} />
            </span>
            <span className="golu-arrow-label" aria-hidden>
              Golu {g}
              <small>{spotsLeft(free[g - 1])}</small>
            </span>
          </button>
        )
      })}
      {title && (
        <div className="golu-now" aria-live="polite">
          <span className="golu-dots" aria-hidden>
            {Array.from({ length: count }, (_, i) => (
              <i key={i} className={i + 1 === active ? 'on' : undefined} />
            ))}
          </span>
          <b>Golu {active}</b>
          <span className="golu-now-free">{spotsLeft(free[active - 1])}</span>
        </div>
      )}
    </>
  )
}
