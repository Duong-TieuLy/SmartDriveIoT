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

    @Transactional
    public String shareDevice(Long deviceId, ShareDeviceRequest request, Long currentUserId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thiết bị!"));

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

    // 3. Lấy danh sách xe mà User đang sở hữu (Đã vá lỗi 401)
    @Transactional(readOnly = true) // 🔴 Thêm dòng này để xử lý lỗi nạp dữ liệu Lazy của owner và drivers
    public List<DeviceResponse> getMyDevices(Long ownerId) {
        return deviceRepository.findByOwnerId(ownerId).stream()
                .map(this::mapToDeviceResponse)
                .collect(Collectors.toList());
    }

    // 🔴 BỔ SUNG: Lấy danh sách xe dựa trên Email chủ sở hữu
    @Transactional(readOnly = true)
    public List<DeviceResponse> getDevicesByEmail(String email) {
        if (!userRepository.existsByEmail(email)) {
            throw new RuntimeException("Không tìm thấy người dùng với email: " + email);
        }
        return deviceRepository.findByOwnerEmail(email).stream()
                .map(this::mapToDeviceResponse)
                .collect(Collectors.toList());
    }

    public List<TelemetryResponse> getDeviceTelemetry(Long deviceId) {
        return telemetryDataRepository.findByDeviceIdOrderByTimestampDesc(deviceId).stream()
                .map(t -> new TelemetryResponse(t.getId(), t.getDevice().getId(), t.getDistanceCm(), t.getTimestamp()))
                .collect(Collectors.toList());
    }

    private DeviceResponse mapToDeviceResponse(Device device) {
        return new DeviceResponse(
                device.getId(),
                device.getName(),
                device.getMacAddress(),
                device.getStatus(),
                device.getOwner().getId(), // 🔴 Chạm vào thuộc tính Lazy owner
                device.getDrivers() != null ? device.getDrivers().stream().map(User::getId).collect(Collectors.toSet()) : null, // 🔴 Chạm vào thuộc tính Lazy drivers
                device.getCreatedAt()
        );
    }
}