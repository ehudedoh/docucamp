import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Plus, FileText, SlidersHorizontal, X } from 'lucide-react'
import { listDocuments } from '../../services/documents.js'
import { listInstitutions, listPrograms, listSubjects } from '../../services/institutions.js'
import { useAuth } from '../../context/AuthContext.jsx'
import DocumentCard from '../../components/documents/DocumentCard.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import { RESOURCE_TYPES } from '../../utils/constants.js'

const SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'ANNUAL']
const LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat']

export default function Documents() {
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('search') || '')
  const debounced = useDebounce(query)

  const [filters, setFilters] = useState({
    resource_type: searchParams.get('resource_type') || '',
    institution_id: searchParams.get('institution_id') || '',
    program_id: searchParams.get('program_id') || '',
    subject_id: searchParams.get('subject_id') || '',
    level: searchParams.get('level') || '',
    academic_year: searchParams.get('academic_year') || '',
    semester: searchParams.get('semester') || '',
  })

  const [showFilters, setShowFilters] = useState(
    // Ouvre automatiquement si l'URL contient déjà des filtres
    Object.values(filters).some(Boolean)
  )

  const [institutions, setInstitutions] = useState([])
  const [programs, setPrograms] = useState([])
  const [subjects, setSubjects] = useState([])

  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Charge les référentiels
  useEffect(() => {
    listInstitutions().then((r) => setInstitutions(r.data || [])).catch(() => {})
  }, [])

  // Programme dépend de l'établissement
  useEffect(() => {
    if (!filters.institution_id) {
      setPrograms([])
      // Si l'établissement est vidé, on vide aussi le programme/sujet
      if (filters.program_id) updateFilter('program_id', '')
      return
    }
    listPrograms(filters.institution_id)
      .then((r) => setPrograms(r.data || []))
      .catch(() => setPrograms([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.institution_id])

  // Matière dépend du programme
  useEffect(() => {
    if (!filters.program_id) {
      setSubjects([])
      if (filters.subject_id) updateFilter('subject_id', '')
      return
    }
    listSubjects(filters.program_id)
      .then((r) => setSubjects(r.data || []))
      .catch(() => setSubjects([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.program_id])

  // Reset page quand les critères changent
  useEffect(() => {
    setPage(1)
  }, [debounced, filters])

  // Synchronise les filtres actifs dans l'URL (pour partage)
  useEffect(() => {
    const params = {}
    if (debounced) params.search = debounced
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v
    })
    if (page > 1) params.page = String(page)
    setSearchParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, filters, page])

  // Fetch
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const params = { search: debounced, page }
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v
    })

    listDocuments(params)
      .then((r) => {
        if (!cancelled) setData(r.data)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debounced, filters, page])

  const updateFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      // Cascade : vider les dépendants si on change un parent
      if (key === 'institution_id') {
        next.program_id = ''
        next.subject_id = ''
      }
      if (key === 'program_id') {
        next.subject_id = ''
      }
      return next
    })
  }

  const clearFilters = () => {
    setFilters({
      resource_type: '',
      institution_id: '',
      program_id: '',
      subject_id: '',
      level: '',
      academic_year: '',
      semester: '',
    })
    setQuery('')
    setPage(1)
    setSearchParams({}, { replace: true })
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length
  const items = data?.items || []
  const totalPages = data?.total_pages || 1

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500">
            Cours, examens, corrections et fiches.
            {data?.total != null && !loading && (
              <span className="ml-1">— {data.total} résultat{data.total > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        {isAuthenticated && (
          <Link to="/documents/upload" className="btn-primary text-sm">
            <Plus size={16} /> Publier
          </Link>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par titre, matière, mots-clés..."
          className="input pl-10"
          aria-label="Rechercher des documents"
        />
      </div>

      {/* Toggle filtres */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className="btn-secondary text-sm"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={16} />
          Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
          >
            <X size={14} /> Effacer les filtres
          </button>
        )}
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="card p-4 mb-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Type de document</label>
            <select
              value={filters.resource_type}
              onChange={(e) => updateFilter('resource_type', e.target.value)}
              className="input"
            >
              <option value="">Tous les types</option>
              {RESOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Établissement</label>
            <select
              value={filters.institution_id}
              onChange={(e) => updateFilter('institution_id', e.target.value)}
              className="input"
            >
              <option value="">Tous</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Filière / Programme</label>
            <select
              value={filters.program_id}
              onChange={(e) => updateFilter('program_id', e.target.value)}
              className="input"
              disabled={!filters.institution_id}
            >
              <option value="">
                {filters.institution_id ? 'Toutes' : '— Choisir un établissement —'}
              </option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Matière</label>
            <select
              value={filters.subject_id}
              onChange={(e) => updateFilter('subject_id', e.target.value)}
              className="input"
              disabled={!filters.program_id}
            >
              <option value="">
                {filters.program_id ? 'Toutes' : '— Choisir une filière —'}
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Niveau</label>
            <select
              value={filters.level}
              onChange={(e) => updateFilter('level', e.target.value)}
              className="input"
            >
              <option value="">Tous</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Semestre</label>
            <select
              value={filters.semester}
              onChange={(e) => updateFilter('semester', e.target.value)}
              className="input"
            >
              <option value="">Tous</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Année académique</label>
            <input
              type="text"
              value={filters.academic_year}
              onChange={(e) => updateFilter('academic_year', e.target.value)}
              className="input"
              placeholder="2024-2025"
              pattern="\d{4}(-\d{4})?"
            />
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Résultats */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40" count={6} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun document trouvé"
          message="Essayez de modifier votre recherche ou d'élargir vos filtres."
          action={
            activeFiltersCount > 0 ? (
              <button onClick={clearFilters} className="btn-secondary text-sm">
                Réinitialiser les filtres
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((d) => (
              <DocumentCard key={d.id} doc={d} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}