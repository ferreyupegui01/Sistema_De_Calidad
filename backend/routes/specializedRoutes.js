// backend/routes/specializedRoutes.js
import { Router } from 'express';
import { upload } from '../libs/storage.js';
import { checkAuth } from '../middlewares/authMiddleware.js';
import { 
    registrarVerificacionAgua,
    obtenerHistorialAgua,
    registrarEvaluacionKiosco,
    obtenerPreguntasKiosco 
} from '../controllers/specializedController.js';

// --- IMPORTANTE: Traemos la función del otro controlador ---
import { listarParaKiosco } from '../controllers/capacitacionController.js'; 

const router = Router();

// ====================================================================
// RUTAS AGUA POTABLE
// ====================================================================
router.post('/agua/verificar', checkAuth, upload.single('foto'), registrarVerificacionAgua);
router.get('/agua/historial', checkAuth, obtenerHistorialAgua);

// ====================================================================
// RUTAS KIOSCO CAPACITACIÓN (Públicas - Sin checkAuth)
// ====================================================================
router.post('/kiosco/evaluar', registrarEvaluacionKiosco);
router.get('/kiosco/preguntas/:idEvaluacion', obtenerPreguntasKiosco);

// ESTA ES LA RUTA QUE FALTABA PARA QUE APAREZCAN EN EL KIOSCO:
router.get('/kiosco/capacitaciones', listarParaKiosco); 

export default router;