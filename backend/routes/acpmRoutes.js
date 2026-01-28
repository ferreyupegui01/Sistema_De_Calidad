import { Router } from 'express';
import { 
    crearACPM, 
    listarACPM, 
    obtenerACPM, 
    cerrarACPM, 
    gestionarACPM, 
    obtenerOrigenes, 
    agregarOrigen,
    verEvidenciaACPM // <--- 1. IMPORTACIÓN NUEVA
} from '../controllers/acpmController.js';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js'; // <--- 2. IMPORTACIÓN PARA SUBIR ARCHIVOS

const router = Router();

// Rutas de Orígenes (Para el desplegable)
router.get('/origenes', checkAuth, obtenerOrigenes);
router.post('/origenes', checkAuth, esAdmin, agregarOrigen);

// Gestión de ACPM
router.route('/')
    .post(checkAuth, esAdmin, crearACPM)
    .get(checkAuth, esAdmin, listarACPM);

router.get('/:id', checkAuth, esAdmin, obtenerACPM);

// --- RUTAS CON SUBIDA DE ARCHIVOS ---
// Ahora cerrar y gestionar aceptan evidencia real, necesitamos el middleware
router.put('/cerrar/:id', checkAuth, esAdmin, upload.single('evidencia'), cerrarACPM);
router.put('/gestion/:id', checkAuth, esAdmin, upload.single('evidencia'), gestionarACPM);

// ==========================================
// NUEVA RUTA: VER EVIDENCIA (STREAMING)
// ==========================================
router.get('/evidencia/:nombreArchivo', checkAuth, verEvidenciaACPM);

export default router;