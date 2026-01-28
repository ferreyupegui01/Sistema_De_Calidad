import { useEffect, useState } from 'react';
import { getReporteDetalle, verifyReporte } from '../../services/reportesService'; 
// Importamos utilidades de seguridad
import { apiFetchBlob, extractFilename } from '../../services/api';
import '../../styles/Modal.css';
import { FaTimes, FaClipboardList, FaCheck, FaTimesCircle, FaCamera, FaUser, FaCalendarAlt, FaIndustry, FaCheckDouble, FaExternalLinkAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

const ModalVerReporte = ({ isOpen, onClose, reporte, onUpdate }) => {
    const [detalles, setDetalles] = useState([]);
    const [cabecera, setCabecera] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verificando, setVerificando] = useState(false);

    useEffect(() => {
        if (isOpen && reporte) {
            setCabecera(reporte); 
            cargarDetalle();
        }
    }, [isOpen, reporte]);

    const cargarDetalle = async () => {
        setLoading(true);
        try {
            const data = await getReporteDetalle(reporte.ID_Reporte);
            setDetalles(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerificar = async () => {
        setVerificando(true);
        try {
            await verifyReporte(reporte.ID_Reporte);
            Swal.fire({
                icon: 'success',
                title: 'Verificado',
                text: 'El reporte ha sido marcado como revisado.',
                timer: 1500,
                showConfirmButton: false
            });
            if (onUpdate) onUpdate(); 
            onClose(); 
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setVerificando(false);
        }
    };

    // --- FUNCIÓN SEGURA PARA ABRIR EVIDENCIA ---
    const handleVerEvidencia = async () => {
        if (!reporte.Url_Evidencia) return;
        
        try {
            const filename = extractFilename(reporte.Url_Evidencia);
            // Usamos el endpoint seguro (Asumimos que la ruta es /reportes/evidencia/:nombre)
            // Si no existe esa ruta específica en backend, usaremos la genérica luego
            const blob = await apiFetchBlob(`/reportes/evidencia/${filename}`);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error al cargar evidencia:", error);
            alert("No se pudo cargar el archivo adjunto. Verifique su conexión.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '700px', maxHeight: '90vh', overflowY:'auto'}}>
                <div className="modal-header">
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <h2 style={{margin:0}}>Reporte #{reporte?.ID_Reporte}</h2>
                        {reporte?.Verificado ? (
                            <span className="badge badge-success" style={{fontSize:'0.8rem', padding:'4px 8px', background:'#dcfce7', color:'#166534'}}>
                                <FaCheckDouble /> Verificado
                            </span>
                        ) : (
                            <span className="badge" style={{background:'#f3f4f6', color:'#6b7280', fontSize:'0.8rem', padding:'4px 8px'}}>
                                Sin Verificar
                            </span>
                        )}
                    </div>
                    <button className="modal-close-button" onClick={onClose}><FaTimes/></button>
                </div>

                <div className="modal-body">
                    {/* RESUMEN CABECERA */}
                    <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', marginBottom:'20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                            <FaUser color="#64748b"/> 
                            <div>
                                <div style={{fontSize:'0.75rem', color:'#94a3b8'}}>Realizado por</div>
                                <div style={{fontWeight:'bold', color:'#334155'}}>{reporte?.Usuario}</div>
                            </div>
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                            <FaCalendarAlt color="#64748b"/> 
                            <div>
                                <div style={{fontSize:'0.75rem', color:'#94a3b8'}}>Fecha</div>
                                <div style={{fontWeight:'bold', color:'#334155'}}>
                                    {reporte ? new Date(reporte.Fecha_Reporte).toLocaleString() : ''}
                                </div>
                            </div>
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap:'8px', gridColumn:'span 2'}}>
                            <FaIndustry color="#64748b"/> 
                            <div>
                                <div style={{fontSize:'0.75rem', color:'#94a3b8'}}>Activo Inspeccionado</div>
                                <div style={{fontWeight:'bold', color:'#0c4760', fontSize:'1.1rem'}}>{reporte?.Activo}</div>
                            </div>
                        </div>
                    </div>

                    {/* DETALLE CHECKLIST */}
                    <h3 style={{fontSize:'1rem', borderBottom:'1px solid #eee', paddingBottom:'0.5rem', display:'flex', alignItems:'center', gap:'8px'}}>
                        <FaClipboardList color="#0c4760"/> Detalles de Inspección
                    </h3>
                    
                    <div style={{marginBottom:'1.5rem'}}>
                        {loading ? <p>Cargando detalle...</p> : detalles.map((p, idx) => (
                            <div key={idx} style={{padding:'0.8rem 0', borderBottom:'1px dashed #f1f5f9'}}>
                                <div style={{color:'#334155', fontWeight:'600', marginBottom:'4px'}}>{p.Texto_Pregunta}</div>
                                
                                {/* LOGICA DE VISUALIZACION SEGUN TIPO */}
                                {p.Tipo === 'TEXT' ? (
                                    <div style={{
                                        background: '#f0f9ff', padding: '8px 12px', borderRadius: '6px', 
                                        color: '#0369a1', fontSize: '0.9rem', border: '1px solid #bae6fd',
                                        marginTop: '5px'
                                    }}>
                                        {p.Respuesta_Texto || 'Sin datos'}
                                    </div>
                                ) : (
                                    <div style={{display:'flex', alignItems:'center', marginTop:'5px'}}>
                                        {p.Cumple ? 
                                            <span style={{color:'#16a34a', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.9rem'}}>
                                                <FaCheck size={14}/> CUMPLE
                                            </span> 
                                            : 
                                            <span style={{color:'#dc2626', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.9rem'}}>
                                                <FaTimesCircle size={14}/> NO CUMPLE
                                            </span>
                                        }
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* EVIDENCIA Y OBSERVACIONES */}
                    {(reporte?.Url_Evidencia || reporte?.Observaciones) && (
                        <div style={{background:'#fff', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'15px'}}>
                            {reporte.Observaciones && (
                                <div style={{marginBottom:'10px'}}>
                                    <strong style={{color:'#64748b', fontSize:'0.8rem', textTransform:'uppercase'}}>Observaciones Generales:</strong>
                                    <p style={{marginTop:'5px', color:'#334155'}}>{reporte.Observaciones}</p>
                                </div>
                            )}
                            
                            {reporte.Url_Evidencia && (
                                <div>
                                    <strong style={{color:'#64748b', fontSize:'0.8rem', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'5px'}}>
                                        <FaCamera/> Evidencia Adjunta:
                                    </strong>
                                    
                                    <button 
                                        onClick={handleVerEvidencia}
                                        style={{
                                            display:'inline-flex', alignItems:'center', gap:'5px', marginTop:'8px', 
                                            color:'#0c4760', textDecoration:'none', fontSize:'0.9rem',
                                            background:'none', border:'none', cursor:'pointer', fontWeight:'bold'
                                        }}
                                    >
                                        Ver fotografía / documento <FaExternalLinkAlt size={12}/>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{justifyContent: 'space-between'}}>
                    <button className="btn-secondary" onClick={onClose}>Cerrar</button>
                    
                    {!reporte?.Verificado && (
                        <button 
                            className="btn-primary-modal" 
                            style={{backgroundColor: '#10b981', display:'flex', alignItems:'center', gap:'8px'}}
                            onClick={handleVerificar}
                            disabled={verificando}
                        >
                            <FaCheckDouble /> {verificando ? 'Procesando...' : 'Marcar como Revisado'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalVerReporte;