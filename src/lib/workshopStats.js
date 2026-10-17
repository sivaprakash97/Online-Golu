import { useEffect, useRef } from 'react'
import { trackEvent } from './analytics.js'

// What visitors do in the Bommai workshop, kept in a ref (no re-renders) and sent as events:
//   workshop_category_opened   a tab was opened ({category, via: tab | next, first})
//   workshop_option_changed    a tile or swatch was picked ({category, field, value})
//   workshop_surprise_me       the dice button
//   workshop_preview_touched   first touch on the 3D preview (did they find out it turns?)
//   workshop_dead_click        a click that hit nothing clickable ({area, tag, cls})
//   workshop_submit_clicked    Place / Save / Done, with how long and how much was changed ({untouched})
//   workshop_closed            one summary per visit to the workshop: time, tabs visited and not,
//                              seconds and changes per tab, tabs scrolled, outcome
// Event properties stay flat strings and numbers (Vercel's custom events don't take objects).
const secs = (ms) => Math.round(ms / 1000)
const list = (o) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(',')
const MAX_DEAD_CLICKS = 20 // per visit, so one frustrated tapper can't flood the project

export function useWorkshopStats({ categories, first, editing }) {
  const s = useRef(null)
  if (!s.current) {
    const now = Date.now()
    s.current = { t0: now, since: now, cur: first, visited: new Set([first]), dwell: {}, byCat: {}, changes: 0, scrolled: new Set(), dead: 0, surprise: 0, nameMissing: 0, previewTouched: false, outcome: 'unmounted', sent: false }
  }

  const summary = () => {
    const x = s.current
    const now = Date.now()
    const dwell = { ...x.dwell, [x.cur]: (x.dwell[x.cur] || 0) + now - x.since }
    return {
      editing,
      seconds: secs(now - x.t0),
      changes: x.changes,
      categories_visited: [...x.visited].join(','),
      categories_unvisited: categories.filter((c) => !x.visited.has(c)).join(','),
      changes_by_category: list(x.byCat),
      seconds_by_category: list(Object.fromEntries(Object.entries(dwell).map(([k, v]) => [k, secs(v)]))),
      scrolled_categories: [...x.scrolled].join(','),
      surprise_me: x.surprise,
      preview_touched: x.previewTouched,
      dead_clicks: x.dead,
    }
  }

  const finish = (outcome) => {
    const x = s.current
    if (x.sent) return
    x.sent = true
    trackEvent('workshop_closed', { ...summary(), outcome: outcome || x.outcome })
  }

  // leaving by any route sends the summary once: back button, placing, or closing the tab
  useEffect(() => {
    const onHide = () => finish('left_page')
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      finish()
    }
  }, [])

  return {
    outcome: (o) => (s.current.outcome = o),
    open(category, via) {
      const x = s.current
      const now = Date.now()
      x.dwell[x.cur] = (x.dwell[x.cur] || 0) + now - x.since
      x.since = now
      x.cur = category
      const isFirst = !x.visited.has(category)
      x.visited.add(category)
      trackEvent('workshop_category_opened', { category, via, first: isFirst })
    },
    change(category, patch) {
      const x = s.current
      const field = Object.keys(patch)[0]
      const v = patch[field]
      x.changes++
      x.byCat[category] = (x.byCat[category] || 0) + 1
      trackEvent('workshop_option_changed', { category, field, value: Array.isArray(v) ? v.join('+') : String(v) })
    },
    surprise() {
      s.current.surprise++
      trackEvent('workshop_surprise_me')
    },
    scrolled(category) {
      s.current.scrolled.add(category)
    },
    previewTouched() {
      const x = s.current
      if (x.previewTouched) return
      x.previewTouched = true
      trackEvent('workshop_preview_touched', { seconds: secs(Date.now() - x.t0) })
    },
    deadClick(area, el) {
      const x = s.current
      if (++x.dead > MAX_DEAD_CLICKS) return
      trackEvent('workshop_dead_click', { area, tag: el.tagName.toLowerCase(), cls: String(el.className?.baseVal ?? el.className ?? '').slice(0, 40) })
    },
    nameMissing() {
      s.current.nameMissing++
    },
    submit(step) {
      const x = s.current
      const { seconds, changes } = summary()
      trackEvent('workshop_submit_clicked', { step, seconds, changes, untouched: changes === 0, name_missing: x.nameMissing })
    },
  }
}
