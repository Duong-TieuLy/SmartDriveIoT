import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Users, Car } from 'lucide-react'
import { useAuth } from '../context/AuthContextInstance'

export default function AdminTopbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  const initials = user.fullName
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <header className="app-topbar app-topbar-admin">
      <div className="topbar-brand">
        <span className="brand-mark">AUTOX</span>
        <span className="admin-tag">QUẢN TRỊ</span>
      </div>

      <nav className="topbar-nav">
        <NavLink
          to="/admin/users"
          className={({ isActive }) => `topbar-link ${isActive ? 'is-active' : ''}`}
        >
          <Users size={17} strokeWidth={1.75} />
          <span className="topbar-link-text">Quản lý người dùng</span>
        </NavLink>
        <NavLink
          to="/admin/vehicles"
          className={({ isActive }) => `topbar-link ${isActive ? 'is-active' : ''}`}
        >
          <Car size={17} strokeWidth={1.75} />
          <span className="topbar-link-text">Quản lý xe</span>
        </NavLink>
      </nav>

      <div className="topbar-actions">
        <span className="topbar-user">
          <span className="dash-avatar dash-avatar-admin">{initials}</span>
          <span className="topbar-user-info">
            <span className="dash-user-name">{user.fullName}</span>
            <span className="topbar-user-role">Quản trị viên</span>
          </span>
        </span>

        <button className="icon-btn" type="button" aria-label="Đăng xuất" onClick={handleLogout}>
          <LogOut size={18} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}
