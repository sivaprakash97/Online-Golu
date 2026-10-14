import { useMemo } from 'react'
import { meshGrid, VOXEL_MATERIALS } from './mesh.js'

// A voxel model built once by `build()` (which returns a VoxelGrid) and cached under `id`, so
// repeated pieces (the two lamps, the two shrines, the nine steps) share their geometry. `size`
// is one voxel in world units, or [x, y, z] to fit a model to exact dimensions.
const cache = new Map()

export function voxelGeometry(id, build) {
  let geo = cache.get(id)
  if (!geo) {
    geo = meshGrid(build(), 1)
    cache.set(id, geo)
  }
  return geo
}

export default function VoxelModel({ id, build, size = 1, cast = true, receive = true, ...rest }) {
  const geo = useMemo(() => voxelGeometry(id, build), [id]) // eslint-disable-line react-hooks/exhaustive-deps
  const scale = Array.isArray(size) ? size : [size, size, size]
  return (
    <group {...rest}>
      <mesh geometry={geo} material={VOXEL_MATERIALS} scale={scale} castShadow={cast} receiveShadow={receive} />
    </group>
  )
}
