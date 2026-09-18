import { Link } from 'react-router-dom'
import { FileText, Download } from 'lucide-react'
import { formatDate, formatFileSize } from '../../utils/formatters.js'
import Badge from '../ui/Badge.jsx'

export default function DocumentCard({ doc }) {
  return (
    <Link to={`/documents/${doc.id}`} className="card p-4 hover:shadow-md transition-shadow block">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
          <FileText size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-slate-900 line-clamp-2">{doc.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{doc.resource_type} · {doc.level}</p>
        </div>
      </div>
      {doc.subject_name && (
        <p className="text-sm text-slate-600 mb-2">{doc.subject_name}</p>
      )}
      <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
        <span>{formatDate(doc.created_at)}</span>
        <span className="inline-flex items-center gap-1">
          <Download size={12} /> {doc.download_count}
        </span>
      </div>
      {doc.status !== 'PUBLISHED' && (
        <div className="mt-2"><Badge status={doc.status} /></div>
      )}
    </Link>
  )
}