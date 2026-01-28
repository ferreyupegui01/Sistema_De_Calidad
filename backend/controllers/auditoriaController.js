import { getConnection, sql } from '../config/db.js';
import { registrarLog } from '../libs/logger.js';

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
// CREAR AUDITORÍA (CON EVIDENCIA)
// ==========================================
export const createAuditoria = async (req, res) => {
    // Cuando usamos 'multipart/form-data', los campos de texto vienen en req.body
    const { tipo, auditor, area, normas, observaciones } = req.body;
    
    // Verificamos si multer procesó un archivo
    let urlEvidencia = null;
    if (req.file) {
        // Construimos la ruta relativa para guardarla en BD.
        // Asegúrate de que tu servidor esté sirviendo la carpeta 'uploads' como estática.
        urlEvidencia = `/uploads/${req.file.filename}`; 
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
            .input('Url_Evidencia', sql.NVarChar, urlEvidencia) // Aquí va la ruta del archivo o null
            .input('ID_Usuario', sql.Int, req.usuario.id)       // ID del usuario logueado (desde el token)
            .execute('dbo.SP_CrearAuditoria');

        // Registro en Bitácora Global
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'AUDITORIA', `Registró auditoría ${tipo} con evidencia.`);

        res.status(201).json({ mensaje: 'Auditoría registrada correctamente' });
    } catch (error) {
        console.error("Error creando auditoría:", error);
        res.status(500).json({ mensaje: 'Error al registrar la auditoría en base de datos' });
    }
};

// ==========================================
// GESTIÓN DINÁMICA DE AUDITORES
// ==========================================
export const manageAuditores = async (req, res) => {
    const { nuevo } = req.body; // Si viene un nombre, lo intenta crear. Si no, solo lista.

    try {
        const pool = await getConnection();
        const request = pool.request();
        
        // Si 'nuevo' tiene valor, lo pasamos al SP. Si es null/vacío, pasamos null para que solo liste.
        request.input('Nombre', sql.NVarChar, nuevo || null);

        const result = await request.execute('dbo.SP_GestionarAuditorDinamico');
        res.json(result.recordset);
    } catch (error) {
        console.error("Error gestionando auditores:", error);
        res.status(500).json({ mensaje: 'Error al gestionar la lista de auditores' });
    }
};

// ==========================================
// GESTIÓN DINÁMICA DE ÁREAS
// ==========================================
export const manageAreas = async (req, res) => {
    const { nuevo } = req.body;

    try {
        const pool = await getConnection();
        const request = pool.request();
        
        request.input('Nombre', sql.NVarChar, nuevo || null);

        const result = await request.execute('dbo.SP_GestionarAreaDinamica');
        res.json(result.recordset);
    } catch (error) {
        console.error("Error gestionando áreas:", error);
        res.status(500).json({ mensaje: 'Error al gestionar la lista de áreas' });
    }
};