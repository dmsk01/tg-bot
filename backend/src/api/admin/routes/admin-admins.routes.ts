import { Router } from 'express';
import { adminUsersController } from '../controllers/admin-users.controller.js';
import { authenticateAdmin } from '../middlewares/admin-auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticateAdmin);
router.use(requirePermission('manage_admins'));

router.get('/', (req, res) => adminUsersController.getAdmins(req, res));
router.post('/', (req, res) => adminUsersController.createAdmin(req, res));
router.patch('/:id', (req, res) => adminUsersController.updateAdmin(req, res));
router.delete('/:id', (req, res) => adminUsersController.deleteAdmin(req, res));

export default router;
