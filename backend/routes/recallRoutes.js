import { Router } from 'express';
import { 
    getSalidas, 
    createSalida,
    verDocumentoSalida // <--- 1. IMPORTACIÓN NUEVA
} from '../controllers/recallController.js';
import { checkAuth } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js'; // <--- 2. USAMOS CONFIG ESTÁNDAR

const router = Router();

// Rutas protegidas
router.get('/salidas', checkAuth, getSalidas);

// Crear Salida con documento
router.post('/salidas', checkAuth, upload.single('documento'), createSalida);

// ==========================================
// NUEVA RUTA: VER DOCUMENTO SALIDA (STREAMING)
// ==========================================
router.get('/documento/:nombreArchivo', checkAuth, verDocumentoSalida);

export default router;