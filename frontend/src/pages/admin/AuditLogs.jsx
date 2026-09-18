import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { listAudit } from '../../services/admin.js'
import Spinner from '../../components/ui/Spinner.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import { formatDate } from '../../utils/formatters.js'

export default function AuditLogs() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true); setError(null)
    listAudit({ page, page_size: 50 })
      .then((r) => {
        setItems(r.data.items || [])
        setTotalPages(r.data.total_pages || 1)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Journal d'audit</h1>
      <p className="text-sm text-slate-500 mb-6">Historique des actions d'administration.</p>

      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={ScrollText} title="Aucune action enregistrée" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Admin</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 font-medium">Cible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-2">{log.admin_name || log.admin_email || '—'}</td>
                    <td className="px-4 py-2"><span className="font-mono text-xs">{log.action}</span></td>
                    <td className="px-4 py-2 text-slate-500 text-xs">
                      {log.target_type} <span className="font-mono">{log.target_id?.slice(0, 8)}…</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}