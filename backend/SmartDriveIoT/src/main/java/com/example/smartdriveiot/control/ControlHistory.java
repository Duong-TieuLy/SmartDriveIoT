package com.example.smartdriveiot.control;
import com.example.smartdriveiot.device.Device;
import com.example.smartdriveiot.identity.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "controlHistories", "telemetries"})
    private Device device;

    // Ai là người ra lệnh
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "roles"})
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