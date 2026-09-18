import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { apiFetch } from '../services/api.js'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    institution_id: '',
    program_id: '',
    level: '',
  })
  const [institutions, setInstitutions] = useState([])
  const [programs, setPrograms] = useState([])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    apiFetch('/institutions')
      .then((res) => setInstitutions(res.data || []))
      .catch(() => setInstitutions([]))
  }, [])

  useEffect(() => {
    if (!form.institution_id) {
      setPrograms([])
      return
    }
    apiFetch(`/programs?institution_id=${form.institution_id}`)
      .then((res) => setPrograms(res.data || []))
      .catch(() => setPrograms([]))
  }, [form.institution_id])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setError(null)

    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setSubmitting(true)
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Inscription impossible.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Créer un compte</h1>
      <p className="text-slate-600 mb-6">Rejoignez la communauté DocuCamp.</p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="full_name" className="label">Nom complet</label>
          <input id="full_name" name="full_name" required value={form.full_name}
            onChange={onChange} className="input" placeholder="Prénom Nom" />
        </div>

        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required
            value={form.email} onChange={onChange} className="input" placeholder="vous@exemple.com" />
        </div>

        <div>
          <label htmlFor="password" className="label">Mot de passe</label>
          <input id="password" name="password" type="password" autoComplete="new-password"
            required minLength={8} value={form.password} onChange={onChange}
            className="input" placeholder="Au moins 8 caractères" />
        </div>

        <div>
          <label htmlFor="phone" className="label">Numéro WhatsApp</label>
          <input id="phone" name="phone" required value={form.phone}
            onChange={onChange} className="input" placeholder="+221 77 000 00 00" />
        </div>

        <div>
          <label htmlFor="institution_id" className="label">Établissement</label>
          <select id="institution_id" name="institution_id" value={form.institution_id}
            onChange={onChange} className="input">
            <option value="">— Sélectionner —</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="program_id" className="label">Filière / Programme</label>
          <select id="program_id" name="program_id" value={form.program_id}
            onChange={onChange} className="input" disabled={!form.institution_id}>
            <option value="">— Sélectionner —</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="level" className="label">Niveau</label>
          <select id="level" name="level" value={form.level} onChange={onChange} className="input">
            <option value="">— Sélectionner —</option>
            {['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600 text-center">
        Déjà inscrit ?{' '}
        <Link to="/login" className="text-brand-600 hover:underline font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  )
}