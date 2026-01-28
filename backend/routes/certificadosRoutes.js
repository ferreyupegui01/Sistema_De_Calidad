import { Router } from 'express';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js'; // Asegúrate de tener configurado Multer aquí
import { listarPlantillas, guardarPlantilla, registrarGeneracion, obtenerHistorial } from '../controllers/certificadosController.js';

const router = Router();

router.get('/plantillas', checkAuth, listarPlantillas);
router.post('/plantillas', checkAuth, esAdmin, guardarPlantilla);

// IMPORTANTE: upload.single('pdf') permite recibir el archivo
router.post('/generar', checkAuth, upload.single('pdf'), registrarGeneracion);

router.get('/historial', checkAuth, obtenerHistorial);

export default router;