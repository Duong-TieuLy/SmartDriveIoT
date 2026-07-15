package com.example.smartdriveiot.control;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/control")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class ControlController {

    private final ControlService controlService;

    /**
     * API Lấy lịch sử điều khiển của xe theo địa chỉ MAC (Phân trang)
     * Endpoint: GET /api/control/history/{macAddress}?page=0&size=10
     */
    @GetMapping("/history/{macAddress}")
    public ResponseEntity<?> getVehicleControlHistory(
            @PathVariable String macAddress,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            // Dữ liệu lúc này là DTO phẳng, Jackson chuyển sang JSON cực kỳ mượt mà
            Page<ControlHistoryResponse> historyPage = controlService.getDeviceHistory(macAddress, page, size);

            Map<String, Object> response = new HashMap<>();
            response.put("content", historyPage.getContent());
            response.put("currentPage", historyPage.getNumber());
            response.put("totalItems", historyPage.getTotalElements());
            response.put("totalPages", historyPage.getTotalPages());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}