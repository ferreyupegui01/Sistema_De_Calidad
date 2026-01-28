import { Router } from 'express';
import { 
    crearACPM, 
    listarACPM, 
    obtenerACPM, // <--- Importamos esto
    cerrarACPM, 
    gestionarACPM, 
    obtenerOrigenes, 
    agregarOrigen    
} from '../controllers/acpmController.js';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas de Orígenes (Para el desplegable)
router.get('/origenes', checkAuth, obtenerOrigenes);
router.post('/origenes', checkAuth, esAdmin, agregarOrigen);

// Gestión de ACPM
router.route('/')
    .post(checkAuth, esAdmin, crearACPM)
    .get(checkAuth, esAdmin, listarACPM);

router.get('/:id', checkAuth, esAdmin, obtenerACPM); // <--- NUEVA RUTA PARA VER DETALLE

router.put('/cerrar/:id', checkAuth, esAdmin, cerrarACPM);
router.put('/gestion/:id', checkAuth, esAdmin, gestionarACPM);

export default router;