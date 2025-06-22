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

# Копируем go.mod и go.sum из корня репозитория
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходники бэкенда
COPY backend/ ./backend/

# Копируем собранный фронтенд
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Сборка сервера из backend/, бинарь кладём в /app/server
RUN cd backend && go build -o ../server .

# 3. Финальный слой (production)
FROM debian:bookworm-slim
WORKDIR /app

# Копируем собранный бинарник и фронтенд
COPY --from=backend /app/server .
COPY --from=backend /app/frontend/dist ./frontend/dist

EXPOSE 8080
CMD ["./server"]
