// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Clock3, Zap, Search, Share2, PlusCircle } from 'lucide-react'
import AppTopbar from '../components/AppTopbar.jsx'
import VehicleCard from '../components/VehicleCard.jsx'
import { useAuth } from '../context/AuthContextInstance.js'
import { useVehicles } from '../context/VehicleContextInstance.js'
import Modal from '../components/Modal.jsx' 
import FormField from '../components/FormField.jsx'

const emptyForm = { name: '', macAddress: '' }

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const { 
    vehicles, 
    fetchUserVehiclesCombined, 
    requestVehicle,
    addVehicle
  } = useVehicles()
  
  const [query, setQuery] = useState('')
  const [shareTarget, setShareTarget] = useState(null)
  const [driverEmail, setDriverEmail] = useState('')

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (user && user.id) {
      fetchUserVehiclesCombined(user.id)
    }
  }, [user?.id])

  const handleOpenShareModal = (vehicle) => {
    setShareTarget(vehicle)
    setDriverEmail('')
  }

  const handleCloseShareModal = () => {
    setShareTarget(null)
    setDriverEmail('')
  }

  const handleConfirmShare = async (e) => {
    e.preventDefault()
    if (!driverEmail.trim() || !shareTarget) return

    await requestVehicle(shareTarget.dbId, user.id, driverEmail.trim())
    handleCloseShareModal()
  }

  const openRegister = () => {
    setForm(emptyForm)
    setModal('register')
  }
  const closeRegisterModal = () => {
    setModal(null)
    setForm(emptyForm)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmitVehicle = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.macAddress.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin thiết bị!')
      return
    }

    const success = await addVehicle(
      { name: form.name, macAddress: form.macAddress },
      user.id
    )
    if (success) {
      closeRegisterModal()
    }
  }

  const handleUse = (macAddress) => {
    navigate(`/vehicle/${macAddress}`) 
  }

  const viewVehicles = useMemo(() => {
    if (!user || !user.id) return vehicles;

    return vehicles.map((v) => {
      const currentUserId = Number(user.id);
      const assignedTo = Number(v.assignedTo);
      const drivers = Array.isArray(v.sharedDrivers) 
        ? v.sharedDrivers.map(Number) 
        : [];
        
      const isOwner = assignedTo === currentUserId;
      const isShared = drivers.includes(currentUserId);

      return {
        ...v,
        status: (isOwner || isShared) ? 'available' : 'locked',
        requestStatus: v.requestedBy === user.id ? v.requestStatus : 'none',
      };
    });
  }, [vehicles, user?.id]);

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
          <div className="dash-hero-top">
            <div>
              <span className="eyebrow">BẢNG ĐIỀU KHIỂN</span>
              <h1 className="dash-title">Chào mừng trở lại</h1>
              <p className="dash-subtitle">
                Chọn xe khả dụng để bắt đầu chuyến đi, hoặc chia sẻ quyền sử dụng xe với các tài xế khác.
              </p>
            </div>
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
                <span className="stat-label">Tổng số xe liên kết</span>
              </div>
            </div>
          </div>
        </section>

        {/* 🔥 CẬP NHẬT: thanh tìm kiếm + nút Thêm xe nằm chung một hàng */}
        <div className="dash-toolbar">
          <label className="dash-search dash-search-standalone">
            <Search size={16} strokeWidth={1.75} />
            <input
              placeholder="Tìm xe theo tên, biển số, khu vực…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <button className="btn-add-vehicle" type="button" onClick={openRegister}>
            <PlusCircle size={16} strokeWidth={2} />
            Thêm xe
          </button>
        </div>

        <>
          <section className="dash-section">
            <div className="section-heading">
              <h2>Xe bạn có thể sử dụng</h2>
              <span className="section-count">{available.length} xe</span>
            </div>
            {available.length === 0 ? (
              <p className="empty-note">Không tìm thấy xe khả dụng hoặc xe được chia sẻ phù hợp.</p>
            ) : (
              <div className="vehicle-grid">
                {available.map((v) => (
                  <VehicleCard 
                    key={v.id} 
                    vehicle={v} 
                    onUse={() => handleUse(v.id)} 
                    onRequest={
                      Number(v.assignedTo) === Number(user.id) 
                        ? () => handleOpenShareModal(v) 
                        : undefined
                    }
                  />
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
                  <VehicleCard key={v.id} vehicle={v} onRequest={() => handleRequest(v.dbId)} />
                ))}
              </div>
            )}
          </section>
        </>

        {modal === 'register' && (
          <Modal title="Đăng ký thiết bị IoT mới" onClose={closeRegisterModal}>
            <form className="auth-form" onSubmit={handleSubmitVehicle}>
              <FormField
                label="Tên thiết bị / Tên xe"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Ví dụ: Xe tự hành AutoX S1"
                required
              />
              <FormField
                label="Địa chỉ MAC (MAC Address)"
                name="macAddress"
                value={form.macAddress}
                onChange={handleFormChange}
                placeholder="Ví dụ: 24:0A:C4:X5:Y6:Z7"
                required
              />

              <div className="profile-edit-actions" style={{ marginTop: '24px' }}>
                <button className="btn-outline btn-neutral" type="button" onClick={closeRegisterModal}>
                  Hủy
                </button>
                <button className="btn-primary dash-register-btn" type="submit">
                  <PlusCircle size={17} strokeWidth={2} />
                  Đăng ký xe mới
                </button>
              </div>
            </form>
          </Modal>
        )}

        {shareTarget && (
          <Modal title="Chia sẻ quyền sử dụng xe" onClose={handleCloseShareModal}>
            <form className="auth-form" onSubmit={handleConfirmShare}>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--txt-secondary, #94a3b8)' }}>
                Bạn đang thực hiện chia sẻ quyền điều khiển thiết bị:{' '}
                <strong style={{ color: 'var(--txt-primary, #fff)' }}>{shareTarget.name}</strong> 
                ({shareTarget.plate || 'Chưa có biển số'})
              </div>

              <FormField
                label="Email người nhận chia sẻ"
                name="driverEmail"
                type="email"
                value={driverEmail}
                onChange={(e) => setDriverEmail(e.target.value)}
                placeholder="Nhập chính xác email của tài xế phụ..."
                required
              />

              <div className="profile-edit-actions" style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn-outline btn-neutral" type="button" onClick={handleCloseShareModal}>
                  Hủy bỏ
                </button>
                <button className="btn-primary btn-card" type="submit" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Share2 size={16} /> Xác nhận chia sẻ
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  )
}