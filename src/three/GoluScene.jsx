import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import Golu, { GoluLights } from './golu/Golu.jsx'
import Carousel from './golu/Carousel.jsx'
import { GOLU, computeLayout } from './golu/layout.js'
import Bommai from './bommai/Bommai.jsx'
import Petals from './Petals.jsx'
import SoftEnv from './SoftEnv.jsx'
import DragLayer from './DragLayer.jsx'
import { MAX_DPR, PORTRAIT_ASPECT } from '../lib/device.js'

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
      // an upright phone is narrow: stand further back (and look down a little more, over the
      // Bommais in front) so the neighbours and the name tag still fit
      const portrait = aspect < PORTRAIT_ASPECT
      const m = portrait ? 1.9 : 1
      const lift = portrait ? 1.5 : 1
      return { pos: [x - 0.15 * x * m, y + 0.5 + lift * m, z + 3.6 * m], target: [x, y + 0.5, z] }
    }
    case 'home':
    default:
      return { pos: [0, 4.4 * k, 12.6 * k], target: [0, 2.85, -3.1] }
  }
}

// The camera's target can't leave this box around the Golu, so panning never loses the scene.
const BOUNDS = new THREE.Box3(new THREE.Vector3(-5.6, 1.7, -7), new THREE.Vector3(5.6, 5, 1.2))
const MIN_DIST = 2.4
// how strongly a pinch or wheel zooms (1 = camera-controls' default)
const ZOOM_SPEED = 1.25
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
// a real mouse wheel sends big whole-number steps; a trackpad sends small, fractional ones
const isMouseWheel = (e) => e.deltaMode !== 0 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY))

// camera-controls (v2) actions, for the mouse buttons and touches below
const ACTION = { NONE: 0, ROTATE: 1, TRUCK: 2, TOUCH_ROTATE: 64, TOUCH_DOLLY_TRUCK: 4096 }

// Navigation (when `controlsEnabled`): drag to orbit within limits, two-finger scroll to pan,
// pinch / ctrl+scroll / mouse wheel to zoom. `view` carries one-off commands from the UI:
// { kind: 'reset' | 'in' | 'out', n } where n changes on every press.
// With more than one Golu (`carousel`, the Carousel's handle), dragging on past the edge of the orbit
// turns the stage by hand: let go far enough along (or flick) and `onTurnBy(±1)` turns to the next
// Golu. With `swipe` (touch screens), a sideways swipe turns the stage straight away instead, while
// exploring or placing. Every turn (`turnKey` changes) brings the camera back to the current shot.
function CameraRig({ shot, focus, controlsEnabled, view, carousel, onTurnBy, turnKey, swipe }) {
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
    c.dollySpeed = ZOOM_SPEED // two-finger pinch on touch screens
    const stop = () => (touched.current = true)
    c.addEventListener('controlstart', stop)
    return () => c.removeEventListener('controlstart', stop)
  }, [maxDist])

  // a turn of the carousel: frame the Golu now facing you
  useEffect(() => {
    const c = ref.current
    if (!c || !turnKey) return
    const s = shotFor(shot, aspect, focus)
    c.smoothTime = 0.7
    c.setLookAt(...s.pos, ...s.target, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnKey])

  // Turning the carousel by hand. Only at the overview (not while zoomed in on a Bommai), with one
  // finger or the left button, and not while a Bommai is carried (DragLayer switches the controls
  // off for that, so a gesture that finds them off has picked up a doll and stands down).
  // - Mouse: drag past the edge of the orbit. camera-controls turns a sideways drag of dx pixels into
  //   2π·dx/height of azimuth and stops at the limit; whatever the drag would have turned beyond the
  //   limit turns the stage instead, following the pointer.
  // - Touch (`swipe`): once a one-finger drag shows it's sideways, it's a swipe. It takes the gesture
  //   from the orbit and the stage follows the finger from the start. An up-and-down drag is left to
  //   the controls (tilting the view).
  const turnBy = useRef(onTurnBy)
  turnBy.current = onTurnBy
  const overview = useRef(true)
  overview.current = shot !== 'focus'
  const swipeOn = useRef(swipe)
  swipeOn.current = swipe
  useEffect(() => {
    if (!carousel) return
    const el = gl.domElement
    const pointers = new Set()
    let g = null // the gesture: { id, x0, y0, az0, kind: 'edge' | 'pending' | 'swipe' }
    const end = (commit) => {
      if (!g) return
      if (g.kind === 'swipe' && ref.current) ref.current.enabled = true // hand the orbit back
      const turning = g.kind !== 'pending'
      g = null
      const dir = turning ? carousel.current?.release() || 0 : 0
      if (commit && dir) turnBy.current?.(dir)
    }
    const down = (e) => {
      pointers.add(e.pointerId)
      const c = ref.current
      if (pointers.size > 1) return end(false) // a pinch: not a turn
      const touchSwipe = swipeOn.current && e.pointerType === 'touch'
      if (!c || !(touchSwipe || enabled.current) || !overview.current || carousel.current?.busy()) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      if (c.distance < limits.current.max * 0.5) return // zoomed right in: just look around
      g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, az0: c.getSpherical(new THREE.Spherical(), true).theta, kind: touchSwipe ? 'pending' : 'edge' }
    }
    const move = (e) => {
      if (!g || e.pointerId !== g.id) return
      const c = ref.current
      if (g.kind === 'pending') {
        const dx = e.clientX - g.x0
        const dy = e.clientY - g.y0
        if (Math.hypot(dx, dy) < 10) return
        if (!c?.enabled || Math.abs(dx) < Math.abs(dy) * 1.2) return end(false) // a doll picked up, or a tilt
        g.kind = 'swipe'
        c.enabled = false
      }
      if (g.kind === 'swipe') return carousel.current?.drag(clamp((g.x0 - e.clientX) / (el.clientWidth * 0.7), -1, 1))
      if (!c || !c.enabled || !enabled.current) return end(false)
      const h = el.clientHeight
      const az = g.az0 + (2 * Math.PI * (g.x0 - e.clientX)) / h
      const over = az - clamp(az, c.minAzimuthAngle, c.maxAzimuthAngle)
      const px = (over * h) / (2 * Math.PI)
      carousel.current?.drag(clamp(px / (el.clientWidth * 0.7), -1, 1))
    }
    const up = (e) => {
      pointers.delete(e.pointerId)
      if (g && e.pointerId === g.id) end(e.type === 'pointerup')
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      end(false)
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [gl, carousel])

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
      const k = view.kind === 'in' ? 0.66 : 1.5
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
        zoomTo(c.distance * Math.exp(e.deltaY * (e.ctrlKey ? 0.012 : 0.0015) * ZOOM_SPEED))
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
      zoomTo(startDist / Math.pow(e.scale, ZOOM_SPEED))
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
      mouseButtons={
        input
          ? { left: ACTION.ROTATE, middle: ACTION.TRUCK, right: ACTION.TRUCK, wheel: ACTION.NONE }
          : { left: ACTION.NONE, middle: ACTION.NONE, right: ACTION.NONE, wheel: ACTION.NONE }
      }
      touches={input ? { one: ACTION.TOUCH_ROTATE, two: ACTION.TOUCH_DOLLY_TRUCK, three: ACTION.NONE } : { one: ACTION.NONE, two: ACTION.NONE, three: ACTION.NONE }}
    />
  )
}

// On an upright phone the camera stands far back, so tags that shrink with distance would be
// unreadable there: they keep one size instead, and sit above the head rather than over the doll.
const usePortrait = () => useThree((s) => s.size.width / s.size.height < PORTRAIT_ASPECT)

// Every Bommai glides to its layout slot, so when someone joins the step the others shuffle over.
// `spawn` drives the arrival: 'pop' (first load), 'fly' (your placement), 'drop' (someone else, live).
// `onGrab` (your own Bommai) lets you pick it up and move it; a plain click still selects it.
// Without either (a Golu turned away, or the stage turning) it has no pointer handlers at all, so
// it never catches clicks meant for the Golu in front of it.
// The name tag shows only for the selected Bommai (yours says YOU), and never over the workshop.
function PlacedBommai({ b, target, spawn, isMine, showTag, onPick, onGrab, onLanded }) {
  const portrait = usePortrait()
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

  const interactive = !!(onPick || onGrab)
  useEffect(() => {
    if (interactive || !hover) return
    setHover(false)
    document.body.style.cursor = ''
  }, [interactive]) // eslint-disable-line react-hooks/exhaustive-deps
  const handlers = interactive
    ? {
        onPointerOver: (e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = onGrab ? 'grab' : 'pointer'
        },
        onPointerOut: () => {
          setHover(false)
          document.body.style.cursor = ''
        },
        onPointerDown: (e) => onGrab?.(e, b, tgt),
        onClick: (e) => {
          if (!onPick || onGrab) return
          e.stopPropagation()
          onPick(b)
        },
      }
    : {}

  return (
    <group ref={ref}>
      <group ref={inner} {...handlers}>
        <Bommai config={b} phaseKey={b.id} />
      </group>
      {showTag && (
        <Html position={[0, 1.32, 0]} center distanceFactor={portrait ? undefined : 9} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className={portrait ? 'tag-above' : undefined}>
            <div className={`nametag ${isMine ? 'mine' : ''}`}>
              {isMine && <span className="nametag-you">YOU</span>}
              {b.name || 'A friend'}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// Your new Bommai waiting on the kolam: hops a little until you pick it up and drag it onto a step.
function DraftOnKolam({ draft, onGrab }) {
  const portrait = usePortrait()
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
      {/* a larger, invisible grab area: at the full view the doll is smaller than a fingertip */}
      <mesh position={[0, 0.6, 0]} visible={false}>
        <cylinderGeometry args={[0.6, 0.6, 1.4, 12]} />
      </mesh>
      <Html position={[0, 1.25, 0]} center distanceFactor={portrait ? undefined : 6} style={{ pointerEvents: 'none' }}>
        <div className={portrait ? 'tag-above' : undefined}>
          <div className="nametag mine">
            <span className="nametag-you">YOU</span>
            {draft.name || 'Your Bommai'}
          </div>
          <div className="grab-hint">Drag me onto a step</div>
        </div>
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

// `golus`: how many Golus stand on the carousel; `turn` ({ golu, dir, n }, see Carousel) says which
// one faces you. Only that one is interactive: its Bommais, its spots and the draft all live in world
// space, which is where the Golu facing you stands. `onTurnBy(±1)` asks to turn to the next one;
// with `swipeToTurn` (touch screens) a sideways swipe turns it.
export default function GoluScene({
  bommais,
  golus = 1,
  turn = { golu: 1, dir: 0, n: 0 },
  onTurnBy,
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
  swipeToTurn = false,
}) {
  const active = turn.golu
  // each Golu's Bommais and where they stand on it
  const byGolu = useMemo(() => {
    const out = Array.from({ length: golus }, () => [])
    for (const b of bommais) out[(b.golu || 1) - 1]?.push(b)
    return out
  }, [bommais, golus])
  const layouts = useMemo(() => byGolu.map((list) => computeLayout(list)), [byGolu])
  const activeBommais = byGolu[active - 1] || []
  const layout = layouts[active - 1] || new Map()
  const carousel = useRef()
  const [turning, setTurning] = useState(false)
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
      dpr={[1, MAX_DPR]}
      frameloop={paused ? 'never' : 'always'}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: 34, position: [0, 4.4, 14], near: 0.1, far: 80 }}
      onPointerMissed={() => onPickBommai?.(null)}
    >
      <Suspense fallback={null}>
        <Lights />
        <SoftEnv intensity={0.22} />
        <CameraRig
          shot={shot}
          focus={focus}
          controlsEnabled={exploring}
          view={view}
          carousel={golus > 1 ? carousel : null}
          onTurnBy={onTurnBy}
          turnKey={turn.n}
          swipe={swipeToTurn && (mode === 'home' || placing)}
        />
        <GoluLights />
        <Carousel
          ref={carousel}
          count={golus}
          turn={turn}
          onTurning={setTurning}
          renderGolu={(g) => {
            const front = g === active && !turning
            return (
              <>
                <Golu golu={g} lights={false} />
                {byGolu[g - 1].map((b) => {
                  const t = layouts[g - 1].get(b.id)
                  if (!t || carrying === b.id) return null
                  const mine = myIds.includes(b.id)
                  return (
                    <PlacedBommai
                      key={b.id}
                      b={b}
                      target={t}
                      spawn={settled.current.has(b.id) ? undefined : spawns[b.id]}
                      isMine={mine}
                      showTag={tagId === b.id && !paused && front}
                      onPick={exploring && front ? onPickBommai : null}
                      onGrab={exploring && front && mine && canMove ? grabPlaced : null}
                    />
                  )
                })}
              </>
            )
          }}
        />
        {placing && draft && carrying !== 'draft' && <DraftOnKolam draft={draft} onGrab={turning ? undefined : grabDraft} />}
        <DragLayer
          ref={drag}
          bommais={activeBommais}
          showMarkers={placing && !turning}
          lens={placing || mode === 'placing'}
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
