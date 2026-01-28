import { getConnection } from '../config/db.js';

export const obtenerResumen = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ObtenerResumenDashboard');
        
        // SQL devuelve múltiples tablas (recordsets)
        const contadores = result.recordsets[0][0]; // Primera tabla, primera fila
        const graficaSemanal = result.recordsets[1]; // Segunda tabla (Array)
        const graficaEstado = result.recordsets[2];  // Tercera tabla (Array)

        res.json({
            stats: contadores,
            chartData: graficaSemanal,
            pieData: graficaEstado
        });

    } catch (error) {
        console.error("Error obteniendo dashboard:", error);
        res.status(500).json({ mensaje: 'Error al cargar el resumen del dashboard' });
    }
};