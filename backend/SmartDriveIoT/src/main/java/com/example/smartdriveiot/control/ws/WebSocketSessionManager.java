package com.example.smartdriveiot.control.ws;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSessionManager {

    private final ConcurrentHashMap<String, WebSocketSession> deviceSessions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();

    public void addDeviceSession(String macAddress, WebSocketSession session) {
        deviceSessions.put(macAddress, session);
    }

    public void removeDeviceSession(String macAddress) {
        deviceSessions.remove(macAddress);
    }

    public WebSocketSession getDeviceSession(String macAddress) {
        return deviceSessions.get(macAddress);
    }

    public void addUserSession(String userId, WebSocketSession session) {
        userSessions.put(userId, session);
    }

    public void removeUserSession(String userId) {
        userSessions.remove(userId);
    }

    public void sendDataToUser(String userId, String message) {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(message));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    // ================= TÍCH HỢP BỔ SUNG =================

    // 1. Gửi lệnh xuống một xe cụ thể (Dùng khi người dùng điều khiển hoặc hệ thống ép rẽ)
    public void sendDataToDevice(String macAddress, String message) {
        WebSocketSession session = deviceSessions.get(macAddress);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(message));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    // 2. Gửi dữ liệu cho tất cả người dùng đang kết nối (Broadcast telemetry)
    public void sendDataToAllUsers(String message) {
        userSessions.forEach((userId, session) -> {
            if (session != null && session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }
}