import { getConnection, sql } from '../config/db.js';

// --- OBTENER TODAS LAS EVALUACIONES ---
export const getEvaluaciones = async (req, res) => {
    try {
        const pool = await getConnection();
        // Ordenamos por fecha descendente para ver las últimas primero
        const result = await pool.request().query('SELECT * FROM Evaluaciones_Proveedores ORDER BY Fecha_Registro DESC');
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
};

// --- OBTENER UNA EVALUACIÓN CON DETALLES ---
export const getEvaluacionById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        
        const cabecera = await pool.request()
            .input('Id', sql.Int, id)
            .query('SELECT * FROM Evaluaciones_Proveedores WHERE ID_Evaluacion = @Id');

        const detalles = await pool.request()
            .input('Id', sql.Int, id)
            .query('SELECT * FROM Detalles_Evaluacion_Proveedores WHERE ID_Evaluacion = @Id');

        if (cabecera.recordset.length === 0) return res.status(404).json({ msg: 'Evaluación no encontrada' });

        res.json({
            datos: cabecera.recordset[0],
            items: detalles.recordset
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// --- CREAR NUEVA EVALUACIÓN (SIN SUBIDA DE ARCHIVO) ---
export const createEvaluacion = async (req, res) => {
    // Extraemos solo los datos del formulario
    const { 
        empresa, ciudad, registroSanitario, producto, conceptoSanitario, 
        fichasTecnicas, objeto, esCertificada, cualCertificacion,
        puntajeObtenido, puntajePosible, porcentajeFinal, conceptoFinal,
        realizadoPor, recibidoPor, observaciones,
        items: itemsString // Viene como string JSON
    } = req.body;

    // Parsear los items (Checklist)
    let items = [];
    try {
        items = JSON.parse(itemsString);
    } catch (error) {
        console.error("Error parseando items:", error);
        return res.status(400).json({ msg: 'El formato de la lista de chequeo no es válido' });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Insertar Cabecera (SIN Url_Carta_Invima)
        const requestCabecera = new sql.Request(transaction);
        const resultCabecera = await requestCabecera
            .input('Empresa', sql.NVarChar, empresa)
            .input('Ciudad', sql.NVarChar, ciudad)
            .input('Registro_Sanitario', sql.NVarChar, registroSanitario)
            .input('Producto_Provee', sql.NVarChar, producto)
            .input('Concepto_Sanitario', sql.NVarChar, conceptoSanitario)
            .input('Fichas_Tecnicas', sql.Bit, fichasTecnicas === 'true' || fichasTecnicas === true)
            .input('Objeto_Contrato', sql.NVarChar, objeto)
            .input('Es_Certificada', sql.Bit, esCertificada === 'true' || esCertificada === true)
            .input('Cual_Certificacion', sql.NVarChar, cualCertificacion)
            .input('Puntaje_Obtenido', sql.Int, puntajeObtenido)
            .input('Puntaje_Posible', sql.Int, puntajePosible)
            .input('Porcentaje_Final', sql.Decimal(5, 2), porcentajeFinal)
            .input('Concepto_Final', sql.NVarChar, conceptoFinal)
            .input('Realizado_Por', sql.NVarChar, realizadoPor)
            .input('Recibido_Por', sql.NVarChar, recibidoPor)
            .input('Observaciones_Generales', sql.NVarChar, observaciones)
            .query(`
                INSERT INTO Evaluaciones_Proveedores 
                (Empresa, Ciudad, Registro_Sanitario, Producto_Provee, Concepto_Sanitario, Fichas_Tecnicas, Objeto_Contrato, Es_Certificada, Cual_Certificacion, Puntaje_Obtenido, Puntaje_Posible, Porcentaje_Final, Concepto_Final, Realizado_Por, Recibido_Por, Observaciones_Generales)
                OUTPUT INSERTED.ID_Evaluacion
                VALUES 
                (@Empresa, @Ciudad, @Registro_Sanitario, @Producto_Provee, @Concepto_Sanitario, @Fichas_Tecnicas, @Objeto_Contrato, @Es_Certificada, @Cual_Certificacion, @Puntaje_Obtenido, @Puntaje_Posible, @Porcentaje_Final, @Concepto_Final, @Realizado_Por, @Recibido_Por, @Observaciones_Generales)
            `);

        const idEvaluacion = resultCabecera.recordset[0].ID_Evaluacion;

        // 2. Insertar Detalles (Items de la lista de chequeo)
        for (const item of items) {
            const requestDetalle = new sql.Request(transaction);
            await requestDetalle
                .input('ID_Evaluacion', sql.Int, idEvaluacion)
                .input('Pregunta', sql.NVarChar, item.pregunta)
                .input('Calificacion', sql.Int, item.calificacion) // 0 o 2
                .input('Es_NA', sql.Bit, item.esNA)
                .input('Observacion', sql.NVarChar, item.observacion || '')
                .query(`
                    INSERT INTO Detalles_Evaluacion_Proveedores (ID_Evaluacion, Pregunta, Calificacion, Es_NA, Observacion)
                    VALUES (@ID_Evaluacion, @Pregunta, @Calificacion, @Es_NA, @Observacion)
                `);
        }

        await transaction.commit();
        res.json({ msg: 'Evaluación registrada correctamente', id: idEvaluacion });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Error en createEvaluacion:", error);
        res.status(500).send('Error al guardar la evaluación en base de datos');
    }
};

// --- SUBIR CARTA INVIMA POSTERIORMENTE (USADA DESDE LA TABLA) ---
export const uploadCartaInvima = async (req, res) => {
    const { id } = req.params;
    
    if (!req.file) {
        return res.status(400).json({ msg: 'No se ha subido ningún archivo' });
    }

    const urlCarta = `http://localhost:3000/uploads/${req.file.filename}`;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('Id', sql.Int, id)
            .input('Url', sql.NVarChar, urlCarta)
            .query('UPDATE Evaluaciones_Proveedores SET Url_Carta_Invima = @Url WHERE ID_Evaluacion = @Id');

        res.json({ msg: 'Carta INVIMA subida correctamente', url: urlCarta });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al actualizar la base de datos' });
    }
};