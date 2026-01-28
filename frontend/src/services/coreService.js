import { API_URL, getAuthHeaders } from './api';

// --- ACTIVOS ---
export const getActivos = async () => {
    const response = await fetch(`${API_URL}/core/activos`, { headers: getAuthHeaders() });
    return await response.json();
};

export const createActivo = async (data) => {
    const response = await fetch(`${API_URL}/core/activos`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.mensaje);
    return result;
};

export const updateActivo = async (id, data) => {
    const response = await fetch(`${API_URL}/core/activos/${id}`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar activo');
    return await response.json();
};

export const toggleActivoStatus = async (id, estado) => {
    const response = await fetch(`${API_URL}/core/activos/${id}/estado`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ nuevoEstado: estado })
    });
    if (!response.ok) throw new Error('Error al cambiar estado');
    return await response.json();
};

// --- CATEGORÍAS ---
export const getCategorias = async () => {
    const response = await fetch(`${API_URL}/core/categorias`, { headers: getAuthHeaders() });
    return await response.json();
};

export const createCategoria = async (nombre) => {
    const response = await fetch(`${API_URL}/core/categorias`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ nombre })
    });
    return await response.json();
};

// --- FORMULARIOS ---
export const getAllFormularios = async () => {
    const response = await fetch(`${API_URL}/core/formularios`, { headers: getAuthHeaders() });
    if (!response.ok) return [];
    return await response.json();
};

export const createFormulario = async (data) => {
    const response = await fetch(`${API_URL}/core/formularios`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear formulario');
    return await response.json();
};

export const updateFormulario = async (id, data) => {
    const response = await fetch(`${API_URL}/core/formularios/${id}`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al editar formulario');
    return await response.json();
};

export const deleteFormulario = async (id) => {
    const response = await fetch(`${API_URL}/core/formularios/${id}`, {
        method: 'DELETE', headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar formulario');
    return await response.json();
};

export const toggleFormVisibility = async (id, visible) => {
    const response = await fetch(`${API_URL}/core/formularios/${id}/visibilidad`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ esVisible: visible })
    });
    if (!response.ok) throw new Error('Error visibilidad');
    return await response.json();
};

// --- PREGUNTAS ---
export const getPreguntas = async (idFormulario) => {
    const response = await fetch(`${API_URL}/core/formularios/${idFormulario}/preguntas`, { headers: getAuthHeaders() });
    return await response.json();
};

// [IMPORTANTE] Esta función debe recibir 'tipo'
export const addPregunta = async (idFormulario, texto, tipo) => {
    const response = await fetch(`${API_URL}/core/formularios/pregunta`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ idFormulario, texto, tipo }) 
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.mensaje || 'Error al agregar pregunta');
    }
    return await response.json();
};

export const deletePregunta = async (idPregunta) => {
    const response = await fetch(`${API_URL}/core/formularios/pregunta/${idPregunta}`, {
        method: 'DELETE', headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar pregunta');
    return await response.json();
};

// --- ASIGNACIÓN ---
export const assignFormulario = async (idActivo, idFormulario) => {
    const response = await fetch(`${API_URL}/core/asignar`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ idActivo, idFormulario })
    });
    if(!response.ok) throw new Error('Error');
    return await response.json();
};

export const getFormsByActivo = async (idActivo) => {
    const response = await fetch(`${API_URL}/core/asignar/${idActivo}`, { headers: getAuthHeaders() });
    return await response.json();
};

// --- TARJETAS ---
export const getTarjetas = async (modulo) => {
    const response = await fetch(`${API_URL}/core/tarjetas/${modulo}`, { headers: getAuthHeaders() });
    return await response.json();
};

export const createTarjeta = async (data) => {
    const response = await fetch(`${API_URL}/core/tarjetas`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear tarjeta');
    return await response.json();
};

export const deleteTarjeta = async (id) => {
    const response = await fetch(`${API_URL}/core/tarjetas/${id}`, {
        method: 'DELETE', headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar tarjeta');
    return await response.json();
};