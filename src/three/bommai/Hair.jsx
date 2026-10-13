import { RBox, Ball, Cone, Cyl, Torus } from '../prims.jsx'

// Head-local coordinates: the head is a rounded box 0.44 x 0.40 x 0.38 centred at the origin
// (top y=0.20, face z=0.19, back z=-0.19, ears at x=±0.225). Hair is built like a vinyl toy's:
// a lid over the skull whose front edge is the hairline, a wrap down the back and sides, a soft
// fringe, and smooth rounded volumes. No faceted pieces.
const M = { rough: 0.36 }
const GOLDISH = { rough: 0.35, metal: 0.6 }
const PAD = 0.024

// Covers the whole top of the head; its lower front edge is the hairline. A flattened dome on
// top rounds the silhouette so it never reads as a flat cap.
function Lid({ c, hairline = 0.1, lift = 0.016, dome = true }) {
  const top = 0.2 + PAD + lift
  const front = 0.19 + PAD * 0.5
  const back = -0.19 - PAD
  return (
    <>
      <RBox size={[0.44 + PAD * 2, top - hairline, front - back]} r={0.13} seg={4} position={[0, (top + hairline) / 2, (front + back) / 2]} color={c} mat={M} />
      {dome && <Ball r={1} w={24} hs={16} position={[0, top - 0.045, -0.015]} scale={[0.245, 0.075, 0.215]} color={c} mat={M} />}
    </>
  )
}

// Covers the back of the head down to `low`, and the sides as far forward as `front`
// (behind the ears for short hair, past them for long hair).
function Wrap({ c, low = -0.19, front = -0.04 }) {
  // slightly wider than the lid and reaching almost to its top, so the two read as one mass
  const pad = PAD + 0.006
  const top = 0.2 + PAD + 0.008
  const back = -0.19 - pad
  return <RBox size={[0.44 + pad * 2, top - low, front - back]} r={0.12} seg={4} position={[0, (top + low) / 2, (front + back) / 2]} color={c} mat={M} />
}

// Soft fringe pieces just below the hairline. Ellipsoids blend into the lid instead of reading as bars.
const Lobe = ({ c, x, y, rz = 0, sx = 1, sy = 0.62 }) => (
  <Ball r={0.075} w={16} hs={12} position={[x, y, 0.19]} rotation={[0, 0, rz]} scale={[sx, sy, 0.5]} color={c} mat={M} />
)
function Fringe({ c, kind = 'bangs' }) {
  if (kind === 'bangs')
    return [-0.13, 0, 0.13].map((x) => <Lobe key={x} c={c} x={x} y={x ? 0.105 : 0.095} rz={-x * 1.6} sx={1.15} />)
  if (kind === 'part') // centre parting: two curtains sweeping down to the temples
    return [1, -1].map((s) => <Lobe key={s} c={c} x={s * 0.11} y={0.11} rz={-s * 0.38} sx={1.75} sy={0.55} />)
  if (kind === 'swoop') // side part, sweeping across the forehead
    return (
      <>
        <Lobe c={c} x={-0.05} y={0.11} rz={0.24} sx={2.5} sy={0.7} />
        <Lobe c={c} x={0.17} y={0.115} rz={-0.5} sx={0.9} sy={0.6} />
      </>
    )
  return null
}

// Locks that fall in front of the ears and frame the face.
const SideLocks = ({ c, low = -0.2, z = 0.06, wavy = false }) =>
  [1, -1].map((s) => (
    <group key={s}>
      {wavy && <Ball r={0.05} w={12} hs={10} position={[s * 0.245, low + 0.11, z]} scale={[0.9, 0.8, 1.15]} color={c} mat={M} />}
      <RBox size={[0.085, 0.18 - low, 0.13]} r={0.042} seg={4} position={[s * 0.236, (0.18 + low) / 2, z]} rotation={[0, 0, s * 0.04]} color={c} mat={M} />
      <Ball r={0.042} w={12} hs={10} position={[s * 0.238, low + 0.01, z + 0.005]} scale={[0.9, 0.8, 1.2]} color={c} mat={M} />
    </group>
  ))

const Jasmine = ({ points }) =>
  points.map((p, i) => <Ball key={i} r={0.024} w={8} hs={6} position={p} color="#fbf7ec" mat={{ rough: 0.35 }} />)

// Long hair down the back: one softly rounded panel, a touch wider at the bottom.
function LongBack({ c, low = -0.42, wavy = false }) {
  const top = 0.12
  return (
    <>
      <RBox size={[0.5, top - low, 0.13]} r={0.065} seg={4} position={[0, (top + low) / 2, -0.19]} rotation={[0.06, 0, 0]} color={c} mat={M} />
      {wavy
        ? [-0.17, -0.057, 0.057, 0.17].map((x, i) => (
            <Ball key={x} r={0.072} w={14} hs={10} position={[x, low + (i % 2 ? 0.02 : 0), -0.215]} scale={[1, 0.85, 0.8]} color={c} mat={M} />
          ))
        : null}
    </>
  )
}

export default function Hair({ style, color: c }) {
  switch (style) {
    case 'short-crop':
      return (
        <>
          <Lid c={c} hairline={0.115} lift={0.008} />
          <Wrap c={c} low={-0.17} front={-0.05} />
        </>
      )
    case 'side-part':
      return (
        <>
          <Lid c={c} hairline={0.11} lift={0.022} />
          <Wrap c={c} low={-0.17} front={-0.05} />
          <Fringe c={c} kind="swoop" />
        </>
      )
    case 'spiky': {
      const spikes = [
        [0, 0.3, 0.1, 0.4, 0],
        [0.13, 0.28, 0.09, 0.35, -0.5],
        [-0.13, 0.28, 0.09, 0.35, 0.5],
        [0.07, 0.31, -0.04, -0.1, -0.28],
        [-0.07, 0.31, -0.04, -0.1, 0.28],
        [0, 0.28, -0.14, -0.6, 0],
        [0.16, 0.25, -0.1, -0.4, -0.65],
        [-0.16, 0.25, -0.1, -0.4, 0.65],
      ]
      return (
        <>
          <Lid c={c} hairline={0.11} />
          <Wrap c={c} low={-0.17} front={-0.05} />
          {spikes.map(([x, y, z, rx, rz], i) => (
            <Cone key={i} r={0.075} h={0.16} s={8} position={[x, y, z]} rotation={[rx, 0, rz]} color={c} mat={M} />
          ))}
        </>
      )
    }
    case 'curly': {
      // smooth curls on a dome over the head; the face stays clear
      const curls = []
      for (let ring = 0; ring < 4; ring++) {
        const pitch = 0.2 + ring * 0.42 // 0 = straight up, ~1.5 = level with the ears
        const n = 3 + ring * 4
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + ring * 0.5
          const x = Math.sin(pitch) * Math.cos(a) * 0.26
          const z = Math.sin(pitch) * Math.sin(a) * 0.25 - 0.02
          const y = 0.1 + Math.cos(pitch) * 0.2
          if (z > 0.1 && y < 0.16) continue
          curls.push([x, y, z])
        }
      }
      return (
        <>
          <Lid c={c} hairline={0.12} />
          <Wrap c={c} low={-0.15} front={-0.02} />
          {curls.map((p, i) => (
            <Ball key={i} r={0.078 + (i % 3) * 0.006} w={14} hs={10} position={p} color={c} mat={M} />
          ))}
          {[-0.15, -0.05, 0.05, 0.15].map((x) => (
            <Ball key={x} r={0.06} w={14} hs={10} position={[x, 0.18, 0.17]} color={c} mat={M} />
          ))}
        </>
      )
    }
    case 'long-straight':
      return (
        <>
          <Lid c={c} />
          <Wrap c={c} low={-0.16} front={0.1} />
          <Fringe c={c} kind="part" />
          <SideLocks c={c} low={-0.3} />
          <LongBack c={c} low={-0.46} />
        </>
      )
    case 'long-wavy':
      return (
        <>
          <Lid c={c} />
          <Wrap c={c} low={-0.16} front={0.1} />
          <Fringe c={c} kind="bangs" />
          <SideLocks c={c} low={-0.26} wavy />
          <LongBack c={c} low={-0.44} wavy />
        </>
      )
    case 'braid': {
      const seg = [0, 1, 2, 3, 4, 5, 6]
      return (
        <>
          <Lid c={c} />
          <Wrap c={c} low={-0.18} front={0.02} />
          <Fringe c={c} kind="part" />
          {/* one thick plait down the back: alternating tilted lobes */}
          {seg.map((i) => (
            <Ball
              key={i}
              r={0.074 - i * 0.004}
              w={14}
              hs={10}
              position={[0, -0.12 - i * 0.075, -0.235 - i * 0.008]}
              rotation={[0, 0, i % 2 ? 0.55 : -0.55]}
              scale={[1.15, 0.72, 0.85]}
              color={c}
              mat={M}
            />
          ))}
          <Jasmine points={seg.map((i) => [0.072 - i * 0.003, -0.1 - i * 0.075, -0.24 - i * 0.008])} />
          <Cyl rt={0.014} rb={0.032} h={0.07} position={[0, -0.66, -0.29]} color="#c8323a" />
          <Ball r={0.022} position={[0, -0.71, -0.29]} color="#e8b33c" mat={{ rough: 0.35, metal: 0.6 }} />
        </>
      )
    }
    case 'top-bun':
      return (
        <>
          <Lid c={c} />
          <Wrap c={c} low={-0.18} front={-0.04} />
          <Fringe c={c} kind="part" />
          <Ball r={0.115} w={18} hs={14} position={[0, 0.33, -0.03]} scale={[1, 0.9, 1]} color={c} mat={M} />
          <Torus r={0.075} t={0.022} rs={8} ts={20} position={[0, 0.265, -0.03]} rotation={[Math.PI / 2, 0, 0]} color="#e8b33c" mat={GOLDISH} />
        </>
      )
    case 'low-bun':
      return (
        <>
          <Lid c={c} />
          <Wrap c={c} low={-0.18} front={-0.04} />
          <Fringe c={c} kind="part" />
          <Ball r={0.11} w={18} hs={14} position={[0, -0.08, -0.27]} scale={[1, 0.95, 0.85]} color={c} mat={M} />
          <Jasmine
            points={Array.from({ length: 11 }, (_, i) => {
              const a = (i / 11) * Math.PI * 2
              return [Math.cos(a) * 0.12, -0.08 + Math.sin(a) * 0.115, -0.25]
            })}
          />
        </>
      )
    case 'ponytail': {
      // a thick tail that curves out from the crown and falls down the back
      const tail = [
        [0.07, 0.1, -0.27],
        [0.068, 0.04, -0.3],
        [0.064, -0.03, -0.315],
        [0.058, -0.1, -0.315],
        [0.05, -0.17, -0.305],
        [0.04, -0.23, -0.29],
        [0.028, -0.28, -0.275],
      ]
      return (
        <>
          <Lid c={c} />
          <Wrap c={c} low={-0.18} front={-0.04} />
          <Fringe c={c} kind="bangs" />
          <Torus r={0.05} t={0.02} rs={8} ts={18} position={[0, 0.15, -0.235]} rotation={[0.25, 0, 0]} color="#e8b33c" mat={GOLDISH} />
          {tail.map(([r, y, z], i) => (
            <Ball key={i} r={r} w={14} hs={10} position={[0, y, z]} scale={[1.1, 1, 1]} color={c} mat={M} />
          ))}
        </>
      )
    }
    case 'puffs':
      return (
        <>
          <Lid c={c} />
          <Wrap c={c} low={-0.18} front={-0.04} />
          <Fringe c={c} kind="part" />
          {[1, -1].map((s) => (
            <group key={s}>
              <Ball r={0.12} w={18} hs={14} position={[s * 0.2, 0.27, -0.04]} color={c} mat={M} />
              <Torus r={0.07} t={0.02} rs={8} ts={18} position={[s * 0.15, 0.22, -0.04]} rotation={[Math.PI / 2, 0, s * 0.7]} color="#e8b33c" mat={GOLDISH} />
            </group>
          ))}
        </>
      )
    case 'bald':
    default:
      return null
  }
}
