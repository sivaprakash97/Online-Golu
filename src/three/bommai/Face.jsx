import { RBox, Ball, Torus, Disc } from '../prims.jsx'

const INK = '#2a1b17'
const Z = 0.192 // front of the head box
const EX = 0.088 // eye x offset
const EY = -0.005

function Eye({ kind, x }) {
  switch (kind) {
    case 'happy':
      return <Torus r={0.03} t={0.01} rs={5} ts={10} arc={Math.PI} position={[x, EY - 0.012, Z]} color={INK} shadow={false} />
    case 'sleepy':
      return (
        <group position={[x, EY - 0.008, Z]}>
          <Torus r={0.03} t={0.009} rs={5} ts={10} arc={Math.PI} rotation={[0, 0, Math.PI]} color={INK} shadow={false} />
          <RBox size={[0.07, 0.012, 0.01]} r={0.004} position={[0, 0.004, 0]} color={INK} shadow={false} />
        </group>
      )
    case 'dots':
      return <Ball r={0.024} position={[x, EY, Z]} scale={[1, 1.15, 0.5]} color={INK} mat={{ rough: 0.3 }} shadow={false} />
    case 'sparkle':
      return (
        <group position={[x, EY, Z]}>
          <Ball r={0.047} scale={[1, 1.25, 0.45]} color={INK} mat={{ rough: 0.25 }} shadow={false} />
          <Ball r={0.016} position={[0.014, 0.024, 0.02]} color="#ffffff" mat={{ rough: 0.2 }} shadow={false} />
          <Ball r={0.008} position={[-0.016, -0.02, 0.02]} color="#ffffff" mat={{ rough: 0.2 }} shadow={false} />
        </group>
      )
    case 'round':
    default:
      return (
        <group position={[x, EY, Z]}>
          <Ball r={0.04} scale={[1, 1.25, 0.45]} color={INK} mat={{ rough: 0.25 }} shadow={false} />
          <Ball r={0.013} position={[0.012, 0.02, 0.017]} color="#ffffff" mat={{ rough: 0.2 }} shadow={false} />
        </group>
      )
  }
}

export default function Face({ eyes, extras = [], hairColor, skin }) {
  const has = (k) => extras.includes(k)
  const leftEye = eyes === 'wink' ? 'happy' : eyes
  const rightEye = eyes === 'wink' ? 'round' : eyes
  return (
    <group>
      <Eye kind={leftEye} x={EX} />
      <Eye kind={rightEye} x={-EX} />
      {/* brows */}
      <RBox size={[0.06, 0.014, 0.012]} r={0.005} position={[EX, 0.06, Z]} rotation={[0, 0, -0.08]} color={hairColor} shadow={false} />
      <RBox size={[0.06, 0.014, 0.012]} r={0.005} position={[-EX, 0.06, Z]} rotation={[0, 0, 0.08]} color={hairColor} shadow={false} />
      {/* smile */}
      <Torus r={0.028} t={0.008} rs={5} ts={10} arc={Math.PI} position={[0, -0.075, Z]} rotation={[0, 0, Math.PI]} color="#7b2a28" shadow={false} />
      {/* tiny nose */}
      <RBox size={[0.034, 0.03, 0.03]} r={0.012} position={[0, -0.035, Z]} color={skin} shadow={false} />

      {has('blush') && (
        <>
          <Disc r={0.03} position={[0.135, -0.05, Z + 0.001]} color="#ef7f86" mat={{ opacity: 0.55 }} />
          <Disc r={0.03} position={[-0.135, -0.05, Z + 0.001]} color="#ef7f86" mat={{ opacity: 0.55 }} />
        </>
      )}
      {has('bindi') && <Ball r={0.014} position={[0, 0.085, Z]} scale={[1, 1, 0.5]} color="#c8102e" shadow={false} />}
      {has('namam') && (
        <group position={[0, 0.108, Z]}>
          {[-0.014, 0, 0.014].map((y) => (
            <RBox key={y} size={[0.11, 0.008, 0.008]} r={0.003} position={[0, y, 0]} color="#f7f3ea" shadow={false} />
          ))}
          <Ball r={0.011} position={[0, -0.026, 0]} scale={[1, 1, 0.5]} color="#c8102e" shadow={false} />
        </group>
      )}
      {has('nosering') && <Torus r={0.013} t={0.0035} rs={4} ts={10} position={[0.022, -0.05, Z + 0.016]} color="#e8b33c" mat={{ rough: 0.3, metal: 0.7 }} shadow={false} />}
      {has('mustache') && (
        <group position={[0, -0.055, Z + 0.012]}>
          <RBox size={[0.07, 0.024, 0.02]} r={0.01} position={[0.032, 0, 0]} rotation={[0, 0, -0.25]} color={hairColor} shadow={false} />
          <RBox size={[0.07, 0.024, 0.02]} r={0.01} position={[-0.032, 0, 0]} rotation={[0, 0, 0.25]} color={hairColor} shadow={false} />
        </group>
      )}
      {has('beard') && (
        <group>
          <RBox size={[0.42, 0.1, 0.36]} r={0.045} position={[0, -0.165, 0.025]} color={hairColor} />
          <RBox size={[0.07, 0.16, 0.3]} r={0.03} position={[0.2, -0.09, 0.0]} color={hairColor} />
          <RBox size={[0.07, 0.16, 0.3]} r={0.03} position={[-0.2, -0.09, 0.0]} color={hairColor} />
        </group>
      )}
      {(has('glasses') || has('shades')) && (
        <group position={[0, EY, Z + 0.02]}>
          {has('shades') ? (
            <>
              <RBox size={[0.11, 0.075, 0.02]} r={0.02} position={[EX, 0, 0]} color="#1b1b22" mat={{ rough: 0.15, metal: 0.3 }} />
              <RBox size={[0.11, 0.075, 0.02]} r={0.02} position={[-EX, 0, 0]} color="#1b1b22" mat={{ rough: 0.15, metal: 0.3 }} />
            </>
          ) : (
            <>
              <Torus r={0.054} t={0.009} rs={5} ts={14} position={[EX, 0, 0]} color="#3a2b25" />
              <Torus r={0.054} t={0.009} rs={5} ts={14} position={[-EX, 0, 0]} color="#3a2b25" />
            </>
          )}
          <RBox size={[0.06, 0.014, 0.014]} r={0.005} position={[0, 0.01, 0]} color="#3a2b25" />
          <RBox size={[0.012, 0.014, 0.22]} r={0.005} position={[0.222, 0.01, -0.1]} color="#3a2b25" />
          <RBox size={[0.012, 0.014, 0.22]} r={0.005} position={[-0.222, 0.01, -0.1]} color="#3a2b25" />
        </group>
      )}
    </group>
  )
}
