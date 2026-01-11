import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import {
  validateTelegramInitData,
  authenticateUser,
} from '../middlewares/validate-telegram.middleware.js';

const router = Router();

// All routes require Telegram authentication
router.use(validateTelegramInitData);
router.use(authenticateUser);

router.get('/me', (req, res) => userController.getMe(req, res));
router.get('/balance', (req, res) => userController.getBalance(req, res));
router.get('/settings', (req, res) => userController.getSettings(req, res));
router.patch('/settings', (req, res) => userController.updateSettings(req, res));
router.patch('/language', (req, res) => userController.updateLanguage(req, res));
router.post('/age-confirm', (req, res) => userController.confirmAge(req, res));

export default router;
