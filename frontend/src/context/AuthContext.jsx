import { createContext, useContext, useEffect, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext(null)
const TOKEN_KEY = 'autox_token'
const API_BASE_URL = import.meta.env.VITE_API_URL

function getUserFromToken(token) {
  if (!token) return null
  try {
    const decoded = jwtDecode(token)
    return {
      id: decoded.userId, 
      email: decoded.sub,  
      fullName: decoded.fullName || decoded.name || 'Người dùng',
      role: decoded.role?.toLowerCase() || 'user', 
    }
  } catch (error) {
    console.error('Lỗi giải mã token:', error)
    return null
  }
}
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [user, setUser] = useState(() => getUserFromToken(localStorage.getItem(TOKEN_KEY)))
  // Thêm state lưu danh sách accounts quản trị từ API
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token)
        // Khi có token (đăng nhập thành công), nếu là admin thì tự động fetch danh sách user
        if (user?.role === 'admin') {
          fetchAccounts()
        }
      } else {
        localStorage.removeItem(TOKEN_KEY)
        setAccounts([])
      }
    } catch (e) {
      console.warn("localStorage bị chặn:", e)
    }
  }, [token, user?.role])

  // Hàm lấy danh sách tất cả account từ backend (Dành cho Admin)
  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'any-value-here'
       }
      })
      if (response.ok) {
        const data = await response.json() // Xử lý JSON từ backend
        setAccounts(data)
      }
    } catch (err) {
      console.error('Lỗi tải danh sách tài khoản:', err)
    }
  }

  // Hàm Đăng Nhập (Tương thích cả Plain Text lẫn JSON Object)
const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      // Nếu lỗi, thử đọc JSON xem có thông báo lỗi không, không thì trả về câu mặc định
      try {
        const errorData = await response.json()
        return { ok: false, error: errorData.message || 'Email hoặc mật khẩu không chính xác.' }
      } catch {
        return { ok: false, error: 'Email hoặc mật khẩu không chính xác.' }
      }
    }

    // Đọc phản hồi dưới dạng chuỗi trước để tránh crash
    const responseText = await response.text()
    let jwtToken = ''

    try {
      // Thử parse xem có phải JSON Object không (Trường hợp: { token: "ey..." })
      const data = JSON.parse(responseText)
      jwtToken = data.token || data.accessToken || responseText
    } catch {
      // Nếu parse lỗi -> Bản chất backend trả về chuỗi token thuần
      jwtToken = responseText
    }

    const decodedUser = getUserFromToken(jwtToken)

    if (!decodedUser) {
      return { ok: false, error: 'Token phản hồi không hợp lệ.' }
    }

    setToken(jwtToken)
    setUser(decodedUser)
    return { ok: true, user: decodedUser }
  } catch (err) {
    console.error('Lỗi kết nối login:', err)
    return { ok: false, error: 'Không thể kết nối tới máy chủ.' }
  }
}
  // Hàm Đăng Ký (Tương thích cả Plain Text lẫn JSON Object từ backend)
const register = async ({ fullName, email, password }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password }),
    })

    // Đọc phản hồi dưới dạng chuỗi thô trước để tránh crash chữ 'Đ'
    const responseText = await response.text()

    if (!response.ok) {
      try {
        // Nếu backend trả về JSON lỗi (ví dụ: { "message": "Email đã tồn tại" })
        const errorData = JSON.parse(responseText)
        return { ok: false, error: errorData.message || 'Đăng ký thất bại.' }
      } catch {
        // Nếu backend trả về chuỗi text thô khi lỗi
        return { ok: false, error: responseText || 'Đăng ký thất bại.' }
      }
    }

    try {
      // Trường hợp backend trả về JSON thành công (ví dụ: { "message": "Thành công" })
      const data = JSON.parse(responseText)
      return { ok: true, message: data.message || 'Đăng ký thành công.' }
    } catch {
      // Trường hợp backend trả về chuỗi text thô thành công (ví dụ: "Đăng ký tài khoản thành công")
      return { ok: true, message: responseText || 'Đăng ký thành công.' }
    }
  } catch (err) {
    console.error('Lỗi kết nối register:', err)
    return { ok: false, error: 'Không thể kết nối tới máy chủ.' }
  }
}

  // Hàm Xóa Tài Khoản qua API Backend
  const removeAccount = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id))
        return { ok: true }
      }
      return { ok: false, error: data.message || 'Xóa thất bại.' }
    } catch (err) {
      console.error('Lỗi xóa tài khoản:', err)
      return { ok: false, error: 'Lỗi kết nối mạng.' }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, accounts, login, register, logout, removeAccount, fetchAccounts }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>')
  return ctx
}