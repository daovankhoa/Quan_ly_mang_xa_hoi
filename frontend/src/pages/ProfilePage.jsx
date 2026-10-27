import { useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { updateAvatar } from '../services/userApi'
import { getErrorMessage } from '../services/api'
import Avatar from '../components/Avatar'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  if (loading) return <p style={{ padding: 24 }}>Đang tải...</p>
  if (!user) return <Navigate to="/login" replace />

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // cho phép chọn lại cùng một file
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      return setError('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP')
    }
    if (file.size > MAX_SIZE) {
      return setError('Ảnh không được vượt quá 5MB')
    }

    setError('')
    setUploading(true)
    try {
      const data = await updateAvatar(file)
      updateUser(data.user)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <Avatar user={user} size={120} />
        <h1>{user.displayName}</h1>
        <p className="auth-subtitle">@{user.username}</p>

        {error && <div className="alert alert-error">{error}</div>}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          hidden
        />
        <button
          className="btn-primary"
          style={{ maxWidth: 220 }}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}
        </button>

        <p className="auth-footer">
          <Link to="/">← Về trang chủ</Link>
        </p>
      </div>
    </div>
  )
}