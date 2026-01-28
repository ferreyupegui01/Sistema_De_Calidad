// frontend/src/services/capacitacionService.js
import { API_URL, getAuthHeaders } from './api';

// Obtener lista general de resultados
export const getResultados = async () => {
    const response = await fetch(`${API_URL}/capacitacion/resultados`, { headers: getAuthHeaders() });
    return await response.json();
};

// Aprobar o Rechazar
export const updateEstadoResultado = async (id, estado) => {
    const response = await fetch(`${API_URL}/capacitacion/resultados/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado })
    });
    if (!response.ok) throw new Error('Error al actualizar');
    return await response.json();
};

// NUEVO: Ver detalle de respuestas de un examen específico
export const getDetalleResultado = async (idResultado) => {
    const response = await fetch(`${API_URL}/capacitacion/resultados/${idResultado}`, { 
        headers: getAuthHeaders() 
    });
    if (!response.ok) throw new Error('Error al cargar detalle');
    return await response.json();
};

// Obtener configuración de preguntas
export const getPreguntasCapacitacion = async (idEvaluacion) => {
    const response = await fetch(`${API_URL}/capacitacion/preguntas/${idEvaluacion}`, { headers: getAuthHeaders() });
    return await response.json();
};

// Agregar nueva pregunta con opciones
export const addPreguntaCapacitacion = async (idEvaluacion, texto, opciones, correcta) => {
    const response = await fetch(`${API_URL}/capacitacion/preguntas`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ idEvaluacion, texto, opciones, correcta })
    });
    if (!response.ok) throw new Error('Error al agregar');
    return await response.json();
};

// Eliminar pregunta
export const deletePreguntaCapacitacion = async (id) => {
    const response = await fetch(`${API_URL}/capacitacion/preguntas/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar');
    return await response.json();
};