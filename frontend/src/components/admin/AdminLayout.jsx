import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, Calendar,
  ClipboardList, LogOut, Scan, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/admin',           label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/admin/students',  label: 'Students',   icon: Users },
  { to: '/admin/subjects',  label: 'Subjects',   icon: BookOpen },
  { to: '/admin/lectures',  label: 'Lectures',   icon: Calendar },
  { to: '/admin/attendance',label: 'Attendance', icon: ClipboardList },
]

export default function AdminLayout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-30 w-64 flex flex-col
        bg-surface-card border-r border-surface-border
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-surface-border">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-glow">
            <Scan className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-base">FaceAttend</p>
            <p className="text-xs text-white/30 font-mono">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          <p className="text-xs font-semibold text-white/25 uppercase tracking-widest px-4 mb-3">
            Navigation
          </p>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6 border-t border-surface-border pt-4">
          <button onClick={handleLogout} className="sidebar-link w-full text-accent hover:text-accent hover:bg-accent/10">
            <LogOut className="w-4 h-4 shrink-0" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-4 px-4 py-4 border-b border-surface-border bg-surface-card sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-white/60 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-bold">FaceAttend</span>
        </div>

        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
