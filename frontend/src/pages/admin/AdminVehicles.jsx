import { useState, useEffect } from 'react'
import { Plus, UserPlus, Trash2 } from 'lucide-react'
import AdminTopbar from '../../components/AdminTopbar.jsx'
import Modal from '../../components/Modal.jsx'
import FormField from '../../components/FormField.jsx'
import { useAuth } from '../../context/AuthContextInstance.js'
import { useVehicles } from '../../context/VehicleContextInstance.js'

const emptyForm = { name: '', macAddress: '', targetUserId: '' }

export default function AdminVehicles() {
  const { accounts, user } = useAuth()
  
  // 🔥 CẬP NHẬT: Lấy thêm hàm fetchAllVehicles và removeVehicle từ context
  const { vehicles, loading, fetchAllVehicles, addVehicle, removeVehicle } = useVehicles()
  
  // Lọc danh sách người dùng thông thường để gán xe
  const users = accounts.filter((a) => a.role !== 'admin')

  // Quản lý modal: null hoặc 'add'
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)

  // 🔥 CẬP NHẬT: Kích hoạt đồng bộ hóa toàn bộ dữ liệu xe khi Admin truy cập trang
  useEffect(() => {
    if (user && user.id) {
      fetchAllVehicles(user.id)
    }
  }, [user])

  const userName = (id) => users.find((u) => u.id === Number(id) || u.id === id)?.fullName ?? `User #${id}`

  const openAdd = () => {
    setForm(emptyForm)
    setModal('add')
  }
  const closeModal = () => setModal(null)

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmitVehicle = async (e) => {
    e.preventDefault()
    if (!form.targetUserId) {
      alert('Vui lòng chọn chủ sở hữu cho thiết bị!')
      return
    }

    // Khớp cấu trúc addVehicle(data, userId) của VehicleContext
    const success = await addVehicle(
      { name: form.name, macAddress: form.macAddress },
      form.targetUserId
    )
    if (success) {
      closeModal()
    }
  }

  const handleDelete = async (dbId, ownerId) => {
    // Nếu xe không có ownerId (thiết bị hệ thống), dự phòng bằng ID admin hoặc 0 tùy backend
    const targetOwnerId = ownerId || user.id 
    
    await removeVehicle(dbId, targetOwnerId)
  }

  return (
    <div className="dash-shell">
      <AdminTopbar />

      <main className="dash-main">
        <div className="admin-header-row">
          <div>
            <span className="eyebrow">QUẢN TRỊ</span>
            <h1 className="dash-title">Quản lý thiết bị IoT</h1>
            <p className="dash-subtitle">
              Đăng ký xe mới vào hệ thống và kích hoạt quyền sở hữu trực tiếp cho người dùng.
            </p>
          </div>
          <button className="btn-primary btn-card admin-add-btn" type="button" onClick={openAdd}>
            <Plus size={16} strokeWidth={2} />
            Đăng ký xe mới
          </button>
        </div>

        <div className="table-card">
          {loading && vehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Đang đồng bộ dữ liệu thiết bị toàn hệ thống...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên thiết bị</th>
                  <th>Địa chỉ MAC (ID WebSocket)</th>
                  <th>Database ID</th>
                  <th>Trạng thái kết nối</th>
                  <th>Chủ sở hữu (Owner)</th>
                  <th>Tài xế phụ được chia sẻ</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500 }}>{v.name}</td>
                    <td className="mono-cell" style={{ color: 'var(--txt-primary)', fontWeight: 500 }}>
                      {v.id}
                    </td>
                    <td className="mono-cell">{v.dbId}</td>
                    <td>
                      {/* 🔥 CẬP NHẬT: Kiểm tra chính xác trạng thái ONLINE của phần cứng dựa vào connectionStatus */}
                      <span className={`status-badge ${v.connectionStatus === 'ONLINE' ? 'badge-cyan' : 'badge-neutral'}`}>
                        {v.connectionStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {v.assignedTo ? userName(v.assignedTo) : <span className="text-faint">Hệ thống</span>}
                    </td>
                    <td>
                      {v.sharedDrivers && v.sharedDrivers.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {v.sharedDrivers.map(driverId => (
                            <span key={driverId} className="status-badge badge-neutral">
                              {userName(driverId)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    {/* 🔥 CẬP NHẬT: Thêm cột nút bấm xóa phần cứng */}
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-icon text-danger" 
                        title="Xóa thiết bị khỏi hệ thống"
                        onClick={() => handleDelete(v.dbId, v.assignedTo)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-note">
                      Chưa có thiết bị nào được đăng ký trong hệ thống.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {modal === 'add' && (
          <Modal title="Đăng ký thiết bị IoT mới" onClose={closeModal}>
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

              <label className="field">
                <span className="field-label">Chỉ định chủ sở hữu (Owner)</span>
                <select
                  className="plain-select"
                  name="targetUserId"
                  value={form.targetUserId}
                  onChange={handleFormChange}
                  required
                >
                  <option value="" disabled>
                    -- Chọn tài khoản khách hàng --
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
              </label>

              <div className="profile-edit-actions" style={{ marginTop: '24px' }}>
                <button className="btn-outline btn-neutral" type="button" onClick={closeModal}>
                  Hủy
                </button>
                <button className="btn-primary btn-card" type="submit">
                  <UserPlus size={16} /> Kiêm gán & Kích hoạt
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  )
}