import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import ErrorBoundary from './ui/ErrorBoundary.jsx'
import './styles.css'
import { prefetchBommais } from './lib/store.js'
import { EMBEDDED } from './lib/device.js'

function start() {
  // ask for the Bommais now, while the 3D scene is still loading
  prefetchBommais()

  createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
      <App />
      <Analytics />
    </ErrorBoundary>,
  )
}

// Inside another page's frame (a portfolio, say) the Golu waits until the frame is nearly in view
// before it builds anything, so a Golu further down the page doesn't slow the page above it.
if (EMBEDDED && 'IntersectionObserver' in window) {
  const watch = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      watch.disconnect()
      start()
    },
    { rootMargin: '300px' },
  )
  watch.observe(document.getElementById('root'))
} else {
  start()
}
