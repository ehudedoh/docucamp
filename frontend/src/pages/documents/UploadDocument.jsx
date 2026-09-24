import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, AlertCircle, FileText } from 'lucide-react'
import { createDocument } from '../../services/documents.js'
import { uploadDocument } from '../../services/uploads.js'
import { listInstitutions, listPrograms, listSubjects } from '../../services/institutions.js'
import { RESOURCE_TYPES } from '../../utils/constants.js'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import { formatFileSize } from '../../utils/formatters.js'

export default function UploadDocument() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', resource_type: 'EXAM',
    institution_id: '', program_id: '', subject_id: '',
    level: '', academic_year: new Date().getFullYear().toString(),
    semester: ''
  })
  const [file, setFile] = useState(null)
  const [institutions, setInstitutions] = useState([])
  const [programs, setPrograms] = useState([])
  const [subjects, setSubjects] = useState([])
  const [error, setError] = useState(null)
  const [stage, setStage] = useState('')            // libellé de l'étape en cours
  const [uploadPercent, setUploadPercent] = useState(null)  // null = indéterminé / non démarré
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { listInstitutions().then((r) => setInstitutions(r.data || [])) }, [])
  useEffect(() => {
    if (!form.institution_id) { setPrograms([]); return }
    listPrograms(form.institution_id).then((r) => setPrograms(r.data || []))
  }, [form.institution_id])
  useEffect(() => {
    if (!form.program_id) { setSubjects([]); return }
    listSubjects(form.program_id).then((r) => setSubjects(r.data || []))
  }, [form.program_id])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onPickFile = (e) => {
    const picked = e.target.files?.[0] || null
    setError(null)
    if (!picked) { setFile(null); return }
    // Certains navigateurs mobiles ne renseignent pas le type MIME
    if (!picked.type && /\.pdf$/i.test(picked.name)) {
      setFile(new File([picked], picked.name, { type: 'application/pdf' }))
      return
    }
    setFile(picked)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!file) { setError('Veuillez sélectionner un fichier PDF.'); return }
    if (file.type !== 'application/pdf') { setError('Seuls les PDF sont acceptés.'); return }
    if (file.size > 20 * 1024 * 1024) { setError('Fichier trop volumineux (max 20 Mo).'); return }

    setSubmitting(true)
    setUploadPercent(0)
    try {
      setStage('Envoi du fichier')
      const up = await uploadDocument(file, {
        onProgress: ({ percent }) => {
          setUploadPercent(percent)
          // 100 % envoyé → le serveur enregistre encore le fichier
          if (percent >= 100) setStage('Traitement par le serveur')
        },
      })
      const { file_url, file_name, file_size } = up.data

      setStage('Enregistrement du document')
      setUploadPercent(null)
      await createDocument({
        ...form,
        file_url,
        file_name,
        file_size,
        semester: form.semester || null,
        institution_id: form.institution_id || null,
        program_id: form.program_id || null,
        subject_id: form.subject_id || null,
      })

      setStage('Document soumis pour modération.')
      navigate('/documents')
    } catch (err) {
      setError(err.message)
      setStage('')
      setUploadPercent(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Publier un document</h1>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      {submitting && stage && (
        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
          <ProgressBar value={uploadPercent} label={`${stage}…`} />
        </div>
      )}

      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <Input label="Titre" name="title" value={form.title} onChange={onChange} required />

        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea
            id="description" name="description" rows={3}
            value={form.description} onChange={onChange}
            className="input"
          />
        </div>

        <Select
          label="Type" name="resource_type" value={form.resource_type}
          onChange={onChange} options={RESOURCE_TYPES}
        />

        <Select
          label="Établissement" name="institution_id" value={form.institution_id}
          onChange={onChange} placeholder="— Sélectionner —"
          options={institutions.map((i) => ({ value: i.id, label: i.name }))}
        />

        <Select
          label="Filière" name="program_id" value={form.program_id}
          onChange={onChange} placeholder="— Sélectionner —"
          options={programs.map((p) => ({ value: p.id, label: p.name }))}
          disabled={!form.institution_id}
        />

        <Select
          label="Matière" name="subject_id" value={form.subject_id}
          onChange={onChange} placeholder="— Sélectionner —"
          options={subjects.map((s) => ({ value: s.id, label: s.name }))}
          disabled={!form.program_id}
        />

        <Input label="Niveau" name="level" value={form.level} onChange={onChange} placeholder="L3" required />
        <Input label="Année académique" name="academic_year" value={form.academic_year} onChange={onChange} placeholder="2024-2025" required />

        <Select
          label="Semestre" name="semester" value={form.semester}
          onChange={onChange} placeholder="— Facultatif —"
          options={['S1','S2','S3','S4','S5','S6','ANNUAL'].map(s => ({ value: s, label: s }))}
        />

        <div>
          <label htmlFor="file" className="label">Fichier PDF (max 20 Mo)</label>
          <input
            id="file" type="file" accept="application/pdf,.pdf"
            onChange={onPickFile}
            disabled={submitting}
            className="input"
          />
          {file && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <FileText size={16} className="shrink-0 text-brand-600" />
              <span className="truncate">{file.name}</span>
              <span className="shrink-0 text-slate-500">({formatFileSize(file.size)})</span>
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary">
          <Upload size={18} /> {submitting ? 'Envoi en cours...' : 'Soumettre pour modération'}
        </button>
      </form>
    </div>
  )
}