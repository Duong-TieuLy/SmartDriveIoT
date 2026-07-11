import { Battery, MapPin, Gauge, ArrowRight, Lock, Clock3 } from 'lucide-react'

export default function VehicleCard({ vehicle, onUse, onRequest }) {
  const isLocked = vehicle.status === 'locked'
  const isPending = vehicle.requestStatus === 'pending'

  return (
    <article className={`vehicle-card ${isLocked ? 'is-locked' : ''}`}>
      <div className="vehicle-card-top">
        <div className="vehicle-glyph">
          <Gauge size={22} strokeWidth={1.6} />
        </div>
        <span className={`status-badge ${isLocked ? 'badge-muted' : 'badge-cyan'}`}>
          {isLocked ? 'CẦN QUYỀN TRUY CẬP' : 'SẴN SÀNG'}
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

      {isLocked ? (
        isPending ? (
          <button className="btn-outline is-pending" type="button" disabled>
            <Clock3 size={16} strokeWidth={1.75} />
            Đã gửi yêu cầu
          </button>
        ) : (
          <button className="btn-outline" type="button" onClick={() => onRequest(vehicle.id)}>
            <Lock size={16} strokeWidth={1.75} />
            Yêu cầu sử dụng
          </button>
        )
      ) : (
        <button className="btn-primary btn-card" type="button" onClick={() => onUse(vehicle.id)}>
          Sử dụng ngay
          <ArrowRight size={16} strokeWidth={2} />
        </button>
      )}
    </article>
  )
}
