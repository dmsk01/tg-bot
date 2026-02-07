# Настройка админ-панели на продакшене

[← Назад к админ-панели](./admin-panel.md) | [← Назад к оглавлению](./README.md)

## GitHub Secrets

Добавьте в GitHub → Settings → Secrets and variables → Actions:

| Секрет | Описание | Пример |
|--------|----------|--------|
| `ADMIN_CORS_ORIGIN` | URL админки (без слеша на конце) | `https://admin.poct-card.ru` |
| `ADMIN_JWT_SECRET` | Секрет для JWT токенов админки | случайная строка 32+ символа |
| `VITE_API_URL` | URL API для фронтенда (с `/api`) | `https://poct-card.ru/api` |
| `ADMIN_BASIC_AUTH_USER` | Логин для nginx basic auth | `admin` |
| `ADMIN_BASIC_AUTH_PASS` | Пароль для nginx basic auth | надежный пароль |

---

## Применение схемы БД

После первого деплоя применить схему Prisma:

```bash
sudo docker exec postcard-backend npx prisma db push --accept-data-loss
```

---

## Создание первого администратора

### 1. Зайти в контейнер

```bash
sudo docker exec -it postcard-backend sh
```

### 2. Создать скрипт

Внутри контейнера (замените `YOUR_PASSWORD` на свой пароль):

```bash
cd /app
echo 'const b=require("bcrypt"),{PrismaClient:P}=require("@prisma/client"),p=new P();b.hash("YOUR_PASSWORD",12).then(h=>p.adminUser.create({data:{username:"admin",passwordHash:h,role:"SUPER_ADMIN"}})).then(a=>console.log("OK:",a.username)).finally(()=>p.$disconnect())' > create-admin.cjs
```

### 3. Запустить

```bash
node create-admin.cjs
```

### 4. Удалить скрипт

**Обязательно!** Скрипт содержит пароль в открытом виде:

```bash
rm create-admin.cjs
exit
```

---

## Проверка работоспособности

1. Открыть `https://admin.your-domain.com`
2. Ввести basic auth логин/пароль (nginx)
3. Войти с созданным логином/паролем админа

---

## Troubleshooting

### CORS ошибка на POST запросы

- Проверить что `ADMIN_CORS_ORIGIN` задан без слеша на конце
- Проверить что в `backend/src/app.ts` используется `configService.admin.corsOrigin`

### 405 Method Not Allowed на OPTIONS

- Проверить что `VITE_API_URL` содержит `/api` на конце

### 500 Internal Server Error "table does not exist"

- Выполнить `prisma db push`:

```bash
sudo docker exec postcard-backend npx prisma db push --accept-data-loss
```

### Логи бекенда

```bash
# Все логи
sudo docker logs postcard-backend

# В реальном времени
sudo docker logs -f postcard-backend

# Последние 100 строк
sudo docker logs --tail 100 postcard-backend
```

---

## Чеклист деплоя админки

- [ ] `ADMIN_CORS_ORIGIN` настроен (без слеша на конце)
- [ ] `VITE_API_URL` содержит `/api`
- [ ] `ADMIN_JWT_SECRET` задан
- [ ] `ADMIN_BASIC_AUTH_USER` и `ADMIN_BASIC_AUTH_PASS` заданы
- [ ] SSL сертификат для `admin.your-domain.com` получен
- [ ] `prisma db push` выполнен
- [ ] Первый админ создан
- [ ] Скрипт создания админа удален

---

**Дата создания:** 2026-02-07
