import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import {
  validateTelegramInitData,
  authenticateUser,
} from '../middlewares/validate-telegram.middleware.js';

const router = Router();

// SSE endpoint for language sync - needs to handle initData from query param
router.get('/language-events', (req, res, next) => {
  // Support initData via query param for SSE (EventSource doesn't support headers)
  if (req.query.initData && !req.headers['x-telegram-init-data']) {
    req.headers['x-telegram-init-data'] = req.query.initData as string;
  }
  next();
}, validateTelegramInitData, authenticateUser, (req, res) => {
  userController.subscribeToLanguageEvents(req, res);
});

// All other routes require Telegram authentication via headers
router.use(validateTelegramInitData);
router.use(authenticateUser);

router.get('/me', (req, res) => userController.getMe(req, res));
router.get('/balance', (req, res) => userController.getBalance(req, res));
router.get('/settings', (req, res) => userController.getSettings(req, res));
router.patch('/settings', (req, res) => userController.updateSettings(req, res));
router.patch('/language', (req, res) => userController.updateLanguage(req, res));
router.post('/age-confirm', (req, res) => userController.confirmAge(req, res));

export default router;
