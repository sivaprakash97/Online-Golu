// A small dense voxel grid. Bommais are drawn into one of these voxel by voxel, then turned
// into a single mesh by mesh.js. Coordinates are integers in voxel units: x runs left/right
// (the doll's left is +x), y up from the floor, z towards the viewer. A voxel (x, y, z) fills
// the cube [x, x+1) × [y, y+1) × [z, z+1), so a box from -10 to 10 is centred on 0.

const PRESENT = 1 << 24
export const SHINY = 1 << 25 // drawn with the metallic material (gold, sequins)

// A colour word: '#rrggbb' or 0xrrggbb, optionally with SHINY or'ed in.
export function word(c) {
  if (c == null || c === false) return 0
  if (typeof c === 'string') return parseInt(c.slice(1), 16) | PRESENT
  return c | PRESENT
}
export const shiny = (c) => word(c) | SHINY

export class VoxelGrid {
  constructor(sx = 112, sy = 128, sz = 72) {
    this.sx = sx
    this.sy = sy
    this.sz = sz
    this.ox = sx >> 1
    this.oz = sz >> 1
    this.data = new Uint32Array(sx * sy * sz)
  }
  index(x, y, z) {
    const i = x + this.ox
    const k = z + this.oz
    if (i < 0 || i >= this.sx || y < 0 || y >= this.sy || k < 0 || k >= this.sz) return -1
    return (y * this.sz + k) * this.sx + i
  }
  get(x, y, z) {
    const i = this.index(x, y, z)
    return i < 0 ? 0 : this.data[i]
  }
  has(x, y, z) {
    return this.get(x, y, z) !== 0
  }
  set(x, y, z, c) {
    const i = this.index(x, y, z)
    if (i >= 0) this.data[i] = word(c)
  }
  // Recolour a voxel only if something is already there (face paint, patterns).
  paint(x, y, z, c) {
    const i = this.index(x, y, z)
    if (i >= 0 && this.data[i]) this.data[i] = word(c)
  }
  // Fill [x0, x1) × [y0, y1) × [z0, z1). `c` may be a colour or a function (x, y, z) => colour | null.
  box(x0, x1, y0, y1, z0, z1, c) {
    const fn = typeof c === 'function'
    for (let y = y0; y < y1; y++)
      for (let z = z0; z < z1; z++)
        for (let x = x0; x < x1; x++) {
          const v = fn ? c(x, y, z) : c
          if (v != null) this.set(x, y, z, v)
        }
  }
  clear(x0, x1, y0, y1, z0, z1) {
    for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) this.set(x, y, z, null)
  }
  // A box with rounded edges: radius `r` on every edge, or only on the four vertical edges
  // when `vertical` is set (a rounded rectangle extruded up). Voxels are kept when their centre
  // falls inside the rounded shape.
  rounded(x0, x1, y0, y1, z0, z1, r, c, vertical = false) {
    const fn = typeof c === 'function'
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    const cz = (z0 + z1) / 2
    const hx = (x1 - x0) / 2 - r
    const hy = vertical ? Infinity : (y1 - y0) / 2 - r
    const hz = (z1 - z0) / 2 - r
    for (let y = y0; y < y1; y++)
      for (let z = z0; z < z1; z++)
        for (let x = x0; x < x1; x++) {
          const qx = Math.max(Math.abs(x + 0.5 - cx) - hx, 0)
          const qy = Math.max(Math.abs(y + 0.5 - cy) - hy, 0)
          const qz = Math.max(Math.abs(z + 0.5 - cz) - hz, 0)
          if (qx * qx + qy * qy + qz * qz > r * r + 0.01) continue
          const v = fn ? c(x, y, z) : c
          if (v != null) this.set(x, y, z, v)
        }
  }
  // An ellipsoid centred on (cx, cy, cz) with radii (rx, ry, rz), in voxel units.
  ellipsoid(cx, cy, cz, rx, ry, rz, c) {
    const fn = typeof c === 'function'
    for (let y = Math.floor(cy - ry); y < Math.ceil(cy + ry); y++)
      for (let z = Math.floor(cz - rz); z < Math.ceil(cz + rz); z++)
        for (let x = Math.floor(cx - rx); x < Math.ceil(cx + rx); x++) {
          const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 + ((z + 0.5 - cz) / rz) ** 2
          if (d > 1) continue
          const v = fn ? c(x, y, z) : c
          if (v != null) this.set(x, y, z, v)
        }
  }
  // Recolour the frontmost voxel at (x, y), looking back from z = zFrom (face paint on a
  // rounded head). `back` limits how far it looks.
  paintFront(x, y, zFrom, c, back = 6) {
    for (let z = zFrom; z > zFrom - back; z--)
      if (this.has(x, y, z)) {
        this.set(x, y, z, c)
        return z
      }
    return null
  }
  // A view of this grid moved up by dy voxels: the upper body of a doll sitting on the floor.
  shifted(dy) {
    if (!dy) return this
    const g = this
    const view = Object.create(VoxelGrid.prototype)
    return Object.assign(view, {
      sx: g.sx,
      sy: g.sy,
      sz: g.sz,
      ox: g.ox,
      oz: g.oz,
      data: g.data,
      index: (x, y, z) => g.index(x, y + dy, z),
      shifted: (d) => g.shifted(dy + d),
    })
  }
  // The same box on both sides of the doll: [x0, x1) and its mirror [-x1, -x0).
  mirrorBox(x0, x1, y0, y1, z0, z1, c) {
    this.box(x0, x1, y0, y1, z0, z1, c)
    this.box(-x1, -x0, y0, y1, z0, z1, typeof c === 'function' ? (x, y, z) => c(-x - 1, y, z) : c)
  }
}
