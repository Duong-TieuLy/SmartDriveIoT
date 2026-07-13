package com.example.smartdriveiot.config;

import com.example.smartdriveiot.common.util.JwtTokenUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenUtil jwtTokenUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;
        String role = null;
        boolean isValid = false;

        // 1. Kiểm tra nhanh sự tồn tại của Header chứa Token
        if (authHeader == null || !authHeader.startsWith("Bearer ") || authHeader.trim().length() <= 7) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        // 2. CHỈ bọc try-catch duy nhất đoạn parse/validate Token thô
        try {
            if (jwtTokenUtil.isTokenValid(jwt)) {
                role = jwtTokenUtil.extractRole(jwt); // Lấy chuỗi quyền thô: "USER" hoặc "ADMIN"
                isValid = true;
            }
        } catch (Exception e) {
            // Nếu token hết hạn hoặc lỗi định dạng, xóa sạch context cũ
            SecurityContextHolder.clearContext();
        }

        // 3. Nếu Token hợp lệ, tiến hành trích xuất Username và nạp quyền (NẰM NGOÀI TRY-CATCH)
        if (isValid && role != null) {
            username = jwtTokenUtil.extractUsername(jwt);

            // CHUẨN HÓA QUYỀN: Kiểm tra xem chuỗi role từ token đã có tiền tố "ROLE_" chưa để tránh lặp từ
            String authorityName = role.startsWith("ROLE_") ? role : "ROLE_" + role;

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    Collections.singletonList(new SimpleGrantedAuthority(authorityName))
            );

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        // 4. Cho phép request đi tiếp sang Filter tiếp theo (Bắt buộc nằm ngoài hoàn toàn)
        filterChain.doFilter(request, response);
    }
}