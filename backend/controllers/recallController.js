import { getConnection, sql } from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// --- CREAR NUEVA SALIDA ---
export const createSalida = async (req, res) => {
    const { producto, lote, cliente, cantidad, observaciones, fecha_envio } = req.body;
    
    // --- CORRECCIÓN HOSTINGER ---
    // Guardamos nombre de archivo simple para evitar problemas de rutas absolutas en BD
    const urlDocumento = req.file ? `uploads/${req.file.filename}` : null;

    try {
        const pool = await getConnection();
        
        await pool.request()
            .input('Producto', sql.NVarChar, producto)
            .input('Lote', sql.NVarChar, lote)
            .input('Cliente', sql.NVarChar, cliente)
            .input('Cantidad', sql.Decimal(18, 2), cantidad)
            .input('Observaciones', sql.NVarChar, observaciones)
            .input('Url_Documento', sql.NVarChar, urlDocumento)
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

// ==========================================
// VER DOCUMENTO SALIDA (STREAMING ROBUSTO)
// ==========================================
export const verDocumentoSalida = (req, res) => {
    const { nombreArchivo } = req.params;

    console.log(`🔍 [RECALL] Buscando archivo: ${nombreArchivo}`);

    // Seguridad básica
    if (!nombreArchivo || nombreArchivo.includes('..') || nombreArchivo.includes('/') || nombreArchivo.includes('\\')) {
        return res.status(400).json({ mensaje: 'Archivo inválido' });
    }

    const projectRoot = process.cwd();

    // 1. Definir posibles ubicaciones (Local, Producción Root, Producción Subfolder)
    const posiblesRutas = [
        path.join(projectRoot, 'uploads', nombreArchivo),
        path.join(projectRoot, 'backend', 'uploads', nombreArchivo),
        path.resolve(__dirname, '../../uploads', nombreArchivo)
    ];

    let archivoEncontrado = null;

    // 2. Buscar archivo
    for (const ruta of posiblesRutas) {
        if (fs.existsSync(ruta)) {
            archivoEncontrado = ruta;
            break;
        }
    }

    if (archivoEncontrado) {
        console.log(`✅ [RECALL] Archivo encontrado en: ${archivoEncontrado}`);

        // 3. Detectar tipo MIME manualmente para evitar pantalla blanca
        const ext = path.extname(archivoEncontrado).toLowerCase();
        let contentType = 'application/octet-stream';

        if (ext === '.pdf') contentType = 'application/pdf';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';

        // 4. Configurar cabeceras
        res.setHeader('Content-Type', contentType);
        // 'inline' permite ver en el navegador, 'attachment' fuerza descarga
        res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);

        // 5. Enviar stream
        res.sendFile(archivoEncontrado);
    } else {
        console.error(`❌ [RECALL] Archivo NO encontrado. Buscado en:`, posiblesRutas);
        res.status(404).json({ mensaje: 'Documento no encontrado' });
    }
};