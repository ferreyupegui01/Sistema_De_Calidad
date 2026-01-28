// backend/createAdmin.js
import bcrypt from 'bcryptjs';
import { getConnection, sql } from '../config/db.js';

const crearSuperAdmin = async () => {
    console.log('🔄 Iniciando creación de Super Admin...');

    const cedula = '1001';
    const passwordPlana = '123456';
    const nombre = 'Super Admin';
    const rol = 'SuperAdmin';

    try {
        // 1. Generar el Hash usando la misma librería del proyecto
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passwordPlana, salt);

        console.log('🔑 Contraseña encriptada correctamente.');

        const pool = await getConnection();

        // 2. Verificar si existe y BORRARLO para crearlo desde cero (limpieza total)
        await pool.request()
            .input('Cedula', sql.NVarChar, cedula)
            .query("DELETE FROM Usuarios WHERE Cedula = @Cedula");

        // 3. Insertar el usuario nuevo
        await pool.request()
            .input('Cedula', sql.NVarChar, cedula)
            .input('PasswordHash', sql.NVarChar, passwordHash)
            .input('Nombre', sql.NVarChar, nombre)
            .input('Rol', sql.NVarChar, rol)
            .query(`
                INSERT INTO Usuarios (Cedula, Password_Hash, Nombre_Completo, Rol, Estado)
                VALUES (@Cedula, @PasswordHash, @Nombre, @Rol, 1)
            `);

        console.log('✅ ¡Usuario Admin creado/reseteado con éxito!');
        console.log('-------------------------------------------');
        console.log(`👤 Cédula: ${cedula}`);
        console.log(`🔑 Contraseña: ${passwordPlana}`);
        console.log('-------------------------------------------');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error al crear admin:', error);
        process.exit(1);
    }
};

crearSuperAdmin();