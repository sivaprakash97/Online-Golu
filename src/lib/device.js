import { useEffect, useState } from 'react'

// Phone-sized screens, either way up. They get a lighter render.
export const SMALL_SCREEN = '(max-width: 899px), (max-height: 499px)'
// Upright screens (a phone held in portrait): the workshop stacks into one column, naming becomes
// its own step, and placing zooms in on the steps. Anything under 560px wide counts too, so the
// layout holds when a phone keyboard squashes the page. Keep in step with the media queries in styles.css.
export const PORTRAIT_ASPECT = 4 / 5
export const PORTRAIT = '(max-aspect-ratio: 4/5), (max-width: 559px)'
export const TOUCH = '(pointer: coarse)'

const matches = (query) => window.matchMedia(query).matches

// Phones have 3x screens; drawing the 3D at full density there makes them slow and hot.
export const MAX_DPR = matches(SMALL_SCREEN) ? 1.5 : 2

export function useMedia(query) {
  const [on, setOn] = useState(() => matches(query))
  useEffect(() => {
    const mq = window.matchMedia(query)
    const change = () => setOn(mq.matches)
    change()
    mq.addEventListener('change', change)
    return () => mq.removeEventListener('change', change)
  }, [query])
  return on
}
