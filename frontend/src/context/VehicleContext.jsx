import { createContext, useContext, useEffect, useState } from 'react'
import { initialVehicles } from '../data/vehicles.js'

const VehicleContext = createContext(null)
const STORAGE_KEY = 'autox_vehicles'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

/**
 * Nguồn dữ liệu xe dùng chung cho cả phía User (Dashboard, chi tiết xe)
 * và phía Admin (quản lý xe, duyệt yêu cầu). Lưu tạm ở localStorage để
 * demo không cần backend — khi tích hợp API thật, thay các hàm bên dưới
 * bằng lệnh gọi tương ứng và bỏ hẳn việc đọc/ghi localStorage.
 *
 * Mô hình quyền sử dụng:
 * - assignedTo: id user hiện đang được PHÉP dùng xe này (null = chưa gán).
 * - requestedBy / requestStatus: user đang chờ admin duyệt quyền sử dụng.
 */
export function VehicleProvider({ children }) {
  const [vehicles, setVehicles] = useState(() => readJSON(STORAGE_KEY, initialVehicles))

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles))
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage
    }
  }, [vehicles])

  const addVehicle = (data) => {
    setVehicles((prev) => [
      ...prev,
      {
        id: `v-${Date.now()}`,
        assignedTo: null,
        requestedBy: null,
        requestStatus: 'none',
        condition: 'good',
        ...data,
      },
    ])
  }

  const updateVehicle = (id, updates) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)))
  }

  const removeVehicle = (id) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id))
  }

  // User bấm "Yêu cầu sử dụng"
  const requestVehicle = (id, userId) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, requestStatus: 'pending', requestedBy: userId } : v)),
    )
  }

  // Admin duyệt yêu cầu -> gán luôn xe cho người đã yêu cầu
  const approveRequest = (id) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, assignedTo: v.requestedBy, requestStatus: 'none', requestedBy: null }
          : v,
      ),
    )
  }

  // Admin từ chối yêu cầu
  const denyRequest = (id) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, requestStatus: 'none', requestedBy: null } : v)),
    )
  }

  // Admin gán xe trực tiếp cho một user (không cần qua bước yêu cầu)
  const assignVehicle = (id, userId) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, assignedTo: userId } : v)))
  }

  // Admin thu hồi quyền sử dụng xe
  const revokeVehicle = (id) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, assignedTo: null, requestStatus: 'none', requestedBy: null } : v,
      ),
    )
  }

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        addVehicle,
        updateVehicle,
        removeVehicle,
        requestVehicle,
        approveRequest,
        denyRequest,
        assignVehicle,
        revokeVehicle,
      }}
    >
      {children}
    </VehicleContext.Provider>
  )
}

export function useVehicles() {
  const ctx = useContext(VehicleContext)
  if (!ctx) throw new Error('useVehicles phải được dùng bên trong <VehicleProvider>')
  return ctx
}
