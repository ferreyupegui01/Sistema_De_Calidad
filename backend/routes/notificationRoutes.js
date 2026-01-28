import { Router } from 'express';
import { checkAuth } from '../middlewares/authMiddleware.js';
import { obtenerNotificaciones, eliminarNotificacion } from '../controllers/notificationController.js';

const router = Router();

router.get('/', checkAuth, obtenerNotificaciones);
// CAMBIO: Ruta DELETE para borrar de verdad
router.delete('/:id', checkAuth, eliminarNotificacion);

export default router;