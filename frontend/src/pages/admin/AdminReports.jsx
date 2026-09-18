import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, FileText, Package, CheckCircle, XCircle, Eye } from 'lucide-react'
import { listReports, setReportStatus } from '../../services/admin.js'
import Spinner from '../../components/ui/Spinner.jsx'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { formatDate } from '../../utils/formatters.js'

const REASON_LABELS = {
  INAPPROPRIATE: 'Contenu inapproprié',
  SPAM: 'Spam',
  FRAUD: 'Fraude suspectée',
  INCORRECT: 'Document incorrect',
  ILLEGAL: 'Contenu illégal',
  MISLEADING: 'Annonce trompeuse',
  OTHER: 'Autre',
}

export default function AdminReports() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('OPEN')

  const load = () => {
    setLoading(true); setError(null)
    const params = filter ? { status: filter } : {}
    listReports(params)
      .then((r) => setItems(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filter])

  const updateStatus = async (id, status) => {
    try {
      await setReportStatus(id, status)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Signalements</h1>
      <p className="text-sm text-slate-500 mb-6">Traitement des contenus signalés.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'OPEN', label: 'Ouverts' },
          { key: 'IN_REVIEW', label: 'En cours' },
          { key: 'RESOLVED', label: 'Résolus' },
          { key: 'REJECTED', label: 'Rejetés' },
          { key: '', label: 'Tous' },
        ].map((f) => (
          <button key={f.key || 'all'} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Aucun signalement"
          message="Aucun signalement dans cette catégorie." />
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const isResource = !!r.resource_id
            const title = isResource ? r.resource_title : r.material_title
            const link = isResource ? `/documents/${r.resource_id}` : `/materials/${r.material_id}`
            return (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {isResource ? <FileText size={16} className="text-slate-400" /> : <Package size={16} className="text-slate-400" />}
                    <span className="font-medium text-slate-900">{REASON_LABELS[r.reason] || r.reason}</span>
                  </div>
                  <Badge status={r.status} />
                </div>

                {title && (
                  <p className="text-sm text-slate-700 mb-1">
                    Cible : <Link to={link} className="text-brand-600 hover:underline">{title}</Link>
                  </p>
                )}

                {r.description && (
                  <p className="text-sm text-slate-600 mb-2 whitespace-pre-line">{r.description}</p>
                )}

                <p className="text-xs text-slate-500 mb-3">
                  Signalé par {r.reporter_name || '—'}
                  {r.reporter_email && ` (${r.reporter_email})`}
                  {' · '}{formatDate(r.created_at)}
                </p>

                <div className="flex flex-wrap gap-2">
                  {r.status !== 'IN_REVIEW' && (
                    <button onClick={() => updateStatus(r.id, 'IN_REVIEW')} className="btn-secondary text-xs">
                      <Eye size={14} /> En cours
                    </button>
                  )}
                  {r.status !== 'RESOLVED' && (
                    <button onClick={() => updateStatus(r.id, 'RESOLVED')} className="btn-primary text-xs">
                      <CheckCircle size={14} /> Résoudre
                    </button>
                  )}
                  {r.status !== 'REJECTED' && (
                    <button onClick={() => updateStatus(r.id, 'REJECTED')} className="btn-secondary text-xs">
                      <XCircle size={14} /> Rejeter
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}