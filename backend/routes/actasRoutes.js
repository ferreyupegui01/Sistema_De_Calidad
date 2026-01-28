import { Router } from 'express';
import { getActas, createActa } from '../controllers/actasController.js';
import { checkAuth } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js'; // Tu middleware de multer existente

const router = Router();

router.get('/', checkAuth, getActas);
// Permitimos subir hasta 4 fotos en el campo 'fotos'
router.post('/', checkAuth, upload.array('fotos', 4), createActa);

export default router;