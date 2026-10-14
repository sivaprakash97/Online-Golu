import * as THREE from 'three'

// Shared measurements (in voxels) and helpers for the voxel Bommai.

export const VOXEL = 0.011

// heights, in voxels
export const PED = 6 // pedestal
export const HIP = 24
export const SHOULDER = 44
export const HEAD0 = 46 // head spans y 46..81, x -20..19, z -16..15
export const HEAD1 = 82
export const HW = 20 // head half-width
export const HD = 16 // head half-depth
export const FZ = HD - 1 // the front layer of the face

const tmp = new THREE.Color()
export function shade(hex, amt) {
  tmp.set(hex)
  const hsl = {}
  tmp.getHSL(hsl)
  tmp.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + amt, 0, 1))
  return '#' + tmp.getHexString()
}
export const mod = (n, m) => ((n % m) + m) % m
export const hash3 = (x, y, z) => {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return (h ^ (h >>> 16)) >>> 0
}
