import { Router } from 'express';
import { 
    obtenerContenido, 
    crearCarpeta, 
    subirArchivoDrive, 
    eliminarArchivo, 
    eliminarCarpeta, 
    descargarArchivo,
    verArchivo // <--- 1. IMPORTACIÓN NUEVA
} from '../controllers/driveController.js';
import { checkAuth } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js';

const router = Router();

// === NAVEGACIÓN Y CARPETAS ===
router.get('/contenido/:idCarpeta', checkAuth, obtenerContenido);
router.post('/carpeta', checkAuth, crearCarpeta);
router.delete('/carpeta/:id', checkAuth, eliminarCarpeta);

// === GESTIÓN DE ARCHIVOS ===
router.post('/archivo', checkAuth, upload.single('archivo'), subirArchivoDrive);
router.delete('/archivo/:id', checkAuth, eliminarArchivo);
router.get('/descargar/:id', checkAuth, descargarArchivo);

// ==========================================
// NUEVA RUTA: VISUALIZACIÓN (STREAMING)
// ==========================================
// Permite ver PDF/Imágenes en el navegador sin exponer la carpeta real
// Uso Frontend: apiFetchBlob(`/drive/ver/${id}`)
router.get('/ver/:id', checkAuth, verArchivo);

export default router;