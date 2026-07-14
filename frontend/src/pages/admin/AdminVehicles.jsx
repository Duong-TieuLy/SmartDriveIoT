import { useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import AdminTopbar from '../../components/AdminTopbar.jsx'
import Modal from '../../components/Modal.jsx'
import FormField from '../../components/FormField.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useVehicles } from '../../context/VehicleContext.jsx'

const emptyForm = { name: '', macAddress: '', targetUserId: '' }

export default function AdminVehicles() {
  const { accounts } = useAuth()
  const { vehicles, addVehicle } = useVehicles()
  
  // Lọc danh sách người dùng thông thường để gán xe
  const users = accounts.filter((a) => a.role !== 'admin')

  // Quản lý modal: null hoặc 'add'
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const userName = (id) => users.find((u) => u.id === id)?.fullName ?? `User #${id}`

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
    await addVehicle(
      { name: form.name, macAddress: form.macAddress },
      form.targetUserId
    )
    closeModal()
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
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên thiết bị</th>
                <th>Địa chỉ MAC (ID WebSocket)</th>
                <th>Database ID</th>
                <th>Trạng thái kết nối</th>
                <th>Chủ sở hữu (Owner)</th>
                <th>Tài xế phụ được chia sẻ</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>{v.name}</td>
                  <td className="mono-cell" style={{ color: 'var(--txt-primary)', fontWeight: 500 }}>
                    {v.id}
                  </td>
                  <td className="mono-cell">{v.dbId}</td>
                  <td>
                    <span className={`status-badge ${v.status === 'available' ? 'badge-cyan' : 'badge-neutral'}`}>
                      {v.status === 'available' ? 'ONLINE' : 'OFFLINE'}
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
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-note">
                    Chưa có thiết bị nào được đăng ký trong hệ thống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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