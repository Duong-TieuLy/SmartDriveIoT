package com.example.smartdriveiot.config;

import com.example.smartdriveiot.control.ws.CarWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final CarWebSocketHandler carWebSocketHandler; // Trỏ sang Handler mới của bạn

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(carWebSocketHandler, "/ws/iot")
                .setAllowedOrigins("*"); // Cho phép kết nối tự do không chặn CORS
    }
}