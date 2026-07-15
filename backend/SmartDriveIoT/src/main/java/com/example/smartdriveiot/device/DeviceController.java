package com.example.smartdriveiot.device;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')") // Phân hệ xe yêu cầu phải đăng nhập
public class DeviceController {

    private final DeviceService deviceService;
    // Đăng ký một xe mới (Truyền ID người dùng sở hữu xe qua tham số cấu hình hoặc header)
    @PostMapping("/register/{userId}")
    public ResponseEntity<DeviceResponse> registerDevice(@RequestBody DeviceCreateRequest request, @PathVariable Long userId) {
        return ResponseEntity.ok(deviceService.registerDevice(request, userId));
    }

    // Chia sẻ xe cho tài xế khác (userId là ID của chủ xe hiện tại)
    @PostMapping("/{deviceId}/share/{userId}")
    public ResponseEntity<String> shareDevice(@PathVariable Long deviceId, @RequestBody ShareDeviceRequest request, @PathVariable Long userId) {
        return ResponseEntity.ok(deviceService.shareDevice(deviceId, request, userId));
    }

    // Lấy danh sách xe của tôi
    @GetMapping("/my-devices/{userId}")
    public ResponseEntity<List<DeviceResponse>> getMyDevices(@PathVariable Long userId) {
        return ResponseEntity.ok(deviceService.getMyDevices(userId));
    }

    // Xem lịch sử đo khoảng cách của xe
    @GetMapping("/{deviceId}/telemetry")
    public ResponseEntity<List<TelemetryResponse>> getDeviceTelemetry(@PathVariable Long deviceId) {
        return ResponseEntity.ok(deviceService.getDeviceTelemetry(deviceId));
    }
    @GetMapping("/by-email")
    public ResponseEntity<List<DeviceResponse>> getDevicesByEmail(@RequestParam String email) {
        return ResponseEntity.ok(deviceService.getDevicesByEmail(email));
    }
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')") // Ghi đè chỉ cho phép ADMIN truy cập
    public ResponseEntity<List<DeviceResponse>> getAllDevices() {
        return ResponseEntity.ok(deviceService.getAllDevices());
    }
    @DeleteMapping("/{deviceId}/owner/{userId}")
    public ResponseEntity<String> deleteDevice(@PathVariable Long deviceId, @PathVariable Long userId) {
        deviceService.deleteDevice(deviceId, userId);
        return ResponseEntity.ok("Xóa thiết bị thành công!");
    }
    @GetMapping("/{deviceId}/drivers/owner/{userId}")
    public ResponseEntity<List<Long>> getDriversSharedForDevice(
            @PathVariable Long deviceId,
            @PathVariable Long userId) {
        return ResponseEntity.ok(deviceService.getDriversSharedForDevice(deviceId, userId));
    }
    @GetMapping("/shared-with-me/{driverId}")
    public ResponseEntity<List<DeviceResponse>> getSharedDevicesForMe(@PathVariable Long driverId) {
        return ResponseEntity.ok(deviceService.getSharedDevicesForMe(driverId));
    }
}