// backend/libs/logger.js
import { getConnection, sql } from '../config/db.js';

export const registrarLog = async (usuario, rol, accion, modulo, detalle) => {
    try {
        const pool = await getConnection();
        await pool.request()
            .input('Usuario', sql.NVarChar, usuario || 'Sistema')
            .input('Rol', sql.NVarChar, rol || 'System')
            .input('Accion', sql.NVarChar, accion)
            .input('Modulo', sql.NVarChar, modulo)
            .input('Detalle', sql.NVarChar, detalle)
            .execute('dbo.SP_RegistrarLogGlobal');
            
        console.log(`[LOG] ${accion} en ${modulo}: ${detalle}`); // También lo muestra en consola
    } catch (error) {
        console.error('Error guardando log de auditoría:', error);
        // No lanzamos error para no detener el proceso principal si falla el log
    }
};