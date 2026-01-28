import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // <--- IMPORTANTE: Importar file system
import { getAuditorias, createAuditoria, manageAuditores, manageAreas } from '../controllers/auditoriaController.js';
import { checkAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// --- CONFIGURACIÓN DE CARPETA DE SUBIDAS ---
const uploadDir = 'uploads/';

// Si la carpeta no existe, la creamos automáticamente
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Guardamos en la carpeta asegurada
    },
    filename: function (req, file, cb) {
        // Limpiamos el nombre original para evitar caracteres raros
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'aud-' + uniqueSuffix + '-' + safeName);
    }
});

const upload = multer({ storage: storage });

// --- RUTAS ---

router.get('/', checkAuth, getAuditorias);

// Middleware upload.single('evidencia') procesa el archivo antes del controlador
router.post('/', checkAuth, upload.single('evidencia'), createAuditoria);

router.post('/auditores', checkAuth, manageAuditores);
router.post('/areas', checkAuth, manageAreas);

export default router;