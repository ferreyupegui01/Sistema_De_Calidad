import { Router } from 'express';
import { checkAuth } from '../middlewares/authMiddleware.js'; // O verifyToken, como lo tengas
import { upload } from '../libs/storage.js'; // Tu Multer

import { 
    getRecolecciones, 
    createRecoleccion, 
    verEvidenciaPMIR // <--- Importamos tu función
} from '../controllers/pmirController.js';

const router = Router();

// Rutas de Recolección
router.get('/recoleccion', checkAuth, getRecolecciones);
router.post('/recoleccion', checkAuth, upload.single('documento'), createRecoleccion);

// ==========================================
// RUTA DE EVIDENCIA (STREAMING)
// ==========================================
// Esta ruta coincide con la llamada del frontend: /pmir/evidencia/:filename
router.get('/evidencia/:nombreArchivo', checkAuth, verEvidenciaPMIR);

export default router;