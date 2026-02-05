import { Router } from 'express';
import { promocodeController } from '../controllers/promocode.controller.js';
import { authenticateAdmin } from '../middlewares/admin-auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticateAdmin);

// Read operations - view_data permission
router.get('/', requirePermission('view_data'), (req, res) => promocodeController.getPromocodes(req, res));
router.get('/:id', requirePermission('view_data'), (req, res) => promocodeController.getPromocode(req, res));
router.get('/:id/usages', requirePermission('view_data'), (req, res) => promocodeController.getPromocodeUsages(req, res));

// Write operations - create_promocodes permission
router.post('/', requirePermission('create_promocodes'), (req, res) => promocodeController.createPromocode(req, res));
router.post('/generate', requirePermission('create_promocodes'), (req, res) => promocodeController.generateBatch(req, res));
router.post('/validate', requirePermission('view_data'), (req, res) => promocodeController.validateCode(req, res));
router.patch('/:id', requirePermission('create_promocodes'), (req, res) => promocodeController.updatePromocode(req, res));
router.post('/:id/revoke', requirePermission('create_promocodes'), (req, res) => promocodeController.revokePromocode(req, res));
router.delete('/:id', requirePermission('create_promocodes'), (req, res) => promocodeController.deletePromocode(req, res));

export default router;
