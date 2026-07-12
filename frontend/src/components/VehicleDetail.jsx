import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Hand,
  Cpu,
  MapPin,
  Gamepad2,
  Camera,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  Square,
  Flag,
  X,
} from 'lucide-react'
import AppTopbar from '../components/AppTopbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useVehicles } from '../context/VehicleContext.jsx'
import '../styles/VehicleDetail.css'

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Nhẹ — vẫn dùng được' },
  { value: 'medium', label: 'Trung bình — cần kiểm tra sớm' },
  { value: 'high', label: 'Khẩn cấp — không thể sử dụng' },
]

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
  const [manualInput, setManualInput] = useState(null) // 'buttons' | 'camera' | null
  const [autoRunning, setAutoRunning] = useState(false)

  // --- Trạng thái điều khiển bằng camera ---
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraError, setCameraError] = useState('')
  const [gestureStatus, setGestureStatus] = useState('Đang chờ camera...')

  // --- Trạng thái form báo lỗi gửi tới admin ---
  const [reportOpen, setReportOpen] = useState(false)
  const [reportSeverity, setReportSeverity] = useState('medium')
  const [reportDesc, setReportDesc] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [reportError, setReportError] = useState('')

  useEffect(() => {
    if (!vehicle) navigate('/dashboard', { replace: true })
  }, [vehicle, navigate])

  // Bật/tắt camera khi vào/ra chế độ điều khiển bằng tay
  useEffect(() => {
    if (mode === 'manual' && manualInput === 'camera') {
      let cancelled = false

      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then((stream) => {
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
          setCameraError('')
          setGestureStatus('Đang nhận diện cử chỉ tay...')

          // TODO: kết nối tới engine nhận diện tay thực tế (OpenCV / MediaPipe Hands).
          // Ví dụ: mở WebSocket tới backend Python xử lý OpenCV, gửi từng frame
          // (hoặc dùng @mediapipe/hands chạy trực tiếp trên trình duyệt) và nhận
          // lại lệnh điều khiển (tiến/lùi/trái/phải) để gọi API POST /api/vehicles/:id/move
        })
        .catch((err) => {
          console.error(err)
          setCameraError('Không thể truy cập camera. Vui lòng cấp quyền camera cho trình duyệt.')
          setGestureStatus('')
        })

      return () => {
        cancelled = true
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }

    // Rời khỏi chế độ camera thì tắt hẳn stream đang chạy
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [mode, manualInput])

  if (!vehicle) return null

  const battery = vehicle.battery
  const batteryClass = battery < 20 ? 'is-critical' : battery < 40 ? 'is-low' : ''
  const condition = CONDITION_META[vehicle.condition] ?? CONDITION_META.good
  const ConditionIcon = condition.icon

  const handleTogglePower = (e) => {
    // TODO: gọi API bật/tắt nguồn xe thực tế, ví dụ POST /api/vehicles/:id/power
    setPower(e.target.checked)
    if (!e.target.checked) {
      setManualInput(null)
      setAutoRunning(false)
    }
  }

  const handleModeChange = (next) => {
    // TODO: gọi API đổi chế độ điều khiển thực tế, ví dụ POST /api/vehicles/:id/mode
    setMode(next)
    setManualInput(null)
    setAutoRunning(false)
  }

  const handleDirection = (direction) => {
    // TODO: gọi API điều khiển thực tế, ví dụ POST /api/vehicles/:id/move { direction }
    console.log('Điều khiển hướng:', direction)
  }

  const handleToggleAuto = () => {
    // TODO: gọi API bắt đầu/dừng chế độ tự động thực tế,
    // ví dụ POST /api/vehicles/:id/auto/start hoặc /auto/stop
    setAutoRunning((prev) => !prev)
  }

  const handleOpenReport = () => {
    setReportOpen(true)
    setReportSent(false)
    setReportError('')
  }

  const handleCloseReport = () => {
    setReportOpen(false)
    setReportSeverity('medium')
    setReportDesc('')
    setReportError('')
  }

  const handleSubmitReport = async (e) => {
    e.preventDefault()

    if (!reportDesc.trim()) {
      setReportError('Vui lòng mô tả sự cố trước khi gửi.')
      return
    }

    setReportSubmitting(true)
    setReportError('')

    try {
      // TODO: gọi API báo lỗi thực tế, ví dụ:
      // await fetch(`/api/vehicles/${vehicle.id}/reports`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     severity: reportSeverity,
      //     description: reportDesc,
      //     reportedBy: user.id,
      //   }),
      // })

      // Giả lập độ trễ gọi API
      await new Promise((resolve) => setTimeout(resolve, 600))

      setReportSent(true)
      setReportDesc('')
    } catch (err) {
      console.error(err)
      setReportError('Gửi báo cáo thất bại. Vui lòng thử lại.')
    } finally {
      setReportSubmitting(false)
    }
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
            <button type="button" className="report-issue-btn" onClick={handleOpenReport}>
              <Flag size={15} strokeWidth={2} />
              Báo lỗi đến admin
            </button>
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
                  ? 'Chọn cách bạn muốn điều khiển xe trực tiếp.'
                  : 'Xe tự vận hành theo lộ trình đã định, tự động tránh chướng ngại vật và tuân thủ luật giao thông.'}
            </p>

            {/* ---------- CHẾ ĐỘ THỦ CÔNG ---------- */}
            {power && mode === 'manual' && (
              <div className="manual-panel">
                <div className="manual-subselect">
                  <button
                    type="button"
                    className={`subselect-btn ${manualInput === 'buttons' ? 'is-active' : ''}`}
                    onClick={() => setManualInput('buttons')}
                  >
                    <Gamepad2 size={18} strokeWidth={1.75} />
                    <span>Nút bấm</span>
                  </button>
                  <button
                    type="button"
                    className={`subselect-btn ${manualInput === 'camera' ? 'is-active' : ''}`}
                    onClick={() => setManualInput('camera')}
                  >
                    <Camera size={18} strokeWidth={1.75} />
                    <span>Camera (nhận diện tay)</span>
                  </button>
                </div>

                {manualInput === 'buttons' && (
                  <div className="dpad-wrap">
                    <div className="dpad">
                      <button
                        type="button"
                        className="dpad-btn dpad-up"
                        onClick={() => handleDirection('up')}
                        aria-label="Tiến"
                      >
                        <ArrowUp size={20} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="dpad-btn dpad-left"
                        onClick={() => handleDirection('left')}
                        aria-label="Trái"
                      >
                        <ArrowLeft size={20} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="dpad-btn dpad-right"
                        onClick={() => handleDirection('right')}
                        aria-label="Phải"
                      >
                        <ArrowRight size={20} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="dpad-btn dpad-down"
                        onClick={() => handleDirection('down')}
                        aria-label="Lùi"
                      >
                        <ArrowDown size={20} strokeWidth={2} />
                      </button>
                    </div>
                    <p className="dpad-hint">Giữ nút để điều khiển liên tục, nhả ra để dừng.</p>
                  </div>
                )}

                {manualInput === 'camera' && (
                  <div className="camera-panel">
                    <div className="camera-view">
                      <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
                      {cameraError && <div className="camera-overlay camera-overlay-error">{cameraError}</div>}
                    </div>
                    <p className="gesture-status">{gestureStatus || 'Chưa kết nối camera.'}</p>
                    <p className="control-hint">
                      Đưa tay vào khung hình: xoè bàn tay để tiến, nắm tay để dừng, nghiêng tay
                      trái/phải để rẽ trái/phải.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ---------- CHẾ ĐỘ TỰ ĐỘNG ---------- */}
            {power && mode === 'auto' && (
              <div className="auto-panel">
                <button
                  type="button"
                  className={`auto-toggle-btn ${autoRunning ? 'is-running' : ''}`}
                  onClick={handleToggleAuto}
                >
                  {autoRunning ? <Square size={18} strokeWidth={2} /> : <Play size={18} strokeWidth={2} />}
                  <span>{autoRunning ? 'Dừng xe' : 'Bắt đầu tự động'}</span>
                </button>

                {autoRunning && (
                  <div className="auto-status">
                    <span className="auto-status-dot" />
                    Xe đang tự di chuyển và tự động né chướng ngại vật...
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {reportOpen && (
        <div className="modal-backdrop" onClick={handleCloseReport}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Báo lỗi xe {vehicle.name}</h3>
              <button type="button" className="icon-btn" onClick={handleCloseReport} aria-label="Đóng">
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className="modal-body">
              {reportSent ? (
                <div className="report-success">
                  <div className="report-success-icon">
                    <Flag size={22} strokeWidth={1.75} />
                  </div>
                  <p className="report-success-title">Đã gửi báo cáo</p>
                  <p className="report-success-desc">
                    Admin sẽ xem xét sự cố của xe {vehicle.plate} trong thời gian sớm nhất.
                  </p>
                  <button type="button" className="btn-primary" onClick={handleCloseReport}>
                    Đóng
                  </button>
                </div>
              ) : (
                <form className="auth-form" onSubmit={handleSubmitReport}>
                  <div className="field">
                    <label className="field-label" htmlFor="report-severity">
                      Mức độ nghiêm trọng
                    </label>
                    <select
                      id="report-severity"
                      className="plain-select"
                      value={reportSeverity}
                      onChange={(e) => setReportSeverity(e.target.value)}
                    >
                      {SEVERITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`field ${reportError ? 'field-error' : ''}`}>
                    <label className="field-label" htmlFor="report-desc">
                      Mô tả sự cố
                    </label>
                    <textarea
                      id="report-desc"
                      className="plain-input report-textarea"
                      placeholder="Ví dụ: Xe phát ra tiếng động lạ ở bánh trước, cảm biến pin báo sai..."
                      rows={4}
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                    />
                    {reportError && <span className="field-error-text">{reportError}</span>}
                  </div>

                  <button type="submit" className="btn-primary" disabled={reportSubmitting}>
                    {reportSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
