package com.example.smartdriveiot.control;
import com.example.smartdriveiot.device.Device;
import com.example.smartdriveiot.identity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "control_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ControlHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Lệnh này gửi cho xe nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    // Ai là người ra lệnh (Sử dụng ON DELETE SET NULL bên DB bằng cách gán Optional nullable)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @Column(nullable = false, length = 30)
    private String command; // 'FORWARD', 'BACKWARD', 'LEFT', 'RIGHT', 'STOP'

    @Column(length = 20)
    private String status = "SENT"; // 'SENT', 'AUTO_STOPPED'

    @Column(updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }
}