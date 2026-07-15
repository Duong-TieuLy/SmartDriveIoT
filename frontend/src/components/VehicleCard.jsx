import { useEffect } from 'react'
import { Battery, MapPin, Gauge, ArrowRight, WifiOff, Share2 } from 'lucide-react'
import '../styles/VehicleCard.css'

// 🔥 CẬP NHẬT: Nhận thêm prop onRequest từ Dashboard để xử lý chia sẻ
export default function VehicleCard({ vehicle, onUse, onRequest }) {
  const isOnline = vehicle.connectionStatus === 'ONLINE' || vehicle.status === 'online'
  const isAvailable = vehicle.status === 'available' // Đã kiểm tra quyền sở hữu/chia sẻ ở Dashboard

  return (
    <article className={`vehicle-card ${!isOnline ? 'is-offline-card' : ''}`}>
      <div className="vehicle-card-top">
        <div className="vehicle-glyph">
          <Gauge size={22} strokeWidth={1.6} />
        </div>
        
        <span className={`status-badge ${isOnline ? 'badge-cyan' : 'badge-muted'}`}>
          <span className={`status-dot ${isOnline ? 'is-online' : 'is-offline'}`} />
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      <h3 className="vehicle-name">{vehicle.name}</h3>
      <p className="vehicle-plate">{vehicle.plate}</p>

      <ul className="vehicle-meta">
        <li>
          <MapPin size={14} strokeWidth={1.75} />
          {vehicle.location} {vehicle.realtimeDistance !== undefined ? `· ${vehicle.realtimeDistance}m` : ''}
        </li>
        <li>
          <Battery size={14} strokeWidth={1.75} />
          Pin {vehicle.battery}%
        </li>
      </ul>

      {/* --- KHU VỰC THAO TÁC (ACTIONS ROW) --- */}
      <div className="vehicle-card-actions" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        
        {/* 1. Nút Sử dụng / Điều khiển xe */}
        {isOnline ? (
          <button 
            className="btn-primary btn-card" 
            type="button" 
            onClick={onUse} // 🔥 SỬA: Gọi trực tiếp onUse() vì Dashboard đã truyền sẵn callback bọc v.id
            style={{ flex: 1, justifyContent: 'center', gap: '6px' }}
          >
            Sử dụng ngay
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        ) : (
          <button 
            className="btn-card btn-disabled" 
            type="button" 
            disabled
            title="Thiết bị đang ngoại tuyến, không thể điều khiển"
            style={{ flex: 1, justifyContent: 'center', gap: '6px' }}
          >
            <WifiOff size={16} strokeWidth={1.75} />
            Mất kết nối
          </button>
        )}

        {/* 2. 🔥 CẬP NHẬT: Thêm nút bấm thực hiện Chia sẻ (Chỉ hiển thị nếu component cha truyền prop onRequest vào) */}
        {onRequest && (
          <button 
            className="btn-outline btn-card" 
            type="button"
            onClick={onRequest}
            title="Chia sẻ quyền điều khiển thiết bị này qua email"
            style={{ padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: 'var(--border-color, #e2e8f0)' }}
          >
            <Share2 size={16} strokeWidth={1.75} style={{ color: 'var(--txt-primary)' }} />
          </button>
        )}
        
      </div>
    </article>
  )
}