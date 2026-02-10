import { API_URL } from './api';

export const loginService = async (cedula, password) => {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // OBLIGATORIO para evitar error 400
            },
            body: JSON.stringify({ cedula, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || 'Error en la petición de autenticación');
        }

        return data;
    } catch (error) {
        console.error("Error en loginService:", error);
        throw error;
    }
};