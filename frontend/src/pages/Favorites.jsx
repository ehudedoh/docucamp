import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { listFavorites } from '../services/favorites.js'
import DocumentCard from '../components/documents/DocumentCard.jsx'
import MaterialCard from '../components/materials/MaterialCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Spinner from '../components/ui/Spinner.jsx'

const TABS = [
  { key: 'RESOURCE', label: 'Documents' },
  { key: 'MATERIAL', label: 'Matériel' },
]

export default function Favorites() {
  const [tab, setTab] = useState('RESOURCE')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listFavorites(tab)
      .then((r) => setItems(r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Mes favoris</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Aucun favori"
          message="Ajoutez des documents ou du matériel à vos favoris pour les retrouver ici."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tab === 'RESOURCE'
            ? items.map((d) => <DocumentCard key={d.id} doc={d} />)
            : items.map((m) => <MaterialCard key={m.id} material={m} />)
          }
        </div>
      )}
    </div>
  )
}