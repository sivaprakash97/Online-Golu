import { buildBommai, VOXEL } from './build.js'
import { meshArrays } from '../voxel/mesh.js'

// A Bommai's look, meshed into plain typed arrays: the body and each moving part. Nothing here
// touches the page, so looks.worker.js can build looks off the main thread; Bommai.jsx turns
// them into geometry.

// identical looks share their geometry, whatever the name
export function lookKey(cfg) {
  const { name, ...look } = cfg
  return JSON.stringify(look)
}

export function buildLook(cfg) {
  const { body, parts } = buildBommai(cfg)
  return {
    body: meshArrays(body, VOXEL),
    parts: parts.map((p) => ({ mesh: meshArrays(p.grid, VOXEL), anim: p.anim, side: p.side || 1, arg: p.arg, hidden: !!p.hidden, parent: p.parent ?? -1, pivot: p.pivot.map((v) => v * VOXEL) })),
  }
}

// the buffers a worker hands over instead of copying
export const transferables = (look) =>
  [look.body, ...look.parts.map((p) => p.mesh)].flatMap((m) => [m.position.buffer, m.normal.buffer, m.color.buffer, m.index.buffer])
