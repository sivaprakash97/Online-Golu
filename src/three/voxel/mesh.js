import * as THREE from 'three'
import { SHINY } from './grid.js'

// Turns a VoxelGrid into one BufferGeometry: only faces that touch air are kept, neighbouring
// faces of the same colour are merged into larger quads (greedy meshing), and every corner gets
// a little ambient occlusion so creases and the gaps between slabs read like a soft studio render.
// Two material groups: 0 matte, 1 shiny.

const AO = [0.58, 0.74, 0.88, 1]
const col = new THREE.Color()

export function meshGrid(grid, size) {
  const { sx, sy, sz, data, ox, oz } = grid
  const dims = [sx, sy, sz]
  const at = (p0, p1, p2) => {
    if (p0 < 0 || p1 < 0 || p2 < 0 || p0 >= sx || p1 >= sy || p2 >= sz) return 0
    return data[(p1 * sz + p2) * sx + p0]
  }
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
  ]
  if (hi[0] < 0) return toGeometry(out)

  const p = [0, 0, 0]
  const filled = (a, b, c) => at(a, b, c) !== 0
  for (let d = 0; d < 3; d++) {
    const u = (d + 1) % 3
    const v = (d + 2) % 3
    const nu = hi[u] - lo[u] + 1
    const nv = hi[v] - lo[v] + 1
    const mask = new Float64Array(nu * nv)
    for (const dir of [1, -1]) {
      for (let s = lo[d]; s <= hi[d]; s++) {
        // build the mask of visible faces on this slice
        let n = 0
        for (let j = 0; j < nv; j++)
          for (let i = 0; i < nu; i++, n++) {
            p[d] = s
            p[u] = lo[u] + i
            p[v] = lo[v] + j
            const w = at(p[0], p[1], p[2])
            if (!w) {
              mask[n] = 0
              continue
            }
            p[d] = s + dir
            if (at(p[0], p[1], p[2])) {
              mask[n] = 0
              continue
            }
            // ambient occlusion at the four corners, sampled in the layer the face looks into
            let ao = 0
            const cu = lo[u] + i
            const cv = lo[v] + j
            const q = [0, 0, 0]
            q[d] = s + dir
            const occ = (du, dv) => {
              q[u] = cu + du
              q[v] = cv + dv
              return filled(q[0], q[1], q[2]) ? 1 : 0
            }
            const corners = [
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ]
            for (let k = 0; k < 4; k++) {
              const [du, dv] = corners[k]
              const s1 = occ(du, 0)
              const s2 = occ(0, dv)
              const c = occ(du, dv)
              const a = s1 && s2 ? 0 : 3 - (s1 + s2 + c)
              ao |= a << (k * 2)
            }
            mask[n] = w * 256 + ao
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
    const g = o[wordv & SHINY ? 1 : 0]
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
    nor.push(...g.nor)
    cols.push(...g.col)
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
]
