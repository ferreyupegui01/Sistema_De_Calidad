import { getConnection, sql } from '../config/db.js';

// ==========================================
// 1. OBTENER NOTIFICACIONES
// ==========================================
export const obtenerNotificaciones = async (req, res) => {
    try {
        const pool = await getConnection();
        // Obtenemos rol y nombre del token del usuario (middleware checkAuth)
        const { rol, nombre } = req.usuario; 

        const result = await pool.request()
            .input('RolUsuario', sql.NVarChar, rol)
            .input('NombreUsuario', sql.NVarChar, nombre)
            .execute('dbo.SP_ObtenerNotificaciones');

        res.json(result.recordset);
    } catch (error) {
        console.error("Error obteniendo notificaciones:", error);
        res.status(500).json({ mensaje: 'Error al obtener notificaciones' });
    }
};

// ==========================================
// 2. ELIMINAR NOTIFICACIÓN (Borrado Físico)
// ==========================================
export const eliminarNotificacion = async (req, res) => {
    const { id } = req.params;

    // Protección: Las alertas con ID negativo son calculadas por el sistema (Vencimientos)
    // y no están en la tabla, por lo que no se pueden borrar con DELETE.
    if (parseInt(id) < 0) {
        return res.status(400).json({ 
            mensaje: 'Las alertas automáticas (vencimientos) desaparecen solas al gestionar la actividad.' 
        });
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Notificacion', sql.Int, id)
            .execute('dbo.SP_EliminarNotificacion');
        
        res.json({ mensaje: 'Notificación eliminada correctamente' });
    } catch (error) {
        console.error("Error eliminando notificación:", error);
        res.status(500).json({ mensaje: 'Error al eliminar la notificación' });
    }
};

// ==========================================
// 3. MARCAR COMO LEÍDA (Opcional)
// ==========================================
// Nota: Actualmente tu sistema usa "Eliminar" para quitarlas, 
// pero dejamos esto por si quisieras solo marcarla como vista sin borrarla.
export const marcarLeida = async (req, res) => {
    const { id } = req.params;
    
    if (parseInt(id) < 0) return res.json({ mensaje: 'Alerta temporal, no requiere marca.' });

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Notificacion', sql.Int, id)
            .execute('dbo.SP_MarcarNotificacionLeida');
        res.json({ mensaje: 'Notificación marcada como leída' });
    } catch (error) {
        console.error("Error marcando leída:", error);
        res.status(500).json({ mensaje: 'Error al actualizar estado' });
    }
};