import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-slate-300 mb-2">404</h1>
      <p className="text-slate-600 mb-6">Cette page n'existe pas.</p>
      <Link to="/" className="btn-primary">Retour à l'accueil</Link>
    </div>
  )
}