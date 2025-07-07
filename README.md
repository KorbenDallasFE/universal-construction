Полноценный full-stack CRUD-проект с валидируемым UI, сортировкой, real-time-возможностями и деплоем через Docker & Render.  
Разработан как шаблон для быстрых MVP и демонстрация навыков.

Link:
https://universal-construction.onrender.com/

## Стек

- **Frontend:** React (Vite), HTML/CSS/JS
- **Backend:** Go (net/http), SQLite, WebSocket
- **DevOps:** Docker, Docker Compose, GitHub Actions, Render.com

---

## Возможности

### CRUD-операции

- **POST /api/hello** — добавить имя  
- **GET /api/all** — получить все имена  
- **PUT /api/update** — обновить имя  
- **DELETE /api/delete** — удалить все имена  

Бэкенд на Go, подключён к SQLite. Простая и расширяемая архитектура.

---

### CORS & API Middleware

- CORS middleware на стороне Go API
- JSON-ответы с обработкой ошибок

---

### Интерфейс (React + Vite)

- Отправка имён
- Список имён с датами создания
- Редактирование и удаление
- Мини-админка: общее число имён + счётчик отправок за сессию

---

### Валидация и UX

- Валидация длины имени (≥ 2 символа)
- Вывод ошибок под полем
- Очистка формы после отправки
- Логирование в консоль для отладки

---

### Таймстемпы

- Каждая запись сохраняет `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- Отображение в UI: `.toLocaleString('ru-RU')`

---

### Сортировка

- `<select>` с опциями:
  - По дате: старые → новые / новые → старые
  - По алфавиту: A→Z / Z→A

---

### Мини-админка

- `Всего записей: 12`
- `Отправок за сессию: 4`

---

### CI/CD и деплой

- **Docker:** multi-stage build (frontend → backend → final image)
- **Docker Compose:** сервисы frontend (5173), backend (8080), volume для SQLite
- **Render.com:** автодеплой из GitHub
- **GitHub Actions:** CI

---

## Что показывает этот проект

- Архитектурное мышление
- Чистая структура кода (Go, React)
- Опыт работы с базой данных и API
- Навык внедрять DevOps-инфраструктуру
- Валидация, удобный UI и логика сортировки

---

## Как запустить

```bash
git clone https://github.com/твой-юзернейм/universal-crud-construction.git
cd universal-crud-construction
docker-compose up --build
