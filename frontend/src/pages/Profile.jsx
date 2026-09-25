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
  const { refreshProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [institutions, setInstitutions] = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [me, insts] = await Promise.all([getMe(), listInstitutions()])
        setProfile(me.data)
        setInstitutions(insts.data || [])
        if (me.data?.institution_id) {
          const progs = await listPrograms(me.data.institution_id)
          setPrograms(progs.data || [])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onInstitutionChange = async (institutionId) => {
    setProfile((p) => ({ ...p, institution_id: institutionId, program_id: null }))
    if (!institutionId) {
      setPrograms([])
      return
    }
    try {
      const progs = await listPrograms(institutionId)
      setPrograms(progs.data || [])
    } catch {
      setPrograms([])
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)
    try {
      await updateMe({
        full_name: profile.full_name,
        institution_id: profile.institution_id || null,
        program_id: profile.program_id || null,
        semester: profile.semester || null,
      })
      await refreshProfile()
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Mon profil</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/favorites" className="btn-secondary text-sm">Mes favoris</Link>
        <Link to="/history" className="btn-secondary text-sm">Mon activité</Link>
        <Link to="/notifications" className="btn-secondary text-sm">Notifications</Link>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          <CheckCircle size={18} /> Profil mis à jour.
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Nom complet"
          value={profile.full_name || ''}
          onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
        />
        <Select
          label="Établissement"
          value={profile.institution_id || ''}
          onChange={(e) => onInstitutionChange(e.target.value)}
          options={institutions.map((i) => ({ value: i.id, label: i.name }))}
        />
        <Select
          label="Filière"
          value={profile.program_id || ''}
          onChange={(e) => setProfile((p) => ({ ...p, program_id: e.target.value }))}
          options={programs.map((p) => ({ value: p.id, label: p.name }))}
        />
        <Input
          label="Semestre"
          type="number"
          value={profile.semester || ''}
          onChange={(e) => setProfile((p) => ({ ...p, semester: e.target.value }))}
        />
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}