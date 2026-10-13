import { Component } from 'react'

// If anything below throws while rendering, show a way back instead of a blank page.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[golu] crashed', error, info?.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="crash" role="alert">
        <div className="crash-card">
          <span className="brand-mark" aria-hidden>
            ❋
          </span>
          <h2>Something went wrong</h2>
          <p>The Golu tripped over a step. Reloading usually fixes it.</p>
          <button className="btn-primary" onClick={() => location.reload()}>
            Reload the Golu
          </button>
          <details>
            <summary>Details</summary>
            <code>{String(error?.message || error)}</code>
          </details>
        </div>
      </div>
    )
  }
}
