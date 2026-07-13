package com.example.smartdriveiot.identity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);      // Dùng để đăng nhập bằng Email
    boolean existsByEmail(String email);
}