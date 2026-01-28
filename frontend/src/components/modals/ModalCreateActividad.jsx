/* eslint-disable no-empty */
import { useState, useEffect } from 'react';
import { createActividad } from '../../services/cronogramaService';
import { getUsers } from '../../services/userService';
import '../../styles/Cronograma.css';

const ModalCreateActividad = ({ isOpen, onClose, idCronograma, onSuccess }) => {
    const [formData, setFormData] = useState({ nombreActividad: '', responsable: '', fechaLimite: '', descripcion: '' });
    const [usuarios, setUsuarios] = useState([]);

    // eslint-disable-next-line react-hooks/immutability
    useEffect(() => { if (isOpen) loadUsers(); }, [isOpen]);
    // eslint-disable-next-line no-unused-vars
    const loadUsers = async () => { try { setUsuarios(await getUsers()); } catch (e) {} };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createActividad({ idCronograma, ...formData });
            onSuccess(); onClose();
        } catch (error) { alert(error.message); }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-header-clean">
                    <h3>Añadir Nueva Actividad</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body-clean">
                        <div style={{marginBottom:'15px'}}>
                            <label className="input-label">Nombre de la Actividad *</label>
                            <input type="text" className="form-control" placeholder="Ej: Capacitación Uso de EPP" required
                                value={formData.nombreActividad} onChange={e => setFormData({...formData, nombreActividad: e.target.value})} />
                        </div>
                        <div style={{marginBottom:'15px'}}>
                            <label className="input-label">Responsable *</label>
                            <select className="form-control" required value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})}>
                                <option value="">-- Seleccione un responsable --</option>
                                {usuarios.map(u => <option key={u.ID_Usuario} value={u.Nombre_Completo}>{u.Nombre_Completo}</option>)}
                            </select>
                        </div>
                        <div style={{marginBottom:'15px'}}>
                            <label className="input-label">Fecha Límite *</label>
                            <input type="date" className="form-control" required
                                value={formData.fechaLimite} onChange={e => setFormData({...formData, fechaLimite: e.target.value})} />
                        </div>
                        <div>
                            <label className="input-label">Descripción (Opcional)</label>
                            <textarea className="form-control" rows="2"
                                value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                        </div>
                    </div>
                    <div className="modal-footer-clean">
                        <button type="button" className="btn btn-grey" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-blue">Añadir Actividad</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ModalCreateActividad;