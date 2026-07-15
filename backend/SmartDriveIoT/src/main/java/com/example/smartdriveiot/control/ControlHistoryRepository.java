package com.example.smartdriveiot.control;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ControlHistoryRepository extends JpaRepository<ControlHistory, Long> {

    // Tìm kiếm lịch sử theo MAC Address của xe (vì FrontEnd thường quản lý theo MAC thay vì Id tự tăng)
    Page<ControlHistory> findByDevice_MacAddressOrderByTimestampDesc(String macAddress, Pageable pageable);
}