import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import Golu from './golu/Golu.jsx'
import { GOLU, computeLayout, nextSlotPreview } from './golu/layout.js'
import Bommai from './bommai/Bommai.jsx'
import Petals from './Petals.jsx'
import SoftEnv from './SoftEnv.jsx'
import { Torus } from './prims.jsx'

const HELD = new THREE.Vector3(-2.8, 0.02, 2.0) // where your Bommai waits, on the floor in front of the Golu

function slotFor(bommais, step, draft) {
  const p = nextSlotPreview(bommais, step, draft)
  return [p.x, p.y, p.z]
}

function shotFor(name, aspect, focus) {
  // pull back on narrow screens so the whole Golu still fits
  const k = Math.max(1, 1.75 / aspect)
  switch (name) {
    case 'place':
      return { pos: [-0.6, 4.3 * k, 11.4 * k], target: [0, 2.2, -2.4] }
    case 'focus': {
      const [x, y, z] = focus
      return { pos: [x * 0.85, y + 1.5, z + 3.6], target: [x, y + 0.5, z] }
    }
    case 'home':
    default:
      return { pos: [0, 4.4 * k, 12.6 * k], target: [0, 2.85, -3.1] }
  }
}

function CameraRig({ shot, focus, controlsEnabled }) {
  const ref = useRef()
  const { size } = useThree()
  const aspect = size.width / size.height
  const focusKey = focus ? focus.join(',') : ''
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const s = shotFor(shot, aspect, focus)
    c.smoothTime = shot === 'focus' ? 0.45 : 0.7
    c.setLookAt(...s.pos, ...s.target, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shot, focusKey, aspect])
  useEffect(() => {
    const c = ref.current
    if (!c) return
    c.minDistance = 2.5
    c.maxDistance = 22
    c.minPolarAngle = 0.6
    c.maxPolarAngle = 1.62
    c.minAzimuthAngle = -0.85
    c.maxAzimuthAngle = 0.85
  }, [])
  // gentle idle drift on the home screen so the diorama feels alive
  useFrame(({ clock }) => {
    const c = ref.current
    if (!c || shot !== 'home' || controlsEnabled) return
    const s = shotFor('home', aspect)
    const t = clock.elapsedTime * 0.12
    c.setLookAt(s.pos[0] + Math.sin(t) * 1.1, s.pos[1] + Math.sin(t * 0.7) * 0.15, s.pos[2], ...s.target, true)
  })
  // drei only ticks enabled controls, so keep them enabled and switch user input instead
  const input = controlsEnabled
  return (
    <CameraControls
      ref={ref}
      makeDefault
      mouseButtons={input ? { left: 1, middle: 0, right: 2, wheel: 8 } : { left: 0, middle: 0, right: 0, wheel: 0 }}
      touches={input ? { one: 32, two: 1024, three: 0 } : { one: 0, two: 0, three: 0 }}
    />
  )
}

// Every Bommai glides to its layout slot, so when someone joins the step the others shuffle over.
// `spawn` drives the arrival: 'pop' (first load), 'fly' (your placement), 'drop' (someone else, live).
function PlacedBommai({ b, target, spawn, isMine, showTag, onPick, onLanded }) {
  const ref = useRef()
  const inner = useRef()
  const st = useRef({ phase: spawn ? 'wait' : 'idle', start: null, from: null, landedAt: null })
  const [hover, setHover] = useState(false)
  const tgt = useMemo(() => new THREE.Vector3(target.x, target.y, target.z), [target.x, target.y, target.z])

  useEffect(() => {
    if (!ref.current) return
    if (spawn?.type === 'fly') ref.current.position.copy(HELD)
    else if (spawn?.type === 'drop') ref.current.position.set(tgt.x, tgt.y + 2.5, tgt.z)
    else ref.current.position.copy(tgt)
    if (spawn?.type === 'pop') ref.current.scale.setScalar(0.001)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(({ clock }, dt) => {
    const g = ref.current
    if (!g) return
    const now = clock.elapsedTime
    const s = st.current
    if (s.phase === 'wait') {
      if (s.start == null) s.start = now + (spawn?.delay || 0)
      if (now >= s.start) {
        s.phase = spawn.type
        s.from = g.position.clone()
      } else return
    }
    if (s.phase === 'pop') {
      const t = Math.min(1, (now - s.start) / 0.55)
      const e = 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2) // back-out
      g.scale.setScalar(Math.max(0.001, e))
      if (t >= 1) (s.phase = 'idle'), g.scale.setScalar(1)
      return
    }
    if (s.phase === 'fly' || s.phase === 'drop') {
      const dur = s.phase === 'fly' ? 1.25 : 0.7
      const t = Math.min(1, (now - s.start) / dur)
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      g.position.lerpVectors(s.from, tgt, e)
      if (s.phase === 'fly') g.position.y += Math.sin(t * Math.PI) * 2.6
      g.rotation.y = s.phase === 'fly' ? (1 - e) * Math.PI * 2 : 0
      if (t >= 1) {
        s.phase = 'land'
        s.landedAt = now
        g.rotation.y = 0
        onLanded?.(b)
      }
      return
    }
    if (s.phase === 'land') {
      const t = (now - s.landedAt) / 0.6
      const squash = Math.exp(-t * 5) * Math.cos(t * 18) * 0.22
      if (inner.current) inner.current.scale.set(1 + squash * 0.6, 1 - squash, 1 + squash * 0.6)
      if (t >= 1) {
        s.phase = 'idle'
        inner.current?.scale.set(1, 1, 1)
      }
      return
    }
    // idle: ease toward slot (shuffle when the step re-lays out)
    g.position.lerp(tgt, 1 - Math.exp(-dt * 5))
    const lift = hover ? 0.12 : 0
    if (inner.current) inner.current.position.y += (lift - inner.current.position.y) * (1 - Math.exp(-dt * 12))
  })

  return (
    <group ref={ref}>
      <group
        ref={inner}
        onPointerOver={(e) => {
          if (!onPick) return
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          if (!onPick) return
          e.stopPropagation()
          onPick(b)
        }}
      >
        <Bommai config={b} phaseKey={b.id} />
      </group>
      {(showTag || isMine) && (
        <Html position={[0, 1.32, 0]} center distanceFactor={9} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`nametag ${isMine ? 'mine' : ''}`}>
            {isMine && <span className="nametag-you">YOU</span>}
            {b.name || 'A friend'}
          </div>
        </Html>
      )}
    </group>
  )
}

function DraftOnKolam({ draft, aimStep }) {
  const ref = useRef()
  useFrame(({ clock }, dt) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    // little excited hops while waiting to be placed
    const hop = Math.max(0, Math.sin(t * 4.2)) * 0.12
    g.position.set(HELD.x, HELD.y + hop, HELD.z)
    const want = aimStep ? 0 : Math.sin(t * 0.8) * 0.3
    g.rotation.y += (want - g.rotation.y) * (1 - Math.exp(-dt * 6))
  })
  return (
    <group ref={ref} scale={1.25}>
      <Bommai config={draft} idle={false} />
      <Html position={[0, 1.2, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div className="nametag mine">
          <span className="nametag-you">YOU</span>
          {draft.name || 'Your Bommai'}
        </div>
      </Html>
    </group>
  )
}

function SlotMarker({ at }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    const s = 1 + Math.sin(t * 5) * 0.08
    ref.current.scale.set(s, s, s)
    ref.current.children[1].position.y = 1.25 + Math.sin(t * 5) * 0.08
  })
  return (
    <group ref={ref} position={at}>
      <Torus r={0.32} t={0.035} rs={6} ts={28} position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} color="#ffcf5a" mat={{ emissive: '#ffb300', emissiveIntensity: 1.4 }} shadow={false} />
      <mesh position={[0, 1.25, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.13, 0.26, 4]} />
        <meshStandardMaterial color="#ffcf5a" emissive="#ffb300" emissiveIntensity={1.2} flatShading />
      </mesh>
    </group>
  )
}

function Lights() {
  return (
    <>
      <hemisphereLight args={['#fff0d6', '#9a4a2c', 0.85]} />
      <directionalLight
        position={[-6, 13, 11]}
        intensity={2.3}
        color="#ffe3bd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
      />
      <directionalLight position={[8, 6, 6]} intensity={0.55} color="#ffc9b0" />
      <spotLight position={[0, 9, 2]} angle={0.45} penumbra={0.9} intensity={18} distance={20} color="#ffd38a" target-position={[0, 5.2, -7]} />
    </>
  )
}

export default function GoluScene({
  bommais,
  mode,
  draft,
  myIds,
  spawns,
  selectedStep,
  hoverStep,
  onHoverStep,
  onPickStep,
  onLanded,
  focusId,
  tagId,
  onPickBommai,
  celebrate,
  paused,
}) {
  const layout = useMemo(() => computeLayout(bommais), [bommais])
  const placing = mode === 'place'
  const tierStates = {}
  if (placing) {
    for (let k = 1; k <= 9; k++) {
      if (k === selectedStep) tierStates[k] = 'selected'
      else if (k === hoverStep) tierStates[k] = 'hover'
    }
  }
  const focusTarget = focusId && layout.get(focusId)
  const shot = focusTarget ? 'focus' : placing || mode === 'placing' ? 'place' : 'home'
  const focus = focusTarget ? [focusTarget.x, focusTarget.y, focusTarget.z] : null

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop={paused ? 'never' : 'always'}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: 34, position: [0, 4.4, 14], near: 0.1, far: 80 }}
      onPointerMissed={() => onPickBommai?.(null)}
    >
      <Suspense fallback={null}>
        <Lights />
        <SoftEnv intensity={0.22} />
        <CameraRig shot={shot} focus={focus} controlsEnabled={mode === 'explore'} />
        <Golu
          interactive={placing}
          tierStates={tierStates}
          onTierOver={(k) => onHoverStep?.(k)}
          onTierOut={() => onHoverStep?.(null)}
          onTierPick={(k) => onPickStep?.(k)}
        />
        {bommais.map((b) => {
          const t = layout.get(b.id)
          if (!t) return null
          return (
            <PlacedBommai
              key={b.id}
              b={b}
              target={t}
              spawn={spawns[b.id]}
              isMine={myIds.includes(b.id)}
              showTag={tagId === b.id}
              onPick={mode === 'explore' || mode === 'done' || mode === 'home' ? onPickBommai : null}
              onLanded={onLanded}
            />
          )
        })}
        {placing && draft && <DraftOnKolam draft={draft} aimStep={selectedStep || hoverStep} />}
        {placing && selectedStep && <SlotMarker key={selectedStep} at={slotFor(bommais, selectedStep, draft)} />}
        {celebrate && <Petals key={celebrate.key} center={celebrate.at} />}
      </Suspense>
    </Canvas>
  )
}

export { GOLU }
