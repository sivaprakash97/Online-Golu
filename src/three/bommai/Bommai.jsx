import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LOOKUP, normalizeConfig } from '../../data/options.js'
import { RBox, Ball, Cyl, Torus, GOLD } from '../prims.jsx'
import Hair from './Hair.jsx'
import Face from './Face.jsx'
import Accessory from './Accessory.jsx'

// A Bommai is ~1 unit tall, standing on a little lacquered pedestal like a real Golu doll.
// It faces +z. Origin = bottom centre of the pedestal.
const P_H = 0.06
const LEG_H = 0.2
const ARM_LEN = 0.26
const SEAT = P_H + 0.1
const TRAD_BOTTOMS = ['saree', 'skirt', 'dhoti']

const POSE_ARMS = {
  standing: { L: [0, 0, 0.1], R: [0, 0, -0.1] },
  waving: { L: [0, 0, 0.1], R: [0, 0, -2.65] },
  namaste: { L: [-1.25, 0, -0.76], R: [-1.25, 0, 0.76] },
  holding: { L: [-1.3, 0, -0.36], R: [-1.3, 0, 0.36] },
  sitting: { L: [-0.85, 0, -0.18], R: [-0.85, 0, 0.18] },
}

// Arm angles for holding an item out in front at waist height (instead of letting it dangle).
const HAND_OUT = { L: [-1.05, 0, -0.4], R: [-1.05, 0, 0.4] }
// Free arm eased away from the body to make room for something tucked under it.
const ARM_TUCK = { L: [0.05, 0, 0.3], R: [0.05, 0, -0.3] }

// How an accessory is carried depends on the pose, so the two always make sense together.
//   hand        held out in one hand          clasp       held between namaste palms
//   chest       held in front with both hands (holding / sitting poses)
//   tuck        under the free arm (laptop, book)
//   strap       hanging from a neck strap (camera)
//   slung       guitar on a strap across the front; slung-back when the hands are together
//   head | back | ground  as before
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

const tmpColor = new THREE.Color()
function shade(hex, amt) {
  tmpColor.set(hex)
  const hsl = {}
  tmpColor.getHSL(hsl)
  tmpColor.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + amt, 0, 1))
  return '#' + tmpColor.getHexString()
}
const isWarmYellow = (id) => ['turmeric', 'mustard', 'cream'].includes(id)

function hash(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function resolveLook(cfg) {
  const outfit = LOOKUP.outfit[cfg.outfit]
  const c = LOOKUP.outfitColor[cfg.outfit_color].color
  const contrast = isWarmYellow(cfg.outfit_color) ? '#7a1f2b' : '#e3a83a'
  const look = {
    skin: LOOKUP.skin[cfg.skin_tone].color,
    hair: LOOKUP.hairColor[cfg.hair_color].color,
    body: LOOKUP.body[cfg.body],
    outfit,
    main: c,
    accent: outfit.accent || shade(c, -0.15),
    top: c,
    pants: outfit.pants === null ? c : outfit.pants || shade(c, -0.2),
    sleeves: 'long',
    shoes: '#3a2a24',
  }
  if (outfit.top === 'blouse') {
    look.top = contrast
    look.sleeves = 'short'
  }
  if (outfit.top === 'overalls') {
    look.top = '#f4efe6'
    look.sleeves = 'short'
  }
  if (outfit.id === 'tee-jeans' || outfit.id === 'jibba' || outfit.id === 'dress') look.sleeves = 'short'
  if (outfit.bottom === 'dhoti') look.pants = '#f6f0e1'
  if (TRAD_BOTTOMS.includes(outfit.bottom) || outfit.id === 'kurta' || outfit.id === 'salwar') look.shoes = null // barefoot / sandals
  look.drapeColor = outfit.drape === 'davani' ? contrast : outfit.drape === 'angavastram' ? '#f6f0e1' : outfit.drape === 'dupatta' ? shade(c, 0.18) : c
  return look
}

function Arm({ side, rot, look, children, waving }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!waving || !ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.z = rot[2] + Math.sin(t * 7) * 0.22
  })
  const short = look.sleeves === 'short'
  return (
    <group ref={ref} rotation={rot}>
      {short ? (
        <>
          <RBox size={[0.095, 0.1, 0.1]} r={0.035} position={[0, -0.04, 0]} color={look.top} />
          <RBox size={[0.075, 0.2, 0.08]} r={0.035} position={[0, -0.14, 0]} color={look.skin} />
        </>
      ) : (
        <RBox size={[0.088, ARM_LEN - 0.02, 0.092]} r={0.038} position={[0, -(ARM_LEN - 0.02) / 2 + 0.01, 0]} color={look.top} />
      )}
      {!short && look.outfit.accent && <RBox size={[0.092, 0.02, 0.096]} r={0.008} position={[0, -ARM_LEN + 0.04, 0]} color={look.outfit.accent} mat={GOLD} />}
      <Ball r={0.05} position={[0, -ARM_LEN - 0.01, 0]} color={look.skin} />
      {children}
    </group>
  )
}

function Legs({ look, sitting }) {
  const bottom = look.outfit.bottom
  const covered = ['saree', 'skirt'].includes(bottom)
  const legColor = bottom === 'pants' ? look.pants : look.skin
  const feet = look.shoes || look.skin
  if (sitting) {
    return (
      <group>
        {[0.068, -0.068].map((x) => (
          <group key={x}>
            <RBox size={[0.115, 0.1, 0.22]} r={0.04} position={[x, SEAT + 0.05, 0.08]} color={covered || bottom === 'dhoti' ? look.main : legColor} />
            <RBox size={[0.105, 0.11, 0.105]} r={0.04} position={[x, P_H + 0.055, 0.15]} color={bottom === 'pants' ? look.pants : look.skin} />
            <RBox size={[0.115, 0.05, 0.15]} r={0.022} position={[x, P_H + 0.025, 0.19]} color={feet} />
          </group>
        ))}
        {(covered || bottom === 'dhoti') && (
          <>
            <RBox size={[0.3, 0.11, 0.25]} r={0.045} position={[0, SEAT + 0.055, 0.07]} color={bottom === 'dhoti' ? look.pants : look.main} />
            <RBox size={[0.3, 0.14, 0.06]} r={0.025} position={[0, SEAT - 0.03, 0.17]} color={bottom === 'dhoti' ? look.pants : look.main} />
            <RBox size={[0.302, 0.025, 0.062]} r={0.01} position={[0, SEAT - 0.09, 0.17]} color={look.accent} mat={GOLD} />
          </>
        )}
      </group>
    )
  }
  return (
    <group>
      {[0.068, -0.068].map((x) => (
        <group key={x}>
          {bottom === 'shorts' ? (
            <>
              <RBox size={[0.115, 0.09, 0.125]} r={0.04} position={[x, P_H + LEG_H - 0.045, 0]} color={look.pants} />
              <RBox size={[0.095, 0.13, 0.105]} r={0.04} position={[x, P_H + 0.08, 0]} color={look.skin} />
            </>
          ) : (
            <RBox size={[0.11, LEG_H, 0.12]} r={0.045} position={[x, P_H + LEG_H / 2, 0]} color={legColor} />
          )}
          <RBox size={[0.115, 0.055, 0.155]} r={0.024} position={[x, P_H + 0.027, 0.025]} color={feet} />
        </group>
      ))}
    </group>
  )
}

function Lower({ look, tw, hipY, sitting }) {
  const { bottom } = look.outfit
  if (sitting) return null
  const h = hipY - P_H
  if (bottom === 'saree' || bottom === 'skirt') {
    const flare = bottom === 'skirt' ? 0.72 : 0.62
    const rb = tw * flare
    return (
      <group>
        <Cyl rt={tw * 0.52} rb={rb} h={h} s={10} position={[0, P_H + h / 2 + 0.008, 0]} color={look.main} mat={{ flat: true }} />
        <Cyl rt={rb * 0.985} rb={rb + 0.006} h={0.04} s={10} position={[0, P_H + 0.028, 0]} color={look.accent} mat={{ ...GOLD, flat: true }} />
        {bottom === 'skirt' && <Cyl rt={tw * 0.6} rb={tw * 0.63} h={0.025} s={10} position={[0, P_H + h * 0.55, 0]} color={look.accent} mat={{ ...GOLD, flat: true }} />}
        {bottom === 'saree' &&
          [-0.03, 0, 0.03].map((x) => (
            <RBox key={x} size={[0.026, h * 0.8, 0.02]} r={0.008} position={[x, P_H + h * 0.45, rb * 0.92]} rotation={[-0.18, 0, 0]} color={shade(look.main, -0.08)} />
          ))}
      </group>
    )
  }
  if (bottom === 'dhoti') {
    const hh = h - 0.05
    return (
      <group>
        <Cyl rt={tw * 0.52} rb={tw * 0.56} h={hh} s={10} position={[0, P_H + 0.05 + hh / 2 + 0.008, 0]} color={look.pants} mat={{ flat: true }} />
        <Cyl rt={tw * 0.555} rb={tw * 0.565} h={0.03} s={10} position={[0, P_H + 0.07, 0]} color={look.accent} mat={{ ...GOLD, flat: true }} />
      </group>
    )
  }
  if (bottom === 'dress') {
    const hh = h * 0.62
    return (
      <Cyl rt={tw * 0.5} rb={tw * 0.7} h={hh} s={10} position={[0, hipY - hh / 2 + 0.01, 0]} color={look.main} mat={{ flat: true }} />
    )
  }
  return null
}

function Torso({ look, tw, th, td, hipY }) {
  const o = look.outfit
  const cy = hipY + th / 2
  const tunic = o.topLength && o.topLength > 1 ? (o.topLength - 1) * th : 0
  return (
    <group>
      <RBox size={[tw, th, td]} r={0.06} position={[0, cy, 0]} color={look.top} />
      {tunic > 0 && (
        <>
          <Cyl rt={tw * 0.6} rb={tw * 0.7} h={tunic} s={4} position={[0, hipY - tunic / 2 + 0.02, 0]} rotation={[0, Math.PI / 4, 0]} color={look.top} mat={{ flat: true }} />
          {o.accent && <Cyl rt={tw * 0.7} rb={tw * 0.71} h={0.022} s={4} position={[0, hipY - tunic + 0.03, 0]} rotation={[0, Math.PI / 4, 0]} color={o.accent} mat={{ ...GOLD, flat: true }} />}
          {o.accent && <RBox size={[0.03, th * 0.7, 0.01]} r={0.005} position={[0, cy + th * 0.1, td / 2]} color={o.accent} mat={GOLD} />}
        </>
      )}
      {o.top === 'shirt' && (
        <>
          <RBox size={[0.09, 0.05, 0.03]} r={0.012} position={[0.05, hipY + th - 0.02, td / 2 - 0.005]} rotation={[0, 0, -0.5]} color={shade(look.top, 0.1)} />
          <RBox size={[0.09, 0.05, 0.03]} r={0.012} position={[-0.05, hipY + th - 0.02, td / 2 - 0.005]} rotation={[0, 0, 0.5]} color={shade(look.top, 0.1)} />
          {[0.08, 0.15, 0.22].map((y) => (
            <Ball key={y} r={0.009} position={[0, hipY + y, td / 2 + 0.003]} color="#f4efe6" shadow={false} />
          ))}
        </>
      )}
      {o.top === 'hoodie' && (
        <>
          <RBox size={[tw * 0.82, 0.13, 0.11]} r={0.05} position={[0, hipY + th - 0.01, -td / 2 - 0.02]} color={shade(look.top, -0.08)} />
          <RBox size={[tw * 0.6, 0.08, 0.02]} r={0.02} position={[0, hipY + 0.07, td / 2]} color={shade(look.top, -0.08)} />
          <Cyl rt={0.006} h={0.08} position={[0.035, hipY + th - 0.07, td / 2 + 0.005]} color="#f4efe6" />
          <Cyl rt={0.006} h={0.08} position={[-0.035, hipY + th - 0.07, td / 2 + 0.005]} color="#f4efe6" />
        </>
      )}
      {o.top === 'overalls' && (
        <>
          <RBox size={[tw * 0.62, th * 0.55, 0.03]} r={0.015} position={[0, hipY + th * 0.3, td / 2]} color={look.main} />
          <RBox size={[0.035, th * 0.5, 0.02]} r={0.008} position={[tw * 0.25, hipY + th * 0.72, td / 2 + 0.002]} color={look.main} />
          <RBox size={[0.035, th * 0.5, 0.02]} r={0.008} position={[-tw * 0.25, hipY + th * 0.72, td / 2 + 0.002]} color={look.main} />
          <RBox size={[tw + 0.005, 0.06, td + 0.005]} r={0.02} position={[0, hipY + 0.03, 0]} color={look.main} />
          <RBox size={[0.08, 0.05, 0.01]} r={0.008} position={[0, hipY + th * 0.35, td / 2 + 0.016]} color={shade(look.main, -0.12)} />
        </>
      )}
      {o.id === 'tee-jeans' && <RBox size={[tw * 0.38, 0.07, 0.01]} r={0.015} position={[0, cy + 0.02, td / 2 + 0.002]} color="#f4efe6" />}
      {o.bottom === 'dress' && <RBox size={[tw * 0.5, 0.035, 0.03]} r={0.012} position={[0, hipY + th - 0.012, td / 2 - 0.005]} color={o.accent} />}
      {(o.top === 'blouse' || o.bottom === 'dress') && <RBox size={[tw + 0.004, 0.035, td + 0.004]} r={0.015} position={[0, hipY + 0.015, 0]} color={o.bottom === 'dress' ? shade(look.main, -0.1) : look.main} />}
      <Drape look={look} tw={tw} th={th} td={td} hipY={hipY} />
    </group>
  )
}

function Drape({ look, tw, th, td, hipY }) {
  const kind = look.outfit.drape
  if (!kind) return null
  const c = look.drapeColor
  const cy = hipY + th / 2
  if (kind === 'dupatta')
    return (
      <group>
        <RBox size={[tw + 0.02, 0.05, td + 0.02]} r={0.022} position={[0, hipY + th - 0.015, 0]} color={c} />
        <RBox size={[0.055, th * 1.1, 0.02]} r={0.01} position={[tw * 0.3, cy - 0.03, td / 2 + 0.012]} color={c} />
        <RBox size={[0.055, th * 1.1, 0.02]} r={0.01} position={[-tw * 0.3, cy - 0.03, td / 2 + 0.012]} color={c} />
      </group>
    )
  const w = kind === 'angavastram' ? 0.07 : 0.11
  return (
    <group>
      {/* across the chest from right hip to left shoulder */}
      <RBox size={[w, th * 1.25, 0.02]} r={0.01} position={[0.01, cy, td / 2 + 0.008]} rotation={[0, 0, -0.62]} color={c} />
      <RBox size={[0.016, th * 1.25, 0.022]} r={0.006} position={[0.01 + (w / 2) * 0.82, cy + (w / 2) * 0.58, td / 2 + 0.01]} rotation={[0, 0, -0.62]} color="#e8b33c" mat={GOLD} />
      {/* over the shoulder and down the back */}
      <RBox size={[w * 1.05, 0.05, td + 0.03]} r={0.02} position={[tw * 0.32, hipY + th - 0.005, 0]} color={c} />
      <RBox size={[w * 1.05, th * 1.35, 0.02]} r={0.01} position={[tw * 0.32, hipY + th * 0.35, -td / 2 - 0.012]} color={c} />
    </group>
  )
}

// A thin strap between two points (e.g. a camera strap up to the neck).
function Strap({ from, to, color = '#2b2c33' }) {
  const [x1, y1, z1] = from
  const [x2, y2, z2] = to
  const dy = y2 - y1
  const dz = z2 - z1
  const len = Math.hypot(x2 - x1, dy, dz)
  return (
    <RBox
      size={[0.016, len, 0.008]}
      r={0.003}
      position={[(x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2]}
      rotation={[Math.atan2(dz, dy), 0, -Math.atan2(x2 - x1, dy)]}
      color={color}
      shadow={false}
    />
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
  const bw = look.body.w
  const tw = 0.34 * bw
  const td = 0.22 * look.body.d
  const th = 0.3 * look.body.h
  const hipY = sitting ? SEAT : P_H + LEG_H
  const shoulderY = hipY + th - 0.045
  const neckY = hipY + th
  const headY = neckY + 0.22
  const acc = LOOKUP.accessory[cfg.accessory]
  const mode = carryMode(acc, cfg.pose)
  const handSide = cfg.pose === 'waving' ? 'L' : 'R'
  const sideX = handSide === 'L' ? 1 : -1
  const arms = useMemo(() => {
    const a = { ...POSE_ARMS[cfg.pose] }
    if (mode === 'hand' && cfg.pose !== 'sitting') a[handSide] = HAND_OUT[handSide]
    if (mode === 'tuck') a[handSide] = ARM_TUCK[handSide]
    return a
  }, [cfg.pose, mode, handSide])
  // where the palms meet for namaste, so a clasped item sits right between them
  const claspAt = useMemo(() => {
    const v = new THREE.Vector3(0, -ARM_LEN, 0).applyEuler(new THREE.Euler(...POSE_ARMS.namaste.L))
    return [0, shoulderY + v.y + 0.01, v.z + 0.04]
  }, [shoulderY])

  // keeps a hand-held item upright no matter how the arm is rotated
  const counterRot = useMemo(() => {
    const e = new THREE.Euler(...arms[handSide])
    return new THREE.Quaternion().setFromEuler(e).invert()
  }, [arms, handSide])

  const handItem = mode === 'hand' && (
    <group position={[0, -ARM_LEN - 0.01, 0.0]} quaternion={counterRot}>
      <Accessory id={acc.id} mode="hand" />
    </group>
  )
  const torsoInfo = [tw, th, td, hipY + th / 2]
  const ped = { color: '#8e2a2a' }

  return (
    <group {...rest}>
      <group ref={root}>
        {/* pedestal */}
        <Cyl rt={0.25} rb={0.27} h={P_H} s={12} position={[0, P_H / 2, 0]} color={ped.color} mat={{ rough: 0.4 }} />
        <Torus r={0.255} t={0.012} rs={4} ts={24} position={[0, P_H, 0]} rotation={[Math.PI / 2, 0, 0]} color="#e3a83a" mat={GOLD} shadow={false} />
        {sitting && <RBox size={[0.32, 0.1, 0.24]} r={0.03} position={[0, P_H + 0.05, -0.04]} color="#b9733f" />}

        <Legs look={look} sitting={sitting} />
        <Lower look={look} tw={tw} hipY={hipY} sitting={sitting} />
        <Torso look={look} tw={tw} th={th} td={td} hipY={hipY} />

        <group position={[tw / 2 + 0.042, shoulderY, 0]}>
          <Arm side="L" rot={arms.L} look={look}>
            {handSide === 'L' && handItem}
          </Arm>
        </group>
        <group position={[-tw / 2 - 0.042, shoulderY, 0]}>
          <Arm side="R" rot={arms.R} look={look} waving={cfg.pose === 'waving'}>
            {handSide === 'R' && handItem}
          </Arm>
        </group>

        <Cyl rt={0.055} h={0.06} position={[0, neckY + 0.02, 0]} color={look.skin} />
        <group position={[0, headY, 0]}>
          <RBox size={[0.44, 0.4, 0.38]} r={0.13} seg={4} color={look.skin} mat={{ rough: 0.55 }} />
          <Ball r={0.045} position={[0.225, -0.01, -0.01]} scale={[0.6, 1, 1]} color={look.skin} />
          <Ball r={0.045} position={[-0.225, -0.01, -0.01]} scale={[0.6, 1, 1]} color={look.skin} />
          <Face eyes={cfg.face} extras={cfg.face_extras} hairColor={cfg.hair === 'bald' ? shade(look.skin, -0.3) : look.hair} skin={look.skin} />
          <Hair style={cfg.hair} color={look.hair} />
          {mode === 'head' && <Accessory id={acc.id} mode="head" />}
        </group>

        {mode === 'chest' && (
          <group position={[0, shoulderY - 0.1, td / 2 + 0.1]}>
            <Accessory id={acc.id} mode="chest" />
          </group>
        )}
        {mode === 'back' && <Accessory id={acc.id} mode="back" torso={torsoInfo} />}
        {mode === 'clasp' && (
          <group position={claspAt}>
            <Accessory id={acc.id} mode="clasp" />
          </group>
        )}
        {mode === 'tuck' && (
          <group position={[sideX * (tw / 2 + 0.035), shoulderY - 0.15, 0.01]}>
            <Accessory id={acc.id} mode="tuck" />
          </group>
        )}
        {mode === 'strap' && (
          <>
            <group position={[0, shoulderY - 0.15, td / 2 + 0.065]}>
              <Accessory id={acc.id} mode="chest" />
            </group>
            <Strap from={[0.07, shoulderY - 0.09, td / 2 + 0.06]} to={[0.065, hipY + th + 0.005, td * 0.28]} />
            <Strap from={[-0.07, shoulderY - 0.09, td / 2 + 0.06]} to={[-0.065, hipY + th + 0.005, td * 0.28]} />
          </>
        )}
        {(mode === 'slung' || mode === 'slung-back') && (
          <>
            {/* strap from the right hip over the left shoulder */}
            <RBox size={[0.024, th * 1.3, 0.012]} r={0.005} position={[0, hipY + th * 0.5, td / 2 + 0.014]} rotation={[0, 0, 0.62]} color="#4a2c1d" />
            <RBox size={[0.024, th * 1.3, 0.012]} r={0.005} position={[0, hipY + th * 0.5, -td / 2 - 0.014]} rotation={[0, 0, -0.62]} color="#4a2c1d" />
            {mode === 'slung' ? (
              <group position={[0, shoulderY - 0.12, td / 2 + 0.1]}>
                <Accessory id={acc.id} mode="chest" />
              </group>
            ) : (
              <group position={[0, shoulderY - 0.14, -td / 2 - 0.07]} rotation={[0, Math.PI, 0]}>
                <Accessory id={acc.id} mode="chest" />
              </group>
            )}
          </>
        )}
      </group>
      {mode === 'ground' && (
        <group position={[0.36, 0, 0.06]}>
          <Accessory id={acc.id} mode="ground" />
        </group>
      )}
    </group>
  )
}

export const BOMMAI_HEIGHT = 1.0
