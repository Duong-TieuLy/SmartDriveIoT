package com.example.smartdriveiot.control;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ControlHistoryRepository extends JpaRepository<ControlHistory, Long> {
    // Lấy lịch sử điều khiển gần nhất của một thiết bị
    List<ControlHistory> findByDevice_IdOrderByTimestampDesc(Long deviceId);
}