import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, Wrench, Hand, Cpu, MapPin } from 'lucide-react'
import AppTopbar from '../components/AppTopbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useVehicles } from '../context/VehicleContext.jsx'

const CONDITION_META = {
  good: {
    label: 'Hoạt động tốt',
    desc: 'Xe đã được kiểm tra và không phát hiện lỗi.',
    icon: CheckCircle2,
  },
  check: {
    label: 'Cần kiểm tra',
    desc: 'Nên đưa xe vào bảo trì định kỳ trong thời gian sớm nhất.',
    icon: AlertTriangle,
  },
  error: {
    label: 'Đang gặp sự cố',
    desc: 'Xe hiện không nên sử dụng cho đến khi được bảo trì.',
    icon: Wrench,
  },
}

export default function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { vehicles } = useVehicles()

  // Chỉ mở được xe đã được gán cho chính người dùng này
  const vehicle = vehicles.find((v) => v.id === id && v.assignedTo === user.id)

  const [power, setPower] = useState(true)
  const [mode, setMode] = useState('auto') // 'manual' | 'auto'

  useEffect(() => {
    if (!vehicle) navigate('/dashboard', { replace: true })
  }, [vehicle, navigate])

  if (!vehicle) return null

  const battery = vehicle.battery
  const batteryClass = battery < 20 ? 'is-critical' : battery < 40 ? 'is-low' : ''
  const condition = CONDITION_META[vehicle.condition] ?? CONDITION_META.good
  const ConditionIcon = condition.icon

  const handleTogglePower = (e) => {
    // TODO: gọi API bật/tắt nguồn xe thực tế, ví dụ POST /api/vehicles/:id/power
    setPower(e.target.checked)
  }

  const handleModeChange = (next) => {
    // TODO: gọi API đổi chế độ điều khiển thực tế, ví dụ POST /api/vehicles/:id/mode
    setMode(next)
  }

  return (
    <div className="dash-shell">
      <AppTopbar />

      <main className="dash-main">
        <button className="detail-back" type="button" onClick={() => navigate('/dashboard')}>
          ← Quay lại danh sách xe
        </button>

        <section className="dash-hero dash-hero-tight">
          <div>
            <span className="eyebrow">CHI TIẾT XE</span>
            <h1 className="dash-title">{vehicle.name}</h1>
            <p className="dash-subtitle vehicle-detail-plate">
              <MapPin size={14} strokeWidth={1.75} />
              {vehicle.plate} · {vehicle.location} · {vehicle.distance}
            </p>
          </div>
        </section>

        <section className="dash-section">
          <div className="section-heading">
            <h2>Trạng thái xe</h2>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <span className="detail-card-label">TRẠNG THÁI NGUỒN</span>
              <div className="power-row">
                <span className={`power-state ${power ? 'is-on' : 'is-off'}`}>
                  {power ? 'Đang bật' : 'Đã tắt'}
                </span>
                <label className="switch">
                  <input type="checkbox" checked={power} onChange={handleTogglePower} />
                  <span className="switch-track" />
                </label>
              </div>
            </div>

            <div className="detail-card">
              <span className="detail-card-label">PHẦN TRĂM PIN</span>
              <div className="battery-value">{battery}%</div>
              <div className="battery-bar">
                <div className={`battery-fill ${batteryClass}`} style={{ width: `${battery}%` }} />
              </div>
            </div>

            <div className="detail-card">
              <span className="detail-card-label">TÌNH TRẠNG</span>
              <div className="condition-row">
                <span className={`condition-icon ${vehicle.condition ?? 'good'}`}>
                  <ConditionIcon size={20} strokeWidth={1.75} />
                </span>
                <div>
                  <div className="condition-title">{condition.label}</div>
                  <div className="condition-desc">{condition.desc}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="dash-section">
          <div className="section-heading">
            <h2>Điều khiển xe</h2>
          </div>

          <div className="detail-card">
            <div className="control-modes">
              <button
                type="button"
                className={`control-mode ${mode === 'manual' ? 'is-active' : ''}`}
                onClick={() => handleModeChange('manual')}
                disabled={!power}
              >
                <Hand size={22} strokeWidth={1.6} />
                <span>Thủ công</span>
              </button>
              <button
                type="button"
                className={`control-mode ${mode === 'auto' ? 'is-active' : ''}`}
                onClick={() => handleModeChange('auto')}
                disabled={!power}
              >
                <Cpu size={22} strokeWidth={1.6} />
                <span>Tự động</span>
              </button>
            </div>
            <p className="control-note">
              {!power
                ? 'Bật nguồn xe để chọn chế độ điều khiển.'
                : mode === 'manual'
                  ? 'Bạn đang trực tiếp điều khiển xe. Hệ thống hỗ trợ an toàn vẫn hoạt động song song.'
                  : 'Xe tự vận hành theo lộ trình đã định, tự động tránh chướng ngại vật và tuân thủ luật giao thông.'}
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
