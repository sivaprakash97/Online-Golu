import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RBox, Ball, Gem, Cone, Cyl, Torus, Disc, GOLD, BRASS } from '../prims.jsx'

// Non-figurative traditional pieces for the locked top tiers. They sit in replaceable slots
// (see TRADITIONAL_SLOTS in Golu.jsx) so the project owner's own figurines can drop in later.

const BRASS_MAT = { rough: 0.3, metal: 0.8 }

export function Flame({ position, scale = 1, light = false }) {
  const ref = useRef()
  const seed = useRef(Math.random() * 10)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime * 9 + seed.current
    const f = 1 + Math.sin(t) * 0.08 + Math.sin(t * 2.3) * 0.05
    ref.current.scale.set(scale * (2 - f), scale * f, scale * (2 - f))
  })
  return (
    <group position={position}>
      <group ref={ref}>
        <Cone r={0.03} h={0.09} s={6} position={[0, 0.045, 0]} color="#ffb733" mat={{ emissive: '#ff9a1f', emissiveIntensity: 2.4 }} shadow={false} />
        <Cone r={0.016} h={0.05} s={6} position={[0, 0.03, 0.004]} color="#fff3c4" mat={{ emissive: '#fff0b0', emissiveIntensity: 2.5 }} shadow={false} />
      </group>
      {light && <pointLight color="#ffb35c" intensity={1.6} distance={3.2} decay={2} position={[0, 0.15, 0.1]} />}
    </group>
  )
}

export function Kuthuvilakku({ height = 1, light = false }) {
  const h = height
  return (
    <group>
      <Cyl rt={0.12} rb={0.2} h={0.06} s={12} position={[0, 0.03, 0]} color={BRASS} mat={BRASS_MAT} />
      <Cyl rt={0.07} rb={0.1} h={0.06} s={12} position={[0, 0.09, 0]} color={BRASS} mat={BRASS_MAT} />
      <Cyl rt={0.028} rb={0.035} h={0.55 * h} s={10} position={[0, 0.12 + 0.275 * h, 0]} color={BRASS} mat={BRASS_MAT} />
      {[0.25, 0.45].map((f) => (
        <Torus key={f} r={0.04} t={0.014} rs={5} ts={12} position={[0, 0.12 + f * h, 0]} rotation={[Math.PI / 2, 0, 0]} color={BRASS} mat={BRASS_MAT} />
      ))}
      <group position={[0, 0.12 + 0.55 * h, 0]}>
        <Cyl rt={0.17} rb={0.07} h={0.07} s={10} position={[0, 0.035, 0]} color={BRASS} mat={BRASS_MAT} />
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i / 5) * Math.PI * 2 + Math.PI / 2
          return <Flame key={i} position={[Math.cos(a) * 0.14, 0.07, Math.sin(a) * 0.14]} scale={0.8} light={light && i === 0} />
        })}
        <Cone r={0.04} h={0.12} s={6} position={[0, 0.13, 0]} color={BRASS} mat={BRASS_MAT} />
        <Ball r={0.03} position={[0, 0.2, 0]} color={BRASS} mat={BRASS_MAT} />
      </group>
    </group>
  )
}

export function Kalasam({ scale = 1 }) {
  return (
    <group scale={scale}>
      {/* rice-filled plate */}
      <Cyl rt={0.26} rb={0.22} h={0.04} s={14} position={[0, 0.02, 0]} color={BRASS} mat={BRASS_MAT} />
      <Cyl rt={0.23} rb={0.24} h={0.03} s={14} position={[0, 0.05, 0]} color="#f2ead8" mat={{ rough: 0.9 }} />
      {/* pot */}
      <Ball r={0.17} w={14} hs={10} position={[0, 0.2, 0]} scale={[1, 0.9, 1]} color={BRASS} mat={BRASS_MAT} />
      <Cyl rt={0.11} rb={0.08} h={0.07} s={14} position={[0, 0.36, 0]} color={BRASS} mat={BRASS_MAT} />
      <Torus r={0.17} t={0.012} rs={4} ts={20} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} color="#c8323a" />
      {/* mango leaves */}
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2
        return (
          <Ball key={i} r={0.08} w={6} hs={4} position={[Math.cos(a) * 0.1, 0.42, Math.sin(a) * 0.1]} rotation={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]} scale={[0.35, 1.25, 0.12]} color={i % 2 ? '#2f7d3d' : '#3f9b4b'} mat={{ flat: true }} />
        )
      })}
      {/* coconut with turmeric + kumkum */}
      <Gem r={0.11} detail={1} position={[0, 0.5, 0]} scale={[1, 1.1, 1]} color="#8a5a35" />
      <Ball r={0.035} position={[0, 0.55, 0.095]} scale={[1, 1, 0.4]} color="#eab12f" shadow={false} />
      <Ball r={0.015} position={[0, 0.555, 0.11]} scale={[1, 1, 0.4]} color="#c8102e" shadow={false} />
      <Cone r={0.04} h={0.08} s={5} position={[0, 0.63, 0]} color="#a07444" />
    </group>
  )
}

export function Mandapam() {
  const posts = [
    [0.24, 0.24],
    [-0.24, 0.24],
    [0.24, -0.24],
    [-0.24, -0.24],
  ]
  return (
    <group>
      <RBox size={[0.68, 0.08, 0.68]} r={0.02} position={[0, 0.04, 0]} color="#a8582f" />
      <RBox size={[0.6, 0.05, 0.6]} r={0.015} position={[0, 0.105, 0]} color="#c36c3a" />
      {posts.map(([x, z]) => (
        <group key={`${x}${z}`}>
          <Cyl rt={0.03} h={0.5} s={8} position={[x, 0.38, z]} color="#e8b33c" mat={GOLD} />
          <RBox size={[0.08, 0.04, 0.08]} r={0.01} position={[x, 0.15, z]} color="#e8b33c" mat={GOLD} />
        </group>
      ))}
      <RBox size={[0.68, 0.06, 0.68]} r={0.02} position={[0, 0.65, 0]} color="#7a1f2b" />
      <Cone r={0.48} h={0.32} s={4} position={[0, 0.84, 0]} rotation={[0, Math.PI / 4, 0]} color="#c8323a" mat={{ flat: true }} />
      <Ball r={0.05} position={[0, 1.02, 0]} color="#e8b33c" mat={GOLD} />
      <Cone r={0.03} h={0.08} s={5} position={[0, 1.09, 0]} color="#e8b33c" mat={GOLD} />
      <Kalasam scale={0.45} />
      <group position={[0, 0.13, 0.18]}>
        <Cyl rt={0.04} rb={0.03} h={0.025} s={8} color={BRASS} mat={BRASS_MAT} />
        <Flame position={[0, 0.01, 0]} scale={0.6} />
      </group>
      {/* little marigold string on the front */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = -0.26 + i * 0.065
        const y = 0.6 - Math.sin((i / 8) * Math.PI) * 0.08
        return <Gem key={i} r={0.022} position={[x, y, 0.3]} rotation={[i, i, 0]} color={i % 2 ? '#f6b928' : '#f08a24'} />
      })}
    </group>
  )
}

// Marapachi: the carved wooden couple that traditionally starts every Golu.
function MarapachiDoll({ female }) {
  const wood = '#9b3d22'
  return (
    <group>
      <Cyl rt={0.12} rb={0.14} h={0.05} s={10} position={[0, 0.025, 0]} color="#6e2a17" />
      <Cyl rt={female ? 0.09 : 0.08} rb={female ? 0.14 : 0.1} h={0.42} s={10} position={[0, 0.26, 0]} color={female ? '#2f7d3d' : '#f3ead7'} mat={{ flat: true }} />
      <Cyl rt={0.092} rb={0.092} h={0.03} s={10} position={[0, female ? 0.2 : 0.12, 0]} color="#e8b33c" mat={GOLD} />
      <Cyl rt={0.075} rb={0.085} h={0.14} s={10} position={[0, 0.52, 0]} color={female ? '#c8323a' : '#7a1f2b'} />
      <Ball r={0.085} w={10} hs={8} position={[0, 0.66, 0]} color={wood} mat={{ rough: 0.5 }} />
      <Ball r={0.012} position={[0.03, 0.67, 0.075]} color="#1f1a1c" shadow={false} />
      <Ball r={0.012} position={[-0.03, 0.67, 0.075]} color="#1f1a1c" shadow={false} />
      {female ? (
        <>
          <Ball r={0.065} position={[0, 0.7, -0.045]} color="#1f1a1c" />
          <Ball r={0.04} position={[0, 0.67, -0.11]} color="#1f1a1c" />
          <Ball r={0.01} position={[0, 0.7, 0.084]} color="#c8102e" shadow={false} />
        </>
      ) : (
        <>
          <Cyl rt={0.075} rb={0.09} h={0.07} s={10} position={[0, 0.74, 0]} color="#e8b33c" mat={GOLD} />
          <Ball r={0.018} position={[0, 0.79, 0.04]} color="#c8323a" />
        </>
      )}
    </group>
  )
}

export function Marapachi() {
  return (
    <group>
      <group position={[-0.17, 0, 0]} rotation={[0, 0.15, 0]}>
        <MarapachiDoll />
      </group>
      <group position={[0.17, 0, 0]} rotation={[0, -0.15, 0]}>
        <MarapachiDoll female />
      </group>
    </group>
  )
}

export function Elephant() {
  const grey = '#8f8c96'
  return (
    <group rotation={[0, 0.5, 0]} scale={0.95}>
      <RBox size={[0.34, 0.3, 0.52]} r={0.12} position={[0, 0.36, 0]} color={grey} />
      {[
        [0.11, 0.17],
        [-0.11, 0.17],
        [0.11, -0.17],
        [-0.11, -0.17],
      ].map(([x, z]) => (
        <Cyl key={`${x}${z}`} rt={0.06} rb={0.065} h={0.24} s={8} position={[x, 0.12, z]} color={grey} />
      ))}
      <RBox size={[0.28, 0.26, 0.22]} r={0.1} position={[0, 0.48, 0.3]} color={grey} />
      <Cyl rt={0.045} rb={0.03} h={0.3} s={8} position={[0, 0.3, 0.42]} rotation={[0.15, 0, 0]} color={grey} />
      <RBox size={[0.05, 0.2, 0.16]} r={0.03} position={[0.17, 0.5, 0.26]} rotation={[0, 0.3, 0]} color="#a29fa9" />
      <RBox size={[0.05, 0.2, 0.16]} r={0.03} position={[-0.17, 0.5, 0.26]} rotation={[0, -0.3, 0]} color="#a29fa9" />
      <Ball r={0.018} position={[0.08, 0.53, 0.41]} color="#1f1a1c" shadow={false} />
      <Ball r={0.018} position={[-0.08, 0.53, 0.41]} color="#1f1a1c" shadow={false} />
      {/* caparison + forehead plate */}
      <RBox size={[0.36, 0.2, 0.3]} r={0.04} position={[0, 0.44, -0.02]} color="#c8323a" />
      <RBox size={[0.37, 0.03, 0.31]} r={0.01} position={[0, 0.35, -0.02]} color="#e8b33c" mat={GOLD} />
      <RBox size={[0.14, 0.16, 0.02]} r={0.02} position={[0, 0.52, 0.415]} color="#e8b33c" mat={GOLD} />
      <Cyl rt={0.12} h={0.06} s={10} position={[0, 0.57, -0.02]} color="#e8b33c" mat={GOLD} />
      <Cone r={0.12} h={0.12} s={8} position={[0, 0.66, -0.02]} color="#7a1f2b" />
    </group>
  )
}

export function ChettiarShop() {
  return (
    <group>
      <RBox size={[0.8, 0.26, 0.4]} r={0.03} position={[0, 0.13, 0]} color="#b9733f" />
      <RBox size={[0.82, 0.03, 0.42]} r={0.01} position={[0, 0.27, 0]} color="#8a5130" />
      {/* grain sacks */}
      {[
        [-0.27, '#f3ead7'],
        [-0.09, '#eab12f'],
        [0.09, '#c8323a'],
        [0.27, '#3f9b4b'],
      ].map(([x, c]) => (
        <group key={x} position={[x, 0.28, 0.06]}>
          <Cyl rt={0.075} rb={0.08} h={0.12} s={8} position={[0, 0.06, 0]} color="#d8c7a0" mat={{ flat: true }} />
          <Cyl rt={0.07} h={0.02} s={8} position={[0, 0.125, 0]} color={c} mat={{ flat: true }} />
        </group>
      ))}
      {/* posts + striped awning */}
      <Cyl rt={0.02} h={0.6} position={[0.38, 0.55, -0.16]} color="#8a5130" />
      <Cyl rt={0.02} h={0.6} position={[-0.38, 0.55, -0.16]} color="#8a5130" />
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
        <RBox key={x} size={[0.2, 0.025, 0.36]} r={0.008} position={[x, 0.82, -0.02]} rotation={[0.35, 0, 0]} color={i % 2 ? '#f3ead7' : '#c8323a'} />
      ))}
      {/* weighing scale */}
      <group position={[0, 0.3, -0.12]}>
        <Cyl rt={0.008} h={0.24} position={[0, 0.12, 0]} color={BRASS} mat={BRASS_MAT} />
        <RBox size={[0.24, 0.012, 0.012]} r={0.004} position={[0, 0.24, 0]} color={BRASS} mat={BRASS_MAT} />
        <Cyl rt={0.045} rb={0.03} h={0.02} position={[0.11, 0.17, 0]} color={BRASS} mat={BRASS_MAT} />
        <Cyl rt={0.045} rb={0.03} h={0.02} position={[-0.11, 0.17, 0]} color={BRASS} mat={BRASS_MAT} />
      </group>
    </group>
  )
}

export function BrassVessels() {
  return (
    <group>
      <Ball r={0.13} w={12} hs={8} position={[-0.16, 0.12, 0]} scale={[1, 0.85, 1]} color={BRASS} mat={BRASS_MAT} />
      <Cyl rt={0.07} rb={0.09} h={0.06} position={[-0.16, 0.25, 0]} color={BRASS} mat={BRASS_MAT} />
      <Cyl rt={0.12} rb={0.09} h={0.14} s={12} position={[0.12, 0.07, 0.05]} color="#c98b5a" mat={{ rough: 0.35, metal: 0.7 }} />
      <Cyl rt={0.06} rb={0.05} h={0.12} s={12} position={[0.08, 0.06, -0.15]} color="#cfd3d6" mat={{ rough: 0.25, metal: 0.85 }} />
      <Cyl rt={0.16} rb={0.13} h={0.03} s={14} position={[0.2, 0.015, -0.1]} color={BRASS} mat={BRASS_MAT} />
    </group>
  )
}

export function Peacock() {
  return (
    <group rotation={[0, -0.4, 0]}>
      <Cyl rt={0.11} rb={0.13} h={0.05} s={10} position={[0, 0.025, 0]} color="#6e2a17" />
      <Ball r={0.11} position={[0, 0.2, 0]} scale={[0.85, 1, 1.15]} color="#1f6fa8" />
      <Cyl rt={0.03} rb={0.045} h={0.18} s={8} position={[0, 0.34, 0.07]} rotation={[0.25, 0, 0]} color="#1f6fa8" />
      <Ball r={0.045} position={[0, 0.44, 0.1]} color="#1f6fa8" />
      <Cone r={0.012} h={0.05} s={4} position={[0, 0.43, 0.16]} rotation={[Math.PI / 2, 0, 0]} color="#e8b33c" />
      {[-0.02, 0, 0.02].map((x) => (
        <Ball key={x} r={0.008} position={[x, 0.5, 0.09]} color="#1f6fa8" />
      ))}
      {/* fanned tail */}
      {Array.from({ length: 9 }, (_, i) => {
        const a = -1.1 + (i / 8) * 2.2
        return (
          <group key={i} position={[0, 0.2, -0.1]} rotation={[0, 0, a]}>
            <RBox size={[0.06, 0.48, 0.02]} r={0.01} position={[0, 0.24, 0]} color={i % 2 ? '#1c8a6e' : '#227a5e'} />
            <Disc r={0.035} position={[0, 0.42, 0.012]} color="#1f3f8f" />
            <Disc r={0.016} position={[0, 0.42, 0.014]} color="#e8b33c" />
          </group>
        )
      })}
    </group>
  )
}

export const PIECES = {
  kalasam: (p) => <Kalasam scale={1.35} {...p} />,
  kuthuvilakku: (p) => <Kuthuvilakku height={1.1} light {...p} />,
  mandapam: Mandapam,
  marapachi: Marapachi,
  elephant: Elephant,
  'chettiar-shop': ChettiarShop,
  'brass-vessels': BrassVessels,
  peacock: Peacock,
}
