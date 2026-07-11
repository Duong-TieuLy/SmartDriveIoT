import { useState } from 'react'
import { Trash2, CheckCircle2, XCircle, AlertCircle, Users as UsersIcon, Car, Bug } from 'lucide-react'
import AdminTopbar from '../../components/AdminTopbar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useVehicles } from '../../context/VehicleContext.jsx'
import { mockReports } from '../../data/reports.js'
import { ROLE_LABEL } from '../../data/user.js'

const TABS = [
  { key: 'users', label: 'Người dùng', icon: UsersIcon },
  { key: 'requests', label: 'Yêu cầu dùng xe', icon: Car },
  { key: 'reports', label: 'Báo lỗi', icon: Bug },
]

export default function AdminUsers() {
  const [tab, setTab] = useState('users')
  const { accounts, removeAccount } = useAuth()
  const { vehicles, approveRequest, denyRequest } = useVehicles()

  const users = accounts.filter((a) => a.role !== 'admin')
  const pendingRequests = vehicles.filter((v) => v.requestStatus === 'pending')

  const userName = (id) => accounts.find((a) => a.id === id)?.fullName ?? 'Không rõ'

  const handleDelete = (id, name) => {
    if (window.confirm(`Xóa tài khoản "${name}"? Hành động này không thể hoàn tác.`)) {
      removeAccount(id)
    }
  }

  return (
    <div className="dash-shell">
      <AdminTopbar />

      <main className="dash-main">
        <span className="eyebrow">QUẢN TRỊ</span>
        <h1 className="dash-title">Quản lý người dùng</h1>
        <p className="dash-subtitle" style={{ marginBottom: 24 }}>
          Xem danh sách người dùng, duyệt yêu cầu sử dụng xe và theo dõi báo lỗi được gửi lên hệ
          thống.
        </p>

        <div className="admin-tabs">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`admin-tab ${tab === key ? 'is-active' : ''}`}
              onClick={() => setTab(key)}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
              {key === 'requests' && pendingRequests.length > 0 && (
                <span className="tab-count">{pendingRequests.length}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Vai trò</th>
                  <th aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td className="mono-cell">{u.email}</td>
                    <td className="mono-cell">{u.phone || '—'}</td>
                    <td>
                      <span className="status-badge badge-muted">
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button
                        className="icon-btn icon-btn-danger"
                        type="button"
                        aria-label={`Xóa ${u.fullName}`}
                        onClick={() => handleDelete(u.id, u.fullName)}
                      >
                        <Trash2 size={16} strokeWidth={1.75} />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-note">
                      Chưa có người dùng nào đăng ký.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'requests' && (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Người yêu cầu</th>
                  <th>Xe</th>
                  <th>Biển số</th>
                  <th aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((v) => (
                  <tr key={v.id}>
                    <td>{userName(v.requestedBy)}</td>
                    <td>{v.name}</td>
                    <td className="mono-cell">{v.plate}</td>
                    <td className="table-actions">
                      <button
                        className="icon-btn icon-btn-approve"
                        type="button"
                        aria-label="Duyệt yêu cầu"
                        onClick={() => approveRequest(v.id)}
                      >
                        <CheckCircle2 size={16} strokeWidth={1.75} />
                      </button>
                      <button
                        className="icon-btn icon-btn-danger"
                        type="button"
                        aria-label="Không duyệt"
                        onClick={() => denyRequest(v.id)}
                      >
                        <XCircle size={16} strokeWidth={1.75} />
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingRequests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-note">
                      Không có yêu cầu nào đang chờ duyệt.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'reports' && (
          <div className="report-list">
            {mockReports.map((r) => (
              <div className="report-card" key={r.id}>
                <div className="report-head">
                  <AlertCircle size={16} strokeWidth={1.75} />
                  <span className="report-title">{r.title}</span>
                  <span
                    className={`status-badge ${r.status === 'open' ? 'badge-amber' : 'badge-muted'}`}
                  >
                    {r.status === 'open' ? 'CHƯA XỬ LÝ' : 'ĐÃ XỬ LÝ'}
                  </span>
                </div>
                <p className="report-desc">{r.description}</p>
                <div className="report-meta">
                  <span>{userName(r.userId)}</span>
                  <span>·</span>
                  <span>{r.vehicleName}</span>
                  <span>·</span>
                  <span>{r.createdAt}</span>
                </div>
              </div>
            ))}
            {mockReports.length === 0 && <p className="empty-note">Không có báo lỗi nào.</p>}
          </div>
        )}
      </main>
    </div>
  )
}
