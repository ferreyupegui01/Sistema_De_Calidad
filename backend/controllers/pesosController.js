import { getConnection, sql } from '../config/db.js';
import { registrarLog } from '../libs/logger.js';

// --- FUNCIÓN DE AYUDA PARA EVITAR ERRORES DE DECIMALES ---
// Convierte cualquier valor a un número con máximo 2 decimales
// Ejemplo: 150.55555 -> 150.56 (Evita el error de TDS Protocol)
const safeDecimal = (val) => {
    if (!val) return 0;
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    return parseFloat(num.toFixed(2));
};

// --- REGISTRAR NUEVO CONTROL ---
export const registrarControlPesos = async (req, res) => {
    let { cabecera, muestras } = req.body;
    const archivo = req.file; 

    try {
        // Parsear JSON strings (necesario por FormData)
        if (typeof cabecera === 'string') cabecera = JSON.parse(cabecera);
        if (typeof muestras === 'string') muestras = JSON.parse(muestras);

        if (!cabecera || !muestras || muestras.length === 0) {
            return res.status(400).json({ mensaje: 'Datos incompletos.' });
        }

        const fechaVencimientoDate = new Date(cabecera.fechaVencimiento);

        // URL del archivo
        const urlEvidencia = archivo ? `/uploads/${archivo.filename}` : null;

        const pool = await getConnection();
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        // Usamos safeDecimal también aquí para comparar correctamente
        const min = safeDecimal(cabecera.limiteInferior);
        const max = safeDecimal(cabecera.limiteSuperior);
        
        // Validaciones de calidad
        const hayDefectosPeso = muestras.some(m => {
            if (m.peso === '' || m.peso === null) return false;
            const p = parseFloat(m.peso);
            return p < min || p > max;
        });

        const falloSellado = (
            !cabecera.selladoInferior || 
            !cabecera.selladoSuperior || 
            !cabecera.selladoVertical || 
            !cabecera.selladoLoteado
        );
        
        const estadoFinal = (hayDefectosPeso || falloSellado) ? 'Rechazado' : 'Aprobado';

        const requestCabecera = new sql.Request(transaction); 
        
        // APLICAMOS safeDecimal() A TODOS LOS CAMPOS NUMÉRICOS
        const resultCabecera = await requestCabecera
            .input('Lote', sql.NVarChar, cabecera.lote)
            .input('Fecha_Vencimiento', sql.Date, fechaVencimientoDate) 
            .input('Producto', sql.NVarChar, cabecera.producto)
            // Decimales seguros:
            .input('Peso_Nominal', sql.Decimal(10,2), safeDecimal(cabecera.pesoNominal))
            .input('Proveedor', sql.NVarChar, cabecera.proveedor)
            .input('Maquinista', sql.NVarChar, cabecera.maquinista)
            .input('Sellador', sql.NVarChar, cabecera.sellador)
            .input('Nombre_Lamina', sql.NVarChar, cabecera.nombreLamina)
            // Enteros:
            .input('Golpes_Minuto', sql.Int, parseInt(cabecera.golpesMinuto) || 0)
            // Decimales seguros (Aquí estaba el error):
            .input('Temp_Vertical', sql.Decimal(5,2), safeDecimal(cabecera.tempVertical))
            .input('Temp_Horiz_Sup', sql.Decimal(5,2), safeDecimal(cabecera.tempHorizSup))
            .input('Temp_Horiz_Inf', sql.Decimal(5,2), safeDecimal(cabecera.tempHorizInf))
            .input('Lote_MP', sql.NVarChar, cabecera.loteMP)
            .input('Lote_Lamina', sql.NVarChar, cabecera.loteLamina)
            .input('Limite_Inferior', sql.Decimal(10,2), min)
            .input('Limite_Superior', sql.Decimal(10,2), max)
            .input('ID_Usuario', sql.Int, req.usuario.id)
            .input('Estado_Final', sql.NVarChar, estadoFinal)
            // Nuevos campos booleanos
            .input('Sellado_Inferior', sql.Bit, cabecera.selladoInferior ? 1 : 0)
            .input('Sellado_Superior', sql.Bit, cabecera.selladoSuperior ? 1 : 0)
            .input('Sellado_Vertical', sql.Bit, cabecera.selladoVertical ? 1 : 0)
            .input('Sellado_Loteado', sql.Bit, cabecera.selladoLoteado ? 1 : 0)
            .input('Url_Evidencia', sql.NVarChar, urlEvidencia)
            .execute('dbo.SP_CrearCabeceraControl');

        const idControl = resultCabecera.recordset[0].ID_Generado;

        // Insertar muestras
        for (const muestra of muestras) {
            const peso = safeDecimal(muestra.peso); // Asegurar decimales en muestras también
            const esConforme = (peso >= min && peso <= max);

            const requestDetalle = new sql.Request(transaction);
            await requestDetalle
                .input('ID_Control', sql.Int, idControl)
                .input('Numero_Muestra', sql.Int, muestra.index)
                .input('Valor_Peso', sql.Decimal(10,2), peso)
                .input('Es_Conforme', sql.Bit, esConforme)
                .execute('dbo.SP_InsertarDetalleControl');
        }

        await transaction.commit();
        await registrarLog(req.usuario.nombre, req.usuario.rol, 'CREAR', 'PESOS', `Lote ${cabecera.lote} registrado.`);

        res.status(201).json({ mensaje: 'Control guardado correctamente', id: idControl });

    } catch (error) {
        console.error("Error Transacción Pesos:", error);
        if (typeof transaction !== 'undefined' && transaction._aborted === false) {
            await transaction.rollback();
        }
        // Mostramos el mensaje exacto del error en la respuesta para depurar
        res.status(500).json({ mensaje: 'Error al guardar. Revise los datos numéricos.', error: error.message });
    }
};

// --- LISTAR HISTORIAL ---
export const listarControles = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().execute('dbo.SP_ListarControlesPesos');
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al listar controles' });
    }
};

// --- OBTENER DETALLE ---
export const obtenerDetalleControl = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('ID_Control', sql.Int, id)
            .execute('dbo.SP_ObtenerDetalleControlPesos');
            
        if (!result.recordsets[0] || result.recordsets[0].length === 0) {
            return res.status(404).json({ mensaje: 'Control no encontrado' });
        }

        res.json({
            cabecera: result.recordsets[0][0],
            muestras: result.recordsets[1]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener detalle' });
    }
};