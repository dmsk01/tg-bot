# База данных

[← Назад к оглавлению](./README.md) | [← Архитектура](./architecture.md)

База данных PostgreSQL с использованием Prisma ORM. Схема содержит 7 таблиц.

## Схема таблиц

### 1. users - Пользователи

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary Key |
| telegramId | BigInt | Telegram ID (unique) |
| username | String? | Username |
| firstName | String? | Имя |
| lastName | String? | Фамилия |
| languageCode | String | Язык (ru/en), default: 'ru' |
| isAgeConfirmed | Boolean | Подтверждение 18+ |
| balance | Decimal(10,2) | Баланс, default: 0 |
| isBlocked | Boolean | Заблокирован |
| isAdmin | Boolean | Администратор |
| referralCode | String? | Реферальный код (unique) |
| referredBy | String? | ID реферера |
| createdAt | DateTime | Дата регистрации |
| updatedAt | DateTime | Последнее обновление |
| lastActiveAt | DateTime | Последняя активность |

**Индексы:** `telegramId`, `referralCode`

---

### 2. user_settings - Настройки пользователя

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary Key |
| userId | String | FK → users.id |
| defaultModel | String | Модель по умолчанию |
| defaultAspectRatio | String | Пропорции по умолчанию |
| notificationsEnabled | Boolean | Уведомления |

---

### 3. transactions - Транзакции

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary Key |
| userId | String | FK → users.id |
| type | Enum | DEPOSIT, WITHDRAWAL, REFUND, BONUS |
| amount | Decimal(10,2) | Сумма |
| balanceBefore | Decimal(10,2) | Баланс до |
| balanceAfter | Decimal(10,2) | Баланс после |
| status | Enum | PENDING, COMPLETED, FAILED, CANCELLED |
| paymentMethod | String? | yookassa, manual |
| paymentId | String? | ID платежа (unique) |
| description | String? | Описание |
| metadata | Json? | Доп. данные |
| createdAt | DateTime | Дата создания |
| completedAt | DateTime? | Дата завершения |
| generationId | String? | FK → generations.id |

**Индексы:** `userId`, `paymentId`, `status`

---

### 4. templates - Шаблоны промптов

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary Key |
| nameRu | String | Название (RU) |
| nameEn | String | Название (EN) |
| descriptionRu | String? | Описание (RU) |
| descriptionEn | String? | Описание (EN) |
| promptTemplate | String | Шаблон с `{description}` |
| category | String | Категория |
| previewImage | String? | URL превью |
| isActive | Boolean | Активен |
| sortOrder | Int | Порядок сортировки |
| usageCount | Int | Счетчик использований |

**Категории:** portrait, nature, fantasy, scifi, anime, art, design, architecture, food, fashion

---

### 5. generations - Генерации изображений

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary Key |
| userId | String | FK → users.id |
| model | String | kandinsky-3.0 / kandinsky-3.1 |
| prompt | String | Промпт |
| negativePrompt | String? | Негативный промпт |
| templateId | String? | FK → templates.id |
| aspectRatio | String | 1:1, 16:9, 9:16, 4:3, 3:4 |
| width | Int | Ширина |
| height | Int | Высота |
| sourceImageUrl | String? | URL исходного изображения |
| generatedImageUrl | String? | URL результата |
| status | Enum | QUEUED, PROCESSING, COMPLETED, FAILED |
| cost | Decimal(10,2) | Стоимость |
| errorMessage | String? | Ошибка |
| externalId | String? | ID в Kandinsky API |

**Индексы:** `userId`, `status`, `createdAt`

---

### 6. ai_models - Конфигурация AI моделей

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary Key |
| name | String | Имя модели (unique) |
| displayNameRu | String | Отображаемое имя (RU) |
| displayNameEn | String | Отображаемое имя (EN) |
| costPerGeneration | Decimal(10,2) | Стоимость генерации |
| isActive | Boolean | Активна |
| maxWidth | Int | Макс. ширина |
| maxHeight | Int | Макс. высота |
| supportedRatios | Json | Пропорции |

---

### 7. system_settings - Системные настройки

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary Key |
| key | String | Ключ (unique) |
| value | Json | Значение |
| description | String? | Описание |

**Настройки:**
- `min_balance_for_generation` - минимальный баланс
- `welcome_bonus` - приветственный бонус (50 руб.)
- `referral_bonus` - бонус за реферала
- `payment_amounts` - суммы пополнения [100, 300, 500, 1000]
- `max_generations_per_day` - лимит генераций

---

## Команды Prisma

```bash
# Генерация клиента
npm run prisma:generate

# Создание миграции
npm run prisma:migrate

# Применение миграций (production)
npm run prisma:migrate:deploy

# Заполнение начальными данными
npm run prisma:seed

# Открыть Prisma Studio
npm run prisma:studio
```

---

[REST API →](./api.md)
