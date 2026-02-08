import { Request, Response } from 'express';
import { z } from 'zod';
import { paymentService, ALLOWED_AMOUNTS } from '../../services/payment/index.js';
import { webhookService } from '../../services/payment/index.js';
import type { AuthenticatedRequest } from '../middlewares/validate-telegram.middleware.js';
import { logger } from '../../common/utils/logger.util.js';

// Схема валидации для создания платежа
const createPaymentSchema = z.object({
  amount: z.number().int().positive(),
  idempotencyKey: z.string().uuid(),
  returnUrl: z.string().url().optional(),
});

// Схема для webhook
const webhookSchema = z.object({
  type: z.string(),
  event: z.string(),
  object: z.object({
    id: z.string(),
    status: z.string(),
    amount: z.object({
      value: z.string(),
      currency: z.string(),
    }),
    description: z.string().optional(),
    metadata: z
      .object({
        paymentId: z.string().optional(),
        userId: z.string().optional(),
      })
      .optional(),
    created_at: z.string(),
    captured_at: z.string().optional(),
  }),
});

export class PaymentController {
  /**
   * POST /api/payments/create
   * Создать платёж для пополнения баланса
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validation = createPaymentSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { amount, idempotencyKey, returnUrl } = validation.data;
    const user = req.user!;

    // Проверяем что YooKassa настроена
    if (!paymentService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Payment system is not configured',
      });
      return;
    }

    // Валидируем сумму
    if (!ALLOWED_AMOUNTS.includes(amount)) {
      res.status(400).json({
        success: false,
        error: `Invalid amount. Allowed amounts: ${ALLOWED_AMOUNTS.join(', ')}`,
        data: { allowedAmounts: ALLOWED_AMOUNTS },
      });
      return;
    }

    try {
      const result = await paymentService.createPayment({
        userId: user.id,
        amount,
        idempotencyKey,
        returnUrl,
      });

      res.json({
        success: true,
        data: {
          paymentId: result.payment.id,
          confirmationUrl: result.confirmationUrl,
          status: result.payment.status,
        },
      });
    } catch (error) {
      logger.error('Payment creation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create payment',
      });
    }
  }

  /**
   * GET /api/payments/:id
   * Получить статус платежа
   */
  async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const user = req.user!;

    const payment = await paymentService.getPayment(id);

    if (!payment) {
      res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
      return;
    }

    // Проверяем что платёж принадлежит пользователю
    if (payment.userId !== user.id) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
      },
    });
  }

  /**
   * GET /api/payments/amounts
   * Получить допустимые суммы пополнения
   */
  async getAmounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        amounts: ALLOWED_AMOUNTS,
        currency: 'RUB',
        isConfigured: paymentService.isConfigured(),
      },
    });
  }

  /**
   * POST /api/webhooks/yookassa
   * Обработчик webhook от YooKassa
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    // Валидация подписи (Basic Auth)
    const authHeader = req.headers.authorization;
    if (!webhookService.validateSignature(authHeader)) {
      logger.warn('Invalid webhook signature');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Валидация payload
    const validation = webhookSchema.safeParse(req.body);
    if (!validation.success) {
      logger.warn('Invalid webhook payload:', validation.error);
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    try {
      const result = await webhookService.handleWebhook(validation.data);

      if (result.success) {
        res.json({ status: 'ok' });
      } else {
        // Возвращаем 200 чтобы YooKassa не повторяла запрос
        res.json({ status: 'error', message: result.message });
      }
    } catch (error) {
      logger.error('Webhook processing error:', error);
      // Возвращаем 500 чтобы YooKassa повторила запрос
      res.status(500).json({ error: 'Processing failed' });
    }
  }
}

export const paymentController = new PaymentController();
