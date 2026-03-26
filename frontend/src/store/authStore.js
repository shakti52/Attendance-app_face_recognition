import { create } from 'zustand'
import api from '../utils/api'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: async (email, password, role) => {
    const { data } = await api.post('/api/auth/login', { email, password, role })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    const user = {
      id: data.user_id,
      role: data.role,
      is_face_registered: data.is_face_registered,
      email,
    }
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, isAuthenticated: true })
    return user
  },

  logout: () => {
    localStorage.clear()
    set({ user: null, isAuthenticated: false })
  },

  setFaceRegistered: () => {
    set((state) => {
      const updated = { ...state.user, is_face_registered: true }
      localStorage.setItem('user', JSON.stringify(updated))
      return { user: updated }
    })
  },
}))

export default useAuthStore
