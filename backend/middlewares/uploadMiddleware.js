import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Configuración para manejar rutas en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurar que existe la carpeta de subidas 'uploads' en la raíz del backend
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generar nombre único
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, uniqueSuffix + '-' + cleanName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Límite de 50MB
});

export default upload;