import { useEffect, useState } from 'react'
import { Plus, Trash2, X, BookOpen } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [classFilter, setClassFilter] = useState('')

  useEffect(() => { fetchSubjects() }, [classFilter])

  const fetchSubjects = async () => {
    setLoading(true)
    try {
      const params = classFilter ? { class_name: classFilter } : {}
      const { data } = await api.get('/api/admin/subjects', { params })
      setSubjects(data)
    } catch {
      toast.error('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject? All related lectures will also be removed.')) return
    try {
      await api.delete(`/api/admin/subjects/${id}`)
      toast.success('Subject deleted')
      fetchSubjects()
    } catch {
      toast.error('Delete failed')
    }
  }

  const classes = [...new Set(subjects.map(s => s.class_name).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold">Subjects</h1>
          <p className="text-white/40 mt-1">{subjects.length} subjects configured</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3 fade-up-delay-1">
        <select className="input-field w-48" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Subject cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="card p-16 text-center text-white/30">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No subjects found. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 fade-up-delay-2">
          {subjects.map((s, i) => (
            <div key={s.id} className="card p-5 group hover:border-brand-500/40 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-brand-400" />
                </div>
                <button
                  onClick={() => deleteSubject(s.id)}
                  className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-accent transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-display font-semibold text-base">{s.name}</h3>
              <div className="flex items-center gap-3 mt-2">
                <span className="font-mono text-xs text-brand-400 bg-brand-600/10 px-2 py-1 rounded">{s.code}</span>
                <span className="text-xs text-white/40">{s.class_name}</span>
                <span className="text-xs text-white/40">{s.credits} credits</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddSubjectModal onClose={() => setShowModal(false)} onAdded={fetchSubjects} />}
    </div>
  )
}

function AddSubjectModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', code: '', class_name: '', credits: 3 })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/admin/subjects', { ...form, credits: Number(form.credits) })
      toast.success('Subject added!')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add subject')
    } finally {
      setLoading(false)
    }
  }

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-md p-8 fade-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Add Subject</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Subject Name</label>
            <input className="input-field" placeholder="Data Structures & Algorithms" required {...f('name')} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Subject Code</label>
            <input className="input-field" placeholder="CS301" required {...f('code')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Class</label>
              <input className="input-field" placeholder="SE-A" required {...f('class_name')} />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Credits</label>
              <input type="number" min={1} max={6} className="input-field" {...f('credits')} />
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Adding...' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
