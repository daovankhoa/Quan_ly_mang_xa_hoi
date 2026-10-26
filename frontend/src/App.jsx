import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function HomePlaceholder() {
  const { user, loading, isAuthenticated, logout } = useAuth()

  if (loading) return <p style={{ padding: 24 }}>Đang kiểm tra phiên đăng nhập...</p>

  return (
    <div style={{ padding: 24 }}>
      <h1>Trang chủ (tạm)</h1>
      {isAuthenticated ? (
        <>
          <p>Xin chào <b>{user.displayName}</b> (@{user.username})</p>
          <pre>{JSON.stringify(user, null, 2)}</pre>
          <button onClick={logout}>Đăng xuất</button>
        </>
      ) : (
        <>
          <p>Chưa đăng nhập</p>
          <Link to="/register">Đăng ký</Link> | <Link to="/login">Đăng nhập</Link>
        </>
      )}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/" element={<HomePlaceholder />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}