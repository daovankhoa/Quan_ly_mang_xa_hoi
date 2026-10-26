import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../services/api'

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Thông báo từ trang Đăng ký / Đặt lại mật khẩu gửi sang
  const successMessage = location.state?.message
  // Nơi cần quay lại sau khi đăng nhập (bước 7 sẽ dùng)
  const redirectTo = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Đã đăng nhập rồi thì không cần ở trang này
  if (!loading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const validate = () => {
    const next = {}
    const email = form.email.trim()
    if (!email) next.email = 'Email là bắt buộc'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = 'Email không đúng định dạng'
    if (!form.password) next.password = 'Mật khẩu là bắt buộc'
    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    try {
      await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Đăng nhập</h1>
        <p className="auth-subtitle">Chào mừng bạn quay lại</p>

        {successMessage && !submitError && (
          <div className="alert alert-success">{successMessage}</div>
        )}
        {submitError && <div className="alert alert-error">{submitError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              className={errors.email ? 'invalid' : ''}
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              className={errors.password ? 'invalid' : ''}
            />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <p className="forgot-link">
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </p>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
    </div>
  )
}