import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Clock3, Zap, Search } from 'lucide-react'
import AppTopbar from '../components/AppTopbar.jsx'
import VehicleCard from '../components/VehicleCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useVehicles } from '../context/VehicleContext.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { vehicles, requestVehicle } = useVehicles()
  const [query, setQuery] = useState('')

  const handleRequest = (id) => {
    requestVehicle(id, user.id)
  }

  const handleUse = (id) => {
    navigate(`/vehicle/${id}`)
  }

  // Chuyển dữ liệu xe "khách quan" (assignedTo/requestedBy) thành góc nhìn
  // của riêng người dùng đang đăng nhập, để tái dùng nguyên VehicleCard.
  const viewVehicles = useMemo(
    () =>
      vehicles.map((v) => ({
        ...v,
        status: v.assignedTo === user.id ? 'available' : 'locked',
        requestStatus: v.requestedBy === user.id ? v.requestStatus : 'none',
      })),
    [vehicles, user.id],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return viewVehicles
    return viewVehicles.filter((v) =>
      [v.name, v.plate, v.location].join(' ').toLowerCase().includes(q),
    )
  }, [viewVehicles, query])

  const available = filtered.filter((v) => v.status === 'available')
  const restricted = filtered.filter((v) => v.status === 'locked')

  const stats = {
    availableCount: viewVehicles.filter((v) => v.status === 'available').length,
    pendingCount: viewVehicles.filter((v) => v.requestStatus === 'pending').length,
    fleetCount: viewVehicles.length,
  }

  return (
    <div className="dash-shell">
      <AppTopbar />

      <main className="dash-main">
        <section className="dash-hero">
          <div>
            <span className="eyebrow">BẢNG ĐIỀU KHIỂN</span>
            <h1 className="dash-title">Chào mừng trở lại</h1>
            <p className="dash-subtitle">
              Chọn xe khả dụng để bắt đầu chuyến đi, hoặc gửi yêu cầu quyền sử dụng cho các xe
              khác trong đội.
            </p>
          </div>

          <div className="dash-stats">
            <div className="stat-card">
              <span className="stat-icon">
                <Car size={18} strokeWidth={1.75} />
              </span>
              <div className="stat-text">
                <span className="stat-value">{stats.availableCount}</span>
                <span className="stat-label">Xe có thể sử dụng</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon stat-icon-amber">
                <Clock3 size={18} strokeWidth={1.75} />
              </span>
              <div className="stat-text">
                <span className="stat-value">{stats.pendingCount}</span>
                <span className="stat-label">Yêu cầu đang chờ</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">
                <Zap size={18} strokeWidth={1.75} />
              </span>
              <div className="stat-text">
                <span className="stat-value">{stats.fleetCount}</span>
                <span className="stat-label">Tổng số xe trong đội</span>
              </div>
            </div>
          </div>
        </section>

        <label className="dash-search dash-search-standalone">
          <Search size={16} strokeWidth={1.75} />
          <input
            placeholder="Tìm xe theo tên, biển số, khu vực…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <section className="dash-section">
          <div className="section-heading">
            <h2>Xe bạn có thể sử dụng</h2>
            <span className="section-count">{available.length} xe</span>
          </div>
          {available.length === 0 ? (
            <p className="empty-note">Không tìm thấy xe khả dụng phù hợp.</p>
          ) : (
            <div className="vehicle-grid">
              {available.map((v) => (
                <VehicleCard key={v.id} vehicle={v} onUse={handleUse} />
              ))}
            </div>
          )}
        </section>

        <section className="dash-section">
          <div className="section-heading">
            <h2>Xe cần yêu cầu quyền sử dụng</h2>
            <span className="section-count">{restricted.length} xe</span>
          </div>
          {restricted.length === 0 ? (
            <p className="empty-note">Không có xe nào cần yêu cầu quyền truy cập.</p>
          ) : (
            <div className="vehicle-grid">
              {restricted.map((v) => (
                <VehicleCard key={v.id} vehicle={v} onRequest={handleRequest} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
