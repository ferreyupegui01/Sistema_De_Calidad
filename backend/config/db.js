// backend/config/db.js
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// 1. Configuración SGC (Principal - Esta SÍ vive en la VPS o Hostinger)
export const configSGC = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: 1433,
    options: { 
        encrypt: false, 
        trustServerCertificate: true,
        enableArithAbort: true 
    },
};

// Pool Singleton (Solo para la base de datos principal)
let poolSGC = null;

// Conexión Principal (Única necesaria en VPS)
export async function getConnection() {
    try {
        if (!poolSGC) {
            poolSGC = await new sql.ConnectionPool(configSGC).connect();
        }
        return poolSGC;
    } catch (error) {
        console.error('❌ Error crítico conectando a BD Principal SGC:', error);
        throw error;
    }
}

export { sql };