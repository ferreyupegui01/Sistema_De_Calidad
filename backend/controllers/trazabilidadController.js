// backend/controllers/trazabilidadController.js
import { getConnection, sql } from '../config/db.js';
import { registrarLog } from '../libs/logger.js';

// LISTAR FICHAS (Para Admin y Colaborador)
export const listarFichas = async (req, res) => {
    try {
        const pool = await getConnection();
        // Usamos el SP genérico filtrando por Módulo y SubTipo
        const result = await pool.request()
            .input('Modulo', sql.NVarChar, 'TRAZABILIDAD')
            .input('SubTipo', sql.NVarChar, 'FICHA_TECNICA')
            .execute('dbo.SP_ListarDocumentos');
        
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al listar fichas técnicas' });
    }
};

// SUBIR FICHA (Solo Admin)
export const subirFicha = async (req, res) => {
    const { nombre, descripcion } = req.body;
    
    if (!req.file) return res.status(400).json({ mensaje: 'Debe subir un archivo PDF o Imagen' });

    const urlArchivo = `http://localhost:3000/uploads/${req.file.filename}`;
    const ext = req.file.filename.split('.').pop().toLowerCase();
    
    // Determinamos tipo de origen visual
    let tipoOrigen = 'PDF';
    if (['jpg', 'jpeg', 'png'].includes(ext)) tipoOrigen = 'Imagen';
    else if (['doc', 'docx'].includes(ext)) tipoOrigen = 'Word';
    else if (['xls', 'xlsx'].includes(ext)) tipoOrigen = 'Excel';

    try {
        const pool = await getConnection();
        await pool.request()
            .input('Modulo', sql.NVarChar, 'TRAZABILIDAD')
            .input('SubTipo', sql.NVarChar, 'FICHA_TECNICA')
            .input('Nombre', sql.NVarChar, nombre)
            .input('TipoOrigen', sql.NVarChar, tipoOrigen)
            .input('UrlArchivo', sql.NVarChar, urlArchivo)
            .input('Descripcion', sql.NVarChar, descripcion || '')
            .execute('dbo.SP_GuardarDocumento');

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'SUBIR', 'Trazabilidad', `Subió ficha técnica: ${nombre}`);
        res.json({ mensaje: 'Ficha técnica guardada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al guardar la ficha' });
    }
};

// ELIMINAR FICHA (Solo Admin)
export const eliminarFicha = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('ID_Doc', sql.Int, id)
            .execute('dbo.SP_EliminarDocumento'); // Borrado lógico

        await registrarLog(req.usuario.nombre, req.usuario.rol, 'ELIMINAR', 'Trazabilidad', `Eliminó ficha ID: ${id}`);
        res.json({ mensaje: 'Ficha eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar' });
    }
};