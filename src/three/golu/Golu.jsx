import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GOLU } from './layout.js'
import { RBox, Ball, Gem, Cyl, Torus, GOLD, material } from '../prims.jsx'
import { PIECES, Kuthuvilakku } from '../traditional/Pieces.jsx'

const { W, H, D } = GOLU
const WOOD = '#7b4127'
const CLOTH = '#f5ead3'
const RISER = ['#8e1f2e', '#a3283a'] // alternating kumkum/maroon silk
const RISER_LOCKED = '#13505a' // peacock silk for the traditional tiers
const ZARI = '#e3a83a'

// Replaceable slots for the foundation pieces. Swap `piece` for the owner's own figurines
// (e.g. a glTF component) without touching anything else.
export const TRADITIONAL_SLOTS = [
  { step: 9, x: -3.9, piece: 'kuthuvilakku' },
  { step: 9, x: -2.1, piece: 'mandapam' },
  { step: 9, x: 0, piece: 'kalasam' },
  { step: 9, x: 2.1, piece: 'mandapam' },
  { step: 9, x: 3.9, piece: 'kuthuvilakku' },
  { step: 8, x: -3.8, piece: 'elephant' },
  { step: 8, x: -1.9, piece: 'marapachi' },
  { step: 8, x: 0, piece: 'brass-vessels' },
  { step: 8, x: 1.9, piece: 'chettiar-shop' },
  { step: 8, x: 3.8, piece: 'peacock' },
]

function Step({ k }) {
  const locked = k >= 8
  const front = GOLU.front(k)
  const depth = front - GOLU.backZ
  const y0 = (k - 1) * H
  const riser = locked ? RISER_LOCKED : RISER[k % 2]
  return (
    <group>
      {/* wooden body of the step */}
      <RBox size={[W, H, depth]} r={0.03} position={[0, y0 + H / 2, GOLU.backZ + depth / 2]} color={WOOD} receive mat={{ rough: 0.8 }} />
      {/* silk riser cloth + zari border */}
      <RBox size={[W - 0.3, H - 0.06, 0.03]} r={0.01} position={[0, y0 + H / 2 - 0.01, front + 0.012]} color={riser} receive shadow={false} mat={{ rough: 0.55 }} />
      <RBox size={[W - 0.3, 0.07, 0.035]} r={0.01} position={[0, y0 + H - 0.075, front + 0.016]} color={ZARI} mat={GOLD} shadow={false} />
      <RBox size={[W - 0.3, 0.025, 0.035]} r={0.008} position={[0, y0 + 0.05, front + 0.016]} color={ZARI} mat={GOLD} shadow={false} />
      {/* cream tread cloth, slightly overhanging */}
      <RBox size={[W - 0.2, 0.025, D + 0.04]} r={0.01} position={[0, y0 + H + 0.012, front - D / 2 + 0.02]} color={CLOTH} receive mat={{ rough: 0.95 }} />
      {/* end caps */}
      <RBox size={[0.18, H + 0.04, D + 0.02]} r={0.03} position={[W / 2 - 0.02, y0 + H / 2 + 0.02, front - D / 2]} color="#5e2f1b" receive />
      <RBox size={[0.18, H + 0.04, D + 0.02]} r={0.03} position={[-W / 2 + 0.02, y0 + H / 2 + 0.02, front - D / 2]} color="#5e2f1b" receive />
      <Ball r={0.05} position={[W / 2 - 0.02, y0 + H + 0.06, front - 0.05]} color={ZARI} mat={GOLD} />
      <Ball r={0.05} position={[-W / 2 + 0.02, y0 + H + 0.06, front - 0.05]} color={ZARI} mat={GOLD} />
      <RiserMotifs k={k} y0={y0} front={front} locked={locked} />
    </group>
  )
}

// little woven motifs along each riser (instanced so 9 steps stay cheap)
function RiserMotifs({ k, y0, front, locked }) {
  const ref = useRef()
  const count = 22
  const geo = useMemo(() => new THREE.OctahedronGeometry(0.035, 0), [])
  const mat = material(locked ? '#e8c46a' : '#f0c35a', { rough: 0.35, metal: 0.5 })
  const setRef = (m) => {
    if (!m || ref.current === m) return
    ref.current = m
    const d = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      d.position.set(-W / 2 + 0.55 + (i * (W - 1.1)) / (count - 1), y0 + H * 0.42, front + 0.03)
      d.scale.set(1, 1.4, 0.4)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  }
  return <instancedMesh ref={setRef} args={[geo, mat, count]} />
}

function TierGlow({ y, front, locked, selected }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.opacity = (selected ? 0.6 : 0.38) + Math.sin(clock.elapsedTime * 5) * 0.12
  })
  const color = locked ? '#5fa7a8' : '#ffb300'
  return (
    <group>
      <mesh ref={ref} position={[0, y + 0.034, front - D / 2 + 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W - 0.3, D - 0.05]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* glowing lip along the step edge */}
      <mesh position={[0, y + 0.03, front + 0.03]}>
        <boxGeometry args={[W - 0.25, 0.05, 0.05]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}

function TierHitZone({ k, state, onOver, onOut, onPick }) {
  const front = GOLU.front(k)
  const y = GOLU.top(k)
  const locked = k >= 8
  return (
    <group>
      <mesh
        position={[0, y + 0.55, front - D / 2]}
        onPointerOver={(e) => (e.stopPropagation(), onOver?.(k))}
        onPointerOut={(e) => (e.stopPropagation(), onOut?.(k))}
        onClick={(e) => (e.stopPropagation(), onPick?.(k))}
      >
        <boxGeometry args={[W, 1.1, D]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {state && <TierGlow y={y} front={front} locked={locked || state === 'full'} selected={state === 'selected'} />}
    </group>
  )
}

function kolamTexture() {
  const s = 1024
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')
  g.clearRect(0, 0, s, s)
  g.translate(s / 2, s / 2)
  const petals = (n, r1, r2, fill) => {
    for (let i = 0; i < n; i++) {
      g.save()
      g.rotate((i / n) * Math.PI * 2)
      g.beginPath()
      g.moveTo(0, -r1)
      g.bezierCurveTo(r2 * 0.45, -r1 - (r2 - r1) * 0.3, r2 * 0.3, -r2, 0, -r2)
      g.bezierCurveTo(-r2 * 0.3, -r2, -r2 * 0.45, -r1 - (r2 - r1) * 0.3, 0, -r1)
      if (fill) {
        g.fillStyle = typeof fill === 'function' ? fill(i) : fill
        g.fill()
      }
      g.stroke()
      g.restore()
    }
  }
  g.strokeStyle = '#fbf6ea'
  g.lineWidth = 9
  g.lineCap = 'round'
  // outer petals: alternating turmeric and kumkum powder
  petals(16, 250, 470, (i) => (i % 2 ? 'rgba(234,177,47,0.85)' : 'rgba(200,50,58,0.85)'))
  petals(8, 120, 290, 'rgba(63,155,75,0.85)')
  g.beginPath()
  g.arc(0, 0, 120, 0, Math.PI * 2)
  g.fillStyle = 'rgba(240,138,36,0.9)'
  g.fill()
  g.stroke()
  petals(8, 20, 110, 'rgba(251,246,234,0.95)')
  // pulli (dots)
  g.fillStyle = '#fbf6ea'
  for (let ring = 0; ring < 2; ring++) {
    const r = 500 - ring * 0
    const n = 32
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.1
      g.beginPath()
      g.arc(Math.cos(a) * r, Math.sin(a) * r, 8, 0, Math.PI * 2)
      g.fill()
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function Kolam() {
  const tex = useMemo(kolamTexture, [])
  return (
    <mesh position={[0, 0.006, 2.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[2.9, 2.9]} />
      <meshStandardMaterial map={tex} transparent roughness={1} depthWrite={false} />
    </mesh>
  )
}

function BananaPlant({ flip = 1 }) {
  const leaves = [0, 1, 2, 3, 4, 5]
  return (
    <group scale={[flip, 1, 1]}>
      <Cyl rt={0.11} rb={0.16} h={2.6} s={7} position={[0, 1.3, 0]} color="#7aa04a" mat={{ flat: true }} />
      {leaves.map((i) => {
        const a = (i / leaves.length) * Math.PI * 2
        const tilt = 0.75 + (i % 2) * 0.25
        return (
          <group key={i} position={[0, 2.5 + (i % 3) * 0.12, 0]} rotation={[0, a, 0]}>
            <group rotation={[0, 0, -tilt]}>
              <Ball r={0.5} w={6} hs={4} position={[0, 0.75, 0]} scale={[0.36, 1.6, 0.06]} color={i % 2 ? '#3f8f3c' : '#5aa848'} mat={{ flat: true }} />
            </group>
          </group>
        )
      })}
    </group>
  )
}

function Garland({ from, to, sag = 0.5, count = 26 }) {
  const ref = useRef()
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const pts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const t = i / (count - 1)
        const p = a.clone().lerp(b, t)
        p.y -= Math.sin(t * Math.PI) * sag
        return p
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [from.join(), to.join(), sag, count],
  )
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.8 + from[0]) * 0.02
  })
  return (
    <group ref={ref}>
      {pts.map((p, i) => (
        <Gem key={i} r={0.075} position={p} rotation={[i, i * 0.7, 0]} color={i % 3 === 0 ? '#f6b928' : i % 3 === 1 ? '#f08a24' : '#e8601c'} />
      ))}
    </group>
  )
}

function Toran({ y, z, width }) {
  const n = Math.floor(width / 0.38)
  return (
    <group position={[0, y, z]}>
      <RBox size={[width, 0.04, 0.04]} r={0.015} color="#8a5130" />
      {Array.from({ length: n }, (_, i) => (
        <Ball
          key={i}
          r={0.2}
          w={6}
          hs={4}
          position={[-width / 2 + 0.19 + i * 0.38, -0.26, 0.02]}
          scale={[0.36, 1.25, 0.08]}
          color={i % 2 ? '#2f7d3d' : '#4f9a44'}
          mat={{ flat: true }}
        />
      ))}
      {Array.from({ length: n - 1 }, (_, i) => (
        <Gem key={`m${i}`} r={0.06} position={[-width / 2 + 0.38 + i * 0.38, -0.05, 0.05]} color={i % 2 ? '#f6b928' : '#f08a24'} />
      ))}
    </group>
  )
}

function Room() {
  const backZ = GOLU.backZ - 0.25
  const wallH = 8.4
  return (
    <group>
      {/* diorama slab (red-oxide floor) */}
      <RBox size={[17, 0.5, 13.5]} r={0.12} position={[0, -0.25, backZ + 6.75 - 0.2]} color="#a4472f" receive mat={{ rough: 0.5 }} />
      <RBox size={[17.1, 0.12, 13.6]} r={0.05} position={[0, -0.47, backZ + 6.75 - 0.2]} color="#5e2f1b" receive />
      {/* back wall */}
      <RBox size={[17, wallH, 0.4]} r={0.1} position={[0, wallH / 2, backZ - 0.2]} color="#f0d2a4" receive mat={{ rough: 0.9 }} />
      <RBox size={[17.02, 1.1, 0.44]} r={0.06} position={[0, 0.55, backZ - 0.2]} color="#c97a3e" receive />
      <RBox size={[17.04, 0.08, 0.46]} r={0.03} position={[0, 1.12, backZ - 0.2]} color={ZARI} mat={GOLD} />
      {/* painted arch behind the Golu */}
      <mesh position={[0, 4.3, backZ + 0.01]} receiveShadow>
        <circleGeometry args={[4.9, 48, 0, Math.PI]} />
        <meshStandardMaterial color="#e7bf8a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 4.3, backZ + 0.015]}>
        <ringGeometry args={[4.75, 4.9, 48, 1, 0, Math.PI]} />
        <meshStandardMaterial color="#b8452f" roughness={0.8} />
      </mesh>
      {/* pillars */}
      {[-7.2, 7.2].map((x) => (
        <group key={x} position={[x, 0, backZ + 0.45]}>
          <RBox size={[0.7, 0.3, 0.7]} r={0.05} position={[0, 0.15, 0]} color="#5e2f1b" />
          <Cyl rt={0.22} rb={0.25} h={7.3} s={8} position={[0, 3.95, 0]} color="#7b4127" mat={{ flat: true, rough: 0.6 }} />
          {[1.4, 3.2, 5.6].map((y) => (
            <Torus key={y} r={0.25} t={0.05} rs={4} ts={8} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} color={ZARI} mat={GOLD} />
          ))}
          <RBox size={[0.8, 0.3, 0.8]} r={0.05} position={[0, 7.7, 0]} color="#5e2f1b" />
        </group>
      ))}
      <RBox size={[15.2, 0.32, 0.5]} r={0.06} position={[0, 7.9, backZ + 0.45]} color="#5e2f1b" />
      <Toran y={7.66} z={backZ + 0.75} width={14} />
      <Garland from={[-6.9, 7.3, backZ + 0.85]} to={[0, 7.3, backZ + 0.85]} sag={0.7} />
      <Garland from={[0, 7.3, backZ + 0.85]} to={[6.9, 7.3, backZ + 0.85]} sag={0.7} />
      {/* hanging marigold strands at the pillars */}
      {[-6.9, 6.9].map((x) =>
        Array.from({ length: 10 }, (_, i) => (
          <Gem key={`${x}${i}`} r={0.075} position={[x, 7.3 - i * 0.16, backZ + 0.85]} rotation={[i, i, 0]} color={i % 2 ? '#f6b928' : '#f08a24'} />
        )),
      )}
      {/* banana plants flank the Golu */}
      <group position={[-6.3, 0, 0.6]}>
        <BananaPlant />
      </group>
      <group position={[6.3, 0, 0.6]}>
        <BananaPlant flip={-1} />
      </group>
      {/* floor lamps */}
      <group position={[-4.4, 0, 2.2]}>
        <Kuthuvilakku height={1.6} light />
      </group>
      <group position={[4.4, 0, 2.2]}>
        <Kuthuvilakku height={1.6} light />
      </group>
      <Kolam />
    </group>
  )
}

function TraditionalPieces() {
  return TRADITIONAL_SLOTS.map((s, i) => {
    const Piece = PIECES[s.piece]
    return (
      <group key={i} position={[s.x, GOLU.top(s.step) + 0.025, GOLU.standZ(s.step)]} scale={1.2}>
        <Piece />
      </group>
    )
  })
}

export default function Golu({ tierStates = {}, onTierOver, onTierOut, onTierPick, interactive }) {
  const steps = Array.from({ length: GOLU.steps }, (_, i) => i + 1)
  return (
    <group>
      <Room />
      {steps.map((k) => (
        <Step key={k} k={k} />
      ))}
      <TraditionalPieces />
      {interactive &&
        steps.map((k) => <TierHitZone key={k} k={k} state={tierStates[k]} onOver={onTierOver} onOut={onTierOut} onPick={onTierPick} />)}
    </group>
  )
}

