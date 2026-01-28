import { useState } from 'react';
import { updateEstadoActividad, addSeguimiento } from '../../services/cronogramaService';
import { FaTimes, FaTools, FaCheckCircle, FaBan, FaClock, FaPaperPlane, FaCamera } from 'react-icons/fa';
import '../../styles/Modal.css';

const ModalGestionarActividad = ({ isOpen, onClose, actividad, onSuccess }) => {
    const [estado, setEstado] = useState(actividad?.Estado || 'Pendiente');
    const [nota, setNota] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !actividad) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            // 1. Actualizar Estado (si cambió)
            if (estado !== actividad.Estado) {
                await updateEstadoActividad(actividad.ID_Actividad, estado);
            }

            // 2. Enviar Nota y/o Evidencia (FormData)
            if (nota.trim() || archivo) {
                const formData = new FormData();
                formData.append('nota', nota);
                if (archivo) formData.append('evidencia', archivo);
                
                await addSeguimiento(actividad.ID_Actividad, formData);
            }

            onSuccess();
            onClose();
            // Reset
            setNota(''); setArchivo(null);
        } catch (error) { 
            alert('Error al gestionar: ' + error.message); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-header-clean">
                    <h3>Gestionar Actividad</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body-clean">
                    <h4 style={{marginTop:0, marginBottom:'15px', color:'#0c4760'}}>{actividad.Nombre_Actividad}</h4>
                    
                    <div style={{marginBottom:'20px'}}>
                        <label className="input-label">Actualizar Estado</label>
                        <div style={{display:'flex', gap:'10px'}}>
                            <button onClick={() => setEstado('Realizada')} className={`btn ${estado === 'Realizada' ? 'btn-blue' : 'btn-grey'}`} style={{flex:1, opacity: estado==='Realizada'?1:0.5}}>
                                <FaCheckCircle/> Realizada
                            </button>
                            <button onClick={() => setEstado('Pendiente')} className={`btn ${estado === 'Pendiente' ? 'btn-yellow' : 'btn-grey'}`} style={{flex:1, opacity: estado==='Pendiente'?1:0.5, color: estado==='Pendiente'?'black':'white'}}>
                                <FaClock/> Pendiente
                            </button>
                            <button onClick={() => setEstado('Cancelada')} className={`btn ${estado === 'Cancelada' ? 'btn-red' : 'btn-grey'}`} style={{flex:1, opacity: estado==='Cancelada'?1:0.5}}>
                                <FaBan/> Cancelada
                            </button>
                        </div>
                    </div>
                    
                    <div style={{marginBottom:'15px'}}>
                        <label className="input-label">Observaciones / Bitácora</label>
                        <textarea className="form-control" rows="3" placeholder="Ej: Actividad completada, se adjunta soporte..." value={nota} onChange={e => setNota(e.target.value)}></textarea>
                    </div>
                    
                    <div style={{marginBottom:'15px'}}>
                        <label className="input-label">Adjuntar Evidencia (Foto/PDF)</label>
                        <div style={{position:'relative'}}>
                            <input 
                                type="file" 
                                className="form-control" 
                                onChange={e => setArchivo(e.target.files[0])}
                                accept="image/*,.pdf"
                                style={{paddingLeft:'40px'}}
                            />
                            <FaCamera style={{position:'absolute', left:'12px', top:'10px', color:'#64748b'}}/>
                        </div>
                    </div>
                </div>
                <div className="modal-footer-clean">
                    <button className="btn btn-grey" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-blue" onClick={handleSave} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar Gestión'}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ModalGestionarActividad;