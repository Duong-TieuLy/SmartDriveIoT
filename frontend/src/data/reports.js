// Dữ liệu mẫu. Khi tích hợp backend, thay bằng dữ liệu lấy từ API
// (ví dụ GET /api/reports) — thường được tạo khi user gửi báo lỗi từ
// trang chi tiết xe.

export const mockReports = [
  {
    id: 'r1',
    userId: 'acc-demo-user',
    vehicleName: 'AUTOX Model S1',
    title: 'Cảm biến va chạm báo lỗi liên tục',
    description:
      'Xe liên tục cảnh báo vật cản dù đường trống, phải chuyển sang chế độ thủ công để tiếp tục di chuyển.',
    createdAt: '05/07/2026',
    status: 'open', // 'open' | 'resolved'
  },
  {
    id: 'r2',
    userId: 'acc-demo-user',
    vehicleName: 'AUTOX Shuttle X2',
    title: 'Pin sụt nhanh bất thường',
    description: 'Pin giảm từ 80% xuống 40% chỉ sau khoảng 15 phút di chuyển trong nội thành.',
    createdAt: '02/07/2026',
    status: 'resolved',
  },
]
