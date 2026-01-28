// frontend/src/services/dashboardService.js
import { API_URL, getAuthHeaders } from './api';

export const getDashboardStats = async () => {
    const response = await fetch(`${API_URL}/dashboard/resumen`, {
        headers: getAuthHeaders()
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.mensaje || 'Error al obtener datos del dashboard');
    return result;
};