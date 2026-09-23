import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, AlertCircle, X, ImagePlus } from 'lucide-react'
import { createMaterial } from '../../services/materials.js'
import { uploadMaterialImage } from '../../services/uploads.js'
import { listInstitutions } from '../../services/institutions.js'
import {
  MATERIAL_CATEGORIES, TRANSACTION_TYPES, MATERIAL_CONDITIONS
} from '../../utils/constants.js'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import { compressImage } from '../../utils/imageCompression.js'

export default function CreateMaterial() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', category: 'CALCULATOR',
    transaction_type: 'SALE', price: '', rental_period: '',
    condition: 'GOOD', institution_id: ''
  })
  const [images, setImages] = useState([])        // URLs uploadées
  const [uploading, setUploading] = useState(false)
  const [institutions, setInstitutions] = useState([])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { listInstitutions().then((r) => setInstitutions(r.data || [])) }, [])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    const compressed = await compressImage(file, 3, 2000)
    const res = await uploadMaterialImage(compressed)
    if (!files.length) return
    if (images.length + files.length > 5) {
      setError('Maximum 5 images.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const uploaded = []
      for (const file of files) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error(`Format non supporté : ${file.name}`)
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Image trop volumineuse : ${file.name}`)
        }
        const res = await uploadMaterialImage(file)
        uploaded.push({ image_url: res.data.image_url })
      }
      setImages((prev) => [...prev, ...uploaded])
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''  // permet de re-sélectionner le même fichier
    }
  }

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.transaction_type === 'SALE' && (!form.price || Number(form.price) < 0)) {
      setError('Le prix est requis pour une vente.'); return
    }
    if (form.transaction_type === 'RENT' && !form.rental_period) {
      setError('La période de location est requise.'); return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        price: form.price === '' ? null : Number(form.price),
        rental_period: form.transaction_type === 'RENT' ? form.rental_period : null,
        institution_id: form.institution_id || null,
        images,
      }
      await createMaterial(payload)
      navigate('/materials')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isDonation = form.transaction_type === 'DONATION'
  const isRent = form.transaction_type === 'RENT'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Publier une annonce</h1>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <Input label="Titre" name="title" value={form.title} onChange={onChange}
          placeholder="Ex: Calculatrice Casio FX-991" required />

        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea id="description" name="description" rows={3}
            value={form.description} onChange={onChange} className="input"
            placeholder="État, accessoires, raison de la vente..." />
        </div>

        <Select label="Catégorie" name="category" value={form.category}
          onChange={onChange} options={MATERIAL_CATEGORIES} />

        <Select label="Type de transaction" name="transaction_type"
          value={form.transaction_type} onChange={onChange}
          options={TRANSACTION_TYPES} />

        {!isDonation && (
          <Input label="Prix (FCFA)" name="price" type="number" min="0"
            value={form.price} onChange={onChange}
            required={form.transaction_type === 'SALE'} />
        )}

        {isRent && (
          <Input label="Période de location" name="rental_period"
            value={form.rental_period} onChange={onChange}
            placeholder="Ex: par semaine, par mois" required />
        )}

        <Select label="État" name="condition" value={form.condition}
          onChange={onChange} options={MATERIAL_CONDITIONS} />

        <Select label="Établissement" name="institution_id" value={form.institution_id}
          onChange={onChange} placeholder="— Sélectionner —"
          options={institutions.map((i) => ({ value: i.id, label: i.name }))} />

        {/* Upload images */}
        <div>
          <label className="label">Photos (max 5, JPEG/PNG/WEBP, 5 Mo chacune)</label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                <img src={img.image_url} alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                  aria-label="Supprimer">
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-brand-500 transition-colors">
                <input type="file" accept="image/jpeg,image/png,image/webp"
                  multiple onChange={onFileChange} disabled={uploading}
                  className="hidden" />
                {uploading ? (
                  <span className="text-xs text-slate-500">Envoi...</span>
                ) : (
                  <ImagePlus size={22} className="text-slate-400" />
                )}
              </label>
            )}
          </div>
        </div>

        <button type="submit" disabled={submitting || uploading} className="btn-primary">
          <Upload size={18} /> {submitting ? 'Envoi...' : 'Soumettre pour modération'}
        </button>
      </form>
    </div>
  )
}