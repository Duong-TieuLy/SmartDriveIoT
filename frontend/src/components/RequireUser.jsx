import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContextInstance'

/**
 * Bảo vệ các trang dành cho người dùng thường (Dashboard, chi tiết xe, hồ sơ).
 * - Chưa đăng nhập -> đưa về /login.
 * - Đăng nhập bằng tài khoản admin -> đưa thẳng về khu quản trị, vì các
 *   trang này không áp dụng cho vai trò admin.
 */
export default function RequireUser({ children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin/users" replace />
  return children
}
