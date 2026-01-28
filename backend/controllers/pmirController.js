import { getConnection, sql } from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper para decimales seguros
const safeDecimal = (val) => {
    if (!val) return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
};

export const getRecolecciones = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM RecoleccionResiduos ORDER BY Fecha DESC");
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener recolecciones:", error);
        res.status(500).send(error.message);
    }
};

export const createRecoleccion = async (req, res) => {
    try {
        const { tipoMaterial, fecha, cantidad, cliente, peso } = req.body;
        
        if (!tipoMaterial || !fecha || !cliente) {
            return res.status(400).json({ msg: 'Faltan campos obligatorios.' });
        }

        // --- CORRECCIÓN HOSTINGER: RUTA RELATIVA ---
        let urlDoc = null;
        if (req.file) {
            // Guardamos "uploads/archivo.pdf"
            urlDoc = `uploads/${req.file.filename}`;
        }

        const pool = await getConnection();
        await pool.request()
            .input('TipoMaterial', sql.NVarChar, tipoMaterial)
            .input('Fecha', sql.Date, fecha)
            .input('Cantidad', sql.Int, parseInt(cantidad) || 0) 
            .input('Cliente', sql.NVarChar, cliente)
            .input('Peso', sql.Decimal(10,2), safeDecimal(peso)) 
            .input('Url_Documento', sql.NVarChar, urlDoc) 
            .query(`
                INSERT INTO RecoleccionResiduos 
                (TipoMaterial, Fecha, Cantidad, Cliente, Peso, Url_Documento)
                VALUES 
                (@TipoMaterial, @Fecha, @Cantidad, @Cliente, @Peso, @Url_Documento)
            `);

        res.json({ msg: 'Registro creado exitosamente' });
    } catch (error) {
        console.error("Error al crear recolección:", error);
        res.status(500).json({ message: error.message || 'Error interno del servidor' });
    }
};

// ==========================================
// VER EVIDENCIA PMIR (STREAMING ROBUSTO)
// ==========================================
// ==========================================
export const verEvidenciaPMIR = (req, res) => {
    const { nombreArchivo } = req.params;

    console.log(`🔍 [PMIR] Solicitando archivo: ${nombreArchivo}`);

    // Limpieza básica de seguridad
    if (!nombreArchivo || nombreArchivo.includes('..')) {
        return res.status(400).json({ mensaje: 'Nombre de archivo inválido' });
    }

    const projectRoot = process.cwd(); 
    
    // Rutas posibles donde puede estar el archivo
    const posiblesRutas = [
        path.join(projectRoot, 'uploads', nombreArchivo),
        path.join(projectRoot, 'backend', 'uploads', nombreArchivo),
        path.join(__dirname, '../../uploads', nombreArchivo)
    ];

    let archivoEncontrado = null;

    // Buscar en todas las rutas posibles
    for (const ruta of posiblesRutas) {
        if (fs.existsSync(ruta)) {
            archivoEncontrado = ruta;
            break;
        }
    }

    if (archivoEncontrado) {
        console.log(`✅ [PMIR] Archivo encontrado en: ${archivoEncontrado}`);
        
        // 1. Detectar extensión manualmente si no usas librerías
        const ext = path.extname(archivoEncontrado).toLowerCase();
        let contentType = 'application/octet-stream'; // Por defecto

        if (ext === '.pdf') contentType = 'application/pdf';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';

        // 2. Establecer cabeceras para que el navegador sepa qué hacer
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`); // 'inline' para ver, 'attachment' para descargar

        // 3. Enviar archivo
        res.sendFile(archivoEncontrado);
    } else {
        console.error(`❌ [PMIR] Archivo NO encontrado. Buscado en:`, posiblesRutas);
        res.status(404).json({ mensaje: 'Documento no encontrado en el servidor' });
    }
};