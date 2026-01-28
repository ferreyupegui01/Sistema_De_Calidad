import { Router } from 'express';
import { 
    registrarControlPesos, 
    listarControles, 
    obtenerDetalleControl,
    verEvidenciaPesos // <--- 1. IMPORTACIÓN NUEVA
} from '../controllers/pesosController.js';
import { checkAuth } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js'; // <--- 2. USAMOS CONFIG ESTÁNDAR

const router = Router();

// Subimos 'evidencia' usando el storage centralizado
router.post('/', checkAuth, upload.single('evidencia'), registrarControlPesos);

router.get('/', checkAuth, listarControles);
router.get('/:id', checkAuth, obtenerDetalleControl);

// ==========================================
// NUEVA RUTA: VER EVIDENCIA PESOS (STREAMING)
// ==========================================
router.get('/evidencia/:nombreArchivo', checkAuth, verEvidenciaPesos);

export default router;