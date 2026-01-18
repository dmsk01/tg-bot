// =============================================================================
// PM2 Ecosystem Configuration
// =============================================================================
// Конфигурация PM2 для управления Node.js процессами
//
// Команды:
//   pm2 start ecosystem.config.js --env production  # Запуск в production
//   pm2 reload ecosystem.config.js --env production # Graceful reload
//   pm2 stop postcard-bot                           # Остановка
//   pm2 logs postcard-bot                           # Просмотр логов
//   pm2 monit                                       # Мониторинг
// =============================================================================

module.exports = {
  apps: [
    {
      // -----------------------------------------------------------------------
      // Основное приложение (Backend + Telegram Bot)
      // -----------------------------------------------------------------------
      name: 'postcard-bot',

      // Точка входа (скомпилированный TypeScript)
      script: 'dist/index.js',

      // Количество инстансов
      // 1 - для бота (grammY не поддерживает cluster mode)
      // Для API можно увеличить: 'max' или конкретное число
      instances: 1,

      // Режим выполнения
      // 'fork' - для одного инстанса
      // 'cluster' - для нескольких инстансов (не работает с grammY webhooks)
      exec_mode: 'fork',

      // Автоматический перезапуск при падении
      autorestart: true,

      // Отслеживание изменений файлов (только для dev)
      watch: false,

      // Перезапуск при превышении памяти
      max_memory_restart: '1G',

      // Минимальное время работы для признания успешного запуска
      min_uptime: '10s',

      // Максимальное количество перезапусков в случае ошибок
      max_restarts: 10,

      // Задержка между перезапусками (ms)
      restart_delay: 4000,

      // Graceful shutdown - время ожидания перед kill
      kill_timeout: 5000,

      // Слушать SIGINT для graceful shutdown
      listen_timeout: 3000,

      // Переменные окружения для development
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },

      // Переменные окружения для production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // -----------------------------------------------------------------------
      // Логирование
      // -----------------------------------------------------------------------
      // Файл для ошибок
      error_file: '/var/www/postcard-bot/logs/pm2-error.log',

      // Файл для stdout
      out_file: '/var/www/postcard-bot/logs/pm2-out.log',

      // Комбинированный файл логов
      log_file: '/var/www/postcard-bot/logs/pm2-combined.log',

      // Добавлять timestamp к каждой строке лога
      time: true,

      // Ротация логов - максимальный размер файла
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Объединять логи от всех инстансов
      merge_logs: true,

      // -----------------------------------------------------------------------
      // Cron и автоматизация
      // -----------------------------------------------------------------------
      // Можно добавить cron для перезапуска (опционально)
      // cron_restart: '0 2 * * *', // Перезапуск каждый день в 2:00

      // -----------------------------------------------------------------------
      // Source maps для отладки (production)
      // -----------------------------------------------------------------------
      source_map_support: true,

      // -----------------------------------------------------------------------
      // Интерпретатор (по умолчанию node)
      // -----------------------------------------------------------------------
      interpreter: 'node',

      // Аргументы для Node.js
      node_args: [
        '--enable-source-maps', // Поддержка source maps для TypeScript
        // '--max-old-space-size=1024', // Раскомментировать для ограничения памяти
      ],

      // -----------------------------------------------------------------------
      // Рабочая директория
      // -----------------------------------------------------------------------
      cwd: '/var/www/postcard-bot/backend',
    },
  ],

  // ===========================================================================
  // Deploy Configuration (альтернатива GitHub Actions)
  // ===========================================================================
  // Можно использовать pm2 deploy вместо или вместе с GitHub Actions
  // Документация: https://pm2.keymetrics.io/docs/usage/deployment/
  deploy: {
    production: {
      // Пользователь на сервере
      user: 'deploy',

      // IP или hostname сервера
      host: 'your-server-ip',

      // Ветка для деплоя
      ref: 'origin/main',

      // Git репозиторий
      repo: 'git@github.com:your-username/postcard-bot.git',

      // Путь на сервере
      path: '/var/www/postcard-bot',

      // Команды после получения кода
      'post-deploy':
        'cd backend && npm ci && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --env production',

      // Переменные окружения для SSH
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};
