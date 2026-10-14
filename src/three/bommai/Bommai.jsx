import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { normalizeConfig } from '../../data/options.js'
import { meshGrid, VOXEL_MATERIALS } from '../voxel/mesh.js'
import { buildBommai, VOXEL } from './build.js'

// A Bommai is a voxel doll about 1 unit tall standing on a little lacquered pedestal, like a
// real Golu doll. It faces +z. Origin = bottom centre of the pedestal. The doll is drawn voxel
// by voxel in build.js and merged into one mesh (plus the waving forearm, which rocks), and
// identical looks share their geometry.

const cache = new Map()
const MAX_CACHED = 600

function geometryFor(cfg) {
  const { name, ...look } = cfg
  const key = JSON.stringify(look)
  let hit = cache.get(key)
  if (!hit) {
    const { body, wave } = buildBommai(cfg)
    hit = { body: meshGrid(body, VOXEL), wave: wave && { geo: meshGrid(wave.grid, VOXEL), pivot: wave.pivot.map((v) => v * VOXEL) } }
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

function WavingForearm({ geo, pivot }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 7) * 0.28
  })
  // pivot is in the doll's x (pivot[0] is negative: the doll's right side)
  return (
    <group ref={ref} position={[pivot[0], pivot[1], pivot[2]]}>
      <mesh geometry={geo} material={VOXEL_MATERIALS} position={[-pivot[0], -pivot[1], -pivot[2]]} castShadow />
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
        {geo.wave && <WavingForearm geo={geo.wave.geo} pivot={geo.wave.pivot} />}
      </group>
    </group>
  )
}

export const BOMMAI_HEIGHT = 1.0
