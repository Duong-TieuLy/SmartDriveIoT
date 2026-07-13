package com.example.smartdriveiot.identity;

import com.example.smartdriveiot.common.util.JwtTokenUtil;
import com.example.smartdriveiot.common.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;

    // Logic Đăng ký
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password())) // Mã hóa bảo mật mật khẩu
                .fullName(request.fullName())
                .role(Role.USER) // Gán giá trị mặc định bằng Enum Role
                .build();

        userRepository.save(user);
        return "Đăng ký tài khoản thành công!";
    }

    // Logic Đăng nhập
    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không chính xác!"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new RuntimeException("Email hoặc mật khẩu không chính xác!");
        }

        // Chuyển đổi Role sang String để JwtTokenUtil nạp vào Claims mã hóa
        return jwtTokenUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
    }
}