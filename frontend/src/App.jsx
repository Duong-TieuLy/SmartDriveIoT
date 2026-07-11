import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import VehicleDetail from './pages/VehicleDetail.jsx'
import Profile from './pages/Profile.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import AdminVehicles from './pages/admin/AdminVehicles.jsx'
import RequireUser from './components/RequireUser.jsx'
import RequireRole from './components/RequireRole.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* AuthPage tự xử lý cả đăng nhập lẫn đăng ký bằng tab, nên /register
          chỉ cần trỏ về cùng một trang thay vì có component riêng. */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />

      {/* Khu vực User — mọi tài khoản không phải admin đều truy cập được */}
      <Route
        path="/dashboard"
        element={
          <RequireUser>
            <Dashboard />
          </RequireUser>
        }
      />
      <Route
        path="/vehicle/:id"
        element={
          <RequireUser>
            <VehicleDetail />
          </RequireUser>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireUser>
            <Profile />
          </RequireUser>
        }
      />

      {/* Khu vực Admin — chỉ tài khoản đúng role admin mới vào được */}
      <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
      <Route
        path="/admin/users"
        element={
          <RequireRole role="admin">
            <AdminUsers />
          </RequireRole>
        }
      />
      <Route
        path="/admin/vehicles"
        element={
          <RequireRole role="admin">
            <AdminVehicles />
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
