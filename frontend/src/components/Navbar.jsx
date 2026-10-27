import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Avatar from './Avatar'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Social
        </Link>

        <div className="navbar-actions">
          <Link to="/profile" className="navbar-user">
            <Avatar user={user} size={32} />
            <span>{user?.displayName}</span>
          </Link>
          <button className="btn-ghost" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  )
}