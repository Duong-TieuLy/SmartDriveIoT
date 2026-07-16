// Danh sách tài khoản mẫu để demo việc phân quyền ngay trên trang đăng nhập
// dùng chung. Khi tích hợp backend thật, thay toàn bộ bằng lệnh gọi API
// xác thực (POST /api/auth/login) trả về { id, email, fullName, role } và
// bỏ hẳn danh sách này — role nên do backend quyết định, không phải client.
//
// role: 'admin' | 'passenger' | 'operator'

export const mockAccounts = [
  {
    id: 'acc-admin',
    email: 'admin@autox.vn',
    password: 'admin123',
    role: 'admin',
    fullName: 'Quản trị viên AUTOX',
    phone: '0900 000 000',
  },
  {
    id: 'acc-demo-user',
    email: 'user@autox.vn',
    password: 'user1234',
    role: 'passenger',
    fullName: 'Nguyễn Văn A',
    phone: '0901 234 567',
  },
]
