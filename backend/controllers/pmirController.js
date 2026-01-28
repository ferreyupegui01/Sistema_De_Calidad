import { getConnection, sql } from '../config/db.js';

// Helper para decimales seguros (evita errores de SQL con strings)
const safeDecimal = (val) => {
    if (!val) return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
};

export const getRecolecciones = async (req, res) => {
    try {
        const pool = await getConnection();
        // Usamos SELECT directo si el SP no existe, o mantenemos tu SP si ya lo tienes
        const result = await pool.request().query("SELECT * FROM RecoleccionResiduos ORDER BY Fecha DESC");
        // Si prefieres usar el SP, descomenta la siguiente línea y comenta la anterior:
        // const result = await pool.request().execute('SP_GET_Recolecciones');
        
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener recolecciones:", error);
        res.status(500).send(error.message);
    }
};

export const createRecoleccion = async (req, res) => {
    try {
        // Multer ya procesó el cuerpo, así que req.body tiene los datos de texto
        const { tipoMaterial, fecha, cantidad, cliente, peso } = req.body;
        
        // Validación básica
        if (!tipoMaterial || !fecha || !cliente) {
            return res.status(400).json({ msg: 'Faltan campos obligatorios.' });
        }

        // Si Multer guardó un archivo, su info está en req.file (NO en req.files)
        let urlDoc = null;
        if (req.file) {
            urlDoc = `/uploads/${req.file.filename}`;
        }

        const pool = await getConnection();
        await pool.request()
            .input('TipoMaterial', sql.NVarChar, tipoMaterial)
            .input('Fecha', sql.Date, fecha)
            .input('Cantidad', sql.Int, parseInt(cantidad) || 0) 
            .input('Cliente', sql.NVarChar, cliente)
            .input('Peso', sql.Decimal(10,2), safeDecimal(peso)) 
            .input('Url_Documento', sql.NVarChar, urlDoc) // Guardamos la URL
            .query(`
                INSERT INTO RecoleccionResiduos 
                (TipoMaterial, Fecha, Cantidad, Cliente, Peso, Url_Documento)
                VALUES 
                (@TipoMaterial, @Fecha, @Cantidad, @Cliente, @Peso, @Url_Documento)
            `);
            // Si prefieres usar SP, cambia .query(...) por .execute('SP_CREATE_Recoleccion')

        res.json({ msg: 'Registro creado exitosamente' });
    } catch (error) {
        console.error("Error al crear recolección:", error);
        res.status(500).json({ message: error.message || 'Error interno del servidor' });
    }
};