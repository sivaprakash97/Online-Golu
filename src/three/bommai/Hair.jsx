import { RBox, Ball, Gem, Cone, Cyl, Torus } from '../prims.jsx'

// Head-local coordinates: head is a rounded box 0.44 x 0.40 x 0.38 centred at the origin.
const Cap = ({ c, h = 0.17, y = 0.13 }) => <RBox size={[0.47, h, 0.42]} r={0.07} position={[0, y, -0.012]} color={c} />
const Back = ({ c, h = 0.3, y = 0.02 }) => <RBox size={[0.47, h, 0.12]} r={0.05} position={[0, y, -0.158]} color={c} />
const Fringe = ({ c }) => <RBox size={[0.45, 0.075, 0.08]} r={0.03} position={[0, 0.172, 0.165]} color={c} />
const Jasmine = ({ points }) =>
  points.map((p, i) => <Ball key={i} r={0.022} w={6} hs={5} position={p} color="#fbf7ec" mat={{ rough: 0.4 }} />)

const LongBase = ({ c }) => (
  <>
    <Cap c={c} />
    <Fringe c={c} />
    <RBox size={[0.5, 0.56, 0.12]} r={0.05} position={[0, -0.12, -0.17]} color={c} />
    <RBox size={[0.08, 0.42, 0.22]} r={0.035} position={[0.236, -0.06, -0.035]} color={c} />
    <RBox size={[0.08, 0.42, 0.22]} r={0.035} position={[-0.236, -0.06, -0.035]} color={c} />
  </>
)

export default function Hair({ style, color: c }) {
  switch (style) {
    case 'short-crop':
      return (
        <>
          <Cap c={c} h={0.12} y={0.155} />
          <Back c={c} h={0.22} y={0.06} />
          <RBox size={[0.45, 0.05, 0.06]} r={0.02} position={[0, 0.185, 0.17]} color={c} />
        </>
      )
    case 'side-part':
      return (
        <>
          <Cap c={c} h={0.15} y={0.15} />
          <Back c={c} h={0.24} y={0.05} />
          <RBox size={[0.32, 0.09, 0.09]} r={0.04} position={[-0.075, 0.18, 0.165]} rotation={[0, 0, 0.18]} color={c} />
          <RBox size={[0.09, 0.16, 0.24]} r={0.04} position={[0.205, 0.12, 0.02]} color={c} />
        </>
      )
    case 'spiky':
      return (
        <>
          <Cap c={c} h={0.13} y={0.15} />
          <Back c={c} h={0.22} y={0.06} />
          {[
            [0, 0.27, 0.06, 0, 0],
            [0.12, 0.26, 0.04, 0, -0.45],
            [-0.12, 0.26, 0.04, 0, 0.45],
            [0.06, 0.25, -0.1, -0.5, -0.2],
            [-0.06, 0.25, -0.1, -0.5, 0.2],
            [0, 0.25, 0.16, 0.5, 0],
          ].map(([x, y, z, rx, rz], i) => (
            <Cone key={i} r={0.07} h={0.15} s={5} position={[x, y, z]} rotation={[rx, 0, rz]} color={c} mat={{ flat: true }} />
          ))}
        </>
      )
    case 'curly': {
      const pts = []
      for (let i = 0; i < 7; i++) {
        const a = (i / 6) * Math.PI
        pts.push([Math.cos(a) * 0.2, 0.17 + Math.sin(a) * 0.07, 0.12])
        pts.push([Math.cos(a) * 0.22, 0.16 + Math.sin(a) * 0.08, -0.06])
      }
      pts.push([0.24, 0.02, -0.12], [-0.24, 0.02, -0.12], [0, 0.0, -0.2], [0.14, 0.04, -0.19], [-0.14, 0.04, -0.19])
      return (
        <>
          <Cap c={c} h={0.14} y={0.15} />
          {pts.map((p, i) => <Gem key={i} r={0.085} position={p} rotation={[i, i * 2, 0]} color={c} />)}
        </>
      )
    }
    case 'long-straight':
      return <LongBase c={c} />
    case 'long-wavy':
      return (
        <>
          <LongBase c={c} />
          {[-0.2, -0.07, 0.07, 0.2].map((x, i) => (
            <Gem key={i} r={0.075} position={[x, -0.4, -0.17]} rotation={[i, i, 0]} color={c} />
          ))}
          <Gem r={0.07} position={[0.24, -0.28, -0.03]} color={c} />
          <Gem r={0.07} position={[-0.24, -0.28, -0.03]} color={c} />
        </>
      )
    case 'braid': {
      const seg = [0, 1, 2, 3, 4, 5]
      return (
        <>
          <Cap c={c} />
          <Fringe c={c} />
          <Back c={c} />
          {seg.map((i) => (
            <Gem key={i} r={0.068 - i * 0.006} position={[0, -0.13 - i * 0.085, -0.22 - i * 0.012]} rotation={[i, 0, i]} color={c} />
          ))}
          <Jasmine points={seg.map((i) => [0.062 - i * 0.004, -0.11 - i * 0.085, -0.21 - i * 0.012])} />
          <Cyl rt={0.012} rb={0.03} h={0.06} position={[0, -0.66, -0.29]} color="#c8323a" />
          <Ball r={0.02} position={[0, -0.7, -0.29]} color="#e8b33c" />
        </>
      )
    }
    case 'top-bun':
      return (
        <>
          <Cap c={c} h={0.15} y={0.15} />
          <Back c={c} h={0.26} y={0.04} />
          <RBox size={[0.45, 0.06, 0.07]} r={0.025} position={[0, 0.19, 0.17]} color={c} />
          <Gem r={0.11} detail={1} position={[0, 0.31, -0.04]} color={c} />
          <Torus r={0.07} t={0.02} position={[0, 0.235, -0.04]} rotation={[Math.PI / 2, 0, 0]} color="#e8b33c" />
        </>
      )
    case 'low-bun':
      return (
        <>
          <Cap c={c} />
          <Fringe c={c} />
          <Back c={c} />
          <Gem r={0.105} detail={1} position={[0, -0.08, -0.26]} color={c} />
          <Jasmine points={Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2
            return [Math.cos(a) * 0.11, -0.08 + Math.sin(a) * 0.11, -0.25]
          })} />
        </>
      )
    case 'ponytail':
      return (
        <>
          <Cap c={c} />
          <Fringe c={c} />
          <Back c={c} />
          <Torus r={0.04} t={0.018} position={[0, 0.12, -0.23]} rotation={[0.2, 0, 0]} color="#e8b33c" />
          <Cyl rt={0.065} rb={0.025} h={0.36} s={6} position={[0, -0.04, -0.29]} rotation={[0.28, 0, 0]} color={c} mat={{ flat: true }} />
        </>
      )
    case 'puffs':
      return (
        <>
          <Cap c={c} h={0.15} y={0.15} />
          <Back c={c} h={0.26} y={0.04} />
          <RBox size={[0.45, 0.06, 0.07]} r={0.025} position={[0, 0.19, 0.17]} color={c} />
          <Gem r={0.115} detail={1} position={[0.2, 0.25, -0.04]} color={c} />
          <Gem r={0.115} detail={1} position={[-0.2, 0.25, -0.04]} color={c} />
        </>
      )
    case 'bald':
    default:
      return null
  }
}
