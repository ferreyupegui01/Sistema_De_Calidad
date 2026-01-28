import { getConnection, sql } from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Configuración de rutas seguras
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- OBTENER LISTADO ---
export const getActas = async (req, res) => {
    try {
        const pool = await getConnection();
        // Ordenamos por número descendente para ver la última primero
        const result = await pool.request().query(`
            SELECT * FROM Actas_Destruccion 
            ORDER BY TRY_CAST(Numero_Acta AS INT) DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener actas:", error);
        res.status(500).json({ message: 'Error al obtener actas de la base de datos' });
    }
};

// --- CREAR ACTA (CON FOTOS REALES) ---
export const createActa = async (req, res) => {
    const { 
        sede, testigos, producto, cantidad, 
        bodega, novedad, elaborado_por, revisado_por, aprobado_por,
        codigo_formato,
        aplica_saave, 
        nota_saave 
    } = req.body;
    
    // Convertir a Bit (1 o 0)
    const saaveBit = (aplica_saave === 'true' || aplica_saave === true || aplica_saave === 1) ? 1 : 0;
    const notaFinal = saaveBit === 1 ? (nota_saave || 'SAAVE 1370 Doc realizado por operaciones en sofsin') : '';

    // --- CORRECCIÓN HOSTINGER: RUTAS RELATIVAS ---
    // req.files viene de upload.array('fotos', 4)
    const files = req.files || [];
    
    // Guardamos "uploads/archivo.jpg" en lugar de "/uploads/..." o "http://..."
    const foto1 = files[0] ? `uploads/${files[0].filename}` : null;
    const foto2 = files[1] ? `uploads/${files[1].filename}` : null;
    const foto3 = files[2] ? `uploads/${files[2].filename}` : null;
    const foto4 = files[3] ? `uploads/${files[3].filename}` : null;

    try {
        const pool = await getConnection();

        // 1. CALCULAR EL SIGUIENTE NÚMERO
        const resultNum = await pool.request().query(`
            SELECT ISNULL(MAX(TRY_CAST(Numero_Acta AS INT)), 0) + 1 AS SiguienteNumero 
            FROM Actas_Destruccion 
            WHERE ISNUMERIC(Numero_Acta) = 1
        `);
        
        let nuevoNumero = resultNum.recordset[0].SiguienteNumero;
        const numeroString = nuevoNumero.toString();

        // 2. INSERTAR DATOS
        await pool.request()
            .input('Numero_Acta', sql.NVarChar, numeroString)
            .input('Codigo_Formato', sql.NVarChar, codigo_formato || 'FT-SGC-019')
            .input('Sede', sql.NVarChar, sede)
            .input('Testigos', sql.NVarChar, testigos)
            .input('Producto', sql.NVarChar, producto)
            .input('Cantidad', sql.NVarChar, cantidad)
            .input('Bodega', sql.NVarChar, bodega)
            .input('Novedad', sql.NVarChar, novedad)
            .input('Url_Foto1', sql.NVarChar, foto1)
            .input('Url_Foto2', sql.NVarChar, foto2)
            .input('Url_Foto3', sql.NVarChar, foto3)
            .input('Url_Foto4', sql.NVarChar, foto4)
            .input('Elaborado_Por', sql.NVarChar, elaborado_por)
            .input('Revisado_Por', sql.NVarChar, revisado_por)
            .input('Aprobado_Por', sql.NVarChar, aprobado_por)
            .input('Aplica_Saave', sql.Bit, saaveBit)
            .input('Nota_Saave', sql.NVarChar, notaFinal)
            .query(`
                INSERT INTO Actas_Destruccion 
                (Numero_Acta, Codigo_Formato, Sede, Testigos, Producto, Cantidad, Bodega_Procedente, Novedad, 
                 Url_Foto1, Url_Foto2, Url_Foto3, Url_Foto4, 
                 Elaborado_Por, Revisado_Por, Aprobado_Por, Aplica_Saave, Nota_Saave, Fecha, Empresa)
                VALUES 
                (@Numero_Acta, @Codigo_Formato, @Sede, @Testigos, @Producto, @Cantidad, @Bodega, @Novedad, 
                 @Url_Foto1, @Url_Foto2, @Url_Foto3, @Url_Foto4, 
                 @Elaborado_Por, @Revisado_Por, @Aprobado_Por, @Aplica_Saave, @Nota_Saave, GETDATE(), 'Empaquetados El Trece')
            `);

        res.status(201).json({ message: `Acta #${numeroString} creada correctamente` });
    } catch (error) {
        console.error('Error creando acta:', error);
        res.status(500).json({ message: 'Error al guardar en base de datos.' });
    }
};

// ==========================================
// NUEVO: VER FOTO ACTA (STREAMING)
// ==========================================
export const verFotoActa = (req, res) => {
    const { nombreArchivo } = req.params;

    if (!nombreArchivo || nombreArchivo.includes('..') || nombreArchivo.includes('/') || nombreArchivo.includes('\\')) {
        return res.status(400).json({ mensaje: 'Nombre de archivo inválido' });
    }

    const rutaFisica = path.resolve(__dirname, '../uploads', nombreArchivo);

    if (fs.existsSync(rutaFisica)) {
        res.sendFile(rutaFisica);
    } else {
        res.status(404).json({ mensaje: 'Foto no encontrada en el servidor' });
    }
};