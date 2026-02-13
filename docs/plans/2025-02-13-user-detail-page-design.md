# Детальная страница пользователя в админ-панели

## Обзор

Создание детальной страницы пользователя с полной информацией, историей генераций, транзакций и действий админов. Возможность экспорта данных в CSV и Excel.

## Навигация

- **Переход на страницу:** клик по строке таблицы + отдельная кнопка "Подробнее"
- **Маршрут:** `/users/:id`
- **Возврат:** кнопка "Назад к списку"

## Файловая структура

```
admin/src/
├── pages/users/
│   ├── list.tsx          (изменить - добавить навигацию)
│   └── detail.tsx        (новый)
├── routes/
│   ├── index.tsx         (добавить маршрут)
│   └── paths.ts          (добавить users.detail)
├── services/
│   └── admin-api.service.ts (добавить методы экспорта)
├── store/
│   └── store.ts          (добавить состояние для детальной страницы)
├── types/
│   └── index.ts          (добавить типы Generation, Transaction, AdminLog)
└── components/users/
    ├── UserInfoCard.tsx       (шапка с инфо и действиями)
    ├── UserGenerationsTab.tsx (таблица генераций)
    ├── UserTransactionsTab.tsx (таблица транзакций)
    ├── UserLogsTab.tsx        (таблица истории действий)
    └── ExportButton.tsx       (кнопка экспорта с выбором формата)
```

## Компоненты

### 1. Шапка страницы (UserInfoCard)

**Информация о пользователе:**

| Поле | Описание |
|------|----------|
| Telegram ID | С кнопкой копирования |
| Username | @username |
| Имя | firstName + lastName |
| Баланс | Цветной Chip |
| Статус | Активен / Заблокирован (Chip) |
| Регистрация | Дата |
| Последняя активность | Относительное время |
| Реферальный код | Код пользователя |
| Язык | Код языка |
| Генераций | Количество |
| Транзакций | Количество |

**Действия (кнопки):**
- Изменить баланс (диалог)
- Заблокировать / Разблокировать (с подтверждением)
- Назад к списку

### 2. Табы с данными

Три вкладки: "Генерации" | "Транзакции" | "История действий"

#### Таб "Генерации"

| Колонка | Описание |
|---------|----------|
| Дата | Дата создания |
| Тип | TEXT_TO_IMAGE / IMAGE_TO_IMAGE / INPAINTING |
| Модель | Название модели |
| Промпт | Текст (обрезанный, tooltip с полным) |
| Статус | COMPLETED / FAILED / MODERATED (Chip) |
| Стоимость | Сумма списания |
| Превью | Миниатюра результата |

#### Таб "Транзакции"

| Колонка | Описание |
|---------|----------|
| Дата | Дата транзакции |
| Тип | DEPOSIT / WITHDRAWAL / REFUND / BONUS (Chip) |
| Сумма | +/- с цветом |
| Баланс до | Баланс до операции |
| Баланс после | Баланс после операции |
| Описание | Причина/комментарий |
| Статус | COMPLETED / PENDING / FAILED |

#### Таб "История действий"

| Колонка | Описание |
|---------|----------|
| Дата | Когда выполнено |
| Админ | Кто выполнил |
| Действие | Тип действия |
| Детали | Подробности в JSON/тексте |

### 3. Экспорт данных (ExportButton)

- Кнопка с иконкой Download
- Меню выбора: CSV или Excel
- Экспортирует все записи текущего таба

**Формат имени файла:**
- `user_{telegramId}_{tab}_{date}.csv`
- `user_{telegramId}_{tab}_{date}.xlsx`

## Backend API

### Существующие endpoints (используем)

```
GET /admin/users/:id              - детали пользователя
GET /admin/users/:id/transactions - транзакции с пагинацией
GET /admin/users/:id/generations  - генерации с пагинацией
POST /admin/users/:id/balance     - изменение баланса
PATCH /admin/users/:id            - обновление (блокировка)
```

### Новые endpoints

```
GET /admin/users/:id/logs                    - история действий админов
GET /admin/users/:id/generations/export      - экспорт генераций (?format=csv|xlsx)
GET /admin/users/:id/transactions/export     - экспорт транзакций (?format=csv|xlsx)
GET /admin/users/:id/logs/export             - экспорт логов (?format=csv|xlsx)
```

### Зависимости (backend)

- `exceljs` — для генерации Excel файлов

## Изменения в существующих файлах

### admin/src/pages/users/list.tsx

- Добавить `onRowClick` для перехода на детальную страницу
- Добавить кнопку "Подробнее" в колонку Actions

### admin/src/routes/paths.ts

```typescript
users: {
  root: '/users',
  detail: (id: string) => `/users/${id}`,
}
```

### admin/src/routes/index.tsx

```typescript
{
  path: 'users/:id',
  element: <UserDetailPage />,
}
```

### admin/src/types/index.ts

Добавить типы:
- `Generation`
- `Transaction`
- `AdminLog`
- `ExportFormat`

### admin/src/store/store.ts

Добавить состояние:
- `currentUser`
- `userGenerations` + пагинация
- `userTransactions` + пагинация
- `userLogs` + пагинация

### admin/src/services/admin-api.service.ts

Добавить методы:
- `getUserLogs(id, pagination)`
- `exportUserGenerations(id, format)`
- `exportUserTransactions(id, format)`
- `exportUserLogs(id, format)`

## UI/UX

- Material UI компоненты (Card, Tabs, DataGrid, Menu, Chip, Button, Dialog)
- Серверная пагинация (20 записей на страницу)
- Цветовая индикация статусов и сумм
- Tooltip для длинного текста (промпты)
- Подтверждение для опасных действий (блокировка)
