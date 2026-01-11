# Деплой

[← Назад к оглавлению](./README.md) | [← ngrok](./ngrok.md)

## Требования к VPS

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Bandwidth**: 100 Mbps

## Подготовка VPS

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка пакетов
sudo apt install -y nginx postgresql postgresql-contrib redis-server git curl

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2
sudo npm install -g pm2

# Certbot для SSL
sudo apt install -y certbot python3-certbot-nginx
```

## Настройка PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE postcard_bot;
CREATE USER postcard_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE postcard_bot TO postcard_user;
\q
```

## Деплой Backend

```bash
cd /var/www
sudo git clone <repository-url> postcard_bot
sudo chown -R $USER:$USER postcard_bot
cd postcard_bot/backend

npm install
cp .env.example .env
nano .env  # Настроить production переменные

npm run build
npm run prisma:migrate:deploy
npm run prisma:seed

pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Деплой Frontend

```bash
cd /var/www/postcard_bot/frontend

npm install
cp .env.example .env
nano .env  # Настроить production переменные

npm run build
# Файлы в dist/
```

## Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/postcard-bot
```

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        alias /var/www/postcard_bot/backend/uploads;
        expires 30d;
    }

    location /generated {
        alias /var/www/postcard_bot/backend/generated;
        expires 30d;
    }
}

# Frontend Mini App
server {
    listen 80;
    server_name app.yourdomain.com;

    root /var/www/postcard_bot/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Активация:
```bash
sudo ln -s /etc/nginx/sites-available/postcard-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL сертификаты

```bash
sudo certbot --nginx -d api.yourdomain.com -d app.yourdomain.com
```

## Настройка Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://api.yourdomain.com/webhook/telegram"
```

## Мониторинг

```bash
# PM2
pm2 monit
pm2 logs postcard-bot

# Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Команды PM2

```bash
pm2 start ecosystem.config.js  # Запуск
pm2 stop postcard-bot          # Остановка
pm2 restart postcard-bot       # Перезапуск
pm2 logs postcard-bot          # Логи
pm2 monit                      # Мониторинг
pm2 save                       # Сохранить состояние
```

---

[Этапы реализации →](./roadmap.md)
