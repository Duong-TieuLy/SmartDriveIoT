package com.example.smartdriveiot.device;

import com.example.smartdriveiot.common.enums.Status;
import java.time.LocalDateTime;
import java.util.Set;

// DTO tạo thiết bị mới
record DeviceCreateRequest(String name, String macAddress) {}

// DTO chia sẻ thiết bị cho tài xế khác
record ShareDeviceRequest(String driverEmail) {}

// DTO phản hồi thông tin chi tiết thiết bị
record DeviceResponse(Long id, String name, String macAddress, Status status, Long ownerId, Set<Long> driverIds, LocalDateTime createdAt) {}

// DTO phản hồi dữ liệu Telemetry
record TelemetryResponse(Long id, Long deviceId, Double distanceCm, LocalDateTime timestamp) {}