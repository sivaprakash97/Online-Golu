import { useSyncExternalStore } from 'react'
import trackUrl from '../assets/golu-bgm.mp3'

// Background music. Browsers won't play sound until the visitor interacts, so it starts on the
// first click, tap or key press and fades in. It loops without a gap (Web Audio, not <audio>), can
// be muted (remembered on this device), and pauses while the tab is hidden.

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

function fadeTo(v, secs) {
  if (!ctx) return
  const t = ctx.currentTime
  gain.gain.cancelScheduledValues(t)
  gain.gain.setValueAtTime(gain.gain.value, t)
  gain.gain.linearRampToValueAtTime(v, t + secs)
}

// Must first be called from inside a user gesture, so the audio context is allowed to run.
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
  ctx?.resume()
  if (gain && gain.gain.value < VOLUME) fadeTo(VOLUME, 1.2)
}

// Start the music on the first interaction, unless the visitor muted it on an earlier visit.
export function armMusic() {
  const go = () => {
    window.removeEventListener('pointerdown', go, true)
    window.removeEventListener('keydown', go, true)
    if (!muted) start()
  }
  window.addEventListener('pointerdown', go, true)
  window.addEventListener('keydown', go, true)
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) ctx.suspend()
    else if (!muted) ctx.resume()
  })
}

export function useMuted() {
  return useSyncExternalStore(
    (fn) => (listeners.add(fn), () => listeners.delete(fn)),
    () => muted,
  )
}
