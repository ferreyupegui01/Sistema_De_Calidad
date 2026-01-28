import { getConnectionRRHH, getConnectionERP } from '../config/db.js';

// --- DESDE RRHH (10.10.10.8) ---

// 1. Obtener Maquinistas (Oficio 23)
export const getMaquinistas = async (req, res) => {
    try {
        const pool = await getConnectionRRHH();
        const result = await pool.request().query(`
            SELECT
                rh_co_contratos.cod_contrato,
                rh_recursos.nombres,
                rh_recursos.apellidos
            FROM rh_co_contratos
            INNER JOIN rh_recursos ON rh_co_contratos.id_recurso = rh_recursos.id_recurso
            INNER JOIN rh_oficios ON rh_co_contratos.id_oficio = rh_oficios.id_oficio
            WHERE rh_co_contratos.estado = '1'
              AND cod_oficio = '23'
        `);

        // Formateamos
        const data = result.recordset.map(m => ({
            id: m.cod_contrato,
            nombre: `${m.nombres} ${m.apellidos}`.trim()
        }));
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json([]);
    }
};

// 2. Obtener Selladores (Oficio 24)
export const getSelladores = async (req, res) => {
    try {
        const pool = await getConnectionRRHH();
        const result = await pool.request().query(`
            SELECT
                rh_co_contratos.cod_contrato,
                rh_recursos.nombres,
                rh_recursos.apellidos
            FROM rh_co_contratos
            INNER JOIN rh_recursos ON rh_co_contratos.id_recurso = rh_recursos.id_recurso
            INNER JOIN rh_oficios ON rh_co_contratos.id_oficio = rh_oficios.id_oficio
            WHERE rh_co_contratos.estado = '1'
              AND cod_oficio = '24'
        `);

        const data = result.recordset.map(s => ({
            id: s.cod_contrato,
            nombre: `${s.nombres} ${s.apellidos}`.trim()
        }));
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json([]);
    }
};

// --- DESDE ERP (10.10.10.32) ---

// 3. Obtener Productos (Materia Prima)
export const getProductos = async (req, res) => {
    try {
        const pool = await getConnectionERP();
        
        // NOTA: Multiplicamos rumfactor * 1000 asumiendo que el ERP lo tiene en Kilos (0.5 kg -> 500g)
        // Si en tu ERP el factor ya está en gramos, quita el "* 1000".
        const result = await pool.request().query(`
            SELECT 
                i.itecodigo, 
                i.itedesclarg,
                (r.rumfactor * 1000) AS peso_gramos 
            FROM [dbo].[in_items] i
            LEFT JOIN [dbo].[in_relaunidmedi] r 
                ON i.iteuma = r.rumunidmedide 
                AND r.rumcompania = '01' 
            WHERE (i.itecompania LIKE '%01%')
              AND (i.itetipoitem LIKE '%PRO%')
            ORDER BY i.itedesclarg ASC
        `);

        const data = result.recordset.map(p => ({
            codigo: p.itecodigo,
            // Quitamos espacios extra al nombre
            descripcion: p.itedesclarg.trim(), 
            // Si el peso es null o 0, enviamos '', si no, lo enviamos redondeado (sin decimales .00)
            peso: p.peso_gramos ? Math.round(p.peso_gramos) : '' 
        }));

        res.json(data);
    } catch (error) {
        console.error("Error en getProductos:", error);
        res.status(500).json([]);
    }
};

// 4. Obtener Proveedores
export const getProveedores = async (req, res) => {
    try {
        const pool = await getConnectionERP();
        
        // MODIFICACIÓN: Se eliminaron los filtros 'tgeactivecono' para traer todos
        const result = await pool.request().query(`
            SELECT tgecodigo, tgenombcomp
            FROM [dbo].[un_tercegener]
            WHERE [tgecompania] LIKE '%01%' 
            -- Se eliminó el filtro de códigos específicos (2013, 2221, etc.)
            ORDER BY tgenombcomp ASC
        `);

        const data = result.recordset.map(p => ({
            codigo: p.tgecodigo,
            nombre: p.tgenombcomp
        }));
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json([]);
    }
};


// 5. Obtener Clientes (Para PMIR - Residuos)
// ...
export const getClientes = async (req, res) => {
    try {
        const pool = await getConnectionERP(); // Conexión a la base externa
        
        // MODIFICACIÓN: Quitamos "TOP (1000)" para que traiga TODO el universo de clientes
        const result = await pool.request().query(`
            SELECT tclcodigo, tclnombre
            FROM [SSF_ELTRECE].[dbo].[un_terceclien]
            WHERE [tclcompania] LIKE '%01%' 
            ORDER BY tclnombre ASC
        `);

        const data = result.recordset.map(c => ({
            codigo: c.tclcodigo,
            nombre: c.tclnombre 
        }));
        
        res.json(data);
    } catch (error) {
        console.error("Error obteniendo clientes:", error);
        res.status(500).json([]);
    }
};