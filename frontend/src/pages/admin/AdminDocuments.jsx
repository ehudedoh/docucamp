import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Check, X, Trash2, ExternalLink, Clock, CheckCircle2, XCircle, FileText
} from 'lucide-react'
import {
  listPendingDocuments, listAllDocuments,
  setDocumentStatus, deleteAdminDocument
} from '../../services/admin.js'
import Spinner from '../../components/ui/Spinner.jsx'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import { formatDate, formatFileSize } from '../../utils/formatters.js'

const TABS = [
  { key: 'PENDING', label: 'En attente', icon: Clock },
  { key: 'PUBLISHED', label: 'Publiés', icon: CheckCircle2 },
  { key: 'REJECTED', label: 'Refusés', icon: XCircle },
  { key: '', label: 'Tous', icon: FileText },
]

export default function AdminDocuments() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') || 'PENDING'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = () => {
    setLoading(true)
    setError(null)
    const fetcher = status === 'PENDING'
      ? listPendingDocuments()
      : listAllDocuments({ status, page })

    fetcher
      .then((r) => {
        // pending renvoie un tableau, all renvoie {items, total_pages}
        if (Array.isArray(r.data)) {
          setItems(r.data)
          setTotalPages(1)
        } else {
          setItems(r.data.items || [])
          setTotalPages(r.data.total_pages || 1)
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [status, page])

  const changeTab = (key) => {
    setPage(1)
    if (key) setSearchParams({ status: key })
    else setSearchParams({})
  }

  const approve = async (id) => { await setDocumentStatus(id, 'PUBLISHED'); load() }
  const reject = async (id) => {
    const reason = window.prompt('Motif du refus (obligatoire) :')
    if (!reason || !reason.trim()) return
    await setDocumentStatusWithReason(id, 'REJECTED', reason.trim())
    load()
  }
  const remove = async (id) => {
    if (!confirm('Supprimer définitivement ce document ?')) return
    await deleteAdminDocument(id); load()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Documents</h1>
      <p className="text-sm text-slate-500 mb-6">Modération des ressources académiques.</p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-slate-200">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = t.key === status
          return (
            <button
              key={t.key || 'all'}
              onClick={() => changeTab(t.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 inline-flex items-center gap-1 transition-colors ${active
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun document"
          message={
            status === 'PENDING'
              ? 'Aucun document en attente de modération.'
              : 'Aucun document dans cette catégorie.'
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((d) => (
              <div key={d.id} className="card p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-900 truncate">{d.title}</h3>
                      <Badge status={d.status} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {d.resource_type} · {d.level} · {d.academic_year}
                      {d.semester && ` · ${d.semester}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {d.uploader_name && <>Par {d.uploader_name} · </>}
                      {formatDate(d.created_at)}
                      {d.file_size && <> · {formatFileSize(d.file_size)}</>}
                      {d.institution_name && <> · {d.institution_name}</>}
                    </p>
                    {d.description && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">{d.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {d.status === 'PENDING' && (
                      <>
                        <button onClick={() => approve(d.id)} className="btn-primary text-xs">
                          <Check size={14} /> Approuver
                        </button>
                        <button onClick={() => reject(d.id)} className="btn-secondary text-xs">
                          <X size={14} /> Refuser
                        </button>
                      </>
                    )}
                    <button onClick={() => remove(d.id)} className="btn-danger text-xs" aria-label="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {status && status !== 'PENDING' && (
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          )}
        </>
      )}
    </div>
  )
}