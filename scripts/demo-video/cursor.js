// A drawn mouse cursor (screenshots don't include the real one): an arrow, a hand while grabbing,
// and a ring on each click. Positioned by the recorder every frame.
(() => {
  const ARROW = '<svg width="26" height="30" viewBox="0 0 26 30"><path d="M3 2 L3 24 L8.6 18.8 L12.6 27.6 L16.6 25.8 L12.7 17.2 L20.4 17.2 Z" fill="#fff" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/></svg>'
  const HAND = '<svg width="30" height="30" viewBox="-1 -1 26 26"><path d="M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z" fill="#fff" stroke="#111" stroke-width="1.3" stroke-linejoin="round"/></svg>'
  const st = document.createElement('style')
  st.textContent = `
    #rec-cursor{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45));will-change:transform}
    #rec-ring{position:fixed;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #ffd45a;background:rgba(255,212,90,.25);z-index:2147483646;pointer-events:none;opacity:0}
    .demo-badge{display:none!important}`
  document.head.appendChild(st)
  const el = document.createElement('div')
  el.id = 'rec-cursor'
  const ring = document.createElement('div')
  ring.id = 'rec-ring'
  document.body.append(ring, el)
  let kind = ''
  let downAt = -1e9
  let ringAt = [0, 0]
  window.__cursor = {
    down(x, y) {
      downAt = window.__vt.now()
      ringAt = [x, y]
    },
    render(x, y, show, hand) {
      const grab = !!hand
      const k = grab ? 'hand' : 'arrow'
      if (k !== kind) {
        el.innerHTML = grab ? HAND : ARROW
        kind = k
      }
      el.style.display = show ? 'block' : 'none'
      // arrow tip / middle of the hand on the pointer
      el.style.transform = grab ? `translate(${x - 14}px, ${y - 12}px)` : `translate(${x - 3}px, ${y - 2}px)`
      const t = (window.__vt.now() - downAt) / 420
      if (t >= 0 && t < 1) {
        ring.style.opacity = String(0.9 * (1 - t))
        ring.style.transform = `translate(${ringAt[0]}px, ${ringAt[1]}px) scale(${0.35 + t * 0.9})`
      } else ring.style.opacity = '0'
    },
  }
})()
