import { Router } from 'express';
import { 
    createEvaluacion, 
    getEvaluaciones, 
    getEvaluacionById, 
    uploadCartaInvima,
    verCartaInvima // <--- 1. IMPORTACIÓN NUEVA
} from '../controllers/proveedoresController.js';
import { upload } from '../libs/storage.js';
import authMiddleware from '../middlewares/authMiddleware.js'; 

const router = Router();

// Rutas base
router.get('/', authMiddleware, getEvaluaciones);
router.get('/:id', authMiddleware, getEvaluacionById);

// Nota: Aunque uses upload.single aquí, recuerda que el controlador createEvaluacion 
// que hicimos está diseñado para guardar solo datos. El archivo se sube en el PUT de abajo.
router.post('/', authMiddleware, upload.single('cartaInvima'), createEvaluacion);

// --- RUTA PARA SUBIR CARTA DESPUÉS ---
router.put('/:id/carta-invima', authMiddleware, upload.single('archivo'), uploadCartaInvima);

// ==========================================
// NUEVA RUTA: VER CARTA INVIMA (STREAMING)
// ==========================================
// Permite ver el PDF sin exponer la carpeta uploads públicamente
router.get('/carta/:nombreArchivo', authMiddleware, verCartaInvima);

export default router;