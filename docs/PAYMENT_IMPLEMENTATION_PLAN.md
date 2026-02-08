# План реализации платёжной системы

**Дата создания:** 2026-02-08
**Статус:** В работе

---

## Обзор

Реализация полноценной платёжной системы с интеграцией YooKassa для пополнения баланса пользователей.

---

## Этапы реализации

### Этап 1: Модель данных
- [x] 1.1 Создать модель Payment в schema.prisma
- [x] 1.2 Добавить поле idempotencyKey в Payment
- [x] 1.3 Добавить связь Payment -> Transaction
- [ ] 1.4 Создать миграцию (на сервере: `prisma migrate dev --name add_payment_model`)
- [x] 1.5 Сгенерировать Prisma Client

### Этап 2: Backend сервисы
- [x] 2.1 Установить yookassa SDK (@a2seven/yoo-checkout)
- [x] 2.2 Создать PaymentService (создание платежа, проверка статуса)
- [x] 2.3 Создать WebhookService (обработка уведомлений)
- [x] 2.4 Добавить валидацию подписи webhook (Basic Auth)

### Этап 3: API endpoints
- [x] 3.1 POST /api/payments/create - создание платежа
- [x] 3.2 GET /api/payments/:id - статус платежа
- [x] 3.3 POST /api/webhooks/yookassa - webhook handler
- [x] 3.4 GET /api/transactions - история транзакций
- [x] 3.5 GET /api/payments/amounts - допустимые суммы

### Этап 4: Frontend интеграция
- [x] 4.1 Добавить API методы в apiService (createPayment, getPaymentAmounts, getTransactions)
- [x] 4.2 Обновить BalancePage - реальная оплата с редиректом на YooKassa
- [ ] 4.3 Добавить страницу истории транзакций (опционально)
- [x] 4.4 Обработка редиректа после оплаты (?payment=success)
- [x] 4.5 Добавить типы Payment, Transaction в types/index.ts
- [x] 4.6 Добавить i18n переводы для оплаты

### Этап 5: Тестирование и документация
- [x] 5.1 Проверить сборку backend
- [x] 5.2 Проверить сборку frontend
- [ ] 5.3 Обновить SECURITY_AUDIT.md (при необходимости)
- [x] 5.4 Добавить инструкцию по настройке YooKassa (ниже)

---

## Детали реализации

### 1. Модель Payment

```prisma
model Payment {
  id                String        @id @default(uuid())
  userId            String
  provider          String        @default("yookassa")
  providerPaymentId String?       @unique
  amount            Decimal       @db.Decimal(10, 2)
  currency          String        @default("RUB")
  status            PaymentStatus @default(CREATED)
  idempotencyKey    String        @unique
  description       String?
  returnUrl         String?
  confirmationUrl   String?
  webhookData       Json?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  completedAt       DateTime?

  user              User          @relation(fields: [userId], references: [id])
  transaction       Transaction?

  @@index([userId])
  @@index([status])
  @@index([providerPaymentId])
}

enum PaymentStatus {
  CREATED
  PENDING
  SUCCEEDED
  CANCELLED
  REFUNDED
}
```

### 2. API Endpoints

| Method | Endpoint | Описание |
|--------|----------|----------|
| POST | /api/payments/create | Создать платёж, вернуть URL для оплаты |
| GET | /api/payments/:id | Получить статус платежа |
| POST | /api/webhooks/yookassa | Обработать webhook от YooKassa |
| GET | /api/transactions | История транзакций пользователя |

### 3. Flow оплаты

```
1. User -> POST /api/payments/create { amount, idempotencyKey }
2. Backend -> Создать Payment (status: CREATED)
3. Backend -> YooKassa API -> Получить confirmation_url
4. Backend -> Обновить Payment (status: PENDING, providerPaymentId)
5. Backend -> Return { paymentId, confirmationUrl }
6. User -> Redirect to confirmationUrl -> Оплата
7. YooKassa -> POST /api/webhooks/yookassa
8. Backend -> Проверить подпись
9. Backend -> Транзакция: Payment(SUCCEEDED) + User(balance++) + Transaction
10. Backend -> Notify user (optional)
```

---

## Конфигурация

Переменные окружения (уже определены в config.service.ts):
- `YOOKASSA_SHOP_ID` - ID магазина
- `YOOKASSA_SECRET_KEY` - Секретный ключ
- `YOOKASSA_RETURN_URL` - URL возврата после оплаты

---

## Прогресс выполнения

| Дата | Этап | Статус | Примечания |
|------|------|--------|------------|
| 2026-02-08 | План создан | ✅ | - |
| 2026-02-08 | Этап 1: Модель данных | ✅ | Payment model, связь с Transaction |
| 2026-02-08 | Этап 2: Backend сервисы | ✅ | PaymentService, WebhookService |
| 2026-02-08 | Этап 3: API endpoints | ✅ | /payments/*, /webhooks/yookassa, /transactions |
| 2026-02-08 | Этап 4: Frontend | ✅ | BalancePage с реальной оплатой |
| 2026-02-08 | Этап 5: Финализация | ✅ | Сборки проверены |

---

## Настройка YooKassa

### 1. Получение ключей

1. Зарегистрируйтесь в [YooKassa](https://yookassa.ru/)
2. Создайте магазин
3. Получите `shopId` и `secretKey` в разделе "Интеграция"

### 2. Переменные окружения

Добавьте в `.env` (или GitHub Secrets для production):

```bash
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
YOOKASSA_RETURN_URL=https://your-domain.com/balance?payment=success
```

### 3. Настройка Webhook

В личном кабинете YooKassa:
1. Перейдите в "Интеграция" → "HTTP-уведомления"
2. Добавьте URL: `https://your-api-domain.com/api/webhooks/yookassa`
3. Выберите события: `payment.succeeded`, `payment.canceled`
4. Установите Basic Auth с вашими `shopId:secretKey`

### 4. Миграция базы данных

На сервере выполните:
```bash
cd backend
npx prisma migrate dev --name add_payment_model
```

---

## Созданные файлы

### Backend
- `prisma/schema.prisma` - модель Payment, enum PaymentStatus
- `src/services/payment/payment.service.ts` - создание платежей, работа с YooKassa API
- `src/services/payment/webhook.service.ts` - обработка webhook уведомлений
- `src/services/payment/index.ts` - экспорты
- `src/api/controllers/payment.controller.ts` - контроллер платежей
- `src/api/controllers/transaction.controller.ts` - контроллер транзакций
- `src/api/routes/payment.routes.ts` - маршруты платежей
- `src/api/routes/webhook.routes.ts` - маршрут webhook
- `src/api/routes/transaction.routes.ts` - маршруты транзакций

### Frontend
- `src/types/index.ts` - типы Payment, Transaction, PaymentStatus
- `src/services/api.service.ts` - методы createPayment, getPaymentAmounts, getTransactions
- `src/pages/balance/balance-page.tsx` - обновлённая страница баланса
- `src/i18n/locales/ru.json` - переводы
- `src/i18n/locales/en.json` - переводы

---
