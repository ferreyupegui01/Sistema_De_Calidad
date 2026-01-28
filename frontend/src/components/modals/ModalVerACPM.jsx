import React from 'react';
import '../../styles/Modal.css';
import { 
    FaTimes, FaExternalLinkAlt, FaFileDownload, FaCalendarAlt, 
    FaUser, FaMapMarkerAlt, FaClipboardList, FaBullseye 
} from 'react-icons/fa';

const ModalVerACPM = ({ isOpen, onClose, acpm }) => {
    if (!isOpen || !acpm) return null;

    const getStatusBadge = (estado) => {
        const styles = {
            'Abierta': { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' },
            'En Progreso': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
            'Cerrada': { bg: '#f0fdf4', color: '#15803d', border: '#86efac' }
        };
        const s = styles[estado] || { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' };
        return (
            <span style={{
                backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
                padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold'
            }}>
                {estado}
            </span>
        );
    };

    const readOnlyInputStyle = {
        width: '100%',
        padding: '0.8rem',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        color: '#334155',
        fontSize: '0.95rem',
        marginTop: '0.4rem',
        whiteSpace: 'pre-wrap', // Respeta los saltos de línea
        lineHeight: '1.5'
    };

    const labelStyle = {
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#64748b',
        marginBottom: '2px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px'
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
                
                {/* CABECERA */}
                <div className="modal-header" style={{ borderBottom: '1px solid #f1f5f9', backgroundColor:'#fff' }}>
                    <div style={{display:'flex', flexDirection:'column'}}>
                        <h2 style={{ fontSize: '1.3rem', color: '#0f172a', margin:0 }}>
                            Plan de Acción #{acpm.ID_ACPM}
                        </h2>
                        <span style={{fontSize:'0.85rem', color:'#64748b'}}>Detalle completo del hallazgo y seguimiento</span>
                    </div>
                    <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
                </div>

                {/* CUERPO */}
                <div className="modal-body" style={{ padding: '2rem', overflowY: 'auto', backgroundColor: '#ffffff' }}>
                    
                    {/* SECCIÓN 1: DATOS GENERALES (GRID) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        
                        <div>
                            <div style={labelStyle}><FaBullseye style={{color:'#f59e0b'}}/> Tipo de Acción</div>
                            <div style={{fontWeight:'600', color:'#1e293b', fontSize:'1rem', marginTop:'5px'}}>
                                {acpm.Tipo_Accion}
                            </div>
                        </div>

                        <div>
                            <div style={labelStyle}><FaClipboardList style={{color:'#0ea5e9'}}/> Fuente / Origen</div>
                            <div style={{fontWeight:'600', color:'#0c4760', fontSize:'1rem', marginTop:'5px'}}>
                                {acpm.Origen_Plan || 'No especificado'}
                            </div>
                        </div>

                        <div>
                            <div style={labelStyle}><FaMapMarkerAlt style={{color:'#ef4444'}}/> Ubicación Hallazgo</div>
                            <div style={{fontSize:'0.95rem', color:'#475569', marginTop:'5px'}}>
                                {acpm.Origen}
                            </div>
                        </div>

                        <div>
                            <div style={labelStyle}>Estado Actual</div>
                            <div style={{ marginTop: '5px' }}>{getStatusBadge(acpm.Estado)}</div>
                        </div>
                    </div>

                    <hr style={{border:'0', borderTop:'1px solid #f1f5f9', margin:'0 0 1.5rem 0'}} />

                    {/* SECCIÓN 2: DETALLES LARGOS */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={labelStyle}>Descripción del Problema / Hallazgo</div>
                        <div style={readOnlyInputStyle}>{acpm.Descripcion}</div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={labelStyle}>Análisis de Causa Raíz</div>
                        <div style={readOnlyInputStyle}>
                            {acpm.Analisis_Causa || <span style={{color:'#9ca3af', fontStyle:'italic'}}>No registrado</span>}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <div style={labelStyle}>Plan de Acción (Actividades a Ejecutar)</div>
                        <div style={{...readOnlyInputStyle, backgroundColor:'#f0f9ff', borderColor:'#bae6fd', color:'#0369a1'}}>
                            {acpm.Plan_Accion || <span style={{color:'#9ca3af', fontStyle:'italic'}}>No registrado</span>}
                        </div>
                    </div>

                    {/* SECCIÓN 3: RESPONSABILIDAD Y CIERRE (TARJETA GRIS) */}
                    <div style={{ backgroundColor:'#f8fafc', padding:'1.5rem', borderRadius:'12px', border:'1px solid #e2e8f0' }}>
                        <h4 style={{marginTop:0, marginBottom:'1rem', color:'#0c4760', fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>Seguimiento y Cierre</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <div style={labelStyle}>Responsable</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop:'5px', color:'#334155', fontWeight:'600' }}>
                                    <div style={{width:'28px', height:'28px', borderRadius:'50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                        <FaUser size={12} style={{color:'#64748b'}} />
                                    </div>
                                    {acpm.Responsable}
                                </div>
                            </div>
                            <div>
                                <div style={labelStyle}>Fecha Límite</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop:'5px', color:'#b91c1c', fontWeight:'600' }}>
                                    <FaCalendarAlt /> {new Date(acpm.Fecha_Limite).toLocaleDateString()}
                                </div>
                            </div>
                            <div>
                                <div style={labelStyle}>Fecha de Cierre</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop:'5px', color: acpm.Fecha_Cierre ? '#15803d' : '#94a3b8', fontWeight:'600' }}>
                                    <FaCalendarAlt /> 
                                    {acpm.Fecha_Cierre ? new Date(acpm.Fecha_Cierre).toLocaleDateString() : '-- / -- / --'}
                                </div>
                            </div>
                        </div>

                        {/* EVIDENCIA */}
                        <div style={{ borderTop:'1px dashed #cbd5e1', paddingTop:'1rem' }}>
                            <div style={labelStyle}>Evidencia de Cierre:</div>
                            <div style={{ marginTop: '0.5rem' }}>
                                {acpm.Url_Evidencia_Cierre ? (
                                    <a 
                                        href={acpm.Url_Evidencia_Cierre} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn-primary"
                                        style={{ 
                                            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', 
                                            gap: '8px', backgroundColor: '#0c4760', padding: '0.6rem 1.2rem',
                                            borderRadius: '8px', color: 'white', fontSize: '0.9rem', width:'fit-content'
                                        }}
                                    >
                                        <FaFileDownload /> Descargar / Ver Evidencia
                                        <FaExternalLinkAlt size={12} style={{ opacity: 0.7 }}/>
                                    </a>
                                ) : (
                                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'5px' }}>
                                        <FaTimes size={12}/> No se han adjuntado evidencias de cierre aún.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                <div className="modal-footer" style={{ padding: '1.2rem 2rem', background: '#ffffff', borderTop:'1px solid #f1f5f9' }}>
                    <button 
                        className="btn-secondary" 
                        onClick={onClose}
                        style={{ marginLeft:'auto' }}
                    >
                        Cerrar Ventana
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerACPM;