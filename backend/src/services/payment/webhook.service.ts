import { PaymentStatus, TransactionType, TransactionStatus, Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../../database/prisma/client.js';
import { configService } from '../../common/config/config.service.js';
import { logger } from '../../common/utils/logger.util.js';

// Type for Prisma transaction client
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

interface YooKassaWebhookPayload {
  type: string;
  event: string;
  object: {
    id: string;
    status: string;
    amount: {
      value: string;
      currency: string;
    };
    description?: string;
    metadata?: {
      paymentId?: string;
      userId?: string;
    };
    created_at: string;
    captured_at?: string;
  };
}

interface WebhookResult {
  success: boolean;
  message: string;
  paymentId?: string;
}

class WebhookService {
  /**
   * Валидация подписи webhook от YooKassa
   * YooKassa использует HTTP Basic Auth для подтверждения подлинности
   */
  validateSignature(authHeader: string | undefined): boolean {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false;
    }

    const secretKey = configService.yookassa.secretKey;
    if (!secretKey) {
      logger.error('YooKassa secret key not configured');
      return false;
    }

    // YooKassa отправляет shopId:secretKey в Basic Auth
    const base64Credentials = authHeader.substring(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [shopId, key] = credentials.split(':');

    return shopId === configService.yookassa.shopId && key === secretKey;
  }

  /**
   * Обработка webhook уведомления
   */
  async handleWebhook(payload: YooKassaWebhookPayload): Promise<WebhookResult> {
    const { event, object } = payload;

    logger.info(`Webhook received: ${event}, payment: ${object.id}`);

    // Поддерживаемые события
    if (event !== 'payment.succeeded' && event !== 'payment.canceled') {
      logger.info(`Ignoring webhook event: ${event}`);
      return { success: true, message: `Event ${event} ignored` };
    }

    // Находим платёж по ID провайдера
    const payment = await prisma.payment.findUnique({
      where: { providerPaymentId: object.id },
    });

    if (!payment) {
      logger.warn(`Payment not found for provider ID: ${object.id}`);
      return { success: false, message: 'Payment not found' };
    }

    // Проверка идемпотентности - уже обработан?
    if (payment.status === PaymentStatus.SUCCEEDED || payment.status === PaymentStatus.REFUNDED) {
      logger.info(`Payment ${payment.id} already processed`);
      return { success: true, message: 'Already processed', paymentId: payment.id };
    }

    // Сохраняем данные webhook
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        webhookData: payload as unknown as Prisma.JsonObject,
      },
    });

    if (event === 'payment.succeeded') {
      return this.handlePaymentSucceeded(payment.id, object);
    } else if (event === 'payment.canceled') {
      return this.handlePaymentCanceled(payment.id, object);
    }

    return { success: true, message: 'Processed' };
  }

  /**
   * Обработка успешного платежа
   */
  private async handlePaymentSucceeded(
    paymentId: string,
    webhookData: YooKassaWebhookPayload['object']
  ): Promise<WebhookResult> {
    const amount = parseFloat(webhookData.amount.value);

    try {
      // Транзакция: обновляем платёж, баланс пользователя и создаём запись транзакции
      await prisma.$transaction(async (tx: TransactionClient) => {
        // 1. Получаем платёж с блокировкой
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
        });

        if (!payment) {
          throw new Error('Payment not found');
        }

        // 2. Проверяем что ещё не обработан
        if (payment.status === PaymentStatus.SUCCEEDED) {
          throw new Error('Already processed');
        }

        // 3. Получаем пользователя с блокировкой
        const user = await tx.$queryRaw<{ id: string; balance: Prisma.Decimal }[]>`
          SELECT id, balance FROM users WHERE id = ${payment.userId} FOR UPDATE
        `;

        if (!user || user.length === 0) {
          throw new Error('User not found');
        }

        const currentBalance = Number(user[0].balance);
        const newBalance = currentBalance + amount;

        // 4. Обновляем баланс пользователя
        await tx.user.update({
          where: { id: payment.userId },
          data: { balance: newBalance },
        });

        // 5. Создаём транзакцию
        const transaction = await tx.transaction.create({
          data: {
            userId: payment.userId,
            type: TransactionType.DEPOSIT,
            amount: new Prisma.Decimal(amount),
            balanceBefore: new Prisma.Decimal(currentBalance),
            balanceAfter: new Prisma.Decimal(newBalance),
            status: TransactionStatus.COMPLETED,
            paymentId: payment.id,
            paymentMethod: 'yookassa',
            description: payment.description || `Пополнение баланса на ${amount} руб.`,
            completedAt: new Date(),
          },
        });

        // 6. Обновляем статус платежа
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.SUCCEEDED,
            completedAt: new Date(),
          },
        });

        logger.info(
          `Payment ${paymentId} completed: +${amount} RUB for user ${payment.userId}, ` +
            `transaction ${transaction.id}`
        );
      });

      return { success: true, message: 'Payment processed', paymentId };
    } catch (error) {
      if (error instanceof Error && error.message === 'Already processed') {
        return { success: true, message: 'Already processed', paymentId };
      }

      logger.error(`Failed to process payment ${paymentId}:`, error);
      return { success: false, message: 'Processing failed' };
    }
  }

  /**
   * Обработка отменённого платежа
   */
  private async handlePaymentCanceled(
    paymentId: string,
    _webhookData: YooKassaWebhookPayload['object']
  ): Promise<WebhookResult> {
    try {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.CANCELLED,
        },
      });

      logger.info(`Payment ${paymentId} cancelled`);
      return { success: true, message: 'Payment cancelled', paymentId };
    } catch (error) {
      logger.error(`Failed to cancel payment ${paymentId}:`, error);
      return { success: false, message: 'Cancellation failed' };
    }
  }
}

export const webhookService = new WebhookService();
