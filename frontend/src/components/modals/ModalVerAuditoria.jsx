import React from 'react';
import '../../styles/Modal.css';
import { 
    FaTimes, FaExternalLinkAlt, FaFileDownload, FaCalendarAlt, 
    FaUserTie, FaBuilding, FaClipboardList, FaInfoCircle, FaUserEdit 
} from 'react-icons/fa';
import { API_URL } from '../../services/api';

const ModalVerAuditoria = ({ isOpen, onClose, auditoria }) => {
    if (!isOpen || !auditoria) return null;

    // URL BASE DEL SERVIDOR para archivos
    const SERVER_URL = API_URL.replace('/api', '');

    const labelStyle = {
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#64748b',
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px'
    };

    const valueStyle = {
        color: '#1e293b',
        fontWeight: '500',
        fontSize: '0.95rem'
    };

    const cardStyle = {
        backgroundColor: '#f8fafc',
        padding: '1.2rem',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginBottom: '1rem'
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '750px', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
                
                {/* CABECERA */}
                <div className="modal-header" style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#fff' }}>
                    <div style={{display:'flex', flexDirection:'column'}}>
                        <h2 style={{ fontSize: '1.3rem', color: '#0f172a', margin:0 }}>
                            Detalle de Auditoría #{auditoria.ID_Auditoria}
                        </h2>
                        <span style={{fontSize:'0.85rem', color:'#64748b'}}>
                            {auditoria.Tipo === 'Interna' ? 'Auditoría Interna de Calidad' : 'Auditoría Externa / Certificación'}
                        </span>
                    </div>
                    <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
                </div>

                {/* CUERPO */}
                <div className="modal-body" style={{ padding: '2rem', overflowY: 'auto', backgroundColor: '#ffffff' }}>
                    
                    {/* INFO PRINCIPAL */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div>
                            <div style={labelStyle}><FaCalendarAlt style={{color:'#0ea5e9'}}/> Fecha de Registro</div>
                            <div style={valueStyle}>
                                {new Date(auditoria.Fecha_Registro).toLocaleDateString('es-CO', { 
                                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </div>
                        </div>
                        <div>
                            <div style={labelStyle}><FaUserEdit style={{color:'#f59e0b'}}/> Registrado Por</div>
                            <div style={valueStyle}>
                                {auditoria.Usuario_Registra || 'Sistema'}
                            </div>
                        </div>
                    </div>

                    <hr style={{border:'0', borderTop:'1px solid #f1f5f9', margin:'0 0 1.5rem 0'}} />

                    {/* DETALLES DE LA AUDITORÍA */}
                    <div style={cardStyle}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <div style={labelStyle}><FaUserTie style={{color:'#64748b'}}/> Auditor / Entidad</div>
                                <div style={{...valueStyle, fontSize:'1.1rem', color:'#0c4760', fontWeight:'700'}}>
                                    {auditoria.Auditor}
                                </div>
                            </div>
                            <div>
                                <div style={labelStyle}><FaBuilding style={{color:'#64748b'}}/> Área Auditada</div>
                                <div style={{...valueStyle, fontSize:'1.1rem', color:'#0c4760', fontWeight:'700'}}>
                                    {auditoria.Area_Auditada}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={labelStyle}><FaClipboardList style={{color:'#8b5cf6'}}/> Normas / Criterios Evaluados</div>
                        <div style={{ 
                            marginTop: '5px', padding: '10px', background: '#f0fdf4', 
                            border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534' 
                        }}>
                            {auditoria.Normas || 'No se especificaron normas.'}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={labelStyle}><FaInfoCircle style={{color:'#3b82f6'}}/> Observaciones / Hallazgos</div>
                        <div style={{ 
                            marginTop: '5px', padding: '15px', background: '#fff', 
                            border: '1px solid #cbd5e1', borderRadius: '6px', 
                            whiteSpace: 'pre-wrap', color: '#334155', lineHeight: '1.6'
                        }}>
                            {auditoria.Observaciones || 'Sin observaciones registradas.'}
                        </div>
                    </div>

                    {/* EVIDENCIA */}
                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                        <div style={labelStyle}>Evidencia Adjunta</div>
                        <div style={{ marginTop: '10px' }}>
                            {auditoria.Url_Evidencia ? (
                                <a 
                                    href={`${SERVER_URL}${auditoria.Url_Evidencia}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="btn-primary"
                                    style={{ 
                                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', 
                                        gap: '8px', backgroundColor: '#0c4760', padding: '0.8rem 1.5rem',
                                        borderRadius: '8px', color: 'white', fontSize: '0.9rem', width:'fit-content'
                                    }}
                                >
                                    <FaFileDownload /> Descargar / Ver Archivo
                                    <FaExternalLinkAlt size={12} style={{ opacity: 0.7 }}/>
                                </a>
                            ) : (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic', display:'flex', alignItems:'center', gap:'5px' }}>
                                    <FaTimes size={14}/> No se adjuntó evidencia digital.
                                </span>
                            )}
                        </div>
                    </div>

                </div>

                <div className="modal-footer" style={{ padding: '1.2rem 2rem', background: '#ffffff', borderTop:'1px solid #f1f5f9' }}>
                    <button 
                        className="btn-secondary" 
                        onClick={onClose}
                        style={{ marginLeft:'auto' }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerAuditoria;