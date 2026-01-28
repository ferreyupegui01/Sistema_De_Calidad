import { useState, useEffect } from 'react';
import { getDetalleResultado } from '../../services/capacitacionService';
import '../../styles/Modal.css';
import { FaTimes, FaCheckCircle, FaTimesCircle, FaUser } from 'react-icons/fa';

const ModalVerDetalleCapacitacion = ({ isOpen, onClose, resultado }) => {
    const [detalles, setDetalles] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && resultado) {
            cargarDetalle();
        }
    }, [isOpen, resultado]);

    const cargarDetalle = async () => {
        setLoading(true);
        try {
            const data = await getDetalleResultado(resultado.ID_Resultado);
            setDetalles(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !resultado) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '700px', maxHeight: '90vh'}}>
                <div className="modal-header">
                    <h2>Detalle de Respuestas</h2>
                    <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
                </div>

                <div className="modal-body" style={{background: '#f8fafc'}}>
                    
                    {/* CABECERA USUARIO */}
                    <div style={{
                        background: 'white', padding: '1rem', borderRadius: '8px', 
                        border: '1px solid #e2e8f0', marginBottom: '1rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <div style={{width:'40px', height:'40px', background:'#e0f2fe', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#0369a1'}}>
                                <FaUser />
                            </div>
                            <div>
                                <h4 style={{margin:0, color:'#0f172a'}}>{resultado.Nombre_Evaluado}</h4>
                                
                                {/* FECHA CORREGIDA CON UTC */}
                                <span style={{fontSize:'0.85rem', color:'#64748b'}}>
                                    {new Date(resultado.Fecha_Ejecucion).toLocaleString('es-CO', { timeZone: 'UTC' })}
                                </span>
                            </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                            <div style={{fontSize:'0.8rem', color:'#64748b'}}>Calificación</div>
                            <div style={{fontSize:'1.5rem', fontWeight:'bold', color: resultado.Calificacion >= 4 ? '#16a34a' : '#dc2626'}}>
                                {resultado.Calificacion}
                            </div>
                        </div>
                    </div>

                    {/* LISTA DE PREGUNTAS */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        {loading ? <p style={{textAlign:'center', color:'#999'}}>Cargando respuestas...</p> : 
                         detalles.length === 0 ? <p style={{textAlign:'center', color:'#94a3b8'}}>No se encontraron detalles para este examen.</p> :
                         detalles.map((item, idx) => (
                            <div key={idx} style={{
                                background: 'white', padding: '1rem', borderRadius: '8px',
                                borderLeft: `4px solid ${item.Fue_Correcta ? '#16a34a' : '#dc2626'}`,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{fontWeight:'600', marginBottom:'0.5rem', color:'#334155'}}>
                                    {idx + 1}. {item.Texto_Pregunta}
                                </div>
                                
                                <div style={{fontSize:'0.9rem'}}>
                                    <div style={{display:'flex', alignItems:'center', gap:'5px', marginBottom:'4px'}}>
                                        <span style={{fontWeight:'bold', color:'#64748b'}}>Respuesta Usuario:</span>
                                        <span style={{color: item.Fue_Correcta ? '#16a34a' : '#dc2626', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px'}}>
                                            {item.Respuesta_Usuario} 
                                            {item.Fue_Correcta ? <FaCheckCircle/> : <FaTimesCircle/>}
                                        </span>
                                    </div>

                                    {!item.Fue_Correcta && (
                                        <div style={{display:'flex', alignItems:'center', gap:'5px', background:'#f0fdf4', padding:'4px 8px', borderRadius:'4px', width:'fit-content', marginTop:'5px'}}>
                                            <span style={{fontWeight:'bold', color:'#166534', fontSize:'0.85rem'}}>Correcta:</span>
                                            <span style={{color:'#166534', fontSize:'0.85rem'}}>
                                                {item.Respuesta_Correcta_Texto}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                         ))}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerDetalleCapacitacion;