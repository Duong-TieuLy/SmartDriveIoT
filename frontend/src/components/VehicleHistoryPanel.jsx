import { useMemo, useState } from 'react'
import {
  Clock,
  Gauge,
  Battery,
  Route as RouteIcon,
  ShieldAlert,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { generateMockHistory } from '../data/mockHistory.js'

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m} phút ${s} giây`
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function VehicleHistoryPanel({ vehicle }) {
  // TODO: thay bằng dữ liệu thực tế từ API, ví dụ GET /api/vehicles/:id/history
  const runs = useMemo(() => generateMockHistory(vehicle.id), [vehicle.id])
  const [expandedId, setExpandedId] = useState(null)

  if (runs.length === 0) {
    return <p className="empty-note">Chưa có lịch sử điều khiển cho xe này.</p>
  }

  return (
    <div className="history-list">
      {runs.map((run) => {
        const isOpen = expandedId === run.id
        return (
          <div key={run.id} className="history-card">
            <button
              type="button"
              className="history-card-head"
              onClick={() => setExpandedId(isOpen ? null : run.id)}
            >
              <div className="history-card-title">
                <span className={`history-mode-badge ${run.mode}`}>
                  {run.mode === 'auto' ? 'Tự động' : 'Thủ công'}
                  {run.mode === 'manual' && run.inputMethod === 'camera' && ' · Camera'}
                  {run.mode === 'manual' && run.inputMethod === 'buttons' && ' · Nút bấm'}
                </span>
                <span className="history-card-date">
                  <Clock size={13} strokeWidth={1.75} />
                  {formatDateTime(run.startedAt)}
                </span>
              </div>
              {isOpen ? (
                <ChevronUp size={18} strokeWidth={1.75} />
              ) : (
                <ChevronDown size={18} strokeWidth={1.75} />
              )}
            </button>

            <div className="history-summary-grid">
              <div className="history-summary-item">
                <RouteIcon size={14} strokeWidth={1.75} />
                {run.distanceKm.toFixed(2)} km
              </div>
              <div className="history-summary-item">
                <Gauge size={14} strokeWidth={1.75} />
                TB {run.avgSpeedKmh} km/h · Tối đa {run.maxSpeedKmh} km/h
              </div>
              <div className="history-summary-item">
                <Battery size={14} strokeWidth={1.75} />
                {run.batteryStart}% → {run.batteryEnd}%
              </div>
              <div className="history-summary-item">
                <ShieldAlert size={14} strokeWidth={1.75} />
                {run.obstaclesAvoided} lần né vật cản
              </div>
              <div className="history-summary-item">
                <UserIcon size={14} strokeWidth={1.75} />
                {run.driverName}
              </div>
              <div className="history-summary-item">
                <Clock size={14} strokeWidth={1.75} />
                {formatDuration(run.durationSec)}
              </div>
            </div>

            {isOpen && (
              <div className="history-sensor-log">
                <div className="history-sensor-log-head">
                  <span>Thời điểm</span>
                  <span>Tốc độ</span>
                  <span>Pin</span>
                  <span>Cảm biến khoảng cách</span>
                </div>
                <div className="history-sensor-log-body">
                  {run.sensorLog.map((point, idx) => (
                    <div className="history-sensor-log-row" key={idx}>
                      <span>+{point.t}s</span>
                      <span>{point.speedKmh} km/h</span>
                      <span>{point.batteryPercent}%</span>
                      <span>
                        {point.obstacleDistanceCm != null ? `${point.obstacleDistanceCm} cm` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}