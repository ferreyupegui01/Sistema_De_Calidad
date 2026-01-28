import { Router } from 'express';
// Asegúrate de usar 'checkAuth' o 'verifyToken' según lo tengas en authMiddleware.js
// En tu caso parece ser 'checkAuth'.
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js'; // Tu configuración de Multer

import { 
    crearCapacitacion, 
    listarCapacitacionesAdmin, 
    listarParaKiosco,
    listarResultados, 
    cambiarEstadoResultado, 
    obtenerDetalleResultado,
    listarPreguntas, 
    agregarPregunta, 
    eliminarPregunta,
    obtenerResumenAdmin,
    obtenerUsuariosPorCurso,
    obtenerHistorialUsuario,
    streamMaterialCapacitacion // <--- IMPORTACIÓN CLAVE
} from '../controllers/capacitacionController.js';

const router = Router();

// === GESTIÓN MATERIAL (ADMIN) ===
router.post('/', checkAuth, esAdmin, upload.single('archivo'), crearCapacitacion);
router.get('/', checkAuth, esAdmin, listarCapacitacionesAdmin);

// === RUTAS PÚBLICAS (KIOSCO) ===
// Esta ruta es pública para que el Kiosco (sin login) pueda listar los cursos
router.get('/kiosco', listarParaKiosco); 

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
router.post('/preguntas', checkAuth, esAdmin, upload.single('imagen'), agregarPregunta);
router.delete('/preguntas/:id', checkAuth, esAdmin, eliminarPregunta);

// ==========================================
// RUTA DE ARCHIVOS: STREAMING SEGURO
// ==========================================
// Esta ruta coincide con la llamada del frontend: /capacitacion/material/:filename
// Nota: Puedes requerir 'checkAuth' si quieres que solo logueados vean el material,
// o dejarla pública si el Kiosco también necesita acceder a los PDFs/Videos.
router.get('/material/:nombreArchivo', streamMaterialCapacitacion);

export default router;