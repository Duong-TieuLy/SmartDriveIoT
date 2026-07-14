import { createContext, useContext, useState, useEffect, useRef } from 'react'

const VehicleContext = createContext(null)
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/devices`
const TOKEN_KEY = 'autox_token' 

export function VehicleProvider({ children }) {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Lưu trữ instance WebSocket toàn cục để dùng chung
  const globalWsRef = useRef(null)
  const [currentUserId, setCurrentUserId] = useState(null)

  const getAuthHeader = () => {
    const token = localStorage.getItem(TOKEN_KEY)
    return {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'any-value-here',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  const mapDeviceToVehicle = (device) => ({
    id: device.macAddress,            
    dbId: device.id,                 
    name: device.name,
    plate: device.plate || 'IoT-CAR',
    location: device.location || 'Khu thử nghiệm',
    battery: device.battery !== undefined ? device.battery : 100,
    condition: device.condition || 'good',
    status: device.status === 'ONLINE' || device.connectionStatus === 'ONLINE' ? 'online' : 'offline', 
    connectionStatus: device.status === 'ONLINE' || device.connectionStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
    assignedTo: device.ownerId,       
    sharedDrivers: device.driverIds ? Array.from(device.driverIds) : [], 
    requestedBy: null,
    requestStatus: 'none',
  })

  // --- KẾT NỐI WEBSOCKET REALTIME CHO TRẠNG THÁI XE ---
  useEffect(() => {
    if (!currentUserId) return

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
    const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws')
    const wsUrl = `${wsBaseUrl}/ws/iot?type=USER&id=${currentUserId}`

    const ws = new WebSocket(wsUrl)
    globalWsRef.current = ws

    ws.onopen = () => {
      console.log('🔌 [Global WS] Đã kết nối lắng nghe trạng thái xe.')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Giả sử Backend Spring Boot gửi gói tin cập nhật trạng thái kết nối:
        // { "deviceId": "ESP32-TEST-MAC1", "connectionStatus": "ONLINE" / "OFFLINE" }
        // Hoặc các gói tin Telemetry định kỳ chứa pin/khoảng cách:
        // { "deviceId": "ESP32-TEST-MAC1", "distance": 20, "battery": 90 }
        
        if (data.deviceId) {
          setVehicles((prevVehicles) =>
            prevVehicles.map((v) => {
              if (v.id === data.deviceId) {
                // Tạo một object update tạm thời
                const updates = {}
                
                // 1. Cập nhật trạng thái kết nối realtime nếu backend trả về
                if (data.connectionStatus) {
                  updates.connectionStatus = data.connectionStatus
                  updates.status = data.connectionStatus === 'ONLINE' ? 'online' : 'offline'
                }
                
                // 2. Tiện thể cập nhật luôn Pin và khoảng cách thời gian thực nếu có
                if (data.battery !== undefined) updates.battery = data.battery
                if (data.distance !== undefined) updates.realtimeDistance = data.distance // Để dùng bên màn Detail

                return { ...v, ...updates }
              }
              return v
            })
          )
        }
      } catch (err) {
        console.log('[Global WS] Dữ liệu không phải JSON:', event.data)
      }
    }

    ws.onclose = () => {
      console.log('🔌 [Global WS] Đã ngắt kết nối lắng nghe.')
    }

    return () => {
      ws.close()
    }
  }, [currentUserId])
// --- HÀM GỬI LỆNH ĐIỀU KHIỂN CHUNG ---
  const sendCommand = (macAddress, cmd) => {
    if (globalWsRef.current && globalWsRef.current.readyState === WebSocket.OPEN) {
      const payload = { macAddress, cmd }
      globalWsRef.current.send(JSON.stringify(payload))
      console.log('🚀 [Global WS] Gửi lệnh:', payload)
    } else {
      console.warn('❌ WebSocket chưa kết nối hoặc đã bị ngắt!')
    }
  }
  // 1. LẤY TOÀN BỘ DANH SÁCH XE (ADMIN)
  const fetchAllVehicles = async (userId) => {
    if(userId) setCurrentUserId(userId) // Lưu lại userId để trigger chạy WS
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}`, { headers: getAuthHeader() })
      if (!response.ok) throw new Error('Không thể lấy toàn bộ danh sách!')
      const data = await response.json()
      setVehicles(data.map(mapDeviceToVehicle))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. LẤY DANH SÁCH XE CỦA TÔI
  const fetchMyVehicles = async (userId) => {
    if (!userId) return
    setCurrentUserId(userId) // Lưu lại userId để trigger chạy WS
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/my-devices/${userId}`, { headers: getAuthHeader() })
      if (!response.ok) throw new Error('Không thể lấy danh sách thiết bị của bạn!')
      const data = await response.json()
      setVehicles(data.map(mapDeviceToVehicle))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // CÁC HÀM KHÁC GIỮ NGUYÊN...
  const addVehicle = async (data, userId) => { /* ... */ }
  const requestVehicle = async (dbId, currentUserId, driverEmail) => { /* ... */ }
  const getDeviceTelemetry = async (dbId) => { /* ... */ }
  const approveRequest = async () => {}
  const denyRequest = async () => {}
  const removeVehicle = async () => {}

  return (
    <VehicleContext.Provider
      value={{
        vehicles, loading, error, globalWsRef,sendCommand, // Export thêm biến ref này để sử dụng gửi lệnh ở trang Detail
        fetchMyVehicles, fetchAllVehicles, addVehicle, requestVehicle, getDeviceTelemetry,
        approveRequest, denyRequest, removeVehicle
      }}
    >
      {children}
    </VehicleContext.Provider>
  )
}

export function useVehicles() {
  return useContext(VehicleContext)
}