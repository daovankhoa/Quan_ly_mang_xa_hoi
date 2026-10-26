import api, { refreshAccessToken, setAccessToken } from './api'

export const register = (payload) =>
  api.post('/auth/register', payload).then((res) => res.data)

export const login = (payload) =>
  api.post('/auth/login', payload).then(({ data }) => {
    setAccessToken(data.accessToken)
    return data // { message, accessToken, user }
  })

export const logout = () =>
  api.post('/auth/logout').then((res) => {
    setAccessToken(null)
    return res.data
  })

export const logoutAll = () =>
  api.post('/auth/logout-all').then((res) => {
    setAccessToken(null)
    return res.data
  })

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then((res) => res.data)

export const resetPassword = (token, payload) =>
  api.post(`/auth/reset-password/${token}`, payload).then((res) => res.data)

export const getMe = () => api.get('/auth/me').then((res) => res.data)

// Dùng khi mở/tải lại trang để khôi phục phiên đăng nhập
export const restoreSession = () => refreshAccessToken()