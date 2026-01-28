import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { manageACPM } from '../../services/acpmService';
import { uploadFile } from '../../services/specializedService'; 
import '../../styles/Modal.css';
import { 
    FaCheckCircle, FaExclamationCircle, FaPaperPlane, 
    FaTimes, FaCloudUploadAlt, FaFileAlt
} from 'react-icons/fa';

const ModalGestionarACPM = ({ isOpen, onClose, acpm, onSuccess }) => {
    const [estado, setEstado] = useState('');
    const [comentarios, setComentarios] = useState('');
    const [urlEvidencia, setUrlEvidencia] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (acpm && isOpen) {
            setEstado(acpm.Estado || 'Abierta');
            setComentarios(''); 
            setUrlEvidencia(acpm.Url_Evidencia_Cierre || '');
            setArchivo(null); 
        }
    }, [acpm, isOpen]);

    if (!isOpen || !acpm) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setArchivo(file);
            setUrlEvidencia(''); 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalUrl = urlEvidencia;
            if (archivo) {
                const uploadResult = await uploadFile(
                    archivo, 
                    'ACPM', 
                    'Evidencia', 
                    `PlanAccion-${acpm.ID_ACPM}-Cierre`
                );
                finalUrl = uploadResult.url; 
            }

            if (estado === 'Cerrada' && (!finalUrl || finalUrl.trim() === '')) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Falta Evidencia',
                    text: 'Para cerrar el plan es OBLIGATORIO adjuntar un archivo o link de evidencia.',
                    confirmButtonColor: '#0c4760'
                });
                setLoading(false);
                return;
            }

            await manageACPM(acpm.ID_ACPM, {
                nuevoEstado: estado,
                comentario: comentarios,
                urlEvidencia: finalUrl,
                usuario: 'Administrador' 
            });

            Swal.fire({
                title: '¡Gestión Guardada!',
                text: `El plan de acción ha sido actualizado correctamente.`,
                icon: 'success',
                confirmButtonColor: '#0c4760',
                timer: 2000
            });
            onSuccess();
            onClose();

        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.message || 'Error al procesar la solicitud', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (currentStatus) => {
        if (estado === currentStatus) {
            switch (currentStatus) {
                case 'Abierta': return { background: '#fff7ed', color: '#c2410c', borderColor: '#fdba74', fontWeight: 'bold' };
                case 'En Progreso': return { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe', fontWeight: 'bold' };
                case 'Cerrada': return { background: '#f0fdf4', color: '#15803d', borderColor: '#86efac', fontWeight: 'bold' };
                default: return {};
            }
        }
        return { background: '#fff', color: '#64748b', borderColor: '#e2e8f0', opacity: 0.7 };
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '850px', flexDirection: 'row', overflow: 'hidden', height: '90vh' }}>
                
                {/* --- COLUMNA IZQUIERDA: RESUMEN (AHORA CON SCROLL) --- */}
                <div style={{ 
                    flex: '1', 
                    background: '#f8fafc', 
                    padding: '2rem', 
                    borderRight: '1px solid #e2e8f0', 
                    display: 'flex', 
                    flexDirection: 'column',
                    overflowY: 'auto',  // <--- ¡ESTA ES LA CLAVE!
                    maxHeight: '100%'   // Asegura que respete la altura del padre
                }}>
                    <h3 style={{ color: '#0c4760', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                        Detalle del Hallazgo
                    </h3>
                    
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>ID & Origen</label>
                        <div style={{ color: '#334155', fontWeight: '600' }}>#{acpm.ID_ACPM} - {acpm.Origen}</div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Descripción</label>
                        <div style={{ 
                            color: '#334155', 
                            fontSize: '0.9rem', 
                            lineHeight: '1.5', 
                            background: '#fff', 
                            padding: '0.8rem', 
                            borderRadius: '6px', 
                            border: '1px solid #e2e8f0',
                            whiteSpace: 'pre-wrap' // Para respetar los saltos de línea
                        }}>
                            {acpm.Descripcion}
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', padding: '1rem', background: '#fff1f2', borderRadius: '6px', border: '1px solid #fecdd3' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#be123c', textTransform: 'uppercase' }}>Fecha Límite</label>
                        <div style={{ color: '#881337', fontWeight: 'bold' }}>
                            {new Date(acpm.Fecha_Limite).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {/* --- COLUMNA DERECHA: FORMULARIO (TAMBIÉN CON SCROLL POR SI ACASO) --- */}
                <div style={{ 
                    flex: '1.3', 
                    padding: '2rem', 
                    display: 'flex', 
                    flexDirection: 'column',
                    overflowY: 'auto', // <--- Agregado también aquí por seguridad
                    maxHeight: '100%' 
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Gestionar Plan de Acción</h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: 1 }}>
                        
                        <div className="form-group">
                            <label>Actualizar Estado</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {['Abierta', 'En Progreso', 'Cerrada'].map(status => (
                                    <button
                                        type="button"
                                        key={status}
                                        onClick={() => setEstado(status)}
                                        style={{
                                            flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid',
                                            cursor: 'pointer', transition: 'all 0.2s', ...getStatusStyle(status)
                                        }}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Comentarios de Avance / Cierre</label>
                            <textarea
                                rows="3"
                                placeholder="Describa las acciones realizadas..."
                                value={comentarios}
                                onChange={e => setComentarios(e.target.value)}
                                style={{ resize: 'none' }}
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                Evidencia de Cierre
                                {estado === 'Cerrada' && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>(Obligatorio)</span>}
                            </label>

                            <div style={{ 
                                border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '1rem', 
                                background: '#f8fafc', position: 'relative', textAlign: 'center' 
                            }}>
                                <input 
                                    type="file" 
                                    onChange={handleFileChange} 
                                    accept="image/*,.pdf,.doc,.docx"
                                    style={{ 
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                        opacity: 0, cursor: 'pointer' 
                                    }} 
                                />
                                
                                {archivo ? (
                                    <div style={{ color: '#0c4760', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <FaFileAlt size={20} />
                                        <span>{archivo.name}</span>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setArchivo(null); }} style={{ marginLeft:'10px', color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}>x</button>
                                    </div>
                                ) : (
                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                        <FaCloudUploadAlt size={24} style={{ marginBottom: '5px', display: 'block', margin: '0 auto' }} />
                                        <span>Click o Arrastra para subir <b>Foto</b> o <b>PDF</b></span>
                                    </div>
                                )}
                            </div>

                            {!archivo && (
                                <input
                                    type="text"
                                    placeholder="O pegue un enlace externo (Drive, SharePoint)..."
                                    value={urlEvidencia}
                                    onChange={e => setUrlEvidencia(e.target.value)}
                                    style={{ marginTop: '10px', fontSize:'0.85rem' }}
                                />
                            )}

                            {estado === 'Cerrada' && !archivo && !urlEvidencia && (
                                <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <FaExclamationCircle /> Se requiere archivo o link para cerrar el plan.
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="btn-primary-modal" 
                                disabled={loading}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '8px', 
                                    background: estado === 'Cerrada' ? '#16a34a' : '#0c4760',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? 'Subiendo...' : (
                                    <>
                                        {estado === 'Cerrada' ? <FaCheckCircle /> : <FaPaperPlane />} 
                                        {estado === 'Cerrada' ? 'Cerrar Plan' : 'Guardar Gestión'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModalGestionarACPM;