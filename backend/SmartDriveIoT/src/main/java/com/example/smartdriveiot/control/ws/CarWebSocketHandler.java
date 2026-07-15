package com.example.smartdriveiot.control.ws;

import com.example.smartdriveiot.common.enums.Status;
import com.example.smartdriveiot.control.ControlService;
import com.example.smartdriveiot.device.Device;
import com.example.smartdriveiot.device.DeviceRepository;
import com.example.smartdriveiot.device.TelemetryData;
import com.example.smartdriveiot.device.TelemetryDataRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class CarWebSocketHandler extends TextWebSocketHandler {

    private final WebSocketSessionManager sessionManager;
    private final DeviceRepository deviceRepository;
    private final TelemetryDataRepository telemetryDataRepository;
    private final ControlService controlService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Lưu trữ chế độ vận hành trên RAM (Key: MAC Address, Value: "MANUAL" hoặc "AUTO")
    private static final Map<String, String> deviceModes = new ConcurrentHashMap<>();

    // NÂNG CẤP: Lưu trạng thái di chuyển tự động hiện tại của xe để tránh spam lệnh (Ví dụ: "FORWARD", "LEFT")
    private static final Map<String, String> deviceAutoStates = new ConcurrentHashMap<>();

    private static final double CRITICAL_DISTANCE_CM = 20.0;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Map<String, String> params = getQueryParams(session.getUri());
        String type = params.get("type");
        String id = params.get("id");

        if (type == null || id == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        if ("DEVICE".equalsIgnoreCase(type)) {
            sessionManager.addDeviceSession(id, session);
            deviceModes.put(id, "MANUAL");
            deviceAutoStates.put(id, "STOP"); // Mặc định xe đứng yên hoặc chưa kích hoạt auto state
            log.info("Xe IoT [{}] đã kết nối mạng thành công! Chế độ mặc định: MANUAL", id);

            updateDeviceStatus(id, Status.ONLINE);

        } else if ("USER".equalsIgnoreCase(type)) {
            sessionManager.addUserSession(id, session);
            log.info("Người dùng ID [{}] đã mở bảng điều khiển!", id);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        Map<String, String> params = getQueryParams(session.getUri());
        String type = params.get("type");
        String id = params.get("id");

        if ("USER".equalsIgnoreCase(type)) {
            try {
                Map<String, String> request = objectMapper.readValue(payload, Map.class);
                String macAddress = request.get("macAddress");
                String command = request.get("cmd").toUpperCase();

                // 1. Thao tác chuyển đổi trạng thái chế độ tự lái
                if (command.startsWith("MODE_")) {
                    String newMode = command.replace("MODE_", "");
                    deviceModes.put(macAddress, newMode);
                    log.info("🔄 Chuyển xe [{}] sang chế độ vận hành: {}", macAddress, newMode);

                    // Nếu chuyển từ AUTO về MANUAL, reset trạng thái tự động lái của xe
                    if ("MANUAL".equals(newMode)) {
                        deviceAutoStates.put(macAddress, "STOP");
                    } else if ("AUTO".equals(newMode)) {
                        // Khi vừa bật AUTO, ra lệnh cho xe tiến về phía trước luôn
                        deviceAutoStates.put(macAddress, "FORWARD");
                        sessionManager.sendDataToDevice(macAddress, "FORWARD");
                    }

                    sessionManager.sendDataToDevice(macAddress, "SET_MODE:" + newMode);
                    return;
                }

                // 2. Chặn các thao tác thủ công khi hệ thống đang tự động lái
                if ("AUTO".equals(deviceModes.getOrDefault(macAddress, "MANUAL"))) {
                    sessionManager.sendDataToUser(id, "{\"error\":\"Xe đang ở chế độ Tự động tránh vật cản! Hãy tắt AUTO trước.\"}");
                    return;
                }

                // 3. Nếu đang ở chế độ MANUAL, bắn lệnh thô xuống cho xe thực thi
                sessionManager.sendDataToDevice(macAddress, command);

                // 4. Ghi nhận lịch sử thao tác vào DB
                controlService.saveCommand(macAddress, id, command, "SENT");
                log.info("[🎮 MANUAL] Đã chuyển tiếp lệnh [{}] tới xe [{}] từ Người dùng [{}]", command, macAddress, id);

            } catch (Exception e) {
                log.error("Lỗi xử lý gói tin từ giao diện Người dùng: {}", e.getMessage());
            }
        }

        // ========================================================
// KỊCH BẢN 2: XE (DEVICE) BẮN DỮ LIỆU LÊN
// ========================================================
        else if ("DEVICE".equalsIgnoreCase(type)) {
            try {
                // Cố gắng parse thử xem có phải là số đo khoảng cách từ cảm biến siêu âm không
                double distance = Double.parseDouble(payload);

                // 1. Nếu là số: Gửi dữ liệu khoảng cách hợp lệ về Frontend
                sessionManager.sendDataToAllUsers(String.format(
                        java.util.Locale.US,
                        "{\"type\":\"TELEMETRY\", \"deviceId\":\"%s\", \"distance\": %.2f}",
                        id, distance
                ));

                // -------------- LOGIC TỰ ĐỘNG TRÁNH VẬT CẢN (AUTO MODE) --------------
                if ("AUTO".equals(deviceModes.get(id))) {
                    String currentAutoState = deviceAutoStates.getOrDefault(id, "FORWARD");

                    if (distance > 0 && distance < CRITICAL_DISTANCE_CM) {
                        // VÙNG NGUY HIỂM: Gặp vật cản
                        // Nâng cấp: Thay vì chỉ gửi 1 lần duy nhất rồi im lặng, ta duy trì gửi lệnh LEFT
                        // để đảm bảo xe nhận đủ động lực rẽ thoát khỏi vật cản (đề phòng mất gói tin UART)
                        deviceAutoStates.put(id, "LEFT");
                        sessionManager.sendDataToDevice(id, "LEFT");

                        // Chỉ ghi nhận vào Database một lần đầu tiên khi đổi trạng thái để tránh làm ngập DB
                        if (!"LEFT".equals(currentAutoState)) {
                            log.warn("🚨 [AUTO] Xe [{}] phát hiện vật cản ({} cm). Tiến hành tự rẽ TRÁI!", id, distance);
                            controlService.saveCommand(id, null, "LEFT", "AUTO_STOPPED");
                        }

                    } else if (distance >= CRITICAL_DISTANCE_CM) {
                        // VÙNG AN TOÀN: Đường thoáng
                        // Nếu trước đó xe đang rẽ tránh vật cản hoặc đang đứng yên, lập tức phát lệnh tiến thẳng
                        if (!"FORWARD".equals(currentAutoState)) {
                            deviceAutoStates.put(id, "FORWARD");
                            log.info("✅ [AUTO] Đường đã thoáng ({} cm). Xe [{}] quay lại trạng thái tiến thẳng FORWARD.", distance, id);

                            sessionManager.sendDataToDevice(id, "FORWARD");
                            controlService.saveCommand(id, null, "FORWARD", "AUTO_RESUMED");
                        } else {
                            // Đảm bảo xe luôn chạy: Gửi giữ nhịp FORWARD định kỳ nếu xe đang ở trạng thái tiến
                            // Điều này giúp xe không bị dừng lại do các xung nhiễu hoặc lệnh STOP vô tình từ phần cứng
                            sessionManager.sendDataToDevice(id, "FORWARD");
                        }
                    }
                }
                //---------------------------------------------------------------------

                // Lưu DB
                Optional<Device> deviceOpt = deviceRepository.findByMacAddress(id);
                if (deviceOpt.isPresent()) {
                    TelemetryData telemetryData = TelemetryData.builder()
                            .device(deviceOpt.get())
                            .distanceCm(distance)
                            .build();
                    telemetryDataRepository.save(telemetryData);
                }

            } catch (NumberFormatException e) {
                // 2. Nếu BỊ LỖI PARSE: Chứng tỏ đây là chuỗi Log Debug từ ESP32 (Ví dụ: ">>> LỆNH: XE DỪNG... <<<")
                log.info(" Tin nhắn log từ xe [{}]: {}", id, payload);

                // Bọc chuỗi này vào JSON hợp lệ (thêm dấu ngoặc kép cho phần text) để gửi về Frontend hiển thị lên màn hình console/log của User nếu cần
                String safeLogJson = String.format(
                        "{\"type\":\"DEVICE_LOG\", \"deviceId\":\"%s\", \"message\":\"%s\"}",
                        id, payload.replace("\"", "\\\"") // Escape dấu nháy kép nếu có trong log của ESP32
                );
                sessionManager.sendDataToAllUsers(safeLogJson);
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Map<String, String> params = getQueryParams(session.getUri());
        String type = params.get("type");
        String id = params.get("id");

        if ("DEVICE".equalsIgnoreCase(type)) {
            sessionManager.removeDeviceSession(id);
            deviceModes.remove(id);
            deviceAutoStates.remove(id); // Dọn dẹp bộ nhớ RAM cho Auto State
            log.warn("Xe IoT [{}] đã mất kết nối (OFFLINE)!", id);

            updateDeviceStatus(id, Status.OFFLINE);

        } else if ("USER".equalsIgnoreCase(type)) {
            sessionManager.removeUserSession(id);
            log.info("Người dùng ID [{}] đã tắt bảng điều khiển!", id);
        }
    }

    private void updateDeviceStatus(String macAddress, Status status) {
        deviceRepository.findByMacAddress(macAddress).ifPresent(device -> {
            device.setStatus(status);
            deviceRepository.save(device);
            log.info("[DB] Cập nhật trạng thái thiết bị [{}] sang: {}", macAddress, status);
            String statusPayload = String.format(
                    "{\"type\":\"STATUS_CHANGE\", \"deviceId\":\"%s\", \"connectionStatus\":\"%s\"}",
                    macAddress, status.name()
            );
            sessionManager.sendDataToAllUsers(statusPayload);
        });
    }

    private Map<String, String> getQueryParams(URI uri) {
        Map<String, String> map = new HashMap<>();
        if (uri == null || uri.getQuery() == null) return map;
        String[] params = uri.getQuery().split("&");
        for (String param : params) {
            String[] kv = param.split("=");
            if (kv.length > 1) map.put(kv[0], kv[1]);
        }
        return map;
    }
}