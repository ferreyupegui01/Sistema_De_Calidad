import { API_URL, getAuthHeaders } from './api';

export const getListasExternas = async () => {
    // Función auxiliar para proteger cada llamada individualmente
    // Si una falla, retorna [] en lugar de romper todo el Promise.all
    const safeFetch = async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}/externos${endpoint}`, { headers: getAuthHeaders() });
            
            if (!response.ok) {
                console.warn(`⚠️ Advertencia: Falló la carga de ${endpoint} (Status: ${response.status})`);
                return [];
            }
            return await response.json();
        } catch (error) {
            console.error(`❌ Error de red cargando ${endpoint}:`, error);
            return [];
        }
    };

    try {
        // Hacemos las peticiones en paralelo, pero usando nuestra función segura
        const [productos, proveedores, maquinistas, selladores, clientes] = await Promise.all([
            safeFetch('/productos'),
            safeFetch('/proveedores'),
            safeFetch('/maquinistas'),
            safeFetch('/selladores'),
            safeFetch('/clientes') // <--- Si esto falla, ahora solo devolverá [] y lo demás cargará
        ]);

        return {
            productos: productos || [],
            proveedores: proveedores || [],
            maquinistas: maquinistas || [],
            selladores: selladores || [],
            clientes: clientes || []
        };

    } catch (error) {
        console.error("Error crítico en getListasExternas:", error);
        // Fallback final
        return { productos: [], proveedores: [], maquinistas: [], selladores: [], clientes: [] };
    }
};