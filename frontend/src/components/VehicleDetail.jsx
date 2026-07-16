import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision'
import { DrawingUtils } from "@mediapipe/tasks-vision";
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
import { useAuth } from '../context/AuthContextInstance.js'
import { useVehicles } from '../context/VehicleContextInstance.js'
import '../styles/VehicleDetail.css'
import VehicleHistoryPanel from '../components/VehicleHistoryPanel.jsx'

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
  
  // Lấy danh sách xe và hàm sendCommand trực tiếp từ Context
  const { vehicles, sendCommand } = useVehicles()

  const vehicle = useMemo(() => {
    if (!vehicles || !user?.id) return null;
    
    const currentUserId = Number(user.id);
    
    return vehicles.find((v) => {
      const isIdMatch = v.id === id;
      const isOwner = Number(v.assignedTo) === currentUserId;
      
      // Kiểm tra trong mảng sharedDrivers
      const sharedDrivers = Array.isArray(v.sharedDrivers) ? v.sharedDrivers.map(Number) : [];
      const isShared = sharedDrivers.includes(currentUserId);
      
      return isIdMatch && (isOwner || isShared);
    });
  }, [vehicles, id, user?.id]);

  const [power, setPower] = useState(true)
  const [mode, setMode] = useState('manual') 
  const [manualInput, setManualInput] = useState(null)
  const [autoRunning, setAutoRunning] = useState(false)
  
  // --- Trạng thái điều khiển bằng camera ---
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraError, setCameraError] = useState('')
  const [gestureStatus, setGestureStatus] = useState('Đang chờ camera...')

  // --- Trạng thái form báo lỗi ---
  const [reportOpen, setReportOpen] = useState(false)
  const [reportSeverity, setReportSeverity] = useState('medium')
  const [reportDesc, setReportDesc] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [reportError, setReportError] = useState('')

  useEffect(() => {
    if (!vehicle) navigate('/dashboard', { replace: true })
  }, [vehicle, navigate])

  // Hàm bọc trung gian để gọi sendCommand từ Context dễ dàng hơn
  const triggerCommand = (cmd) => {
    if (vehicle) {
      sendCommand(vehicle.id, cmd)
    }
  }

  // Bật/tắt camera khi vào/ra chế độ camera
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

          // TODO: Tích hợp Mediapipe / OpenCV tại đây để nhận diện cử chỉ tay
          // Ví dụ: khi nhận diện xòe tay -> triggerCommand('FORWARD')
        })
        .catch((err) => {
          console.error(err)
          setCameraError('Không thể truy cập camera. Vui lòng cấp quyền camera.')
          setGestureStatus('')
        })

      return () => {
        cancelled = true
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }

    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [mode, manualInput])

  if (!vehicle) return null

  const battery = vehicle.battery
  const batteryClass = battery < 20 ? 'is-critical' : battery < 40 ? 'is-low' : ''
  const condition = CONDITION_META[vehicle.condition] ?? CONDITION_META.good
  const ConditionIcon = condition.icon

  // Lấy giá trị khoảng cách trực tiếp từ store Context toàn cục thay vì state nội bộ component
  const realtimeDistance = vehicle.realtimeDistance

  const handleTogglePower = (e) => {
    const isPowerOn = e.target.checked
    setPower(isPowerOn)
    if (!isPowerOn) {
      triggerCommand('STOP') 
      setManualInput(null)
      setAutoRunning(false)
    }
  }

// 1. Thay đổi hàm chuyển đổi Tab chế độ trên giao diện
  const handleModeChange = (next) => {
    setMode(next)
    setManualInput(null)
    setAutoRunning(false)
    
    // Nếu người dùng chủ động click quay về tab thủ công, đưa xe về chế độ an toàn
    if (next === 'manual') {
      triggerCommand('MODE_MANUAL')
      triggerCommand('STOP')
    }
    // Khi sang tab 'auto', chúng ta GIỮ NGUYÊN trạng thái xe, chưa kích hoạt lệnh gì cả
  }

  const handleDirectionPress = (direction) => {
    const directionMap = {
      up: 'FORWARD',
      down: 'BACKWARD',
      left: 'LEFT',
      right: 'RIGHT',
    }
    triggerCommand(directionMap[direction])
  }

  const handleDirectionRelease = () => {
    triggerCommand('STOP')
  }

const handleToggleAuto = () => {
    if (autoRunning) {
      // Nếu đang chạy tự động mà bấm Dừng: trả về trạng thái thủ công và dừng xe
      triggerCommand('MODE_MANUAL')
      triggerCommand('STOP')
    } else {
      // BẮT ĐẦU TỰ ĐỘNG: Kích hoạt chế độ tự động lái trên xe
      triggerCommand('MODE_AUTO')
    }
    setAutoRunning((prev) => !prev)
  }

  // --- Xử lý báo lỗi ---
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

  // --- Trạng thái kết nối camera & Mediapipe ---

  const gestureRecognizerRef = useRef(null) // Lưu trữ instance của model
  const requestRef = useRef(null) // Quản lý loop animation frame
  const lastCommandRef = useRef('') // Tránh spam trùng lệnh liên tục
  const lastCommandTimeRef = useRef(0) // Giới hạn tần suất gửi lệnh (Throttling)

  // const [cameraError, setCameraError] = useState('')
  // const [gestureStatus, setGestureStatus] = useState('Đang khởi tạo hệ thống nhận diện...')
  // 1. Khởi tạo MediaPipe Gesture Recognizer một lần duy nhất khi vào trang
  useEffect(() => {
    let active = true

    const initGestureRecognizer = async () => {
      try {
        setGestureStatus('Đang tải mô hình trí tuệ nhân tạo (MediaPipe)...')
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        )
        
        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU" // Ưu tiên chạy bằng card đồ họa để siêu mượt
          },
          runningMode: "VIDEO",
          numHands: 1 // Chỉ cần nhận diện 1 tay điều khiển để tránh loạn
        })

        if (active) {
          gestureRecognizerRef.current = recognizer
          setGestureStatus('Mô hình đã sẵn sàng! Đang mở camera...')
        }
      } catch (err) {
        console.error("Lỗi tải mô hình MediaPipe:", err)
        if (active) setCameraError('Không thể tải bộ nhận diện cử chỉ tay.')
      }
    }

    initGestureRecognizer()

    return () => {
      active = false
      gestureRecognizerRef.current?.close()
    }
  }, [])
  const canvasRef = useRef(null);
  // 2. Quản lý camera và chạy vòng lặp nhận diện cử chỉ thực tế (Real-time Loop)
  useEffect(() => {
    // Chỉ kích hoạt camera khi chọn chế độ "Thủ công" + input bằng "Camera" + Model AI đã tải xong
    if (mode === 'manual' && manualInput === 'camera' && gestureRecognizerRef.current) {
      let cancelled = false

      // Hàm xử lý frame ảnh từ camera liên tục
      const predictWebcam = () => {
        if (
          videoRef.current &&
          videoRef.current.readyState === 4 && // HAVE_ENOUGH_DATA
          gestureRecognizerRef.current
        ) {
          const now = performance.now()
          const results = gestureRecognizerRef.current.recognizeForVideo(videoRef.current, now)
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          const drawingUtils = new DrawingUtils(ctx);

          // Set kích thước canvas khớp với video
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.landmarks) {
            for (const landmarks of results.landmarks) {
              // Vẽ các đoạn thẳng kết nối (connections)
              drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 3
              });
              // Vẽ các điểm nút (landmarks)
              drawingUtils.drawLandmarks(landmarks, {
                color: "#FF0000",
                lineWidth: 1
              });
            }
          }
          if (results.gestures && results.gestures.length > 0) {
            // Lấy ra cử chỉ có độ chính xác cao nhất từ bàn tay phát hiện được
            const gesture = results.gestures[0][0]
            const categoryName = gesture.categoryName
            const score = (gesture.score * 100).toFixed(1)

            // Ánh xạ cử chỉ tay sang điều lệnh xe
            let detectedCmd = ''
            let statusText = ''

            switch (categoryName) {
              case 'Open_Palm':
                detectedCmd = 'FORWARD'
                statusText = `✋ Xoè bàn tay (${score}%) -> TIẾN`
                break
              case 'Closed_Fist':
                detectedCmd = 'STOP'
                statusText = `✊ Nắm tay (${score}%) -> DỪNG`
                break
              case 'Pointing_Up':
                detectedCmd = 'LEFT' // Bạn có thể map ngón trỏ chỉ lên là Rẽ Trái hoặc Tiến tuỳ ý
                statusText = `☝️ Chỉ tay lên (${score}%) -> RẼ TRÁI`
                break
              case 'Victory':
                detectedCmd = 'RIGHT'
                statusText = `✌️ Cử chỉ chữ V (${score}%) -> RẼ PHẢI`
                break
              case 'Thumb_Down':
                detectedCmd = 'BACKWARD'
                statusText = `👎 Ngón cái xuống (${score}%) -> LÙI`
                break
              default:
                statusText = `❓ Cử chỉ không xác định: ${categoryName}`
            }

            setGestureStatus(statusText)

            // GỬI LỆNH QUA WEBSOCKET (Có Throttling & De-duplication)
            if (detectedCmd) {
              const currentTime = Date.now()
              const isNewCommand = detectedCmd !== lastCommandRef.current
              const isTimeElapsed = currentTime - lastCommandTimeRef.current > 400 // Gửi tối đa 1 lệnh mỗi 400ms nếu giữ nguyên tay

              if (isNewCommand || isTimeElapsed) {
                triggerCommand(detectedCmd)
                lastCommandRef.current = detectedCmd
                lastCommandTimeRef.current = currentTime
              }
            }
          } else {
            setGestureStatus('Đưa tay vào khung hình để điều khiển...')
            // Nếu không thấy tay, ta tự động dừng xe sau 1 khoảng ngắn để an toàn (Fail-safe)
            const currentTime = Date.now()
            if (lastCommandRef.current !== 'STOP' && currentTime - lastCommandTimeRef.current > 800) {
              triggerCommand('STOP')
              lastCommandRef.current = 'STOP'
              lastCommandTimeRef.current = currentTime
            }
          }
        }

        // Đệ quy gọi frame tiếp theo
        if (!cancelled) {
          requestRef.current = requestAnimationFrame(predictWebcam)
        }
      }

      // Khởi chạy camera
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false })
        .then((stream) => {
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            // Chờ video load xong meta thì bắt đầu nhận diện liên tục
            videoRef.current.onloadedmetadata = () => {
              requestRef.current = requestAnimationFrame(predictWebcam)
            }
          }
          setCameraError('')
        })
        .catch((err) => {
          console.error(err)
          setCameraError('Không thể truy cập camera. Vui lòng cấp quyền camera.')
          setGestureStatus('')
        })

      return () => {
        cancelled = true
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current)
        }
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [mode, manualInput, gestureRecognizerRef.current])

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
              <span className="detail-card-label">TÌNH TRẠNG & CẢM BIẾN</span>
              <div className="condition-row">
                <span className={`condition-icon ${vehicle.condition ?? 'good'}`}>
                  <ConditionIcon size={20} strokeWidth={1.75} />
                </span>
                <div>
                  <div className="condition-title">{condition.label}</div>
                  <div className="condition-desc">
                    {realtimeDistance !== null && realtimeDistance !== undefined
                      ? `Khoảng cách vật cản: ${realtimeDistance} cm` 
                      : condition.desc}
                  </div>
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
                        onMouseDown={() => handleDirectionPress('up')}
                        onMouseUp={handleDirectionRelease}
                        onTouchStart={() => handleDirectionPress('up')}
                        onTouchEnd={handleDirectionRelease}
                        aria-label="Tiến"
                      >
                        <ArrowUp size={20} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="dpad-btn dpad-left"
                        onMouseDown={() => handleDirectionPress('left')}
                        onMouseUp={handleDirectionRelease}
                        onTouchStart={() => handleDirectionPress('left')}
                        onTouchEnd={handleDirectionRelease}
                        aria-label="Trái"
                      >
                        <ArrowLeft size={20} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="dpad-btn dpad-right"
                        onMouseDown={() => handleDirectionPress('right')}
                        onMouseUp={handleDirectionRelease}
                        onTouchStart={() => handleDirectionPress('right')}
                        onTouchEnd={handleDirectionRelease}
                        aria-label="Phải"
                      >
                        <ArrowRight size={20} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="dpad-btn dpad-down"
                        onMouseDown={() => handleDirectionPress('down')}
                        onMouseUp={handleDirectionRelease}
                        onTouchStart={() => handleDirectionPress('down')}
                        onTouchEnd={handleDirectionRelease}
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
                    <div className="camera-view" style={{ position: 'relative' }}>
                      {/* Chỉ giữ lại 1 thẻ video với 1 ref duy nhất */}
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="camera-video" 
                      />
                      
                      {/* Canvas vẽ khung xương tay đè lên video */}
                      <canvas 
                        ref={canvasRef} 
                        className="camera-overlay-canvas"
                        style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          transform: 'scaleX(-1)', // Đảo ngược để khớp với hiệu ứng gương của camera
                          pointerEvents: 'none'    // Đảm bảo canvas không chặn sự kiện chuột
                        }} 
                      />
                      
                      {cameraError && (
                        <div className="camera-overlay camera-overlay-error">
                          {cameraError}
                        </div>
                      )}
                    </div>
                    
                    <p className="gesture-status">{gestureStatus || 'Chưa kết nối camera.'}</p>
                    <p className="control-hint">
                      Đưa tay vào khung hình: xoè bàn tay để tiến, nắm tay để dừng, nghiêng tay trái/phải để rẽ.
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

        <section className="dash-section">
          <div className="section-heading">
            <h2>Lịch sử điều khiển</h2>
          </div>
          <VehicleHistoryPanel vehicle={vehicle} />
        </section>
      </main>

      {/* Modal Báo lỗi */}
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
                    <label className="field-label" htmlFor="report-severity">Mức độ nghiêm trọng</label>
                    <select
                      id="report-severity"
                      className="plain-select"
                      value={reportSeverity}
                      onChange={(e) => setReportSeverity(e.target.value)}
                    >
                      {SEVERITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={`field ${reportError ? 'field-error' : ''}`}>
                    <label className="field-label" htmlFor="report-desc">Mô tả sự cố</label>
                    <textarea
                      id="report-desc"
                      className="plain-input report-textarea"
                      placeholder="Ví dụ: Xe phát ra tiếng động lạ ở bánh trước..."
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