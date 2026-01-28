import { Router } from 'express';
import { upload } from '../libs/storage.js'; // Usamos la configuración estándar
import { checkAuth } from '../middlewares/authMiddleware.js';
import { 
    registrarVerificacionAgua,
    obtenerHistorialAgua,
    registrarEvaluacionKiosco,
    obtenerPreguntasKiosco,
    verFotoAgua // <--- 1. Importamos la función blindada
} from '../controllers/specializedController.js';

// Importamos la función del kiosco desde capacitación
import { listarParaKiosco } from '../controllers/capacitacionController.js'; 

const router = Router();

// ====================================================================
// RUTAS AGUA POTABLE
// ====================================================================

// 1. Registrar verificación (Sube la foto)
router.post('/agua/verificar', checkAuth, upload.single('foto'), registrarVerificacionAgua);

// 2. Obtener historial
router.get('/agua/historial', checkAuth, obtenerHistorialAgua);

// 3. RUTA CRÍTICA DE STREAMING (Ver Evidencia)
// Coincide con la llamada del frontend: /agua/evidencia/nombre_archivo.jpg
router.get('/agua/evidencia/:nombreArchivo', checkAuth, verFotoAgua);

// ====================================================================
// RUTAS KIOSCO CAPACITACIÓN (Públicas - Sin checkAuth)
// ====================================================================

// Registrar evaluación
router.post('/kiosco/evaluar', registrarEvaluacionKiosco);

// Obtener preguntas
router.get('/kiosco/preguntas/:idEvaluacion', obtenerPreguntasKiosco);

// Listar capacitaciones disponibles
router.get('/kiosco/capacitaciones', listarParaKiosco); 

export default router;