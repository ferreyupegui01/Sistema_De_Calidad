import { API_URL, getAuthHeaders } from './api';

// --- CRONOGRAMAS ---

// ACTUALIZADO: Ahora acepta un parámetro 'tipo' opcional
export const getCronogramas = async (tipo = null) => {
    let url = `${API_URL}/cronogramas`;
    if (tipo) {
        url += `?tipo=${tipo}`;
    }
    const response = await fetch(url, { headers: getAuthHeaders() });
    return await response.json();
};

export const createCronograma = async (data) => {
    // data debe incluir { nombre, anio, descripcion, tipo }
    const response = await fetch(`${API_URL}/cronogramas`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data)
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.mensaje || 'Error al crear cronograma');
    return res;
};

export const deleteCronograma = async (id) => {
    const response = await fetch(`${API_URL}/cronogramas/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Error al eliminar');
    return await response.json();
};

// --- ACTIVIDADES ---

// Traer todo para el calendario global
export const getAllActividades = async () => {
    const response = await fetch(`${API_URL}/cronogramas/actividades/todas`, { headers: getAuthHeaders() });
    return await response.json();
};

export const getActividades = async (idCronograma) => {
    const response = await fetch(`${API_URL}/cronogramas/${idCronograma}/actividades`, { headers: getAuthHeaders() });
    return await response.json();
};

export const createActividad = async (data) => {
    const response = await fetch(`${API_URL}/cronogramas/actividad`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data)
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.mensaje);
    return res;
};

export const updateActividad = async (id, data) => {
    const response = await fetch(`${API_URL}/cronogramas/actividad/${id}`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar');
    return await response.json();
};

export const deleteActividad = async (id) => {
    const response = await fetch(`${API_URL}/cronogramas/actividad/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Error eliminando actividad');
    return await response.json();
};

export const updateEstadoActividad = async (id, nuevoEstado) => {
    const response = await fetch(`${API_URL}/cronogramas/actividad/estado/${id}`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ nuevoEstado })
    });
    return await response.json();
};

// --- SEGUIMIENTO CON ARCHIVOS ---
export const addSeguimiento = async (id, formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/cronogramas/actividad/seguimiento/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}` 
        },
        body: formData
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.mensaje);
    return res;
};