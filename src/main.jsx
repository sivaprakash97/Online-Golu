import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ui/ErrorBoundary.jsx'
import DesktopOnly, { useDesktopGate } from './ui/DesktopOnly.jsx'
import './styles.css'

// Phones get a "best on a computer" screen instead of the 3D Golu (desktop-only for now).
function Root() {
  const { blocked, skip } = useDesktopGate()
  return blocked ? <DesktopOnly onSkip={skip} /> : <App />
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Root />
  </ErrorBoundary>,
)
