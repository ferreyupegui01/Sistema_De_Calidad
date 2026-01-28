import { API_URL, getAuthHeaders } from './api';

export const getPlantillas = async () => {
    const response = await fetch(`${API_URL}/certificados/plantillas`, { headers: getAuthHeaders() });
    return await response.json();
};

export const savePlantilla = async (data) => {
    const response = await fetch(`${API_URL}/certificados/plantillas`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al guardar');
    return await response.json();
};

// --- ACTUALIZADO: SOPORTE PARA FORMDATA (Subida de PDF) ---
export const logCertificado = async (formData) => {
    const token = localStorage.getItem('token');
    
    // NOTA: Al enviar FormData, NO pongas 'Content-Type': 'application/json'
    // El navegador lo gestiona automáticamente.
    const response = await fetch(`${API_URL}/certificados/generar`, {
        method: 'POST', 
        headers: {
            'Authorization': `Bearer ${token}`
        }, 
        body: formData
    });
    
    if (!response.ok) throw new Error('Error al guardar certificado');
    return await response.json();
};

export const getHistorialCertificados = async () => {
    const response = await fetch(`${API_URL}/certificados/historial`, { headers: getAuthHeaders() });
    return await response.json();
};