import cron from 'node-cron';
import { getConnection, sql } from '../config/db.js';
import { enviarCorreoNotificacion } from './email.js';

// Función que revisa y envía correos
const verificarVencimientos = async () => {
    console.log('⏰ Iniciando chequeo automático de vencimientos...');
    
    try {
        const pool = await getConnection();

        // ------------------------------------------------------------------
        // 1. BUSCAR ACTIVIDADES DEL CRONOGRAMA (Vencen en los próximos 3 días)
        // ------------------------------------------------------------------
        const actividadesResult = await pool.request().query(`
            SELECT 
                A.ID_Actividad, A.Nombre_Actividad, A.Fecha_Programada, 
                U.Email, U.Nombre_Completo
            FROM Actividades A
            INNER JOIN Usuarios U ON A.Responsable = U.Nombre_Completo
            WHERE A.Estado = 'Pendiente'
              AND U.Email IS NOT NULL
              AND A.Fecha_Programada BETWEEN CAST(GETDATE() AS DATE) AND DATEADD(DAY, 3, CAST(GETDATE() AS DATE))
        `);

        // Enviar correos Actividades
        for (const act of actividadesResult.recordset) {
            const fechaVence = new Date(act.Fecha_Programada).toLocaleDateString();
            const asunto = `Recordatorio: Actividad por Vencer`;
            const mensaje = `Hola ${act.Nombre_Completo}, te recordamos que la actividad "<strong>${act.Nombre_Actividad}</strong>" está programada para el día <strong>${fechaVence}</strong>. Por favor gestionarla a tiempo.`;
            
            await enviarCorreoNotificacion(act.Email, asunto, mensaje);
            console.log(`📩 Correo enviado a ${act.Email} (Actividad ${act.ID_Actividad})`);
        }

        // ------------------------------------------------------------------
        // 2. BUSCAR PLANES DE ACCIÓN (ACPM) (Vencen en los próximos 3 días)
        // ------------------------------------------------------------------
        const acpmResult = await pool.request().query(`
            SELECT 
                P.ID_ACPM, P.Origen, P.Fecha_Limite,
                U.Email, U.Nombre_Completo
            FROM ACPM P
            INNER JOIN Usuarios U ON P.Responsable = U.Nombre_Completo
            WHERE P.Estado IN ('Abierta', 'En Progreso')
              AND U.Email IS NOT NULL
              AND P.Fecha_Limite BETWEEN CAST(GETDATE() AS DATE) AND DATEADD(DAY, 3, CAST(GETDATE() AS DATE))
        `);

        // Enviar correos ACPM
        for (const plan of acpmResult.recordset) {
            const fechaVence = new Date(plan.Fecha_Limite).toLocaleDateString();
            const asunto = `Alerta: Plan de Acción por Vencer`;
            const mensaje = `Hola ${plan.Nombre_Completo}, el plan de acción derivado de "<strong>${plan.Origen}</strong>" (ID: ${plan.ID_ACPM}) tiene fecha límite para el <strong>${fechaVence}</strong>.`;
            
            await enviarCorreoNotificacion(plan.Email, asunto, mensaje);
            console.log(`📩 Correo enviado a ${plan.Email} (ACPM ${plan.ID_ACPM})`);
        }

    } catch (error) {
        console.error('❌ Error en el Cron Job:', error);
    }
};

// Configurar la tarea programada
export const iniciarCronJobs = () => {
    // Programado para correr todos los días a las 08:00 AM
    // Formato Cron:  Minuto Hora DiaMes Mes DiaSemana
    cron.schedule('0 8 * * *', () => {
        verificarVencimientos();
    }, {
        scheduled: true,
        timezone: "America/Bogota" // Ajusta a tu zona horaria
    });

    console.log('✅ Tareas programadas iniciadas (08:00 AM diario).');
    
    // --- SOLO PARA PRUEBAS (Descomenta esto para que corra 5 segundos después de iniciar el server) ---
    // setTimeout(() => {
    //    console.log("⚡ Ejecutando prueba de correos de vencimiento...");
    //    verificarVencimientos();
    // }, 5000);
};