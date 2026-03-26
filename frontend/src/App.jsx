import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminStudents from './pages/admin/Students'
import AdminSubjects from './pages/admin/Subjects'
import AdminLectures from './pages/admin/Lectures'
import AdminAttendance from './pages/admin/Attendance'
import StudentDashboard from './pages/student/Dashboard'
import FaceRegister from './pages/student/FaceRegister'
import MarkAttendance from './pages/student/MarkAttendance'
import AdminLayout from './components/admin/AdminLayout'
import StudentLayout from './components/student/StudentLayout'

function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#16162a', color: '#fff', border: '1px solid #2a2a45' },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login/:role" element={<Login />} />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="subjects" element={<AdminSubjects />} />
          <Route path="lectures" element={<AdminLectures />} />
          <Route path="attendance" element={<AdminAttendance />} />
        </Route>

        {/* Student routes */}
        <Route path="/student" element={
          <ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="register-face" element={<FaceRegister />} />
          <Route path="mark-attendance" element={<MarkAttendance />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
