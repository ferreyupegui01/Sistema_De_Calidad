import { getConnection, sql, configSGC } from '../config/db.js'; // <--- CORRECCIÓN: Se importó configSGC
import { registrarLog } from '../libs/logger.js'; 

// =====================================================================
// 1. GESTIÓN DE CRONOGRAMAS (CABECERAS / CARPETAS)
// =====================================================================

export const crearCronograma = async (req, res) => {
    // Agregamos 'tipo' (por defecto GENERAL si no viene)
    const { nombre, anio, descripcion, tipo = 'GENERAL' } = req.body;

    try {
        // Usamos configSGC aquí explícitamente como estaba en tu lógica
        const pool = await sql.connect(configSGC);
        await pool.request()
            .input('Nombre', sql.NVarChar, nombre)
            .input('Anio', sql.Int, anio)
            .input('Descripcion', sql.NVarChar, descripcion)
            .input('Tipo', sql.NVarChar, tipo) // Nuevo input
            .execute('SP_CrearCronograma');

        res.json({ message: 'Cronograma creado correctamente' });
    } catch (error) {
        console.error("Error crearCronograma:", error);
        res.status(500).json({ message: error.message });
    }
};

export const listarCronogramas = async (req, res) => {
    // Leemos el query param ?tipo=MUESTREO (opcional)
    const { tipo } = req.query;

    try {
        const pool = await sql.connect(configSGC);
        const result = await pool.request()
            .input('Tipo', sql.NVarChar, tipo || null) // Si no hay tipo, envía null
            .execute('SP_ListarCronogramas');

        res.json(result.recordset);
    } catch (error) {
        console.error("Error listarCronogramas:", error);
        res.status(500).json({ message: error.message });
    }
};

export const eliminarCronograma = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        // Borra la carpeta y todas sus actividades en cascada
        await pool.request().input('ID_Cronograma', sql.Int, id).execute('dbo.SP_EliminarCronograma');
        
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'ELIMINAR', 'Cronogramas', `Eliminó cronograma ID: ${id}`);
        res.json({ mensaje: 'Cronograma eliminado correctamente' });
    } catch (error) { 
        console.error("Error eliminarCronograma:", error);
        res.status(500).json({ mensaje: 'Error al eliminar cronograma' }); 
    }
};

// =====================================================================
// 2. GESTIÓN DE ACTIVIDADES (TAREAS) E INTELIGENCIA DE PROGRAMAS
// =====================================================================

// --- FUNCIÓN CLAVE: AGENDAR DESDE MÓDULOS (Muestreo, Limpieza, etc.) ---
export const crearActividadAgendada = async (req, res) => {
    const { actividad, frecuencia, fechaInicio, idFormulario, programa } = req.body;
    
    try {
        const pool = await getConnection();
        await pool.request()
            .input('NombreActividad', sql.NVarChar, actividad)
            .input('Frecuencia', sql.NVarChar, frecuencia)
            // SQL espera DATE (YYYY-MM-DD), aseguramos que llegue limpio
            .input('FechaInicio', sql.Date, new Date(fechaInicio)) 
            .input('ID_Formulario', sql.Int, idFormulario || null)
            .input('Programa', sql.NVarChar, programa || 'General')
            // Llamamos al SP corregido que inserta en la tabla 'Actividades'
            // y gestiona la creación automática de la carpeta si no existe
            .execute('dbo.SP_CrearActividadProgramada'); 
            
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'Cronogramas', `Agendó actividad: ${actividad} para ${programa}`);
        res.json({ mensaje: 'Actividad programada y sincronizada.' });
    } catch (error) {
        console.error("Error crearActividadAgendada:", error);
        res.status(500).json({ mensaje: 'Error al agendar actividad' });
    }
};

// --- CRUD MANUAL DE ACTIVIDADES (Dentro de una carpeta específica) ---
export const crearActividad = async (req, res) => {
    const { idCronograma, nombreActividad, descripcion, responsable, fechaLimite } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Cronograma', sql.Int, idCronograma)
            .input('Nombre_Actividad', sql.NVarChar, nombreActividad)
            .input('Descripcion', sql.NVarChar, descripcion)
            .input('Responsable', sql.NVarChar, responsable)
            .input('Fecha_Limite', sql.Date, fechaLimite)
            .execute('dbo.SP_CrearActividad');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'Actividades', `Agregó actividad manual: ${nombreActividad}`);
        res.json({ mensaje: 'Actividad creada' });
    } catch (error) { 
        console.error("Error crearActividad:", error);
        res.status(500).json({ mensaje: 'Error al crear actividad' }); 
    }
};

export const editarActividad = async (req, res) => {
    const { id } = req.params;
    const { nombreActividad, descripcion, responsable, fechaLimite } = req.body;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Actividad', sql.Int, id)
            .input('Nombre_Actividad', sql.NVarChar, nombreActividad)
            .input('Descripcion', sql.NVarChar, descripcion)
            .input('Responsable', sql.NVarChar, responsable)
            .input('Fecha_Limite', sql.Date, fechaLimite)
            .execute('dbo.SP_EditarActividad');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'EDITAR', 'Actividades', `Editó actividad ID: ${id}`);
        res.json({ mensaje: 'Actividad actualizada' });
    } catch (error) {
        console.error("Error editarActividad:", error);
        res.status(500).json({ mensaje: 'Error al editar actividad' });
    }
};

export const eliminarActividad = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        await pool.request().input('ID_Actividad', sql.Int, id).execute('dbo.SP_EliminarActividad');
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'ELIMINAR', 'Actividades', `Eliminó actividad ID: ${id}`);
        res.json({ mensaje: 'Actividad eliminada' });
    } catch (error) { 
        console.error("Error eliminarActividad:", error);
        res.status(500).json({ mensaje: 'Error al eliminar actividad' }); 
    }
};

export const obtenerActividades = async (req, res) => {
    const { idCronograma } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request().input('ID_Cronograma', sql.Int, idCronograma).execute('dbo.SP_ListarActividadesPorCronograma');
        res.json(result.recordset);
    } catch (error) { 
        console.error("Error obtenerActividades:", error);
        res.status(500).json({ mensaje: 'Error al obtener actividades' }); 
    }
};

export const obtenerTodasActividades = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ObtenerAgendaGlobal');
        res.json(result.recordset);
    } catch (error) {
        console.error("Error obtenerTodasActividades:", error);
        res.status(500).json({ mensaje: 'Error al cargar agenda global' });
    }
};

// =====================================================================
// 3. GESTIÓN DE ESTADOS Y EVIDENCIAS
// =====================================================================

export const cambiarEstadoActividad = async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Actividad', sql.Int, id)
            .input('NuevoEstado', sql.NVarChar, nuevoEstado)
            .execute('dbo.SP_ActualizarEstadoActividad');
            
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'ESTADO', 'Actividades', `Cambió estado ID ${id} a: ${nuevoEstado}`);
        res.json({ mensaje: 'Estado actualizado' });
    } catch (error) { 
        console.error("Error cambiarEstadoActividad:", error);
        res.status(500).json({ mensaje: 'Error al cambiar estado' }); 
    }
};

export const agregarSeguimiento = async (req, res) => {
    const { id } = req.params;
    const { nota } = req.body;
    
    let urlEvidencia = null;
    if (req.file) {
        // Asegúrate de que esta URL coincida con tu configuración de servidor
        urlEvidencia = `http://localhost:3000/uploads/${req.file.filename}`;
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Actividad', sql.Int, id)
            .input('Nota', sql.NVarChar, nota)
            .input('Url_Evidencia', sql.NVarChar, urlEvidencia)
            .execute('dbo.SP_AgregarSeguimientoActividad');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'SEGUIMIENTO', 'Actividades', `Agregó seguimiento a ID: ${id}`);
        res.json({ mensaje: 'Gestión guardada correctamente' });
    } catch (error) { 
        console.error("Error agregarSeguimiento:", error);
        res.status(500).json({ mensaje: 'Error al agregar seguimiento' }); 
    }
};