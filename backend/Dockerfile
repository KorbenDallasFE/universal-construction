# 1. Сборка фронтенда
FROM node:20 AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2. Сборка Go-бэкенда
FROM golang:1.21 AS backend
WORKDIR /app
COPY backend/*.go ./
COPY --from=frontend /app/frontend/dist ./frontend/dist
RUN go build -o server .

# 3. Финальный продакшн-слой
FROM debian:bookworm-slim
WORKDIR /app
COPY --from=backend /app/server .
COPY --from=backend /app/frontend/dist ./frontend/dist
EXPOSE 8080
CMD ["./server"]
