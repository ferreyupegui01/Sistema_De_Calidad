import { Router } from 'express';
import { 
    registrarColaborador, 
    obtenerColaboradores, 
    cambiarEstado,
    obtenerUsuarioPorId, 
    actualizarUsuario,
    restablecerPassword,
    obtenerRoles,
    actualizarPerfilCorreo // <--- IMPORTADO
} from '../controllers/userController.js';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// 1. RUTA DE ROLES
router.get('/roles', checkAuth, esAdmin, obtenerRoles);

// 2. RUTAS GENERALES
router.route('/')
    .post(checkAuth, esAdmin, registrarColaborador)
    .get(checkAuth, esAdmin, obtenerColaboradores);

// 3. RUTAS CON ID
router.route('/:id')
    .get(checkAuth, esAdmin, obtenerUsuarioPorId)
    .put(checkAuth, esAdmin, actualizarUsuario);

// Acciones Específicas
router.put('/estado/:id', checkAuth, esAdmin, cambiarEstado);
router.put('/password/:id', checkAuth, esAdmin, restablecerPassword);

// NUEVA RUTA: Actualizar correo del perfil (Cualquier usuario autenticado)
router.put('/perfil/correo/:id', checkAuth, actualizarPerfilCorreo);

export default router;