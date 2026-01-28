import { Router } from 'express';
import { checkAuth, esAdmin } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js';
import { 
    listarFichas, 
    subirFicha, 
    eliminarFicha, 
    verFichaTecnica // <--- Importamos la nueva función
} from '../controllers/trazabilidadController.js';

const router = Router();

// Rutas Fichas Técnicas
router.get('/fichas', checkAuth, listarFichas);
router.post('/fichas', checkAuth, esAdmin, upload.single('archivo'), subirFicha);
router.delete('/fichas/:id', checkAuth, esAdmin, eliminarFicha);

// ==========================================
// RUTA DE STREAMING (COINCIDE CON FRONTEND)
// ==========================================
// Frontend llama a: /trazabilidad/ficha/${filename}
router.get('/ficha/:nombreArchivo', checkAuth, verFichaTecnica);

export default router;