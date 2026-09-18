import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Une erreur est survenue</h1>
          <p className="text-sm text-slate-600 mb-6">
            Rechargez la page ou revenez à l'accueil.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Recharger
          </button>
        </div>
      )
    }
    return this.props.children
  }
}