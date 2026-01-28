// frontend/src/services/authService.js
import { API_URL } from './api';

export const loginService = async (cedula, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cedula, password })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.mensaje || 'Error en la petición');
    }

    return data;
};