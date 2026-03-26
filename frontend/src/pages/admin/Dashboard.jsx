import { useEffect, useState } from 'react'
import { Users, BookOpen, Calendar, TrendingDown, Download, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1', '#e94560', '#34d399', '#f59e0b']

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subjectStats, setSubjectStats] = useState([])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [analyticsRes, subjectsRes] = await Promise.all([
        api.get('/api/admin/analytics/summary'),
        api.get('/api/admin/subjects'),
      ])
      setAnalytics(analyticsRes.data)
      // Build chart data from subjects
      setSubjectStats(subjectsRes.data.map((s, i) => ({
        name: s.code,
        fullName: s.name,
        credits: s.credits,
        fill: COLORS[i % COLORS.length],
      })))
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
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
      toast.success('Export downloaded')
    } catch {
      toast.error('Export failed')
    }
  }

  if (loading) return <LoadingSkeleton />

  const pieData = [
    { name: 'Present', value: analytics?.average_attendance_pct || 0 },
    { name: 'Absent', value: 100 - (analytics?.average_attendance_pct || 0) },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold fade-up">Dashboard</h1>
          <p className="text-white/40 mt-1 fade-up-delay-1">Overview of your attendance system</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleExport} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-up-delay-1">
        <StatCard icon={<Users />} label="Total Students" value={analytics?.total_students ?? '–'} color="brand" />
        <StatCard icon={<Calendar />} label="Total Lectures" value={analytics?.total_lectures ?? '–'} color="purple" />
        <StatCard icon={<BookOpen />} label="Avg Attendance" value={`${analytics?.average_attendance_pct ?? 0}%`} color="green" />
        <StatCard icon={<TrendingDown />} label="Below 75%" value={analytics?.students_below_threshold ?? '–'} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-up-delay-2">
        {/* Attendance pie */}
        <div className="card p-6">
          <h3 className="font-display font-semibold mb-4">Overall Attendance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#6366f1' : '#2a2a45'} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#16162a', border: '1px solid #2a2a45', borderRadius: 8 }}
                formatter={(v) => [`${v.toFixed(1)}%`]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Subject credits bar */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display font-semibold mb-4">Subjects by Credits</h3>
          {subjectStats.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-12">No subjects added yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subjectStats} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: '#ffffff60', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff60', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#16162a', border: '1px solid #2a2a45', borderRadius: 8 }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  formatter={(v, _, props) => [v, props.payload.fullName]}
                />
                <Bar dataKey="credits" radius={[6, 6, 0, 0]}>
                  {subjectStats.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-6 fade-up-delay-3">
        <h3 className="font-display font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Student', href: '/admin/students' },
            { label: 'Add Subject', href: '/admin/subjects' },
            { label: 'Schedule Lecture', href: '/admin/lectures' },
            { label: 'View Attendance', href: '/admin/attendance' },
          ].map((a) => (
            <a key={a.href} href={a.href}
              className="bg-white/5 hover:bg-white/10 border border-surface-border hover:border-brand-500/40
                         rounded-xl p-4 text-center text-sm font-medium transition-all duration-200 cursor-pointer">
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    brand: 'bg-brand-600/20 text-brand-400',
    purple: 'bg-purple-500/20 text-purple-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    red: 'bg-accent/20 text-accent',
  }
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <span className="w-5 h-5">{icon}</span>
      </div>
      <p className="text-2xl font-display font-bold mt-2">{value}</p>
      <p className="text-white/40 text-sm">{label}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-48 bg-white/5 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-2xl" />)}
      </div>
    </div>
  )
}
