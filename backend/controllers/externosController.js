// backend/controllers/externosController.js

import dotenv from 'dotenv';

dotenv.config();

// 1. Obtenemos las variables exactas de tu .env
const BRIDGE_URL = process.env.BRIDGE_API_URL;    // Puerto 9075 (RRHH)
const SOFSIN_URL = process.env.SOFSIN_API_URL;    // Puerto 8065 (ERP)
const BRIDGE_KEY = process.env.BRIDGE_SECRET_KEY;

// --- FUNCIONES AUXILIARES ---

// Auxiliar para RRHH (Maquinistas y Selladores - Puerto 9075)
const fetchFromBridge = async (endpoint) => {
    try {
        if (!BRIDGE_URL) throw new Error("Falta definir BRIDGE_API_URL en el .env");

        const response = await fetch(`${BRIDGE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': BRIDGE_KEY
            }
        });

        if (!response.ok) {
            console.error(`Error Puente RRHH [${endpoint}]: ${response.statusText}`);
            return [];
        }

        return await response.json();
    } catch (error) {
        console.error(`Error crítico conectando al puente RRHH [${endpoint}]:`, error.message);
        return [];
    }
};

// Auxiliar para SOFSIN (Productos, Proveedores, Clientes - Puerto 8065)
const fetchFromSofsin = async (endpoint) => {
    try {
        if (!SOFSIN_URL) throw new Error("Falta definir SOFSIN_API_URL en el .env");

        const response = await fetch(`${SOFSIN_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': BRIDGE_KEY
            }
        });

        if (!response.ok) {
            console.error(`Error Puente SOFSIN [${endpoint}]: ${response.statusText}`);
            return [];
        }

        return await response.json();
    } catch (error) {
        console.error(`Error crítico conectando al puente SOFSIN [${endpoint}]:`, error.message);
        return [];
    }
};

// --- CONTROLADORES ---

// 1. Maquinistas (RRHH - 9075)
export const getMaquinistas = async (req, res) => {
    const rawData = await fetchFromBridge('/api/maquinistas');
    const safeData = Array.isArray(rawData) ? rawData : [];
    
    const data = safeData.map(m => ({
        id: m.cod_contrato,
        nombre: `${m.nombres} ${m.apellidos}`.trim()
    }));
    res.json(data);
};

// 2. Selladores (RRHH - 9075)
export const getSelladores = async (req, res) => {
    const rawData = await fetchFromBridge('/api/selladores');
    const safeData = Array.isArray(rawData) ? rawData : [];

    const data = safeData.map(s => ({
        id: s.cod_contrato,
        nombre: `${s.nombres} ${s.apellidos}`.trim()
    }));
    res.json(data);
};

// 3. Productos (SOFSIN - 8065)
export const getProductos = async (req, res) => {
    const rawData = await fetchFromSofsin('/api/items/producidos');
    const safeData = Array.isArray(rawData) ? rawData : [];

    const data = safeData.map(p => ({
        codigo: p.itecodigo,
        descripcion: p.itedesclarg ? p.itedesclarg.trim() : 'Sin Descripción',
        peso: p.peso_gramos ? Math.round(p.peso_gramos) : '' 
    }));
    res.json(data);
};

// 4. Proveedores (SOFSIN - 8065)
export const getProveedores = async (req, res) => {
    const rawData = await fetchFromSofsin('/api/items/proveedores');
    const safeData = Array.isArray(rawData) ? rawData : [];

    const data = safeData.map(p => ({
        codigo: p.tgecodigo,
        nombre: p.tgenombcomp
    }));
    res.json(data);
};

// 5. Clientes (SOFSIN - 8065) - ¡CORREGIDO CON CAMPOS REALES!
export const getClientes = async (req, res) => {
    try {
        const rawData = await fetchFromSofsin('/api/items/clientes');

        if (!Array.isArray(rawData)) {
            return res.json([]); 
        }

        // --- MAPEO CORREGIDO SEGÚN TU TERMINAL ---
        const data = rawData.map(c => ({
            // Usamos 'tcltercegener' como código
            codigo: c.tcltercegener || 'SIN_CODIGO',
            // Usamos 'tgenombcomp' que es donde viene el nombre real
            nombre: c.tgenombcomp ? c.tgenombcomp.trim() : 'CLIENTE SIN NOMBRE' 
        }));

        res.json(data);
    } catch (error) {
        console.error("Error procesando clientes:", error);
        res.json([]);
    }
};