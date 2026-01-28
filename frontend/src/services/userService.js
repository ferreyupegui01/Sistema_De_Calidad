import { API_URL, getAuthHeaders } from './api';

export const getUsers = async () => {
    const response = await fetch(`${API_URL}/usuarios`, { headers: getAuthHeaders() });
    return await response.json();
};

export const getRoles = async () => {
    const response = await fetch(`${API_URL}/usuarios/roles`, { headers: getAuthHeaders() });
    return await response.json();
};

export const createUser = async (userData) => {
    const response = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.mensaje);
    return data;
};

export const updateUser = async (id, userData) => {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.mensaje);
    return data;
};

export const toggleUserStatus = async (id, nuevoEstado) => {
    const response = await fetch(`${API_URL}/usuarios/estado/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado })
    });
    if (!response.ok) throw new Error('Error al cambiar estado');
    return await response.json();
};

export const resetUserPassword = async (id, nuevaPassword) => {
    const response = await fetch(`${API_URL}/usuarios/password/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nuevaPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.mensaje);
    return data;
};

// NUEVA: Actualizar correo de perfil
export const updateEmailPerfil = async (id, email) => {
    const response = await fetch(`${API_URL}/usuarios/perfil/correo/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.mensaje);
    return data;
};