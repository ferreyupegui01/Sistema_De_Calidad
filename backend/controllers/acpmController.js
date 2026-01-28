import { getConnection, sql } from '../config/db.js';
import { registrarLog } from '../libs/logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CREAR NUEVA ACCIÓN (ACPM)
// ==========================================
export const crearACPM = async (req, res) => {
    const { 
        tipo, origen, origenPlan, descripcion, planAccion, 
        responsable, fechaLimite, analisisCausa, idReporte, idAuditoria 
    } = req.body;

    if (!tipo || !origen || !origenPlan || !descripcion || !planAccion || !responsable || !fechaLimite) {
        return res.status(400).json({ mensaje: 'Por favor complete todos los campos obligatorios (*)' });
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input('Tipo_Accion', sql.NVarChar, tipo)
            .input('Origen', sql.NVarChar, origen)
            .input('Origen_Plan', sql.NVarChar, origenPlan)
            .input('Descripcion', sql.NVarChar, descripcion)
            .input('Plan_Accion', sql.NVarChar, planAccion)
            .input('Responsable', sql.NVarChar, responsable)
            .input('Fecha_Limite', sql.Date, fechaLimite)
            .input('Analisis_Causa', sql.NVarChar, analisisCausa || '')
            .input('ID_Reporte_Origen', sql.Int, idReporte || null)
            .input('ID_Auditoria', sql.Int, idAuditoria || null)
            .execute('dbo.SP_CrearACPM');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'ACPM', `Creó acción ${tipo}. Origen: ${origen}`);
        res.status(201).json({ mensaje: 'Acción ACPM creada exitosamente' });
    } catch (error) {
        console.error("Error creando ACPM:", error);
        res.status(500).json({ mensaje: 'Error interno al crear la acción' });
    }
};

// ==========================================
// LISTAR ACCIONES
// ==========================================
export const listarACPM = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarACPM');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el listado de acciones' });
    }
};

// ==========================================
// OBTENER UN ACPM
// ==========================================
export const obtenerACPM = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('ID_ACPM', sql.Int, id)
            .execute('dbo.SP_ObtenerACPM');
            
        if (result.recordset.length === 0) return res.status(404).json({ mensaje: 'No encontrado' });
        
        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el plan' });
    }
};

// ==========================================
// CERRAR ACPM (CON SUBIDA REAL DE EVIDENCIA)
// ==========================================
export const cerrarACPM = async (req, res) => {
    const { id } = req.params;
    
    // --- CORRECCIÓN HOSTINGER: USAR ARCHIVO REAL ---
    if (!req.file) {
        return res.status(400).json({ mensaje: 'Es obligatorio adjuntar evidencia (Archivo) para cerrar la acción' });
    }

    // Guardamos ruta relativa "uploads/evidencia.pdf"
    const urlEvidencia = `uploads/${req.file.filename}`;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_ACPM', sql.Int, id)
            .input('Url_Evidencia', sql.NVarChar, urlEvidencia)
            .execute('dbo.SP_CerrarACPM');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CERRAR', 'ACPM', `Cerró ACPM ID ${id} con evidencia.`);
        res.json({ mensaje: 'Acción ACPM cerrada correctamente' });
    } catch (error) {
        console.error("Error cerrando ACPM:", error);
        res.status(500).json({ mensaje: 'Error al cerrar la acción' });
    }
};

// ==========================================
// GESTIONAR ACPM (CAMBIAR ESTADO + OPCIONAL EVIDENCIA)
// ==========================================
export const gestionarACPM = async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado, comentario, usuario } = req.body; // urlEvidencia ya no viene del body como texto

    // --- CORRECCIÓN HOSTINGER ---
    let urlEvidencia = '';
    if (req.file) {
        urlEvidencia = `uploads/${req.file.filename}`;
    }

    // Validación: Si cierra, debe tener evidencia
    if (nuevoEstado === 'Cerrada' && !urlEvidencia) {
        return res.status(400).json({ mensaje: 'Para cerrar la acción es OBLIGATORIO adjuntar una evidencia (Archivo).' });
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_ACPM', sql.Int, id)
            .input('NuevoEstado', sql.NVarChar, nuevoEstado)
            .input('Comentario', sql.NVarChar, comentario || '')
            .input('Url_Evidencia', sql.NVarChar, urlEvidencia) // Pasa ruta relativa o string vacío
            .input('Usuario', sql.NVarChar, usuario || 'Sistema')
            .execute('dbo.SP_GestionarACPM');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'GESTIONAR', 'ACPM', `Cambió estado a ${nuevoEstado} en ACPM ID ${id}.`);
        res.json({ mensaje: 'Gestión guardada exitosamente.' });
    } catch (error) {
        console.error("Error gestionando ACPM:", error);
        res.status(500).json({ mensaje: 'Error al guardar la gestión.' });
    }
};

// ... obtenerOrigenes y agregarOrigen quedan igual ...
export const obtenerOrigenes = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarOrigenesACPM');
        res.json(result.recordset);
    } catch (error) { res.status(500).json({ mensaje: 'Error al cargar orígenes' }); }
};

export const agregarOrigen = async (req, res) => {
    const { nombre } = req.body;
    try {
        const pool = await getConnection();
        await pool.request().input('Nombre_Origen', sql.NVarChar, nombre).execute('dbo.SP_AgregarOrigenACPM');
        res.json({ mensaje: 'Origen agregado correctamente' });
    } catch (error) { res.status(500).json({ mensaje: 'Error al agregar origen' }); }
};

// ==========================================
// NUEVO: VER EVIDENCIA ACPM
// ==========================================
export const verEvidenciaACPM = (req, res) => {
    const { nombreArchivo } = req.params;
    if (!nombreArchivo || nombreArchivo.includes('..') || nombreArchivo.includes('/') || nombreArchivo.includes('\\')) {
        return res.status(400).json({ mensaje: 'Nombre de archivo inválido' });
    }
    const rutaFisica = path.resolve(__dirname, '../uploads', nombreArchivo);
    if (fs.existsSync(rutaFisica)) {
        res.sendFile(rutaFisica);
    } else {
        res.status(404).json({ mensaje: 'Evidencia no encontrada' });
    }
};