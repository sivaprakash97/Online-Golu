import * as THREE from 'three'
import { SHINY, GLOW } from './grid.js'

// Turns a VoxelGrid into one BufferGeometry: only faces that touch air are kept, neighbouring
// faces of the same colour are merged into larger quads (greedy meshing), and every corner gets
// a little ambient occlusion so creases and the gaps between slabs read like a soft studio render.
// Three material groups: 0 matte, 1 shiny, 2 glowing.

const AO = [0.58, 0.74, 0.88, 1]
const col = new THREE.Color()

export function meshGrid(grid, size) {
  const { sx, sy, sz, data, ox, oz } = grid
  const dims = [sx, sy, sz]
  // bounds of what is filled, so the sweep stays small
  const lo = [sx, sy, sz]
  const hi = [-1, -1, -1]
  for (let y = 0; y < sy; y++)
    for (let z = 0; z < sz; z++)
      for (let x = 0; x < sx; x++)
        if (data[(y * sz + z) * sx + x]) {
          if (x < lo[0]) lo[0] = x
          if (x > hi[0]) hi[0] = x
          if (y < lo[1]) lo[1] = y
          if (y > hi[1]) hi[1] = y
          if (z < lo[2]) lo[2] = z
          if (z > hi[2]) hi[2] = z
        }
  const out = [
    { pos: [], nor: [], col: [], idx: [] },
    { pos: [], nor: [], col: [], idx: [] },
    { pos: [], nor: [], col: [], idx: [] },
  ]
  if (hi[0] < 0) return toGeometry(out)

  // index strides along x, y and z, so neighbours are found without recomputing coordinates
  const stride = [1, sz * sx, sx]
  for (let d = 0; d < 3; d++) {
    const u = (d + 1) % 3
    const v = (d + 2) % 3
    const nu = hi[u] - lo[u] + 1
    const nv = hi[v] - lo[v] + 1
    const sd = stride[d]
    const su = stride[u]
    const sv = stride[v]
    const mask = new Float64Array(nu * nv)
    for (const dir of [1, -1]) {
      for (let s = lo[d]; s <= hi[d]; s++) {
        // build the mask of visible faces on this slice
        const outside = s + dir < 0 || s + dir >= dims[d]
        let n = 0
        for (let j = 0; j < nv; j++) {
          const cv = lo[v] + j
          const vm = cv > 0
          const vp = cv < dims[v] - 1
          for (let i = 0; i < nu; i++, n++) {
            const cu = lo[u] + i
            const idx = s * sd + cu * su + cv * sv
            const w = data[idx]
            if (!w) {
              mask[n] = 0
              continue
            }
            if (outside) {
              mask[n] = w * 256 + 255
              continue
            }
            const q = idx + dir * sd
            if (data[q]) {
              mask[n] = 0
              continue
            }
            // ambient occlusion at the four corners, sampled in the layer the face looks into
            const um = cu > 0
            const up = cu < dims[u] - 1
            const l = um && data[q - su] ? 1 : 0
            const r = up && data[q + su] ? 1 : 0
            const b = vm && data[q - sv] ? 1 : 0
            const t = vp && data[q + sv] ? 1 : 0
            const lb = um && vm && data[q - su - sv] ? 1 : 0
            const rb = up && vm && data[q + su - sv] ? 1 : 0
            const rt = up && vp && data[q + su + sv] ? 1 : 0
            const lt = um && vp && data[q - su + sv] ? 1 : 0
            const a0 = l && b ? 0 : 3 - (l + b + lb)
            const a1 = r && b ? 0 : 3 - (r + b + rb)
            const a2 = r && t ? 0 : 3 - (r + t + rt)
            const a3 = l && t ? 0 : 3 - (l + t + lt)
            mask[n] = w * 256 + (a0 | (a1 << 2) | (a2 << 4) | (a3 << 6))
          }
        }
        // greedy merge
        n = 0
        for (let j = 0; j < nv; j++)
          for (let i = 0; i < nu; ) {
            const key = mask[n]
            if (!key) {
              i++
              n++
              continue
            }
            let w = 1
            while (i + w < nu && mask[n + w] === key) w++
            let h = 1
            grow: while (j + h < nv) {
              for (let k = 0; k < w; k++) if (mask[n + k + h * nu] !== key) break grow
              h++
            }
            emit(out, d, u, v, dir, s, lo[u] + i, lo[v] + j, w, h, key)
            for (let l = 0; l < h; l++) for (let k = 0; k < w; k++) mask[n + k + l * nu] = 0
            i += w
            n += w
          }
      }
    }
  }
  return toGeometry(out, size, ox, oz)

  function emit(o, d, u, v, dir, s, i0, j0, w, h, key) {
    const wordv = Math.floor(key / 256)
    const ao = key % 256
    const g = o[wordv & GLOW ? 2 : wordv & SHINY ? 1 : 0]
    col.setHex(wordv & 0xffffff) // sRGB hex -> linear working space
    const plane = dir > 0 ? s + 1 : s
    const base = g.pos.length / 3
    const cs = [
      [i0, j0],
      [i0 + w, j0],
      [i0 + w, j0 + h],
      [i0, j0 + h],
    ]
    const a = []
    for (let k = 0; k < 4; k++) {
      const q = [0, 0, 0]
      q[d] = plane
      q[u] = cs[k][0]
      q[v] = cs[k][1]
      g.pos.push(q[0], q[1], q[2])
      const nrm = [0, 0, 0]
      nrm[d] = dir
      g.nor.push(nrm[0], nrm[1], nrm[2])
      a[k] = (ao >> (k * 2)) & 3
      const f = AO[a[k]]
      g.col.push(col.r * f, col.g * f, col.b * f)
    }
    // split along the diagonal that keeps the occlusion gradient smooth
    const flip = a[0] + a[2] < a[1] + a[3]
    const tris = flip ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3]
    if (dir < 0) for (let t = 0; t < 6; t += 3) [tris[t + 1], tris[t + 2]] = [tris[t + 2], tris[t + 1]]
    for (const t of tris) g.idx.push(base + t)
  }
}

function toGeometry(out, size = 1, ox = 0, oz = 0) {
  const geo = new THREE.BufferGeometry()
  const pos = []
  const nor = []
  const cols = []
  const idx = []
  let start = 0
  out.forEach((g, m) => {
    const base = pos.length / 3
    for (let k = 0; k < g.pos.length; k += 3) pos.push((g.pos[k] - ox) * size, g.pos[k + 1] * size, (g.pos[k + 2] - oz) * size)
    for (const v of g.nor) nor.push(v) // not push(...g.nor): big meshes overflow the call stack
    for (const v of g.col) cols.push(v)
    for (const t of g.idx) idx.push(base + t)
    geo.addGroup(start, g.idx.length, m)
    start += g.idx.length
  })
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
  geo.setIndex(idx)
  geo.computeBoundingBox()
  geo.computeBoundingSphere()
  return geo
}

export const VOXEL_MATERIALS = [
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0 }),
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.55 }),
  new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
]
