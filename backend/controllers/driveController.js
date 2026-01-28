// backend/controllers/driveController.js
import { getConnection, sql } from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { registrarLog } from '../libs/logger.js'; // <--- IMPORTANTE

// Configuración para rutas de archivos locales
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 1. OBTENER CONTENIDO
// ==========================================
export const obtenerContenido = async (req, res) => {
    const { idCarpeta } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('ID_CarpetaPadre', sql.Int, idCarpeta)
            .execute('dbo.SP_DRIVE_ObtenerContenido');
        res.json({
            carpetas: result.recordsets[0],
            archivos: result.recordsets[1]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al cargar contenido' });
    }
};

// ==========================================
// 2. CREAR CARPETA
// ==========================================
export const crearCarpeta = async (req, res) => {
    const { nombre, idPadre } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('Nombre', sql.NVarChar, nombre)
            .input('ID_Padre', sql.Int, idPadre)
            .execute('dbo.SP_DRIVE_CrearCarpeta');

        // LOG
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'Drive', `Creó carpeta: ${nombre}`);

        res.json({ mensaje: 'Carpeta creada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear carpeta' });
    }
};

// ==========================================
// 3. ELIMINAR CARPETA
// ==========================================
export const eliminarCarpeta = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Carpeta', sql.Int, id)
            .execute('dbo.SP_DRIVE_EliminarCarpeta');

        // LOG
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'ELIMINAR', 'Drive', `Eliminó carpeta ID: ${id}`);

        res.json({ mensaje: 'Carpeta eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar carpeta' });
    }
};

// ==========================================
// 4. SUBIR ARCHIVO
// ==========================================
export const subirArchivoDrive = async (req, res) => {
    const { idCarpeta } = req.body;
    if (!req.file) return res.status(400).json({ mensaje: 'No hay archivo' });

    // URL Pública
    const url = `http://localhost:3000/uploads/${req.file.filename}`;
    
    // Detección de Tipo
    const tipoMime = req.file.mimetype.toLowerCase(); 
    let tipoOrigen = 'Archivo';
    if (tipoMime.includes('sheet') || tipoMime.includes('excel') || tipoMime.includes('xls')) tipoOrigen = 'Excel';
    else if (tipoMime.includes('presentation') || tipoMime.includes('powerpoint')) tipoOrigen = 'PowerPoint';
    else if (tipoMime.includes('word') || tipoMime.includes('doc')) tipoOrigen = 'Word';
    else if (tipoMime.includes('pdf')) tipoOrigen = 'PDF';
    else if (tipoMime.includes('image')) tipoOrigen = 'Imagen';
    else if (tipoMime.includes('video')) tipoOrigen = 'Video';

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Carpeta', sql.Int, idCarpeta)
            .input('Nombre', sql.NVarChar, req.file.originalname)
            .input('Url', sql.NVarChar, url)
            .input('TipoOrigen', sql.NVarChar, tipoOrigen) 
            .execute('dbo.SP_DRIVE_SubirArchivo');

        // LOG
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'SUBIR', 'Drive', `Subió archivo: ${req.file.originalname}`);

        res.json({ mensaje: 'Archivo guardado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al subir archivo' });
    }
};

// ==========================================
// 5. ELIMINAR ARCHIVO
// ==========================================
export const eliminarArchivo = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Doc', sql.Int, id)
            .execute('dbo.SP_DRIVE_EliminarArchivo');

        // LOG
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'ELIMINAR', 'Drive', `Eliminó archivo ID: ${id}`);

        res.json({ mensaje: 'Archivo eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar archivo' });
    }
};

// ==========================================
// 6. DESCARGAR ARCHIVO
// ==========================================
export const descargarArchivo = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('ID_Doc', sql.Int, id)
            .execute('dbo.SP_DRIVE_ObtenerArchivo');

        if (result.recordset.length === 0) {
            return res.status(404).json({ mensaje: 'Archivo no encontrado' });
        }

        const archivo = result.recordset[0];
        const nombreArchivoEnDisco = archivo.Url_Archivo.split('/').pop();
        const rutaFisica = path.join(__dirname, '..', 'uploads', nombreArchivoEnDisco);

        if (fs.existsSync(rutaFisica)) {
            
            // LOG (Registramos quién descargó)
            await registrarLog(req.usuario.nombre, req.usuario.rol, 'DESCARGAR', 'Drive', `Descargó archivo: ${archivo.Nombre}`);

            res.download(rutaFisica, archivo.Nombre);
        } else {
            res.status(404).json({ mensaje: 'El archivo físico no existe en el servidor' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al descargar' });
    }
};