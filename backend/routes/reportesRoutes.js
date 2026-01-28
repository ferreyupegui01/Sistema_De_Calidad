// backend/routes/reportesRoutes.js
import { Router } from 'express';
import { crearReporte, listarReportes, obtenerDetalleReporte, verificarReporte } from '../controllers/reportesController.js';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js';

const router = Router();

router.post('/', checkAuth, upload.single('evidencia'), crearReporte); 
router.get('/', checkAuth, listarReportes);
router.get('/:id/detalle', checkAuth, obtenerDetalleReporte);

// NUEVA RUTA: Solo admin puede verificar
router.put('/:id/verificar', checkAuth, esAdmin, verificarReporte);

export default router;