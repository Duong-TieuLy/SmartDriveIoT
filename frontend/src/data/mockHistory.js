// Sinh dữ liệu lịch sử điều khiển giả lập, ổn định theo vehicleId
// TODO: thay bằng gọi API thực tế, ví dụ GET /api/vehicles/:id/history

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

const MODES = ['manual', 'manual', 'auto']
const INPUT_METHODS = ['buttons', 'camera']

export function generateMockHistory(vehicleId, count = 5) {
  const rand = mulberry32(hashString(vehicleId))
  const runs = []
  const now = Date.now()

  for (let i = 0; i < count; i += 1) {
    const mode = MODES[Math.floor(rand() * MODES.length)]
    const inputMethod =
      mode === 'manual' ? INPUT_METHODS[Math.floor(rand() * INPUT_METHODS.length)] : null

    const durationSec = Math.round(180 + rand() * 900) // 3–18 phút
    const startedAt = new Date(now - (i + 1) * (durationSec * 1000 + 3 * 60 * 60 * 1000)).toISOString()
    const endedAt = new Date(new Date(startedAt).getTime() + durationSec * 1000).toISOString()

    const batteryStart = Math.round(40 + rand() * 55)
    const batteryDrop = Math.round(2 + rand() * 8)
    const batteryEnd = Math.max(0, batteryStart - batteryDrop)

    const avgSpeedKmh = Math.round(8 + rand() * 12)
    const maxSpeedKmh = avgSpeedKmh + Math.round(rand() * 8)
    const distanceKm = Number(((avgSpeedKmh * durationSec) / 3600).toFixed(2))
    const obstaclesAvoided = mode === 'auto' ? Math.round(rand() * 6) : Math.round(rand() * 2)

    const pointCount = Math.min(10, Math.max(4, Math.round(durationSec / 60)))
    const sensorLog = Array.from({ length: pointCount }, (_, idx) => {
      const t = Math.round((durationSec / (pointCount - 1)) * idx)
      const speedKmh = Math.max(0, Math.round(avgSpeedKmh + (rand() - 0.5) * 6))
      const batteryPercent = Math.max(
        batteryEnd,
        Math.round(batteryStart - (batteryDrop * t) / durationSec),
      )
      const hasObstacleReading = mode === 'auto' && rand() > 0.55
      const obstacleDistanceCm = hasObstacleReading ? Math.round(20 + rand() * 180) : null
      return { t, speedKmh, batteryPercent, obstacleDistanceCm }
    })

    runs.push({
      id: `${vehicleId}-run-${i}`,
      mode,
      inputMethod,
      startedAt,
      endedAt,
      durationSec,
      distanceKm,
      avgSpeedKmh,
      maxSpeedKmh,
      batteryStart,
      batteryEnd,
      obstaclesAvoided,
      driverName: 'Bạn',
      sensorLog,
    })
  }

  return runs
}