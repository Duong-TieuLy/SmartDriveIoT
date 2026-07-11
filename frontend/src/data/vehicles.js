// Dữ liệu mẫu, được VehicleProvider nạp lần đầu rồi lưu vào localStorage.
// Khi tích hợp backend, thay bằng dữ liệu lấy từ API (ví dụ GET /api/vehicles)
// theo đúng cấu trúc bên dưới.
//
// assignedTo:    id user hiện được phép sử dụng xe này (null = chưa gán ai)
// requestedBy:   id user đang chờ admin duyệt quyền sử dụng (null nếu không có)
// requestStatus: 'none' | 'pending'
// condition:     'good' | 'check' | 'error'  (dùng cho trang Xem trạng thái xe)

export const initialVehicles = [
  {
    id: 'v1',
    name: 'AUTOX Model S1',
    plate: '51A-888.19',
    location: 'Quận 1, TP.HCM',
    distance: '0.4 km',
    battery: 92,
    condition: 'good',
    assignedTo: 'acc-demo-user',
    requestedBy: null,
    requestStatus: 'none',
  },
  {
    id: 'v2',
    name: 'AUTOX Shuttle X2',
    plate: '51A-772.04',
    location: 'Quận 3, TP.HCM',
    distance: '1.1 km',
    battery: 78,
    condition: 'good',
    assignedTo: 'acc-demo-user',
    requestedBy: null,
    requestStatus: 'none',
  },
  {
    id: 'v3',
    name: 'AUTOX Compact E1',
    plate: '51A-905.61',
    location: 'Bình Thạnh, TP.HCM',
    distance: '2.3 km',
    battery: 65,
    condition: 'check',
    assignedTo: 'acc-demo-user',
    requestedBy: null,
    requestStatus: 'none',
  },
  {
    id: 'v4',
    name: 'AUTOX Cargo T3',
    plate: '51C-221.87',
    location: 'Quận 7, TP.HCM',
    distance: '3.8 km',
    battery: 54,
    condition: 'good',
    assignedTo: null,
    requestedBy: null,
    requestStatus: 'none',
  },
  {
    id: 'v5',
    name: 'AUTOX Executive P1',
    plate: '51A-410.33',
    location: 'Quận 2, TP.HCM',
    distance: '4.5 km',
    battery: 88,
    condition: 'error',
    assignedTo: null,
    requestedBy: null,
    requestStatus: 'none',
  },
  {
    id: 'v6',
    name: 'AUTOX Shuttle X2 Pro',
    plate: '51A-556.90',
    location: 'Thủ Đức, TP.HCM',
    distance: '5.9 km',
    battery: 71,
    condition: 'good',
    assignedTo: null,
    requestedBy: 'acc-demo-user',
    requestStatus: 'pending',
  },
]
