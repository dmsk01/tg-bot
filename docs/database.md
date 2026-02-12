# База данных

[← Назад к оглавлению](./README.md) | [← Архитектура](./architecture.md)

База данных PostgreSQL с использованием Prisma ORM. Схема содержит 10 таблиц.

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
| replicatePredictionId | String? | ID предсказания в Replicate (unique) |
| generationType | Enum | TEXT_TO_IMAGE, IMAGE_TO_IMAGE, INPAINTING |
| model | String | flux-1.1-pro, flux-fill-pro |
| prompt | String | Промпт |
| negativePrompt | String? | Негативный промпт |
| templateId | String? | FK → templates.id |
| aspectRatio | String | 1:1, 16:9, 9:16, 4:3, 3:4, 21:9, 9:21 |
| width | Int? | Ширина |
| height | Int? | Высота |
| guidance | Float? | Guidance scale (default: 3.5) |
| steps | Int? | Количество шагов (default: 28) |
| seed | Int? | Seed для воспроизводимости |
| strength | Float? | Сила преобразования (default: 0.75) |
| sourceImageUrl | String? | URL исходного изображения |
| sourceTelegramFileId | String? | Telegram file_id исходника |
| maskImageUrl | String? | URL маски (для inpainting) |
| maskTelegramFileId | String? | Telegram file_id маски |
| resultUrl | String? | URL результата |
| resultTelegramFileId | String? | Telegram file_id результата |
| generatedImageUrl | String? | URL результата (legacy) |
| status | Enum | PENDING, QUEUED, PROCESSING, COMPLETED, FAILED, MODERATED |
| cost | Decimal(10,4) | Стоимость (USD) |
| errorMessage | String? | Ошибка |
| moderationReason | String? | Причина модерации |
| createdAt | DateTime | Дата создания |
| startedAt | DateTime? | Начало обработки |
| completedAt | DateTime? | Завершение |

**Индексы:** `userId`, `status`, `createdAt`, `replicatePredictionId`

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
- `min_balance_for_generation` - минимальный баланс ($0.04)
- `welcome_bonus` - приветственный бонус ($0.50)
- `referral_bonus` - бонус за реферала ($0.25)
- `payment_amounts` - суммы пополнения [1, 3, 5, 10, 25] USD
- `max_generations_per_day` - лимит генераций (100)
- `rate_limit_hourly` - лимит в час (20)
- `rate_limit_concurrent` - параллельные генерации (2)
- `default_model` - модель по умолчанию (flux-1.1-pro)

---

### 8. api_usage - Статистика использования API

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary Key |
| userId | String | FK → users.id |
| date | Date | Дата |
| model | String | Название модели |
| requestCount | Int | Кол-во запросов |
| successCount | Int | Успешных |
| failedCount | Int | Неудачных |
| totalCost | Decimal(10,4) | Общая стоимость |

**Индексы:** `userId + date + model` (unique), `date`

---

### 9. moderation_logs - Логи модерации

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary Key |
| userId | String | FK → users.id |
| generationId | String? | FK → generations.id |
| inputType | String | Тип контента (prompt, image) |
| inputContent | String | Содержимое |
| blocked | Boolean | Заблокировано |
| reason | String? | Причина блокировки |
| createdAt | DateTime | Дата |

**Индексы:** `userId`, `blocked`, `createdAt`

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

## Миграции

При старте контейнера backend автоматически выполняется `prisma migrate deploy`, применяя все pending миграции. Данные при этом сохраняются.

**Важно:** Миграции безопасны для данных. Они только добавляют/изменяют структуру, не удаляя существующие записи.

Данные теряются только при:
- `prisma db push --force-reset` — полный сброс БД
- `prisma migrate reset` — удаление и пересоздание БД

---

## Резервное копирование

### Скрипты

В директории `deploy/` находятся скрипты для бэкапа и восстановления:

| Скрипт | Описание |
|--------|----------|
| `backup.sh` | Создаёт сжатый бэкап, хранит последние 7 дней |
| `restore.sh` | Восстанавливает БД из бэкапа |

### Ручной бэкап

```bash
cd deploy
chmod +x backup.sh restore.sh  # один раз
./backup.sh
```

Бэкапы сохраняются в `deploy/backups/backup_YYYYMMDD_HHMMSS.sql.gz`

### Восстановление

```bash
./restore.sh backups/backup_20240115_030000.sql.gz
```

Скрипт:
1. Останавливает backend
2. Восстанавливает данные из бэкапа
3. Запускает backend (миграции применятся автоматически)

### Автоматический бэкап (cron)

```bash
crontab -e
```

Добавить строку (бэкап каждый день в 3:00):

```
0 3 * * * /path/to/deploy/backup.sh >> /var/log/postgres-backup.log 2>&1
```

### Хранение данных

PostgreSQL данные хранятся в Docker volume `postcard_postgres_data`. Volume сохраняется при перезапуске/пересоздании контейнера.

Проверить volume:
```bash
docker volume inspect postcard_postgres_data
```

---

[REST API →](./api.md)
