import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LOOKUP, normalizeConfig } from '../../data/options.js'
import { meshGrid, cachedMesh, voxelMaterial } from '../voxel/mesher.js'
import { resolveLook } from './look.js'
import { buildHead } from './head.js'
import { buildBody, buildArm, buildStand, bodyDims, ARM_LEN } from './body.js'
import { buildItem } from './items.js'

// A Bommai is a little voxel chibi doll ~1 unit tall, on a lacquered stand like a real Golu doll.
// It faces +z; origin = bottom centre of the stand. Everything is built from voxels of size U and
// meshed once per unique look (see voxel/mesher.js), so a Golu full of dolls shares geometry.
export const U = 0.019
const STAND_H = 3 * U
const HAND_Y = -(ARM_LEN - 1) * U

const POSE_ARMS = {
  standing: { L: [0, 0, 0.08], R: [0, 0, -0.08] },
  waving: { L: [0, 0, 0.08], R: [0.15, 0, -2.25] },
  namaste: { L: [-1.2, 0, -0.62], R: [-1.2, 0, 0.62] },
  holding: { L: [-1.25, 0, -0.3], R: [-1.25, 0, 0.3] },
  sitting: { L: [-0.85, 0, -0.16], R: [-0.85, 0, 0.16] },
}
// one arm held out in front at waist height, so a hand-held item doesn't dangle
const HAND_OUT = { L: [-1.0, 0, -0.32], R: [-1.0, 0, 0.32] }
// free arm eased away from the body to make room for something tucked under it
const ARM_TUCK = { L: [0.05, 0, 0.32], R: [0.05, 0, -0.32] }

const HEAD_ITEMS = ['headphones', 'flower-crown', 'bunny-hat', 'cat-hat', 'bear-hat']

// How an accessory is carried depends on the pose, so the two always make sense together.
function carryMode(acc, pose) {
  if (!acc || acc.id === 'none') return null
  if (acc.hold === 'hand') return pose === 'namaste' ? 'clasp' : 'hand'
  if (acc.hold === 'both') {
    if (pose === 'holding' || pose === 'sitting') return 'chest'
    if (acc.id === 'guitar') return pose === 'namaste' ? 'slung-back' : 'slung'
    if (acc.id === 'camera') return 'strap'
    if (acc.id === 'controller') return pose === 'namaste' ? 'clasp' : 'hand'
    return 'tuck'
  }
  return acc.hold
}

function hash(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function Vox({ geometry, ...rest }) {
  return <mesh geometry={geometry} material={voxelMaterial} castShadow receiveShadow {...rest} />
}

const itemGeo = (id) =>
  cachedMesh(`item:${id}`, () => {
    const it = buildItem(id)
    return it ? meshGrid(it.grid, U, it.origin) : new THREE.BufferGeometry()
  })

function Arm({ rot, geometry, children, waving }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!waving || !ref.current) return
    ref.current.rotation.z = rot[2] + Math.sin(clock.elapsedTime * 7) * 0.22
  })
  return (
    <group ref={ref} rotation={rot}>
      <Vox geometry={geometry} />
      {children}
    </group>
  )
}

export default function Bommai({ config, idle = true, phaseKey, ...rest }) {
  const cfg = useMemo(() => normalizeConfig(config), [config])
  const look = useMemo(() => resolveLook(cfg), [cfg])
  const root = useRef()
  const phase = useMemo(() => (hash(phaseKey || cfg.name) % 1000) / 160, [phaseKey, cfg.name])

  useFrame(({ clock }) => {
    if (!idle || !root.current) return
    const t = clock.elapsedTime * 1.6 + phase
    const s = Math.sin(t)
    root.current.scale.set(1 - s * 0.008, 1 + s * 0.014, 1 - s * 0.008)
    root.current.rotation.y = Math.sin(t * 0.37) * 0.05
  })

  const sitting = cfg.pose === 'sitting'
  const acc = LOOKUP.accessory[cfg.accessory]
  const mode = carryMode(acc, cfg.pose)
  const headItem = mode === 'head' ? acc.id : null
  const d = bodyDims(look, sitting)

  const geo = useMemo(() => {
    const extras = [...cfg.face_extras].sort().join('+')
    const headKey = ['head', cfg.skin_tone, cfg.hair, cfg.hair_color, cfg.face, extras, headItem].join('|')
    const bodyKey = ['body', cfg.outfit, cfg.outfit_color, cfg.skin_tone, cfg.body, sitting, mode].join('|')
    const armKey = ['arm', cfg.outfit, cfg.outfit_color, cfg.skin_tone].join('|')
    return {
      stand: cachedMesh('stand', () => meshGrid(buildStand(), U)),
      head: cachedMesh(headKey, () => meshGrid(buildHead(cfg, look, headItem), U)),
      body: cachedMesh(bodyKey, () => meshGrid(buildBody(look, sitting, mode), U)),
      arm: cachedMesh(armKey, () => meshGrid(buildArm(look), U, [0.5, 0, 0])),
    }
  }, [cfg, look, sitting, mode, headItem])

  const handSide = cfg.pose === 'waving' ? 'L' : 'R'
  const sideX = handSide === 'L' ? 1 : -1
  const arms = useMemo(() => {
    const a = { ...POSE_ARMS[cfg.pose] }
    if (mode === 'hand' && cfg.pose !== 'sitting') a[handSide] = HAND_OUT[handSide]
    if (mode === 'tuck') a[handSide] = ARM_TUCK[handSide]
    return a
  }, [cfg.pose, mode, handSide])

  const shoulderX = (d.hw + 1.5) * U
  const shoulderY = d.top * U
  const front = d.hd * U

  // where the palms meet for namaste, so a clasped item sits right between them
  const claspAt = useMemo(() => {
    const v = new THREE.Vector3(0, HAND_Y, 0).applyEuler(new THREE.Euler(...POSE_ARMS.namaste.L))
    return [0, shoulderY + v.y, v.z + 2 * U]
  }, [shoulderY])
  // keeps a hand-held item upright no matter how the arm is rotated
  const counterRot = useMemo(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(...arms[handSide])).invert(), [arms, handSide])

  const item = mode && mode !== 'head' ? itemGeo(acc.id) : null
  const handItem = mode === 'hand' && (
    <group position={[0, HAND_Y, U]} quaternion={counterRot}>
      <Vox geometry={item} />
    </group>
  )

  return (
    <group {...rest}>
      <group ref={root}>
        <Vox geometry={geo.stand} position={[0, STAND_H, 0]} />
        <group position={[0, STAND_H, 0]}>
          <Vox geometry={geo.body} />
          <group position={[shoulderX, shoulderY, 0]}>
            <Arm rot={arms.L} geometry={geo.arm}>
              {handSide === 'L' && handItem}
            </Arm>
          </group>
          <group position={[-shoulderX, shoulderY, 0]}>
            <Arm rot={arms.R} geometry={geo.arm} waving={cfg.pose === 'waving'}>
              {handSide === 'R' && handItem}
            </Arm>
          </group>
          <Vox geometry={geo.head} position={[0, (d.top + 1) * U, 0]} />

          {mode === 'chest' && <Vox geometry={item} position={[0, shoulderY - 7 * U, front + 4 * U]} rotation={[0, 0, acc.id === 'guitar' ? 0.35 : 0]} />}
          {mode === 'tuck' && <Vox geometry={item} position={[sideX * (shoulderX + 1.2 * U), shoulderY - 6 * U, 0]} rotation={[0, Math.PI / 2, 0]} />}
          {mode === 'strap' && <Vox geometry={item} position={[0, shoulderY - 9 * U, front + 2 * U]} />}
          {mode === 'slung' && <Vox geometry={item} position={[-1 * U, shoulderY - 8 * U, front + 2.5 * U]} rotation={[0, 0, 0.35]} />}
          {mode === 'slung-back' && <Vox geometry={item} position={[0, shoulderY - 6 * U, -front - 2.5 * U]} rotation={[0, Math.PI, 0.35]} />}
          {mode === 'clasp' && <Vox geometry={item} position={claspAt} />}
          {mode === 'back' && <Vox geometry={item} position={[0, shoulderY - 6 * U, -front - 1.5 * U]} />}
        </group>
      </group>
      {mode === 'ground' && <Vox geometry={item} position={[0.36, 0, 0.06]} />}
    </group>
  )
}

export const BOMMAI_HEIGHT = 1.0
