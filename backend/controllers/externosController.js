// backend/controllers/externosController.js

import dotenv from 'dotenv';

dotenv.config();

// Obtenemos la URL y la Clave desde las variables de entorno (.env)
// Ejemplo: https://tunel-de-tu-empresa.trycloudflare.com
const BRIDGE_URL = process.env.BRIDGE_API_URL; 
const BRIDGE_KEY = process.env.BRIDGE_SECRET_KEY;

// Función auxiliar para realizar las peticiones al puente
const fetchFromBridge = async (endpoint) => {
    try {
        if (!BRIDGE_URL) throw new Error("Falta definir BRIDGE_API_URL en el .env");

        const response = await fetch(`${BRIDGE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': BRIDGE_KEY // Autenticación segura
            }
        });

        if (!response.ok) {
            console.error(`Error Puente [${endpoint}]: ${response.statusText}`);
            return []; // Retorna array vacío para no romper el frontend
        }

        return await response.json();
    } catch (error) {
        console.error(`Error crítico conectando al puente [${endpoint}]:`, error.message);
        return [];
    }
};

// --- CONTROLADORES (Ahora consumen la API Puente) ---

// 1. Obtener Maquinistas (RRHH)
export const getMaquinistas = async (req, res) => {
    // 1. Pedimos los datos crudos al puente
    const rawData = await fetchFromBridge('/api/rrhh/maquinistas');
    
    // 2. Procesamos/Limpiamos los datos aquí en la VPS
    const data = rawData.map(m => ({
        id: m.cod_contrato,
        nombre: `${m.nombres} ${m.apellidos}`.trim()
    }));
    
    res.json(data);
};

// 2. Obtener Selladores (RRHH)
export const getSelladores = async (req, res) => {
    const rawData = await fetchFromBridge('/api/rrhh/selladores');
    
    const data = rawData.map(s => ({
        id: s.cod_contrato,
        nombre: `${s.nombres} ${s.apellidos}`.trim()
    }));

    res.json(data);
};

// 3. Obtener Productos (ERP)
export const getProductos = async (req, res) => {
    const rawData = await fetchFromBridge('/api/erp/productos');

    const data = rawData.map(p => ({
        codigo: p.itecodigo,
        descripcion: p.itedesclarg ? p.itedesclarg.trim() : 'Sin Descripción',
        // La lógica de redondeo se mantiene aquí
        peso: p.peso_gramos ? Math.round(p.peso_gramos) : '' 
    }));

    res.json(data);
};

// 4. Obtener Proveedores (ERP)
export const getProveedores = async (req, res) => {
    const rawData = await fetchFromBridge('/api/erp/proveedores');

    const data = rawData.map(p => ({
        codigo: p.tgecodigo,
        nombre: p.tgenombcomp
    }));

    res.json(data);
};

// 5. Obtener Clientes (ERP)
export const getClientes = async (req, res) => {
    const rawData = await fetchFromBridge('/api/erp/clientes');

    const data = rawData.map(c => ({
        codigo: c.tclcodigo,
        nombre: c.tclnombre 
    }));
    
    res.json(data);
};