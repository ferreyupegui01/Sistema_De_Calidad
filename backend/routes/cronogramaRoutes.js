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
    crearActividadAgendada,
    verEvidenciaCronograma // <--- 1. IMPORTACIÓN NUEVA
} from '../controllers/cronogramaController.js';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js';

const router = Router();

// ==========================================
// 1. GESTIÓN DE CRONOGRAMAS (CARPETAS)
// ==========================================
router.route('/')
    .get(checkAuth, esAdmin, listarCronogramas)
    .post(checkAuth, esAdmin, crearCronograma); 

router.delete('/:id', checkAuth, esAdmin, eliminarCronograma);

// ==========================================
// 2. AGENDAR ACTIVIDADES (DESDE MÓDULOS)
// ==========================================
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

// ==========================================
// 5. NUEVA RUTA: VER EVIDENCIA (STREAMING)
// ==========================================
// Permite ver la foto/PDF sin exponer la carpeta uploads públicamente
// Uso frontend: apiFetchBlob(`/cronogramas/evidencia/${nombreArchivo}`)
router.get('/evidencia/:nombreArchivo', checkAuth, verEvidenciaCronograma);

export default router;