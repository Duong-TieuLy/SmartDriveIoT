import { useState } from 'react'
import { Plus, Pencil, UserPlus, UserMinus } from 'lucide-react'
import AdminTopbar from '../../components/AdminTopbar.jsx'
import Modal from '../../components/Modal.jsx'
import FormField from '../../components/FormField.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useVehicles } from '../../context/VehicleContext.jsx'

const CONDITION_LABEL = { good: 'Tốt', check: 'Cần kiểm tra', error: 'Sự cố' }
const CONDITION_BADGE = { good: 'badge-cyan', check: 'badge-amber', error: 'badge-danger' }

const emptyForm = { name: '', plate: '', location: '', distance: '', battery: 80, condition: 'good' }

export default function AdminVehicles() {
  const { accounts } = useAuth()
  const { vehicles, addVehicle, updateVehicle, assignVehicle, revokeVehicle } = useVehicles()
  const users = accounts.filter((a) => a.role !== 'admin')

  // modal: null | 'add' | { type: 'edit', id } | { type: 'assign', id }
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [assignUserId, setAssignUserId] = useState('')

  const userName = (id) => users.find((u) => u.id === id)?.fullName ?? null

  const openAdd = () => {
    setForm(emptyForm)
    setModal('add')
  }
  const openEdit = (v) => {
    setForm({
      name: v.name,
      plate: v.plate,
      location: v.location,
      distance: v.distance,
      battery: v.battery,
      condition: v.condition,
    })
    setModal({ type: 'edit', id: v.id })
  }
  const openAssign = (v) => {
    setAssignUserId('')
    setModal({ type: 'assign', id: v.id })
  }
  const closeModal = () => setModal(null)

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: name === 'battery' ? Number(value) : value }))
  }

  const handleSubmitVehicle = (e) => {
    e.preventDefault()
    if (modal === 'add') {
      addVehicle(form)
    } else if (modal?.type === 'edit') {
      updateVehicle(modal.id, form)
    }
    closeModal()
  }

  const handleConfirmAssign = (e) => {
    e.preventDefault()
    if (!assignUserId) return
    assignVehicle(modal.id, assignUserId)
    closeModal()
  }

  return (
    <div className="dash-shell">
      <AdminTopbar />

      <main className="dash-main">
        <div className="admin-header-row">
          <div>
            <span className="eyebrow">QUẢN TRỊ</span>
            <h1 className="dash-title">Quản lý xe</h1>
            <p className="dash-subtitle">
              Thêm xe mới, cập nhật thông tin, gán xe cho người dùng hoặc thu hồi quyền sử dụng.
            </p>
          </div>
          <button className="btn-primary btn-card admin-add-btn" type="button" onClick={openAdd}>
            <Plus size={16} strokeWidth={2} />
            Thêm xe
          </button>
        </div>

        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên xe</th>
                <th>Biển số</th>
                <th>Khu vực</th>
                <th>Pin</th>
                <th>Tình trạng</th>
                <th>Đang gán cho</th>
                <th aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>{v.name}</td>
                  <td className="mono-cell">{v.plate}</td>
                  <td>{v.location}</td>
                  <td className="mono-cell">{v.battery}%</td>
                  <td>
                    <span className={`status-badge ${CONDITION_BADGE[v.condition]}`}>
                      {CONDITION_LABEL[v.condition]}
                    </span>
                  </td>
                  <td>
                    {v.assignedTo ? (
                      userName(v.assignedTo) ?? '—'
                    ) : (
                      <span className="text-faint">Chưa gán</span>
                    )}
                  </td>
                  <td className="table-actions">
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label={`Cập nhật ${v.name}`}
                      onClick={() => openEdit(v)}
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </button>
                    {v.assignedTo ? (
                      <button
                        className="icon-btn icon-btn-danger"
                        type="button"
                        aria-label={`Thu hồi ${v.name}`}
                        onClick={() => revokeVehicle(v.id)}
                      >
                        <UserMinus size={15} strokeWidth={1.75} />
                      </button>
                    ) : (
                      <button
                        className="icon-btn icon-btn-approve"
                        type="button"
                        aria-label={`Gán ${v.name} cho người dùng`}
                        onClick={() => openAssign(v)}
                      >
                        <UserPlus size={15} strokeWidth={1.75} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-note">
                    Chưa có xe nào trong hệ thống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {(modal === 'add' || modal?.type === 'edit') && (
          <Modal title={modal === 'add' ? 'Thêm xe mới' : 'Cập nhật thông tin xe'} onClose={closeModal}>
            <form className="auth-form" onSubmit={handleSubmitVehicle}>
              <FormField
                label="Tên xe"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="AUTOX Model S1"
              />
              <FormField
                label="Biển số"
                name="plate"
                value={form.plate}
                onChange={handleFormChange}
                placeholder="51A-000.00"
              />
              <FormField
                label="Khu vực"
                name="location"
                value={form.location}
                onChange={handleFormChange}
                placeholder="Quận 1, TP.HCM"
              />
              <FormField
                label="Khoảng cách hiển thị"
                name="distance"
                value={form.distance}
                onChange={handleFormChange}
                placeholder="1.2 km"
              />
              <label className="field">
                <span className="field-label">Phần trăm pin</span>
                <input
                  className="plain-input"
                  type="number"
                  name="battery"
                  min="0"
                  max="100"
                  value={form.battery}
                  onChange={handleFormChange}
                />
              </label>
              <label className="field">
                <span className="field-label">Tình trạng</span>
                <select
                  className="plain-select"
                  name="condition"
                  value={form.condition}
                  onChange={handleFormChange}
                >
                  <option value="good">Hoạt động tốt</option>
                  <option value="check">Cần kiểm tra</option>
                  <option value="error">Đang gặp sự cố</option>
                </select>
              </label>

              <div className="profile-edit-actions">
                <button className="btn-outline btn-neutral" type="button" onClick={closeModal}>
                  Hủy
                </button>
                <button className="btn-primary btn-card" type="submit">
                  {modal === 'add' ? 'Thêm xe' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {modal?.type === 'assign' && (
          <Modal title="Gán xe cho người dùng" onClose={closeModal}>
            <form className="auth-form" onSubmit={handleConfirmAssign}>
              <label className="field">
                <span className="field-label">Chọn người dùng</span>
                <select
                  className="plain-select"
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    -- Chọn người dùng --
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
              </label>

              <div className="profile-edit-actions">
                <button className="btn-outline btn-neutral" type="button" onClick={closeModal}>
                  Hủy
                </button>
                <button className="btn-primary btn-card" type="submit">
                  Gán xe
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  )
}
