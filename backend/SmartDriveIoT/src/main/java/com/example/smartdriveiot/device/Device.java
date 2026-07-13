package com.example.smartdriveiot.device;
import com.example.smartdriveiot.common.enums.Status;
import com.example.smartdriveiot.identity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "devices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "mac_address", nullable = false, unique = true, length = 50)
    private String macAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status =  Status.OFFLINE;

    // Thiết lập quan hệ với bảng Users (Chủ sở hữu xe)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    // Tự động sinh bảng trung gian device_drivers (Tài xế được chia sẻ quyền)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "device_drivers",
            joinColumns = @JoinColumn(name = "device_id"),
            inverseJoinColumns = @JoinColumn(name = "driver_id")
    )
    private Set<User> drivers;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}