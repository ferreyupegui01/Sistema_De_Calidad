import { Router } from 'express';
import { 
    getAuditorias, 
    createAuditoria, 
    manageAuditores, 
    manageAreas,
    verEvidenciaAuditoria // <--- 1. IMPORTACIÓN NUEVA
} from '../controllers/auditoriaController.js';
import { checkAuth } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js'; // <--- 2. USAMOS LA CONFIG ESTÁNDAR

const router = Router();

// --- RUTAS ---

router.get('/', checkAuth, getAuditorias);

// Middleware upload.single('evidencia') procesa el archivo antes del controlador
router.post('/', checkAuth, upload.single('evidencia'), createAuditoria);

router.post('/auditores', checkAuth, manageAuditores);
router.post('/areas', checkAuth, manageAreas);

// ==========================================
// NUEVA RUTA: VER EVIDENCIA (STREAMING)
// ==========================================
router.get('/evidencia/:nombreArchivo', checkAuth, verEvidenciaAuditoria);

export default router;