import { Router } from 'express';
import { 
    obtenerContenido, 
    crearCarpeta, 
    subirArchivoDrive, 
    eliminarArchivo, 
    eliminarCarpeta, 
    descargarArchivo 
} from '../controllers/driveController.js';
import { checkAuth } from '../middlewares/authMiddleware.js';
import { upload } from '../libs/storage.js';

const router = Router();

router.get('/contenido/:idCarpeta', checkAuth, obtenerContenido);
router.post('/carpeta', checkAuth, crearCarpeta);
router.delete('/carpeta/:id', checkAuth, eliminarCarpeta); // <--- NUEVA

router.post('/archivo', checkAuth, upload.single('archivo'), subirArchivoDrive);
router.delete('/archivo/:id', checkAuth, eliminarArchivo);
router.get('/descargar/:id', checkAuth, descargarArchivo); // <--- NUEVA

export default router;