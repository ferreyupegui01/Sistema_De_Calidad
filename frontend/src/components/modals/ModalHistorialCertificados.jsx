import { useState, useEffect } from 'react';
import { getHistorialCertificados } from '../../services/certificadosService';
// Importamos utilidades seguras
import { apiFetchBlob, extractFilename } from '../../services/api';
import { FaTimes, FaSearch, FaHistory, FaFilter, FaFilePdf, FaIndustry, FaUserTie, FaEye } from 'react-icons/fa';
import Swal from 'sweetalert2';
import '../../styles/ModalHistorialCertificados.css';

const ModalHistorialCertificados = ({ isOpen, onClose, plantillaFiltro }) => {
    const [historial, setHistorial] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'; 
            cargarHistorial();
        } else {
            document.body.style.overflow = 'auto'; 
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, plantillaFiltro]);

    const cargarHistorial = async () => {
        setLoading(true);
        try {
            const data = await getHistorialCertificados();
            if (Array.isArray(data)) {
                setHistorial(data);
            } else {
                setHistorial([]);
            }
        } catch (error) { 
            console.error(error); 
            setHistorial([]);
        } finally { 
            setLoading(false); 
        }
    };

    // --- FUNCIÓN SEGURA PARA VER CERTIFICADO ---
    const handleVerCertificado = async (urlPdf) => {
        if (!urlPdf) return;
        
        try {
            const filename = extractFilename(urlPdf);
            // Usamos una ruta de streaming para certificados. 
            // (Asegúrate de crearla en el backend: /certificados/pdf/:filename)
            const blob = await apiFetchBlob(`/certificados/pdf/${filename}`);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error viendo certificado:", error);
            // Fallback para certificados antiguos
            if (urlPdf.startsWith('http')) {
                window.open(urlPdf, '_blank');
            } else {
                Swal.fire('Error', 'No se pudo abrir el certificado.', 'error');
            }
        }
    };

    const filtered = historial.filter(h => {
        if (plantillaFiltro) {
            const idHistorial = String(h.ID_Plantilla || '');
            const idFiltro = String(plantillaFiltro.ID_Plantilla || '');
            if (idHistorial !== idFiltro) return false;
        }
        
        const search = filtro.toLowerCase();
        const lote = (h.Lote || '').toString().toLowerCase();
        const cliente = (h.Cliente || '').toString().toLowerCase();
        const responsable = (h.Responsable || '').toString().toLowerCase();
        const nombrePlantilla = (h.Nombre_Certificado || '').toString().toLowerCase();

        return (
            lote.includes(search) || 
            cliente.includes(search) ||
            responsable.includes(search) ||
            nombrePlantilla.includes(search)
        );
    });

    if (!isOpen) return null;

    return (
        <div className="history-modal-overlay">
            <div className="history-modal-content">
                <div className="history-modal-header">
                    <div className="history-title-block">
                        <h2><FaHistory className="icon-header"/> Historial de Certificados</h2>
                        {plantillaFiltro && (
                            <div className="filter-badge-active">
                                <FaFilter size={10}/> <span>Filtrando solo: <strong>{plantillaFiltro.Nombre}</strong></span>
                            </div>
                        )}
                    </div>
                    <button className="btn-close-modal" onClick={onClose}><FaTimes/></button>
                </div>
                
                <div className="history-modal-body">
                    <div className="history-search-container">
                        <div className="search-input-wrapper">
                            <FaSearch className="search-icon"/>
                            <input 
                                className="search-input"
                                placeholder="Escribe aquí el Lote, Cliente o Responsable..." 
                                value={filtro} 
                                onChange={e => setFiltro(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="results-count"><strong>{filtered.length}</strong> registros</div>
                    </div>

                    <div className="history-table-wrapper">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th width="15%">Fecha</th>
                                    {!plantillaFiltro && <th width="20%">Formato</th>} 
                                    <th width="20%">Lote / Referencia</th>
                                    <th width="20%">Cliente</th>
                                    <th width="15%">Generado Por</th>
                                    <th width="10%" style={{textAlign:'center'}}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="state-cell">Cargando datos...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan="6" className="state-cell">No se encontraron coincidencias.</td></tr>
                                ) : (
                                    filtered.map((cert, idx) => (
                                        <tr key={cert.ID_Generado || idx} className="history-row">
                                            <td>
                                                <div className="date-cell">
                                                    <span className="date-text">
                                                        {new Date(cert.Fecha_Generacion).toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                                                    </span>
                                                    <span className="time-text">
                                                        {new Date(cert.Fecha_Generacion).toLocaleTimeString('es-CO', { timeZone: 'UTC', hour: '2-digit', minute:'2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {!plantillaFiltro && (
                                                <td className="format-cell">{cert.Nombre_Certificado}</td>
                                            )}
                                            
                                            <td>
                                                <div className="lote-badge">
                                                    <FaIndustry size={10} style={{marginRight:'4px', opacity:0.7}}/>
                                                    {cert.Lote}
                                                </div>
                                            </td>
                                            
                                            <td className="client-cell">
                                                <FaUserTie size={10} style={{marginRight:'5px', color:'#64748b'}}/>
                                                {cert.Cliente}
                                            </td>
                                            
                                            <td className="user-cell">{cert.Responsable}</td>
                                            
                                            <td style={{textAlign:'center'}}>
                                                {cert.Url_PDF ? (
                                                    <button 
                                                        onClick={() => handleVerCertificado(cert.Url_PDF)} 
                                                        className="btn-pdf-action" 
                                                        title="Ver Documento"
                                                        style={{border:'none', background:'transparent', cursor:'pointer'}}
                                                    >
                                                        <FaFilePdf size={18} color="#ef4444"/>
                                                    </button>
                                                ) : <span className="no-doc">-</span>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalHistorialCertificados;