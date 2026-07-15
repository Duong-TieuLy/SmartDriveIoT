import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Bell, LayoutGrid, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContextInstance.js'
import { ROLE_LABEL } from '../data/user.js'

export default function AppTopbar() {
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
    <header className="app-topbar">
      <div className="topbar-brand">
        <span className="brand-mark">AUTOX</span>
      </div>

      <nav className="topbar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `topbar-link ${isActive ? 'is-active' : ''}`}
        >
          <LayoutGrid size={17} strokeWidth={1.75} />
          <span className="topbar-link-text">Bảng điều khiển</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => `topbar-link ${isActive ? 'is-active' : ''}`}
        >
          <UserRound size={17} strokeWidth={1.75} />
          <span className="topbar-link-text">Thông tin cá nhân</span>
        </NavLink>
      </nav>

      <div className="topbar-actions">
        <button className="icon-btn" type="button" aria-label="Thông báo">
          <Bell size={18} strokeWidth={1.75} />
        </button>

        <NavLink to="/profile" className="topbar-user">
          <span className="dash-avatar">{initials}</span>
          <span className="topbar-user-info">
            <span className="dash-user-name">{user.fullName}</span>
            <span className="topbar-user-role">{ROLE_LABEL[user.role] ?? user.role}</span>
          </span>
        </NavLink>

        <button className="icon-btn" type="button" aria-label="Đăng xuất" onClick={handleLogout}>
          <LogOut size={18} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}
