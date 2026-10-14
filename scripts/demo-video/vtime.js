// Virtual time: the page's clock only moves when the recorder calls __vt.advance(ms).
// rAF callbacks, timers, performance.now and Date.now all follow it, so a slow software
// renderer still produces smooth, correctly-timed frames.
(() => {
  const realPerfNow = performance.now.bind(performance)
  const realDateNow = Date.now
  const base = realPerfNow()
  const dateBase = realDateNow()
  let now = base
  let raf = []
  let rafId = 0
  const timers = new Map()
  let timerId = 1
  performance.now = () => now
  Date.now = () => dateBase + (now - base)
  window.requestAnimationFrame = (cb) => {
    const id = ++rafId
    raf.push({ id, cb })
    return id
  }
  window.cancelAnimationFrame = (id) => {
    raf = raf.filter((r) => r.id !== id)
  }
  const add = (fn, ms, args, every) => {
    const id = timerId++
    const d = Math.max(0, Number(ms) || 0)
    timers.set(id, { at: now + d, fn, args, every: every ? Math.max(1, d) : 0 })
    return id
  }
  window.setTimeout = (fn, ms, ...args) => add(fn, ms, args, false)
  window.setInterval = (fn, ms, ...args) => add(fn, ms, args, true)
  window.clearTimeout = window.clearInterval = (id) => timers.delete(id)
  const run = (t) => {
    try {
      typeof t.fn === 'function' ? t.fn(...t.args) : (0, eval)(t.fn)
    } catch (e) {
      console.error(e)
    }
  }
  // CSS animations and transitions follow the virtual clock too
  const syncAnims = () => {
    for (const a of document.getAnimations()) {
      if (a.__vstart === undefined) {
        a.__vstart = now
        a.pause()
      }
      a.currentTime = now - a.__vstart
    }
  }
  window.__vt = {
    now: () => now,
    syncAnims,
    advance(ms, rafs = 1) {
      const end = now + ms
      for (let i = 1; i <= rafs; i++) {
        const stepEnd = now + (end - now) / (rafs - i + 1)
        // fire due timers in order (timers they schedule run too if due)
        for (;;) {
          let next = null
          for (const [id, t] of timers) if (t.at <= stepEnd && (!next || t.at < next[1].at)) next = [id, t]
          if (!next) break
          const [id, t] = next
          now = Math.max(now, t.at)
          if (t.every) t.at += t.every
          else timers.delete(id)
          run(t)
        }
        now = stepEnd
        const q = raf
        raf = []
        for (const r of q) {
          try {
            r.cb(now)
          } catch (e) {
            console.error(e)
          }
        }
      }
    },
  }
})()
