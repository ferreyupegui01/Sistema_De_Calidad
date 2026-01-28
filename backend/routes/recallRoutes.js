import { Router } from 'express';
import { getSalidas, createSalida } from '../controllers/recallController.js';
import { checkAuth } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js'; // Ruta corregida (plural)

const router = Router();

// Rutas protegidas
router.get('/salidas', checkAuth, getSalidas);

// Usamos upload.single('documento') para procesar el FormData que envía el frontend.
// Si quitamos el upload, req.body llegaría vacío.
router.post('/salidas', checkAuth, upload.single('documento'), createSalida);

export default router;