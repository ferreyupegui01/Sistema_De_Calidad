import { API_URL, getAuthHeaders } from './api';

export const getFichasTecnicas = async () => {
    const response = await fetch(`${API_URL}/trazabilidad/fichas`, { headers: getAuthHeaders() });
    return await response.json();
};

export const uploadFichaTecnica = async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/trazabilidad/fichas`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // FormData no lleva Content-Type manual
        body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.mensaje);
    return data;
};

export const deleteFichaTecnica = async (id) => {
    const response = await fetch(`${API_URL}/trazabilidad/fichas/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar');
    return await response.json();
};