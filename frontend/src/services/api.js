// frontend/src/services/api.js
export const API_URL = 'http://localhost:3000/api';

// Función helper para obtener el token del localStorage
export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};