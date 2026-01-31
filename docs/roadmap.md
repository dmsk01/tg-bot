# Этапы реализации

[<- Назад к оглавлению](./README.md) | [<- Деплой](./deploy.md)

Проект разбит на 10 этапов. Каждый этап можно выполнять последовательно.

---

## Этап 1: Инфраструктура и настройка

**Статус:** Завершен

**Результат:** Готовая структура проекта с окружением

**Задачи:**
1. Инициализация backend проекта
   - package.json со всеми зависимостями
   - TypeScript конфигурация
   - ESLint, Prettier настройки
   - Структура папок

2. Инициализация frontend проекта
   - Vite + React + TypeScript
   - package.json с зависимостями
   - Структура папок

3. Настройка Git репозитория
   - .gitignore для Node.js проектов

4. Базовая инфраструктура
   - Config Service
   - Logger утилита (Winston)
   - Express приложение
   - PM2 конфигурация

**Критические файлы:**
- `backend/package.json`
- `backend/tsconfig.json`
- `frontend/package.json`
- `frontend/vite.config.ts`

---

## Этап 2: База данных

**Статус:** Завершен

**Результат:** Полностью настроенная БД со схемой и тестовыми данными

**Задачи:**
1. Создана Prisma схема (10 таблиц)
   - users, user_settings
   - transactions
   - templates
   - generations (расширена для Flux/Replicate)
   - ai_models
   - system_settings
   - api_usage
   - moderation_logs

2. Создан seed скрипт
   - 2 AI модели Flux (flux-1.1-pro, flux-fill-pro)
   - 2 модели Kandinsky (legacy, отключены)
   - 15 шаблонов промптов по категориям
   - 8 системных настроек

**Критические файлы:**
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`

**Команды:**
```bash
cd backend
npm run prisma:migrate      # Создать миграцию
npm run prisma:seed         # Заполнить начальными данными
npm run prisma:studio       # Открыть Prisma Studio
```

---

## Этап 3: Базовый Telegram бот

**Статус:** Завершен

**Цель:** Работающий бот с регистрацией пользователей

**Задачи:**
1. Создать бота через @BotFather
2. Настроить grammY в `bot.service.ts`
3. Реализовать команды:
   - `/start` - регистрация пользователя, приветствие
   - `/balance` - показать баланс
   - `/app` - открыть Mini App
   - `/language` - выбор языка (ru/en)
   - `/help` - справка
4. Middleware:
   - Аутентификация
   - Проверка блокировки
   - Логирование
5. Интеграция с User service
6. Базовая i18n (ru/en переводы)

**Критические файлы:**
- `backend/src/bot/bot.service.ts`
- `backend/src/bot/handlers/start.handler.ts`
- `backend/src/bot/middlewares/auth.middleware.ts`
- `backend/src/services/user.service.ts`
- `backend/src/common/i18n/locales/ru.json`
- `backend/src/common/i18n/locales/en.json`

---

## Этап 4: REST API для Mini App

**Статус:** Завершен

**Цель:** API готов для фронтенда

**Задачи:**
1. Настроить Express сервер
2. Добавить middleware: CORS, Helmet, rate limiting
3. Реализовать валидацию Telegram initData
4. Создать API эндпоинты:
   - Auth: `/api/auth/validate`, `/api/auth/me`
   - User: `/api/user/balance`, `/api/user/settings`
   - Templates: `/api/templates`
   - Models: `/api/models`

**API эндпоинты:**
```
POST   /api/auth/validate          - Валидация Telegram initData
GET    /api/auth/me                - Получить текущего пользователя

GET    /api/user/balance           - Получить баланс
GET    /api/user/settings          - Получить настройки
PATCH  /api/user/settings          - Обновить настройки
PATCH  /api/user/language          - Изменить язык
POST   /api/user/age-confirm       - Подтвердить совершеннолетие

GET    /api/templates              - Список шаблонов
GET    /api/templates/:id          - Детали шаблона
GET    /api/templates/categories   - Категории шаблонов

GET    /api/models                 - Список доступных моделей
```

**Критические файлы:**
- `backend/src/app.ts`
- `backend/src/api/middlewares/validate-telegram.middleware.ts`
- `backend/src/api/controllers/user.controller.ts`
- `backend/src/api/controllers/template.controller.ts`

---

## Этап 5: Telegram Mini App Frontend

**Статус:** Завершен

**Цель:** Полнофункциональный интерфейс редактора

**Задачи:**
1. Настроить Telegram SDK
2. Создать роутинг:
   - `/` - EditorPage
   - `/history` - HistoryPage
   - `/balance` - BalancePage
3. Компоненты редактора:
   - `ModelSelector` - выбор модели
   - `TemplateSelector` - шаблоны
   - `AspectRatioSelector` - пропорции
   - `PromptEditor` - textarea промпта
   - `GenerateButton` - кнопка генерации
4. UI компоненты:
   - `BalanceDisplay`
   - `LanguageSwitcher`
   - `AgeConfirmation`
5. State management (Zustand)
6. API интеграция через Axios
7. react-i18next для переводов

**Критические файлы:**
- `frontend/src/pages/EditorPage.tsx`
- `frontend/src/components/Editor/*.tsx`
- `frontend/src/store/store.ts`
- `frontend/src/services/api.service.ts`

---

## Этап 6: Интеграция Flux API (Replicate)

**Статус:** Завершен

**Цель:** Работающая генерация end-to-end

**Задачи:**
1. ✅ Интеграция с Replicate API
2. ✅ Создать `replicate.service.ts`:
   - Text-to-image (flux-1.1-pro)
   - Inpainting (flux-fill-pro)
   - Async/sync режимы генерации
   - Обработка ошибок и refund
3. ✅ Обновить `generation.service.ts`:
   - Поддержка GenerationType (TEXT_TO_IMAGE, IMAGE_TO_IMAGE, INPAINTING)
   - Автоматический fallback в режим симуляции
   - Возврат баланса при ошибках
4. ✅ Обновить схему БД:
   - Новые поля для Replicate (predictionId, guidance, steps, seed)
   - Таблицы api_usage и moderation_logs
5. ✅ Generation API:
   - POST `/api/generation/upload`
   - POST `/api/generation/create`
   - GET `/api/generation/:id`
   - GET `/api/generation/history`
6. ✅ Интеграция с балансом (USD)

**Поддерживаемые модели:**
| Модель | Тип | Стоимость |
|--------|-----|-----------|
| flux-1.1-pro | Text-to-Image | $0.04 |
| flux-fill-pro | Inpainting | $0.05 |

**API эндпоинты:**
```
POST   /api/generation/upload      - Загрузить исходное изображение
POST   /api/generation/create      - Создать генерацию
GET    /api/generation/:id         - Статус генерации
GET    /api/generation/history     - История генераций
DELETE /api/generation/:id         - Удалить генерацию
```

**Критические файлы:**
- `backend/src/services/ai/replicate.service.ts`
- `backend/src/services/ai/generation.service.ts`
- `backend/src/services/ai/model.service.ts`
- `backend/src/api/controllers/generation.controller.ts`

---

## Этап 7: Система платежей ЮKassa

**Статус:** В планах

**Цель:** Работающая оплата

**Задачи:**
1. Регистрация в ЮKassa
2. Создать `yookassa.service.ts`
3. Payment API:
   - POST `/api/payment/create`
   - GET `/api/payment/:id/status`
   - GET `/api/payment/history`
4. Webhook POST `/webhook/yookassa`
5. Frontend интеграция:
   - Страница пополнения баланса
   - Выбор суммы ($1, $3, $5, $10, $25)

**Критические файлы:**
- `backend/src/services/payment/yookassa.service.ts`
- `backend/src/webhooks/yookassa.webhook.ts`
- `frontend/src/pages/BalancePage.tsx`

---

## Этап 8: Дополнительные функции

**Статус:** В планах

**Цель:** Полный MVP функционал

**Задачи:**
1. Проверка возраста:
   - Модальное окно при первом запуске
   - POST `/api/user/age-confirm`
2. История генераций:
   - Компонент галереи с пагинацией
   - Кнопка "Повторить"
3. Уведомления через бот
4. Админ команды (опционально)

**Критические файлы:**
- `frontend/src/components/Common/AgeConfirmation.tsx`
- `frontend/src/pages/HistoryPage.tsx`

---

## Этап 9: Тестирование

**Статус:** В планах

**Цель:** Стабильное приложение

**Задачи:**
1. Ручное тестирование всех flow:
   - Регистрация пользователя
   - Смена языка
   - Подтверждение возраста
   - Пополнение баланса
   - Создание генерации
   - Просмотр истории
2. Проверка обработки ошибок
3. Оптимизация (индексы БД, размеры изображений)
4. Логирование критических операций

---

## Этап 10: Деплой на VPS

**Статус:** В планах

**Цель:** Бот работает в production

**Задачи:**
1. Подготовка VPS (Ubuntu 22.04)
2. Деплой backend (PM2)
3. Деплой frontend (Nginx)
4. SSL сертификаты (certbot)
5. Настройка webhooks:
   - Telegram: `setWebhook`
   - ЮKassa
6. Мониторинг (PM2 logs)

**Критические файлы:**
- `backend/ecosystem.config.js`
- Nginx конфигурация

Подробнее: [Деплой](./deploy.md)

---

## Сводка статусов

| Этап | Название | Статус |
|------|----------|--------|
| 1 | Инфраструктура | ✅ Завершен |
| 2 | База данных | ✅ Завершен |
| 3 | Telegram бот | ✅ Завершен |
| 4 | REST API | ✅ Завершен |
| 5 | Mini App Frontend | ✅ Завершен |
| 6 | Flux API (Replicate) | ✅ Завершен |
| 7 | ЮKassa платежи | ⏳ В планах |
| 8 | Доп. функции | ⏳ В планах |
| 9 | Тестирование | ⏳ В планах |
| 10 | Деплой | ⏳ В планах |

---

[<- Назад к оглавлению](./README.md)
