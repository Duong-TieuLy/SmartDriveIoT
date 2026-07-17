import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContextInstance.js'
import {
  Clock,
  User as UserIcon,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Square,
  Settings,
  RefreshCw,
} from 'lucide-react'

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const API_BASE_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function VehicleHistoryPanel({ vehicle }) {
  const { token, user, accounts } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const size = 10

  const fetchHistory = useCallback(async (targetPage) => {
    if (!vehicle?.id) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/control/history/${vehicle.id}?page=${targetPage}&size=${size}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'any-value-here',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }
      )
      if (!response.ok) {
        throw new Error('Không thể tải lịch sử điều khiển từ máy chủ.')
      }
      const data = await response.json()
      setHistory(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalItems(data.totalItems || 0)
      setPage(data.currentPage || 0)
    } catch (err) {
      console.error('Lỗi tải lịch sử điều khiển:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [vehicle?.id, token])

  useEffect(() => {
    fetchHistory(0)
  }, [vehicle?.id, fetchHistory])

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchHistory(newPage)
    }
  }

  const getCommandInfo = (cmd) => {
    const uppercaseCmd = (cmd || '').toUpperCase()
    if (uppercaseCmd.startsWith('MODE_') || uppercaseCmd.startsWith('SET_MODE:')) {
      const isAuto = uppercaseCmd.includes('AUTO')
      return {
        label: isAuto ? 'Thiết lập Tự động' : 'Thiết lập Thủ công',
        icon: Settings,
        className: 'mode',
      }
    }
    switch (uppercaseCmd) {
      case 'FORWARD':
        return { label: 'Tiến lên', icon: ArrowUp, className: 'forward' }
      case 'BACKWARD':
        return { label: 'Lùi lại', icon: ArrowDown, className: 'backward' }
      case 'LEFT':
        return { label: 'Rẽ trái', icon: ArrowLeft, className: 'left' }
      case 'RIGHT':
        return { label: 'Rẽ phải', icon: ArrowRight, className: 'right' }
      case 'STOP':
        return { label: 'Dừng lại', icon: Square, className: 'stop' }
      default:
        return { label: cmd, icon: Settings, className: '' }
    }
  }

  const getOperatorName = (item) => {
    if (!item.userId) {
      return 'Hệ thống (Tự động)'
    }
    if (user && Number(item.userId) === Number(user.id)) {
      return 'Bạn'
    }
    if (accounts && accounts.length > 0) {
      const matched = accounts.find((a) => Number(a.id) === Number(item.userId))
      if (matched) return matched.fullName
    }
    return `Tài xế #${item.userId}`
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'SENT':
        return { label: 'Đã gửi', className: 'sent' }
      case 'AUTO_STOPPED':
        return { label: 'Né vật cản', className: 'auto-stopped' }
      case 'AUTO_RESUMED':
        return { label: 'Đường thoáng', className: 'auto-resumed' }
      default:
        return { label: status, className: '' }
    }
  }

  if (loading && history.length === 0) {
    return (
      <div className="history-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '30px', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="spin" />
        <p>Đang tải lịch sử điều khiển...</p>
      </div>
    )
  }

  if (error && history.length === 0) {
    return (
      <div className="history-error" style={{ padding: '24px', textAlign: 'center' }}>
        <p className="error-text" style={{ color: '#ef4444', marginBottom: '12px' }}>Lỗi: {error}</p>
        <button type="button" className="refresh-btn" onClick={() => fetchHistory(page)}>
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <span className="history-count">
          {totalItems > 0 ? `Tổng số: ${totalItems} lượt thao tác` : 'Chưa có thao tác'}
        </span>
        <button
          type="button"
          className="refresh-btn"
          onClick={() => fetchHistory(page)}
          disabled={loading}
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {history.length === 0 ? (
        <p className="empty-note">Chưa có lịch sử điều khiển cho xe này.</p>
      ) : (
        <>
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                  <th>Người thực hiện</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const cmdInfo = getCommandInfo(item.command)
                  const CmdIcon = cmdInfo.icon
                  const statusInfo = getStatusInfo(item.status)
                  return (
                    <tr key={item.id}>
                      <td className="history-card-date">
                        <Clock size={13} />
                        {formatDateTime(item.timestamp)}
                      </td>
                      <td>
                        <span className={`command-badge ${cmdInfo.className}`}>
                          <CmdIcon size={13} />
                          {cmdInfo.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <UserIcon size={13} />
                          <span>{getOperatorName(item)}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="history-pagination">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0 || loading}
              >
                ← Trước
              </button>
              <span className="pagination-info">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1 || loading}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}