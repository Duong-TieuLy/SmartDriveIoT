# Stage 1: Build source code bằng Maven và OpenJDK 21
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy file pom.xml và tải trước các dependencies (giúp cache tốt hơn, build nhanh hơn ở các lần sau)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy toàn bộ mã nguồn vào container
COPY src ./src

# Build dự án thành file .jar (bỏ qua chạy thử nghiệm test để rút ngắn thời gian deploy)
RUN mvn clean package -DskipTests

# Stage 2: Chạy ứng dụng với môi trường JRE 21 siêu gọn nhẹ
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy file .jar đã build thành công từ Stage 1 sang Stage 2
COPY --from=build /app/target/*.jar app.jar

# Cấu hình biến môi trường mặc định nếu Railway không cấp (Railway sẽ tự động đè port khác lên khi chạy)
ENV PORT=8080
EXPOSE ${PORT}

# Lệnh khởi chạy ứng dụng Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]