// frontend/src/services/reportesService.js
import { API_URL, getAuthHeaders } from './api';

// Crear Reporte (Soporta Fotos y Archivos)
export const createReporte = async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/reportes`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}` 
        },
        body: formData
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.mensaje);
    return result;
};

// Obtener Historial de Reportes
export const getReportes = async () => {
    const response = await fetch(`${API_URL}/reportes`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// Obtener Detalle de un Reporte
export const getReporteDetalle = async (id) => {
    const response = await fetch(`${API_URL}/reportes/${id}/detalle`, { 
        headers: getAuthHeaders() 
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.mensaje || 'Error al cargar detalles');
    return result;
};

// NUEVO: Verificar Reporte
export const verifyReporte = async (id) => {
    const response = await fetch(`${API_URL}/reportes/${id}/verificar`, {
        method: 'PUT',
        headers: getAuthHeaders()
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.mensaje || 'Error al verificar');
    return result;
};