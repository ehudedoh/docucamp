import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getMe, updateMe } from '../services/profiles.js'
import { listInstitutions, listPrograms } from '../services/institutions.js'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function Profile() {
  const { refresh } = useAuth()
  const [form, setForm] = useState(null)
  const [institutions, setInstitutions] = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Promise.all([getMe(), listInstitutions()])
      .then(([me, inst]) => {
        setForm(me.data)
        setInstitutions(inst.data || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!form?.institution_id) { setPrograms([]); return }
    listPrograms(form.institution_id)
      .then((r) => setPrograms(r.data || []))
      .catch(() => setPrograms([]))
  }, [form?.institution_id])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null); setSuccess(false); setSaving(true)
    try {
      await updateMe({
        full_name: form.full_name,
        phone: form.phone,
        institution_id: form.institution_id || null,
        program_id: form.program_id || null,
        level: form.level || null,
      })
      await refresh()
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner size={32} /></div>
  if (!form) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Mon profil</h1>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          <CheckCircle size={18} /> <span>Profil mis à jour.</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/favorites" className="btn-secondary text-sm">Mes favoris</Link>
        <Link to="/history" className="btn-secondary text-sm">Mon activité</Link>
        <Link to="/notifications" className="btn-secondary text-sm">Notifications</Link>
      </div>

      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <Input label="Nom complet" name="full_name" value={form.full_name || ''} onChange={onChange} required />
        <Input label="Email" name="email" value={form.email || ''} disabled />
        <Input label="Numéro WhatsApp" name="phone" value={form.phone || ''} onChange={onChange} required />

        <Select
          label="Établissement"
          name="institution_id"
          value={form.institution_id || ''}
          onChange={onChange}
          placeholder="— Sélectionner —"
          options={institutions.map((i) => ({ value: i.id, label: i.name }))}
        />

        <Select
          label="Filière / Programme"
          name="program_id"
          value={form.program_id || ''}
          onChange={onChange}
          placeholder="— Sélectionner —"
          options={programs.map((p) => ({ value: p.id, label: p.name }))}
          disabled={!form.institution_id}
        />

        <Select
          label="Niveau"
          name="level"
          value={form.level || ''}
          onChange={onChange}
          placeholder="— Sélectionner —"
          options={['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat'].map((l) => ({ value: l, label: l }))}
        />

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}