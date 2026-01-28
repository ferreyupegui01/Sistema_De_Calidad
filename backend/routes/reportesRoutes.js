import { Router } from 'express';
import { 
    crearReporte, 
    listarReportes, 
    obtenerDetalleReporte, 
    verificarReporte,
    verEvidenciaReporte // <--- 1. IMPORTACIÓN NUEVA
} from '../controllers/reportesController.js';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js';

const router = Router();

// Creación y Listado
router.post('/', checkAuth, upload.single('evidencia'), crearReporte); 
router.get('/', checkAuth, listarReportes);
router.get('/:id/detalle', checkAuth, obtenerDetalleReporte);

// Verificación (Solo Admin/Calidad)
router.put('/:id/verificar', checkAuth, esAdmin, verificarReporte);

// ==========================================
// NUEVA RUTA: VER EVIDENCIA (STREAMING)
// ==========================================
// Permite ver la foto del reporte de forma segura
// Uso Frontend: apiFetchBlob(`/reportes/evidencia/${nombreArchivo}`)
router.get('/evidencia/:nombreArchivo', checkAuth, verEvidenciaReporte);

export default router;