import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ui/ErrorBoundary.jsx'
import './styles.css'
import { armMusic } from './lib/music.js'
import { Analytics } from '@vercel/analytics/react'
import { beforeSend } from './lib/analytics.js'

// background music starts on the first click, tap or key press
armMusic()

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
    <Analytics beforeSend={beforeSend} />
  </ErrorBoundary>,
)
