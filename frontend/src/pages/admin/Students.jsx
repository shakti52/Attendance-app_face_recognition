import { useEffect, useState } from 'react'
import { UserPlus, Search, Filter, ToggleLeft, ToggleRight, X, CheckCircle } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { fetchStudents() }, [classFilter])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = classFilter ? { class_name: classFilter } : {}
      const { data } = await api.get('/api/admin/students', { params })
      setStudents(data)
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id) => {
    try {
      const { data } = await api.patch(`/api/admin/students/${id}/toggle-active`)
      setStudents(s => s.map(st => st.id === id ? { ...st, is_active: data.is_active } : st))
      toast.success('Status updated')
    } catch {
      toast.error('Update failed')
    }
  }

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.id_number?.toLowerCase().includes(search.toLowerCase())
  )

  const classes = [...new Set(students.map(s => s.class_name).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold">Students</h1>
          <p className="text-white/40 mt-1">{students.length} enrolled students</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 fade-up-delay-1">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            className="input-field pl-10"
            placeholder="Search by name, email or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-40"
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden fade-up-delay-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Name', 'ID Number', 'Email', 'Class', 'Face', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-4 text-white/40 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-surface-border/50">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-white/5 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-white/30">
                    No students found
                  </td>
                </tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b border-surface-border/50 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4 font-medium">{s.full_name || '—'}</td>
                  <td className="px-5 py-4 font-mono text-white/60">{s.id_number}</td>
                  <td className="px-5 py-4 text-white/60">{s.email}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 bg-brand-600/20 text-brand-400 rounded-lg text-xs font-mono">
                      {s.class_name || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {s.is_face_registered
                      ? <span className="badge-present"><CheckCircle className="w-3 h-3" />Registered</span>
                      : <span className="badge-absent">Not registered</span>}
                  </td>
                  <td className="px-5 py-4">
                    {s.is_active
                      ? <span className="badge-present">Active</span>
                      : <span className="badge-absent">Inactive</span>}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(s.id)}
                      className="text-white/40 hover:text-white transition-colors"
                      title="Toggle active status"
                    >
                      {s.is_active ? <ToggleRight className="w-5 h-5 text-brand-400" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <AddStudentModal onClose={() => setShowModal(false)} onAdded={fetchStudents} />}
    </div>
  )
}

function AddStudentModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    email: '', id_number: '', password: '',
    full_name: '', class_name: '', division: '', phone: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/admin/students', form)
      toast.success('Student created. Credentials emailed!')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create student')
    } finally {
      setLoading(false)
    }
  }

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-lg p-8 fade-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Add New Student</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-white/60 mb-2">Full Name</label>
            <input className="input-field" placeholder="Jane Doe" required {...f('full_name')} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Email</label>
            <input type="email" className="input-field" placeholder="student@college.edu" required {...f('email')} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">ID Number</label>
            <input className="input-field" placeholder="2021CS001" required {...f('id_number')} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Password</label>
            <input type="password" className="input-field" placeholder="Temp password" required {...f('password')} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Class</label>
            <input className="input-field" placeholder="SE-A" required {...f('class_name')} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Division</label>
            <input className="input-field" placeholder="A" {...f('division')} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Phone</label>
            <input className="input-field" placeholder="+91 98765 43210" {...f('phone')} />
          </div>
          <div className="col-span-2 flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create & Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
