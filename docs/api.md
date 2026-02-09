# REST API

[← Назад к оглавлению](./README.md) | [← База данных](./database.md)

API для взаимодействия Mini App с backend.

## Аутентификация

Все запросы должны содержать заголовок с Telegram initData:

```
X-Telegram-Init-Data: <initData из Telegram WebApp>
```

---

## Эндпоинты

### Health Check

#### GET /api/health
Проверка работоспособности сервера.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-24T12:00:00.000Z",
  "environment": "production"
}
```

---

### User API

#### GET /api/user/me
Получить текущего пользователя.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "telegramId": "123456789",
    "username": "user",
    "firstName": "John",
    "languageCode": "ru",
    "isAgeConfirmed": true,
    "balance": 50.00,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

#### GET /api/user/balance
Получить баланс.

**Response:**
```json
{
  "success": true,
  "data": { "balance": 50.00 }
}
```

#### GET /api/user/settings
Получить настройки пользователя.

#### PATCH /api/user/settings
Обновить настройки.

**Body:**
```json
{
  "defaultModel": "kandinsky-3.1",
  "defaultAspectRatio": "1:1",
  "notificationsEnabled": true
}
```

#### PATCH /api/user/language
Изменить язык.

**Body:**
```json
{ "languageCode": "en" }
```

#### POST /api/user/age-confirm
Подтвердить совершеннолетие.

---

### Templates API

#### GET /api/templates
Получить список шаблонов.

**Query params:**
- `category` (optional) - фильтр по категории

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Классический портрет",
      "description": "Элегантный портрет",
      "category": "portrait",
      "promptTemplate": "Classic portrait of {description}..."
    }
  ]
}
```

#### GET /api/templates/categories
Получить список категорий.

#### GET /api/templates/popular
Получить популярные шаблоны.

#### GET /api/templates/:id
Получить шаблон по ID.

---

### Models API

#### GET /api/models
Получить список AI моделей.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "kandinsky-3.1",
      "displayName": "Kandinsky 3.1",
      "description": "Улучшенная модель",
      "costPerGeneration": 15.00,
      "maxWidth": 1024,
      "maxHeight": 1024,
      "supportedRatios": ["1:1", "16:9", "9:16", "4:3", "3:4"]
    }
  ]
}
```

---

### Generation API

#### POST /api/generation/upload
Загрузить изображение для редактирования (image-to-image).

**Content-Type:** `multipart/form-data`

**Body:**
- `image` - файл изображения (JPEG, PNG, WebP, GIF, max 10MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/abc123.jpg"
  }
}
```

#### POST /api/generation/create
Создать генерацию.

**Body:**
```json
{
  "model": "kandinsky-3.1",
  "prompt": "A beautiful sunset over mountains",
  "negativePrompt": "blurry, low quality",
  "templateId": "uuid",
  "aspectRatio": "16:9",
  "sourceImageUrl": "/uploads/abc123.jpg"
}
```

**Примечание:** `sourceImageUrl` опционален. Если указан - выполняется image-to-image редактирование. Если не указан - генерация с нуля (text-to-image).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "QUEUED",
    "cost": 15.00
  }
}
```

#### GET /api/generation/:id
Получить статус генерации.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "generatedImageUrl": "/generated/image.png",
    "createdAt": "2026-01-01T00:00:00Z",
    "processingEndedAt": "2026-01-01T00:00:05Z"
  }
}
```

#### GET /api/generation/history
Получить историю генераций.

**Query params:**
- `page` (default: 1)
- `limit` (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

#### DELETE /api/generation/:id
Удалить генерацию.

---

### Webhooks

#### POST /webhook/telegram
Webhook для Telegram Bot API.

#### POST /webhook/yookassa
Webhook для ЮKassa платежей (после интеграции).

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Неверный запрос |
| 401 | Не авторизован (невалидный initData) |
| 402 | Недостаточно средств |
| 403 | Доступ запрещен |
| 404 | Не найдено |
| 500 | Внутренняя ошибка |

---

[Telegram бот →](./bot.md)
