import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import ErrorBoundary from './ui/ErrorBoundary.jsx'
import './styles.css'
import { armMusic } from './lib/music.js'
import { prefetchBommais } from './lib/store.js'

// background music starts on the first click, tap or key press
armMusic()

// ask for the Bommais now, while the 3D scene is still loading
prefetchBommais()

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
    <Analytics />
  </ErrorBoundary>,
)
