import { Component } from 'react'

// Catches render errors so one broken piece never blanks the whole page.
// `fallback` (a node, or a function of the error) replaces the crashed subtree, e.g. null for a
// 3D canvas; leave it out to show a small panel with the error and a "Try again" button.
export default class ErrorBoundary extends Component {
  state = { error: null, where: '' }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    const where = (info?.componentStack || '').trim().split('\n').slice(0, 4).join('\n')
    console.error(`[golu] ${this.props.name || 'app'} crashed:`, error, where)
    this.setState({ where })
    this.props.onError?.(error)
  }

  reset = () => this.setState({ error: null, where: '' })

  render() {
    const { error, where } = this.state
    if (!error) return this.props.children
    const { fallback } = this.props
    if (fallback !== undefined) return typeof fallback === 'function' ? fallback(error) : fallback
    const details = `${error?.name || 'Error'}: ${error?.message || error}\n${where}`
    return (
      <div className="crash" role="alert">
        <div className="crash-card">
          <p className="eyebrow">Something broke</p>
          <h2>That didn't work</h2>
          <p>Your Bommai is safe. Try again, and if this keeps happening, send a screenshot of this box.</p>
          <pre className="crash-details">{details}</pre>
          <div className="crash-actions">
            <button className="btn-primary" onClick={this.reset}>
              Try again
            </button>
            <button className="btn-secondary" onClick={() => location.reload()}>
              Reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
