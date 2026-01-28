// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar Conexión BD
import { getConnection } from './config/db.js';

// --- IMPORTAR NUEVA FUNCIONALIDAD (TAREAS AUTOMÁTICAS) ---
import { iniciarCronJobs } from './libs/cronJobs.js'; // <--- AGREGADO

// --- IMPORTAR RUTAS (TUS RUTAS ORIGINALES) ---
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cronogramaRoutes from './routes/cronogramaRoutes.js';
import coreRoutes from './routes/coreRoutes.js';
import reportesRoutes from './routes/reportesRoutes.js';
import acpmRoutes from './routes/acpmRoutes.js';
import specializedRoutes from './routes/specializedRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import driveRoutes from './routes/driveRoutes.js';
import capacitacionRoutes from './routes/capacitacionRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import auditGlobalRoutes from './routes/auditGlobalRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import trazabilidadRoutes from './routes/trazabilidadRoutes.js';
import certificadosRoutes from './routes/certificadosRoutes.js';
import auditoriaRoutes from './routes/auditoriaRoutes.js'
import pesosRoutes from './routes/pesosRoutes.js'
import externosRoutes from './routes/externosRoutes.js';
import proveedoresRoutes from './routes/proveedoresRoutes.js';
import pmirRoutes from './routes/pmirRoutes.js';
import recallRoutes from './routes/recallRoutes.js';
import actasRoutes from './routes/actasRoutes.js'

// Configuración de Variables de Entorno
dotenv.config();

// Configuración de __dirname para ES Modules (Node.js moderno)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- MIDDLEWARES GLOBALES ---
app.use(cors()); // Permitir peticiones desde el Frontend
app.use(express.json()); // Permitir leer JSON en el body
app.use(express.urlencoded({ extended: true })); // Permitir leer datos de formularios (Form-Data)

// --- CARPETA PÚBLICA (ARCHIVOS ESTÁTICOS) ---
// Esto permite acceder a las fotos subidas vía URL: http://localhost:3000/uploads/archivo.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DEFINICIÓN DE RUTAS (API) ---
app.use('/api/auth', authRoutes);           // Login
app.use('/api/usuarios', userRoutes);       // Gestión de Colaboradores
app.use('/api/cronogramas', cronogramaRoutes); // Planificación
app.use('/api/core', coreRoutes);           // Categorías, Activos, Formularios
app.use('/api/reportes', reportesRoutes);   // Operación Diaria (Checklists)
app.use('/api/acpm', acpmRoutes);           // Acciones Correctivas
app.use('/api/specialized', specializedRoutes); // Archivos, Agua y Kiosco
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/capacitacion', capacitacionRoutes);
app.use('/api/auditoria', auditRoutes);
app.use('/api/bitacora', auditGlobalRoutes);
app.use('/api/notificaciones', notificationRoutes);
app.use('/api/trazabilidad', trazabilidadRoutes);
app.use('/api/certificados', certificadosRoutes);
app.use('/api/auditorias', auditoriaRoutes);
app.use('/api/pesos', pesosRoutes);
app.use('/api/externos', externosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
// Rutas para el módulo de Recall (Documentación y Salidas)
app.use('/api/recall', recallRoutes);
// Rutas PMIR (Gestión de Residuos)
app.use('/api/pmir', pmirRoutes);
app.use('/api/actas', actasRoutes);
// Ruta de prueba básica
app.get('/ping', (req, res) => res.send('pong - El servidor está vivo'));

// --- INICIAR SERVIDOR ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`==================================================`);
    
    // Verificamos conexión a SQL Server al iniciar
    try {
        await getConnection();
        console.log('✅ Conexión a SQL Server: EXITOSA');
        console.log('📂 Carpeta de cargas pública en: /uploads');

        // --- INICIAR EL RELOJ AUTOMÁTICO (CRON JOBS) ---
        // Esto activa la revisión de correos a las 8:00 AM
        iniciarCronJobs(); // <--- AGREGADO

    } catch (error) {
        console.error('❌ Error fatal al conectar con la base de datos:');
        console.error(error.message);
    }
});