// frontend/src/services/specializedService.js
import { API_URL, getAuthHeaders } from './api';

// 1. Registrar Agua (FormData con foto)
export const registrarAgua = async (puntoToma, medicion, fotoFile) => {
    const formData = new FormData();
    formData.append('puntoToma', puntoToma);
    formData.append('medicion', medicion);
    formData.append('foto', fotoFile);

    const token = localStorage.getItem('token');
    // Fetch pone el Content-Type correcto para FormData automáticamente
    const response = await fetch(`${API_URL}/specialized/agua/verificar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.mensaje);
    return data;
};

// 2. Obtener Historial Agua
export const getHistorialAgua = async () => {
    const response = await fetch(`${API_URL}/specialized/agua/historial`, {
        headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.mensaje || 'Error al obtener historial');
    return data;
};

// 3. Kiosco: Enviar Evaluación (Público)
export const submitEvaluacionKiosco = async (data) => {
    // data: { idEvaluacion, nombreEvaluado, calificacion, detalleRespuestas }
    const response = await fetch(`${API_URL}/specialized/kiosco/evaluar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.mensaje);
    return result;
};

// 4. Kiosco: Obtener Preguntas (Público)
export const getPreguntasKiosco = async (idEvaluacion) => {
    const response = await fetch(`${API_URL}/specialized/kiosco/preguntas/${idEvaluacion}`);
    const result = await response.json();
    if (!response.ok) throw new Error('Error al cargar preguntas');
    return result;
};

// 5. Helper de Subida (Usado por ACPM y otros)
export const uploadFile = async (file, modulo, tipo, nombre) => {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('idCarpeta', 1); // Carpeta raíz por defecto para temporales
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/drive/archivo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.mensaje);
    }
    // Retornamos la URL pública construida (ajustar si backend cambia)
    return { url: `http://localhost:3000/uploads/${file.name}` }; 
};