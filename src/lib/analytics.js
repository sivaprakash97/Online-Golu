import { track } from '@vercel/analytics'
import { SANDBOX } from './store.js'

// Vercel Web Analytics custom events. The sandbox (?sandbox) is for trying things out, so it isn't counted.
// Event names are the funnel: workshop_opened -> bommai_placed, plus the things people do afterwards.
export const trackEvent = (name, data) => {
  if (SANDBOX) return
  try {
    track(name, data)
  } catch {
    /* analytics must never break the Golu */
  }
}

// page views from the sandbox are dropped too
export const beforeSend = (event) => (SANDBOX ? null : event)
