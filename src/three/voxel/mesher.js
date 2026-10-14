import * as THREE from 'three'

// A tiny voxel toolkit. Models are painted into a VoxelGrid (integer coordinates, one colour per
// cell) and turned into a single BufferGeometry with greedy meshing: only faces between a filled
// and an empty cell are kept, coplanar faces of the same colour merge into one quad, and each
// corner gets baked ambient occlusion so the stepped voxel edges read like a MagicaVoxel render.

export class VoxelGrid {
  constructor() {
    this.cells = new Map() // "x,y,z" -> colour (hex string)
  }
  set(x, y, z, color) {
    const k = `${x},${y},${z}`
    if (color == null) this.cells.delete(k)
    else this.cells.set(k, color)
  }
  get(x, y, z) {
    return this.cells.get(`${x},${y},${z}`)
  }
  has(x, y, z) {
    return this.cells.has(`${x},${y},${z}`)
  }
  // fill [x0, x1) × [y0, y1) × [z0, z1); color may be a function (x, y, z) -> colour | null
  box(x0, y0, z0, x1, y1, z1, color) {
    for (let x = x0; x < x1; x++)
      for (let y = y0; y < y1; y++)
        for (let z = z0; z < z1; z++) {
          const c = typeof color === 'function' ? color(x, y, z) : color
          if (c !== undefined) this.set(x, y, z, c)
        }
  }
  // recolour only cells that already exist (for painting patterns onto a surface)
  paint(x0, y0, z0, x1, y1, z1, color) {
    for (let x = x0; x < x1; x++)
      for (let y = y0; y < y1; y++)
        for (let z = z0; z < z1; z++) {
          if (!this.has(x, y, z)) continue
          const c = typeof color === 'function' ? color(x, y, z) : color
          if (c) this.set(x, y, z, c)
        }
  }
  merge(other, dx = 0, dy = 0, dz = 0) {
    for (const [k, c] of other.cells) {
      const [x, y, z] = k.split(',').map(Number)
      this.set(x + dx, y + dy, z + dz, c)
    }
    return this
  }
}

const AO = [0.52, 0.7, 0.86, 1]
const colorCache = new Map()
function linearRGB(hex) {
  let c = colorCache.get(hex)
  if (!c) {
    const col = new THREE.Color(hex) // converts sRGB → linear working space
    c = [col.r, col.g, col.b]
    colorCache.set(hex, c)
  }
  return c
}

// Greedy mesh. `unit` is the size of one voxel in world units; `origin` is the voxel-space point
// that lands at the geometry's (0, 0, 0), e.g. a shoulder pivot.
export function meshGrid(grid, unit, origin = [0, 0, 0]) {
  if (grid.cells.size === 0) return new THREE.BufferGeometry()
  let min = [Infinity, Infinity, Infinity]
  let max = [-Infinity, -Infinity, -Infinity]
  for (const k of grid.cells.keys()) {
    const p = k.split(',').map(Number)
    for (let i = 0; i < 3; i++) {
      if (p[i] < min[i]) min[i] = p[i]
      if (p[i] > max[i]) max[i] = p[i]
    }
  }
  // dense copy with a one-cell empty border
  const dims = [max[0] - min[0] + 3, max[1] - min[1] + 3, max[2] - min[2] + 3]
  const palette = []
  const palIndex = new Map()
  const vol = new Uint16Array(dims[0] * dims[1] * dims[2])
  const at = (x, y, z) => x + dims[0] * (y + dims[1] * z)
  for (const [k, c] of grid.cells) {
    const p = k.split(',').map(Number)
    let ci = palIndex.get(c)
    if (ci === undefined) {
      ci = palette.length + 1
      palette.push(c)
      palIndex.set(c, ci)
    }
    vol[at(p[0] - min[0] + 1, p[1] - min[1] + 1, p[2] - min[2] + 1)] = ci
  }
  const solid = (x, y, z) =>
    x >= 0 && y >= 0 && z >= 0 && x < dims[0] && y < dims[1] && z < dims[2] && vol[at(x, y, z)] !== 0

  const pos = []
  const nor = []
  const col = []
  const idx = []
  const q = [0, 0, 0]
  const x = [0, 0, 0]

  for (let d = 0; d < 3; d++) {
    const u = (d + 1) % 3
    const v = (d + 2) % 3
    const W = dims[u]
    const H = dims[v]
    const mask = new Array(W * H)
    for (let side = -1; side <= 1; side += 2) {
      for (x[d] = 0; x[d] < dims[d]; x[d]++) {
        // build the mask for this slice: faces of filled cells whose neighbour along `side` is empty
        let n = 0
        for (x[v] = 0; x[v] < H; x[v]++)
          for (x[u] = 0; x[u] < W; x[u]++, n++) {
            mask[n] = null
            const c = vol[at(x[0], x[1], x[2])]
            if (!c) continue
            q[0] = x[0]
            q[1] = x[1]
            q[2] = x[2]
            q[d] += side
            if (solid(q[0], q[1], q[2])) continue
            // ambient occlusion at the 4 corners of this face, sampled in the empty layer
            const ao = []
            for (const [du, dv] of [
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ]) {
              const s1 = [...q]
              s1[u] += du
              const s2 = [...q]
              s2[v] += dv
              const s3 = [...q]
              s3[u] += du
              s3[v] += dv
              const a = solid(...s1) ? 1 : 0
              const b = solid(...s2) ? 1 : 0
              const cc = solid(...s3) ? 1 : 0
              ao.push(a && b ? 0 : 3 - (a + b + cc))
            }
            mask[n] = { c, ao, key: c * 256 + ao[0] * 64 + ao[1] * 16 + ao[2] * 4 + ao[3] }
          }
        // greedy merge of equal mask entries into rectangles
        n = 0
        for (let j = 0; j < H; j++)
          for (let i = 0; i < W; ) {
            const m = mask[n]
            if (!m) {
              i++
              n++
              continue
            }
            let w = 1
            while (i + w < W && mask[n + w] && mask[n + w].key === m.key) w++
            let h = 1
            outer: for (; j + h < H; h++)
              for (let k = 0; k < w; k++) {
                const o = mask[n + k + h * W]
                if (!o || o.key !== m.key) break outer
              }
            // emit quad
            const base = [0, 0, 0]
            base[d] = x[d] + (side > 0 ? 1 : 0)
            base[u] = i
            base[v] = j
            const du = [0, 0, 0]
            du[u] = w
            const dv = [0, 0, 0]
            dv[v] = h
            const corners = [
              base,
              [base[0] + du[0], base[1] + du[1], base[2] + du[2]],
              [base[0] + du[0] + dv[0], base[1] + du[1] + dv[1], base[2] + du[2] + dv[2]],
              [base[0] + dv[0], base[1] + dv[1], base[2] + dv[2]],
            ]
            const vi = pos.length / 3
            const rgb = linearRGB(palette[m.c - 1])
            const normal = [0, 0, 0]
            normal[d] = side
            for (let k = 0; k < 4; k++) {
              const p = corners[k]
              pos.push(
                (p[0] - 1 + min[0] - origin[0]) * unit,
                (p[1] - 1 + min[1] - origin[1]) * unit,
                (p[2] - 1 + min[2] - origin[2]) * unit,
              )
              nor.push(normal[0], normal[1], normal[2])
              const f = AO[m.ao[k]]
              col.push(rgb[0] * f, rgb[1] * f, rgb[2] * f)
            }
            // flip the diagonal so AO interpolates evenly; (u, v, d) is right-handed, so 0-1-2 faces +d
            const flip = m.ao[0] + m.ao[2] < m.ao[1] + m.ao[3]
            const tri = flip ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3]
            for (let k = 0; k < 6; k += 3) {
              const a = vi + tri[k]
              const b = vi + tri[k + 1]
              const c = vi + tri[k + 2]
              if (side > 0) idx.push(a, b, c)
              else idx.push(a, c, b)
            }
            for (let l = 0; l < h; l++) for (let k = 0; k < w; k++) mask[n + k + l * W] = null
            i += w
            n += w
          }
      }
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeBoundingSphere()
  g.computeBoundingBox()
  return g
}

// Shared material for every voxel mesh: colour lives in the vertices.
export const voxelMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0 })

// Geometry cache with a soft cap; evicted geometry is disposed (three re-uploads it if still in use).
const cache = new Map()
const CAP = 600
export function cachedMesh(key, build) {
  let g = cache.get(key)
  if (g) {
    cache.delete(key)
    cache.set(key, g)
    return g
  }
  g = build()
  cache.set(key, g)
  if (cache.size > CAP) {
    const [oldKey, old] = cache.entries().next().value
    cache.delete(oldKey)
    old.dispose()
  }
  return g
}
