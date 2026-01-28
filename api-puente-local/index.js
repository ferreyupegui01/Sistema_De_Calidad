import express from 'express';
import sql from 'mssql';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.BRIDGE_SECRET_KEY) {
        return res.status(403).json({ error: 'Acceso Denegado: API Key inválida' });
    }
    next();
};
app.use(verifyApiKey);

// --- CONFIGURACIONES DB ---
const configRRHH = {
    user: process.env.DB_RRHH_USER,
    password: process.env.DB_RRHH_PASSWORD,
    server: process.env.DB_RRHH_SERVER, // 10.10.10.8
    database: process.env.DB_RRHH_NAME,
    options: { encrypt: false, trustServerCertificate: true }
};

const configERP = {
    user: process.env.DB_ERP_USER,
    password: process.env.DB_ERP_PASSWORD,
    server: process.env.DB_ERP_SERVER, // 10.10.10.32
    database: process.env.DB_ERP_NAME, // SSF_ELTRECE
    options: { encrypt: false, trustServerCertificate: true }
};

// --- GESTIÓN DE POOLS INDEPENDIENTES ---
async function getPoolRRHH() {
    const pool = new sql.ConnectionPool(configRRHH);
    return await pool.connect();
}

async function getPoolERP() {
    const pool = new sql.ConnectionPool(configERP);
    return await pool.connect();
}

// ==========================================
// RUTAS RRHH (10.10.10.8) -> ESTAS SÍ FUNCIONAN
// Mantienen la ruta completa porque tu servidor RRHH lo requiere
// ==========================================

app.get('/api/rrhh/maquinistas', async (req, res) => {
    try {
        const pool = await getPoolRRHH();
        const result = await pool.request().query(`
            SELECT C.cod_contrato, R.nombres, R.apellidos
            FROM [gh_empaquetados_trece].[dbo].[rh_co_contratos] C
            INNER JOIN [gh_empaquetados_trece].[dbo].[rh_recursos] R ON C.id_recurso = R.id_recurso
            INNER JOIN [gh_empaquetados_trece].[dbo].[rh_oficios] O ON C.id_oficio = O.id_oficio
            WHERE C.estado = '1' AND O.cod_oficio = '23'
        `);
        pool.close();
        res.json(result.recordset);
    } catch (err) {
        console.error('Error RRHH Maquinistas:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/rrhh/selladores', async (req, res) => {
    try {
        const pool = await getPoolRRHH();
        const result = await pool.request().query(`
            SELECT C.cod_contrato, R.nombres, R.apellidos
            FROM [gh_empaquetados_trece].[dbo].[rh_co_contratos] C
            INNER JOIN [gh_empaquetados_trece].[dbo].[rh_recursos] R ON C.id_recurso = R.id_recurso
            INNER JOIN [gh_empaquetados_trece].[dbo].[rh_oficios] O ON C.id_oficio = O.id_oficio
            WHERE C.estado = '1' AND O.cod_oficio = '24'
        `);
        pool.close();
        res.json(result.recordset);
    } catch (err) {
        console.error('Error RRHH Selladores:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// RUTAS ERP (10.10.10.32) -> CORRECCIÓN AQUÍ
// Quitamos "[SSF_ELTRECE]" y dejamos solo "[dbo].[Tabla]"
// ==========================================

app.get('/api/erp/productos', async (req, res) => {
    try {
        const pool = await getPoolERP();
        const result = await pool.request().query(`
            SELECT i.itecodigo, i.itedesclarg, (r.rumfactor * 1000) AS peso_gramos 
            FROM [dbo].[in_items] i
            LEFT JOIN [dbo].[in_relaunidmedi] r 
                ON i.iteuma = r.rumunidmedide AND r.rumcompania = '01' 
            WHERE (i.itecompania LIKE '%01%') AND (i.itetipoitem LIKE '%PRO%')
            ORDER BY i.itedesclarg ASC
        `);
        pool.close();
        res.json(result.recordset);
    } catch (err) {
        console.error('Error ERP Productos:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/erp/proveedores', async (req, res) => {
    try {
        const pool = await getPoolERP();
        const result = await pool.request().query(`
            SELECT tgecodigo, tgenombcomp
            FROM [dbo].[un_tercegener]
            WHERE [tgecompania] LIKE '%01%' 
            ORDER BY tgenombcomp ASC
        `);
        pool.close();
        res.json(result.recordset);
    } catch (err) {
        console.error('Error ERP Proveedores:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/erp/clientes', async (req, res) => {
    try {
        const pool = await getPoolERP();
        const result = await pool.request().query(`
            SELECT tclcodigo, tclnombre
            FROM [dbo].[un_terceclien]
            WHERE [tclcompania] LIKE '%01%' 
            ORDER BY tclnombre ASC
        `);
        pool.close();
        res.json(result.recordset);
    } catch (err) {
        console.error('Error ERP Clientes:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API Puente escuchando en puerto ${PORT}`);
    console.log(`📡 Esperando conexiones seguras...`);
});