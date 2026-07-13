# Stage 1: Build mã nguồn React với Node.js
FROM node:20-alpine AS build
WORKDIR /app

# Copy các file quản lý package để tận dụng Docker cache
COPY package*.json ./
RUN npm ci

# Copy toàn bộ source code frontend
COPY . .

# Build dự án ra thư mục tĩnh (mặc định là thư mục 'dist' đối với Vite)
RUN npm run build

# Stage 2: Sử dụng Nginx gọn nhẹ để chạy ứng dụng trong môi trường Production
FROM nginx:alpine

# Cấu hình Nginx để hỗ trợ React Router DOM (tránh lỗi 404 khi reload trang)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copy toàn bộ file tĩnh đã build từ Stage 1 sang thư mục gốc của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Mở cổng 80 (Cổng mặc định của Nginx)
EXPOSE 80

# Chạy Nginx ở chế độ foreground để container duy trì trạng thái hoạt động
CMD ["nginx", "-g", "daemon off;"]