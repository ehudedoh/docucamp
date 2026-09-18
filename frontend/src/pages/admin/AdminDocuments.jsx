import { useEffect, useState } from 'react'
import { listPendingDocuments, setDocumentStatus, deleteAdminDocument } from '../../services/admin.js'
import Spinner from '../../components/ui/Spinner.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { Check, X, Trash2 } from 'lucide-react'

export default function AdminDocuments() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    listPendingDocuments()
      .then((r) => setItems(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const approve = async (id) => {
    await setDocumentStatus(id, 'PUBLISHED'); load()
  }
  const reject = async (id) => {
    await setDocumentStatus(id, 'REJECTED'); load()
  }
  const remove = async (id) => {
    if (!confirm('Supprimer ce document ?')) return
    await deleteAdminDocument(id); load()
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner size={32} /></div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Documents en attente</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {items.length === 0 ? (
        <p className="text-slate-500">Aucun document en attente.</p>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <div key={d.id} className="card p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">{d.title}</p>
                <p className="text-xs text-slate-500">{d.resource_type} · {d.level} · {d.academic_year}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge status={d.status} />
                <button onClick={() => approve(d.id)} className="btn-primary text-xs"><Check size={14} /> Approuver</button>
                <button onClick={() => reject(d.id)} className="btn-secondary text-xs"><X size={14} /> Refuser</button>
                <button onClick={() => remove(d.id)} className="btn-danger text-xs"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}