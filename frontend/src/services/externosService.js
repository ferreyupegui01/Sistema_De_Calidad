import { API_URL, getAuthHeaders } from './api';

export const getListasExternas = async () => {
    try {
        // Asumiendo que tienes endpoints separados o uno unificado. 
        // Si usas endpoints separados, agrega el fetch de clientes:
        
        const [prodRes, provRes, maqRes, sellRes, cliRes] = await Promise.all([
            fetch(`${API_URL}/externos/productos`, { headers: getAuthHeaders() }),
            fetch(`${API_URL}/externos/proveedores`, { headers: getAuthHeaders() }),
            fetch(`${API_URL}/externos/maquinistas`, { headers: getAuthHeaders() }),
            fetch(`${API_URL}/externos/selladores`, { headers: getAuthHeaders() }),
            fetch(`${API_URL}/externos/clientes`, { headers: getAuthHeaders() }) // <--- NUEVO
        ]);

        return {
            productos: await prodRes.json(),
            proveedores: await provRes.json(),
            maquinistas: await maqRes.json(),
            selladores: await sellRes.json(),
            clientes: await cliRes.json() // <--- NUEVO
        };
    } catch (error) {
        console.error("Error cargando listas externas", error);
        return { productos: [], proveedores: [], maquinistas: [], selladores: [], clientes: [] };
    }
};