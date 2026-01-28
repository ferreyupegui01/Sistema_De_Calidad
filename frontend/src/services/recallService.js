import { API_URL, getAuthHeaders } from './api';

// --- SALIDAS (DISTRIBUCIÓN) ---

export const getSalidas = async () => {
    const res = await fetch(`${API_URL}/recall/salidas`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error cargando salidas');
    return await res.json();
};

export const createSalida = async (formData) => {
    // Nota: No poner Content-Type cuando es FormData, el navegador lo pone con el boundary
    const res = await fetch(`${API_URL}/recall/salidas`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.mensaje || 'Error al crear salida');
    }
    return await res.json();
};