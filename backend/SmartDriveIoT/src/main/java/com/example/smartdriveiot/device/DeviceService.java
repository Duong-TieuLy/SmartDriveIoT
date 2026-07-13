package com.example.smartdriveiot.device;

import com.example.smartdriveiot.identity.User;
import com.example.smartdriveiot.identity.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final TelemetryDataRepository telemetryDataRepository;

    // 1. Đăng ký thiết bị mới (Gán chủ sở hữu hiện tại)
    public DeviceResponse registerDevice(DeviceCreateRequest request, Long ownerId) {
        if (deviceRepository.existsByMacAddress(request.macAddress())) {
            throw new RuntimeException("Địa chỉ MAC này đã được đăng ký!");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        Device device = Device.builder()
                .name(request.name())
                .macAddress(request.macAddress())
                .owner(owner)
                .build();

        Device savedDevice = deviceRepository.save(device);
        return mapToDeviceResponse(savedDevice);
    }

    // 2. Chia sẻ quyền lái xe cho tài xế khác qua Email
    @Transactional
    public String shareDevice(Long deviceId, ShareDeviceRequest request, Long currentUserId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thiết bị!"));

        // Chỉ chủ xe mới có quyền chia sẻ xe này
        if (!device.getOwner().getId().equals(currentUserId)) {
            throw new RuntimeException("Bạn không có quyền chia sẻ thiết bị này!");
        }

        User driver = userRepository.findByEmail(request.driverEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài xế với email này!"));

        if (device.getOwner().getId().equals(driver.getId())) {
            throw new RuntimeException("Bạn không cần chia sẻ xe cho chính mình!");
        }

        device.getDrivers().add(driver);
        deviceRepository.save(device);
        return "Chia sẻ quyền truy cập thiết bị thành công!";
    }

    // 3. Lấy danh sách xe mà User đang sở hữu
    public List<DeviceResponse> getMyDevices(Long ownerId) {
        return deviceRepository.findByOwnerId(ownerId).stream()
                .map(this::mapToDeviceResponse)
                .collect(Collectors.toList());
    }

    // 4. Lấy lịch sử dữ liệu cảm biến khoảng cách của thiết bị
    public List<TelemetryResponse> getDeviceTelemetry(Long deviceId) {
        return telemetryDataRepository.findByDeviceIdOrderByTimestampDesc(deviceId).stream()
                .map(t -> new TelemetryResponse(t.getId(), t.getDevice().getId(), t.getDistanceCm(), t.getTimestamp()))
                .collect(Collectors.toList());
    }

    // Hàm phụ chuyển đổi Entity sang DTO
    private DeviceResponse mapToDeviceResponse(Device device) {
        return new DeviceResponse(
                device.getId(),
                device.getName(),
                device.getMacAddress(),
                device.getStatus(),
                device.getOwner().getId(),
                device.getDrivers() != null ? device.getDrivers().stream().map(User::getId).collect(Collectors.toSet()) : null,
                device.getCreatedAt()
        );
    }
}