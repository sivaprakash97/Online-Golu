import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ui/ErrorBoundary.jsx'
import './styles.css'

// Browser extensions and page translators sometimes move or wrap text React put on the page.
// React then fails to remove or insert next to that node and the whole app unmounts.
// Skip those calls instead of crashing (see facebook/react#11538).
if (typeof Node === 'function' && Node.prototype) {
  const removeChild = Node.prototype.removeChild
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      console.warn('[golu] skipped removing a node that something else moved', child)
      return child
    }
    return removeChild.call(this, child)
  }
  const insertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function (node, ref) {
    if (ref && ref.parentNode !== this) {
      console.warn('[golu] skipped inserting before a node that something else moved', ref)
      return node
    }
    return insertBefore.call(this, node, ref)
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary name="app">
    <App />
  </ErrorBoundary>,
)
