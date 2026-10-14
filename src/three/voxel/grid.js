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
  constructor(sx = 80, sy = 72, sz = 64) {
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
  // The same box on both sides of the doll: [x0, x1) and its mirror [-x1, -x0).
  mirrorBox(x0, x1, y0, y1, z0, z1, c) {
    this.box(x0, x1, y0, y1, z0, z1, c)
    this.box(-x1, -x0, y0, y1, z0, z1, typeof c === 'function' ? (x, y, z) => c(-x - 1, y, z) : c)
  }
}
