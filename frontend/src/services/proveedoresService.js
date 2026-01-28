import { API_URL, getAuthHeaders } from './api';

// Obtener todas las evaluaciones (Para la tabla principal)
export const getEvaluaciones = async () => {
    try {
        const response = await fetch(`${API_URL}/proveedores`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Error al cargar evaluaciones');
        return await response.json();
    } catch (error) {
        console.error("Error en getEvaluaciones:", error);
        throw error;
    }
};

// Obtener el detalle de una evaluación específica (Para el Modal)
export const getEvaluacionById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/proveedores/${id}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Error al obtener el detalle de la evaluación');
        return await response.json();
    } catch (error) {
        console.error(`Error en getEvaluacionById (${id}):`, error);
        throw error;
    }
};

// Guardar una nueva evaluación
export const createEvaluacion = async (payload) => {
    try {
        const response = await fetch(`${API_URL}/proveedores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Error al guardar la evaluación');
        return await response.json();
    } catch (error) {
        console.error("Error en createEvaluacion:", error);
        throw error;
    }
};