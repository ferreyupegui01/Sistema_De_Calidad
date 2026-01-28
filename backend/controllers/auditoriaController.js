import { getConnection, sql } from '../config/db.js';
import { registrarLog } from '../libs/logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// LISTAR TODAS LAS AUDITORÍAS
// ==========================================
export const getAuditorias = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarAuditorias');
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al listar auditorías:", error);
        res.status(500).json({ mensaje: 'Error interno al listar auditorías' });
    }
};

// ==========================================
// CREAR AUDITORÍA (CON SUBIDA REAL)
// ==========================================
export const createAuditoria = async (req, res) => {
    const { tipo, auditor, area, normas, observaciones } = req.body;
    
    // --- CORRECCIÓN HOSTINGER ---
    let urlEvidencia = null;
    if (req.file) {
        // Guardamos 'uploads/archivo.pdf'
        urlEvidencia = `uploads/${req.file.filename}`; 
    }

    if (!tipo || !auditor || !area) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios (Tipo, Auditor, Área)' });
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input('Tipo', sql.NVarChar, tipo)
            .input('Auditor', sql.NVarChar, auditor)
            .input('Area', sql.NVarChar, area)
            .input('Normas', sql.NVarChar, normas || '')
            .input('Observaciones', sql.NVarChar, observaciones || '')
            .input('Url_Evidencia', sql.NVarChar, urlEvidencia) 
            .input('ID_Usuario', sql.Int, req.usuario.id)
            .execute('dbo.SP_CrearAuditoria');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'AUDITORIA', `Registró auditoría ${tipo} con evidencia.`);

        res.status(201).json({ mensaje: 'Auditoría registrada correctamente' });
    } catch (error) {
        console.error("Error creando auditoría:", error);
        res.status(500).json({ mensaje: 'Error al registrar la auditoría en base de datos' });
    }
};

// ==========================================
// GESTIÓN DINÁMICA (Sin cambios, solo logica)
// ==========================================
export const manageAuditores = async (req, res) => {
    const { nuevo } = req.body; 
    try {
        const pool = await getConnection();
        const request = pool.request();
        request.input('Nombre', sql.NVarChar, nuevo || null);
        const result = await request.execute('dbo.SP_GestionarAuditorDinamico');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al gestionar auditores' });
    }
};

export const manageAreas = async (req, res) => {
    const { nuevo } = req.body;
    try {
        const pool = await getConnection();
        const request = pool.request();
        request.input('Nombre', sql.NVarChar, nuevo || null);
        const result = await request.execute('dbo.SP_GestionarAreaDinamica');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al gestionar áreas' });
    }
};

// ==========================================
// NUEVO: VER EVIDENCIA AUDITORÍA
// ==========================================
export const verEvidenciaAuditoria = (req, res) => {
    const { nombreArchivo } = req.params;

    if (!nombreArchivo || nombreArchivo.includes('..') || nombreArchivo.includes('/') || nombreArchivo.includes('\\')) {
        return res.status(400).json({ mensaje: 'Nombre de archivo inválido' });
    }

    const rutaFisica = path.resolve(__dirname, '../uploads', nombreArchivo);

    if (fs.existsSync(rutaFisica)) {
        res.sendFile(rutaFisica);
    } else {
        res.status(404).json({ mensaje: 'Evidencia no encontrada en el servidor' });
    }
};

