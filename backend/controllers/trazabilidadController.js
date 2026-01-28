import { getConnection, sql } from '../config/db.js';
import { registrarLog } from '../libs/logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Configuración de rutas seguras
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 1. LISTAR FICHAS (Para Admin y Colaborador)
// ==========================================
export const listarFichas = async (req, res) => {
    try {
        const pool = await getConnection();
        // Usamos el SP genérico filtrando por Módulo y SubTipo
        const result = await pool.request()
            .input('Modulo', sql.NVarChar, 'TRAZABILIDAD')
            .input('SubTipo', sql.NVarChar, 'FICHA_TECNICA')
            .execute('dbo.SP_ListarDocumentos');
        
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al listar fichas técnicas' });
    }
};

// ==========================================
// 2. SUBIR FICHA (Solo Admin)
// ==========================================
export const subirFicha = async (req, res) => {
    const { nombre, descripcion } = req.body;
    
    if (!req.file) return res.status(400).json({ mensaje: 'Debe subir un archivo PDF o Imagen' });

    // --- CORRECCIÓN HOSTINGER: RUTA RELATIVA ---
    // Guardamos solo el nombre del archivo para máxima compatibilidad
    // (Opcional: puedes guardar 'uploads/nombre' si tu frontend lo espera así, 
    // pero el extractor de nombre en el frontend se encarga de limpiar)
    const urlArchivo = `uploads/${req.file.filename}`;
    
    const ext = req.file.filename.split('.').pop().toLowerCase();
    
    // Determinamos tipo de origen visual
    let tipoOrigen = 'PDF';
    if (['jpg', 'jpeg', 'png'].includes(ext)) tipoOrigen = 'Imagen';
    else if (['doc', 'docx'].includes(ext)) tipoOrigen = 'Word';
    else if (['xls', 'xlsx'].includes(ext)) tipoOrigen = 'Excel';

    try {
        const pool = await getConnection();
        await pool.request()
            .input('Modulo', sql.NVarChar, 'TRAZABILIDAD')
            .input('SubTipo', sql.NVarChar, 'FICHA_TECNICA')
            .input('Nombre', sql.NVarChar, nombre)
            .input('TipoOrigen', sql.NVarChar, tipoOrigen)
            .input('UrlArchivo', sql.NVarChar, urlArchivo)
            .input('Descripcion', sql.NVarChar, descripcion || '')
            .execute('dbo.SP_GuardarDocumento');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'SUBIR', 'Trazabilidad', `Subió ficha técnica: ${nombre}`);
        res.json({ mensaje: 'Ficha técnica guardada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al guardar la ficha' });
    }
};

// ==========================================
// 3. ELIMINAR FICHA (Solo Admin)
// ==========================================
export const eliminarFicha = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Doc', sql.Int, id)
            .execute('dbo.SP_EliminarDocumento'); // Borrado lógico

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'ELIMINAR', 'Trazabilidad', `Eliminó ficha ID: ${id}`);
        res.json({ mensaje: 'Ficha eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar' });
    }
};

// ==========================================
// 4. VER FICHA TÉCNICA (STREAMING ROBUSTO)
// ==========================================
export const verFichaTecnica = (req, res) => {
    const { nombreArchivo } = req.params;

    console.log(`🔍 [TRAZABILIDAD] Buscando ficha: ${nombreArchivo}`);

    if (!nombreArchivo || nombreArchivo.includes('..') || nombreArchivo.includes('/') || nombreArchivo.includes('\\')) {
        return res.status(400).json({ mensaje: 'Nombre de archivo inválido' });
    }

    const projectRoot = process.cwd();

    // Estrategia de múltiples rutas para asegurar que lo encuentre en Hostinger
    const posiblesRutas = [
        path.join(projectRoot, 'uploads', nombreArchivo),
        path.join(projectRoot, 'backend', 'uploads', nombreArchivo),
        path.resolve(__dirname, '../../uploads', nombreArchivo)
    ];

    let archivoEncontrado = null;

    for (const ruta of posiblesRutas) {
        if (fs.existsSync(ruta)) {
            archivoEncontrado = ruta;
            break;
        }
    }

    if (archivoEncontrado) {
        console.log(`✅ [TRAZABILIDAD] Encontrado en: ${archivoEncontrado}`);

        // Detectar Content-Type para evitar pantalla blanca
        const ext = path.extname(archivoEncontrado).toLowerCase();
        let contentType = 'application/octet-stream';

        if (ext === '.pdf') contentType = 'application/pdf';
        else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);

        res.sendFile(archivoEncontrado);
    } else {
        console.error(`❌ [TRAZABILIDAD] No encontrado. Buscado en:`, posiblesRutas);
        res.status(404).json({ mensaje: 'Ficha técnica no encontrada en el servidor' });
    }
};