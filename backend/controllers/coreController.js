import { getConnection, sql } from '../config/db.js';
import { registrarLog } from '../libs/logger.js'; 

// --- CATEGORÍAS ---
export const crearCategoria = async (req, res) => {
    const { nombre } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('Nombre', sql.NVarChar, nombre)
            .execute('dbo.SP_CrearCategoria');
        
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'Categorías', `Creó categoría: ${nombre}`);
        res.status(201).json({ mensaje: 'Categoría creada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear categoría' });
    }
};

export const listarCategorias = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarCategorias');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar categorías' });
    }
};

// --- ACTIVOS ---
export const crearActivo = async (req, res) => {
    const { nombre, idCategoria, codigo, ubicacion } = req.body;
    if (!nombre || !idCategoria || !codigo) return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    try {
        const pool = await getConnection();
        await pool.request()
            .input('Nombre', sql.NVarChar, nombre)
            .input('ID_Categoria', sql.Int, idCategoria)
            .input('Codigo', sql.NVarChar, codigo)
            .input('Ubicacion', sql.NVarChar, ubicacion)
            .execute('dbo.SP_CrearActivo');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'Activos', `Creó activo: ${nombre} (${codigo})`);
        res.status(201).json({ mensaje: 'Activo creado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear activo' });
    }
};

export const listarActivos = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarActivos');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar activos' });
    }
};

export const actualizarActivo = async (req, res) => {
    const { id } = req.params;
    const { nombre, idCategoria, codigo, ubicacion } = req.body;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Activo', sql.Int, id)
            .input('Nombre', sql.NVarChar, nombre)
            .input('ID_Categoria', sql.Int, idCategoria)
            .input('Codigo', sql.NVarChar, codigo)
            .input('Ubicacion', sql.NVarChar, ubicacion)
            .execute('dbo.SP_ActualizarActivo');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'EDITAR', 'Activos', `Editó activo ID: ${id} - ${nombre}`);
        res.json({ mensaje: 'Activo actualizado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar activo' });
    }
};

export const cambiarEstadoActivo = async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado } = req.body;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Activo', sql.Int, id)
            .input('NuevoEstado', sql.Bit, nuevoEstado)
            .execute('dbo.SP_CambiarEstadoActivo');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'ESTADO', 'Activos', `Cambió estado activo ID ${id} a: ${nuevoEstado}`);
        res.json({ mensaje: `Estado del activo actualizado` });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cambiar estado' });
    }
};

// --- FORMULARIOS ---
export const crearFormularioCompleto = async (req, res) => {
    const { idCategoria, titulo, codigo, descripcion, esVisible, preguntas, programa } = req.body;
    
    if (!titulo || !idCategoria) return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
    
    try {
        const pool = await getConnection();
        const resultHeader = await pool.request()
            .input('ID_Categoria', sql.Int, idCategoria)
            .input('Titulo', sql.NVarChar, titulo)
            .input('Codigo', sql.NVarChar, codigo || '')
            .input('Descripcion', sql.NVarChar, descripcion || '')
            .input('EsVisible', sql.Bit, esVisible !== undefined ? esVisible : false)
            .input('Programa', sql.NVarChar, programa || 'General')
            .output('NewId', sql.Int)
            .execute('dbo.SP_CrearFormularioCabecera');
        
        const idFormulario = resultHeader.output.NewId;

        if (preguntas && preguntas.length > 0) {
            for (let i = 0; i < preguntas.length; i++) {
                const p = preguntas[i];
                const textoPregunta = typeof p === 'object' && p.texto ? p.texto : p;
                const tipoPregunta = typeof p === 'object' && p.tipo ? p.tipo : 'BOOL';

                await pool.request()
                    .input('ID_Formulario', sql.Int, idFormulario)
                    .input('Texto', sql.NVarChar, textoPregunta)
                    .input('Orden', sql.Int, i + 1)
                    .input('Tipo', sql.NVarChar, tipoPregunta)
                    .execute('dbo.SP_AgregarPregunta');
            }
        }

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'Formularios', `Creó formulario: ${titulo} (${codigo}) para programa: ${programa}`);
        res.status(201).json({ mensaje: 'Formulario creado exitosamente', id: idFormulario });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear formulario completo' });
    }
};

// --- LISTAR FORMULARIOS (CORREGIDA PARA ROL) ---
export const listarFormularios = async (req, res) => {
    try {
        const pool = await getConnection();
        
        // 1. Obtener Rol y normalizarlo (mayúsculas)
        const rolRaw = req.usuario ? req.usuario.rol : '';
        const rolUsuario = rolRaw.trim().toUpperCase();

        console.log(`[Forms] Usuario: ${req.usuario?.nombre} | Rol: ${rolUsuario}`);

        // 2. Query Base
        let query = `
            SELECT F.ID_Formulario, F.Titulo, F.Codigo, F.Descripcion, F.Es_Visible_Colaborador, F.Programa, C.Nombre as Categoria, C.ID_Categoria
            FROM Formularios F
            LEFT JOIN Categorias_Form C ON F.ID_Categoria = C.ID_Categoria
        `;

        // 3. Filtro Inteligente
        // Definimos quiénes son los administradores que pueden ver todo
        const esJefe = ['ADMINCALIDAD', 'SUPERADMIN', 'ADMINISTRADOR', 'ADMIN'].includes(rolUsuario);

        if (!esJefe) {
            // Si NO es jefe (es Colaborador), ocultamos los formularios no visibles
            query += ' WHERE F.Es_Visible_Colaborador = 1';
        }

        query += ' ORDER BY F.Fecha_Creacion DESC';

        const result = await pool.request().query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error("Error al listar formularios:", error);
        res.status(500).json({ mensaje: 'Error al listar formularios' });
    }
};

export const actualizarFormulario = async (req, res) => {
    const { id } = req.params;
    const { titulo, codigo, descripcion, idCategoria, programa } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Formulario', sql.Int, id)
            .input('Titulo', sql.NVarChar, titulo)
            .input('Codigo', sql.NVarChar, codigo)
            .input('Descripcion', sql.NVarChar, descripcion)
            .input('ID_Categoria', sql.Int, idCategoria)
            .input('Programa', sql.NVarChar, programa)
            .execute('dbo.SP_ActualizarFormulario');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'EDITAR', 'Formularios', `Actualizó formulario ID ${id}: ${titulo}`);
        res.json({ mensaje: 'Formulario actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar formulario' });
    }
};

export const eliminarFormulario = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Formulario', sql.Int, id)
            .execute('dbo.SP_EliminarFormularioCompleto');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'ELIMINAR', 'Formularios', `Eliminó formulario ID ${id} y su contenido.`);
        res.json({ mensaje: 'Formulario eliminado completamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar formulario' });
    }
};

export const toggleVisibilidad = async (req, res) => {
    const { id } = req.params;
    const { esVisible } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Formulario', sql.Int, id)
            .input('EsVisible', sql.Bit, esVisible)
            .execute('dbo.SP_CambiarVisibilidadForm');
        
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'VISIBILIDAD', 'Formularios', `Cambió visibilidad Form ID ${id} a: ${esVisible}`);
        res.json({ mensaje: 'Visibilidad actualizada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar visibilidad' });
    }
};

// --- PREGUNTAS ---
export const obtenerPreguntas = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('ID_Formulario', sql.Int, id)
            .execute('dbo.SP_ObtenerPreguntasPorFormulario');
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener preguntas:", error);
        res.status(500).json({ mensaje: 'Error al obtener preguntas' });
    }
};

export const agregarPreguntaIndividual = async (req, res) => {
    const { idFormulario, texto, tipo } = req.body;
    const tipoPregunta = tipo || 'BOOL'; 

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Formulario', sql.Int, idFormulario)
            .input('Texto', sql.NVarChar, texto)
            .input('Orden', sql.Int, 99)
            .input('Tipo', sql.NVarChar, tipoPregunta) 
            .execute('dbo.SP_AgregarPregunta');
        
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'EDITAR', 'Formularios', `Agregó pregunta (${tipoPregunta}) a Form ID ${idFormulario}`);

        res.json({ mensaje: 'Pregunta agregada' });
    } catch (error) {
        console.error("Error al agregar pregunta:", error);
        res.status(500).json({ mensaje: 'Error al agregar pregunta' });
    }
};

export const borrarPreguntaIndividual = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Pregunta', sql.Int, id)
            .execute('dbo.SP_EliminarPregunta');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'EDITAR', 'Formularios', `Eliminó pregunta ID ${id}`);
        res.json({ mensaje: 'Pregunta eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar pregunta' });
    }
};

// --- ASIGNACIÓN ---
export const asignarFormulario = async (req, res) => {
    const { idActivo, idFormulario } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Activo', sql.Int, idActivo)
            .input('ID_Formulario', sql.Int, idFormulario)
            .execute('dbo.SP_AsignarFormularioAActivo');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'ASIGNAR', 'Core', `Asignó Form ID ${idFormulario} a Activo ID ${idActivo}`);
        res.json({ mensaje: 'Asignación correcta' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al asignar' });
    }
};

export const obtenerFormsDeActivo = async (req, res) => {
    const { idActivo } = req.params;
    try {
        const pool = await getConnection();
        
        // 1. DETECTAR QUIÉN PIDE LOS DATOS
        // Si req.usuario no existe (ej. error de token), asumimos rol vacío
        const rolRaw = req.usuario ? req.usuario.rol : '';
        const rolUsuario = rolRaw.trim().toUpperCase();

        // Lista de roles con "Superpoderes"
        const esJefe = ['ADMINCALIDAD', 'SUPERADMIN', 'ADMINISTRADOR', 'ADMIN'].includes(rolUsuario);

        console.log(`[FormsActivo] Usuario: ${req.usuario?.nombre} | Rol: ${rolUsuario} | Es Jefe: ${esJefe}`);

        // 2. EJECUTAR EL SP (Ahora trae TODOS los formularios de la categoría)
        const result = await pool.request()
            .input('ID_Activo', sql.Int, idActivo)
            .execute('dbo.SP_ObtenerFormsPorActivo');
            
        let formularios = result.recordset;

        // 3. FILTRAR POR SOFTWARE
        if (esJefe) {
            // SI ES ADMIN: Le mostramos todo (incluso los ocultos)
            res.json(formularios);
        } else {
            // SI ES COLABORADOR: Filtramos manualmente los que no son visibles
            const visibles = formularios.filter(f => f.Es_Visible_Colaborador === true || f.Es_Visible_Colaborador === 1);
            res.json(visibles);
        }

    } catch (error) {
        console.error("Error obteniendo forms del activo:", error);
        res.status(500).json({ mensaje: 'Error al obtener formularios del activo' });
    }
};
// --- TARJETAS DINÁMICAS ---
export const listarTarjetas = async (req, res) => {
    const { modulo } = req.params; 
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('Modulo', sql.NVarChar, modulo)
            .execute('dbo.SP_ListarTarjetas');
        res.json(result.recordset);
    } catch (error) { res.status(500).json({ mensaje: 'Error al listar tarjetas' }); }
};

export const crearTarjeta = async (req, res) => {
    const { modulo, titulo, descripcion, color, icono } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('Modulo', sql.NVarChar, modulo)
            .input('Titulo', sql.NVarChar, titulo)
            .input('Descripcion', sql.NVarChar, descripcion)
            .input('Color', sql.NVarChar, color)
            .input('Icono', sql.NVarChar, icono)
            .execute('dbo.SP_CrearTarjeta');
        
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'Config', `Creó tarjeta ${titulo} en ${modulo}`);
        res.json({ mensaje: 'Tarjeta creada' });
    } catch (error) { res.status(500).json({ mensaje: 'Error al crear tarjeta' }); }
};

export const eliminarTarjeta = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        await pool.request().input('ID_Tarjeta', sql.Int, id).execute('dbo.SP_EliminarTarjeta');
        
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'ELIMINAR', 'Config', `Eliminó tarjeta ID ${id}`);
        res.json({ mensaje: 'Tarjeta eliminada' });
    } catch (error) { res.status(500).json({ mensaje: 'Error al eliminar' }); }
};