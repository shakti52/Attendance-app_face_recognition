import { useEffect, useState } from 'react'
import { ClipboardList, Check, X as XIcon, Search, Download } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminAttendance() {
  const [lectures, setLectures] = useState([])
  const [students, setStudents] = useState([])
  const [selectedLecture, setSelectedLecture] = useState(null)
  const [attendance, setAttendance] = useState({})   // studentId → "present"|"absent"
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/api/admin/lectures').then(r => setLectures(r.data))
  }, [])

  useEffect(() => {
    if (!selectedLecture) return
    setLoading(true)
    const classFilter = selectedLecture.subject?.class_name
    Promise.all([
      api.get('/api/admin/students', { params: classFilter ? { class_name: classFilter } : {} }),
    ]).then(([sRes]) => {
      setStudents(sRes.data)
      // Reset local attendance state
      const init = {}
      sRes.data.forEach(s => { init[s.id] = 'absent' })
      setAttendance(init)
    }).finally(() => setLoading(false))
  }, [selectedLecture])

  const mark = async (studentId, status) => {
    if (!selectedLecture) return
    try {
      await api.post('/api/admin/attendance/manual', {
        student_id: studentId,
        lecture_id: selectedLecture.id,
        status,
      })
      setAttendance(a => ({ ...a, [studentId]: status }))
    } catch {
      toast.error('Failed to mark attendance')
    }
  }

  const handleExport = async () => {
    try {
      const res = await api.get('/api/admin/export/attendance/csv', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'attendance.csv'
      a.click()
      toast.success('Downloaded')
    } catch {
      toast.error('Export failed')
    }
  }

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.id_number?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold">Attendance</h1>
          <p className="text-white/40 mt-1">Manually mark or review attendance</p>
        </div>
        <button onClick={handleExport} className="btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Lecture selector */}
      <div className="card p-5 fade-up-delay-1">
        <label className="block text-sm text-white/60 mb-3 font-medium">Select Lecture</label>
        <select
          className="input-field"
          value={selectedLecture?.id || ''}
          onChange={e => {
            const lec = lectures.find(l => l.id === Number(e.target.value))
            setSelectedLecture(lec || null)
          }}
        >
          <option value="">— Choose a lecture —</option>
          {lectures.map(l => (
            <option key={l.id} value={l.id}>
              {l.subject?.name} | {l.date} | {l.start_time}–{l.end_time} | {l.subject?.class_name}
            </option>
          ))}
        </select>
      </div>

      {selectedLecture && (
        <>
          <div className="fade-up-delay-2">
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  className="input-field pl-10"
                  placeholder="Search students..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="card px-4 flex items-center gap-4 text-sm">
                <span className="text-emerald-400 font-semibold">
                  ✓ {Object.values(attendance).filter(v => v === 'present').length} Present
                </span>
                <span className="text-accent font-semibold">
                  ✗ {Object.values(attendance).filter(v => v === 'absent').length} Absent
                </span>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      {['#', 'Name', 'ID Number', 'Status', 'Mark Present', 'Mark Absent'].map(h => (
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
                    ) : filtered.map((s, idx) => (
                      <tr key={s.id} className="border-b border-surface-border/50 hover:bg-white/2 transition-colors">
                        <td className="px-5 py-4 text-white/30 font-mono text-xs">{idx + 1}</td>
                        <td className="px-5 py-4 font-medium">{s.full_name}</td>
                        <td className="px-5 py-4 font-mono text-white/60">{s.id_number}</td>
                        <td className="px-5 py-4">
                          {attendance[s.id] === 'present'
                            ? <span className="badge-present">Present</span>
                            : <span className="badge-absent">Absent</span>}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => mark(s.id, 'present')}
                            className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 
                                       text-emerald-400 flex items-center justify-center transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => mark(s.id, 'absent')}
                            className="w-8 h-8 rounded-lg bg-accent/10 hover:bg-accent/20 
                                       text-accent flex items-center justify-center transition-colors"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedLecture && (
        <div className="card p-20 text-center text-white/20 fade-up-delay-2">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Select a lecture above to manage attendance</p>
        </div>
      )}
    </div>
  )
}
