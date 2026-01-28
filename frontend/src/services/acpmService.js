import { API_URL, getAuthHeaders } from './api';

export const createACPM = async (data) => {
    const response = await fetch(`${API_URL}/acpm`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.mensaje);
    return result;
};

export const getACPMs = async () => {
    const response = await fetch(`${API_URL}/acpm`, { headers: getAuthHeaders() });
    return await response.json();
};

// --- NUEVO: OBTENER UN ACPM POR ID ---
export const getACPMById = async (id) => {
    const response = await fetch(`${API_URL}/acpm/${id}`, { headers: getAuthHeaders() });
    const result = await response.json();
    if (!response.ok) throw new Error(result.mensaje);
    return result;
};

// ... (Resto de funciones igual: closeACPM, manageACPM, etc.)

export const closeACPM = async (id, urlEvidencia) => {
    const response = await fetch(`${API_URL}/acpm/cerrar/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ urlEvidencia })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.mensaje);
    return result;
};

export const manageACPM = async (id, data) => {
    const response = await fetch(`${API_URL}/acpm/gestion/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.mensaje);
    return result;
};

export const getOrigenesACPM = async () => {
    const response = await fetch(`${API_URL}/acpm/origenes`, { headers: getAuthHeaders() });
    if (!response.ok) return []; 
    return await response.json();
};

export const addOrigenACPM = async (nombre) => {
    const response = await fetch(`${API_URL}/acpm/origenes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nombre })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.mensaje);
    return result;
};