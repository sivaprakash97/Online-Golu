import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

// Shared geometry + material caches. A Golu can hold hundreds of Bommais built from the
// same handful of parts, so every part with the same size/colour reuses one GPU object.
const geoCache = new Map()
const matCache = new Map()

function cached(key, make) {
  let g = geoCache.get(key)
  if (!g) {
    g = make()
    geoCache.set(key, g)
  }
  return g
}

export function material(color, { rough = 0.62, metal = 0, flat = false, emissive, emissiveIntensity = 1, transparent = false, opacity = 1 } = {}) {
  const key = [color, rough, metal, flat, emissive, emissiveIntensity, opacity].join('|')
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: rough,
      metalness: metal,
      flatShading: flat,
      emissive: emissive || '#000000',
      emissiveIntensity,
      transparent: transparent || opacity < 1,
      opacity,
    })
    matCache.set(key, m)
  }
  return m
}

const r3 = (n) => Math.round(n * 1000) / 1000

export function roundedBoxGeo(w, h, d, r = 0.03, seg = 2) {
  const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)
  return cached(`rb${r3(w)},${r3(h)},${r3(d)},${r3(rr)},${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, rr))
}
export const cylGeo = (rt, rb, h, s = 10) => cached(`cy${r3(rt)},${r3(rb)},${r3(h)},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s))
export const sphereGeo = (r, w = 12, hgt = 10) => cached(`sp${r3(r)},${w},${hgt}`, () => new THREE.SphereGeometry(r, w, hgt))
export const icoGeo = (r, detail = 0) => cached(`ic${r3(r)},${detail}`, () => new THREE.IcosahedronGeometry(r, detail))
export const coneGeo = (r, h, s = 6) => cached(`co${r3(r)},${r3(h)},${s}`, () => new THREE.ConeGeometry(r, h, s))
export const torusGeo = (r, t, rs = 6, ts = 16, arc = Math.PI * 2) => cached(`to${r3(r)},${r3(t)},${rs},${ts},${r3(arc)}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc))
export const circleGeo = (r, s = 16) => cached(`ci${r3(r)},${s}`, () => new THREE.CircleGeometry(r, s))
export const planeGeo = (w, h) => cached(`pl${r3(w)},${r3(h)}`, () => new THREE.PlaneGeometry(w, h))

function Mesh({ geometry, color, mat, position, rotation, scale, shadow = true, receive = false, ...rest }) {
  return (
    <mesh
      geometry={geometry}
      material={material(color, mat)}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={shadow}
      receiveShadow={receive}
      {...rest}
    />
  )
}

export const RBox = ({ size: [w, h, d], r = 0.03, seg, ...p }) => <Mesh geometry={roundedBoxGeo(w, h, d, r, seg)} {...p} />
export const Cyl = ({ rt, rb = rt, h, s, ...p }) => <Mesh geometry={cylGeo(rt, rb, h, s)} {...p} />
export const Ball = ({ r, w, hs, ...p }) => <Mesh geometry={sphereGeo(r, w, hs)} {...p} />
export const Gem = ({ r, detail, mat, ...p }) => <Mesh geometry={icoGeo(r, detail)} mat={{ flat: true, ...(mat || {}) }} {...p} />
export const Cone = ({ r, h, s, ...p }) => <Mesh geometry={coneGeo(r, h, s)} {...p} />
export const Torus = ({ r, t, rs, ts, arc, ...p }) => <Mesh geometry={torusGeo(r, t, rs, ts, arc)} {...p} />
export const Disc = ({ r, s, ...p }) => <Mesh geometry={circleGeo(r, s)} shadow={false} {...p} />

export const GOLD = { rough: 0.35, metal: 0.65 }
export const BRASS = '#d6a640'
