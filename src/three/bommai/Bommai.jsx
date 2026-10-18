import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { normalizeConfig } from '../../data/options.js'
import { geometryFrom, VOXEL_MATERIALS } from '../voxel/mesh.js'
import { buildLook, lookKey } from './looks.js'

// A Bommai is a voxel doll about 1 unit tall standing on a little lacquered pedestal, like a
// real Golu doll. It faces +z. Origin = bottom centre of the pedestal. The doll is drawn voxel
// by voxel in build.js and merged into one mesh, plus a mesh for each part its pose moves (a
// waving forearm, a nodding head, cheering arms, swaying hips, a dancing body), and identical
// looks share their geometry (looks.js).

const cache = new Map()
const MAX_CACHED = 600

function remember(key, look) {
  const hit = { body: geometryFrom(look.body), parts: look.parts.map(({ mesh, ...p }) => ({ ...p, geo: geometryFrom(mesh) })) }
  if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value) // oldest look; React may still hold it, so no dispose
  cache.set(key, hit)
  return hit
}

function geometryFor(cfg) {
  const key = lookKey(cfg)
  return cache.get(key) || remember(key, buildLook(cfg))
}

// Building a doll takes a few tens of milliseconds, and a whole Golu of them at once froze the page
// on load. prebuildLooks builds them in a few workers instead, and resolves when they're all ready.
// A Bommai whose look is on its way draws nothing until it arrives; any other look (the Creator's
// preview, a doll that has just joined) is built on the spot.
const pending = new Map() // look key -> promise that resolves once it is in the cache
let pool
const jobs = new Map() // job id -> { resolve, worker }
let nextJob = 0

function workers() {
  if (pool !== undefined) return pool
  pool = null
  if (typeof Worker === 'undefined') return pool
  try {
    const n = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1))
    pool = Array.from({ length: n }, () => {
      const w = new Worker(new URL('./looks.worker.js', import.meta.url), { type: 'module' })
      w.onmessage = ({ data: { id, look } }) => {
        jobs.get(id)?.resolve(look)
        jobs.delete(id)
      }
      // a worker that fails to start: its looks get built on the spot instead
      w.onerror = (e) => {
        console.warn('[golu] Bommai worker failed', e.message || e)
        for (const [id, job] of jobs) if (job.worker === w) (job.resolve(null), jobs.delete(id))
      }
      return w
    })
  } catch (e) {
    console.warn('[golu] no Bommai workers, building on the main thread', e)
  }
  return pool
}

export function prebuildLooks(configs) {
  const ws = workers()
  const waits = []
  for (const c of configs) {
    const cfg = normalizeConfig(c)
    const key = lookKey(cfg)
    if (cache.has(key)) continue
    if (!pending.has(key)) {
      if (!ws) continue
      const id = nextJob++
      const worker = ws[id % ws.length]
      const built = new Promise((resolve) => jobs.set(id, { resolve, worker })).then((look) => {
        pending.delete(key)
        if (look && !cache.has(key)) remember(key, look)
      })
      pending.set(key, built)
      worker.postMessage({ id, cfg })
    }
    waits.push(pending.get(key))
  }
  return Promise.all(waits)
}

// the geometry for a look, or null while a worker is still building it
function useLook(cfg) {
  const key = useMemo(() => lookKey(cfg), [cfg])
  const wait = cache.has(key) ? null : pending.get(key)
  const [, arrived] = useState(0)
  useEffect(() => {
    if (!wait) return
    let live = true
    wait.then(() => live && arrived((n) => n + 1))
    return () => (live = false)
  }, [wait])
  return useMemo(() => (wait ? null : geometryFor(cfg)), [cfg, wait])
}

function hash(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

// How each moving part moves, given time t (seconds, offset per doll). Rotations are about the
// part's pivot: the elbow, the neck, a shoulder, the hips or the feet. A pet's moves get `arg`,
// which varies them from one pet to the next; a part that is `hidden` when still (a spark) shows
// itself only here.
const MOVES = {
  wave: (o, t) => (o.rotation.z = Math.sin(t * 7) * 0.28),
  // a South Indian head wobble
  nod: (o, t) => ((o.rotation.z = Math.sin(t * 3.4) * 0.1), (o.rotation.x = Math.sin(t * 6.8) * 0.02)),
  cheer: (o, t, side) => (o.rotation.z = side * (Math.sin(t * 6 + (side > 0 ? 0 : 1.6)) * 0.22 - 0.05)),
  hips: (o, t, side, p) => {
    o.rotation.z = Math.sin(t * 3) * 0.08
    o.position.x = p[0] - Math.sin(t * 3) * 0.012
  },
  dance: (o, t, side, p) => {
    o.position.y = p[1] + Math.abs(Math.sin(t * 4)) * 0.035
    o.rotation.z = Math.sin(t * 4) * 0.09
    o.rotation.y = Math.sin(t * 2) * 0.35
  },
  float: (o, t, side, p) => (o.position.y = p[1] + Math.sin(t * 1.8) * 0.012),
  // ── pets ──
  // springs into the air now and then, never on a beat
  hop: (o, t, side, p, k = 1) => {
    const h = Math.max(0, Math.sin(t * 2.7 * k)) * Math.max(0, Math.sin(t * 1.1 * k + 1.3) + 0.25)
    o.position.y = p[1] + h * 0.045
    o.scale.y = 1 + h * 0.12
  },
  // rocks like a duck in a bath, and every so often gives a little squeaky hop
  rock: (o, t, side, p) => {
    const squeak = Math.max(0, Math.sin(t * 0.8)) ** 10 * Math.abs(Math.sin(t * 13))
    o.rotation.z = Math.sin(t * 2.1) * 0.07
    o.position.y = p[1] + Math.sin(t * 3) * 0.003 + squeak * 0.02
  },
  // hovers, bobbing and tilting a little (a bird in flight)
  flutter: (o, t, side, p) => {
    o.position.y = p[1] + Math.sin(t * 5) * 0.012 + Math.sin(t * 1.7) * 0.012
    o.rotation.z = Math.sin(t * 1.3) * 0.05
  },
  flap: (o, t, side) => (o.rotation.z = side * (0.1 + Math.sin(t * 16) * 0.6)),
  // ears that go up and down
  ears: (o, t, side) => (o.rotation.z = side * (0.12 + Math.sin(t * 2.4) * 0.25)),
  // ears that sway, with a quick twitchy wiggle every so often
  wiggle: (o, t, side) => {
    const burst = Math.max(0, Math.sin(t * 1.3 + (side > 0 ? 0 : 0.7))) ** 5
    o.rotation.z = side * (Math.sin(t * 1.1) * 0.05 + burst * Math.sin(t * 26) * 0.22)
  },
  // Rocky's jazz hands: the arms sway, one then the other, and the hands shake at the wrists
  arm: (o, t, side) => (o.rotation.z = side * Math.sin(t * 4.6 + (side > 0 ? 0 : Math.PI)) * 0.2),
  hand: (o, t, side) => (o.rotation.z = Math.sin(t * 15 + (side > 0 ? 0 : 1.5)) * 0.32),
  // sparks from the cheeks: a short burst every few seconds, flickering between two shapes (side
  // picks the shape)
  zap: (o, t, side) => (o.visible = t % 2.8 < 0.5 && (Math.floor(t * 22) % 2 === 0) === side > 0),
  // a raindrop falls from the cloud and shrinks away; `arg` staggers the drops
  drip: (o, t, side, p, i = 0) => {
    const u = (t * 0.55 + i * 0.37) % 1
    o.position.y = p[1] - u * 0.09
    o.scale.setScalar(Math.max(0.01, Math.min(1, u * 8, (1 - u) * 4)))
  },
}

// A part moves about its pivot. Its own parts (a hand on an arm, a wing on a bird that bobs) hang
// inside it, so they go wherever it goes: their pivots are in the same grid as the part's voxels.
function MovingPart({ index, parts, idle, phase }) {
  const { geo, anim, side, arg, hidden, pivot } = parts[index]
  const ref = useRef()
  useFrame(({ clock }) => {
    const o = ref.current
    if (!o) return
    o.position.set(pivot[0], pivot[1], pivot[2])
    o.rotation.set(0, 0, 0)
    o.scale.set(1, 1, 1)
    o.visible = idle || !hidden
    if (idle) MOVES[anim]?.(o, clock.elapsedTime + phase, side, pivot, arg)
  })
  return (
    <group ref={ref} position={pivot}>
      <group position={[-pivot[0], -pivot[1], -pivot[2]]}>
        <mesh geometry={geo} material={VOXEL_MATERIALS} castShadow receiveShadow />
        {parts.map((q, i) => q.parent === index && <MovingPart key={i} index={i} parts={parts} idle={idle} phase={phase} />)}
      </group>
    </group>
  )
}

export default function Bommai({ config, idle = true, phaseKey, ...rest }) {
  const cfg = useMemo(() => normalizeConfig(config), [config])
  const geo = useLook(cfg)
  const root = useRef()
  const phase = useMemo(() => (hash(phaseKey || cfg.name) % 1000) / 160, [phaseKey, cfg.name])

  useFrame(({ clock }) => {
    if (!idle || !root.current) return
    const t = clock.elapsedTime * 1.6 + phase
    const s = Math.sin(t)
    root.current.scale.set(1 - s * 0.008, 1 + s * 0.014, 1 - s * 0.008)
    root.current.rotation.y = Math.sin(t * 0.37) * 0.05
  })

  return (
    <group {...rest}>
      {geo && (
        <group ref={root}>
          <mesh geometry={geo.body} material={VOXEL_MATERIALS} castShadow receiveShadow />
          {geo.parts.map((p, i) => p.parent < 0 && <MovingPart key={i} index={i} parts={geo.parts} idle={idle} phase={phase} />)}
        </group>
      )}
    </group>
  )
}

export const BOMMAI_HEIGHT = 1.0
