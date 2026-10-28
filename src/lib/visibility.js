import { useSyncExternalStore } from 'react'
import { EMBEDDED } from './device.js'

// Whether anyone can see the page: the tab is in front and, when the Golu is embedded in another
// site's page, the frame hasn't been scrolled out of view. The 3D scene stops drawing while it can't
// be seen, so a Golu parked in a portfolio costs nothing once you scroll past it.
let seen = !document.hidden
let inView = true
const subs = new Set()
const update = () => {
  const now = !document.hidden && inView
  if (now === seen) return
  seen = now
  subs.forEach((fn) => fn())
}
document.addEventListener('visibilitychange', update)
// Inside a frame the observer reports against the top page's viewport, so it knows when the frame
// is off screen; on a page of its own there is nothing to wait for.
if (EMBEDDED && 'IntersectionObserver' in window) {
  new IntersectionObserver((entries) => {
    inView = entries[entries.length - 1].isIntersecting
    update()
  }).observe(document.getElementById('root') || document.documentElement)
}

export const useSeen = () =>
  useSyncExternalStore(
    (fn) => (subs.add(fn), () => subs.delete(fn)),
    () => seen,
  )
