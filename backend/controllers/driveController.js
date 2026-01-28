import { getConnection, sql } from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { registrarLog } from '../libs/logger.js';

// Configuración de rutas seguras
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

    // Guardamos ruta relativa
    const url = `uploads/${req.file.filename}`;
    
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
        // 1. Obtener nombre para borrar físico
        const result = await pool.request().input('ID_Doc', sql.Int, id).execute('dbo.SP_DRIVE_ObtenerArchivo');
        
        if (result.recordset.length > 0) {
            const archivo = result.recordset[0];
            const nombreEnDisco = archivo.Url_Archivo.split('/').pop();
            const rutaFisica = path.resolve(__dirname, '../uploads', nombreEnDisco);
            try { if (fs.existsSync(rutaFisica)) fs.unlinkSync(rutaFisica); } catch(e) { console.warn('No se pudo borrar físico:', e); }
        }

        // 2. Borrar de BD
        await pool.request()
            .input('ID_Doc', sql.Int, id)
            .execute('dbo.SP_DRIVE_EliminarArchivo');

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
        const rutaFisica = path.resolve(__dirname, '../uploads', nombreArchivoEnDisco);

        if (fs.existsSync(rutaFisica)) {
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

// ==========================================
// 7. NUEVO: VER ARCHIVO (STREAMING HÍBRIDO)
// ==========================================
// Corrección: Soporta tanto ID numérico (BD) como Nombre de Archivo directo
export const verArchivo = async (req, res) => {
    const { id } = req.params; // 'id' puede ser "15" o "archivo-1234.pdf"

    // --- OPCIÓN A: ES UN NOMBRE DE ARCHIVO DIRECTO ---
    // Si contiene punto (extensión) o NO es un número, asumimos que es el nombre físico
    if (isNaN(id) || id.includes('.')) {
        const nombreArchivo = id;
        
        // Seguridad básica
        if (nombreArchivo.includes('..') || nombreArchivo.includes('/') || nombreArchivo.includes('\\')) {
            return res.status(400).json({ mensaje: 'Nombre de archivo inválido' });
        }

        const rutaFisica = path.resolve(__dirname, '../uploads', nombreArchivo);

        if (fs.existsSync(rutaFisica)) {
            // Detectar MIME type básico
            const ext = path.extname(nombreArchivo).toLowerCase();
            let contentType = 'application/octet-stream';
            if (ext === '.pdf') contentType = 'application/pdf';
            else if (['.jpg', '.jpeg', '.png'].includes(ext)) contentType = 'image/jpeg';

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);
            return res.sendFile(rutaFisica);
        } else {
            console.error(`Archivo físico no encontrado: ${rutaFisica}`);
            return res.status(404).json({ mensaje: 'Archivo físico no encontrado' });
        }
    }

    // --- OPCIÓN B: ES UN ID DE BASE DE DATOS (Lógica Original) ---
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('ID_Doc', sql.Int, id)
            .execute('dbo.SP_DRIVE_ObtenerArchivo');

        if (result.recordset.length === 0) return res.status(404).json({ mensaje: 'No encontrado en BD' });

        const archivo = result.recordset[0];
        const nombreDisco = archivo.Url_Archivo.split('/').pop();
        const rutaFisica = path.resolve(__dirname, '../uploads', nombreDisco);

        if (fs.existsSync(rutaFisica)) {
            res.setHeader('Content-Disposition', `inline; filename="${archivo.Nombre}"`);
            res.sendFile(rutaFisica);
        } else {
            res.status(404).json({ mensaje: 'Archivo físico no encontrado' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al visualizar' });
    }
};