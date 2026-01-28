import { Router } from 'express';
import { 
    getActas, 
    createActa, 
    verFotoActa // <--- 1. IMPORTACIÓN NUEVA
} from '../controllers/actasController.js';
import { checkAuth } from '../middlewares/authMiddleware.js';
// Usaremos la librería estándar para mantener consistencia, 
// o puedes dejar tu importación si 'uploadMiddleware' es lo mismo que 'libs/storage'
import { upload } from '../libs/storage.js'; 

const router = Router();

router.get('/', checkAuth, getActas);

// Permitimos subir hasta 4 fotos en el campo 'fotos'
router.post('/', checkAuth, upload.array('fotos', 4), createActa);

// ==========================================
// NUEVA RUTA: VER FOTO ACTA (STREAMING)
// ==========================================
router.get('/foto/:nombreArchivo', checkAuth, verFotoActa);

export default router;