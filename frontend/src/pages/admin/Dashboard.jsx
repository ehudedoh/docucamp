import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, FileText, Package, AlertTriangle } from 'lucide-react'
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
    { label: 'Utilisateurs', value: data?.users_count ?? 0, icon: Users, to: null },
    { label: 'Documents', value: data?.documents_count ?? 0, icon: FileText, to: '/admin/documents' },
    { label: 'Documents en attente', value: data?.pending_documents ?? 0, icon: FileText, to: '/admin/documents' },
    { label: 'Annonces', value: data?.materials_count ?? 0, icon: Package, to: '/admin/materials' },
    { label: 'Annonces en attente', value: data?.pending_materials ?? 0, icon: Package, to: '/admin/materials' },
    { label: 'Signalements ouverts', value: data?.open_reports ?? 0, icon: AlertTriangle, to: '/admin/reports' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Tableau de bord</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          const content = (
            <div className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                </div>
              </div>
            </div>
          )
          return s.to ? <Link key={s.label} to={s.to}>{content}</Link> : <div key={s.label}>{content}</div>
        })}
      </div>
    </div>
  )
}