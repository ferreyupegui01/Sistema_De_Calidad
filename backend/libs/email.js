// backend/libs/email.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// URL del Logo proporcionada
const LOGO_URL = "https://i.ibb.co/27GMjSQM/logo.png";
// URL de tu Frontend (Ajústala si subes a producción, por ahora local)
const PLATAFORMA_URL = "http://localhost:5173"; 

export const enviarCorreoNotificacion = async (destinatario, asunto, mensaje) => {
    if (!destinatario) return;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail', // O el servicio que configures en .env
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        // --- PLANTILLA HTML PROFESIONAL ---
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; padding: 30px; background-color: #ffffff; border-bottom: 3px solid #0c4760; }
                .logo { max-width: 180px; height: auto; }
                .content { padding: 40px 30px; color: #333333; }
                .title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
                .icon-warning { color: #f59e0b; font-size: 24px; font-weight: bold; }
                .title { color: #0c4760; font-size: 22px; font-weight: 700; margin: 0; }
                .message-box { background-color: #f0f9ff; border-left: 5px solid #0ea5e9; padding: 15px; margin-bottom: 25px; border-radius: 4px; }
                .message-text { font-size: 16px; color: #1e293b; margin: 0; line-height: 1.5; }
                .info-text { font-size: 14px; color: #64748b; margin-bottom: 30px; }
                .btn-container { text-align: center; margin-top: 20px; }
                .btn { background-color: #0c4760; color: #ffffff !important; text-decoration: none; padding: 12px 30px; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block; transition: background 0.3s; }
                .footer { background-color: #333333; color: #ffffff; text-align: center; padding: 15px; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${LOGO_URL}" alt="Empaquetados El Trece" class="logo">
                </div>

                <div class="content">
                    
                    <div class="title-row">
                        <span style="font-size: 24px;"></span>
                        <h2 class="title">${asunto}</h2>
                    </div>

                    <div class="message-box">
                        <p class="message-text">${mensaje}</p>
                    </div>

                    <p class="info-text">Se ha registrado una novedad en el Sistema de Gestión que requiere tu atención o confirmación.</p>

                    <div class="btn-container">
                        <a href="${PLATAFORMA_URL}" class="btn">Ir a la Plataforma</a>
                    </div>
                </div>

                <div class="footer">
                    Empaquetados El Trece S.A.S - Sistema de Gestión de Calidad
                    <br>
                    <span style="color: #888; font-size: 10px;">Este es un mensaje automático, por favor no responder.</span>
                </div>
            </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: '"SGC El Trece" <notificaciones@eltrece.com>',
            to: destinatario,
            subject: ` ${asunto}`, // Icono en el asunto para destacar
            html: htmlTemplate
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Correo enviado a ${destinatario}`);

    } catch (error) {
        console.error('❌ Error enviando correo:', error);
    }
};