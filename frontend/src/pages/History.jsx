import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Upload, History as HistoryIcon } from 'lucide-react'
import { myDownloads, myUploaded } from '../services/documents.js'
import Spinner from '../components/ui/Spinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Badge from '../components/ui/Badge.jsx'
import { formatDate } from '../utils/formatters.js'

const TABS = [
  { key: 'downloads', label: 'Téléchargements', icon: Download },
  { key: 'uploads', label: 'Mes publications', icon: Upload },
]

export default function History() {
  const [tab, setTab] = useState('downloads')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const fn = tab === 'downloads' ? myDownloads : myUploaded
    fn()
      .then((r) => setItems(r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Mon activité</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1 transition-colors ${
                tab === t.key ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title={tab === 'downloads' ? 'Aucun téléchargement' : 'Aucune publication'}
          message={tab === 'downloads'
            ? 'Les documents que vous téléchargez apparaîtront ici.'
            : 'Vos documents publiés apparaîtront ici.'}
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="card p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Link to={`/documents/${item.id}`} className="font-medium text-slate-900 hover:text-brand-600 truncate block">
                  {item.title}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.resource_type} · {item.level} · {item.academic_year}
                  {item.downloaded_at && <> · téléchargé le {formatDate(item.downloaded_at)}</>}
                  {item.created_at && <> · publié le {formatDate(item.created_at)}</>}
                </p>
              </div>
              <div className="shrink-0">
                {tab === 'uploads' && <Badge status={item.status} />}
                {tab === 'uploads' && (
                  <span className="text-xs text-slate-500 ml-2">
                    <Download size={12} className="inline" /> {item.download_count}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}