import { createContext, useContext, useEffect, useState } from 'react'
import { mockAccounts } from '../data/accounts.js'

const AuthContext = createContext(null)
const SESSION_KEY = 'autox_session'
const ACCOUNTS_KEY = 'autox_accounts'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

/**
 * Quản lý phiên đăng nhập + "cơ sở dữ liệu" tài khoản mẫu (lưu tạm ở
 * localStorage để demo không cần backend). Khi tích hợp API thật:
 * - login/register gọi thẳng endpoint tương ứng, bỏ hẳn mảng `accounts`.
 * - Không lưu mật khẩu ở phía client — role và thông tin phiên nên do
 *   backend trả về sau khi xác thực.
 */
export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState(() => readJSON(ACCOUNTS_KEY, mockAccounts))
  const [user, setUser] = useState(() => readJSON(SESSION_KEY, null))

  useEffect(() => {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage (chế độ ẩn danh...)
    }
  }, [accounts])

  useEffect(() => {
    try {
      if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage
    }
  }, [user])

  const login = (email, password) => {
    const account = accounts.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
    )
    if (!account) return { ok: false }
    const { password: _pw, ...safeAccount } = account
    setUser(safeAccount)
    return { ok: true, user: safeAccount }
  }

  const register = ({ fullName, email, password, role }) => {
    const emailNorm = email.trim().toLowerCase()
    if (accounts.some((a) => a.email.toLowerCase() === emailNorm)) {
      return { ok: false, error: 'Email này đã được sử dụng.' }
    }
    const account = {
      id: `acc-${Date.now()}`,
      fullName,
      email,
      password,
      role, // 'passenger' | 'operator' — tài khoản admin không tự đăng ký được
      phone: '',
    }
    setAccounts((prev) => [...prev, account])
    const { password: _pw, ...safeAccount } = account
    setUser(safeAccount)
    return { ok: true, user: safeAccount }
  }

  const logout = () => setUser(null)

  const removeAccount = (id) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  const updateAccount = (id, updates) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)))
    setUser((u) => (u && u.id === id ? { ...u, ...updates } : u))
  }

  return (
    <AuthContext.Provider
      value={{ user, accounts, login, register, logout, removeAccount, updateAccount }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>')
  return ctx
}
