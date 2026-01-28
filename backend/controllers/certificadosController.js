import { getConnection, sql } from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Configuración de rutas seguras para manejo de archivos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// 1. LISTAR PLANTILLAS
// =========================================================================
export const listarPlantillas = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarPlantillas_Relacional');
        
        const plantillasMapeadas = result.recordset.map(row => {
            let estructura = [];
            try {
                const rawJson = row.Estructura_JSON_Reconstruida;
                if (rawJson) {
                    estructura = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

                    if (Array.isArray(estructura)) {
                        estructura = estructura.map(seccion => {
                            // Limpieza de columnas y filas para evitar errores en frontend
                            if (seccion.tipo === 'tabla') {
                                if (seccion.columnas_obj) {
                                    seccion.columnas = seccion.columnas_obj.map(c => c.Etiqueta);
                                    delete seccion.columnas_obj;
                                }
                                if (typeof seccion.filas === 'string') {
                                    try { seccion.filas = JSON.parse(seccion.filas); } catch (e) { seccion.filas = []; }
                                }
                                if (!Array.isArray(seccion.filas)) seccion.filas = [];
                            }
                            seccion.fijo = Boolean(seccion.fijo);
                            return seccion;
                        });
                    }
                }
            } catch (e) {
                console.error("Error parseando JSON ID " + row.ID_Plantilla, e);
                estructura = [];
            }

            return {
                ID_Plantilla: row.ID_Plantilla,
                Nombre: row.Nombre,
                Fecha_Creacion: row.Fecha_Creacion,
                Estructura_JSON: estructura 
            };
        });

        res.json(plantillasMapeadas);
    } catch (error) {
        console.error("Error al listar plantillas:", error);
        res.status(500).json({ mensaje: 'Error al listar plantillas' });
    }
};

// =========================================================================
// 2. GUARDAR PLANTILLA
// =========================================================================
export const guardarPlantilla = async (req, res) => {
    const { nombre, estructura, id } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('Nombre', sql.NVarChar, nombre)
            .input('EstructuraJSON', sql.NVarChar, JSON.stringify(estructura))
            .input('ID_Plantilla', sql.Int, id || null)
            .execute('dbo.SP_GuardarPlantilla_Relacional');
        
        res.json({ mensaje: 'Plantilla guardada correctamente' });
    } catch (error) {
        console.error("Error al guardar plantilla:", error);
        res.status(500).json({ mensaje: 'Error al guardar plantilla' });
    }
};

// =========================================================================
// 3. REGISTRAR GENERACIÓN (Optimizado para Hostinger)
// =========================================================================
export const registrarGeneracion = async (req, res) => {
    const archivo = req.file; 
    let { idPlantilla, lote, cliente, datos } = req.body;

    // --- CORRECCIÓN CRÍTICA: RUTA RELATIVA ---
    // Guardamos solo el nombre del archivo si existe
    let urlPDF = archivo ? `uploads/${archivo.filename}` : null;

    let listaValores = [];
    
    try {
        const dataObj = JSON.parse(datos); 

        // --- LÓGICA INTELIGENTE PARA EXTRAER LOTE Y CLIENTE ---
        if (!lote || ['undefined', 'null', 'N/A', 'S/L'].includes(lote)) {
            lote = 'N/A';
            if (dataObj.form) {
                for (const [seccion, contenido] of Object.entries(dataObj.form)) {
                    if (typeof contenido === 'object') {
                        for (const [key, value] of Object.entries(contenido)) {
                            const k = key.toLowerCase();
                            if (['lote', 'batch', 'referencia', 'código'].some(w => k.includes(w))) {
                                if (value && String(value).trim() !== '') { lote = String(value); break; }
                            }
                        }
                    }
                    if (lote !== 'N/A') break;
                }
            }
        }

        if (!cliente || ['undefined', 'null', 'General', 'Varios'].includes(cliente)) {
            cliente = 'General';
            if (dataObj.form) {
                for (const [seccion, contenido] of Object.entries(dataObj.form)) {
                    if (typeof contenido === 'object') {
                        for (const [key, value] of Object.entries(contenido)) {
                            const k = key.toLowerCase();
                            if (['cliente', 'empresa', 'señores', 'destinatario'].some(w => k.includes(w))) {
                                if (value && String(value).trim() !== '') { cliente = String(value); break; }
                            }
                        }
                    }
                    if (cliente !== 'General') break;
                }
            }
        }
        // -------------------------------------------------------------

        // Aplanar datos para el historial detallado
        if (dataObj.form) {
            for (const [seccion, contenido] of Object.entries(dataObj.form)) {
                if (typeof contenido === 'string') {
                    listaValores.push({ seccion, campo: 'CONTENIDO_TEXTO', fila: 0, valor: contenido });
                } else {
                    for (const [campo, valor] of Object.entries(contenido)) {
                        listaValores.push({ seccion, campo: campo, fila: 0, valor: String(valor || '') });
                    }
                }
            }
        }
        if (dataObj.tables) {
            for (const [seccion, filas] of Object.entries(dataObj.tables)) {
                filas.forEach((filaObj, index) => {
                    for (const [columna, valor] of Object.entries(filaObj)) {
                        listaValores.push({ seccion, campo: columna, fila: index + 1, valor: String(valor || '') });
                    }
                });
            }
        }

    } catch (e) {
        console.error("Error procesando JSON:", e);
        return res.status(400).json({ mensaje: 'Error en formato de datos.' });
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Plantilla', sql.Int, idPlantilla)
            .input('Lote', sql.NVarChar, lote)
            .input('Cliente', sql.NVarChar, cliente)
            .input('Usuario', sql.NVarChar, req.usuario.nombre)
            .input('Url_PDF', sql.NVarChar, urlPDF) 
            .input('DatosJSON', sql.NVarChar, JSON.stringify(listaValores)) 
            .execute('dbo.SP_RegistrarCertificadoGenerado'); 

        res.json({ mensaje: 'Certificado guardado y registrado.' });
    } catch (error) {
        console.error("Error SQL:", error);
        res.status(500).json({ mensaje: 'Error al registrar historial.' });
    }
};

// =========================================================================
// 4. OBTENER HISTORIAL
// =========================================================================
export const obtenerHistorial = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarCertificadosHistorial');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener historial' });
    }
};

// =========================================================================
// 5. VER PDF CERTIFICADO (STREAMING ROBUSTO)
// =========================================================================
export const verCertificadoPDF = (req, res) => {
    const { nombreArchivo } = req.params;

    console.log(`🔍 [CERTIFICADOS] Buscando PDF: ${nombreArchivo}`);

    // Seguridad básica
    if (!nombreArchivo || nombreArchivo.includes('..') || nombreArchivo.includes('/') || nombreArchivo.includes('\\')) {
        return res.status(400).json({ mensaje: 'Nombre de archivo inválido' });
    }

    const projectRoot = process.cwd();

    // Estrategia de búsqueda múltiple (Igual que en los otros módulos)
    const posiblesRutas = [
        path.join(projectRoot, 'uploads', nombreArchivo),
        path.join(projectRoot, 'backend', 'uploads', nombreArchivo),
        path.resolve(__dirname, '../../uploads', nombreArchivo)
    ];

    let archivoEncontrado = null;

    for (const ruta of posiblesRutas) {
        if (fs.existsSync(ruta)) {
            archivoEncontrado = ruta;
            break;
        }
    }

    if (archivoEncontrado) {
        console.log(`✅ [CERTIFICADOS] Encontrado en: ${archivoEncontrado}`);
        
        // Headers para visualización correcta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);
        
        res.sendFile(archivoEncontrado);
    } else {
        console.error(`❌ [CERTIFICADOS] No encontrado. Buscado en:`, posiblesRutas);
        res.status(404).json({ mensaje: 'El archivo del certificado no existe en el servidor.' });
    }
};