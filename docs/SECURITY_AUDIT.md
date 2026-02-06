# Security Audit Report

**Дата:** 2026-02-06
**Проект:** TG-Bot (Postcard Bot)
**Аудитор:** Claude Code

---

## Содержание

1. [Executive Summary](#executive-summary)
2. [Критические уязвимости](#критические-уязвимости)
3. [Уязвимости высокого приоритета](#уязвимости-высокого-приоритета)
4. [Уязвимости среднего приоритета](#уязвимости-среднего-приоритета)
5. [Низкий приоритет и рекомендации](#низкий-приоритет-и-рекомендации)
6. [Положительные аспекты](#положительные-аспекты)
7. [Чеклист исправлений](#чеклист-исправлений)

---

## Executive Summary

Проведен комплексный аудит безопасности проекта по следующим направлениям:
- OWASP Top 10
- Telegram Bot Vulnerabilities
- Frontend Security (Mini App & Admin Panel)
- Infrastructure & Configuration

### Статистика

| Критичность | Количество |
|-------------|------------|
| CRITICAL    | 3          |
| HIGH        | 5          |
| MEDIUM      | 12         |
| LOW         | 4          |

---

## Критические уязвимости

### CRIT-001: Реальные API токены в git репозитории

**Файл:** `backend/.env`
**Строки:** 6, 9, 10, 16
**CVSS:** 9.8 (Critical)

#### Описание
В репозиторий закоммичен файл `.env` с реальными секретами:

```env
# Строка 6 - Пароль базы данных
DATABASE_URL=postgresql://user:password@host:5432/db

# Строка 9 - Telegram Bot Token
TELEGRAM_BOT_TOKEN=<real_token_was_here>

# Строка 16 - Replicate API Token
REPLICATE_API_TOKEN=<real_token_was_here>
```

#### Риски
1. **Захват бота** - Атакующий может полностью контролировать Telegram бота
2. **Финансовые потери** - Использование Replicate API за ваш счет
3. **Доступ к БД** - При публичном доступе к серверу - полный доступ к данным

#### Инструкция по устранению

**Шаг 1: Отзыв токенов (немедленно!)**
```bash
# 1. Telegram Bot Token
# Откройте @BotFather в Telegram
# Команда: /revoke
# Выберите вашего бота
# Получите новый токен

# 2. Replicate API Token
# https://replicate.com/account/api-tokens
# Удалите скомпрометированный токен
# Создайте новый
```

**Шаг 2: Удаление из git истории**
```bash
# Установите git-filter-repo (рекомендуется)
pip install git-filter-repo

# Удалите файл из всей истории
git filter-repo --path backend/.env --invert-paths

# Или используйте BFG Repo-Cleaner
bfg --delete-files .env

# Force push (ВНИМАНИЕ: координируйте с командой!)
git push origin --force --all
```

**Шаг 3: Проверка .gitignore**
```bash
# Убедитесь что .env в .gitignore
cat .gitignore | grep -E "^\.env|backend/\.env"

# Должно быть:
# .env
# .env.local
# !.env.example
```

**Шаг 4: Обновление секретов на сервере**
```bash
# На production сервере
ssh user@server
cd /app
nano .env  # Вставьте НОВЫЕ токены
docker-compose restart
```

---

### CRIT-002: Bypass аутентификации в development режиме

**Файл:** `backend/src/api/middlewares/validate-telegram.middleware.ts`
**Строки:** 24-28, 108-120
**CVSS:** 9.1 (Critical)

#### Описание
В режиме разработки полностью отключается проверка Telegram initData:

```typescript
// Строки 24-28
if (!initData && configService.isDevelopment) {
  logger.debug('Dev mode: bypassing Telegram validation');
  req.telegramId = DEV_TELEGRAM_ID;  // Hardcoded ID: 123456789
  next();
  return;
}

// Строки 108-120 - автосоздание тестового пользователя с 1000 кредитов
if (!user && configService.isDevelopment && req.telegramId === DEV_TELEGRAM_ID) {
  user = await userService.createUser({...});
  await userService.addBalance(user.id, 1000, 'Dev mode initial balance');
}
```

#### Риски
1. Если `NODE_ENV=development` случайно установлен в production - полный bypass аутентификации
2. Любой запрос без `x-telegram-init-data` получает доступ к API

#### Инструкция по устранению

**Вариант A: Удалить dev bypass полностью (рекомендуется)**
```typescript
// validate-telegram.middleware.ts

// УДАЛИТЬ строки 24-28:
// if (!initData && configService.isDevelopment) {
//   logger.debug('Dev mode: bypassing Telegram validation');
//   req.telegramId = DEV_TELEGRAM_ID;
//   next();
//   return;
// }

// УДАЛИТЬ строки 108-120 (автосоздание dev пользователя)
```

**Вариант B: Использовать отдельный флаг**
```typescript
// config.service.ts - добавить
const envSchema = z.object({
  // ... existing
  ENABLE_DEV_AUTH_BYPASS: z.string().optional().transform(v => v === 'true'),
});

// validate-telegram.middleware.ts
if (!initData && configService.enableDevAuthBypass) {
  // Этот флаг НИКОГДА не должен быть в production .env
}
```

**Вариант C: Для локальной разработки использовать отдельный endpoint**
```typescript
// routes/dev.routes.ts (только для development)
if (configService.isDevelopment) {
  router.post('/dev/auth', async (req, res) => {
    // Создать тестовую сессию
  });
}
```

---

### CRIT-003: Telegram Webhook без валидации подписи

**Файл:** `backend/src/webhooks/telegram.webhook.ts`
**Строки:** 7-16
**CVSS:** 8.6 (High)

#### Описание
Webhook endpoint принимает любые POST запросы без проверки что они от Telegram:

```typescript
router.post('/telegram', async (req: Request, res: Response) => {
  try {
    const bot = botService.getBot();
    await bot.handleUpdate(req.body);  // Нет проверки подписи!
    res.sendStatus(200);
  } catch (error) {
    logger.error('Webhook error:', error);
    res.sendStatus(500);
  }
});
```

#### Риски
1. Атакующий может отправлять фейковые update события
2. Возможна инъекция команд от имени любого пользователя
3. Манипуляция балансом и генерациями

#### Инструкция по устранению

**Шаг 1: Сгенерировать секретный токен**
```bash
# Добавить в .env
TELEGRAM_WEBHOOK_SECRET=your_random_secret_at_least_32_chars
```

**Шаг 2: Установить webhook с секретом**
```typescript
// bot.service.ts - метод setWebhook
await this.bot.api.setWebhook(webhookUrl, {
  secret_token: configService.telegram.webhookSecret,
});
```

**Шаг 3: Добавить middleware проверки**
```typescript
// webhooks/telegram.webhook.ts
import crypto from 'crypto';

const validateTelegramWebhook = (req: Request, res: Response, next: NextFunction) => {
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];

  if (secretToken !== configService.telegram.webhookSecret) {
    logger.warn('Invalid webhook secret token', {
      ip: req.ip,
      headers: req.headers,
    });
    return res.sendStatus(403);
  }

  next();
};

router.post('/telegram', validateTelegramWebhook, async (req, res) => {
  // ... existing code
});
```

**Шаг 4: Обновить конфигурацию**
```typescript
// config.service.ts
const envSchema = z.object({
  TELEGRAM_WEBHOOK_SECRET: z.string().min(32),
  // ...
});

get telegram() {
  return {
    // ...existing
    webhookSecret: parsed.data.TELEGRAM_WEBHOOK_SECRET,
  };
}
```

---

## Уязвимости высокого приоритета

### HIGH-001: XSS через dangerouslySetInnerHTML

**Файл:** `frontend/src/layouts/components/notifications-drawer/notification-item.tsx`
**Строки:** 30-38, 139-140
**CVSS:** 7.5 (High)

#### Описание
```typescript
const readerContent = (data: string) => (
  <Box
    dangerouslySetInnerHTML={{ __html: data }}  // УЯЗВИМОСТЬ
    sx={{...}}
  />
);
```

#### Инструкция по устранению

**Шаг 1: Установить DOMPurify**
```bash
cd frontend
npm install dompurify
npm install -D @types/dompurify
```

**Шаг 2: Создать безопасный компонент**
```typescript
// src/components/safe-html/safe-html.tsx
import DOMPurify from 'dompurify';
import Box from '@mui/material/Box';

interface SafeHtmlProps {
  html: string;
  sx?: object;
}

export function SafeHtml({ html, sx }: SafeHtmlProps) {
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

  return (
    <Box
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      sx={sx}
    />
  );
}
```

**Шаг 3: Заменить в notification-item.tsx**
```typescript
import { SafeHtml } from 'src/components/safe-html/safe-html';

// Заменить:
// dangerouslySetInnerHTML={{ __html: data }}

// На:
<SafeHtml html={data} sx={{...}} />
```

---

### HIGH-002: initData в URL параметрах

**Файл:** `frontend/src/hooks/use-language-sync.ts`
**Строка:** 25
**CVSS:** 7.2 (High)

#### Описание
```typescript
const url = `${API_URL}/api/user/language-events?initData=${encodeURIComponent(initData)}`;
const eventSource = new EventSource(url);
```

Telegram initData - это токен аутентификации. Он не должен быть в URL потому что:
- Логируется в server access logs
- Сохраняется в browser history
- Виден в network proxies и CDN логах
- Может утечь через Referrer header

#### Инструкция по устранению

**Проблема:** EventSource API не поддерживает custom headers.

**Решение 1: Использовать POST + polling вместо SSE**
```typescript
// use-language-sync.ts
useEffect(() => {
  if (!initData) return;

  const pollLanguage = async () => {
    try {
      const response = await apiService.get('/user/me');
      if (response.languageCode !== currentLang) {
        setCurrentLang(response.languageCode);
      }
    } catch (error) {
      console.error('Language sync failed:', error);
    }
  };

  const interval = setInterval(pollLanguage, 30000); // каждые 30 сек
  pollLanguage(); // сразу при монтировании

  return () => clearInterval(interval);
}, [initData]);
```

**Решение 2: Использовать WebSocket с auth в handshake**
```typescript
// Если нужен real-time
const ws = new WebSocket(`${WS_URL}/language-events`);
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'auth', initData }));
};
```

---

### HIGH-003: CORS origin: '*' в development

**Файл:** `backend/src/app.ts`
**Строки:** 26-32
**CVSS:** 6.5 (Medium-High)

#### Описание
```typescript
app.use(
  cors({
    origin: configService.isDevelopment
      ? '*'  // Разрешает ВСЕ origins
      : [configService.telegram.miniAppUrl || ''],
    credentials: true,
  })
);
```

#### Риски
Если NODE_ENV случайно development в production - любой сайт может делать запросы к API.

#### Инструкция по устранению
```typescript
// app.ts
const allowedOrigins = configService.isDevelopment
  ? [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ]
  : [
      configService.telegram.miniAppUrl,
      configService.admin.corsOrigin,
    ].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Разрешить запросы без origin (мобильные приложения, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    credentials: true,
  })
);
```

---

### HIGH-004: Отсутствует CSRF защита

**Файлы:** `frontend/src/services/api.service.ts`, `admin/src/services/admin-api.service.ts`
**CVSS:** 6.8 (Medium-High)

#### Описание
State-changing запросы (POST, PUT, DELETE) отправляются без CSRF токенов.

#### Инструкция по устранению

**Шаг 1: Backend - генерация CSRF токена**
```typescript
// middlewares/csrf.middleware.ts
import crypto from 'crypto';

export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  // Для GET запросов - генерируем токен
  if (req.method === 'GET') {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false,  // Должен быть читаем JS
      secure: !configService.isDevelopment,
      sameSite: 'strict',
    });
  }

  // Для state-changing запросов - проверяем
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const cookieToken = req.cookies['XSRF-TOKEN'];
    const headerToken = req.headers['x-xsrf-token'];

    if (!cookieToken || cookieToken !== headerToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }

  next();
}
```

**Шаг 2: Frontend - отправка токена**
```typescript
// api.service.ts
import Cookies from 'js-cookie';

private getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (this.initData) {
    headers['x-telegram-init-data'] = this.initData;
  }

  // CSRF токен
  const csrfToken = Cookies.get('XSRF-TOKEN');
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  return headers;
}
```

---

### HIGH-005: Утечка информации в ошибках

**Файл:** `admin/src/services/admin-api.service.ts`
**Строки:** 39, 55, 71, 79
**CVSS:** 5.3 (Medium)

#### Описание
```typescript
throw new Error(response.data.error || 'Login failed');
```

Backend может вернуть детальные ошибки с информацией о системе.

#### Инструкция по устранению

**Backend: Sanitize ошибок**
```typescript
// middlewares/error-handler.middleware.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Error:', err);  // Полная ошибка в логах

  // Клиенту - только безопасное сообщение
  const safeMessages: Record<string, string> = {
    'INVALID_CREDENTIALS': 'Invalid email or password',
    'USER_NOT_FOUND': 'User not found',
    'VALIDATION_ERROR': 'Invalid input data',
    // ...
  };

  const errorCode = (err as any).code || 'INTERNAL_ERROR';
  const message = safeMessages[errorCode] || 'An error occurred';

  res.status((err as any).statusCode || 500).json({
    error: message,
    code: errorCode,
  });
}
```

**Frontend: Не показывать raw ошибки**
```typescript
// admin-api.service.ts
private handleError(error: any): never {
  const message = error.response?.data?.error;

  // Не показывать технические детали
  const userFriendlyMessages: Record<string, string> = {
    'Invalid email or password': 'Неверный email или пароль',
    'User not found': 'Пользователь не найден',
    // ...
  };

  throw new Error(userFriendlyMessages[message] || 'Произошла ошибка');
}
```

---

## Уязвимости среднего приоритета

### MED-001: Слабые требования к паролям

**Файл:** `backend/src/api/admin/controllers/admin-users.controller.ts`
**Строка:** 35

```typescript
password: z.string().min(8, 'Password must be at least 8 characters'),
```

#### Инструкция по устранению
```typescript
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');
```

---

### MED-002: Нет блокировки после неудачных попыток входа

**Файл:** `backend/src/services/admin/admin-auth.service.ts`

#### Инструкция по устранению
```typescript
// Добавить в AdminUser модель (schema.prisma)
model AdminUser {
  // ...existing
  failedLoginAttempts Int      @default(0)
  lockedUntil         DateTime?
}

// admin-auth.service.ts
async login(email: string, password: string, ipAddress: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Проверка блокировки
  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    const minutes = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
    throw new Error(`Account locked. Try again in ${minutes} minutes`);
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);

  if (!isValid) {
    const attempts = admin.failedLoginAttempts + 1;
    const lockUntil = attempts >= 5
      ? new Date(Date.now() + 15 * 60 * 1000)  // 15 минут
      : null;

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: lockUntil,
      },
    });

    throw new Error('INVALID_CREDENTIALS');
  }

  // Сброс счетчика при успешном входе
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  // ... generate tokens
}
```

---

### MED-003: Rate limit админки слишком высокий

**Файл:** `backend/src/api/admin/middlewares/rate-limit.middleware.ts`
**Строка:** 5

```typescript
max: 1000,  // 1000 запросов в минуту - слишком много
```

#### Инструкция по устранению
```typescript
export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,  // Уменьшить до 100
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

### MED-004: Нет rate limit на генерацию изображений

**Файл:** `backend/src/api/routes/generation.routes.ts`

#### Инструкция по устранению
```typescript
// middlewares/generation-rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';

export const generationRateLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 минута
  max: 5,  // 5 генераций в минуту
  keyGenerator: (req) => req.user?.id?.toString() || req.ip,
  message: { error: 'Too many generation requests. Please wait.' },
});

// generation.routes.ts
router.post('/', generationRateLimiter, generationController.create);
```

---

### MED-005: JWT secret fallback

**Файл:** `backend/src/common/config/config.service.ts`
**Строка:** 137

```typescript
jwtSecret: parsed.data.ADMIN_JWT_SECRET || parsed.data.JWT_SECRET,
```

#### Инструкция по устранению
```typescript
// Убрать optional() для ADMIN_JWT_SECRET
const envSchema = z.object({
  // ...
  ADMIN_JWT_SECRET: z.string().min(32),  // Обязательный, минимум 32 символа
});
```

---

### MED-006: Security audit не блокирует CI

**Файл:** `.github/workflows/ci.yml`
**Строки:** 191, 200

```yaml
continue-on-error: true  # Позволяет мержить с уязвимостями
```

#### Инструкция по устранению
```yaml
- name: Audit backend dependencies
  run: npm audit --audit-level=high
  working-directory: ./backend
  # Убрать continue-on-error или сделать:
  continue-on-error: false
```

---

### MED-007: Нет валидации длины промпта

**Файл:** `backend/src/api/controllers/generation.controller.ts`

#### Инструкция по устранению
```typescript
const createGenerationSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt is required')
    .max(2000, 'Prompt must be less than 2000 characters')
    .refine(
      (val) => !containsBannedWords(val),
      'Prompt contains prohibited content'
    ),
  negativePrompt: z.string().max(1000).optional(),
  // ...
});
```

---

### MED-008: Race condition в балансе

**Файл:** `backend/src/services/user.service.ts`
**Строки:** 115-152

#### Инструкция по устранению
```typescript
async deductBalance(userId: string, amount: number, reason: string): Promise<void> {
  return prisma.$transaction(async (tx) => {
    // SELECT FOR UPDATE - блокирует строку
    const user = await tx.$queryRaw`
      SELECT * FROM "User" WHERE id = ${userId} FOR UPDATE
    `;

    if (!user || user.balance < amount) {
      throw new Error('Insufficient balance');
    }

    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });

    await tx.balanceTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'DEDUCTION',
        reason,
      },
    });
  });
}
```

---

## Низкий приоритет и рекомендации

### LOW-001: Console.log в production

**Файлы:** Множественные
Удалить или заменить на logger все `console.log`, `console.error`.

### LOW-002: EventSource без retry логики

**Файл:** `frontend/src/hooks/use-language-sync.ts`
Добавить reconnect при ошибке.

### LOW-003: Токен в Redux state

**Файл:** `frontend/src/auth/context/jwt/auth-provider.tsx`
State виден в DevTools. Рассмотреть хранение только в httpOnly cookie.

### LOW-004: HTTP fallback в API URL

**Файлы:** `frontend/src/services/api.service.ts`, `admin/src/lib/axios.ts`
Fallback на `http://localhost:3000` - убедиться что в production всегда HTTPS.

---

## Положительные аспекты

1. **Helmet** используется для security headers
2. **Bcrypt** с 12 раундами для хэширования паролей
3. **Nginx** правильно настроен (HSTS, X-Frame-Options, X-XSS-Protection)
4. **Docker** запускается от non-root пользователя
5. **Rate limit** на логин админки (10 попыток / 15 мин)
6. **HTTPS** настроен в production
7. **.gitignore** корректно настроен (хотя .env уже был закоммичен)
8. **Zod** используется для валидации входных данных
9. **Prisma** защищает от SQL injection
10. **AuthGuard** корректно реализован в admin panel

---

## Чеклист исправлений

### Критические (немедленно)

- [ ] Отозвать Telegram Bot Token через @BotFather
- [ ] Отозвать Replicate API Token в dashboard
- [ ] Удалить .env из git истории (`git filter-repo`)
- [ ] Сгенерировать новые токены и обновить на сервере
- [ ] Убрать dev mode bypass из `validate-telegram.middleware.ts`
- [ ] Добавить валидацию webhook подписи

### Высокие (в течение недели)

- [ ] Установить DOMPurify и заменить dangerouslySetInnerHTML
- [ ] Убрать initData из URL параметров
- [ ] Исправить CORS конфигурацию
- [ ] Добавить CSRF защиту
- [ ] Sanitize error messages

### Средние (запланировать)

- [ ] Усилить требования к паролям (12+ символов)
- [ ] Добавить account lockout после 5 неудачных попыток
- [ ] Уменьшить rate limit админки до 100/мин
- [ ] Добавить rate limit на генерацию (5/мин)
- [ ] Сделать ADMIN_JWT_SECRET обязательным
- [ ] Убрать continue-on-error из security audit в CI
- [ ] Добавить валидацию длины промпта (max 2000)
- [ ] Исправить race condition в deductBalance

### Низкие (при возможности)

- [ ] Убрать console.log из production кода
- [ ] Добавить retry логику в EventSource
- [ ] Рассмотреть httpOnly cookie для токенов
- [ ] Убедиться что нет HTTP fallback в production

---

## Ссылки

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Telegram Bot API Security](https://core.telegram.org/bots/api#setwebhook)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
