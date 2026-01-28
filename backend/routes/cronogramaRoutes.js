import { Router } from 'express';
import { 
    crearCronograma, 
    listarCronogramas, 
    eliminarCronograma,
    crearActividad, 
    obtenerActividades, 
    editarActividad, 
    eliminarActividad, 
    cambiarEstadoActividad, 
    agregarSeguimiento,
    obtenerTodasActividades,
    crearActividadAgendada 
} from '../controllers/cronogramaController.js';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js';

const router = Router();

// ==========================================
// 1. GESTIÓN DE CRONOGRAMAS (CARPETAS)
// ==========================================
router.route('/')
    .get(checkAuth, esAdmin, listarCronogramas)
    // CORRECCIÓN: Restauramos la creación de cronogramas en la raíz
    .post(checkAuth, esAdmin, crearCronograma); 

router.delete('/:id', checkAuth, esAdmin, eliminarCronograma);

// ==========================================
// 2. AGENDAR ACTIVIDADES (DESDE MÓDULOS)
// ==========================================
// NUEVA RUTA ESPECÍFICA para evitar el conflicto con crearCronograma
router.post('/agendar', checkAuth, esAdmin, crearActividadAgendada);

// ==========================================
// 3. GESTIÓN DE ACTIVIDADES (CRUD)
// ==========================================
router.get('/actividades/todas', checkAuth, esAdmin, obtenerTodasActividades); 

router.post('/actividad', checkAuth, esAdmin, crearActividad);
router.get('/:idCronograma/actividades', checkAuth, esAdmin, obtenerActividades);
router.put('/actividad/:id', checkAuth, esAdmin, editarActividad);
router.delete('/actividad/:id', checkAuth, esAdmin, eliminarActividad);

// ==========================================
// 4. GESTIÓN DE ESTADOS Y SEGUIMIENTO
// ==========================================
router.put('/actividad/estado/:id', checkAuth, esAdmin, cambiarEstadoActividad);
router.put('/actividad/seguimiento/:id', checkAuth, esAdmin, upload.single('evidencia'), agregarSeguimiento);

export default router;