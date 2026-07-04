import { Component, type ReactNode } from 'react'

/**
 * If WebGL dies (context loss, driver crash, effect failure) the DOM site
 * must survive — render a static ink backdrop instead of unmounting the app.
 */
export default class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return <div className="fixed inset-0 z-0 bg-ink" aria-hidden="true" />
    }
    return this.props.children
  }
}
