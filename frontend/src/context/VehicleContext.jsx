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

  // NÂNG CẤP: State lưu trữ log debug từ xe để các component giao diện (ví dụ Terminal/Log View) có thể sub và hiển thị
  const [deviceLogs, setDeviceLogs] = useState({}) 

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
        
        // Bắt buộc phải có deviceId để biết cập nhật cho xe nào
        if (!data.deviceId) return

        switch (data.type) {
          case 'TELEMETRY':
            // Cập nhật thông số khoảng cách/pin thời gian thực
            setVehicles((prevVehicles) =>
              prevVehicles.map((v) => 
                v.id === data.deviceId 
                  ? { ...v, realtimeDistance: data.distance, battery: data.battery !== undefined ? data.battery : v.battery } 
                  : v
              )
            )
            break

          case 'STATUS_CHANGE':
            // Cập nhật trạng thái ONLINE / OFFLINE của thiết bị
            setVehicles((prevVehicles) =>
              prevVehicles.map((v) => 
                v.id === data.deviceId 
                  ? { 
                      ...v, 
                      connectionStatus: data.connectionStatus, 
                      status: data.connectionStatus === 'ONLINE' ? 'online' : 'offline' 
                    } 
                  : v
              )
            )
            break

          case 'DEVICE_LOG':
            // Xử lý chuỗi Log văn bản thô (Mạch cầu H, Nút bấm debug...) từ ESP32 đưa lên công khai
            console.log(`[🚗 Xe Debug Log - ${data.deviceId}]: ${data.message}`)
            
            // Cập nhật log vào state theo từng thiết bị (Lưu tối đa 50 dòng log gần nhất để tránh tràn RAM trình duyệt)
            setDeviceLogs((prevLogs) => {
              const currentDeviceLogs = prevLogs[data.deviceId] || []
              const updatedLogs = [...currentDeviceLogs, { timestamp: new Date().toLocaleTimeString(), text: data.message }]
              if (updatedLogs.length > 50) updatedLogs.shift() 
              return { ...prevLogs, [data.deviceId]: updatedLogs }
            })
            break

          default:
            // Dự phòng cho cấu hình cũ hoặc data định dạng khác chưa phân loại cụ thể
            if (data.distance !== undefined || data.connectionStatus) {
              setVehicles((prevVehicles) =>
                prevVehicles.map((v) => {
                  if (v.id === data.deviceId) {
                    const updates = {}
                    if (data.connectionStatus) {
                      updates.connectionStatus = data.connectionStatus
                      updates.status = data.connectionStatus === 'ONLINE' ? 'online' : 'offline'
                    }
                    if (data.distance !== undefined) updates.realtimeDistance = data.distance
                    return { ...v, ...updates }
                  }
                  return v
                })
              )
            }
            break
        }
      } catch (err) {
        // Trường hợp chuỗi văn bản thuần túy lọt qua bộ lọc của Backend (hiếm khi xảy ra nữa)
        console.error('[Global WS] Lỗi xử lý hoặc cấu trúc dữ liệu lạ:', event.data, err)
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
    if(userId) setCurrentUserId(userId) 
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
    setCurrentUserId(userId) 
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

  const addVehicle = async (data, userId) => { /* ... */ }
  const requestVehicle = async (dbId, currentUserId, driverEmail) => { /* ... */ }
  const getDeviceTelemetry = async (dbId) => { /* ... */ }
  const approveRequest = async () => {}
  const denyRequest = async () => {}
  const removeVehicle = async () => {}

  return (
    <VehicleContext.Provider
      value={{
        vehicles, loading, error, globalWsRef, sendCommand, deviceLogs, // Export thêm `deviceLogs` để màn hình Detail xe dùng hiển thị Console Log box
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