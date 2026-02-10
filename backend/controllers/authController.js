import { getConnection, sql } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registrarLog } from '../libs/logger.js'; 

export const login = async (req, res) => {
    // 1. Extracción de datos (Deben coincidir con el frontend)
    const { cedula, password } = req.body;

    // 2. Validación básica
    if (!cedula || !password) {
        return res.status(400).json({ mensaje: 'Por favor ingrese cédula y contraseña' });
    }

    try {
        const pool = await getConnection();
        
        // 3. Ejecutar SP (Asumiendo que el SP espera @Cedula)
        const result = await pool.request()
            .input('Cedula', sql.NVarChar, cedula)
            .execute('dbo.SP_ValidarLogin');

        // 4. Verificar existencia del usuario
        if (result.recordset.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas (Usuario no encontrado)' });
        }

        const usuario = result.recordset[0];

        // 5. Verificar estado activo
        if (!usuario.Estado) {
            return res.status(403).json({ mensaje: 'Usuario inactivo. Contacte al administrador.' });
        }

        // 6. Verificar contraseña
        const isMatch = await bcrypt.compare(password, usuario.Password_Hash);
        if (!isMatch) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas (Contraseña incorrecta)' });
        }

        // 7. Generar Token
        const token = jwt.sign(
            { 
                id: usuario.ID_Usuario, 
                rol: usuario.Rol, 
                nombre: usuario.Nombre_Completo 
            }, 
            process.env.JWT_SECRET || 'secretkey', 
            { expiresIn: '8h' }
        );

        // 8. Registrar Log
        await registrarLog(
            usuario.Nombre_Completo, 
            usuario.Rol, 
            'LOGIN', 
            'Autenticación', 
            `Inicio de sesión exitoso desde IP: ${req.ip || 'Desconocida'}`
        );

        // 9. Respuesta Final
        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: usuario.ID_Usuario,
                cedula: usuario.Cedula,
                nombre: usuario.Nombre_Completo,
                rol: usuario.Rol,
                email: usuario.Email,
                area: usuario.Area
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};