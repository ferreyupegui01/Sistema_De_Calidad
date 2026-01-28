// backend/controllers/auditGlobalController.js
import { getConnection } from '../config/db.js';

export const getGlobalLogs = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_VerAuditoriaGlobal');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error obteniendo bitácora' });
    }
};