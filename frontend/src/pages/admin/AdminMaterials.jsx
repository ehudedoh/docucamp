import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Check, X, Trash2, Clock, CheckCircle2, XCircle, Package
} from 'lucide-react'
import {
  listPendingMaterials, listAllMaterials,
  setMaterialStatus, deleteAdminMaterial
} from '../../services/admin.js'
import Spinner from '../../components/ui/Spinner.jsx'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import { formatDate, formatPrice } from '../../utils/formatters.js'

const TABS = [
  { key: 'PENDING', label: 'En attente', icon: Clock },
  { key: 'PUBLISHED', label: 'Publiées', icon: CheckCircle2 },
  { key: 'REJECTED', label: 'Refusées', icon: XCircle },
  { key: '', label: 'Toutes', icon: Package },
]

export default function AdminMaterials() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') || 'PENDING'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = () => {
    setLoading(true); setError(null)
    const fetcher = status === 'PENDING'
      ? listPendingMaterials()
      : listAllMaterials({ status, page })

    fetcher
      .then((r) => {
        if (Array.isArray(r.data)) {
          setItems(r.data); setTotalPages(1)
        } else {
          setItems(r.data.items || []); setTotalPages(r.data.total_pages || 1)
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

  const approve = async (id) => { await setMaterialStatus(id, 'PUBLISHED'); load() }
  const reject = async (id) => {
    if (!confirm('Refuser cette annonce ?')) return
    await setMaterialStatus(id, 'REJECTED'); load()
  }
  const remove = async (id) => {
    if (!confirm('Supprimer définitivement cette annonce ?')) return
    await deleteAdminMaterial(id); load()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Annonces</h1>
      <p className="text-sm text-slate-500 mb-6">Modération de la bourse au matériel.</p>

      <div className="flex flex-wrap gap-1 mb-6 border-b border-slate-200">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = t.key === status
          return (
            <button key={t.key || 'all'} onClick={() => changeTab(t.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 inline-flex items-center gap-1 transition-colors ${
                active ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Package} title="Aucune annonce"
          message={status === 'PENDING' ? 'Aucune annonce en attente.' : 'Aucune annonce dans cette catégorie.'} />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((m) => {
              const img = m.images?.[0]?.image_url
              return (
                <div key={m.id} className="card p-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    {img && (
                      <img src={img} alt={m.title}
                        className="w-full md:w-24 h-24 object-cover rounded-lg bg-slate-100 shrink-0" loading="lazy" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-slate-900 truncate">{m.title}</h3>
                        <Badge status={m.status} />
                      </div>
                      <p className="text-xs text-slate-500">
                        {m.category} · {m.transaction_type} · {formatPrice(m.price, m.transaction_type)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {m.seller_name && <>Par {m.seller_name} · </>}
                        {formatDate(m.created_at)}
                        {m.institution_name && <> · {m.institution_name}</>}
                      </p>
                      {m.description && (
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2">{m.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.status === 'PENDING' && (
                        <>
                          <button onClick={() => approve(m.id)} className="btn-primary text-xs">
                            <Check size={14} /> Approuver
                          </button>
                          <button onClick={() => reject(m.id)} className="btn-secondary text-xs">
                            <X size={14} /> Refuser
                          </button>
                        </>
                      )}
                      <button onClick={() => remove(m.id)} className="btn-danger text-xs" aria-label="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {status && status !== 'PENDING' && (
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          )}
        </>
      )}
    </div>
  )
}