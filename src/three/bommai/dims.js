import * as THREE from 'three'

// Shared measurements (in voxels) and helpers for the voxel Bommai.

export const VOXEL = 0.022

// heights, in voxels
export const PED = 3 // pedestal
export const HIP = 12
export const SHOULDER = 22
export const HEAD0 = 23 // head spans y 23..40, x -10..9, z -8..7
export const HEAD1 = 41

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
