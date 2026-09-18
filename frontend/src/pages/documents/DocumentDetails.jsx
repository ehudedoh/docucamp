import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Download, FileText, Calendar, User, Building2 } from 'lucide-react'
import { getDocument, downloadDocument } from '../../services/documents.js'
import { formatDate, formatFileSize } from '../../utils/formatters.js'
import Spinner from '../../components/ui/Spinner.jsx'
import Badge from '../../components/ui/Badge.jsx'

export default function DocumentDetails() {
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getDocument(id)
      .then((r) => setDoc(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const onDownload = async () => {
    try {
      const r = await downloadDocument(id)
      if (r.data?.url) window.open(r.data.url, '_blank')
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner size={32} /></div>
  if (error) return <div className="max-w-3xl mx-auto px-4 py-12 text-red-600">{error}</div>
  if (!doc) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/documents" className="text-sm text-brand-600 hover:underline mb-4 inline-block">
        ← Retour aux documents
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-2xl font-bold text-slate-900">{doc.title}</h1>
          <Badge status={doc.status} />
        </div>

        {doc.description && <p className="text-slate-600 mb-6">{doc.description}</p>}

        <dl className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div><dt className="text-slate-500">Type</dt><dd className="font-medium">{doc.resource_type}</dd></div>
          <div><dt className="text-slate-500">Matière</dt><dd className="font-medium">{doc.subject_name || '—'}</dd></div>
          <div><dt className="text-slate-500">Niveau</dt><dd className="font-medium">{doc.level}</dd></div>
          <div><dt className="text-slate-500">Année</dt><dd className="font-medium">{doc.academic_year}</dd></div>
          <div><dt className="text-slate-500">Semestre</dt><dd className="font-medium">{doc.semester || '—'}</dd></div>
          <div><dt className="text-slate-500">Taille</dt><dd className="font-medium">{formatFileSize(doc.file_size)}</dd></div>
          <div><dt className="text-slate-500">Téléchargements</dt><dd className="font-medium">{doc.download_count}</dd></div>
          <div><dt className="text-slate-500">Publié le</dt><dd className="font-medium">{formatDate(doc.created_at)}</dd></div>
        </dl>

        <button onClick={onDownload} className="btn-primary" disabled={doc.status !== 'PUBLISHED'}>
          <Download size={18} /> Télécharger
        </button>
      </div>
    </div>
  )
}