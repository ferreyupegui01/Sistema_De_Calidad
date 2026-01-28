// backend/routes/auditGlobalRoutes.js
import { Router } from 'express';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';
import { getGlobalLogs } from '../controllers/auditGlobalController.js';

const router = Router();

// Solo SuperAdmin debería ver esto idealmente
router.get('/', checkAuth, esAdmin, getGlobalLogs);

export default router;