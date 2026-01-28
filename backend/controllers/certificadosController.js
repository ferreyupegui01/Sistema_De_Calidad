import { getConnection, sql } from '../config/db.js';

// =========================================================================
// 1. LISTAR PLANTILLAS (Para el Diseñador y el Generador)
// =========================================================================
export const listarPlantillas = async (req, res) => {
    try {
        const pool = await getConnection();
        // Llamamos al SP que devuelve la estructura JSON reconstruida
        const result = await pool.request().execute('dbo.SP_ListarPlantillas_Relacional');
        
        // PROCESAR RESULTADO PARA EL FRONTEND
        const plantillasMapeadas = result.recordset.map(row => {
            let estructura = [];
            
            try {
                const rawJson = row.Estructura_JSON_Reconstruida;
                
                if (rawJson) {
                    // Si SQL devuelve string, lo parseamos. Si ya es objeto, lo usamos directo.
                    estructura = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

                    if (Array.isArray(estructura)) {
                        estructura = estructura.map(seccion => {
                            // A. Mapeo de Columnas para Tablas (Convertimos de Objeto a Array simple)
                            if (seccion.tipo === 'tabla') {
                                if (seccion.columnas_obj) {
                                    seccion.columnas = seccion.columnas_obj.map(c => c.Etiqueta);
                                    delete seccion.columnas_obj; // Limpiamos para no enviar basura al front
                                }

                                // B. Mapeo de Filas (CRÍTICO: Asegurar que siempre sea un Array)
                                if (typeof seccion.filas === 'string') {
                                    try {
                                        seccion.filas = JSON.parse(seccion.filas);
                                    } catch (e) {
                                        seccion.filas = []; 
                                    }
                                }
                                // Doble chequeo: si sigue sin ser array, lo forzamos
                                if (!Array.isArray(seccion.filas)) {
                                    seccion.filas = [];
                                }
                            }

                            // C. Asegurar Booleanos correctos
                            seccion.fijo = Boolean(seccion.fijo);
                            
                            return seccion;
                        });
                    }
                }
            } catch (e) {
                console.error("Error parseando JSON reconstruido en ID " + row.ID_Plantilla, e);
                estructura = []; // Fallback seguro
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
// 2. GUARDAR PLANTILLA (Para el Diseñador)
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
// 3. REGISTRAR GENERACIÓN (Con Detección Inteligente de Lote/Cliente)
// =========================================================================
export const registrarGeneracion = async (req, res) => {
    const archivo = req.file; 
    
    // Extraemos datos del request
    let { idPlantilla, lote, cliente, datos } = req.body;

    // URL del PDF generado
    let urlPDF = null;
    if (archivo) urlPDF = `http://localhost:3000/uploads/${archivo.filename}`;

    let listaValores = [];
    
    try {
        const dataObj = JSON.parse(datos); 

        // --- LÓGICA INTELIGENTE: Auto-completar Lote y Cliente si vienen vacíos ---
        // Esto busca dentro de los campos que llenó el usuario para encontrar el Lote
        if (!lote || lote === 'undefined' || lote === 'null' || lote === 'N/A' || lote === 'S/L') {
            lote = 'N/A'; // Reset
            
            // Buscamos dentro de la sección "form" del JSON
            if (dataObj.form) {
                for (const [seccion, contenido] of Object.entries(dataObj.form)) {
                    if (typeof contenido === 'object') {
                        // Recorremos las claves (ej: "Lote del Producto", "Batch", "Referencia")
                        for (const [key, value] of Object.entries(contenido)) {
                            const k = key.toLowerCase();
                            // Palabras clave para detectar LOTE
                            if (k.includes('lote') || k.includes('batch') || k.includes('referencia') || k.includes('código')) {
                                if (value && value.toString().trim() !== '') {
                                    lote = value.toString(); // ¡Encontrado!
                                    break; 
                                }
                            }
                        }
                    }
                    if (lote !== 'N/A') break;
                }
            }
        }

        // Lo mismo para el CLIENTE
        if (!cliente || cliente === 'undefined' || cliente === 'null' || cliente === 'General' || cliente === 'Varios') {
            cliente = 'General'; // Reset

            if (dataObj.form) {
                for (const [seccion, contenido] of Object.entries(dataObj.form)) {
                    if (typeof contenido === 'object') {
                        for (const [key, value] of Object.entries(contenido)) {
                            const k = key.toLowerCase();
                            // Palabras clave para detectar CLIENTE
                            if (k.includes('cliente') || k.includes('empresa') || k.includes('señores') || k.includes('destinatario')) {
                                if (value && value.toString().trim() !== '') {
                                    cliente = value.toString(); // ¡Encontrado!
                                    break;
                                }
                            }
                        }
                    }
                    if (cliente !== 'General') break;
                }
            }
        }
        // --------------------------------------------------------------------------

        // Aplanar datos para guardar detalle completo en JSON (Para auditoría futura)
        // 1. Datos de Formulario (Texto e Info)
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
        // 2. Datos de Tablas
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
        console.error("Error procesando datos JSON en registrarGeneracion:", e);
        return res.status(400).json({ mensaje: 'Error en formato de datos enviados.' });
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Plantilla', sql.Int, idPlantilla)
            .input('Lote', sql.NVarChar, lote)       // Dato detectado o 'N/A'
            .input('Cliente', sql.NVarChar, cliente) // Dato detectado o 'General'
            .input('Usuario', sql.NVarChar, req.usuario.nombre)
            .input('Url_PDF', sql.NVarChar, urlPDF)
            .input('DatosJSON', sql.NVarChar, JSON.stringify(listaValores)) 
            .execute('dbo.SP_RegistrarCertificadoGenerado'); 

        res.json({ mensaje: 'Certificado guardado y registrado correctamente en historial.' });
    } catch (error) {
        console.error("Error SQL al registrar generación:", error);
        res.status(500).json({ mensaje: 'Error al registrar historial del certificado.' });
    }
};

// =========================================================================
// 4. OBTENER HISTORIAL (Para la tabla de trazabilidad)
// =========================================================================
export const obtenerHistorial = async (req, res) => {
    try {
        const pool = await getConnection();
        // Llama al SP actualizado que devuelve ID, Lote, Cliente, etc.
        const result = await pool.request().execute('dbo.SP_ListarCertificadosHistorial');
        res.json(result.recordset);
    } catch (error) {
        console.error("Error obteniendo historial de certificados:", error);
        res.status(500).json({ mensaje: 'Error al obtener historial' });
    }
};