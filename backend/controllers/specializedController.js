import { getConnection, sql } from '../config/db.js';
import { registrarLog } from '../libs/logger.js';

// ================= 3. AGUA POTABLE (VERIFICACIÓN DIARIA) =================
export const registrarVerificacionAgua = async (req, res) => {
    const { puntoToma, medicion } = req.body;
    const idUsuario = req.usuario.id;
    
    if (!req.file) return res.status(400).json({ mensaje: 'Foto obligatoria' });
    const urlFoto = `http://localhost:3000/uploads/${req.file.filename}`;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Usuario', sql.Int, idUsuario)
            .input('PuntoToma', sql.NVarChar, puntoToma)
            .input('DatosMedicion', sql.NVarChar, medicion)
            .input('UrlFoto', sql.NVarChar, urlFoto)
            .execute('dbo.SP_RegistrarVerificacionAgua');

        // LOG
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'REGISTRO', 'Calidad Agua', `Registró toma en: ${puntoToma}`);

        res.json({ mensaje: 'Registrado' });
    } catch (error) { res.status(500).json({ mensaje: 'Error' }); }
};

export const obtenerHistorialAgua = async (req, res) => {
    try {
        const pool = await getConnection();
        const { rol, id } = req.usuario; 
        const result = await pool.request()
            .input('ID_Usuario', sql.Int, (rol==='SuperAdmin'||rol==='AdminCalidad')?null:id)
            .execute('dbo.SP_ListarVerificacionesAgua');
        res.json(result.recordset);
    } catch (error) { res.status(500).json({ mensaje: 'Error' }); }
};

// ================= 4. CAPACITACIÓN (MODO KIOSCO) =================

export const registrarEvaluacionKiosco = async (req, res) => {
    const { idEvaluacion, nombreEvaluado, calificacion, detalleRespuestas } = req.body;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Evaluacion', sql.Int, idEvaluacion)
            .input('NombreEvaluado', sql.NVarChar, nombreEvaluado)
            .input('Calificacion', sql.Decimal(4,2), calificacion)
            .input('DetalleJSON', sql.NVarChar, JSON.stringify(detalleRespuestas || []))
            .execute('dbo.SP_RegistrarResultadoKiosco');

        // LOG ESPECIAL (Sin req.usuario porque es público)
        await registrarLog('Kiosco Público', 'Invitado', 'EVALUACION', 'Capacitación', `Evaluado: ${nombreEvaluado}, Nota: ${calificacion}`);

        res.json({ mensaje: 'Evaluación guardada. ¡Gracias!' });
    } catch (error) {
        console.error("Error en Kiosco:", error);
        res.status(500).json({ mensaje: 'Error al guardar evaluación' });
    }
};

// [AQUÍ ESTABA EL ERROR: FALTABA MAPEAR LA IMAGEN]
export const obtenerPreguntasKiosco = async (req, res) => {
    const { idEvaluacion } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('ID_Evaluacion', sql.Int, idEvaluacion)
            .execute('dbo.SP_ListarPreguntasEvaluacion');
        
        const preguntasMap = new Map();
        result.recordset.forEach(row => {
            if (!preguntasMap.has(row.ID_Pregunta_Eval)) {
                preguntasMap.set(row.ID_Pregunta_Eval, {
                    id: row.ID_Pregunta_Eval,
                    pregunta: row.Texto_Pregunta,
                    imagen: row.Url_Imagen, // <--- ¡ESTA LÍNEA ES LA CLAVE!
                    opciones: []
                });
            }
            preguntasMap.get(row.ID_Pregunta_Eval).opciones.push({
                id: row.ID_Opcion,
                texto: row.Texto_Opcion,
                esCorrecta: row.Es_Correcta
            });
        });

        res.json(Array.from(preguntasMap.values()));
    } catch (error) {
        console.error("Error cargando examen:", error);
        res.status(500).json({ mensaje: 'Error al cargar examen' });
    }
};