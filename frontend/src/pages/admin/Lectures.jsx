import { useEffect, useState } from 'react'
import { Plus, X, Calendar, Clock, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminLectures() {
  const [lectures, setLectures] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    Promise.all([fetchLectures(), fetchSubjects()])
  }, [])

  const fetchLectures = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/lectures')
      setLectures(data)
    } catch { toast.error('Failed to load lectures') }
    finally { setLoading(false) }
  }

  const fetchSubjects = async () => {
    const { data } = await api.get('/api/admin/subjects')
    setSubjects(data)
  }

  const toggleAttendance = async (id) => {
    try {
      const { data } = await api.patch(`/api/admin/lectures/${id}/toggle-attendance`)
      setLectures(l => l.map(lec => lec.id === id ? { ...lec, attendance_open: data.attendance_open } : lec))
      toast.success(data.attendance_open ? 'Attendance window opened' : 'Attendance window closed')
    } catch { toast.error('Failed to update') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold">Lectures</h1>
          <p className="text-white/40 mt-1">Manage and open attendance windows</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Schedule Lecture
        </button>
      </div>

      <div className="card overflow-hidden fade-up-delay-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Subject', 'Class', 'Date', 'Time', 'Attendance', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-4 text-white/40 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-surface-border/50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-white/5 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : lectures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-white/30">
                    No lectures scheduled
                  </td>
                </tr>
              ) : lectures.map(lec => (
                <tr key={lec.id} className="border-b border-surface-border/50 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4 font-medium">{lec.subject?.name || '—'}</td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-brand-400 bg-brand-600/10 px-2 py-1 rounded">
                      {lec.subject?.class_name || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 flex items-center gap-2 text-white/60">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(lec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 text-white/60">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {lec.start_time} – {lec.end_time}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {lec.attendance_open
                      ? <span className="badge-present"><span className="glow-dot" />Open</span>
                      : <span className="badge-absent">Closed</span>}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleAttendance(lec.id)}
                      title="Toggle attendance window"
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      {lec.attendance_open
                        ? <ToggleRight className="w-6 h-6 text-emerald-400" />
                        : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <AddLectureModal
          subjects={subjects}
          onClose={() => setShowModal(false)}
          onAdded={fetchLectures}
        />
      )}
    </div>
  )
}

function AddLectureModal({ subjects, onClose, onAdded }) {
  const [form, setForm] = useState({ subject_id: '', date: '', start_time: '', end_time: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/admin/lectures', { ...form, subject_id: Number(form.subject_id) })
      toast.success('Lecture scheduled!')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to schedule lecture')
    } finally {
      setLoading(false)
    }
  }

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-md p-8 fade-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Schedule Lecture</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Subject</label>
            <select className="input-field" required {...f('subject_id')}>
              <option value="">Select subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.class_name})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Date</label>
            <input type="date" className="input-field" required {...f('date')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Start Time</label>
              <input type="time" className="input-field" required {...f('start_time')} />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">End Time</label>
              <input type="time" className="input-field" required {...f('end_time')} />
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
