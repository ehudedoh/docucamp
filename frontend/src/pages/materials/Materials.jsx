import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Plus, Package, SlidersHorizontal, X } from 'lucide-react'
import { listMaterials } from '../../services/materials.js'
import { listInstitutions } from '../../services/institutions.js'
import { useAuth } from '../../context/AuthContext.jsx'
import MaterialCard from '../../components/materials/MaterialCard.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import {
  MATERIAL_CATEGORIES, TRANSACTION_TYPES, MATERIAL_CONDITIONS
} from '../../utils/constants.js'

export default function Materials() {
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') || '')
  const debounced = useDebounce(query)
  const [showFilters, setShowFilters] = useState(false)
  const [institutions, setInstitutions] = useState([])

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    transaction_type: searchParams.get('transaction_type') || '',
    condition: searchParams.get('condition') || '',
    institution_id: searchParams.get('institution_id') || '',
    price_min: searchParams.get('price_min') || '',
    price_max: searchParams.get('price_max') || '',
  })
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { listInstitutions().then((r) => setInstitutions(r.data || [])) }, [])

  // Reset page quand les filtres ou la recherche changent
  useEffect(() => { setPage(1) }, [debounced, filters])

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)

    const params = { search: debounced, page }
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })

    listMaterials(params)
      .then((r) => { if (!cancelled) setData(r.data) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [debounced, filters, page])

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      category: '', transaction_type: '', condition: '',
      institution_id: '', price_min: '', price_max: '',
    })
    setSearchParams({})
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length
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

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search" value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher du matériel..."
          className="input pl-10"
        />
      </div>

      {/* Filter toggle */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary text-sm">
          <SlidersHorizontal size={16} />
          Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
        {activeFiltersCount > 0 && (
          <button onClick={clearFilters} className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
            <X size={14} /> Effacer les filtres
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-4 mb-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Catégorie</label>
            <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className="input">
              <option value="">Toutes</option>
              {MATERIAL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Type</label>
            <select value={filters.transaction_type} onChange={(e) => updateFilter('transaction_type', e.target.value)} className="input">
              <option value="">Tous</option>
              {TRANSACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="label">État</label>
            <select value={filters.condition} onChange={(e) => updateFilter('condition', e.target.value)} className="input">
              <option value="">Tous</option>
              {MATERIAL_CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Établissement</label>
            <select value={filters.institution_id} onChange={(e) => updateFilter('institution_id', e.target.value)} className="input">
              <option value="">Tous</option>
              {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Prix min (FCFA)</label>
            <input type="number" min="0" value={filters.price_min}
              onChange={(e) => updateFilter('price_min', e.target.value)} className="input" />
          </div>

          <div>
            <label className="label">Prix max (FCFA)</label>
            <input type="number" min="0" value={filters.price_max}
              onChange={(e) => updateFilter('price_max', e.target.value)} className="input" />
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-56" count={6} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucune annonce trouvée"
          message="Essayez de modifier votre recherche ou vos filtres."
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