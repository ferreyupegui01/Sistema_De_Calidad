import { useState } from 'react';
import { addSeguimiento } from '../../services/cronogramaService';
import '../../styles/Modal.css';
import { FaPaperPlane, FaTimes, FaHistory } from 'react-icons/fa';

const ModalBitacora = ({ isOpen, onClose, actividad, onSuccess }) => {
    const [nota, setNota] = useState('');

    if (!isOpen || !actividad) return null;

    // Convertir el string de bitácora "Fecha - Nota || Fecha - Nota ||" en Array
    // Separamos por '||' y filtramos vacíos
    const historial = actividad.Bitacora_Seguimiento 
        ? actividad.Bitacora_Seguimiento.split('||').filter(item => item.trim() !== '') 
        : [];

    const handleSend = async (e) => {
        e.preventDefault();
        if (!nota.trim()) return;
        try {
            await addSeguimiento(actividad.ID_Actividad, nota);
            setNota('');
            onSuccess(); // Recargar actividades para ver la nueva nota
        } catch (error) { alert('Error al guardar nota'); }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '500px'}}>
                <div className="modal-header">
                    <h3 style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <FaHistory color="#0c4760"/> Bitácora de Seguimiento
                    </h3>
                    <button className="modal-close-button" onClick={onClose}><FaTimes/></button>
                </div>
                
                <div className="modal-body" style={{background:'#f8fafc', padding:'0'}}>
                    {/* ZONA DE CHAT / HISTORIAL */}
                    <div style={{maxHeight:'300px', overflowY:'auto', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'10px'}}>
                        {historial.length === 0 ? (
                            <p style={{textAlign:'center', color:'#94a3b8', fontStyle:'italic'}}>No hay notas registradas.</p>
                        ) : (
                            historial.map((entry, idx) => {
                                // Separamos Fecha y Texto (Formato: "dd/MM/yyyy HH:mm - Texto")
                                const parts = entry.split(' - ');
                                const fecha = parts[0];
                                const texto = parts.slice(1).join(' - '); // Por si el texto tenía guiones

                                return (
                                    <div key={idx} style={{background:'white', padding:'0.8rem', borderRadius:'8px', border:'1px solid #e2e8f0', boxShadow:'0 2px 4px rgba(0,0,0,0.02)'}}>
                                        <div style={{fontSize:'0.75rem', color:'#64748b', marginBottom:'4px', fontWeight:'bold'}}>{fecha}</div>
                                        <div style={{color:'#334155', fontSize:'0.9rem'}}>{texto}</div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* INPUT PARA NUEVA NOTA */}
                    <form onSubmit={handleSend} style={{padding:'1rem', borderTop:'1px solid #e2e8f0', background:'white', display:'flex', gap:'8px'}}>
                        <input 
                            type="text" 
                            placeholder="Escriba una observación..." 
                            style={{flex:1, padding:'0.7rem', border:'1px solid #cbd5e1', borderRadius:'6px', outline:'none'}}
                            value={nota}
                            onChange={(e) => setNota(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="btn-primary-modal" style={{padding:'0 1rem'}}>
                            <FaPaperPlane />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModalBitacora;