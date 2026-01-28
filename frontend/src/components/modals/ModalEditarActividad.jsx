import { useState, useEffect } from 'react';
import { updateActividad } from '../../services/cronogramaService';
import '../../styles/Cronograma.css'; // Usamos los mismos estilos del módulo

const ModalEditarActividad = ({ isOpen, onClose, actividad, onSuccess }) => {
    const [formData, setFormData] = useState({
        nombreActividad: '',
        descripcion: '',
        responsable: '',
        fechaLimite: ''
    });

    // Efecto para cargar los datos cuando se abre el modal
    useEffect(() => {
        if (isOpen && actividad) {
            // Lógica segura para la fecha
            let fechaSafe = '';
            if (actividad.Fecha_Programada || actividad.Fecha_Limite || actividad.Fecha_Inicio) {
                const fechaRaw = actividad.Fecha_Programada || actividad.Fecha_Limite || actividad.Fecha_Inicio;
                const dateObj = new Date(fechaRaw);
                
                // Verificamos si es una fecha válida antes de convertir
                if (!isNaN(dateObj.getTime())) {
                    fechaSafe = dateObj.toISOString().split('T')[0];
                }
            }

            setFormData({
                nombreActividad: actividad.Nombre_Actividad || actividad.Titulo || '',
                descripcion: actividad.Descripcion || '',
                responsable: actividad.Responsable || '',
                fechaLimite: fechaSafe
            });
        }
    }, [isOpen, actividad]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Identificar ID (puede venir como ID_Actividad o ID)
            const id = actividad.ID_Actividad || actividad.ID;
            
            await updateActividad(id, {
                ...formData,
                // Si el backend espera nombres específicos, mapearlos aquí:
                nombreActividad: formData.nombreActividad,
                fechaLimite: formData.fechaLimite // Se envía YYYY-MM-DD
            });
            
            onSuccess();
            onClose();
        } catch (error) {
            alert('Error al actualizar: ' + error.message);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-header-clean">
                    <h3>Editar Actividad</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="modal-body-clean">
                        
                        {/* NOMBRE */}
                        <div style={{marginBottom:'15px'}}>
                            <label className="input-label">Nombre de la Actividad</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                required
                                value={formData.nombreActividad} 
                                onChange={e => setFormData({...formData, nombreActividad: e.target.value})} 
                            />
                        </div>

                        {/* RESPONSABLE */}
                        <div style={{marginBottom:'15px'}}>
                            <label className="input-label">Responsable</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                required
                                value={formData.responsable} 
                                onChange={e => setFormData({...formData, responsable: e.target.value})} 
                            />
                        </div>

                        {/* FECHA */}
                        <div style={{marginBottom:'15px'}}>
                            <label className="input-label">Fecha Programada</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                required
                                value={formData.fechaLimite} 
                                onChange={e => setFormData({...formData, fechaLimite: e.target.value})} 
                            />
                        </div>

                        {/* DESCRIPCIÓN */}
                        <div style={{marginBottom:'15px'}}>
                            <label className="input-label">Descripción / Observaciones</label>
                            <textarea 
                                className="form-control" 
                                rows="3"
                                value={formData.descripcion} 
                                onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                            />
                        </div>

                    </div>
                    
                    <div className="modal-footer-clean">
                        <button type="button" className="btn btn-grey" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-blue">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalEditarActividad;