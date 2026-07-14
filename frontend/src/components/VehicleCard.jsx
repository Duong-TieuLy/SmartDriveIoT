import { Battery, MapPin, Gauge, ArrowRight, WifiOff } from 'lucide-react'
import '../styles/VehicleCard.css'
export default function VehicleCard({ vehicle, onUse }) {
  const isOnline = vehicle.connectionStatus === 'ONLINE' || vehicle.status === 'online'

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
          {vehicle.location} · {vehicle.distance}
        </li>
        <li>
          <Battery size={14} strokeWidth={1.75} />
          Pin {vehicle.battery}%
        </li>
      </ul>

      {isOnline ? (
        <button 
          className="btn-primary btn-card" 
          type="button" 
          onClick={() => onUse(vehicle.id)}
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
        >
          <WifiOff size={16} strokeWidth={1.75} />
          Mất kết nối (Offline)
        </button>
      )}
    </article>
  )
}