import { useEffect, useState } from 'react'
import { TrendingUp, CheckCircle, XCircle, AlertTriangle, Award } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function StudentDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/student/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton />
  if (!data) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="fade-up">
        <h1 className="font-display text-3xl font-bold">
          Hello, <span className="text-gradient">{data.student_name.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-white/40 mt-1">{data.id_number} · {data.class_name}</p>
      </div>

      {/* Eligibility + Overall */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 fade-up-delay-1">
        <div className={`card p-6 border-2 ${data.eligible ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-accent/40 bg-accent/5'}`}>
          <div className="flex items-center gap-3 mb-3">
            {data.eligible
              ? <Award className="w-6 h-6 text-emerald-400" />
              : <AlertTriangle className="w-6 h-6 text-accent" />}
            <span className="font-display font-bold text-lg">Exam Eligibility</span>
          </div>
          <p className={`text-3xl font-display font-bold ${data.eligible ? 'text-emerald-400' : 'text-accent'}`}>
            {data.eligible ? 'ELIGIBLE ✓' : 'NOT ELIGIBLE ✗'}
          </p>
          <p className="text-white/40 text-sm mt-1">Based on 75% threshold</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-sm mb-1">Overall Attendance</p>
              <p className="text-4xl font-display font-bold">{data.overall_percentage}%</p>
              <p className="text-white/30 text-xs mt-1">Across all subjects</p>
            </div>
            <div className="w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius="60%" outerRadius="90%"
                  data={[{ value: data.overall_percentage, fill: data.eligible ? '#34d399' : '#e94560' }]}
                  startAngle={90} endAngle={90 - 360 * data.overall_percentage / 100}
                >
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#2a2a45' }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Subject breakdown */}
      <div className="fade-up-delay-2">
        <h2 className="font-display font-semibold text-lg mb-4">Subject-wise Attendance</h2>
        <div className="space-y-3">
          {data.subjects.map(s => (
            <SubjectRow key={s.subject_id} subject={s} />
          ))}
          {data.subjects.length === 0 && (
            <div className="card p-12 text-center text-white/30">No subjects found for your class.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function SubjectRow({ subject }) {
  const pct = subject.percentage
  const eligible = subject.eligible
  const color = eligible ? '#34d399' : '#e94560'
  const bgColor = eligible ? 'bg-emerald-500' : 'bg-accent'

  return (
    <div className="card p-5 hover:border-brand-500/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium">{subject.subject_name}</h3>
          <p className="text-xs text-white/40 font-mono">{subject.subject_code}</p>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div className="text-sm text-white/50">
            <span className="text-emerald-400 font-semibold">{subject.present}</span>
            <span className="mx-1">/</span>
            <span>{subject.total_lectures}</span>
            <span className="ml-1 text-white/30">lectures</span>
          </div>
          <span className={`text-lg font-display font-bold`} style={{ color }}>
            {pct}%
          </span>
          {eligible
            ? <span className="badge-eligible"><CheckCircle className="w-3 h-3" />Eligible</span>
            : <span className="badge-ineligible"><XCircle className="w-3 h-3" />Not Eligible</span>}
        </div>
      </div>
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-surface-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bgColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {/* 75% marker */}
      <div className="relative mt-1 h-3">
        <div className="absolute top-0 h-full border-l border-dashed border-white/20" style={{ left: '75%' }}>
          <span className="absolute top-0 left-1 text-[9px] text-white/20 font-mono">75%</span>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-64 bg-white/5 rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <div key={i} className="h-36 bg-white/5 rounded-2xl" />)}
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
      </div>
    </div>
  )
}
