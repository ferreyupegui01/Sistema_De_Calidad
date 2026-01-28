import { getConnection, sql } from '../config/db.js';
import { registrarLog } from '../libs/logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 1. CONFIGURACIÓN DE RUTAS BLINDADA
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ESTA ES LA CLAVE: Definimos la ruta de uploads EXACTAMENTE igual que en storage.js
// storage.js está en ../libs/storage.js y usa '../uploads' -> apunta a backend/uploads
// Este archivo está en ../controllers/specializedController.js y usa '../uploads' -> apunta a backend/uploads
const CARPETA_UPLOADS = path.join(__dirname, '../uploads');

// ================= 3. AGUA POTABLE =================

export const registrarVerificacionAgua = async (req, res) => {
    const { puntoToma, medicion } = req.body;
    const idUsuario = req.usuario.id;
    
    if (!req.file) return res.status(400).json({ mensaje: 'Foto obligatoria' });
    
    // Guardamos en BD la ruta relativa simple
    const urlFoto = `uploads/${req.file.filename}`;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Usuario', sql.Int, idUsuario)
            .input('PuntoToma', sql.NVarChar, puntoToma)
            .input('DatosMedicion', sql.NVarChar, medicion)
            .input('UrlFoto', sql.NVarChar, urlFoto)
            .execute('dbo.SP_RegistrarVerificacionAgua');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'REGISTRO', 'Calidad Agua', `Registró toma en: ${puntoToma}`);
        res.json({ mensaje: 'Registrado' });
    } catch (error) { 
        console.error(error);
        res.status(500).json({ mensaje: 'Error al registrar verificación' }); 
    }
};

export const obtenerHistorialAgua = async (req, res) => {
    try {
        const pool = await getConnection();
        const { rol, id } = req.usuario; 
        const result = await pool.request()
            .input('ID_Usuario', sql.Int, (rol==='SuperAdmin'||rol==='AdminCalidad')?null:id)
            .execute('dbo.SP_ListarVerificacionesAgua');
        res.json(result.recordset);
    } catch (error) { res.status(500).json({ mensaje: 'Error al obtener historial' }); }
};

// ================= 4. CAPACITACIÓN KIOSCO =================

export const registrarEvaluacionKiosco = async (req, res) => {
    const { idEvaluacion, nombreEvaluado, calificacion, detalleRespuestas } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Evaluacion', sql.Int, idEvaluacion)
            .input('NombreEvaluado', sql.NVarChar, nombreEvaluado)
            .input('Calificacion', sql.Decimal(4,2), calificacion)
            .input('DetalleJSON', sql.NVarChar, JSON.stringify(detalleRespuestas || []))
            .execute('dbo.SP_RegistrarResultadoKiosco');

        await registrarLog('Kiosco Público', 'Invitado', 'EVALUACION', 'Capacitación', `Evaluado: ${nombreEvaluado}, Nota: ${calificacion}`);
        res.json({ mensaje: 'Evaluación guardada.' });
    } catch (error) {
        console.error("Error Kiosco:", error);
        res.status(500).json({ mensaje: 'Error al guardar' });
    }
};

export const obtenerPreguntasKiosco = async (req, res) => {
    const { idEvaluacion } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('ID_Evaluacion', sql.Int, idEvaluacion)
            .execute('dbo.SP_ListarPreguntasEvaluacion');
        
        const preguntasMap = new Map();
        result.recordset.forEach(row => {
            if (!preguntasMap.has(row.ID_Pregunta_Eval)) {
                preguntasMap.set(row.ID_Pregunta_Eval, {
                    id: row.ID_Pregunta_Eval,
                    pregunta: row.Texto_Pregunta,
                    imagen: row.Url_Imagen, 
                    opciones: []
                });
            }
            preguntasMap.get(row.ID_Pregunta_Eval).opciones.push({
                id: row.ID_Opcion,
                texto: row.Texto_Opcion,
                esCorrecta: row.Es_Correcta
            });
        });
        res.json(Array.from(preguntasMap.values()));
    } catch (error) { res.status(500).json({ mensaje: 'Error al cargar examen' }); }
};

// =========================================================================
// 5. VER FOTO AGUA (SOLUCIÓN DEFINITIVA SIN TOCAR STORAGE)
// =========================================================================
export const verFotoAgua = (req, res) => {
    // 1. Recibimos el parámetro
    let { nombreArchivo } = req.params;

    // 2. LIMPIEZA TOTAL: Eliminamos rutas anteriores si las hubiera
    // Si viene "uploads/foto.png", lo convertimos a "foto.png"
    // Si viene "../../foto.png", lo convertimos a "foto.png"
    nombreArchivo = path.basename(nombreArchivo);

    // 3. Construimos la ruta absoluta usando la misma lógica que storage.js
    const rutaAbsoluta = path.join(CARPETA_UPLOADS, nombreArchivo);

    console.log(`\n🔎 [AGUA] Buscando: ${nombreArchivo}`);
    console.log(`📂 Ruta calculada: ${rutaAbsoluta}`);

    // 4. Verificación física
    if (fs.existsSync(rutaAbsoluta)) {
        console.log(`✅ ¡ARCHIVO ENCONTRADO! Enviando...`);
        
        // Detectar MIME Type
        const ext = path.extname(rutaAbsoluta).toLowerCase();
        let contentType = 'application/octet-stream';
        if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.pdf') contentType = 'application/pdf';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);
        res.sendFile(rutaAbsoluta);
    } else {
        // 5. DIAGNÓSTICO DE ERROR (Solo se ejecuta si falla)
        console.error(`❌ NO ENCONTRADO.`);
        
        // Intentar listar qué hay en la carpeta para ver el error
        if (fs.existsSync(CARPETA_UPLOADS)) {
            console.log(`📋 Archivos que SÍ están en la carpeta uploads:`);
            const archivos = fs.readdirSync(CARPETA_UPLOADS);
            console.log(archivos.slice(0, 10)); // Muestra los primeros 10 para no saturar
            
            // Ver si hay alguno parecido
            const parecido = archivos.find(a => a.includes(nombreArchivo.split('-')[0])); // Buscar coincidencia parcial
            if (parecido) console.log(`💡 ¿Quizás buscabas este?: ${parecido}`);
        } else {
            console.error(`🚨 ALERTA CRÍTICA: La carpeta ${CARPETA_UPLOADS} NO EXISTE.`);
        }

        res.status(404).json({ mensaje: 'Archivo físico no encontrado en el servidor' });
    }
};