// frontend/src/services/auditService.js
import { API_URL, getAuthHeaders } from './api';

export const getAuditoriaData = async () => {
    const response = await fetch(`${API_URL}/auditoria`, { headers: getAuthHeaders() });
    return await response.json();
};