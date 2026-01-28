import { Router } from 'express';
import { 
    // Categorías
    crearCategoria, listarCategorias,
    
    // Activos
    crearActivo, listarActivos, actualizarActivo, cambiarEstadoActivo,
    
    // Formularios
    crearFormularioCompleto, listarFormularios, actualizarFormulario, 
    eliminarFormulario, toggleVisibilidad,
    
    // Preguntas
    obtenerPreguntas, agregarPreguntaIndividual, borrarPreguntaIndividual,
    
    // Asignación
    asignarFormulario, obtenerFormsDeActivo,

    // Tarjetas Dinámicas
    listarTarjetas,
    crearTarjeta,
    eliminarTarjeta
} from '../controllers/coreController.js';

import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// ==========================================
// RUTAS DE CATEGORÍAS
// ==========================================
router.post('/categorias', checkAuth, esAdmin, crearCategoria);
router.get('/categorias', checkAuth, listarCategorias); 

// ==========================================
// RUTAS DE ACTIVOS
// ==========================================
router.route('/activos')
    .post(checkAuth, esAdmin, crearActivo)
    .get(checkAuth, listarActivos);

router.route('/activos/:id')
    .put(checkAuth, esAdmin, actualizarActivo); 

router.put('/activos/:id/estado', checkAuth, esAdmin, cambiarEstadoActivo); 

// ==========================================
// RUTAS DE FORMULARIOS (GESTOR)
// ==========================================
router.route('/formularios')
    .get(checkAuth, listarFormularios)        // <--- CAMBIO IMPORTANTE: Quitamos 'esAdmin'
    .post(checkAuth, esAdmin, crearFormularioCompleto); 

router.route('/formularios/:id')
    .put(checkAuth, esAdmin, actualizarFormulario)   
    .delete(checkAuth, esAdmin, eliminarFormulario); 

router.put('/formularios/:id/visibilidad', checkAuth, esAdmin, toggleVisibilidad);

// ==========================================
// RUTAS DE PREGUNTAS
// ==========================================
router.get('/formularios/:id/preguntas', checkAuth, obtenerPreguntas);
router.post('/formularios/pregunta', checkAuth, esAdmin, agregarPreguntaIndividual);
router.delete('/formularios/pregunta/:id', checkAuth, esAdmin, borrarPreguntaIndividual);

// ==========================================
// RUTAS DE ASIGNACIÓN
// ==========================================
router.post('/asignar', checkAuth, esAdmin, asignarFormulario);
router.get('/asignar/:idActivo', checkAuth, obtenerFormsDeActivo); 

// ==========================================
// RUTAS DE TARJETAS (CARPETAS DINÁMICAS)
// ==========================================
router.get('/tarjetas/:modulo', checkAuth, listarTarjetas);
router.post('/tarjetas', checkAuth, crearTarjeta); // Permitimos a AdminCalidad crear
router.delete('/tarjetas/:id', checkAuth, eliminarTarjeta);

export default router;