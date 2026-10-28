import { buildLook, transferables } from './looks.js'

// Builds Bommai looks off the main thread (see prebuildLooks in Bommai.jsx).
self.onmessage = ({ data: { id, cfg } }) => {
  let look = null
  try {
    look = buildLook(cfg)
  } catch (e) {
    console.warn('[golu] could not build a Bommai in the worker', e)
  }
  self.postMessage({ id, look }, look ? transferables(look) : [])
}
