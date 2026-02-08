import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import {
  validateTelegramInitData,
  authenticateUser,
} from '../middlewares/validate-telegram.middleware.js';

const router = Router();

// Все маршруты требуют аутентификации Telegram
router.use(validateTelegramInitData);
router.use(authenticateUser);

router.get('/amounts', (req, res) => paymentController.getAmounts(req, res));
router.post('/create', (req, res) => paymentController.create(req, res));
router.get('/:id', (req, res) => paymentController.getStatus(req, res));

export default router;
