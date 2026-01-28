import { useState } from 'react';
import { createCronograma } from '../../services/cronogramaService';
import '../../styles/Cronograma.css';

const ModalCreateCronograma = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ 
        nombre: '', 
        anio: new Date().getFullYear(), 
        descripcion: '',
        tipo: 'GENERAL' 
    });
    
    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createCronograma(formData);
            onSuccess(); 
            onClose();
            // Resetear el formulario al valor por defecto GENERAL
            setFormData({ nombre: '', anio: new Date().getFullYear(), descripcion: '', tipo: 'GENERAL' });
        } catch (error) { 
            alert('Error: ' + error.message); 
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-header-clean">
                    <h3>Crear Nuevo Cronograma</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body-clean">
                        
                        {/* SELECTOR DE TIPO ACTUALIZADO (Sin Muestreo ni PMIR) */}
                        <div style={{marginBottom:'15px'}}>
                            <label className="input-label">Tipo de Programa</label>
                            <select 
                                className="form-control"
                                value={formData.tipo}
                                onChange={e => setFormData({...formData, tipo: e.target.value})}
                                style={{background: '#f8fafc', fontWeight:'600', color:'#0f172a'}}
                            >
                                <option value="GENERAL">General / Administrativo</option>
                                <option value="CALIBRACION">Programa de Calibración</option>
                            </select>
                            <small style={{color:'#64748b', fontSize:'0.8rem'}}>
                                * Define en qué módulo aparecerá este cronograma.
                            </small>
                        </div>

                        <div style={{marginBottom:'15px'}}>
                            <label className="input-label">Nombre del Cronograma *</label>
                            <input type="text" className="form-control" placeholder="Ej: Plan Gestión Residuos 2026" required
                                value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                        </div>
                        <div style={{marginBottom:'15px'}}>
                            <label className="input-label">Año de Aplicación</label>
                            <input type="number" className="form-control" placeholder="2026"
                                value={formData.anio} onChange={e => setFormData({...formData, anio: e.target.value})} />
                        </div>
                        <div style={{marginBottom:'15px'}}>
                            <label className="input-label">Descripción (Opcional)</label>
                            <textarea className="form-control" rows="2"
                                value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                        </div>
                    </div>
                    <div className="modal-footer-clean">
                        <button type="button" className="btn btn-grey" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-blue">Crear Cronograma</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalCreateCronograma;