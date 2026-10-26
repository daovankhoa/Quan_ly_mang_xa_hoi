import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../services/authApi'
import { setAuthFailureHandler, setAccessToken } from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // đang khôi phục phiên

  // Khi mở/tải lại trang: thử khôi phục phiên bằng cookie refresh token
  useEffect(() => {
    let cancelled = false

    authApi
      .restoreSession()
      .then((data) => {
        if (!cancelled) setUser(data.user)
      })
      .catch(() => {
        if (!cancelled) setUser(null) // chưa đăng nhập hoặc phiên đã hết hạn
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Khi refresh thất bại giữa chừng (phiên hết hạn hẳn) thì đưa về trạng thái chưa đăng nhập
  useEffect(() => {
    setAuthFailureHandler(() => setUser(null))
    return () => setAuthFailureHandler(null)
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // dù server báo lỗi vẫn xóa phiên phía client
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: !!user, login, logout }),
    [user, loading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}