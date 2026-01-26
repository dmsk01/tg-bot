# Postcard Bot - Документация

**Postcard Bot** — Telegram бот с Mini App для генерации изображений с помощью нейросети Kandinsky API.

## Содержание

- [Описание проекта](#описание-проекта)
- [Архитектура](./architecture.md)
- [База данных](./database.md)
- [REST API](./api.md)
- [Telegram бот](./bot.md)
- [Mini App Frontend](./frontend.md)
- [Установка и настройка](./setup.md)
- [Локальная разработка (туннели)](./ngrok.md)
- [Деплой](./deploy.md)
- [Этапы реализации](./roadmap.md)

---

## Описание проекта

### Основные возможности

- **Telegram Mini App** с интуитивным редактором изображений
- **Генерация изображений** через Kandinsky 3.0/3.1 API (FusionBrain от Сбера)
- **Шаблоны промптов** с категориями (портреты, природа, фэнтези, киберпанк, аниме, искусство и др.)
- **Выбор пропорций** изображения (1:1, 16:9, 9:16, 4:3, 3:4)
- **Система балансов** пользователей
- **Платежи** через ЮKassa
- **Мультиязычность** (русский/английский)
- **Проверка совершеннолетия** перед использованием
- **История генераций** с возможностью повторить параметры

---

## Технологический стек

### Backend

| Технология | Версия | Назначение |
|------------|--------|------------|
| Node.js | 20.x | Runtime |
| TypeScript | 5.8.x | Язык программирования |
| Express.js | 5.1.x | Web framework |
| grammY | 1.39.x | Telegram Bot Framework |
| PostgreSQL | 14+ | База данных |
| Prisma ORM | 6.9.x | ORM |
| BullMQ | 5.66.x | Система очередей |
| Sharp | 0.34.x | Обработка изображений |

### Frontend

| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 19.x | UI библиотека |
| TypeScript | 5.8.x | Язык программирования |
| Vite | 6.x | Build tool |
| Zustand | 5.x | State management |
| Axios | 1.7.x | HTTP клиент |

### Инфраструктура

- **VPS**: Ubuntu 22.04 LTS
- **Nginx**: Reverse proxy
- **PM2**: Process manager
- **SSL**: Let's Encrypt

---

## Быстрый старт

```bash
# Клонирование
git clone <repository-url>
cd postcard_bot

# Backend
cd backend
npm install
cp .env.example .env  # Настроить переменные
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend (новый терминал)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Подробнее: [Установка и настройка](./setup.md)

---

## Текущий статус

### ✅ MVP Реализован

- [x] Инфраструктура (backend + frontend)
- [x] База данных (Prisma, 7 таблиц)
- [x] Telegram бот с webhook/polling
- [x] Интерактивное меню бота (@grammyjs/hydrate)
- [x] REST API для Mini App
- [x] Mini App Frontend
- [x] Dev режим для локальной разработки (без Telegram)
- [x] Поддержка Cloudflare Tunnel (альтернатива ngrok)

### ⏳ В планах

- [ ] Интеграция Kandinsky API
- [ ] Платежи ЮKassa
- [ ] Деплой на VPS

---

**Дата обновления**: 2026-01-26
