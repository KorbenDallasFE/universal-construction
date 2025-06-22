# 1. Билдим Go-приложение
FROM golang:1.21 AS build
WORKDIR /app
COPY backend/*.go ./
COPY frontend/dist ./frontend/dist
RUN go build -o server .

# 2. Продакшн-слой
FROM debian:bookworm-slim
WORKDIR /app
COPY --from=build /app/server .
COPY --from=build /app/frontend/dist ./frontend/dist
EXPOSE 8080
CMD ["./server"]

