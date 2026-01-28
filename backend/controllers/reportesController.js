import { getConnection, sql } from '../config/db.js';
import { registrarLog } from '../libs/logger.js';
import { enviarCorreoNotificacion } from '../libs/email.js';

// ==========================================
// 1. CREAR REPORTE (Con Foto, Notificación y Correo)
// ==========================================
export const crearReporte = async (req, res) => {
    try {
        const { idActivo, idFormulario, respuestas, observaciones } = req.body;
        const idUsuario = req.usuario.id;

        if (!idActivo || !idFormulario || !respuestas) {
            return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
        }

        let respuestasParsed;
        try {
            respuestasParsed = JSON.parse(respuestas);
        } catch (e) {
            return res.status(400).json({ mensaje: 'Formato de respuestas inválido' });
        }

        let urlEvidencia = null;
        if (req.file) {
            urlEvidencia = `http://localhost:3000/uploads/${req.file.filename}`;
        }

        // --- CORRECCIÓN CRÍTICA AQUÍ ---
        // Validación robusta: Convertimos tipo a mayúsculas y chequeamos 'false' en varios formatos
        const tieneFallas = respuestasParsed.some(r => {
            const tipoNormalizado = (r.tipo || '').toUpperCase();
            // Es falla si es BOOL y cumple es falso (boolean, string 'false' o 0)
            return tipoNormalizado === 'BOOL' && (r.cumple === false || r.cumple === 'false' || r.cumple === 0);
        });
        // -------------------------------
        
        const pool = await getConnection();

        // 1. Insertar Cabecera
        const resultHeader = await pool.request()
            .input('ID_Usuario', sql.Int, idUsuario)
            .input('ID_Activo', sql.Int, idActivo)
            .input('ID_Formulario', sql.Int, idFormulario)
            .input('TieneFallas', sql.Bit, tieneFallas) // Ahora sí enviará true correctamente
            .input('UrlEvidencia', sql.NVarChar, urlEvidencia)
            .input('Observaciones', sql.NVarChar, observaciones || '')
            .output('NewId', sql.Int)
            .execute('dbo.SP_CrearReporteCabecera');
        
        const idReporte = resultHeader.output.NewId;

        // 2. Insertar Detalles
        for (const r of respuestasParsed) {
            await pool.request()
                .input('ID_Reporte', sql.Int, idReporte)
                .input('ID_Pregunta', sql.Int, r.idPregunta)
                // Aseguramos que si es TEXTO, siempre guarde bit 1 (Cumple), si es BOOL guarde el valor real
                .input('Cumple', sql.Bit, (r.tipo && r.tipo.toUpperCase() === 'TEXT') ? 1 : r.cumple)
                .input('Respuesta_Texto', sql.NVarChar, r.respuestaTexto || null)
                .execute('dbo.SP_InsertarDetalleReporte');
        }

        // --- 3. NOTIFICACIONES (BD + EMAIL) ---
        const tituloNotif = tieneFallas ? '⚠️ Reporte con Fallas' : 'Nuevo Reporte Operativo';
        const mensajeNotif = `El usuario ${req.usuario.nombre} ha registrado el reporte #${idReporte} (Activo ID: ${idActivo}). ${tieneFallas ? 'Se detectaron NO conformidades.' : 'Todo conforme.'}`;
        
        // A) Insertar Notificación en BD
        await pool.request()
            .input('Titulo', sql.NVarChar, tituloNotif)
            .input('Mensaje', sql.NVarChar, mensajeNotif)
            .input('Tipo', sql.NVarChar, tieneFallas ? 'Alerta' : 'Reporte')
            .input('RolDestino', sql.NVarChar, 'AdminCalidad') 
            .input('Enlace', sql.NVarChar, '/admin/reportes')
            .execute('dbo.SP_CrearNotificacion');

        // B) Enviar Correo a Admins
        const adminsResult = await pool.request()
            .query(`
                SELECT U.Email 
                FROM Usuarios U
                INNER JOIN Roles R ON U.ID_Rol = R.ID_Rol
                WHERE (R.Nombre = 'AdminCalidad' OR R.Nombre = 'SuperAdmin') 
                AND U.Email IS NOT NULL
            `);
        
        const correosAdmins = adminsResult.recordset.map(u => u.Email);
        
        // Solo enviamos correo si hay fallas o es política de la empresa (aquí lo dejo para todos)
        correosAdmins.forEach(email => {
            enviarCorreoNotificacion(email, tituloNotif, mensajeNotif);
        });

        // 4. Log
        const estadoReporte = tieneFallas ? 'CON FALLAS' : 'CONFORME';
        await registrarLog(
            req.usuario.nombre, 
            req.usuario.rol, 
            'REPORTE', 
            'Operativo', 
            `Creó reporte ID ${idReporte} para Activo ID ${idActivo}. Estado: ${estadoReporte}`
        );

        res.status(201).json({ 
            mensaje: 'Reporte registrado exitosamente', 
            idReporte, 
            tieneFallas 
        });

    } catch (error) {
        console.error("Error al crear reporte:", error);
        res.status(500).json({ mensaje: 'Error interno al guardar el reporte' });
    }
};

export const listarReportes = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarReportes');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener historial' });
    }
};

export const obtenerDetalleReporte = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request().input('ID_Reporte', sql.Int, id).execute('dbo.SP_ObtenerDetalleReporte');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener detalle' });
    }
};

export const verificarReporte = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        await pool.request().input('ID_Reporte', sql.Int, id).execute('dbo.SP_VerificarReporte');
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'VERIFICAR', 'Reportes', `Verificó reporte ID: ${id}`);
        res.json({ mensaje: 'Reporte verificado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al verificar reporte' });
    }
};