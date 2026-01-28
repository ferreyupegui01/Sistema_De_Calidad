// frontend/src/services/api.js

// 1. Configuración dinámica (Detecta si es Local o Producción automáticamente)
// Si existe la variable de entorno VITE_API_URL la usa, si no, usa localhost
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 2. Helper clásico de headers (Mantenido por compatibilidad)
export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

// 3. Wrapper Estándar para Peticiones JSON
// Maneja automáticamente el Token, FormData y los errores
export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    
    // DETALLE IMPORTANTE: Si enviamos FormData (archivos), NO ponemos Content-Type.
    // El navegador lo calcula solo. Si es JSON, sí lo ponemos.
    const isFormData = options.body instanceof FormData;
    
    const headers = {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...options.headers
    };

    // Aseguramos que el endpoint empiece con / si no lo tiene
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // eslint-disable-next-line no-useless-catch
    try {
        const response = await fetch(`${API_URL}${cleanEndpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            // Intentamos extraer el mensaje de error del Backend
            try {
                const errorData = await response.json();
                throw new Error(errorData.mensaje || errorData.msg || 'Error en la petición');
            } catch (jsonError) {
                // Si no es JSON (ej. error 500 de servidor caído, timeout, etc.)
                throw new Error(jsonError.message || `Error del servidor (${response.status})`);
            }
        }

        // Si la respuesta es 204 (No Content), retornamos null
        if (response.status === 204) return null;

        return await response.json();

    } catch (error) {
        // Propagamos el error para que el componente lo maneje (Alertas, Toast, etc.)
        throw error;
    }
};

// 4. Wrapper para DESCARGAR Archivos (BLOB / Streaming)
// Esta función es vital para ver imágenes/PDFs en Hostinger sin hacer pública la carpeta uploads.
export const apiFetchBlob = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const response = await fetch(`${API_URL}${cleanEndpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        throw new Error('Error al descargar el archivo. Verifique permisos o existencia.');
    }

    // Retorna el binario (Blob) listo para crear una URL temporal con URL.createObjectURL()
    return await response.blob(); 
};

// 5. NUEVA UTILIDAD: EXTRAER NOMBRE DE ARCHIVO
// Ayuda a convertir rutas sucias de BD ("uploads/mi_foto.jpg" o "C:\fake\path\foto.jpg")
// en solo el nombre del archivo ("mi_foto.jpg") para pedirlo al endpoint de streaming.
export const extractFilename = (pathOrUrl) => {
    if (!pathOrUrl) return null;
    // Divide por barra normal (/) o invertida (\) para compatibilidad total Linux/Windows
    const parts = pathOrUrl.split(/[/\\]/);
    return parts[parts.length - 1]; // Retorna solo el nombre final
};