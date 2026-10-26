import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/authApi'
import { getErrorMessage } from '../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const value = email.trim()
    if (!value) return setError('Email là bắt buộc')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return setError('Email không đúng định dạng')

    setSubmitting(true)
    try {
      const data = await forgotPassword(value.toLowerCase())
      setSuccess(
        data?.message ||
          'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.'
      )
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Quên mật khẩu</h1>
        <p className="auth-subtitle">
          Nhập email để nhận liên kết đặt lại mật khẩu
        </p>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi liên kết'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}