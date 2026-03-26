import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Eye, EyeOff, Scan, ArrowLeft, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

export default function Login() {
  const { role } = useParams()
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const isAdmin = role === 'admin'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password, role)
      toast.success(`Welcome back!`)
      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        // First time → face registration
        navigate(user.is_face_registered ? '/student' : '/student/register-face')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md fade-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Link to="/" className="p-2 rounded-xl hover:bg-white/5 transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <Scan className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg">FaceAttend</span>
          </div>
        </div>

        <div className="card p-8">
          {/* Role badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6
            ${isAdmin ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'bg-accent/10 text-accent border border-accent/30'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {isAdmin ? 'Administrator Login' : 'Student Login'}
          </div>

          <h1 className="font-display text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-white/40 text-sm mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@college.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6 font-mono">
          Credentials are managed by your administrator
        </p>
      </div>
    </div>
  )
}
