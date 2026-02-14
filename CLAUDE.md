# Claude Code Project Instructions

## Project Overview

Telegram Mini App for AI image generation with payment integration.

**Tech Stack:**
- Backend: Node.js, Express 5, TypeScript, Prisma, PostgreSQL, Redis, BullMQ
- Frontend: React 19, Vite, MUI 7, Zustand, React Router 7
- Telegram: grammy (bot), @telegram-apps/sdk-react (mini app)

## Project Structure

```
backend/           # Express.js API server
  src/
    api/           # REST API routes & controllers
    bot/           # Telegram bot handlers
    services/      # Business logic
    database/      # Prisma client & migrations
    common/        # Shared utilities, i18n
    webhooks/      # Payment webhooks

frontend/          # React Telegram Mini App
  src/
    components/    # Reusable UI components
    pages/         # Route pages
    sections/      # Page-specific sections
    services/      # API client
    store/         # Zustand stores
    hooks/         # Custom React hooks
    utils/         # Utility functions
    types/         # TypeScript types

admin/             # Admin panel (React + Vite)
```

## CRITICAL: Pre-commit Validation

**ALWAYS run validation BEFORE committing any code changes.**

### Backend validation:
```bash
cd backend && npm run lint && npm run typecheck
```

### Frontend validation:
```bash
cd frontend && npm run lint && npx tsc --noEmit
```

### Admin validation:
```bash
cd admin && npm run lint && npx tsc --noEmit
```

**DO NOT commit or push if any of these commands fail.** Fix all errors first.

---

## Backend Development

### Path Aliases
Use path aliases instead of relative imports:
```typescript
// Good
import { prisma } from '@database/client';
import { logger } from '@common/utils/logger';
import { UserService } from '@services/user.service';

// Bad
import { prisma } from '../../../database/client';
```

Available aliases: `@/*`, `@bot/*`, `@api/*`, `@services/*`, `@common/*`, `@database/*`

### Prisma Patterns

After schema changes, always run:
```bash
cd backend && npx prisma generate
```

For migrations:
```bash
cd backend && npx prisma migrate dev --name <migration_name>
```

**Decimal handling:**
```typescript
// Prisma returns Decimal objects, convert for calculations
const balance = Number(user.balance);
// Or use Decimal.js for precision
import { Decimal } from '@prisma/client/runtime/library';
```

**Transaction pattern:**
```typescript
await prisma.$transaction(async (tx) => {
  await tx.user.update({ ... });
  await tx.transaction.create({ ... });
});
```

### Error Handling

Use consistent error responses:
```typescript
res.status(400).json({ error: 'Invalid request', code: 'INVALID_REQUEST' });
res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
```

### API Routes Structure

```typescript
// routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();
router.get('/:id', UserController.getById);
router.patch('/:id', UserController.update);

export default router;
```

---

## Frontend Development

### Component Structure

```
components/
  button/
    button.tsx       # Component implementation
    index.ts         # Re-export
    types.ts         # Props types (if complex)
```

### API Calls

Use the API service from `src/services/api.ts`:
```typescript
import { api } from 'src/services/api';

const data = await api.get<UserResponse>('/users/me');
```

### State Management (Zustand)

```typescript
// store/user-store.ts
import { create } from 'zustand';

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

### Telegram Mini App

```typescript
import { useLaunchParams, useInitData } from '@telegram-apps/sdk-react';

// Get user data
const initData = useInitData();
const user = initData?.user;

// Get launch params
const launchParams = useLaunchParams();
```

### Form Handling

Use react-hook-form with zod:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

### MUI Styling

Use `sx` prop for one-off styles:
```typescript
<Box sx={{ p: 2, display: 'flex', gap: 1 }}>
```

Use theme tokens:
```typescript
<Typography color="text.secondary" variant="body2">
```

---

## Code Style Rules

### TypeScript
- **strict mode** is enabled - respect it
- **No `any`** types unless absolutely necessary
- **No `@ts-ignore`** - fix the actual type error
- Use explicit return types for public functions
- Prefer `interface` for object types, `type` for unions/intersections

### Naming
- Files: `kebab-case.ts` or `PascalCase.tsx` for components
- Variables/functions: `camelCase`
- Types/Interfaces/Classes: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Database tables (Prisma): `snake_case` via `@@map`

### Imports
- Group imports: external -> internal -> relative
- Use path aliases for backend
- Avoid default exports (except pages/components)

---

## Testing Changes

### Run backend locally:
```bash
cd backend && npm run dev
```

### Run frontend locally:
```bash
cd frontend && npm run dev
```

### Check Prisma studio:
```bash
cd backend && npx prisma studio
```

---

## Git Workflow

1. Make code changes
2. **Run validation for ALL modified projects**
3. Fix any lint/type errors
4. Create atomic, focused commits
5. Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`

## CI Pipeline

GitHub Actions runs on every push:
- ESLint check
- TypeScript type check (`tsc --noEmit`)
- Build (`npm run build`)

**All checks must pass before merge.**

---

## Pre-push Validation

Before pushing to remote, run full build to catch all errors:

```bash
# Backend
cd backend && npm run lint:fix && npm run typecheck && npm run build

# Frontend
cd frontend && npm run lint:fix && npx tsc --noEmit && npm run build

# Admin
cd admin && npm run lint:fix && npx tsc --noEmit && npm run build
```

**Use `lint:fix` to auto-fix issues** before committing. Only push if all builds succeed.

---

## Security Rules

### Input Validation (MANDATORY)

**Every API endpoint MUST validate input with Zod:**

```typescript
// Good - always validate
import { z } from 'zod';

const CreateUserSchema = z.object({
  telegramId: z.number().positive(),
  username: z.string().min(1).max(32).optional(),
});

router.post('/users', async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }
  // Use result.data - it's typed and validated
});

// Bad - never trust raw input
router.post('/users', async (req, res) => {
  const { telegramId } = req.body; // DANGEROUS!
});
```

### No Secrets in Code

**NEVER hardcode secrets, tokens, or credentials:**

```typescript
// BAD - will be rejected
const API_KEY = "sk-1234567890abcdef";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// GOOD - use environment variables
const API_KEY = process.env.API_KEY;
const token = process.env.JWT_SECRET;
```

Check for patterns to avoid:
- API keys: `sk-`, `pk-`, `api_key`
- Tokens: `Bearer `, `token=`
- Passwords: `password=`, `secret=`
- Private keys: `-----BEGIN`

### SQL Injection Prevention

**Use Prisma for all database operations. No raw SQL without review:**

```typescript
// GOOD - Prisma handles escaping
const user = await prisma.user.findFirst({
  where: { telegramId: userInput },
});

// BAD - raw SQL with user input
await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userInput}`; // DANGEROUS!

// If raw SQL is necessary, use Prisma.sql for parameterization:
await prisma.$queryRaw(Prisma.sql`SELECT * FROM users WHERE id = ${userId}`);
```

---

## Architecture Rules

### No Circular Dependencies

Imports must follow this hierarchy (top can import from bottom, not reverse):

```
routes/controllers  →  services  →  repositories  →  database/prisma
        ↓                 ↓              ↓
      common/utils (can be imported by any layer)
```

**Forbidden patterns:**
- Service importing from controller
- Repository importing from service
- Any file importing from a file that imports it

If you need shared logic, extract it to `common/` or create an interface.

---

## Frontend Architecture

### Lazy Loading Routes (MANDATORY)

**All page routes MUST use React.lazy() for code splitting:**

```typescript
// routes/index.tsx - GOOD
import { lazy } from 'react';

const HomePage = lazy(() => import('src/pages/home'));
const ProfilePage = lazy(() => import('src/pages/profile'));
const SettingsPage = lazy(() => import('src/pages/settings'));

// Wrap with Suspense in router
<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/profile" element={<ProfilePage />} />
  </Routes>
</Suspense>

// BAD - direct imports increase bundle size
import HomePage from 'src/pages/home';
import ProfilePage from 'src/pages/profile';
```

**Exceptions:** Layout components and frequently used shared components can be imported directly.
