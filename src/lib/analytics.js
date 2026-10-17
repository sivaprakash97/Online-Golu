import { track } from '@vercel/analytics'
import posthog from 'posthog-js'
import { SANDBOX } from './store.js'

// Two analytics tools, one wrapper:
//  - Vercel Web Analytics counts page views (see <Analytics /> in main.jsx) and gets the custom events too.
//  - PostHog adds funnels, session replay and heatmaps. It only switches on when VITE_POSTHOG_KEY is set
//    (Vercel -> Settings -> Environment Variables), so local runs and forks send nothing.
// The sandbox (?sandbox) is for trying things out, so it isn't counted by either.
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'
let posthogOn = false

export function initAnalytics() {
  if (SANDBOX || !POSTHOG_KEY) return
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only', // visitors are anonymous: no profiles, cheaper events
      persistence: 'localStorage', // no cookies
      capture_heatmaps: true,
      capture_exceptions: true, // uncaught errors and unhandled promise rejections
      capture_dead_clicks: true, // PostHog's own misclick detector, shown on heatmaps and in replays
      session_recording: { maskAllInputs: true }, // the name tag a visitor types is never recorded
    })
    posthogOn = true
  } catch {
    /* analytics must never break the Golu */
  }
}

// Funnel: workshop_opened -> placing_started -> drag_started -> bommai_placed.
// Where it leaks: drag_released_off_target, place_rejected, place_failed. Rotating: golu_turned.
export const trackEvent = (name, data) => {
  if (SANDBOX) return
  try {
    track(name, data)
    if (posthogOn) posthog.capture(name, data)
  } catch {
    /* analytics must never break the Golu */
  }
}

// How smooth the Golu runs on this device: once per visit, a few seconds after the scene is up,
// the average frame rate and the slowest second. A hidden tab pauses frames, so that sample is dropped.
export function sampleFrameRate(seconds = 5) {
  if (SANDBOX) return
  let t0 = 0
  let bucketStart = 0
  let inBucket = 0
  let total = 0
  let worst = Infinity
  let hidden = false
  const onHide = () => (hidden = document.hidden || hidden)
  document.addEventListener('visibilitychange', onHide)
  const tick = (now) => {
    if (!t0) t0 = bucketStart = now
    total++
    inBucket++
    if (now - bucketStart >= 1000) {
      worst = Math.min(worst, (inBucket * 1000) / (now - bucketStart))
      bucketStart = now
      inBucket = 0
    }
    if (now - t0 < seconds * 1000) return requestAnimationFrame(tick)
    document.removeEventListener('visibilitychange', onHide)
    if (hidden || worst === Infinity) return
    trackEvent('fps_sample', {
      fps: Math.round((total * 1000) / (now - t0)),
      fps_low: Math.round(worst),
      touch: matchMedia('(pointer: coarse)').matches,
    })
  }
  requestAnimationFrame(tick)
}

// page views from the sandbox are dropped too
export const beforeSend = (event) => (SANDBOX ? null : event)
