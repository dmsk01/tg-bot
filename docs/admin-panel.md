# Админ-панель: План разработки

[← Назад к оглавлению](./README.md)

## Обзор

Админ-панель для управления пользователями, балансами, промокодами и мониторинга системы генерации изображений.

---

## 1. Архитектура

### 1.1 Структура проекта

```
postcard_bot/
├── backend/                    # Существующий backend
│   └── src/
│       ├── api/
│       │   ├── admin/         # NEW: Admin API routes
│       │   │   ├── controllers/
│       │   │   ├── routes/
│       │   │   └── middlewares/
│       │   └── ...
│       └── services/
│           └── admin/         # NEW: Admin services
│
├── frontend/                   # Telegram Mini App (без изменений)
│
└── admin/                      # NEW: Админ-панель (отдельное приложение)
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── store/
    │   └── ...
    ├── package.json
    └── vite.config.ts
```

### 1.2 Варианты развертывания

| Вариант | Описание | Рекомендация |
|---------|----------|--------------|
| **Отдельный домен** | `admin.example.com` | ✅ Рекомендуется |
| Поддомен | `example.com/admin` | Возможно |
| Порт | `example.com:3001` | Для разработки |

**Рекомендация:** Отдельный домен `admin.yourdomain.com` для:
- Изоляции безопасности
- Независимого SSL
- Возможности разных правил CORS
- Упрощения мониторинга

---

## 2. Технологический стек

### 2.1 Frontend (Admin Panel)

| Технология | Версия | Обоснование |
|------------|--------|-------------|
| React | 19.x | Совместимость с Minimals |
| TypeScript | 5.x | Type safety |
| Vite | 7.x | Быстрая сборка |
| MUI | 7.x | Совместимость с Minimals |
| Minimals Template | 7.4.x | Уже используется в проекте |
| Zustand | 5.x | State management |
| React Router | 7.x | Роутинг |
| React Hook Form | 7.x | Формы |
| Zod | 4.x | Валидация |
| @mui/x-data-grid | 8.x | Таблицы данных |
| dayjs | 1.x | Работа с датами |
| notistack | 3.x | Уведомления |

### 2.2 Backend (Admin API)

| Технология | Версия | Назначение |
|------------|--------|------------|
| Express | 5.x | Уже используется |
| Prisma | 6.x | ORM |
| bcrypt | 5.x | Хеширование паролей |
| jsonwebtoken | 9.x | JWT токены |
| express-rate-limit | 7.x | Rate limiting |

### 2.3 Совместимость

✅ **Полная совместимость** — все технологии уже используются в проекте или совместимы:
- Minimals 7.4.0 уже в frontend
- MUI 7, React 19, Vite 7 — те же версии
- Общая БД через Prisma
- Единый backend с разделением routes

---

## 3. База данных

### 3.1 Новые таблицы

#### AdminUser — Администраторы

```prisma
model AdminUser {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  firstName     String?   @map("first_name")
  lastName      String?   @map("last_name")
  role          AdminRole @default(MODERATOR)
  isActive      Boolean   @default(true) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Действия
  adminLogs     AdminLog[]

  @@map("admin_users")
}

enum AdminRole {
  SUPER_ADMIN   // Полный доступ
  ADMIN         // Управление пользователями, промокодами
  MODERATOR     // Просмотр, модерация контента
  SUPPORT       // Только просмотр, ответы
}
```

#### Promocode — Промокоды

```prisma
model Promocode {
  id              String          @id @default(uuid())
  code            String          @unique
  type            PromocodeType
  value           Decimal         @db.Decimal(10, 4)  // Сумма или процент

  // Ограничения
  maxUsages       Int?            @map("max_usages")      // null = безлимит
  maxUsagesPerUser Int?           @map("max_usages_per_user") @default(1)
  minBalance      Decimal?        @map("min_balance") @db.Decimal(10, 2)

  // Период действия
  startsAt        DateTime?       @map("starts_at")
  expiresAt       DateTime?       @map("expires_at")

  // Статус
  isActive        Boolean         @default(true) @map("is_active")

  // Метаданные
  description     String?
  createdBy       String?         @map("created_by")  // AdminUser.id
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  // Использования
  usages          PromocodeUsage[]

  @@index([code])
  @@index([isActive])
  @@index([expiresAt])
  @@map("promocodes")
}

enum PromocodeType {
  FIXED_AMOUNT    // Фиксированная сумма ($5)
  PERCENTAGE      // Процент от пополнения (10%)
  BONUS_CREDITS   // Бонусные кредиты на генерации
}
```

#### PromocodeUsage — Использования промокодов

```prisma
model PromocodeUsage {
  id            String    @id @default(uuid())
  promocodeId   String    @map("promocode_id")
  userId        String    @map("user_id")
  appliedValue  Decimal   @map("applied_value") @db.Decimal(10, 4)
  usedAt        DateTime  @default(now()) @map("used_at")

  // Связанная транзакция
  transactionId String?   @map("transaction_id")

  promocode     Promocode @relation(fields: [promocodeId], references: [id])
  user          User      @relation(fields: [userId], references: [id])

  @@unique([promocodeId, userId])  // Или убрать для многоразовых
  @@index([userId])
  @@index([usedAt])
  @@map("promocode_usages")
}
```

#### AdminLog — Логи действий администраторов

```prisma
model AdminLog {
  id          String    @id @default(uuid())
  adminId     String    @map("admin_id")
  action      String    // CREATE_PROMOCODE, BLOCK_USER, etc.
  entityType  String?   @map("entity_type")  // User, Promocode, etc.
  entityId    String?   @map("entity_id")
  details     Json?
  ipAddress   String?   @map("ip_address")
  userAgent   String?   @map("user_agent")
  createdAt   DateTime  @default(now()) @map("created_at")

  admin       AdminUser @relation(fields: [adminId], references: [id])

  @@index([adminId])
  @@index([action])
  @@index([createdAt])
  @@map("admin_logs")
}
```

### 3.2 Изменения существующих таблиц

```prisma
// Добавить в User
model User {
  // ... существующие поля
  promocodeUsages PromocodeUsage[]
}
```

---

## 4. API Endpoints

### 4.1 Аутентификация Admin

```
POST   /api/admin/auth/login         - Вход
POST   /api/admin/auth/logout        - Выход
POST   /api/admin/auth/refresh       - Обновить токен
GET    /api/admin/auth/me            - Текущий админ
PATCH  /api/admin/auth/password      - Сменить пароль
```

### 4.2 Управление пользователями

```
GET    /api/admin/users              - Список (пагинация, фильтры, поиск)
GET    /api/admin/users/:id          - Детали пользователя
PATCH  /api/admin/users/:id          - Редактировать (isBlocked, isAdmin)
POST   /api/admin/users/:id/balance  - Изменить баланс
GET    /api/admin/users/:id/transactions  - Транзакции пользователя
GET    /api/admin/users/:id/generations   - Генерации пользователя
DELETE /api/admin/users/:id          - Удалить (soft delete)
```

### 4.3 Промокоды

```
GET    /api/admin/promocodes             - Список промокодов
POST   /api/admin/promocodes             - Создать промокод
GET    /api/admin/promocodes/:id         - Детали промокода
PATCH  /api/admin/promocodes/:id         - Редактировать
DELETE /api/admin/promocodes/:id         - Удалить (soft delete)
POST   /api/admin/promocodes/:id/revoke  - Отозвать (деактивировать)
GET    /api/admin/promocodes/:id/usages  - Использования
POST   /api/admin/promocodes/generate    - Сгенерировать пакет промокодов
POST   /api/admin/promocodes/validate    - Проверить код
```

### 4.4 Аналитика и статистика

```
GET    /api/admin/stats/dashboard        - Общая статистика
GET    /api/admin/stats/users            - Статистика пользователей
GET    /api/admin/stats/generations      - Статистика генераций
GET    /api/admin/stats/revenue          - Статистика доходов
GET    /api/admin/stats/api-usage        - Использование API
```

### 4.5 Системные настройки

```
GET    /api/admin/settings               - Все настройки
PATCH  /api/admin/settings/:key          - Изменить настройку
GET    /api/admin/models                 - AI модели
PATCH  /api/admin/models/:id             - Редактировать модель
```

### 4.6 Модерация

```
GET    /api/admin/moderation/logs        - Логи модерации
GET    /api/admin/moderation/pending     - Ожидающие проверки
POST   /api/admin/moderation/:id/approve - Одобрить
POST   /api/admin/moderation/:id/reject  - Отклонить
```

### 4.7 Логи администраторов

```
GET    /api/admin/logs                   - Логи действий
GET    /api/admin/admins                 - Список админов (SUPER_ADMIN)
POST   /api/admin/admins                 - Создать админа
PATCH  /api/admin/admins/:id             - Редактировать
DELETE /api/admin/admins/:id             - Деактивировать
```

---

## 5. Страницы админ-панели

### 5.1 Структура роутинга

```
/login                    - Страница входа
/dashboard               - Главная (статистика)

/users                   - Список пользователей
/users/:id               - Карточка пользователя

/promocodes              - Список промокодов
/promocodes/create       - Создание промокода
/promocodes/:id          - Детали промокода

/generations             - История генераций
/generations/:id         - Детали генерации

/transactions            - Все транзакции

/moderation              - Модерация контента

/settings                - Системные настройки
/settings/models         - AI модели
/settings/admins         - Управление админами

/logs                    - Логи действий
```

### 5.2 Компоненты Minimals для использования

| Компонент | Страница | Функция |
|-----------|----------|---------|
| DataGrid | users, promocodes | Таблицы с пагинацией |
| Form components | create/edit | Формы создания |
| Charts (ApexCharts) | dashboard | Графики статистики |
| Kanban | moderation | Доска модерации |
| Calendar | promocodes | Период действия |
| File upload | - | Импорт/экспорт |

---

## 6. Система промокодов

### 6.1 Типы промокодов

| Тип | Описание | Пример |
|-----|----------|--------|
| `FIXED_AMOUNT` | Фиксированная сумма на баланс | +$5.00 |
| `PERCENTAGE` | Процент бонуса при пополнении | +10% к депозиту |
| `BONUS_CREDITS` | Бонусные генерации | +20 генераций |

### 6.2 Сценарии использования

1. **Бета-тестирование**
   - Тип: FIXED_AMOUNT
   - Значение: $10
   - Лимит: 100 штук
   - Срок: 30 дней

2. **Реферальная программа**
   - Тип: PERCENTAGE
   - Значение: 15%
   - Применяется к первому депозиту

3. **Акция для блогеров**
   - Тип: BONUS_CREDITS
   - Значение: 50 генераций
   - Уникальный код на блогера

4. **Компенсация**
   - Тип: FIXED_AMOUNT
   - Создается вручную для конкретного случая

### 6.3 Функции системы промокодов

- ✅ Создание одиночных и пакетных промокодов
- ✅ Генерация случайных кодов (BETA-XXXX-XXXX)
- ✅ Установка лимитов (общий, на пользователя)
- ✅ Период действия (начало, окончание)
- ✅ Деактивация/отзыв промокода
- ✅ История использований
- ✅ Экспорт в CSV/Excel
- ✅ Статистика эффективности

### 6.4 API для пользователей (добавить в основной API)

```
POST   /api/user/promocode/apply     - Применить промокод
GET    /api/user/promocode/validate  - Проверить промокод
GET    /api/user/promocodes          - Мои использованные промокоды
```

---

## 7. Безопасность

### 7.1 Аутентификация

- JWT токены (access + refresh)
- Access token: 15 минут
- Refresh token: 7 дней (в httpOnly cookie)
- Хранение паролей: bcrypt (cost factor 12)

### 7.2 Авторизация (RBAC)

| Действие | SUPER_ADMIN | ADMIN | MODERATOR | SUPPORT |
|----------|-------------|-------|-----------|---------|
| Управление админами | ✅ | ❌ | ❌ | ❌ |
| Системные настройки | ✅ | ❌ | ❌ | ❌ |
| Создание промокодов | ✅ | ✅ | ❌ | ❌ |
| Изменение баланса | ✅ | ✅ | ❌ | ❌ |
| Блокировка пользователей | ✅ | ✅ | ✅ | ❌ |
| Модерация | ✅ | ✅ | ✅ | ❌ |
| Просмотр данных | ✅ | ✅ | ✅ | ✅ |

### 7.3 Защита API

- Rate limiting: 100 req/min для админов
- IP whitelist (опционально)
- Логирование всех действий
- CORS только для admin домена
- HTTPS обязательно
- Защита от CSRF (SameSite cookies)

---

## 8. Этапы реализации

### Этап 1: Backend Admin API (3-4 дня)

**Задачи:**
1. Создать миграции Prisma (AdminUser, Promocode, PromocodeUsage, AdminLog)
2. Добавить bcrypt, jsonwebtoken в зависимости
3. Реализовать Admin Auth service
4. Создать RBAC middleware
5. Реализовать Admin Users API
6. Добавить логирование действий

**Файлы:**
```
backend/src/api/admin/
├── middlewares/
│   ├── admin-auth.middleware.ts
│   └── rbac.middleware.ts
├── controllers/
│   ├── admin-auth.controller.ts
│   └── admin-users.controller.ts
├── routes/
│   ├── admin-auth.routes.ts
│   └── admin-users.routes.ts
└── index.ts

backend/src/services/admin/
├── admin-auth.service.ts
├── admin-users.service.ts
└── admin-log.service.ts
```

### Этап 2: Система промокодов (2-3 дня)

**Задачи:**
1. Реализовать Promocode service
2. Создать Admin Promocode API
3. Добавить User Promocode API (применение)
4. Генератор кодов
5. Валидация и ограничения
6. Интеграция с балансом

**Файлы:**
```
backend/src/services/promocode.service.ts
backend/src/api/admin/controllers/promocode.controller.ts
backend/src/api/admin/routes/promocode.routes.ts
backend/src/api/routes/user-promocode.routes.ts
```

### Этап 3: Frontend — Базовая структура (2-3 дня)

**Задачи:**
1. Создать проект admin/ на базе Minimals
2. Настроить Vite, TypeScript, ESLint
3. Настроить роутинг
4. Реализовать Auth (login, protected routes)
5. Создать Layout (sidebar, header)
6. Настроить API client с interceptors

**Структура:**
```
admin/
├── src/
│   ├── components/
│   │   └── layout/
│   ├── pages/
│   │   ├── auth/
│   │   │   └── login.tsx
│   │   └── dashboard/
│   │       └── index.tsx
│   ├── services/
│   │   └── api.ts
│   ├── store/
│   │   └── auth.store.ts
│   ├── routes/
│   │   └── index.tsx
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Этап 4: Frontend — Управление пользователями (2 дня)

**Задачи:**
1. Страница списка пользователей (DataGrid)
2. Карточка пользователя
3. Формы редактирования
4. Изменение баланса
5. Просмотр транзакций/генераций

### Этап 5: Frontend — Промокоды (2 дня)

**Задачи:**
1. Список промокодов
2. Создание/редактирование
3. Генерация пакетов
4. Статистика использования
5. Экспорт данных

### Этап 6: Frontend — Dashboard и аналитика (1-2 дня)

**Задачи:**
1. Виджеты статистики
2. Графики (пользователи, генерации, доход)
3. Последние действия

### Этап 7: Деплой и интеграция (1 день)

**Задачи:**
1. Настроить отдельный домен/поддомен
2. Nginx конфигурация
3. SSL сертификат
4. Создать первого SUPER_ADMIN
5. Документация

---

## 9. Дополнительные рекомендации

### 9.1 Будущие улучшения

- **Двухфакторная аутентификация (2FA)** — TOTP через Google Authenticator
- **Webhooks** — уведомления о событиях
- **Bulk operations** — массовые операции над пользователями
- **Audit trail** — полная история изменений
- **API для партнеров** — выдача промокодов через API
- **Dashboard widgets** — кастомизируемые виджеты

### 9.2 Мониторинг

- Sentry для error tracking
- Prometheus + Grafana для метрик
- ELK stack для логов (опционально)

### 9.3 Бэкапы

- Ежедневный бэкап PostgreSQL
- Хранение логов 90 дней
- Point-in-time recovery

---

## 10. Оценка трудозатрат

| Этап | Описание | Оценка |
|------|----------|--------|
| 1 | Backend Admin API | 3-4 дня |
| 2 | Система промокодов | 2-3 дня |
| 3 | Frontend базовая структура | 2-3 дня |
| 4 | Управление пользователями | 2 дня |
| 5 | Промокоды UI | 2 дня |
| 6 | Dashboard | 1-2 дня |
| 7 | Деплой | 1 день |
| **Итого** | | **13-18 дней** |

---

## 11. Чеклист готовности

### Backend
- [ ] Миграции Prisma применены
- [ ] Admin Auth работает
- [ ] RBAC middleware настроен
- [ ] Users API готов
- [ ] Promocodes API готов
- [ ] Логирование работает
- [ ] Rate limiting настроен

### Frontend
- [ ] Проект создан на базе Minimals
- [ ] Авторизация работает
- [ ] Роутинг настроен
- [ ] Страницы пользователей готовы
- [ ] Страницы промокодов готовы
- [ ] Dashboard готов

### Деплой
- [ ] Домен настроен
- [ ] SSL получен
- [ ] Nginx сконфигурирован
- [ ] SUPER_ADMIN создан
- [ ] Мониторинг настроен

---

**Дата создания:** 2026-01-31
**Версия:** 1.0
