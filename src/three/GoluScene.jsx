import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import Golu from './golu/Golu.jsx'
import { GOLU, computeLayout } from './golu/layout.js'
import Bommai from './bommai/Bommai.jsx'
import Petals from './Petals.jsx'
import SoftEnv from './SoftEnv.jsx'
import DragLayer from './DragLayer.jsx'

const HELD = new THREE.Vector3(-2.8, 0.02, 2.0) // where your Bommai waits, on the floor in front of the Golu
const DRAFT_SCALE = 1.25

function shotFor(name, aspect, focus) {
  // pull back on narrow screens so the whole Golu still fits
  const k = Math.max(1.18, 2.1 / aspect) // the bottom step is 14.2 wide
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

// The camera's target can't leave this box around the Golu, so panning never loses the scene.
const BOUNDS = new THREE.Box3(new THREE.Vector3(-5.6, 1.7, -7), new THREE.Vector3(5.6, 5, 1.2))
const MIN_DIST = 3
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
// a real mouse wheel sends big whole-number steps; a trackpad sends small, fractional ones
const isMouseWheel = (e) => e.deltaMode !== 0 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY))

// Navigation (when `controlsEnabled`): drag to orbit within limits, two-finger scroll to pan,
// pinch / ctrl+scroll / mouse wheel to zoom. `view` carries one-off commands from the UI:
// { kind: 'reset' | 'in' | 'out', n } where n changes on every press.
function CameraRig({ shot, focus, controlsEnabled, view }) {
  const ref = useRef()
  const { size, gl } = useThree()
  const aspect = size.width / size.height
  const focusKey = focus ? focus.join(',') : ''
  const touched = useRef(false) // stop the idle drift once someone starts exploring
  const enabled = useRef(controlsEnabled)
  enabled.current = controlsEnabled
  const home = shotFor('home', aspect)
  const maxDist = dist(home.pos, home.target) * 1.15
  const limits = useRef({ min: MIN_DIST, max: maxDist })
  limits.current = { min: MIN_DIST, max: maxDist }

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
    c.setBoundary(BOUNDS)
    c.boundaryFriction = 0.2
    c.minDistance = MIN_DIST
    c.maxDistance = maxDist
    c.minPolarAngle = 0.95 // not straight down
    c.maxPolarAngle = 1.5 // never below the floor
    c.minAzimuthAngle = -0.7
    c.maxAzimuthAngle = 0.7
    c.truckSpeed = 1.4
    const stop = () => (touched.current = true)
    c.addEventListener('controlstart', stop)
    return () => c.removeEventListener('controlstart', stop)
  }, [maxDist])

  // reset / zoom buttons
  useEffect(() => {
    const c = ref.current
    if (!c || !view?.n) return
    c.smoothTime = 0.45
    if (view.kind === 'reset') {
      const s = shotFor(shot, aspect, focus)
      c.setLookAt(...s.pos, ...s.target, true)
    } else {
      touched.current = true
      const k = view.kind === 'in' ? 0.72 : 1.38
      c.dollyTo(clamp(c.distance * k, limits.current.min, limits.current.max), true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view?.n])

  // Wheel and trackpad: two-finger scroll pans, pinch (ctrl+wheel in Chrome/Firefox) or a mouse wheel zooms.
  useEffect(() => {
    const el = gl.domElement
    const zoomTo = (d) => {
      const c = ref.current
      c.smoothTime = 0.12
      c.dollyTo(clamp(d, limits.current.min, limits.current.max), true)
    }
    const onWheel = (e) => {
      const c = ref.current
      if (!c || !enabled.current) return
      e.preventDefault()
      touched.current = true
      if (e.ctrlKey || isMouseWheel(e)) {
        zoomTo(c.distance * Math.exp(e.deltaY * (e.ctrlKey ? 0.012 : 0.0015)))
      } else {
        c.smoothTime = 0.12
        const k = c.distance * 0.0011
        c.truck(e.deltaX * k, e.deltaY * k, true)
      }
    }
    // Safari reports trackpad pinches as gesture events instead of ctrl+wheel
    let startDist = 0
    const onGestureStart = (e) => {
      if (!ref.current || !enabled.current) return
      e.preventDefault()
      touched.current = true
      startDist = ref.current.distance
    }
    const onGestureChange = (e) => {
      if (!ref.current || !enabled.current || !startDist) return
      e.preventDefault()
      zoomTo(startDist / e.scale)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('gesturestart', onGestureStart)
    el.addEventListener('gesturechange', onGestureChange)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('gesturestart', onGestureStart)
      el.removeEventListener('gesturechange', onGestureChange)
    }
  }, [gl])

  // gentle idle drift on the home screen until someone starts exploring
  useFrame(({ clock }) => {
    const c = ref.current
    if (!c || shot !== 'home' || touched.current) return
    const s = shotFor('home', aspect)
    const t = clock.elapsedTime * 0.12
    c.setLookAt(s.pos[0] + Math.sin(t) * 1.1, s.pos[1] + Math.sin(t * 0.7) * 0.15, s.pos[2], ...s.target, true)
  })

  // drei only ticks enabled controls, so keep them enabled and switch user input instead.
  // Left drag orbits, right drag pans; one finger orbits, two fingers pinch-zoom and pan.
  // The wheel is handled above (camera-controls' own wheel action is off).
  const input = controlsEnabled
  return (
    <CameraControls
      ref={ref}
      makeDefault
      mouseButtons={input ? { left: 1, middle: 2, right: 2, wheel: 0 } : { left: 0, middle: 0, right: 0, wheel: 0 }}
      touches={input ? { one: 32, two: 1024, three: 0 } : { one: 0, two: 0, three: 0 }}
    />
  )
}

// Every Bommai glides to its layout slot, so when someone joins the step the others shuffle over.
// `spawn` drives the arrival: 'pop' (first load), 'fly' (your placement), 'drop' (someone else, live).
// `onGrab` (your own Bommai) lets you pick it up and move it; a plain click still shows the name tag.
function PlacedBommai({ b, target, spawn, isMine, showTag, onPick, onGrab, onLanded }) {
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
        s.phase = spawn?.type || 'idle' // the spawn can be cancelled before it starts
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
          if (!onPick && !onGrab) return
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = onGrab ? 'grab' : 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
        onPointerDown={(e) => onGrab?.(e, b, tgt)}
        onClick={(e) => {
          if (!onPick || onGrab) return
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

// Your new Bommai waiting on the kolam: hops a little until you pick it up and drag it onto a step.
function DraftOnKolam({ draft, onGrab }) {
  const ref = useRef()
  useFrame(({ clock }, dt) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    const hop = Math.max(0, Math.sin(t * 4.2)) * 0.12
    g.position.set(HELD.x, HELD.y + hop, HELD.z)
    g.rotation.y += (Math.sin(t * 0.8) * 0.3 - g.rotation.y) * (1 - Math.exp(-dt * 6))
  })
  return (
    <group
      ref={ref}
      scale={DRAFT_SCALE}
      onPointerOver={(e) => (e.stopPropagation(), (document.body.style.cursor = 'grab'))}
      onPointerOut={() => (document.body.style.cursor = '')}
      onPointerDown={onGrab}
    >
      <Bommai config={draft} idle={false} />
      <Html position={[0, 1.25, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div className="nametag mine">
          <span className="nametag-you">YOU</span>
          {draft.name || 'Your Bommai'}
        </div>
        <div className="grab-hint">Drag me onto a step</div>
      </Html>
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
  canMove,
  onDropBommai,
  onReject,
  focusId,
  tagId,
  onPickBommai,
  celebrate,
  paused,
  view,
}) {
  const layout = useMemo(() => computeLayout(bommais), [bommais])
  const placing = mode === 'place'
  const exploring = mode === 'home' || mode === 'done'
  const focusTarget = focusId && layout.get(focusId)
  const shot = focusTarget ? 'focus' : placing || mode === 'placing' ? 'place' : 'home'
  const focus = focusTarget ? [focusTarget.x, focusTarget.y, focusTarget.z] : null
  const drag = useRef()
  const [carrying, setCarrying] = useState(null) // key of the Bommai being carried ('draft' or an id)
  // a Bommai that has been carried reappears where it was put down, without replaying its arrival
  const settled = useRef(new Set())
  const onDragChange = (key) => {
    if (key === null && carrying && carrying !== 'draft') settled.current.add(carrying)
    setCarrying(key)
  }

  const grabDraft = (e) =>
    drag.current?.press(e, { key: 'draft', kind: 'draft', config: draft, origin: [HELD.x, HELD.y, HELD.z], scale: DRAFT_SCALE })
  const grabPlaced = (e, b, at) => drag.current?.press(e, { key: b.id, kind: 'placed', id: b.id, config: b, origin: [at.x, at.y, at.z], scale: 1 })

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
        <CameraRig shot={shot} focus={focus} controlsEnabled={exploring} view={view} />
        <Golu />
        {bommais.map((b) => {
          const t = layout.get(b.id)
          if (!t || carrying === b.id) return null
          const mine = myIds.includes(b.id)
          return (
            <PlacedBommai
              key={b.id}
              b={b}
              target={t}
              spawn={settled.current.has(b.id) ? undefined : spawns[b.id]}
              isMine={mine}
              showTag={tagId === b.id}
              onPick={exploring ? onPickBommai : null}
              onGrab={exploring && mine && canMove ? grabPlaced : null}
            />
          )
        })}
        {placing && draft && carrying !== 'draft' && <DraftOnKolam draft={draft} onGrab={grabDraft} />}
        <DragLayer
          ref={drag}
          bommais={bommais}
          showMarkers={placing}
          onDrop={onDropBommai}
          onReject={onReject}
          onDragChange={onDragChange}
          onClickItem={(item) => item.kind === 'placed' && onPickBommai?.(item.config)}
        />
        {celebrate && <Petals key={celebrate.key} center={celebrate.at} />}
      </Suspense>
    </Canvas>
  )
}

export { GOLU }
