import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Package } from 'lucide-react'
import { listMaterials } from '../../services/materials.js'
import { useAuth } from '../../context/AuthContext.jsx'
import MaterialCard from '../../components/materials/MaterialCard.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import useDebounce from '../../hooks/useDebounce.js'

export default function Materials() {
  const { isAuthenticated } = useAuth()
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query)
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { setPage(1) }, [debounced])

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    listMaterials({ search: debounced, page })
      .then((r) => { if (!cancelled) setData(r.data) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [debounced, page])

  const items = data?.items || []
  const totalPages = data?.total_pages || 1

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matériel</h1>
          <p className="text-sm text-slate-500">Ventes, locations et dons entre étudiants.</p>
        </div>
        {isAuthenticated && (
          <Link to="/materials/create" className="btn-primary text-sm">
            <Plus size={16} /> Publier une annonce
          </Link>
        )}
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search" value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher du matériel..."
          className="input pl-10"
        />
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-56" count={6} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucune annonce trouvée"
          message="Essayez de modifier votre recherche."
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((m) => <MaterialCard key={m.id} material={m} />)}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}