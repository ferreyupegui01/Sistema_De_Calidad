import { Router } from 'express';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js';
import { 
    crearCapacitacion, 
    listarCapacitacionesAdmin, 
    listarResultados, 
    cambiarEstadoResultado, 
    obtenerDetalleResultado,
    listarPreguntas, 
    agregarPregunta, 
    eliminarPregunta,
    obtenerResumenAdmin,
    obtenerUsuariosPorCurso,
    obtenerHistorialUsuario
} from '../controllers/capacitacionController.js';

const router = Router();

// === GESTIÓN MATERIAL ===
router.post('/', checkAuth, esAdmin, upload.single('archivo'), crearCapacitacion);
router.get('/', checkAuth, esAdmin, listarCapacitacionesAdmin);

// === REPORTES Y RESULTADOS ===
router.get('/admin/resumen', checkAuth, esAdmin, obtenerResumenAdmin);
router.get('/admin/usuarios/:idEvaluacion', checkAuth, esAdmin, obtenerUsuariosPorCurso);
router.get('/admin/historial/:idEvaluacion', checkAuth, esAdmin, obtenerHistorialUsuario);

// === GESTIÓN RESULTADOS INDIVIDUALES ===
router.get('/resultados', checkAuth, esAdmin, listarResultados);
router.get('/resultados/:idResultado', checkAuth, esAdmin, obtenerDetalleResultado);
router.put('/resultados/:id', checkAuth, esAdmin, cambiarEstadoResultado);

// === EDITOR DE PREGUNTAS ===
router.get('/preguntas/:idEvaluacion', checkAuth, esAdmin, listarPreguntas);

// [MODIFICADO] Ahora acepta archivo 'imagen'
router.post('/preguntas', checkAuth, esAdmin, upload.single('imagen'), agregarPregunta);

router.delete('/preguntas/:id', checkAuth, esAdmin, eliminarPregunta);

export default router;