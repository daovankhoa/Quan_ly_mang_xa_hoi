import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/authApi'
import { getErrorMessage } from '../services/api'

const INITIAL_FORM = {
  username: '',
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

// Luật kiểm tra giống backend (authValidation.js)
const validate = (form) => {
  const errors = {}

  const username = form.username.trim().toLowerCase()
  if (!username) errors.username = 'Tên người dùng là bắt buộc'
  else if (username.length < 3 || username.length > 30)
    errors.username = 'Tên người dùng phải từ 3 đến 30 ký tự'
  else if (!/^[a-z0-9_.]+$/.test(username))
    errors.username = 'Tên người dùng chỉ gồm chữ, số, dấu _ và .'

  const displayName = form.displayName.trim()
  if (!displayName) errors.displayName = 'Tên hiển thị là bắt buộc'
  else if (displayName.length < 2 || displayName.length > 50)
    errors.displayName = 'Tên hiển thị phải từ 2 đến 50 ký tự'

  const email = form.email.trim()
  if (!email) errors.email = 'Email là bắt buộc'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Email không đúng định dạng'

  if (!form.password) errors.password = 'Mật khẩu là bắt buộc'
  else if (form.password.length < 8 || form.password.length > 72)
    errors.password = 'Mật khẩu phải từ 8 đến 72 ký tự'
  else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(form.password))
    errors.password = 'Mật khẩu phải chứa cả chữ và số'

  if (!form.confirmPassword) errors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
  else if (form.confirmPassword !== form.password)
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp'

  return errors
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    try {
      const data = await register({
        username: form.username.trim().toLowerCase(),
        displayName: form.displayName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      })
      navigate('/login', { state: { message: data.message } })
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const field = (name, label, type = 'text', autoComplete) => (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={form[name]}
        onChange={handleChange}
        autoComplete={autoComplete}
        className={errors[name] ? 'invalid' : ''}
      />
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Tạo tài khoản</h1>
        <p className="auth-subtitle">Tham gia mạng xã hội ngay hôm nay</p>

        {submitError && <div className="alert alert-error">{submitError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {field('username', 'Tên người dùng', 'text', 'username')}
          {field('displayName', 'Tên hiển thị', 'text', 'name')}
          {field('email', 'Email', 'email', 'email')}
          {field('password', 'Mật khẩu', 'password', 'new-password')}
          {field('confirmPassword', 'Xác nhận mật khẩu', 'password', 'new-password')}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}