import { Router } from 'express';
import userRoutes from './user.routes.js';
import templateRoutes from './template.routes.js';
import modelRoutes from './model.routes.js';
import generationRoutes from './generation.routes.js';
import promocodeRoutes from './promocode.routes.js';
import paymentRoutes from './payment.routes.js';
import webhookRoutes from './webhook.routes.js';
import transactionRoutes from './transaction.routes.js';
import adminRoutes from '../admin/routes/index.js';
import { configService } from '../../common/config/config.service.js';

const router = Router();

router.use('/user', userRoutes);
router.use('/templates', templateRoutes);
router.use('/models', modelRoutes);
router.use('/generation', generationRoutes);
router.use('/promocode', promocodeRoutes);
router.use('/payments', paymentRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/transactions', transactionRoutes);
router.use('/admin', adminRoutes);

// Dev routes - only in development
if (configService.isDevelopment) {
  import('./dev.routes.js').then((devRoutes) => {
    router.use('/dev', devRoutes.default);
  });
}

export default router;
