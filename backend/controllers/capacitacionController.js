import { getConnection, sql } from '../config/db.js';
import { registrarLog } from '../libs/logger.js';

// ==========================================
// 1. GESTIÓN DE CAPACITACIONES (MATERIAL)
// ==========================================

export const crearCapacitacion = async (req, res) => {
    const { titulo, descripcion } = req.body;
    
    if (!req.file) return res.status(400).json({ mensaje: 'Debe subir un material (PDF/PPT)' });
    
    const urlMaterial = `http://localhost:3000/uploads/${req.file.filename}`;
    const ext = req.file.filename.split('.').pop().toLowerCase();
    let tipoArchivo = 'OTRO';
    if (ext === 'pdf') tipoArchivo = 'PDF';
    else if (['ppt', 'pptx'].includes(ext)) tipoArchivo = 'PPT';
    else if (['mp4', 'avi'].includes(ext)) tipoArchivo = 'VIDEO';

    try {
        const pool = await getConnection();
        await pool.request()
            .input('Titulo', sql.NVarChar, titulo)
            .input('Descripcion', sql.NVarChar, descripcion)
            .input('Url_Material', sql.NVarChar, urlMaterial)
            .input('Tipo_Archivo', sql.NVarChar, tipoArchivo)
            .execute('dbo.SP_CrearCapacitacion');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'Capacitación', `Creó capacitación: ${titulo}`);
        res.json({ mensaje: 'Capacitación creada y evaluación asignada.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear capacitación' });
    }
};

export const listarCapacitacionesAdmin = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarCapacitacionesAdmin');
        res.json(result.recordset);
    } catch (error) { res.status(500).json({ mensaje: 'Error al listar' }); }
};

// --- PARA EL KIOSCO (PÚBLICO) ---
export const listarParaKiosco = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarCapacitacionesKiosco');
        res.json(result.recordset);
    } catch (error) { res.status(500).json({ mensaje: 'Error al listar para kiosco' }); }
};

// ==========================================
// 2. REPORTES AVANZADOS (DRILL-DOWN)
// ==========================================

export const obtenerResumenAdmin = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_Admin_ResumenCapacitaciones');
        res.json(result.recordset);
    } catch (error) { res.status(500).json({ mensaje: 'Error al cargar resumen' }); }
};

export const obtenerUsuariosPorCurso = async (req, res) => {
    const { idEvaluacion } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('ID_Evaluacion', sql.Int, idEvaluacion)
            .execute('dbo.SP_Admin_UsuariosPorEvaluacion');
        res.json(result.recordset);
    } catch (error) { res.status(500).json({ mensaje: 'Error al cargar usuarios' }); }
};

export const obtenerHistorialUsuario = async (req, res) => {
    const { idEvaluacion } = req.params;
    const { nombre } = req.query; // Se envía por query param ?nombre=Juan...
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('ID_Evaluacion', sql.Int, idEvaluacion)
            .input('NombreEvaluado', sql.NVarChar, nombre)
            .execute('dbo.SP_Admin_HistorialUsuario');
        res.json(result.recordset);
    } catch (error) { res.status(500).json({ mensaje: 'Error al cargar historial' }); }
};

// ==========================================
// 3. GESTIÓN DE RESULTADOS Y PREGUNTAS
// ==========================================

export const listarResultados = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarResultadosEvaluacion');
        res.json(result.recordset);
    } catch (error) { res.status(500).json({ mensaje: 'Error' }); }
};

export const cambiarEstadoResultado = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        const pool = await getConnection();
        await pool.request().input('ID_Resultado', sql.Int, id).input('NuevoEstado', sql.NVarChar, estado).execute('dbo.SP_CambiarEstadoResultado');
        res.json({ mensaje: 'Estado actualizado' });
    } catch (error) { res.status(500).json({ mensaje: 'Error' }); }
};

export const obtenerDetalleResultado = async (req, res) => {
    const { idResultado } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('ID_Resultado', sql.Int, idResultado)
            .execute('dbo.SP_ObtenerDetalleEvaluacion'); 
        res.json(result.recordset);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener detalle' }); 
    }
};

// [ACTUALIZADO] LISTAR PREGUNTAS (INCLUYE IMAGEN)
export const listarPreguntas = async (req, res) => {
    const { idEvaluacion } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request().input('ID_Evaluacion', sql.Int, idEvaluacion).execute('dbo.SP_ListarPreguntasEvaluacion');
        
        const preguntasMap = new Map();
        result.recordset.forEach(row => {
            if (!preguntasMap.has(row.ID_Pregunta_Eval)) {
                preguntasMap.set(row.ID_Pregunta_Eval, {
                    id: row.ID_Pregunta_Eval,
                    pregunta: row.Texto_Pregunta,
                    imagen: row.Url_Imagen, // <--- CAMPO NUEVO
                    opciones: []
                });
            }
            preguntasMap.get(row.ID_Pregunta_Eval).opciones.push({
                id: row.ID_Opcion, text: row.Texto_Opcion, isCorrect: row.Es_Correcta
            });
        });
        res.json(Array.from(preguntasMap.values()));
    } catch (error) { res.status(500).json({ mensaje: 'Error al listar preguntas' }); }
};

// [ACTUALIZADO] AGREGAR PREGUNTA (SOPORTE IMAGEN)
export const agregarPregunta = async (req, res) => {
    // Al usar FormData, req.body trae los textos y req.file el archivo
    const { idEvaluacion, texto, opciones } = req.body;
    
    let urlImagen = null;
    if (req.file) {
        urlImagen = `http://localhost:3000/uploads/${req.file.filename}`;
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Evaluacion', sql.Int, idEvaluacion)
            .input('TextoPregunta', sql.NVarChar, texto)
            .input('Url_Imagen', sql.NVarChar, urlImagen) // <--- PARAMETRO NUEVO AL SP
            .input('OpcionesJSON', sql.NVarChar, opciones) // Viene como string desde el FormData frontend
            .execute('dbo.SP_AgregarPreguntaEval');
            
        res.json({ mensaje: 'Pregunta agregada correctamente' });
    } catch (error) { 
        console.error("Error agregando pregunta:", error);
        res.status(500).json({ mensaje: 'Error al guardar la pregunta' }); 
    }
};

export const eliminarPregunta = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        await pool.request().input('ID_Pregunta', sql.Int, id).execute('dbo.SP_EliminarPreguntaEvaluacion');
        res.json({ mensaje: 'Eliminada' });
    } catch (error) { res.status(500).json({ mensaje: 'Error' }); }
};