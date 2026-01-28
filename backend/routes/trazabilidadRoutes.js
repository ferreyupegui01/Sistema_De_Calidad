import { Router } from 'express';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js';
import { listarFichas, subirFicha, eliminarFicha } from '../controllers/trazabilidadController.js';

const router = Router();

// Rutas Públicas (para colaboradores autenticados)
router.get('/fichas', checkAuth, listarFichas);

// Rutas Administrativas (Solo Admin Calidad / SuperAdmin)
router.post('/fichas', checkAuth, esAdmin, upload.single('archivo'), subirFicha);
router.delete('/fichas/:id', checkAuth, esAdmin, eliminarFicha);

export default router;