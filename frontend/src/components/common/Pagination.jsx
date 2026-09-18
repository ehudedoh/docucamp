import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="btn-secondary text-sm"
        aria-label="Page précédente"
      >
        <ChevronLeft size={16} /> Précédent
      </button>
      <span className="text-sm text-slate-600 px-3">
        Page {page} / {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-secondary text-sm"
        aria-label="Page suivante"
      >
        Suivant <ChevronRight size={16} />
      </button>
    </div>
  )
}