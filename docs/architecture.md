# Архитектура проекта

[← Назад к оглавлению](./README.md)

## Структура директорий

```
postcard_bot/
├── backend/                          # Node.js Backend
│   ├── src/
│   │   ├── bot/                     # Telegram бот
│   │   │   ├── handlers/           # Обработчики команд
│   │   │   ├── menu/               # Интерактивное меню
│   │   │   ├── middlewares/        # Middleware (auth)
│   │   │   └── bot.service.ts      # Основной сервис бота
│   │   │
│   │   ├── api/                     # REST API для Mini App
│   │   │   ├── controllers/        # Контроллеры
│   │   │   ├── routes/             # Маршруты
│   │   │   └── middlewares/        # Middleware
│   │   │
│   │   ├── services/                # Бизнес-логика
│   │   │   ├── ai/                 # Replicate/Flux, генерации
│   │   │   │   ├── replicate.service.ts  # Клиент Replicate API
│   │   │   │   ├── generation.service.ts # Управление генерациями
│   │   │   │   └── model.service.ts      # AI модели
│   │   │   ├── payment/            # ЮKassa
│   │   │   └── user.service.ts
│   │   │
│   │   ├── database/prisma/         # База данных
│   │   │   ├── schema.prisma       # Схема БД
│   │   │   └── seed.ts             # Начальные данные
│   │   │
│   │   ├── common/                  # Общие утилиты
│   │   │   ├── config/             # Конфигурация
│   │   │   ├── i18n/               # Переводы
│   │   │   ├── types/              # TypeScript типы
│   │   │   └── utils/              # Утилиты (logger)
│   │   │
│   │   ├── webhooks/                # Webhook обработчики
│   │   ├── app.ts                   # Express приложение
│   │   └── index.ts                 # Точка входа
│   │
│   ├── prisma/schema.prisma         # Prisma схема
│   ├── uploads/                     # Загруженные файлы
│   ├── generated/                   # Сгенерированные изображения
│   └── logs/                        # Логи
│
├── frontend/                        # React Mini App
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor/             # Компоненты редактора
│   │   │   ├── Balance/            # Баланс
│   │   │   ├── Gallery/            # История
│   │   │   ├── Common/             # Общие компоненты
│   │   │   └── Layout/             # Header, Navigation
│   │   │
│   │   ├── pages/                   # Страницы
│   │   ├── services/                # API сервисы
│   │   ├── store/                   # Zustand store
│   │   ├── hooks/                   # React hooks
│   │   ├── i18n/                    # Интернационализация
│   │   ├── types/                   # TypeScript типы
│   │   └── styles/                  # CSS стили
│   │
│   └── public/
│
├── docs/                            # Документация
└── docs.md                          # Полная документация
```

## Архитектурные решения

### Backend

- **Express 5** - современный web framework с улучшенной обработкой ошибок
- **grammY** - типизированный Telegram Bot Framework
- **Prisma** - type-safe ORM с автогенерацией типов
- **BullMQ** - очереди для асинхронной обработки генераций
- **Winston** - структурированное логирование

### Frontend

- **React 19** - последняя версия с улучшенной производительностью
- **Vite 6** - быстрая сборка и HMR
- **Zustand** - легковесный state management
- **react-i18next** - интернационализация

### Безопасность

- **Helmet** - HTTP headers security
- **CORS** - контроль доступа
- **Telegram initData validation** - проверка подлинности запросов из Mini App
- **Zod** - валидация входных данных

## Потоки данных

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Telegram   │────>│   Backend   │────>│  PostgreSQL │
│    Bot      │<────│  (Express)  │<────│   (Prisma)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   Mini App  │ │  Replicate  │ │    Redis    │
    │   (React)   │ │  (Flux AI)  │ │  (Queues)   │
    └─────────────┘ └─────────────┘ └─────────────┘
```

## AI Pipeline

```
User Request → Validation → Balance Check → Create Generation Record
                                                    │
                                                    ▼
                                            Queue Processing
                                                    │
                                                    ▼
                              ┌─────────────────────────────────────┐
                              │          Replicate API              │
                              │  ┌─────────────┐ ┌───────────────┐  │
                              │  │ flux-1.1-pro│ │ flux-fill-pro │  │
                              │  │ (text2img)  │ │  (inpainting) │  │
                              │  └─────────────┘ └───────────────┘  │
                              └─────────────────────────────────────┘
                                                    │
                                                    ▼
                              Update Generation → Notify User (SSE/Bot)
```

---

[База данных →](./database.md)
