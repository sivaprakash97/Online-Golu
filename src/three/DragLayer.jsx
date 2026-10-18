import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Bommai from './bommai/Bommai.jsx'
import { standsOffCentre } from './bommai/build.js'
import { Torus, Disc } from './prims.jsx'
import { GOLU, slotPos, freeSlots, pickStep } from './golu/layout.js'
import { OPEN_STEPS, SPOTS_PER_GOLU } from '../data/options.js'

// Drag and drop for Bommais, picked up by the head.
// press(event, item) starts a gesture on a doll; past a few pixels it becomes a drag. The doll then
// hangs from the pointer by the top of its head and swings like a pendulum as it is carried.
// Free spots glow; dropping on one lowers it onto the step, dropping on the traditional steps (8, 9)
// or anywhere else floats it back to where it came from.
// With `lens` (placing a new Bommai), holding the doll zooms the view in a little (GRAB_ZOOM) around
// your finger, and while you carry it the zoomed view slides toward wherever your finger goes: drag to
// the top right of the screen and the top right of the Golu comes into view. The point under your
// finger is always the one that was there in the full view, so every spot stays in reach. It's a crop
// of the same shot (camera.setViewOffset), so nothing shifts in perspective. After a good drop it
// stays zoomed until `lens` turns off (the celebration is over); a tap or a missed drop zooms out.
//   item: { key, kind: 'draft' | 'placed', id?, config, origin: [x, y, z] (base), scale }

const HEAD_TOP = 1.0 // top of the head above the pedestal base, for an unscaled Bommai
const HANG = 0.45 // how far the pedestal dangles above the step while carried
const DRAG_PX = 6
const G = 9.8
const ARM = 0.75 // pendulum length
const MAX_SWING = 0.8 // radians; a flick swings it about 45° at most
const MAX_ACC = 25
const GRAB_ZOOM = 1.3
const v3 = (a) => new THREE.Vector3(...a)

const baseFor = (config, step, slot) => {
  const p = slotPos(step, slot)
  if (standsOffCentre(config)) p.x -= 0.17
  return [p.x, p.y, p.z]
}

// Free spots. On a crowded Golu (`tall`: half its spots or fewer left) the dolls on the step below
// hide a spot's ring, so each free spot also sends up a soft column of light and has a little gold
// diamond bobbing above head height, where nothing stands in front of it. On a roomy Golu the rings
// are easy to see and only the spot under the pointer lights up. It swells and burns brighter.
const BEAM_H = 1.15
const PIN_Y = 1.32 // above the heads of the dolls one step down
let markerParts
function getMarkerParts() {
  if (markerParts) return markerParts
  // fades from the step upward (a cylinder's uv.y runs 0 at the bottom to 1 at the top; alphaMap reads green)
  const n = 32
  const data = new Uint8Array(n * 4)
  for (let i = 0; i < n; i++) data.set([255, Math.round(255 * Math.pow(1 - i / (n - 1), 1.6)), 255, 255], i * 4)
  const fade = new THREE.DataTexture(data, 1, n)
  fade.needsUpdate = true
  const beam = (opacity) =>
    new THREE.MeshBasicMaterial({ color: '#ffc23a', alphaMap: fade, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  // a soft round glow behind the diamond
  const m = 32
  const halo = new Uint8Array(m * m * 4)
  for (let y = 0; y < m; y++)
    for (let x = 0; x < m; x++) {
      const r = Math.hypot(x - (m - 1) / 2, y - (m - 1) / 2) / (m / 2)
      halo.set([255, 200, 80, Math.round(255 * Math.pow(Math.max(0, 1 - r), 2))], (y * m + x) * 4)
    }
  const haloTex = new THREE.DataTexture(halo, m, m)
  haloTex.needsUpdate = true
  const pinGeo = new THREE.OctahedronGeometry(0.13, 0)
  pinGeo.scale(1, 1.6, 1)
  markerParts = {
    beamGeo: new THREE.CylinderGeometry(0.22, 0.22, BEAM_H, 20, 1, true).translate(0, BEAM_H / 2, 0),
    beam: beam(0.5),
    beamHot: beam(1),
    pinGeo,
    pin: new THREE.MeshStandardMaterial({ color: '#ffe08a', emissive: '#ffb300', emissiveIntensity: 1.2, roughness: 0.35, metalness: 0.3, flatShading: true }),
    halo: new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.9 }),
  }
  return markerParts
}

function SlotMarker({ at, active, tall }) {
  const ring = useRef()
  const pin = useRef()
  const parts = getMarkerParts()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ring.current) ring.current.scale.setScalar((active ? 1.35 : 1) + Math.sin(t * 4 + at[0]) * 0.05)
    if (pin.current) {
      pin.current.position.y = PIN_Y + Math.sin(t * 3 + at[0] * 1.7) * 0.06 + (active ? 0.08 : 0)
      pin.current.rotation.y = t * 1.6 + at[0]
      pin.current.scale.setScalar(active ? 1.35 : 1)
    }
  })
  return (
    <group position={[at[0], at[1] + 0.03, at[2]]}>
      <group ref={ring}>
        <Torus r={0.26} t={0.026} rs={6} ts={32} rotation={[Math.PI / 2, 0, 0]} color="#ffcf5a" mat={{ emissive: '#ffb300', emissiveIntensity: active ? 2 : 1.1 }} shadow={false} />
        <Disc r={0.25} s={32} rotation={[-Math.PI / 2, 0, 0]} color="#ffcf5a" mat={{ emissive: '#ffb300', emissiveIntensity: 0.8, opacity: active ? 0.4 : 0.18 }} />
      </group>
      {(tall || active) && <mesh geometry={parts.beamGeo} material={active ? parts.beamHot : parts.beam} renderOrder={2} />}
      {tall && (
        <group ref={pin} position={[0, PIN_Y, 0]}>
          <mesh geometry={parts.pinGeo} material={parts.pin} />
          <sprite material={parts.halo} scale={0.7} renderOrder={3} />
        </group>
      )}
    </group>
  )
}

function ReservedGlow({ step }) {
  const ref = useRef()
  useFrame(({ clock }) => ref.current && (ref.current.material.opacity = 0.35 + Math.sin(clock.elapsedTime * 6) * 0.12))
  return (
    <mesh ref={ref} position={[0, GOLU.top(step) + 0.035, GOLU.front(step) - GOLU.D / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[GOLU.width(step) - 0.3, GOLU.D - 0.05]} />
      <meshBasicMaterial color="#5fa7a8" transparent opacity={0.4} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

const DragLayer = forwardRef(function DragLayer({ bommais, showMarkers, lens, onDrop, onReject, onDragChange, onClickItem }, apiRef) {
  const { camera, gl, controls, size } = useThree()
  const [drag, setDrag] = useState(null) // the item being carried
  const [hover, setHover] = useState(null) // { step, slot } | { step, reserved } | { step, full }
  const grip = useRef()
  const swing = useRef()
  const scaler = useRef()
  const sim = useRef(null)
  const pointer = useRef({ x: 0, y: 0 })
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const latest = useRef({})
  latest.current = { bommais, onDrop, onReject, onDragChange, onClickItem, controls, hover, lens }
  // the zoom while placing: `on` is what it's heading for, z the zoom now, (fx, fy) the finger (0..1)
  const zoom = useRef({ on: false, z: 1, fx: 0.5, fy: 0.5 })

  const finish = () => {
    sim.current = null
    setDrag(null)
    setHover(null)
    if (latest.current.controls) latest.current.controls.enabled = true
    document.body.style.cursor = ''
    latest.current.onDragChange?.(null)
  }

  const begin = (item) => {
    const top = HEAD_TOP * item.scale
    const start = v3(item.origin).add(new THREE.Vector3(0, top, 0))
    sim.current = {
      item,
      phase: 'carry',
      pos: start.clone(),
      target: start.clone().add(new THREE.Vector3(0, 0.35, 0)),
      vel: new THREE.Vector3(),
      acc: new THREE.Vector3(),
      ax: 0, // swing about x (forward/back)
      az: 0, // swing about z (side to side)
      wx: 0,
      wz: 0,
      yaw: 0,
      scale: item.scale,
      squash: 0,
      t: 0,
    }
    if (latest.current.controls) latest.current.controls.enabled = false
    document.body.style.cursor = 'grabbing'
    setDrag(item)
    latest.current.onDragChange?.(item.key)
  }

  const release = () => {
    const s = sim.current
    if (!s || s.phase !== 'carry') return
    const h = latest.current.hover
    if (h && h.slot !== undefined) {
      s.phase = 'drop'
      s.drop = { step: h.step, slot: h.slot, base: baseFor(s.item.config, h.step, h.slot) }
      s.target = v3(s.drop.base).add(new THREE.Vector3(0, HEAD_TOP, 0))
    } else {
      if (h?.reserved) latest.current.onReject?.('reserved', h.step)
      else if (h?.full) latest.current.onReject?.('full', h.step)
      goBack(s)
    }
    setHover(null)
  }

  const goBack = (s) => {
    s.phase = 'return'
    s.target = v3(s.item.origin).add(new THREE.Vector3(0, HEAD_TOP * s.item.scale + 0.4, 0))
    zoom.current.on = false
  }

  useImperativeHandle(apiRef, () => ({
    press(e, item) {
      if (sim.current) return
      e.stopPropagation()
      const sx = e.clientX
      const sy = e.clientY
      pointer.current = { x: sx, y: sy }
      if (latest.current.lens) {
        const rect = gl.domElement.getBoundingClientRect()
        zoom.current.on = true
        if (zoom.current.z < 1.001) {
          zoom.current.fx = (sx - rect.left) / rect.width
          zoom.current.fy = (sy - rect.top) / rect.height
        }
      }
      // hold the camera still from the first press, so grabbing a doll never nudges the view,
      // and tell the camera rig someone is interacting (stops the idle drift)
      if (latest.current.controls) {
        latest.current.controls.enabled = false
        latest.current.controls.dispatchEvent?.({ type: 'controlstart' })
      }
      let dragging = false
      const move = (ev) => {
        pointer.current = { x: ev.clientX, y: ev.clientY }
        if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) > DRAG_PX) {
          dragging = true
          begin(item)
        }
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
        if (dragging) release()
        else {
          zoom.current.on = false
          if (latest.current.controls) latest.current.controls.enabled = true
          latest.current.onClickItem?.(item)
        }
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    },
  }))

  // never leave the camera locked (or zoomed) if this unmounts mid-drag
  useEffect(
    () => () => {
      if (latest.current.controls) latest.current.controls.enabled = true
      camera.clearViewOffset()
    },
    [camera],
  )
  useEffect(() => {
    if (!lens) zoom.current.on = false
  }, [lens])

  useFrame((_, rawDt) => {
    const L = zoom.current
    const want = lens && L.on ? GRAB_ZOOM : 1
    if (want === 1 && L.z === 1) return
    const dt = Math.min(rawDt, 1 / 30)
    if (L.on) {
      // follow the finger, a touch behind it, like a camera operator
      const rect = gl.domElement.getBoundingClientRect()
      const fx = THREE.MathUtils.clamp((pointer.current.x - rect.left) / rect.width, 0, 1)
      const fy = THREE.MathUtils.clamp((pointer.current.y - rect.top) / rect.height, 0, 1)
      const f = 1 - Math.exp(-dt * 10)
      L.fx += (fx - L.fx) * f
      L.fy += (fy - L.fy) * f
    }
    L.z += (want - L.z) * (1 - Math.exp(-dt * 7))
    if (Math.abs(want - L.z) < 0.002) L.z = want
    if (L.z === 1) {
      camera.clearViewOffset()
      return
    }
    // a window 1/z the size of the full view, placed so the finger's point stays where it was
    const { width: W, height: H } = size
    const w = W / L.z
    const h = H / L.z
    const cx = 0.5 + (L.fx - 0.5) * (1 - 1 / L.z)
    const cy = 0.5 + (L.fy - 0.5) * (1 - 1 / L.z)
    camera.setViewOffset(W, H, cx * W - w / 2, cy * H - h / 2, w, h)
  })

  const ndc = new THREE.Vector2()
  const tmp = new THREE.Vector3()
  const camDir = new THREE.Vector3()

  useFrame((_, rawDt) => {
    const s = sim.current
    if (!s || !grip.current) return
    const dt = Math.min(rawDt, 1 / 30)
    // the controls are switched off while carrying (so the view doesn't orbit), and drei only ticks
    // switched-on controls: let the camera finish any glide it was in the middle of
    const c = latest.current.controls
    if (c && !c.enabled) c.update(dt)

    if (s.phase === 'carry') {
      const rect = gl.domElement.getBoundingClientRect()
      ndc.set(((pointer.current.x - rect.left) / rect.width) * 2 - 1, -((pointer.current.y - rect.top) / rect.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const hit = pickStep(ray.ray)
      let next = null
      if (hit) {
        s.target.copy(hit.point).add(tmp.set(0, HEAD_TOP + HANG, 0))
        if (hit.step > OPEN_STEPS.length) next = { step: hit.step, reserved: true }
        else {
          const free = freeSlots(latest.current.bommais, hit.step, s.item.id)
          if (!free.length) next = { step: hit.step, full: true }
          else {
            const slot = free.reduce((a, b) => (Math.abs(slotPos(hit.step, b).x - hit.point.x) < Math.abs(slotPos(hit.step, a).x - hit.point.x) ? b : a))
            next = { step: hit.step, slot }
            // a gentle pull toward the spot it will land in
            s.target.x += (slotPos(hit.step, slot).x - s.target.x) * 0.3
          }
        }
      } else {
        // off the steps: keep the doll at the same depth, under the pointer
        camera.getWorldDirection(camDir)
        const t = s.pos.clone().sub(ray.ray.origin).dot(camDir) / ray.ray.direction.dot(camDir)
        if (t > 0) s.target.copy(ray.ray.origin).addScaledVector(ray.ray.direction, t)
      }
      s.target.x = THREE.MathUtils.clamp(s.target.x, -7, 7)
      s.target.y = THREE.MathUtils.clamp(s.target.y, 0.6, 9)
      s.target.z = THREE.MathUtils.clamp(s.target.z, -9, 4)
      const h = latest.current.hover
      if (h?.step !== next?.step || h?.slot !== next?.slot || !!h?.reserved !== !!next?.reserved) setHover(next)
    }

    // follow the target: snappy while carried, eased when dropping or going back
    const follow = s.phase === 'carry' ? 16 : s.phase === 'drop' ? 11 : 7
    const prev = s.pos.clone()
    s.pos.lerp(s.target, 1 - Math.exp(-dt * follow))
    const vel = s.pos.clone().sub(prev).divideScalar(Math.max(dt, 1e-4))
    s.acc.lerp(vel.clone().sub(s.vel).divideScalar(Math.max(dt, 1e-4)), 0.5)
    s.vel.copy(vel)

    // pendulum swing, driven by how the grip accelerates; heavily damped once standing
    const standing = s.phase === 'settle' || s.phase === 'wait'
    const damp = standing ? 14 : 2.4
    const steps = 2
    for (let i = 0; i < steps; i++) {
      const h = dt / steps
      const ax = THREE.MathUtils.clamp(s.acc.x, -MAX_ACC, MAX_ACC)
      const az = THREE.MathUtils.clamp(s.acc.z, -MAX_ACC, MAX_ACC)
      const pull = standing ? 6 : 1
      s.wz += (-(G / ARM) * pull * Math.sin(s.az) - damp * s.wz - (standing ? 0 : (ax / ARM) * Math.cos(s.az))) * h
      s.wx += (-(G / ARM) * pull * Math.sin(s.ax) - damp * s.wx + (standing ? 0 : (az / ARM) * Math.cos(s.ax))) * h
      s.az = THREE.MathUtils.clamp(s.az + s.wz * h, -MAX_SWING, MAX_SWING)
      s.ax = THREE.MathUtils.clamp(s.ax + s.wx * h, -MAX_SWING, MAX_SWING)
      if (Math.abs(s.az) === MAX_SWING) s.wz *= -0.3 // soft bounce off the limit
      if (Math.abs(s.ax) === MAX_SWING) s.wx *= -0.3
    }
    s.yaw += (THREE.MathUtils.clamp(-s.vel.x * 0.06, -0.35, 0.35) - s.yaw) * (1 - Math.exp(-dt * 6))
    s.scale += ((s.phase === 'return' ? s.item.scale : 1) - s.scale) * (1 - Math.exp(-dt * 8))

    const near = s.pos.distanceTo(s.target) < 0.02
    if (s.phase === 'drop' && near) {
      s.phase = 'settle'
      s.t = 0
      s.squash = 1
    } else if (s.phase === 'settle') {
      s.t += dt
      if (s.t > 0.35) {
        s.phase = 'wait'
        const { item, drop } = s
        Promise.resolve(latest.current.onDrop?.(item, drop.step, drop.slot))
          .then((ok) => {
            if (sim.current !== s) return
            if (ok) finish()
            else goBack(s)
          })
          .catch(() => sim.current === s && goBack(s))
      }
    } else if (s.phase === 'return' && near) {
      if (!s.lowering) {
        s.lowering = true
        s.target = v3(s.item.origin).add(new THREE.Vector3(0, HEAD_TOP * s.item.scale, 0))
      } else finish()
    }

    s.squash *= Math.exp(-dt * 7)
    const sq = Math.sin(s.squash * Math.PI * 3) * s.squash * 0.12
    grip.current.position.copy(s.pos)
    swing.current.rotation.set(s.ax, s.yaw, s.az)
    scaler.current.scale.set(s.scale * (1 + sq * 0.6), s.scale * (1 - sq), s.scale * (1 + sq * 0.6))
  })

  const markers = useMemo(() => {
    if (!showMarkers && !drag) return []
    const out = []
    for (const k of OPEN_STEPS) for (const slot of freeSlots(bommais, k, drag?.id)) out.push({ k, slot, at: baseFor({}, k, slot) })
    return out
  }, [showMarkers, drag, bommais])

  return (
    <>
      {markers.map((m) => (
        <SlotMarker key={`${m.k}-${m.slot}`} at={m.at} active={hover?.step === m.k && hover?.slot === m.slot} tall={markers.length <= SPOTS_PER_GOLU / 2} />
      ))}
      {hover?.reserved && <ReservedGlow step={hover.step} />}
      {drag && (
        <group ref={grip}>
          <group ref={swing}>
            <group ref={scaler}>
              <group position={[0, -HEAD_TOP, 0]}>
                <Bommai config={drag.config} idle={false} />
              </group>
            </group>
          </group>
        </group>
      )}
    </>
  )
})

export default DragLayer
