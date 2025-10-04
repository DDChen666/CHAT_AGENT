import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initializeSync, resetSync } from '@/lib/syncManager'
import { useSettingsStore } from '@/store/settingsStore'
import { useAppStore } from '@/store/appStore'

interface User {
  id: string
  email: string
  name?: string
  isAdmin: boolean
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isInitialized: false,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ isLoading: loading }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          const data = await res.json()

          if (!res.ok) {
            return { success: false, message: data.message || 'Login failed' }
          }

          set({ user: data.user, isLoading: false })

          // 初始化同步
          try {
            await initializeSync()
          } catch (error) {
            console.warn('Failed to initialize sync after login:', error)
          }

          return { success: true }
        } catch (error) {
          console.error('Login request failed:', error)
          set({ isLoading: false })
          return { success: false, message: 'Network error' }
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
          })
          const data = await res.json()

          if (!res.ok) {
            return { success: false, message: data.message || 'Registration failed' }
          }

          set({ user: data.user, isLoading: false })

          // 初始化同步
          try {
            await initializeSync()
          } catch (error) {
            console.warn('Failed to initialize sync after register:', error)
          }

          return { success: true }
        } catch (error) {
          console.error('Registration request failed:', error)
          set({ isLoading: false })
          return { success: false, message: 'Network error' }
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await resetSync()
        } catch (error) {
          console.warn('Failed to sync data before logout:', error)
        }

        try {
          await fetch('/api/auth/logout', { method: 'POST' })
        } catch (error) {
          console.error('Logout request error:', error)
        } finally {
          useSettingsStore.getState().clearSensitiveData()
          useAppStore.getState().resetState()
          set({ user: null, isLoading: false })
        }
      },

      checkAuth: async () => {
        try {
          const res = await fetch('/api/auth/me', { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            set({ user: data.user })
          } else {
            set({ user: null })
          }
        } catch (error) {
          console.error('Check auth error:', error)
          set({ user: null })
        }
      },

      initialize: async () => {
        if (get().isInitialized) return

        try {
          // 检查认证状态
          await get().checkAuth()

          // 如果用户已登录，初始化同步
          if (get().user) {
            await initializeSync()
          }

          set({ isInitialized: true })
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ isInitialized: true, user: null })
        }
      }
    }),
    {
      name: 'synapse-auth',
      partialize: (state) => ({
        user: state.user,
        isInitialized: state.isInitialized,
      }),
    }
  )
)
