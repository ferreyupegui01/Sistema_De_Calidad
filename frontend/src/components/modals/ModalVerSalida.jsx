import { useState, useEffect } from 'react';
import { FaTimes, FaFilePdf, FaTruck, FaUser, FaCalendarDay, FaExternalLinkAlt, FaImage } from 'react-icons/fa';
// Importamos las utilidades seguras
import { apiFetchBlob, extractFilename } from '../../services/api';
import '../../styles/Modal.css';

const ModalVerSalida = ({ isOpen, onClose, data }) => {
    // Estado para la URL segura del archivo
    const [secureFileUrl, setSecureFileUrl] = useState(null);
    const [loadingFile, setLoadingFile] = useState(false);
    
    const ACCENT_COLOR = '#0c4760';

    // Cargar archivo al abrir
    useEffect(() => {
        if (isOpen && data?.Url_Documento) {
            loadFile();
        }
        // Limpieza de memoria
        return () => {
            if (secureFileUrl) URL.revokeObjectURL(secureFileUrl);
        };
    }, [isOpen, data]);

    const loadFile = async () => {
        setLoadingFile(true);
        try {
            const filename = extractFilename(data.Url_Documento);
            // Usamos la ruta de streaming de Recall
            // Asegúrate de que esta ruta exista en recallRoutes.js: router.get('/documento/:filename', ...)
            const blob = await apiFetchBlob(`/recall/documento/${filename}`);
            
            if (blob.size === 0) throw new Error("Archivo vacío");

            const url = URL.createObjectURL(blob);
            setSecureFileUrl(url);
        } catch (error) {
            console.error("Error cargando documento:", error);
            // Fallback para URLs antiguas
            if (data.Url_Documento.startsWith('http')) {
                setSecureFileUrl(data.Url_Documento);
            }
        } finally {
            setLoadingFile(false);
        }
    };

    if (!isOpen || !data) return null;

    // Detectar si es imagen
    const isImage = data.Url_Documento && /\.(jpg|jpeg|png|gif|webp)$/i.test(data.Url_Documento);

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '500px', borderRadius:'12px', overflow:'hidden', padding:0}}>
                
                {/* Header Estilizado */}
                <div className="modal-header" style={{backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '15px 20px'}}>
                    <div>
                        <span style={{fontSize:'0.75rem', color:'#64748b', textTransform:'uppercase', fontWeight:'bold'}}>
                            SALIDA #{data.ID_Recall_Salida}
                        </span>
                        <h2 style={{margin:0, fontSize:'1.2rem', color: ACCENT_COLOR, display:'flex', alignItems:'center', gap:'8px'}}>
                            <FaTruck /> {data.Producto}
                        </h2>
                    </div>
                    <button className="modal-close-button" onClick={onClose} style={{color:'#64748b'}}><FaTimes/></button>
                </div>

                <div className="modal-body" style={{padding:'25px'}}>
                    
                    {/* Tarjeta de Resumen */}
                    <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', border:'1px solid #e2e8f0', marginBottom:'20px'}}>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                            <div>
                                <span style={{fontSize:'0.75rem', color:'#64748b', fontWeight:'bold'}}>LOTE</span>
                                <div style={{fontSize:'1.1rem', fontWeight:'800', color:'#0f172a'}}>{data.Lote}</div>
                            </div>
                            <div style={{textAlign:'right'}}>
                                <span style={{fontSize:'0.75rem', color:'#64748b', fontWeight:'bold'}}>CANTIDAD</span>
                                <div style={{fontSize:'1.1rem', fontWeight:'800', color:'#0f172a'}}>{data.Cantidad}</div>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Detalles */}
                    <div className="detail-list" style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                            <FaUser style={{color: '#94a3b8'}} />
                            <div>
                                <span style={{display:'block', fontSize:'0.75rem', color:'#64748b'}}>Cliente Destino</span>
                                <span style={{color:'#334155', fontWeight:'500'}}>{data.Cliente}</span>
                            </div>
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                            <FaCalendarDay style={{color: '#94a3b8'}} />
                            <div>
                                <span style={{display:'block', fontSize:'0.75rem', color:'#64748b'}}>Fecha de Envío</span>
                                <span style={{color:'#334155', fontWeight:'500'}}>
                                    {new Date(data.Fecha_Envio).toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Observaciones */}
                    {data.Observaciones && (
                        <div style={{marginTop:'20px', padding:'10px', background:'#fffbeb', border:'1px solid #fef3c7', borderRadius:'6px', fontSize:'0.9rem', color:'#92400e'}}>
                            <strong>Nota:</strong> {data.Observaciones}
                        </div>
                    )}

                    {/* Botón de Documento Seguro */}
                    <div style={{marginTop:'25px'}}>
                        <h4 style={{fontSize:'0.85rem', color:'#475569', marginBottom:'10px', borderBottom:'1px solid #eee'}}>SOPORTE DIGITAL</h4>
                        
                        {data.Url_Documento ? (
                            loadingFile ? (
                                <div style={{textAlign:'center', color:'#64748b', fontSize:'0.9rem'}}>Cargando documento...</div>
                            ) : secureFileUrl ? (
                                isImage ? (
                                    // Vista Imagen
                                    <div style={{borderRadius:'8px', overflow:'hidden', border:'1px solid #cbd5e1'}}>
                                        <img src={secureFileUrl} alt="Soporte" style={{width:'100%', maxHeight:'250px', objectFit:'contain', background:'#f1f5f9'}} />
                                        <a href={secureFileUrl} target="_blank" rel="noopener noreferrer" style={{display:'block', padding:'8px', textAlign:'center', fontSize:'0.85rem', color: ACCENT_COLOR, textDecoration:'none', background:'white'}}>
                                            <FaExternalLinkAlt /> Abrir imagen original
                                        </a>
                                    </div>
                                ) : (
                                    // Vista PDF/Otro
                                    <a 
                                        href={secureFileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{
                                            display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                                            backgroundColor: ACCENT_COLOR, color:'white', padding:'12px', borderRadius:'8px',
                                            textDecoration:'none', fontWeight:'600', transition:'all 0.2s', width:'100%', boxSizing:'border-box'
                                        }}
                                    >
                                        <FaFilePdf /> Ver Soporte / Remisión <FaExternalLinkAlt size={12} style={{marginLeft:'auto', opacity:0.7}}/>
                                    </a>
                                )
                            ) : (
                                <div style={{textAlign:'center', color:'#ef4444', fontSize:'0.9rem'}}>Error cargando archivo.</div>
                            )
                        ) : (
                            <div style={{textAlign:'center', padding:'10px', background:'#f1f5f9', borderRadius:'6px', color:'#94a3b8', fontSize:'0.9rem'}}>
                                Sin documento adjunto
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalVerSalida;