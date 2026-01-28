import { Router } from 'express';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js'; 
import { 
    listarPlantillas, 
    guardarPlantilla, 
    registrarGeneracion, 
    obtenerHistorial,
    verCertificadoPDF // <--- Importamos la función segura
} from '../controllers/certificadosController.js';

const router = Router();

// === GESTIÓN DE PLANTILLAS ===
router.get('/plantillas', checkAuth, listarPlantillas);
router.post('/plantillas', checkAuth, esAdmin, guardarPlantilla);

// === GENERACIÓN Y REGISTRO ===
// Recibe el PDF generado desde el frontend
router.post('/generar', checkAuth, upload.single('pdf'), registrarGeneracion);

// === HISTORIAL Y TRAZABILIDAD ===
router.get('/historial', checkAuth, obtenerHistorial);

// === VISUALIZACIÓN DE DOCUMENTOS (STREAMING) ===
// Esta ruta debe coincidir con la llamada del frontend: /certificados/pdf/:filename
// Nota: En el frontend pusiste `/certificados/pdf/${filename}`, así que aquí debe ser 'pdf'
router.get('/pdf/:nombreArchivo', checkAuth, verCertificadoPDF);

export default router;