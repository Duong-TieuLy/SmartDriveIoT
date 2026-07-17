import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { VehicleContext } from './VehicleContextInstance'

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const cleanApiUrl = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl
const API_BASE_URL = `${cleanApiUrl}/api/devices`
const TOKEN_KEY = 'autox_token' 

export function VehicleProvider({ children }) {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const globalWsRef = useRef(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [deviceLogs, setDeviceLogs] = useState({}) 
  const [telemetryData, setTelemetryData] = useState([])

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
    const cleanApi = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl
    const wsBaseUrl = cleanApi.replace(/^http/, 'ws')
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

  // 🟢 HÀM MỚI: Tải và gộp chung xe sở hữu + xe được chia sẻ (Không gây nhấp nháy UI)
  const fetchUserVehiclesCombined = async (userId) => {
    if (!userId) return
    setCurrentUserId(userId)
    setLoading(true); setError(null)
    try {
      const headers = getAuthHeader()
      // Gọi song song cả 2 API endpoint cùng lúc
      const [myRes, sharedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/my-devices/${userId}`, { headers }),
        fetch(`${API_BASE_URL}/shared-with-me/${userId}`, { headers })
      ])

      let myVehicles = []
      let sharedVehicles = []

      if (myRes.ok) myVehicles = await myRes.ok ? await myRes.json() : []
      if (sharedRes.ok) sharedVehicles = await sharedRes.ok ? await sharedRes.json() : []

      // Tránh trùng lặp thiết bị trùng ID (nếu có) bằng Map
      const combinedMap = new Map()
      myVehicles.forEach(d => combinedMap.set(d.macAddress, mapDeviceToVehicle(d)))
      sharedVehicles.forEach(d => combinedMap.set(d.macAddress, mapDeviceToVehicle(d)))

      setVehicles(Array.from(combinedMap.values()))
    } catch (err) { 
      setError(err.message) 
    } finally { 
      setLoading(false) 
    }
  }

  const fetchAllVehicles = async (userId) => {
    if(userId) setCurrentUserId(userId) 
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}`, { headers: getAuthHeader() })
      if (!res.ok) throw new Error('Không thể tải toàn bộ danh sách thiết bị.')
      const data = await res.json()
      setVehicles(data.map(mapDeviceToVehicle))
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const fetchMyVehicles = async (userId) => {
    if (!userId) return
    setCurrentUserId(userId) 
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/my-devices/${userId}`, { headers: getAuthHeader() })
      if (!res.ok) throw new Error('Không thể lấy danh sách xe của bạn.')
      const data = await res.json()
      setVehicles(data.map(mapDeviceToVehicle))
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const addVehicle = async (vehicleForm, userId) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/register/${userId}`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(vehicleForm)
      })
      if (!res.ok) throw new Error('Đăng ký thiết bị thất bại.')
      const newDevice = await res.json()
      setVehicles((prev) => [...prev, mapDeviceToVehicle(newDevice)])
      return true
    } catch (err) { setError(err.message); return false } finally { setLoading(false) }
  }

  const requestVehicle = async (deviceId, currentUserId, driverEmail) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/${deviceId}/share/${currentUserId}`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ email: driverEmail })
      })
      if (!res.ok) throw new Error('Chia sẻ xe không thành công.')
      
      await fetchUserVehiclesCombined(currentUserId)
      alert("Đã chia sẻ quyền sử dụng thiết bị thành công!")
    } catch (err) { alert(`Lỗi: ${err.message}`) } finally { setLoading(false) }
  }

  const getDeviceTelemetry = async (deviceId) => {
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/${deviceId}/telemetry`, { headers: getAuthHeader() })
      if (!res.ok) throw new Error('Không thể tải lịch sử telemetry.')
      const data = await res.json()
      setTelemetryData(data)
      return data
    } catch (err) { setError(err.message); return [] }
  }

  const fetchDevicesByEmail = async (email) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/by-email?email=${encodeURIComponent(email)}`, { headers: getAuthHeader() })
      if (!res.ok) throw new Error('Không tìm thấy xe theo email này.')
      const data = await res.json()
      return data.map(mapDeviceToVehicle)
    } catch (err) { setError(err.message); return [] } finally { setLoading(false) }
  }

  const removeVehicle = async (deviceId, userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thiết bị này khỏi hệ thống?")) return false
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/${deviceId}/owner/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      if (!res.ok) throw new Error('Xóa thiết bị thất bại.')
      setVehicles((prev) => prev.filter((v) => v.dbId !== deviceId))
      return true
    } catch (err) { setError(err.message); return false } finally { setLoading(false) }
  }

  const getDriversSharedForDevice = async (deviceId, userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${deviceId}/drivers/owner/${userId}`, { headers: getAuthHeader() })
      if (!res.ok) throw new Error('Lỗi lấy danh sách tài xế được share.')
      return await res.json()
    } catch (err) { console.error(err); return [] }
  }

  const fetchSharedDevicesForMe = async (driverId) => {
    if (!driverId) return
    setCurrentUserId(driverId)
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/shared-with-me/${driverId}`, { headers: getAuthHeader() })
      if (!res.ok) throw new Error('Không thể tải danh sách xe được chia sẻ với bạn.')
      const data = await res.json()
      setVehicles(data.map(mapDeviceToVehicle))
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <VehicleContext.Provider
      value={{
        vehicles, loading, error, globalWsRef, deviceLogs, telemetryData,
        sendCommand, fetchMyVehicles, fetchAllVehicles, addVehicle, requestVehicle, 
        getDeviceTelemetry, fetchDevicesByEmail, removeVehicle, getDriversSharedForDevice, 
        fetchSharedDevicesForMe, fetchUserVehiclesCombined
      }}
    >
      {children}
    </VehicleContext.Provider>
  )
}