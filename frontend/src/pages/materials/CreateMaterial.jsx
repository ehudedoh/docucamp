import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, AlertCircle, X, ImagePlus, Loader2 } from 'lucide-react'
import { createMaterial } from '../../services/materials.js'
import { uploadMaterialImage } from '../../services/uploads.js'
import { listInstitutions } from '../../services/institutions.js'
import {
  MATERIAL_CATEGORIES, TRANSACTION_TYPES, MATERIAL_CONDITIONS
} from '../../utils/constants.js'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import { compressImage } from '../../utils/imageCompression.js'

const MAX_IMAGES = 5
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function CreateMaterial() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', category: 'CALCULATOR',
    transaction_type: 'SALE', price: '', rental_period: '',
    condition: 'GOOD', institution_id: ''
  })
  // Chaque image : { id, preview, status: 'processing'|'uploading'|'done'|'error',
  //                  progress, image_url, error }
  const [images, setImages] = useState([])
  const imagesRef = useRef([])
  imagesRef.current = images
  const [institutions, setInstitutions] = useState([])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { listInstitutions().then((r) => setInstitutions(r.data || [])) }, [])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Libère les aperçus (URL.createObjectURL) au démontage de la page
  useEffect(() => () => {
    imagesRef.current.forEach((i) => i.preview && URL.revokeObjectURL(i.preview))
  }, [])

  const patchImage = (id, patch) =>
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))

  const processImage = async (id, original) => {
    try {
      // 1. Compression (ne bloque jamais : renvoie l'original en cas de souci)
      const file = await compressImage(original, 3, 2000)
      if (file.size > MAX_IMAGE_BYTES) {
        throw new Error('Image trop volumineuse (max 5 Mo).')
      }

      // 2. Envoi avec progression
      patchImage(id, { status: 'uploading', progress: 0 })
      const res = await uploadMaterialImage(file, {
        onProgress: ({ percent }) => patchImage(id, { progress: percent }),
      })
      const image_url = res?.data?.image_url
      if (!image_url) throw new Error("Réponse invalide du serveur.")
      patchImage(id, { status: 'done', progress: 100, image_url })
    } catch (err) {
      patchImage(id, { status: 'error', error: err.message || "Échec de l'envoi." })
    }
  }

  const onFileChange = (e) => {
    const files = Array.from(e.target.files || [])   // copie AVANT de vider l'input
    e.target.value = ''                               // permet de re-sélectionner le même fichier
    if (!files.length) return
    setError(null)

    const slots = MAX_IMAGES - imagesRef.current.length
    if (slots <= 0) { setError(`Maximum ${MAX_IMAGES} images.`); return }

    const problems = []
    if (files.length > slots) {
      problems.push(`Maximum ${MAX_IMAGES} images : seules ${slots} photo(s) ont été ajoutées.`)
    }

    const accepted = []
    for (const file of files.slice(0, slots)) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        problems.push(`Format non supporté : ${file.name} (JPEG, PNG ou WEBP).`)
        continue
      }
      accepted.push(file)
    }
    if (problems.length) setError(problems.join(' '))
    if (!accepted.length) return

    // Aperçu IMMÉDIAT (avant même la fin de l'envoi)
    const newItems = accepted.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      preview: URL.createObjectURL(file),
      status: 'processing',
      progress: 0,
      image_url: null,
      error: null,
    }))
    setImages((prev) => [...prev, ...newItems])

    // Envois en parallèle (max 5 images, donc raisonnable)
    newItems.forEach((it, i) => processImage(it.id, accepted[i]))
  }

  const removeImage = (id) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target?.preview) URL.revokeObjectURL(target.preview)
      return prev.filter((i) => i.id !== id)
    })
  }

  const uploading = images.some((i) => i.status === 'processing' || i.status === 'uploading')
  const failedCount = images.filter((i) => i.status === 'error').length

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.transaction_type === 'SALE' && (!form.price || Number(form.price) < 0)) {
      setError('Le prix est requis pour une vente.'); return
    }
    if (form.transaction_type === 'RENT' && !form.rental_period) {
      setError('La période de location est requise.'); return
    }

    if (uploading) { setError("Patientez, l'envoi des photos est en cours."); return }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        price: form.price === '' ? null : Number(form.price),
        rental_period: form.transaction_type === 'RENT' ? form.rental_period : null,
        institution_id: form.institution_id || null,
        images: images
          .filter((i) => i.status === 'done')
          .map((i) => ({ image_url: i.image_url })),
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
              <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                <img src={img.preview} alt={`Photo ${idx + 1}`}
                  className={`w-full h-full object-cover ${img.status === 'error' ? 'opacity-40' : ''}`} />

                {(img.status === 'processing' || img.status === 'uploading') && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1.5">
                    <div className="flex items-center gap-1 text-[11px] text-white mb-1">
                      <Loader2 size={11} className="animate-spin" />
                      {img.status === 'processing' ? 'Optimisation…' : `${img.progress}%`}
                    </div>
                    <div className="h-1 rounded-full bg-white/30 overflow-hidden">
                      <div className="h-full bg-white transition-[width] duration-150"
                        style={{ width: `${img.status === 'processing' ? 5 : img.progress}%` }} />
                    </div>
                  </div>
                )}

                {img.status === 'error' && (
                  <div className="absolute inset-0 flex items-center justify-center p-2 text-center text-[11px] font-medium text-red-700">
                    {img.error}
                  </div>
                )}

                <button type="button" onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                  aria-label="Supprimer">
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-brand-500 transition-colors">
                <input type="file" accept="image/jpeg,image/png,image/webp"
                  multiple onChange={onFileChange}
                  className="hidden" />
                <ImagePlus size={22} className="text-slate-400" />
              </label>
            )}
          </div>
          {failedCount > 0 && (
            <p className="text-xs text-red-600">
              {failedCount} photo(s) n&apos;ont pas pu être envoyées : supprimez-les (✕) et réessayez.
            </p>
          )}
          {uploading && (
            <p className="text-xs text-slate-500">Envoi des photos en cours, veuillez patienter…</p>
          )}
        </div>

        <button type="submit" disabled={submitting || uploading} className="btn-primary">
          <Upload size={18} />
          {submitting ? 'Envoi...' : uploading ? 'Envoi des photos…' : 'Soumettre pour modération'}
        </button>
      </form>
    </div>
  )
}