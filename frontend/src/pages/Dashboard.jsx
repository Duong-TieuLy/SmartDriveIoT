import { useEffect, useMemo, useState } from 'react' // 🔥 Đã thêm useEffect vào đây
import { useNavigate } from 'react-router-dom'
import { Car, Clock3, Zap, Search } from 'lucide-react'
import AppTopbar from '../components/AppTopbar.jsx'
import VehicleCard from '../components/VehicleCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useVehicles } from '../context/VehicleContext.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { vehicles, fetchMyVehicles, requestVehicle, loading } = useVehicles() // 🔥 Thêm requestVehicle từ context
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (user && user.id) {
      fetchMyVehicles(user.id)
    }
  }, [user])

  const handleRequest = (dbId) => {
    // dbId là ID dạng Long từ cơ sở dữ liệu để gửi lên API chia sẻ
    const targetEmail = prompt("Nhập Email của tài xế bạn muốn chia sẻ quyền sử dụng xe này:")
    if (targetEmail && targetEmail.trim()) {
      requestVehicle(dbId, user.id, targetEmail.trim())
    }
  }

  const handleUse = (macAddress) => {
    // macAddress (ví dụ: ESP32-TEST-MAC) được dùng làm ID định danh để kết nối WebSocket ở màn hình điều khiển
    navigate(`/vehicle/${macAddress}`) 
  }

  // Chuyển dữ liệu xe thực tế từ Spring Boot thành góc nhìn của riêng người dùng đang đăng nhập
  const viewVehicles = useMemo(
    () =>
      vehicles.map((v) => {
        // Kiểm tra xem user hiện tại có phải chủ xe (owner) hoặc là driver được chia sẻ (sharedDrivers) hay không
        const isOwner = v.assignedTo === user.id
        const isShared = v.sharedDrivers && v.sharedDrivers.includes(user.id)
        
        return {
          ...v,
          // Nếu là chủ xe hoặc người được chia sẻ -> trạng thái là 'available' để sử dụng
          status: (isOwner || isShared) ? 'available' : 'locked',
          requestStatus: v.requestedBy === user.id ? v.requestStatus : 'none',
        }
      }),
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
              Chọn xe khả dụng để bắt đầu chuyến đi, hoặc chia sẻ quyền sử dụng xe với các tài xế khác.
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
                <span className="stat-label">Tổng số xe của bạn</span>
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Đang đồng bộ dữ liệu thiết bị...
          </div>
        ) : (
          <>
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
                    // Truyền v.id (chính là macAddress) vào hàm onUse
                    <VehicleCard key={v.id} vehicle={v} onUse={() => handleUse(v.id)} />
                  ))}
                </div>
              )}
            </section>

            <section className="dash-section">
              <div className="section-heading">
                <h2>Thiết bị khác (Cần chia sẻ)</h2>
                <span className="section-count">{restricted.length} xe</span>
              </div>
              {restricted.length === 0 ? (
                <p className="empty-note">Không có thiết bị nào bị giới hạn quyền truy cập.</p>
              ) : (
                <div className="vehicle-grid">
                  {restricted.map((v) => (
                    // Truyền v.dbId (id kiểu Long) vào hàm onRequest phục vụ API share của Spring Boot
                    <VehicleCard key={v.id} vehicle={v} onRequest={() => handleRequest(v.dbId)} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}