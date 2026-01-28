import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { 
    registrarControlPesos, 
    listarControles, 
    obtenerDetalleControl 
} from '../controllers/pesosController.js';
import { checkAuth } from '../middlewares/authMiddleware.js';

// --- CONFIGURACIÓN SIMPLE DE MULTER ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ESTO APUNTA DIRECTO A: backend/uploads
const uploadDir = path.join(__dirname, '../uploads');

// Asegurar que exista, aunque tu server.js ya la usa
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Guardamos directo en la raíz de uploads
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Nombre limpio: timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
// -------------------------------------

const router = Router();

// Subimos 'evidencia'
router.post('/', checkAuth, upload.single('evidencia'), registrarControlPesos);

router.get('/', checkAuth, listarControles);
router.get('/:id', checkAuth, obtenerDetalleControl);

export default router;