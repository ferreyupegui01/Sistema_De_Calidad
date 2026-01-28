import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { checkAuth } from '../middlewares/authMiddleware.js';
import { 
    createRecoleccion, 
    getRecolecciones
} from '../controllers/pmirController.js';

// --- CONFIGURACIÓN MULTER ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Guardamos en la raíz de uploads (igual que Pesos)
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });
// -----------------------------

const router = Router();

// RUTA PARA CREAR RECOLECCIÓN
// Importante: 'documento' es el nombre que debe tener el campo en el frontend
router.post('/recoleccion', checkAuth, upload.single('documento'), createRecoleccion);

router.get('/recoleccion', checkAuth, getRecolecciones);

export default router;