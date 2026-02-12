# =============================================================================
# Dockerfile для Postcard Bot Backend
# =============================================================================
# Multi-stage build для минимального размера образа
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Установка зависимостей для сборки native модулей (sharp)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Устанавливаем ВСЕ зависимости (включая devDependencies для сборки)
RUN npm ci

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Собираем TypeScript
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

# Установка зависимостей для sharp и healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Копируем package files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости
RUN npm ci --omit=dev

# Генерируем Prisma Client для production
RUN npx prisma generate

# Копируем собранное приложение из builder
COPY --from=builder /app/dist ./dist

# Создаем директории для uploads и generated
RUN mkdir -p uploads generated logs

# Создаем non-root пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Устанавливаем права
RUN chown -R nodejs:nodejs /app

# Переключаемся на non-root пользователя
USER nodejs

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=3000

# Порт
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Запуск приложения
CMD ["node", "dist/index.js"]
