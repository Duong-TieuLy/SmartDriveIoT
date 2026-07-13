package com.example.smartdriveiot.identity;

import com.example.smartdriveiot.common.enums.Role;

// DTO hứng dữ liệu đăng ký (Bỏ trường username cũ)
record RegisterRequest(String password, String email, String fullName) {}

// DTO hứng dữ liệu đăng nhập bằng Email
record LoginRequest(String email, String password) {}

// DTO trả về thông tin User an toàn (Dùng Enum Role)
record UserResponse(Long id, String email, String fullName, Role role) {}

// DTO đổi mật khẩu
record ChangePasswordRequest(String oldPassword, String newPassword) {}