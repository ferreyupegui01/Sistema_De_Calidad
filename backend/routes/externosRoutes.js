import { Router } from 'express';
// Asegúrate de importar el nuevo controlador getClientes
import { 
    getProductos, 
    getProveedores, 
    getMaquinistas, 
    getSelladores,
    getClientes // <--- IMPORTANTE: Agrégalo aquí
} from '../controllers/externosController.js';

const router = Router();

router.get('/productos', getProductos);
router.get('/proveedores', getProveedores);
router.get('/maquinistas', getMaquinistas);
router.get('/selladores', getSelladores);

// --- AGREGA ESTA LÍNEA ---
router.get('/clientes', getClientes); 
// -------------------------

export default router;