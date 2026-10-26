import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { resetPassword } from '../services/authApi'
import { getErrorMessage } from '../services/api'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  // Luật giống backend: 8-72 ký tự, có cả chữ và số
  const validate = () => {
    const next = {}
    if (!form.password) next.password = 'Mật khẩu là bắt buộc'
    else if (form.password.length < 8 || form.password.length > 72)
      next.password = 'Mật khẩu phải từ 8 đến 72 ký tự'
    else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(form.password))
      next.password = 'Mật khẩu phải chứa cả chữ và số'

    if (!form.confirmPassword)
      next.confirmPassword = 'Vui lòng nhập lại mật khẩu'
    else if (form.confirmPassword !== form.password)
      next.confirmPassword = 'Mật khẩu nhập lại không khớp'
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
      await resetPassword(token, {
        password: form.password,
        confirmPassword: form.confirmPassword,
      })
      navigate('/login', {
        replace: true,
        state: { message: 'Đặt lại mật khẩu thành công. Hãy đăng nhập.' },
      })
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Đặt lại mật khẩu</h1>
        <p className="auth-subtitle">Nhập mật khẩu mới cho tài khoản của bạn</p>

        {submitError && <div className="alert alert-error">{submitError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="password">Mật khẩu mới</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              className={errors.password ? 'invalid' : ''}
            />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'invalid' : ''}
            />
            {errors.confirmPassword && (
              <p className="field-error">{errors.confirmPassword}</p>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}