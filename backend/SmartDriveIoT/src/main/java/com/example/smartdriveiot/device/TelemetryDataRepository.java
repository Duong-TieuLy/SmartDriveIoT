package com.example.smartdriveiot.device;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TelemetryDataRepository extends JpaRepository<TelemetryData, Long> {
    // Lấy danh sách lịch sử dữ liệu cảm biến của một xe (sắp xếp mới nhất lên đầu)
    List<TelemetryData> findByDeviceIdOrderByTimestampDesc(Long deviceId);
}