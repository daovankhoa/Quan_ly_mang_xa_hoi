export default function Avatar({ user, size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.4 }

  if (user?.avatar) {
    return (
      <img
        className="avatar"
        src={user.avatar}
        alt={user.displayName}
        style={style}
      />
    )
  }

  return (
    <div className="avatar avatar-fallback" style={style}>
      {user?.displayName?.charAt(0).toUpperCase() || '?'}
    </div>
  )
}