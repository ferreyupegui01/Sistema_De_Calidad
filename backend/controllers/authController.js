import { getConnection, sql } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registrarLog } from '../libs/logger.js'; 

export const login = async (req, res) => {
    const { cedula, password } = req.body;

    if (!cedula || !password) {
        return res.status(400).json({ mensaje: 'Por favor ingrese cédula y contraseña' });
    }

    try {
        const pool = await getConnection();
        
        // 2. Ejecutar el Procedimiento Almacenado (Ahora trae el Email)
        const result = await pool.request()
            .input('Cedula', sql.NVarChar, cedula)
            .execute('dbo.SP_ValidarLogin');

        if (result.recordset.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas (Usuario no existe)' });
        }

        const usuario = result.recordset[0];

        if (!usuario.Estado) {
            return res.status(403).json({ mensaje: 'Usuario inactivo. Contacte al administrador.' });
        }

        const isMatch = await bcrypt.compare(password, usuario.Password_Hash);
        if (!isMatch) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas (Contraseña incorrecta)' });
        }

        // 6. Generar Token (Opcional: puedes incluir el email en el token si quieres, pero no es estricto)
        const token = jwt.sign(
            { id: usuario.ID_Usuario, rol: usuario.Rol, nombre: usuario.Nombre_Completo }, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' }
        );

        // --- REGISTRAR LOG ---
        await registrarLog(
            usuario.Nombre_Completo, 
            usuario.Rol, 
            'LOGIN', 
            'Autenticación', 
            `Inicio de sesión exitoso desde IP: ${req.ip || 'Desconocida'}`
        );

        // 7. Respuesta exitosa (AQUÍ AGREGAMOS EL EMAIL)
        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: usuario.ID_Usuario,
                cedula: usuario.Cedula, // Útil tenerlo
                nombre: usuario.Nombre_Completo,
                rol: usuario.Rol,
                email: usuario.Email // <--- ¡AQUÍ ESTÁ LA SOLUCIÓN! Se envía al frontend
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
    }
};