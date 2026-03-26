import { useNavigate } from 'react-router-dom'
import { Shield, User, Scan } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { useEffect } from 'react'

export default function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'admin' ? '/admin' : '/student')
    }
  }, [isAuthenticated])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-4 fade-up">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-glow">
          <Scan className="w-6 h-6 text-white" />
        </div>
        <span className="font-display text-2xl font-bold tracking-tight">FaceAttend</span>
      </div>

      <p className="text-white/40 text-sm mb-16 fade-up-delay-1 font-mono tracking-widest uppercase">
        Smart Attendance System
      </p>

      {/* Role Cards */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl fade-up-delay-2">
        <RoleCard
          icon={<Shield className="w-8 h-8" />}
          title="Administrator"
          description="Manage students, subjects, lectures and attendance records"
          color="brand"
          onClick={() => navigate('/login/admin')}
        />
        <RoleCard
          icon={<User className="w-8 h-8" />}
          title="Student"
          description="View your attendance, register your face and mark attendance"
          color="accent"
          onClick={() => navigate('/login/student')}
        />
      </div>

      <p className="mt-16 text-white/20 text-xs font-mono fade-up-delay-3">
        Powered by ArcFace · RetinaFace · FastAPI · React
      </p>
    </div>
  )
}

function RoleCard({ icon, title, description, color, onClick }) {
  const isAccent = color === 'accent'
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 card p-8 flex flex-col items-center text-center gap-4
        cursor-pointer group transition-all duration-300
        hover:scale-105 hover:shadow-2xl
        ${isAccent
          ? 'hover:border-accent/50 hover:shadow-accent/10'
          : 'hover:border-brand-500/50 hover:shadow-brand-500/10'}
      `}
    >
      <div className={`
        w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-200
        ${isAccent
          ? 'bg-accent/10 text-accent group-hover:bg-accent/20'
          : 'bg-brand-600/20 text-brand-400 group-hover:bg-brand-600/30'}
      `}>
        {icon}
      </div>
      <div>
        <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
        <p className="text-white/50 text-sm leading-relaxed">{description}</p>
      </div>
      <span className={`
        mt-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-200
        ${isAccent
          ? 'bg-accent/10 text-accent group-hover:bg-accent/20'
          : 'bg-brand-600/20 text-brand-400 group-hover:bg-brand-600/30'}
      `}>
        Login as {title} →
      </span>
    </button>
  )
}
