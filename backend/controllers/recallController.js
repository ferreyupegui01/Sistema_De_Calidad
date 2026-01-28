import { getConnection, sql } from '../config/db.js';

// --- OBTENER TODAS LAS SALIDAS ---
export const getSalidas = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query('SELECT * FROM Recall_Salidas ORDER BY Fecha_Envio DESC');
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener salidas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// --- CREAR NUEVA SALIDA (CORREGIDO PARA GUARDAR ARCHIVO) ---
export const createSalida = async (req, res) => {
    const { producto, lote, cliente, cantidad, observaciones, fecha_envio } = req.body;
    
    // Capturamos el archivo si existe
    const urlDocumento = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const pool = await getConnection();
        
        await pool.request()
            .input('Producto', sql.NVarChar, producto)
            .input('Lote', sql.NVarChar, lote)
            .input('Cliente', sql.NVarChar, cliente)
            .input('Cantidad', sql.Decimal(18, 2), cantidad) // Ajustado a Decimal según SQL
            .input('Observaciones', sql.NVarChar, observaciones)
            .input('Url_Documento', sql.NVarChar, urlDocumento) // <--- AQUÍ GUARDAMOS LA RUTA
            .input('Fecha_Envio', sql.DateTime, fecha_envio || new Date())
            .query(`
                INSERT INTO Recall_Salidas (
                    Producto, Lote, Cliente, Cantidad, Observaciones, Url_Documento, Fecha_Envio, Fecha_Registro
                )
                VALUES (
                    @Producto, @Lote, @Cliente, @Cantidad, @Observaciones, @Url_Documento, @Fecha_Envio, GETDATE()
                )
            `);

        res.status(201).json({ message: 'Salida registrada correctamente' });
    } catch (error) {
        console.error('Error al crear salida:', error);
        res.status(500).json({ message: 'Error al registrar la salida' });
    }
};