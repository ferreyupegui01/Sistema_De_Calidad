import { Router } from 'express';
import { createEvaluacion, getEvaluaciones, getEvaluacionById, uploadCartaInvima } from '../controllers/proveedoresController.js'; // <--- Importar nueva función
import { upload } from '../libs/storage.js';
import authMiddleware from '../middlewares/authMiddleware.js'; 

const router = Router();

router.get('/', authMiddleware, getEvaluaciones);
router.get('/:id', authMiddleware, getEvaluacionById);
router.post('/', authMiddleware, upload.single('cartaInvima'), createEvaluacion);

// --- NUEVA RUTA PARA SUBIR CARTA DESPUÉS ---
router.put('/:id/carta-invima', authMiddleware, upload.single('archivo'), uploadCartaInvima);

export default router;