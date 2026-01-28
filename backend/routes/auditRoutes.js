// backend/routes/auditRoutes.js
import { Router } from 'express';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';
import { getAuditoriaReport } from '../controllers/auditController.js';

const router = Router();

// Solo el SuperAdmin debería ver esto idealmente, pero usamos esAdmin por compatibilidad de tu middleware
// En el frontend ocultaremos el botón.
router.get('/', checkAuth, esAdmin, getAuditoriaReport);

export default router;