import { API_URL, getAuthHeaders } from './api';

export const getNotificaciones = async () => {
    const response = await fetch(`${API_URL}/notificaciones`, { headers: getAuthHeaders() });
    return await response.json();
};

// CAMBIO: Función para eliminar
export const deleteNotification = async (id) => {
    await fetch(`${API_URL}/notificaciones/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
};