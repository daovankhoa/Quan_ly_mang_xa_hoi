import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

// ---- Access token lưu trong bộ nhớ ----
let accessToken = null
export const getAccessToken = () => accessToken
export const setAccessToken = (token) => {
  accessToken = token
}

// ---- Callback khi phiên đăng nhập hết hạn hẳn (AuthContext sẽ gắn ở bước 3) ----
let onAuthFailure = null
export const setAuthFailureHandler = (fn) => {
  onAuthFailure = fn
}

// ---- Instance chính dùng cho mọi API ----
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // để cookie refreshToken được gửi đi
})

// Instance riêng cho refresh, không có interceptor để tránh vòng lặp
const refreshClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// ---- Refresh token, gom các lần gọi đồng thời thành một ----
let refreshPromise = null
export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/auth/refresh-token')
      .then(({ data }) => {
        setAccessToken(data.accessToken)
        return data
      })
      .catch((err) => {
        setAccessToken(null)
        throw err
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// ---- Tự gắn Bearer token vào mỗi request ----
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ---- Gặp 401 thì refresh rồi gửi lại, tối đa 1 lần ----
const NO_RETRY_URLS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
]

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const skip =
      !original ||
      original._retry ||
      NO_RETRY_URLS.some((url) => original.url?.startsWith(url))

    if (status !== 401 || skip) return Promise.reject(error)

    original._retry = true
    try {
      await refreshAccessToken()
      return api(original) // interceptor request sẽ gắn token mới
    } catch (refreshError) {
      if (onAuthFailure) onAuthFailure()
      return Promise.reject(refreshError)
    }
  }
)

// ---- Lấy thông báo lỗi dễ đọc để hiện cho người dùng ----
export const getErrorMessage = (err) => {
  if (err.response?.data?.message) return err.response.data.message
  if (err.request) return 'Không kết nối được máy chủ. Vui lòng thử lại.'
  return err.message || 'Đã có lỗi xảy ra.'
}

export default api