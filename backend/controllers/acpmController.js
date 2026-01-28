import { getConnection, sql } from '../config/db.js';
import { registrarLog } from '../libs/logger.js';

// ==========================================
// CREAR NUEVA ACCIÓN (ACPM)
// ==========================================
export const crearACPM = async (req, res) => {
    const { 
        tipo, 
        origen,      
        origenPlan,  
        descripcion, 
        planAccion, 
        responsable, 
        fechaLimite, 
        analisisCausa,
        idReporte,
        idAuditoria // <--- NUEVO CAMPO
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
            .input('ID_Auditoria', sql.Int, idAuditoria || null) // <--- ENVÍO A BD
            .execute('dbo.SP_CrearACPM');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'ACPM', `Creó acción ${tipo}. Origen: ${origen}`);

        res.status(201).json({ mensaje: 'Acción ACPM creada exitosamente' });
    } catch (error) {
        console.error("Error creando ACPM:", error);
        res.status(500).json({ mensaje: 'Error interno al crear la acción' });
    }
};

// ==========================================
// LISTAR ACCIONES (TABLA)
// ==========================================
export const listarACPM = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarACPM');
        res.json(result.recordset);
    } catch (error) {
        console.error("Error listando ACPM:", error);
        res.status(500).json({ mensaje: 'Error al obtener el listado de acciones' });
    }
};

// ==========================================
// OBTENER UN ACPM POR ID (NUEVO)
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
        console.error("Error obteniendo ACPM:", error);
        res.status(500).json({ mensaje: 'Error al obtener el plan' });
    }
};

// ... (El resto de funciones cerrarACPM, gestionarACPM, obtenerOrigenes se mantienen igual) ...

export const cerrarACPM = async (req, res) => {
    const { id } = req.params;
    const { urlEvidencia } = req.body; 

    if (!urlEvidencia) {
        return res.status(400).json({ mensaje: 'Es obligatorio adjuntar evidencia para cerrar la acción' });
    }

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

export const gestionarACPM = async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado, comentario, urlEvidencia, usuario } = req.body;

    if (nuevoEstado === 'Cerrada' && (!urlEvidencia || urlEvidencia.trim() === '')) {
        return res.status(400).json({ mensaje: 'Para cerrar la acción es OBLIGATORIO adjuntar una evidencia.' });
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_ACPM', sql.Int, id)
            .input('NuevoEstado', sql.NVarChar, nuevoEstado)
            .input('Comentario', sql.NVarChar, comentario || '')
            .input('Url_Evidencia', sql.NVarChar, urlEvidencia || '')
            .input('Usuario', sql.NVarChar, usuario || 'Sistema')
            .execute('dbo.SP_GestionarACPM');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'GESTIONAR', 'ACPM', `Cambió estado a ${nuevoEstado} en ACPM ID ${id}.`);

        res.json({ mensaje: 'Gestión guardada exitosamente.' });
    } catch (error) {
        console.error("Error gestionando ACPM:", error);
        res.status(500).json({ mensaje: 'Error al guardar la gestión.' });
    }
};

export const obtenerOrigenes = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarOrigenesACPM');
        res.json(result.recordset);
    } catch (error) {
        console.error("Error obteniendo orígenes:", error);
        res.status(500).json({ mensaje: 'Error al cargar orígenes' });
    }
};

export const agregarOrigen = async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });

    try {
        const pool = await getConnection();
        await pool.request()
            .input('Nombre_Origen', sql.NVarChar, nombre)
            .execute('dbo.SP_AgregarOrigenACPM');
        
        res.json({ mensaje: 'Origen agregado correctamente' });
    } catch (error) {
        console.error("Error agregando origen:", error);
        res.status(500).json({ mensaje: 'Error al agregar origen' });
    }
};