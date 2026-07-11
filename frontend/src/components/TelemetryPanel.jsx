import { useEffect, useState } from 'react'
import { Gauge, BatteryMedium, Satellite, Radar } from 'lucide-react'

function rand(min, max) {
  return Math.random() * (max - min) + min
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

export default function TelemetryPanel() {
  const [telemetry, setTelemetry] = useState({
    speed: 42,
    battery: 87,
    lat: 10.7769,
    lng: 106.7009,
  })

  // Mô phỏng dữ liệu cảm biến cập nhật liên tục để panel "sống"
  // trong lúc người dùng điền form. Thay bằng dữ liệu thật từ
  // WebSocket / MQTT của xe khi tích hợp backend.
  useEffect(() => {
    const id = setInterval(() => {
      setTelemetry((t) => ({
        speed: clamp(t.speed + rand(-3, 3), 0, 80),
        battery: clamp(t.battery - rand(0, 0.4), 20, 100),
        lat: t.lat + rand(-0.0004, 0.0004),
        lng: t.lng + rand(-0.0004, 0.0004),
      }))
    }, 1800)
    return () => clearInterval(id)
  }, [])

  return (
    <aside className="telemetry-panel">
      <div className="brand">
        <span className="brand-mark">AUTOX</span>
        <span className="brand-tag">HỆ THỐNG ĐIỀU PHỐI XE TỰ HÀNH</span>
      </div>

      <div className="radar-stage">
        <svg className="radar-svg" viewBox="0 0 400 400" aria-hidden="true">
          <circle className="radar-ring" cx="200" cy="200" r="60" />
          <circle className="radar-ring" cx="200" cy="200" r="120" />
          <circle className="radar-ring" cx="200" cy="200" r="180" />
          <line className="radar-cross" x1="20" y1="200" x2="380" y2="200" />
          <line className="radar-cross" x1="200" y1="20" x2="200" y2="380" />

          <path
            className="route-path"
            d="M 60 320 C 120 200, 180 260, 220 160 S 320 60, 340 60"
            fill="none"
          />

          <g className="radar-sweep-group">
            <path className="radar-sweep" d="M200 200 L200 20 A180 180 0 0 1 340 90 Z" />
          </g>
        </svg>
        <div className="route-car" />
      </div>

      <ul className="telemetry-list">
        <li>
          <Gauge size={16} strokeWidth={1.75} />
          <span className="tele-label">TỐC ĐỘ</span>
          <span className="tele-value">{telemetry.speed.toFixed(0)} km/h</span>
        </li>
        <li>
          <BatteryMedium size={16} strokeWidth={1.75} />
          <span className="tele-label">PIN</span>
          <span className="tele-value">{telemetry.battery.toFixed(0)}%</span>
        </li>
        <li>
          <Satellite size={16} strokeWidth={1.75} />
          <span className="tele-label">GPS</span>
          <span className="tele-value">
            {telemetry.lat.toFixed(4)}, {telemetry.lng.toFixed(4)}
          </span>
        </li>
        <li>
          <Radar size={16} strokeWidth={1.75} />
          <span className="tele-label">TRẠNG THÁI</span>
          <span className="tele-value tele-status">ĐANG QUÉT MÔI TRƯỜNG</span>
        </li>
      </ul>

      <p className="telemetry-footnote">
        Dữ liệu LIDAR · Camera · Radar được hợp nhất theo thời gian thực để đảm bảo hành trình an toàn.
      </p>
    </aside>
  )
}
