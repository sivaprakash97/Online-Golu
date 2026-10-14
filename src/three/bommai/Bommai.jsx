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
      parts: parts.map((p) => ({ geo: meshGrid(p.grid, VOXEL), anim: p.anim, side: p.side || 1, pivot: p.pivot.map((v) => v * VOXEL) })),
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
// part's pivot: the elbow, the neck, a shoulder, the hips or the feet.
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
}

function MovingPart({ geo, anim, side, pivot, idle, phase }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    const o = ref.current
    if (!o) return
    o.position.set(pivot[0], pivot[1], pivot[2])
    o.rotation.set(0, 0, 0)
    if (idle) MOVES[anim]?.(o, clock.elapsedTime + phase, side, pivot)
  })
  return (
    <group ref={ref} position={pivot}>
      <mesh geometry={geo} material={VOXEL_MATERIALS} position={[-pivot[0], -pivot[1], -pivot[2]]} castShadow receiveShadow />
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
        {geo.parts.map((p, i) => (
          <MovingPart key={i} {...p} idle={idle} phase={phase} />
        ))}
      </group>
    </group>
  )
}

export const BOMMAI_HEIGHT = 1.0
