import { FaTimes, FaFilePdf, FaRecycle, FaWeightHanging, FaCalendarDay, FaBuilding, FaExternalLinkAlt, FaBox, FaImage } from 'react-icons/fa';
import { API_URL } from '../../services/api';
import '../../styles/Modal.css';

const ModalVerRecoleccion = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    // Construcción segura de la URL de la imagen/documento
    const serverBaseUrl = API_URL.replace('/api', '');
    const fileUrl = data.Url_Documento 
        ? (data.Url_Documento.startsWith('http') ? data.Url_Documento : `${serverBaseUrl}${data.Url_Documento}`)
        : null;

    const ACCENT_COLOR = '#0c4760';

    // Detectar si el archivo es una imagen basándonos en la extensión
    const isImage = data.Url_Documento && /\.(jpg|jpeg|png|gif|webp)$/i.test(data.Url_Documento);

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '550px', borderRadius:'12px', overflow:'hidden', padding:0, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'}}>
                
                {/* CABECERA LIMPIA */}
                <div className="modal-header" style={{
                    backgroundColor: 'white', 
                    color: '#1e293b', 
                    borderBottom: '1px solid #e2e8f0',
                    padding: '15px 25px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <span style={{fontSize:'0.75rem', color:'#64748b', textTransform:'uppercase', fontWeight:'bold', letterSpacing:'0.5px'}}>ID RECOLECCIÓN #{data.ID_Recoleccion}</span>
                        <h2 style={{margin:'5px 0 0 0', fontSize:'1.4rem', color: ACCENT_COLOR, display:'flex', alignItems:'center', gap:'10px'}}>
                            <FaRecycle /> {data.TipoMaterial}
                        </h2>
                    </div>
                    <button className="modal-close-button" onClick={onClose} style={{color:'#94a3b8', transition: 'color 0.2s'}}>
                        <FaTimes/>
                    </button>
                </div>

                <div className="modal-body" style={{padding:'25px', maxHeight:'75vh', overflowY:'auto'}}>
                    
                    {/* TARJETAS DE DATOS */}
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'25px'}}>
                        <div style={{background:'#f8fafc', padding:'15px', borderRadius:'10px', border:'1px solid #e2e8f0', textAlign:'center'}}>
                            <FaWeightHanging style={{color: ACCENT_COLOR, fontSize:'1.5rem', marginBottom:'8px', opacity:0.8}} />
                            <div style={{fontSize:'0.7rem', color:'#64748b', fontWeight:'700', letterSpacing:'1px', textTransform:'uppercase'}}>PESO TOTAL</div>
                            <div style={{fontSize:'1.4rem', fontWeight:'800', color:'#0f172a'}}>{data.Peso} <span style={{fontSize:'0.9rem', fontWeight:'600', color:'#64748b'}}>Kg</span></div>
                        </div>
                        <div style={{background:'#f8fafc', padding:'15px', borderRadius:'10px', border:'1px solid #e2e8f0', textAlign:'center'}}>
                            <FaBox style={{color: '#15803d', fontSize:'1.5rem', marginBottom:'8px', opacity:0.8}} />
                            <div style={{fontSize:'0.7rem', color:'#64748b', fontWeight:'700', letterSpacing:'1px', textTransform:'uppercase'}}>CANTIDAD</div>
                            <div style={{fontSize:'1.4rem', fontWeight:'800', color:'#0f172a'}}>{data.Cantidad} <span style={{fontSize:'0.9rem', fontWeight:'600', color:'#64748b'}}>Und</span></div>
                        </div>
                    </div>

                    {/* LISTA DE DETALLES */}
                    <div style={{marginBottom:'25px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'15px', marginBottom:'15px', borderBottom:'1px solid #f1f5f9', paddingBottom:'10px'}}>
                            <div style={{background:'#eff6ff', padding:'10px', borderRadius:'50%', color:'#3b82f6'}}>
                                <FaCalendarDay size={18} />
                            </div>
                            <div>
                                <span style={{display:'block', fontSize:'0.75rem', color:'#64748b', fontWeight:'600', textTransform:'uppercase'}}>Fecha de Recolección</span>
                                <span style={{color:'#334155', fontWeight:'500', fontSize:'0.95rem'}}>
                                    {new Date(data.Fecha).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                </span>
                            </div>
                        </div>
                        
                        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                            <div style={{background:'#f0fdf4', padding:'10px', borderRadius:'50%', color:'#16a34a'}}>
                                <FaBuilding size={18} />
                            </div>
                            <div>
                                <span style={{display:'block', fontSize:'0.75rem', color:'#64748b', fontWeight:'600', textTransform:'uppercase'}}>Cliente / Gestor</span>
                                <span style={{color:'#334155', fontWeight:'500', fontSize:'0.95rem'}}>{data.Cliente}</span>
                            </div>
                        </div>
                    </div>

                    {/* ZONA DE EVIDENCIA (FOTO O PDF) */}
                    <div>
                        <h4 style={{fontSize:'0.85rem', color:'#475569', borderBottom:'2px solid #e2e8f0', paddingBottom:'5px', marginBottom:'15px'}}>SOPORTE DE RECOLECCIÓN</h4>
                        
                        {fileUrl ? (
                            <div style={{width:'100%'}}>
                                {isImage ? (
                                    // SI ES IMAGEN: MOSTRARLA
                                    <div style={{borderRadius:'8px', overflow:'hidden', border:'1px solid #cbd5e1', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)'}}>
                                        <img 
                                            src={fileUrl} 
                                            alt="Evidencia" 
                                            style={{width:'100%', maxHeight:'300px', objectFit:'contain', display:'block', background:'#f1f5f9'}} 
                                        />
                                        <div style={{padding:'10px', background:'white', textAlign:'center', borderTop:'1px solid #e2e8f0'}}>
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none', color: ACCENT_COLOR, fontWeight:'600', fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'}}>
                                                <FaExternalLinkAlt /> Ver imagen original
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    // SI ES OTRO ARCHIVO (PDF, DOC): MOSTRAR BOTÓN
                                    <a 
                                        href={fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{
                                            display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                                            backgroundColor: '#f1f5f9', color:'#334155', padding:'20px', borderRadius:'8px',
                                            textDecoration:'none', fontWeight:'600', transition:'all 0.2s', border:'2px dashed #cbd5e1'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = ACCENT_COLOR}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                                    >
                                        <FaFilePdf size={24} color="#ef4444"/> 
                                        <span>Abrir Documento Adjunto</span>
                                        <FaExternalLinkAlt size={12} style={{marginLeft:'auto', opacity:0.5}}/>
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div style={{textAlign:'center', padding:'20px', background:'#f8fafc', borderRadius:'8px', color:'#94a3b8', fontSize:'0.9rem', border:'1px dashed #e2e8f0'}}>
                                <FaImage size={24} style={{marginBottom:'5px', opacity:0.3}} />
                                <p style={{margin:0}}>No se adjuntó soporte digital</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer" style={{padding:'15px 25px', background:'#f8fafc', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'flex-end'}}>
                    <button type="button" className="btn-secondary" onClick={onClose} style={{padding:'10px 25px'}}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerRecoleccion;