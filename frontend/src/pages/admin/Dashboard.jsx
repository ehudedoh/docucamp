import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, FileText, Package, AlertTriangle,
  Clock, CheckCircle2, ScrollText
} from 'lucide-react'
import { getDashboard } from '../../services/admin.js'
import Spinner from '../../components/ui/Spinner.jsx'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getDashboard()
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-24"><Spinner size={32} /></div>
  if (error) return <div className="max-w-6xl mx-auto px-4 py-12 text-red-600">{error}</div>

  const stats = [
    { label: 'Utilisateurs', value: data?.users_count ?? 0, icon: Users, color: 'bg-slate-100 text-slate-700', to: null },
    { label: 'Documents publiés', value: data?.published_documents ?? 0, icon: CheckCircle2, color: 'bg-green-100 text-green-700', to: '/admin/documents?status=PUBLISHED' },
    { label: 'Documents en attente', value: data?.pending_documents ?? 0, icon: Clock, color: 'bg-amber-100 text-amber-700', to: '/admin/documents?status=PENDING' },
    { label: 'Annonces publiées', value: data?.published_materials ?? 0, icon: Package, color: 'bg-green-100 text-green-700', to: '/admin/materials?status=PUBLISHED' },
    { label: 'Annonces en attente', value: data?.pending_materials ?? 0, icon: Clock, color: 'bg-amber-100 text-amber-700', to: '/admin/materials?status=PENDING' },
    { label: 'Signalements ouverts', value: data?.open_reports ?? 0, icon: AlertTriangle, color: 'bg-red-100 text-red-700', to: '/admin/reports' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-sm text-slate-500">Vue d'ensemble de la modération.</p>
        </div>
        <Link to="/admin/audit" className="btn-secondary text-sm">
          <ScrollText size={16} /> Journal d'audit
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          const inner = (
            <div className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                </div>
              </div>
            </div>
          )
          return s.to
            ? <Link key={s.label} to={s.to}>{inner}</Link>
            : <div key={s.label}>{inner}</div>
        })}
      </div>
    </div>
  )
}