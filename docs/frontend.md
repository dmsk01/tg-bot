# Mini App Frontend

[← Назад к оглавлению](./README.md) | [← Telegram бот](./bot.md)

React приложение для Telegram Mini Apps.

## Страницы

| Путь | Страница | Описание |
|------|----------|----------|
| `/` | EditorPage | Главная - редактор изображений |
| `/history` | HistoryPage | История генераций |
| `/balance` | BalancePage | Баланс и пополнение |

## Компоненты

### Editor

| Компонент | Описание |
|-----------|----------|
| `ModelSelector` | Выбор AI модели (Kandinsky 3.0/3.1) |
| `TemplateSelector` | Выбор шаблона промпта |
| `ImageUploader` | Загрузка изображения для редактирования (image-to-image) |
| `AspectRatioSelector` | Выбор пропорций (1:1, 16:9...) |
| `PromptEditor` | Текстовые поля для промпта |
| `GenerateButton` | Кнопка генерации |

### Common

| Компонент | Описание |
|-----------|----------|
| `Header` | Шапка с балансом |
| `Navigation` | Нижняя навигация |
| `Loader` | Индикатор загрузки |
| `AgeConfirmation` | Модальное окно 18+ |

## State Management (Zustand)

```typescript
// store/store.ts
const useStore = create<StoreState>()((...a) => ({
  ...createUserSlice(...a),      // user, balance, settings
  ...createGenerationSlice(...a), // prompt, model, templates
  ...createUiSlice(...a),        // modals
}));
```

### User Slice

```typescript
interface UserSlice {
  user: User | null;
  fetchUser: () => Promise<void>;
  updateLanguage: (lang: string) => Promise<void>;
  confirmAge: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}
```

### Generation Slice

```typescript
interface GenerationSlice {
  selectedModel: string;
  selectedTemplate: Template | null;
  prompt: string;
  negativePrompt: string;
  aspectRatio: AspectRatio;
  sourceImageUrl: string | null;  // URL загруженного изображения

  uploadSourceImage: (file: File) => Promise<void>;
  clearSourceImage: () => void;
  createGeneration: () => Promise<string | null>;
  pollGenerationStatus: (id: string) => Promise<Generation>;
}
```

## API Service

```typescript
// services/api.service.ts
class ApiService {
  setInitData(initData: string): void;  // Установить Telegram initData

  getMe(): Promise<User>;
  getBalance(): Promise<number>;
  getTemplates(): Promise<Template[]>;
  getModels(): Promise<AiModel[]>;
  uploadImage(file: File): Promise<{ url: string }>;  // Загрузка изображения
  createGeneration(params): Promise<{ id, status, cost }>;
  getGenerationStatus(id): Promise<Generation>;
}
```

## Telegram WebApp Integration

```typescript
// App.tsx
useEffect(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#1a1a2e');

    // Установить initData для API
    if (tg.initData) {
      apiService.setInitData(tg.initData);
    }
  }
}, []);
```

## Локализация

```typescript
// i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: 'ru',
});
```

Использование:

```tsx
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation();
  return <h1>{t('editor.title')}</h1>;
}
```

## Стили

CSS переменные в `styles/main.css`:

```css
:root {
  --bg-primary: #16213e;
  --bg-secondary: #1a1a2e;
  --bg-card: #0f3460;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --accent: #e94560;
  --success: #4ade80;
}
```

---

[Установка и настройка →](./setup.md)
