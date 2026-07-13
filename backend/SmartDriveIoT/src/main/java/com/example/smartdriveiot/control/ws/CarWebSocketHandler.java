package com.example.smartdriveiot.control.ws;

import com.example.smartdriveiot.common.enums.Status;
import com.example.smartdriveiot.control.ControlService; // Import lớp xử lý lưu ControlHistory của bạn
import com.example.smartdriveiot.device.Device;
import com.example.smartdriveiot.device.DeviceRepository;
import com.example.smartdriveiot.device.TelemetryData;
import com.example.smartdriveiot.device.TelemetryDataRepository;
import com.fasterxml.jackson.databind.ObjectMapper; // Dùng để đọc dữ liệu JSON từ User
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
    private final ControlService controlService; // Tiêm vào để lưu lịch sử điều khiển
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Lưu trữ chế độ vận hành trên RAM của từng thiết bị (Key: MAC Address, Value: "MANUAL" hoặc "AUTO")
    private static final Map<String, String> deviceModes = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Map<String, String> params = getQueryParams(session.getUri());
        String type = params.get("type");
        String id = params.get("id");     // Mã MAC Address hoặc User ID

        if (type == null || id == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        if ("DEVICE".equalsIgnoreCase(type)) {
            sessionManager.addDeviceSession(id, session);
            deviceModes.put(id, "MANUAL"); // Mặc định xe kết nối mới sẽ ở chế độ THỦ CÔNG
            log.info("Xe IoT [{}] đã kết nối mạng thành công! Chế độ mặc định: MANUAL", id);

            // Cập nhật trạng thái xe thành ONLINE ở database
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
        String id = params.get("id"); // Nếu type=USER thì id chính là userId, nếu type=DEVICE thì id là MAC

        // ========================================================
        // KỊCH BẢN 1: NGƯỜI DÙNG (USER) GỬI LỆNH ĐIỀU KHIỂN HOẶC ĐỔI CHẾ ĐỘ
        // ========================================================
        if ("USER".equalsIgnoreCase(type)) {
            try {
                // Định dạng JSON từ Web: {"macAddress":"ESP32-TEST-MAC", "cmd":"FORWARD"} hoặc {"macAddress":"ESP32-TEST-MAC", "cmd":"MODE_AUTO"}
                Map<String, String> request = objectMapper.readValue(payload, Map.class);
                String macAddress = request.get("macAddress");
                String command = request.get("cmd").toUpperCase();

                // 1. Thao tác chuyển đổi trạng thái chế độ tự lái
                if (command.startsWith("MODE_")) {
                    String newMode = command.replace("MODE_", ""); // Tách ra chữ "MANUAL" hoặc "AUTO"
                    deviceModes.put(macAddress, newMode);
                    log.info("🔄 Chuyển xe [{}] sang chế độ vận hành: {}", macAddress, newMode);

                    // Báo hiệu xuống mạch thực tế (để hiển thị LED hoặc còi báo nếu cần)
                    sessionManager.sendDataToDevice(macAddress, "SET_MODE:" + newMode);
                    return;
                }

                // 2. Chặn các thao tác thủ công khi hệ thống đang tự động lái
                if ("AUTO".equals(deviceModes.getOrDefault(macAddress, "MANUAL"))) {
                    sessionManager.sendDataToUser(id, "{\"error\":\"Xe đang ở chế độ Tự động tránh vật cản! Hãy tắt AUTO trước.\"}");
                    return;
                }

                // 3. Nếu đang ở chế độ MANUAL, bắn lệnh thô xuống cho xe thực thi (FORWARD, BACKWARD, LEFT, RIGHT, STOP)
                sessionManager.sendDataToDevice(macAddress, command);

                // 4. Ghi nhận lịch sử thao tác của người dùng vào Database
                controlService.saveCommand(macAddress, id, command, "SENT");
                log.info("[🎮 MANUAL] Đã chuyển tiếp lệnh [{}] tới xe [{}] từ Người dùng [{}]", command, macAddress, id);

            } catch (Exception e) {
                log.error("Lỗi xử lý gói tin từ giao diện Người dùng: {}", e.getMessage());
            }
        }

        // ========================================================
        // KỊCH BẢN 2: XE (DEVICE) BẮN DỮ LIỆU CẢM BIẾN SIÊU ÂM LÊN
        // ========================================================
        else if ("DEVICE".equalsIgnoreCase(type)) {
            log.info("Nhận dữ liệu siêu âm từ xe [{}]: {} cm", id, payload);

            // 1. Chuyển tiếp dữ liệu thời gian thực tới toàn bộ Giao diện người dùng
            sessionManager.sendDataToAllUsers("{\"deviceId\":\"" + id + "\",\"distance\": " + payload + "}");

            // 2. Xử lý lưu thông tin khoảng cách & kiểm tra va chạm tự động
            try {
                Double distance = Double.parseDouble(payload);

                // -------------- LOGIC TỰ ĐỘNG TRÁNH VẬT CẢN (AUTO MODE) --------------
                if ("AUTO".equals(deviceModes.get(id))) {
                    if (distance > 0 && distance < 20.0) { // Khoảng cách nguy hiểm cấu hình là < 20cm
                        log.warn("🚨 [CẢNH BÁO AUTO] Xe [{}] phát hiện vật cản quá gần ({} cm). Tiến hành tự rẽ tránh!", id, distance);

                        // Bước A: Ra lệnh ép xe quẹo gấp (Ví dụ rẽ LEFT để tránh)
                        sessionManager.sendDataToDevice(id, "LEFT");

                        // Bước B: Lưu lịch sử hệ thống tự điều khiển (user_id = null, status = "AUTO_STOPPED")
                        controlService.saveCommand(id, null, "LEFT", "AUTO_STOPPED");
                    }
                }
                // ---------------------------------------------------------------------

                Optional<Device> deviceOpt = deviceRepository.findByMacAddress(id);
                if (deviceOpt.isPresent()) {
                    TelemetryData telemetryData = TelemetryData.builder()
                            .device(deviceOpt.get())
                            .distanceCm(distance)
                            .build();
                    telemetryDataRepository.save(telemetryData);
                } else {
                    log.warn("Thiết bị có mã MAC [{}] chưa được đăng ký trong hệ thống để lưu DB!", id);
                }
            } catch (NumberFormatException e) {
                log.info("Tin nhắn chuỗi văn bản thông thường từ xe [{}]: {}", id, payload);
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
            deviceModes.remove(id); // Làm sạch bộ nhớ RAM khi thiết bị mất kết nối
            log.warn("Xe IoT [{}] đã mất kết nối (OFFLINE)!", id);

            // Cập nhật trạng thái xe thành OFFLINE ở database
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