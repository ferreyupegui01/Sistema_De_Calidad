import { Router } from 'express';
// Importamos todos los controladores, incluyendo el nuevo getClientes
import { 
    getProductos, 
    getProveedores, 
    getMaquinistas, 
    getSelladores,
    getClientes 
} from '../controllers/externosController.js';

const router = Router();

// Rutas existentes
router.get('/productos', getProductos);
router.get('/proveedores', getProveedores);
router.get('/maquinistas', getMaquinistas);
router.get('/selladores', getSelladores);

// --- NUEVA RUTA PARA CLIENTES ---
router.get('/clientes', getClientes); 
// -------------------------------

export default router;