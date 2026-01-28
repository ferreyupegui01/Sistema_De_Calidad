import { API_URL, getAuthHeaders } from './api';

export const getBitacora = async () => {
    const response = await fetch(`${API_URL}/bitacora`, { headers: getAuthHeaders() });
    return await response.json();
};