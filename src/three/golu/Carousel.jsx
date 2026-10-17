import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// The Golus on a turning stage. They stand round a ring facing outward (two of them back to back),
// and the ring turns to bring one round to the front. The Golu facing you always stands exactly where
// a lone Golu would (at the origin, facing +z), so everything in world space works on it unchanged:
// the camera's shots, the spots, drag and drop, the petals.
//
// `turn` = { golu, dir, n }: turn to Golu `golu` (numbered from 1). dir +1 brings it round from the
// right, -1 from the left, 0 whichever way is shorter; n changes on every request.
// `onTurning(bool)` says when the stage starts and stops moving. At rest only the Golu facing you is
// drawn. The rooms hold no lights (see GoluLights), so hiding one never makes the shaders rebuild.
// The ref turns it by hand for a gesture: drag(offset) with offset in Golus (+0.3 = 30% of the way
// to the next one on the right), then release(), which springs back or returns the way to commit
// (+1 / -1) for the caller to send as a turn.

const BACK = 9.3 // a Golu's room reaches this far behind its front edge (the back wall)
const HALF_WIDTH = 9.8 // and this far to each side (the floor, pillars and banana plants)
// far enough out that neighbouring rooms never overlap
export const ringRadius = (n) => BACK + (n > 2 ? HALF_WIDTH / Math.tan(Math.PI / n) : 0)

const COMMIT = 0.15 // let go past this much of a turn and it carries on to the next Golu
const FLICK = 1.1 // or flick faster than this (Golus per second)
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)
const mod = (a, n) => ((a % n) + n) % n

const Carousel = forwardRef(function Carousel({ count, turn, onTurning, renderGolu }, apiRef) {
  const R = ringRadius(count)
  const step = (Math.PI * 2) / count
  const ring = useRef()
  const units = useRef([])
  // value: where the ring is now, in Golus from Golu 1; to: where it's heading (or resting)
  const st = useRef({ value: turn.golu - 1, from: 0, to: turn.golu - 1, t0: 0, dur: 0, offset: 0, dragging: false, moving: false, samples: [] })
  const report = useRef(onTurning)
  report.current = onTurning

  const tweenTo = (to, dur) => {
    const s = st.current
    s.from = s.value
    s.to = to
    s.t0 = null // starts on the next frame
    s.dur = dur
  }

  useEffect(() => {
    const s = st.current
    const rest = Math.round(s.to)
    let d = mod(turn.golu - 1 - rest, count)
    if (!d) return
    if (turn.dir < 0) d -= count
    else if (!turn.dir && d > count / 2) d -= count
    s.offset = 0
    s.dragging = false
    tweenTo(rest + d, 0.75 + 0.3 * Math.abs(rest + d - s.value))
  }, [turn.n, count]) // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(apiRef, () => ({
    busy: () => st.current.moving && !st.current.dragging,
    drag(offset) {
      const s = st.current
      s.dragging = true
      s.offset = offset
      const now = performance.now()
      s.samples.push([now, offset])
      while (s.samples.length > 2 && now - s.samples[0][0] > 120) s.samples.shift()
    },
    release() {
      const s = st.current
      if (!s.dragging) return 0
      const [t0, o0] = s.samples[0] || [performance.now(), s.offset]
      const speed = (s.offset - o0) / Math.max(0.016, (performance.now() - t0) / 1000)
      const dir = Math.sign(s.offset)
      const commit = count > 1 && (Math.abs(s.offset) >= COMMIT || (Math.abs(s.offset) > 0.04 && speed * dir > FLICK))
      s.dragging = false
      s.samples = []
      s.value = s.to + s.offset
      s.offset = 0
      tweenTo(s.to, 0.45) // spring back; a committed turn retargets it straight away
      return commit ? dir : 0
    },
  }))

  // Timed by the page's clock, not R3F's: R3F resets its clock to 0 whenever the scene is paused and
  // resumed (as it is while the workshop is open), and a turn started before that would otherwise
  // find itself far in the future and spin the stage round and round until the clock caught up.
  useFrame(() => {
    const s = st.current
    const now = performance.now() / 1000
    if (s.t0 === null) s.t0 = now
    if (s.dragging) s.value = s.to + s.offset
    else {
      const k = s.dur > 0 ? Math.min(1, Math.max(0, (now - s.t0) / s.dur)) : 1
      s.value = k >= 1 ? s.to : s.from + (s.to - s.from) * ease(k)
    }
    const moving = s.dragging || s.value !== s.to
    if (moving !== s.moving) {
      s.moving = moving
      report.current?.(moving)
    }
    if (ring.current) ring.current.rotation.y = -s.value * step
    const front = mod(Math.round(s.to), count)
    units.current.forEach((u, i) => u && (u.visible = moving || i === front))
  })

  return (
    <group position={[0, 0, -R]}>
      <group ref={ring} rotation-y={-st.current.value * step}>
        {Array.from({ length: count }, (_, i) => (
          <group key={i} rotation-y={i * step}>
            <group ref={(u) => (units.current[i] = u)} position={[0, 0, R]}>
              {renderGolu(i + 1)}
            </group>
          </group>
        ))}
      </group>
    </group>
  )
})

export default Carousel
