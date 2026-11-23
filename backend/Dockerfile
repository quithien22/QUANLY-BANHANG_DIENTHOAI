FROM node:20-bookworm-slim

WORKDIR /app

# Cai dat dependencies tu package.json nam o backend/
COPY package*.json ./
RUN npm ci --omit=dev

# Sao chep source code ecommerce-backend
COPY ecommerce-backend ./ecommerce-backend

# Chuyen thu muc lam viec vao ecommerce-backend
WORKDIR /app/ecommerce-backend

# Tao thu muc uploads luu anh
RUN mkdir -p uploads

EXPOSE 8080

# Chay tu dong script kiem tra khoi tao CSDL truoc khi start server
CMD ["sh", "-c", "node init-db.js && node server.js"]
