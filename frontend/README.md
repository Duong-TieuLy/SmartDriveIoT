# AUTOX — Điều phối xe tự hành (User + Admin)

Ứng dụng React 18 + Vite + React Router, có 2 vai trò dùng chung một trang đăng nhập:

- **User** (Hành khách / Người vận hành): đăng ký, xem xe, yêu cầu dùng xe, xem trạng thái xe, điều khiển xe, quản lý hồ sơ cá nhân.
- **Admin** (tài khoản cấp sẵn, không tự đăng ký): quản lý người dùng, duyệt yêu cầu dùng xe, xem báo lỗi, quản lý đội xe (thêm/sửa/gán/thu hồi).

Vai trò do hệ thống xác thực trả về khi đăng nhập — **không** thể chọn vai trò trên giao diện, và người dùng không đủ quyền sẽ bị chặn khỏi khu vực tương ứng.

## Cài đặt

```bash
npm install
npm run dev
```

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị (Admin) | `admin@autox.vn` | `admin123` |
| Người dùng (Hành khách) | `user@autox.vn` | `user123` |

Trang đăng nhập cũng hiển thị sẵn 2 tài khoản này để tiện demo. Đăng ký tài khoản mới qua trang `/register` sẽ luôn tạo tài khoản **người dùng** (Hành khách/Người vận hành) — trang này không tạo được tài khoản admin, đúng theo mô hình thực tế (admin được cấp phát, không tự đăng ký).

## Cách phân quyền hoạt động

- `AuthContext` (`src/context/AuthContext.jsx`) giữ danh sách tài khoản và phiên đăng nhập hiện tại, lưu tạm ở `localStorage` để demo không cần backend.
- `RequireUser` (`src/components/RequireUser.jsx`) bảo vệ các trang phía User: chưa đăng nhập → về `/login`; đăng nhập bằng tài khoản admin → tự động chuyển sang `/admin/users`.
- `RequireRole role="admin"` (`src/components/RequireRole.jsx`) bảo vệ các trang phía Admin: chỉ tài khoản có `role === 'admin'` mới vào được; sai role → đưa về khu vực đúng với role thật của họ.
- `VehicleContext` (`src/context/VehicleContext.jsx`) là nguồn dữ liệu xe **dùng chung** giữa 2 phía: khi Admin gán/thu hồi/duyệt yêu cầu, Dashboard của User cập nhật ngay lập tức (không cần refresh) vì cùng đọc từ một context.

## Cấu trúc thư mục

```
src/
  context/
    AuthContext.jsx        # Tài khoản + phiên đăng nhập (login/register/xóa/cập nhật)
    VehicleContext.jsx     # Dữ liệu xe dùng chung (CRUD, gán, thu hồi, duyệt yêu cầu)
  components/
    AppTopbar.jsx            # Topbar phía User (Bảng điều khiển / Thông tin cá nhân)
    AdminTopbar.jsx           # Topbar phía Admin (Quản lý người dùng / Quản lý xe)
    RequireUser.jsx           # Guard cho route phía User
    RequireRole.jsx            # Guard cho route theo role cụ thể (dùng cho Admin)
    Modal.jsx                   # Modal dùng chung cho form Thêm/Cập nhật/Gán xe
    AuthLayout.jsx, TelemetryPanel.jsx, FormField.jsx, VehicleCard.jsx
  pages/
    Login.jsx, Register.jsx
    Dashboard.jsx, VehicleDetail.jsx, Profile.jsx      # Phía User
    admin/
      AdminUsers.jsx          # Danh sách User, xóa User, duyệt/từ chối yêu cầu, xem báo lỗi
      AdminVehicles.jsx        # Danh sách xe, thêm, cập nhật, gán cho user, thu hồi
  data/
    accounts.js, vehicles.js, reports.js, user.js
  App.jsx                     # Định tuyến + áp guard cho từng khu vực
  main.jsx                     # Bọc AuthProvider + VehicleProvider
  index.css                     # Toàn bộ biến màu + style
```

## Luồng nghiệp vụ chính (bám theo use case Admin)

- **Quản lý người dùng** → *Xem danh sách User*, *Xóa User*: tab "Người dùng" trong `AdminUsers.jsx`.
- **Xem yêu cầu dùng xe** → *Duyệt* / *Không duyệt*: tab "Yêu cầu dùng xe" — duyệt sẽ gán thẳng xe cho người yêu cầu (`approveRequest`), từ chối sẽ xoá yêu cầu (`denyRequest`).
- **Xem báo lỗi của User**: tab "Báo lỗi", đọc từ `data/reports.js` (mock, vì user hiện chưa có màn gửi báo lỗi).
- **Quản lý xe** → *Xem danh sách xe*, *Thêm xe*, *Cập nhật thông tin xe*, *Gán xe cho User*, *Thu hồi xe*: toàn bộ trong `AdminVehicles.jsx`, dùng chung modal cho form thêm/sửa và form gán xe.

## Kết nối API thật

Khi có backend, thay các hàm trong `AuthContext` và `VehicleContext` bằng lệnh gọi API tương ứng (`/api/auth/login`, `/api/auth/register`, `/api/users`, `/api/vehicles`, `/api/vehicles/:id/request`, `/api/vehicles/:id/assign`...) và bỏ hẳn phần đọc/ghi `localStorage` — role và dữ liệu nên do backend quyết định, không phải client.
