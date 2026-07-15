package com.example.smartdriveiot.control;

import com.example.smartdriveiot.device.Device;
import com.example.smartdriveiot.device.DeviceRepository;
import com.example.smartdriveiot.identity.User;
import com.example.smartdriveiot.identity.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ControlService {

    private final ControlHistoryRepository controlHistoryRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;

    @Transactional
    public ControlHistory saveCommand(String macAddress, String userId, String command, String status) {
        Device device = deviceRepository.findByMacAddress(macAddress)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thiết bị: " + macAddress));

        User user = null;
        if (userId != null && !userId.isEmpty()) {
            user = userRepository.findById(Long.parseLong(userId)).orElse(null);
        }

        ControlHistory history = ControlHistory.builder()
                .device(device)
                .user(user)
                .command(command.toUpperCase())
                .status(status)
                .build();

        return controlHistoryRepository.save(history);
    }
    @Transactional(readOnly = true)
    public Page<ControlHistoryResponse> getDeviceHistory(String macAddress, int page, int size) {
        if (!deviceRepository.existsByMacAddress(macAddress)) {
            throw new RuntimeException("Không tìm thấy thiết bị có MAC Address: " + macAddress);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<ControlHistory> historyPage = controlHistoryRepository.findByDevice_MacAddressOrderByTimestampDesc(macAddress, pageable);

        // Chuyển đổi Entity sang DTO an toàn tại đây, giải quyết triệt để Lazy Loading
        return historyPage.map(history -> ControlHistoryResponse.builder()
                .id(history.getId())
                .command(history.getCommand())
                .status(history.getStatus())
                .timestamp(history.getTimestamp())
                .macAddress(history.getDevice().getMacAddress())
                .userId(history.getUser() != null ? history.getUser().getId() : null)
                .build());
    }
}