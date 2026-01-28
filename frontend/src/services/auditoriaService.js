import { API_URL, getAuthHeaders } from './api';

export const getAuditorias = async () => {
    const res = await fetch(`${API_URL}/auditorias`, { headers: getAuthHeaders() });
    return await res.json();
};

export const createAuditoria = async (formData) => {
    // NOTA: Cuando enviamos FormData, NO debemos poner 'Content-Type': 'application/json'
    // El navegador lo pone automáticamente como 'multipart/form-data'
    const headers = getAuthHeaders();
    delete headers['Content-Type']; // Borramos el content-type JSON para que pase el archivo

    const res = await fetch(`${API_URL}/auditorias`, {
        method: 'POST',
        headers: headers, 
        body: formData // Enviamos el objeto FormData directo
    });
    if (!res.ok) throw new Error('Error al crear auditoría');
    return await res.json();
};

// Obtener o Crear Auditor (Si pasas 'nuevo', lo crea)
export const getAuditoresList = async (nuevo = null) => {
    const res = await fetch(`${API_URL}/auditorias/auditores`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nuevo })
    });
    return await res.json();
};

// Obtener o Crear Área (Si pasas 'nuevo', la crea)
export const getAreasList = async (nuevo = null) => {
    const res = await fetch(`${API_URL}/auditorias/areas`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nuevo })
    });
    return await res.json();
};