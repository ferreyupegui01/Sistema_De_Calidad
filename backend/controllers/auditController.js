// backend/controllers/auditController.js
import { getConnection } from '../config/db.js';

export const getAuditoriaReport = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ObtenerAuditoriaCalidad');
        
        // El SP devuelve 3 tablas (Recordsets)
        res.json({
            resumen: result.recordsets[0],      // Estadísticas
            cronogramas: result.recordsets[1],  // Qué han planeado
            actividades: result.recordsets[2]   // Qué han ejecutado
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener auditoría' });
    }
};