import { YooCheckout, ICreatePayment } from '@a2seven/yoo-checkout';
import { Payment, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma/client.js';
import { configService } from '../../common/config/config.service.js';
import { logger } from '../../common/utils/logger.util.js';
import { userService } from '../user.service.js';

// Минимальная сумма платежа (ограничение YooKassa)
const MIN_PAYMENT_AMOUNT = 10;
const MAX_PAYMENT_AMOUNT = 100000;

// Допустимые суммы пополнения
export const ALLOWED_AMOUNTS = [100, 300, 500, 1000];

interface CreatePaymentParams {
  userId: string;
  amount: number;
  idempotencyKey: string;
  description?: string;
  returnUrl?: string;
}

interface PaymentResult {
  payment: Payment;
  confirmationUrl: string | null;
}

class PaymentService {
  private checkout: YooCheckout | null = null;

  private getCheckout(): YooCheckout {
    if (!this.checkout) {
      const shopId = configService.yookassa.shopId;
      const secretKey = configService.yookassa.secretKey;

      if (!shopId || !secretKey) {
        throw new Error('YooKassa credentials not configured');
      }

      this.checkout = new YooCheckout({
        shopId,
        secretKey,
      });
    }

    return this.checkout;
  }

  /**
   * Создать платёж
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const { userId, amount, idempotencyKey, description, returnUrl } = params;

    // Валидация суммы
    if (amount < MIN_PAYMENT_AMOUNT || amount > MAX_PAYMENT_AMOUNT) {
      throw new Error(`Amount must be between ${MIN_PAYMENT_AMOUNT} and ${MAX_PAYMENT_AMOUNT}`);
    }

    // Проверка idempotency - возврат существующего платежа
    const existing = await prisma.payment.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      logger.info(`Payment already exists for idempotency key: ${idempotencyKey}`);
      return {
        payment: existing,
        confirmationUrl: existing.confirmationUrl,
      };
    }

    // Проверка пользователя
    const user = await userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Создаём запись платежа в БД
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: new Prisma.Decimal(amount),
        idempotencyKey,
        description: description || `Пополнение баланса на ${amount} руб.`,
        returnUrl: returnUrl || configService.yookassa.returnUrl,
        status: PaymentStatus.CREATED,
      },
    });

    try {
      // Создаём платёж в YooKassa
      const checkout = this.getCheckout();

      const createPayload: ICreatePayment = {
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB',
        },
        confirmation: {
          type: 'redirect',
          return_url: payment.returnUrl || configService.yookassa.returnUrl || '',
        },
        capture: true,
        description: payment.description || undefined,
        metadata: {
          paymentId: payment.id,
          userId,
        },
      };

      const yooPayment = await checkout.createPayment(createPayload, idempotencyKey);

      // Обновляем запись с данными от YooKassa
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerPaymentId: yooPayment.id,
          status: PaymentStatus.PENDING,
          confirmationUrl: yooPayment.confirmation?.confirmation_url || null,
        },
      });

      logger.info(`Payment created: ${payment.id}, YooKassa ID: ${yooPayment.id}`);

      return {
        payment: updatedPayment,
        confirmationUrl: yooPayment.confirmation?.confirmation_url || null,
      };
    } catch (error) {
      // Помечаем платёж как неудачный
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CANCELLED,
          webhookData: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      });

      logger.error('Failed to create YooKassa payment:', error);
      throw error;
    }
  }

  /**
   * Получить платёж по ID
   */
  async getPayment(paymentId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { id: paymentId },
    });
  }

  /**
   * Получить платёж по ID провайдера
   */
  async getPaymentByProviderId(providerPaymentId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { providerPaymentId },
    });
  }

  /**
   * Получить платежи пользователя
   */
  async getUserPayments(
    userId: string,
    options: { page?: number; limit?: number; status?: PaymentStatus } = {}
  ): Promise<{ payments: Payment[]; total: number }> {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = { userId };
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  }

  /**
   * Синхронизировать статус платежа с YooKassa
   */
  async syncPaymentStatus(paymentId: string): Promise<Payment | null> {
    const payment = await this.getPayment(paymentId);
    if (!payment || !payment.providerPaymentId) {
      return null;
    }

    try {
      const checkout = this.getCheckout();
      const yooPayment = await checkout.getPayment(payment.providerPaymentId);

      const newStatus = this.mapYooKassaStatus(yooPayment.status);

      if (payment.status !== newStatus) {
        return prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: newStatus,
            completedAt: newStatus === PaymentStatus.SUCCEEDED ? new Date() : undefined,
          },
        });
      }

      return payment;
    } catch (error) {
      logger.error(`Failed to sync payment status: ${paymentId}`, error);
      return payment;
    }
  }

  /**
   * Маппинг статусов YooKassa -> наши статусы
   */
  private mapYooKassaStatus(yooStatus: string): PaymentStatus {
    switch (yooStatus) {
      case 'pending':
        return PaymentStatus.PENDING;
      case 'waiting_for_capture':
      case 'succeeded':
        return PaymentStatus.SUCCEEDED;
      case 'canceled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Проверка доступности YooKassa
   */
  isConfigured(): boolean {
    return !!(configService.yookassa.shopId && configService.yookassa.secretKey);
  }
}

export const paymentService = new PaymentService();
