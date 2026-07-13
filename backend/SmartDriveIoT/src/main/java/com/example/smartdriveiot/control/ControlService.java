package com.example.smartdriveiot.control;

import com.example.smartdriveiot.device.Device;
import com.example.smartdriveiot.device.DeviceRepository;
import com.example.smartdriveiot.identity.User;
import com.example.smartdriveiot.identity.UserRepository;
import lombok.RequiredArgsConstructor;
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
}