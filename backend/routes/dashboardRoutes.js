// backend/routes/dashboardRoutes.js
import { Router } from 'express';
import { obtenerResumen } from '../controllers/dashboardController.js';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// GET /api/dashboard/resumen - Protegido solo para Admins
router.get('/resumen', checkAuth, esAdmin, obtenerResumen);

export default router;