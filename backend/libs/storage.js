// backend/libs/storage.js
import multer from 'multer';
import path from 'path';

// Configuramos dónde guardar los archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Los guardaremos en una carpeta pública llamada 'uploads'
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Generamos nombre único: fecha + nombre original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

export const upload = multer({ storage: storage });