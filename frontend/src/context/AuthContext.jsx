import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as authService from '../services/auth.js'

const AuthContext = createContext(null)

const TOKEN_KEY = 'docucamp_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user && !!profile
  const isAdmin = profile?.role === 'ADMIN'

  const persistSession = useCallback((data) => {
    if (data?.token) {
      localStorage.setItem(TOKEN_KEY, data.token)
    }
    setUser(data?.user ?? null)
    setProfile(data?.profile ?? null)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    setProfile(null)
  }, [])

  // Restauration de session au chargement
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    authService.me()
      .then((res) => {
        setUser(res.data.user)
        setProfile(res.data.profile)
      })
      .catch(() => {
        clearSession()
      })
      .finally(() => setLoading(false))
  }, [clearSession])

  const login = useCallback(async (payload) => {
    const res = await authService.login(payload)
    persistSession(res.data)
    return res.data
  }, [persistSession])

  const register = useCallback(async (payload) => {
    const res = await authService.register(payload)
    persistSession(res.data)
    return res.data
  }, [persistSession])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Ignore
    } finally {
      clearSession()
    }
  }, [clearSession])

  const refresh = useCallback(async () => {
    const res = await authService.me()
    setUser(res.data.user)
    setProfile(res.data.profile)
  }, [])

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    refresh,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}