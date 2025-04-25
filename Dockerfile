FROM node:18-alpine

WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
RUN npm install

# Cài đặt PM2 global
RUN npm install pm2 -g

# Copy mã nguồn
COPY . .

# Tạo thư mục uploads nếu chưa có
RUN mkdir -p public/uploads
RUN mkdir -p public/images

EXPOSE 8080

# Sử dụng PM2 để quản lý ứng dụng
CMD ["pm2-runtime", "ecosystem.config.js"] 