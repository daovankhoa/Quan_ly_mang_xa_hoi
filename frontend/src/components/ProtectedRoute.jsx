import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p style={{ padding: 24 }}>Đang tải...</p>

  if (!isAuthenticated) {
    // lưu lại trang đang muốn vào, đăng nhập xong sẽ quay lại đúng chỗ đó
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}