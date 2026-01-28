import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// 1. Configuración SGC (Principal)
export const configSGC = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: 1433,
    options: { encrypt: false, trustServerCertificate: true },
    // Timeout por defecto es 15000 (15s)
};

// 2. Configuración RRHH (IP 10.10.10.8)
const configRRHH = {
    user: process.env.DB_RRHH_USER,
    password: process.env.DB_RRHH_PASSWORD,
    server: process.env.DB_RRHH_SERVER,
    database: process.env.DB_RRHH_NAME,
    port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

// 3. Configuración ERP (IP 10.10.10.32)
const configERP = {
    user: process.env.DB_ERP_USER,
    password: process.env.DB_ERP_PASSWORD,
    server: process.env.DB_ERP_SERVER,
    database: process.env.DB_ERP_NAME,
    port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

// Pools Singleton (Para no abrir mil conexiones)
let poolSGC = null;
let poolRRHH = null;
let poolERP = null;

// Conexión Principal
export async function getConnection() {
    try {
        if (!poolSGC) poolSGC = await new sql.ConnectionPool(configSGC).connect();
        return poolSGC;
    } catch (error) {
        console.error('Error conectando a SGC:', error);
        throw error;
    }
}

// Conexión RRHH (Gosem)
export async function getConnectionRRHH() {
    try {
        if (!poolRRHH) poolRRHH = await new sql.ConnectionPool(configRRHH).connect();
        return poolRRHH;
    } catch (error) {
        console.error('Error conectando a RRHH (10.10.10.8):', error);
        throw error;
    }
}

// Conexión ERP (Sofsin)
export async function getConnectionERP() {
    try {
        if (!poolERP) poolERP = await new sql.ConnectionPool(configERP).connect();
        return poolERP;
    } catch (error) {
        console.error('Error conectando a ERP (10.10.10.32):', error);
        throw error;
    }
}

export { sql };