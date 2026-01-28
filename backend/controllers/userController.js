import { getConnection, sql } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { registrarLog } from '../libs/logger.js';
import { enviarCorreoNotificacion } from '../libs/email.js'; 

// --- OBTENER ROLES ---
export const obtenerRoles = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarRoles');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar roles' });
    }
};

// --- REGISTRAR COLABORADOR (CREAR) ---
export const registrarColaborador = async (req, res) => {
    const { cedula, nombre, password, cargo, area, idRol } = req.body;

    if (!cedula || !nombre || !password || !idRol) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const pool = await getConnection();
        const result = await pool.request()
            .input('Cedula', sql.NVarChar, cedula)
            .input('PasswordHash', sql.NVarChar, passwordHash)
            .input('Nombre', sql.NVarChar, nombre)
            .input('Cargo', sql.NVarChar, cargo || 'No especificado')
            .input('Area', sql.NVarChar, area || 'No especificada')
            .input('ID_Rol', sql.Int, idRol)
            .execute('dbo.SP_RegistrarUsuario');

        if (result.recordset[0].ID === -1) {
            return res.status(400).json({ mensaje: 'La cédula ya está registrada' });
        }

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'Usuarios', `Creó nuevo usuario: ${nombre} (Cédula: ${cedula})`);
        res.status(201).json({ mensaje: 'Usuario creado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al registrar usuario' });
    }
};

// --- ACTUALIZAR USUARIO (EDITAR) ---
export const actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    // Aquí recibimos el idRol que envía el ModalEditUser
    const { nombre, cargo, area, idRol } = req.body; 

    if (!nombre || !idRol) {
        return res.status(400).json({ mensaje: 'Nombre y Rol son obligatorios' });
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Usuario', sql.Int, id)
            .input('Nombre', sql.NVarChar, nombre)
            .input('Cargo', sql.NVarChar, cargo || '')
            .input('Area', sql.NVarChar, area || '')
            .input('ID_Rol', sql.Int, idRol) // <--- ENVIAMOS EL ROL AL SP ACTUALIZADO
            .execute('dbo.SP_ActualizarDatosUsuario');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'EDITAR', 'Usuarios', `Actualizó datos del usuario ID: ${id} - Nombre: ${nombre}`);
        res.json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar usuario' });
    }
};

// --- OBTENER COLABORADORES ---
export const obtenerColaboradores = async (req, res) => {
    try {
        const pool = await getConnection();
        // Asegúrate de que este SP devuelva la columna ID_Rol para que el modal sepa cuál pre-seleccionar
        const result = await pool.request().execute('dbo.SP_ListarColaboradores');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
};

// --- CAMBIAR ESTADO (Activar/Inactivar) ---
export const cambiarEstado = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Usuario', sql.Int, id)
            .input('NuevoEstado', sql.Bit, estado)
            .execute('dbo.SP_CambiarEstadoUsuario');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'ESTADO', 'Usuarios', `Cambió estado de usuario ID ${id} a: ${estado ? 'Activo' : 'Inactivo'}`);
        res.json({ mensaje: `Estado actualizado` });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar estado' });
    }
};

// --- OBTENER USUARIO POR ID ---
export const obtenerUsuarioPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('ID_Usuario', sql.Int, id)
            .execute('dbo.SP_ObtenerUsuarioPorID');
        if (result.recordset.length === 0) return res.status(404).json({ mensaje: 'No encontrado' });
        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuario' });
    }
};

// --- RESTABLECER PASSWORD ---
export const restablecerPassword = async (req, res) => {
    const { id } = req.params;
    const { nuevaPassword } = req.body;
    
    if (!nuevaPassword || nuevaPassword.length < 6) return res.status(400).json({ mensaje: 'Mínimo 6 caracteres' });

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(nuevaPassword, salt);

        const pool = await getConnection();
        await pool.request()
            .input('ID_Usuario', sql.Int, id)
            .input('PasswordHash', sql.NVarChar, passwordHash)
            .execute('dbo.SP_RestablecerPassword');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'SEGURIDAD', 'Usuarios', `Restableció contraseña para el usuario ID: ${id}`);
        res.json({ mensaje: 'Contraseña restablecida' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cambiar contraseña' });
    }
};

// --- ACTUALIZAR CORREO (PERFIL) ---
export const actualizarPerfilCorreo = async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;

    try {
        const pool = await getConnection();
        
        // 1. Actualizar en Base de Datos
        await pool.request()
            .input('ID_Usuario', sql.Int, id)
            .input('Email', sql.NVarChar, email)
            .query('UPDATE Usuarios SET Email = @Email WHERE ID_Usuario = @ID_Usuario');

        // 2. Log de Auditoría
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'PERFIL', 'Usuarios', `Actualizó su correo de notificaciones a: ${email}`);

        // 3. ENVIAR CORREO DE CONFIRMACIÓN AUTOMÁTICO
        const asunto = "Correo Configurado Exitosamente";
        const mensaje = `Hola ${req.usuario.nombre}, hemos verificado tu dirección de correo electrónico. A partir de ahora recibirás aquí las notificaciones de vencimientos, reportes y alertas del Sistema de Gestión.`;
        
        enviarCorreoNotificacion(email, asunto, mensaje);

        res.json({ mensaje: 'Correo actualizado y notificación de prueba enviada.', email });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar correo' });
    }
};