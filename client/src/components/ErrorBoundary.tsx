import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In a real deployment, ship this to an error-tracking service (Sentry, etc.)
    // instead of just the console.
    console.error('[ErrorBoundary] caught render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-base)] px-6 text-center">
          <p className="font-display text-xl text-[var(--color-ink)]">Something went wrong.</p>
          <p className="max-w-sm text-sm text-[var(--color-muted)]">
            The app hit an unexpected error rendering this page. Reloading usually fixes it — if it keeps
            happening, this is worth reporting.
          </p>
          <button
            onClick={() => {
              this.setState({ error: null })
              window.location.assign('/')
            }}
            className="rounded-lg bg-[var(--color-signal)] px-5 py-2.5 font-display text-sm font-semibold text-[var(--color-base)]"
          >
            Back to home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
