import { useSyncExternalStore } from 'react'
import trackUrl from '../assets/golu-bgm.mp3'

// Background music. It tries to start once the page has loaded; browsers allow that only for
// some visitors (in Chrome, people who already use this site; Safari and Firefox block it by
// default), so otherwise it starts on the first click, tap or key press. Either way it fades in.
// It loops without a gap (Web Audio, not <audio>), can be muted (remembered on this device), and
// pauses while the tab is hidden.

const KEY = 'golu-muted'
const VOLUME = 0.35
const LOOP_END = 34.1 // seconds; the file ends with a second of silence

let ctx = null
let gain = null
let started = false
let muted = (() => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
})()
const listeners = new Set()
// resume() is refused (not thrown) until the browser allows sound; that's expected
const resume = () => ctx?.resume().catch(() => {})

function fadeTo(v, secs) {
  if (!ctx) return
  const t = ctx.currentTime
  gain.gain.cancelScheduledValues(t)
  gain.gain.setValueAtTime(gain.gain.value, t)
  gain.gain.linearRampToValueAtTime(v, t + secs)
}

// Sets up the music. Outside a user gesture the audio context may start suspended; it is resumed
// on the first interaction.
function start() {
  if (started) return
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  started = true
  ctx = new AC()
  gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(ctx.destination)
  fetch(trackUrl)
    .then((r) => r.arrayBuffer())
    .then((b) => ctx.decodeAudioData(b))
    .then((buf) => {
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.loop = true
      src.loopEnd = Math.min(LOOP_END, buf.duration)
      src.connect(gain)
      src.start()
      if (!muted) fadeTo(VOLUME, 2.5)
    })
    .catch(() => {}) // no music, then; the rest of the page doesn't depend on it
}

export function setMuted(m) {
  muted = m
  try {
    localStorage.setItem(KEY, m ? '1' : '0')
  } catch {
    /* private mode: fine */
  }
  listeners.forEach((fn) => fn())
  if (m) {
    fadeTo(0, 0.4)
    return
  }
  start()
  resume()
  if (gain && gain.gain.value < VOLUME) fadeTo(VOLUME, 1.2)
}

// Try to start the music soon after the page has loaded (unless the visitor muted it on an earlier
// visit), and make sure it is running after the first interaction if the browser held it back.
export function armMusic() {
  // The track is a big download (and the first thing the page asks for after its code), so it waits
  // until the Golu has had time to load: a few seconds after the page's `load`, when the browser is idle.
  if (!muted) {
    const later = () => setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 4000 }) : start()), 2500)
    if (document.readyState === 'complete') later()
    else window.addEventListener('load', later, { once: true })
  }
  const go = () => {
    window.removeEventListener('pointerdown', go, true)
    window.removeEventListener('keydown', go, true)
    if (muted) return
    start()
    resume()
  }
  window.addEventListener('pointerdown', go, true)
  window.addEventListener('keydown', go, true)
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) ctx.suspend()
    else if (!muted) resume()
  })
}

export function useMuted() {
  return useSyncExternalStore(
    (fn) => (listeners.add(fn), () => listeners.delete(fn)),
    () => muted,
  )
}
