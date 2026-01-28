import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'; 

dotenv.config();

// --- 1. LÓGICA PRINCIPAL DE AUTENTICACIÓN ---
const authMiddleware = (req, res, next) => {
    let token;
    
    // Verificamos si viene el header Authorization con Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extraemos el token
            token = req.headers.authorization.split(' ')[1];
            
            // Verificamos la firma del token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
            
            // Creamos el objeto de usuario normalizado
            const usuarioNormalizado = {
                ...decoded,
                // Normalizamos el rol para evitar problemas de mayúsculas/minúsculas o nombres distintos
                rol: decoded.Rol || decoded.rol || decoded.role,
                id: decoded.id || decoded.ID_Usuario,
                nombre: decoded.nombre || decoded.Nombre_Completo,
                email: decoded.email || decoded.Email
            };

            // ASIGNACIÓN DOBLE PARA COMPATIBILIDAD TOTAL
            req.usuario = usuarioNormalizado; // Para tu código nuevo
            req.user = usuarioNormalizado;    // Para librerías o código antiguo
            
            return next();
        } catch (error) {
            console.error('Error Auth:', error.message);
            // CORRECCIÓN: Devolvemos 401 para que el frontend sepa que la sesión caducó
            return res.status(401).json({ msg: 'Token no válido o expirado. Por favor inicie sesión nuevamente.' });
        }
    }

    // Si no hay token en el header
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }
};

// --- 2. MIDDLEWARE PARA ADMIN (esAdmin) ---
// CORRECCIÓN: Ahora acepta múltiples roles administrativos
const esAdmin = (req, res, next) => {
    // Validamos que el usuario haya pasado por el authMiddleware primero
    if (!req.usuario) {
        return res.status(500).json({ msg: 'Se requiere iniciar sesión antes de verificar el rol' });
    }

    // LISTA DE ROLES PERMITIDOS
    // Agregamos aquí todos los roles que consideras "Jefes" o "Admins"
    const rolesPermitidos = ['SuperAdmin', 'AdminCalidad', 'Administrador'];

    // Verificamos si el rol del usuario está en la lista
    if (!rolesPermitidos.includes(req.usuario.rol)) {
        console.log(`[ACCESO DENEGADO] Usuario: ${req.usuario.nombre} | Rol: ${req.usuario.rol}`);
        return res.status(403).json({ 
            msg: `No tienes permisos suficientes. Tu rol es: ${req.usuario.rol}` 
        });
    }
    
    next();
};

// --- 3. EXPORTACIONES ---
export { authMiddleware };
export const checkAuth = authMiddleware;
export { esAdmin };
export default authMiddleware;