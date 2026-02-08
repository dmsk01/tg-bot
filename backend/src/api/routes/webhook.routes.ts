import { Router, Request, Response } from 'express';
import { paymentController } from '../controllers/payment.controller.js';

const router = Router();

// Webhook от YooKassa - не требует Telegram аутентификации
// Использует собственную валидацию подписи (Basic Auth)
router.post('/yookassa', (req: Request, res: Response) => {
  paymentController.handleWebhook(req, res);
});

export default router;
