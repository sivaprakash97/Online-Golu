import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { normalizeConfig } from '../../data/options.js'
import { meshGrid, VOXEL_MATERIALS } from '../voxel/mesh.js'
import { buildBommai, VOXEL } from './build.js'

// A Bommai is a voxel doll about 1 unit tall standing on a little lacquered pedestal, like a
// real Golu doll. It faces +z. Origin = bottom centre of the pedestal. The doll is drawn voxel
// by voxel in build.js and merged into one mesh, plus a mesh for each part its pose moves (a
// waving forearm, a nodding head, cheering arms, swaying hips, a dancing body), and identical
// looks share their geometry.

const cache = new Map()
const MAX_CACHED = 600

function geometryFor(cfg) {
  const { name, ...look } = cfg
  const key = JSON.stringify(look)
  let hit = cache.get(key)
  if (!hit) {
    const { body, parts } = buildBommai(cfg)
    hit = {
      body: meshGrid(body, VOXEL),
      parts: parts.map((p) => ({ geo: meshGrid(p.grid, VOXEL), anim: p.anim, side: p.side || 1, arg: p.arg, hidden: !!p.hidden, parent: p.parent ?? -1, pivot: p.pivot.map((v) => v * VOXEL) })),
    }
    if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value) // oldest look; React may still hold it, so no dispose
    cache.set(key, hit)
  }
  return hit
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
  // a spark from the cheeks: every few seconds the bolts grow out of the cheek, hold a moment and
  // shrink back
  zap: (o, t) => {
    const u = (t % 2.8) / 0.9
    const g = u >= 1 ? 0 : u < 0.35 ? 1 - (1 - u / 0.35) ** 2 : u < 0.7 ? 1 : (1 - u) / 0.3
    o.visible = g > 0.02
    o.scale.setScalar(Math.max(g, 0.01))
  },
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
  const geo = useMemo(() => geometryFor(cfg), [cfg])
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
      <group ref={root}>
        <mesh geometry={geo.body} material={VOXEL_MATERIALS} castShadow receiveShadow />
        {geo.parts.map((p, i) => p.parent < 0 && <MovingPart key={i} index={i} parts={geo.parts} idle={idle} phase={phase} />)}
      </group>
    </group>
  )
}

export const BOMMAI_HEIGHT = 1.0
