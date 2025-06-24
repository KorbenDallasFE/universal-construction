# 1. Сборка фронтенда
FROM node:20 AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# 2. Сборка Go-бэкенда
FROM golang:1.22.2 AS backend-build
WORKDIR /app

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY . .

COPY --from=frontend-build /app/frontend/dist ./frontend/dist

RUN cd backend && go build -o ../server .

# 3. Финальный образ
FROM debian:bookworm-slim
WORKDIR /app

COPY --from=backend-build /app/server .
COPY --from=backend-build /app/frontend/dist ./frontend/dist

EXPOSE 8080

CMD ["./server"]
