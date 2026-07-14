import { useState } from 'react'
import { Mail, Phone, User, Shield, Pencil, X, Check } from 'lucide-react'
import AppTopbar from '../components/AppTopbar.jsx'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLE_LABEL } from '../data/user.js'

export default function Profile() {
  const { user, updateAccount } = useAuth()
  const [mode, setMode] = useState('view') // 'view' | 'edit'
  const [draft, setDraft] = useState(user)
  const [saved, setSaved] = useState(false)

  if (!user) return null

  const initials = user.fullName
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const startEdit = () => {
    setDraft(user)
    setSaved(false)
    setMode('edit')
  }

  const cancelEdit = () => {
    setMode('view')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setDraft((d) => ({ ...d, [name]: value }))
  }

  const handleSave = (e) => {
    e.preventDefault()
    // TODO: gọi API cập nhật thông tin thực tế, ví dụ PUT /api/users/me
    updateAccount(user.id, draft)
    setMode('view')
    setSaved(true)
  }

  return (
    <div className="dash-shell">
      <AppTopbar />

      <main className="dash-main profile-main">
        <span className="eyebrow">TÀI KHOẢN</span>
        <h1 className="dash-title">Thông tin cá nhân</h1>
        <p className="dash-subtitle" style={{ marginBottom: 28 }}>
          Xem hoặc cập nhật thông tin liên hệ dùng để đăng nhập và xác thực trong hệ thống AUTOX.
        </p>

        <div className="profile-card">
          <div className="profile-head">
            <span className="profile-avatar-lg">{initials}</span>
            <div>
              <h2>{user.fullName}</h2>
              <span className="role-pill">{ROLE_LABEL[user.role]}</span>
            </div>
            {mode === 'view' && (
              <button className="btn-outline btn-neutral btn-edit" type="button" onClick={startEdit}>
                <Pencil size={15} strokeWidth={1.75} />
                Chỉnh sửa
              </button>
            )}
          </div>

          {mode === 'view' ? (
            <ul className="profile-info-list">
              <li>
                <User size={16} strokeWidth={1.75} />
                Họ và tên
                <span>{user.fullName}</span>
              </li>
              <li>
                <Mail size={16} strokeWidth={1.75} />
                Email
                <span>{user.email}</span>
              </li>
              {/* <li>
                <Phone size={16} strokeWidth={1.75} />
                Số điện thoại
                <span>{user.phone || '—'}</span>
              </li> */}
              <li>
                <Shield size={16} strokeWidth={1.75} />
                Vai trò
                <span>{ROLE_LABEL[user.role]}</span>
              </li>
            </ul>
          ) : (
            <form className="auth-form" onSubmit={handleSave}>
              <FormField
                label="Họ và tên"
                name="fullName"
                icon={User}
                value={draft.fullName}
                onChange={handleChange}
                autoComplete="name"
              />
              <FormField
                label="Email"
                name="email"
                type="email"
                icon={Mail}
                value={draft.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {/* <FormField
                label="Số điện thoại"
                name="phone"
                icon={Phone}
                value={draft.phone}
                onChange={handleChange}
                autoComplete="tel"
              /> */}

              <div className="profile-edit-actions">
                <button className="btn-outline btn-neutral" type="button" onClick={cancelEdit}>
                  <X size={15} strokeWidth={1.75} />
                  Hủy
                </button>
                <button className="btn-primary btn-card" type="submit">
                  <Check size={15} strokeWidth={1.75} />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}

          {saved && mode === 'view' && (
            <p className="profile-saved-note">Đã lưu thay đổi thông tin cá nhân.</p>
          )}
        </div>
      </main>
    </div>
  )
}
