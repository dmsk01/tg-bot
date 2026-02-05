import { Router } from 'express';
import userRoutes from './user.routes.js';
import templateRoutes from './template.routes.js';
import modelRoutes from './model.routes.js';
import generationRoutes from './generation.routes.js';
import promocodeRoutes from './promocode.routes.js';
import adminRoutes from '../admin/routes/index.js';

const router = Router();

router.use('/user', userRoutes);
router.use('/templates', templateRoutes);
router.use('/models', modelRoutes);
router.use('/generation', generationRoutes);
router.use('/promocode', promocodeRoutes);
router.use('/admin', adminRoutes);

export default router;
