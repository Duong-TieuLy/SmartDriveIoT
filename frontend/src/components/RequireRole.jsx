import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContextInstance'

/**
 * Chỉ cho phép người dùng có đúng `role` truy cập route con.
 * - Chưa đăng nhập -> đưa về /login.
 * - Đăng nhập sai role -> đưa về khu vực tương ứng với role thật của họ,
 *   thay vì cho lọt vào khu vực không thuộc quyền.
 */
export default function RequireRole({ role, children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/users' : '/dashboard'} replace />
  }
  return children
}
