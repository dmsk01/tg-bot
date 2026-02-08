import { Router, Request, Response } from 'express';
import { paymentController } from '../controllers/payment.controller.js';

const router = Router();

// Webhook от YooKassa - не требует Telegram аутентификации
// Использует собственную валидацию подписи (Basic Auth)
router.post('/yookassa', (req: Request, res: Response) => {
  // Передаём как AuthenticatedRequest, но user будет undefined
  // Контроллер не использует user для webhook
  paymentController.handleWebhook(req as any, res);
});

export default router;
