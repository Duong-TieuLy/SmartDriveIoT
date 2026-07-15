package com.example.smartdriveiot.control;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ControlHistoryResponse {
    private Long id;
    private String command;
    private String status;
    private LocalDateTime timestamp;
    private String macAddress; // Chỉ lấy chuỗi MAC, không ôm cả cục Object Device
    private Long userId;       // Chỉ lấy ID của User, không ôm cả cục Object User
}