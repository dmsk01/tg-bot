import { Router } from 'express';
import userRoutes from './user.routes.js';
import templateRoutes from './template.routes.js';
import modelRoutes from './model.routes.js';
import generationRoutes from './generation.routes.js';

const router = Router();

router.use('/user', userRoutes);
router.use('/templates', templateRoutes);
router.use('/models', modelRoutes);
router.use('/generation', generationRoutes);

export default router;
