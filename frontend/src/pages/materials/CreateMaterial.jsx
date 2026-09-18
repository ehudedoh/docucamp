import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, AlertCircle } from 'lucide-react'
import { createMaterial } from '../../services/materials.js'
import { listInstitutions } from '../../services/institutions.js'
import { MATERIAL_CATEGORIES, TRANSACTION_TYPES, MATERIAL_CONDITIONS } from '../../utils/constants.js'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'

export default function CreateMaterial() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', category: 'CALCULATOR',
    transaction_type: 'SALE', price: '', rental_period: '',
    condition: 'GOOD', institution_id: ''
  })
  const [institutions, setInstitutions] = useState([])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { listInstitutions().then((r) => setInstitutions(r.data || [])) }, [])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.price && Number(form.price) < 0) { setError('Prix invalide.'); return }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        price: form.price === '' ? null : Number(form.price),
        rental_period: form.transaction_type === 'RENT' ? form.rental_period : null,
      }
      await createMaterial(payload)
      navigate('/materials')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Publier une annonce</h1>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <Input label="Titre" name="title" value={form.title} onChange={onChange} required />

        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea id="description" name="description" rows={3}
            value={form.description} onChange={onChange} className="input" />
        </div>

        <Select label="Catégorie" name="category" value={form.category} onChange={onChange}
          options={MATERIAL_CATEGORIES} />

        <Select label="Type de transaction" name="transaction_type" value={form.transaction_type}
          onChange={onChange} options={TRANSACTION_TYPES} />

        {form.transaction_type !== 'DONATION' && (
          <Input label="Prix (FCFA)" name="price" type="number" min="0"
            value={form.price} onChange={onChange}
            required={form.transaction_type === 'SALE'} />
        )}

        {form.transaction_type === 'RENT' && (
          <Input label="Période de location" name="rental_period"
            value={form.rental_period} onChange={onChange}
            placeholder="Ex: par semaine" required />
        )}

        <Select label="État" name="condition" value={form.condition}
          onChange={onChange} options={MATERIAL_CONDITIONS} />

        <Select label="Établissement" name="institution_id" value={form.institution_id}
          onChange={onChange} placeholder="— Sélectionner —"
          options={institutions.map((i) => ({ value: i.id, label: i.name }))} />

        <button type="submit" disabled={submitting} className="btn-primary">
          <Upload size={18} /> {submitting ? 'Envoi...' : 'Soumettre pour modération'}
        </button>
      </form>
    </div>
  )
}