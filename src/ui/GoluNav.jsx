// The carousel's arrows (nothing shows while there is only one Golu). They sit at the screen's
// edges and only appear where there is somewhere to go: the next Golu on the right, the previous
// one on the left. When the Golu facing you is full and the next one has room, the right arrow
// reads "New Golu" and blinks, with a glow along that edge of the screen.
function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden>
      <path d={dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const spotsLeft = (n) => (n ? `${n} ${n === 1 ? 'spot' : 'spots'} left` : 'full')

export default function GoluArrows({ count, active, free, onTurn }) {
  if (count < 2) return null
  const arrows = []
  if (active > 1) {
    const g = active - 1
    arrows.push({ dir: -1, g, label: g === 1 ? 'First Golu' : 'Previous Golu' })
  }
  if (active < count) {
    const g = active + 1
    const isNew = !free[active - 1] && free[g - 1] > 0
    arrows.push({ dir: 1, g, label: isNew ? 'New Golu' : 'Next Golu', isNew })
  }
  return arrows.flatMap(({ dir, g, label, isNew }) => [
    isNew && <div key="glow" className="golu-edge-glow" aria-hidden />,
    <div key={dir} className={`golu-edge ${dir < 0 ? 'is-left' : 'is-right'}${isNew ? ' is-new' : ''}`}>
      <button className="golu-edge-btn" onClick={() => onTurn(g, dir)} aria-label={`Turn to the ${label.toLowerCase()} (${spotsLeft(free[g - 1])})`}>
        <span className="golu-edge-icon">
          <Chevron dir={dir} />
        </span>
        <span className="golu-edge-label">{label}</span>
      </button>
    </div>,
  ])
}
