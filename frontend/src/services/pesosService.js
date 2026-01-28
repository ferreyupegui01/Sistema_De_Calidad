// frontend/src/services/pesosService.js
import { API_URL, getAuthHeaders } from './api';

export const getHistorialPesos = async () => {
    const response = await fetch(`${API_URL}/pesos`, { 
        headers: getAuthHeaders() 
    });
    return await response.json();
};

export const getDetallePeso = async (id) => {
    const response = await fetch(`${API_URL}/pesos/${id}`, { 
        headers: getAuthHeaders() 
    });
    if (!response.ok) throw new Error('Error al cargar detalle');
    return await response.json();
};