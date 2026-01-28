import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getReportes } from '../../services/reportesService';
import { getACPMs } from '../../services/acpmService';
import ModalVerReporte from '../../components/modals/ModalVerReporte';
import ModalCreateACPM from '../../components/modals/ModalCreateACPM';
import ModalVerACPM from '../../components/modals/ModalVerACPM';

import { 
    FaSearch, FaFilter, FaCheckCircle, FaExclamationTriangle, 
    FaEye, FaTools, FaCheckDouble, FaFileContract, FaClipboardList 
} from 'react-icons/fa';

import '../../styles/Tables.css';
import '../../styles/HistorialReportes.css';

const HistorialReportes = () => {
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos');

    // Modales
    const [showViewModal, setShowViewModal] = useState(false);
    const [showCreateACPM, setShowCreateACPM] = useState(false);
    const [showViewACPM, setShowViewACPM] = useState(false);
    
    const [selectedReporte, setSelectedReporte] = useState(null);
    const [acpmData, setAcpmData] = useState(null);

    useEffect(() => {
        fetchReportes();
    }, []);

    const fetchReportes = async () => {
        setLoading(true);
        try {
            const data = await getReportes();
            
            // Verificamos si 'data' es un array antes de usar .filter
            if (Array.isArray(data)) {
                // Filtramos para no mostrar los de limpieza si así lo deseas, 
                // o lo dejas general. Aquí lo dejo general pero excluyendo limpieza 
                // si esa era la lógica original, o puedes quitar el filter.
                const reportesGenerales = data.filter(r => 
                    !r.Categoria || !r.Categoria.toLowerCase().includes('limpieza')
                );
                setReportes(reportesGenerales);
            } else {
                console.error("La API no devolvió una lista:", data);
                setReportes([]); 
            }
            
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo cargar el historial', 'error');
            setReportes([]); 
        } finally {
            setLoading(false);
        }
    };

    // Filtros de búsqueda y estado
    const filteredReportes = reportes.filter(item => {
        if (!item) return false;

        const textMatch = 
            (item.Usuario || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.Activo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.Formulario || '').toLowerCase().includes(searchTerm.toLowerCase());

        let statusMatch = true;
        if (filterStatus === 'fallas') statusMatch = item.Tiene_Fallas === true;
        if (filterStatus === 'ok') statusMatch = item.Tiene_Fallas === false;
        if (filterStatus === 'pendiente') statusMatch = item.Verificado !== true;

        return textMatch && statusMatch;
    });

    const handleOpenView = (rep) => {
        setSelectedReporte(rep);
        setShowViewModal(true);
    };

    const handleOpenCreateACPM = (rep) => {
        setAcpmData({
            origen: `Reporte #${rep.ID_Reporte}`,
            descripcion: `Hallazgos en el activo ${rep.Activo}: ${rep.Observaciones || 'Sin observaciones'}`,
            idReporte: rep.ID_Reporte
        });
        setShowCreateACPM(true);
    };

    const handleOpenViewACPM = async (idACPM) => {
        try {
            const allACPM = await getACPMs();
            if (Array.isArray(allACPM)) {
                const found = allACPM.find(a => a.ID_ACPM === idACPM);
                if (found) {
                    setAcpmData(found);
                    setShowViewACPM(true);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Historial General de Reportes</h1>
                <p style={{color:'#64748b', marginTop:'-5px'}}>Inspecciones Operativas y de Mantenimiento</p>
            </div>

            {/* BARRA DE CONTROL */}
            <div className="control-bar">
                <div className="search-box">
                    <FaSearch />
                    <input 
                        className="search-input"
                        placeholder="Buscar por usuario, activo o formulario..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <FaFilter style={{color:'#64748b'}}/>
                    <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="todos">Todos los Estados</option>
                        <option value="fallas">Con Hallazgos</option>
                        <option value="ok">Conforme (OK)</option>
                        <option value="pendiente">Pendiente Revisión</option>
                    </select>
                </div>
            </div>

            {/* TABLA */}
            <div className="table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>Fecha / Hora</th>
                            <th>Responsable</th>
                            <th>Detalle Inspección</th>
                            <th>Estado</th>
                            <th style={{textAlign:'right'}}>Gestión</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>Cargando historial...</td></tr>
                        ) : filteredReportes.length === 0 ? (
                            <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No se encontraron reportes.</td></tr>
                        ) : (
                            filteredReportes.map(rep => (
                                <tr key={rep.ID_Reporte} className="modern-row">
                                    <td className="modern-cell">
                                        {/* --- CORRECCIÓN DE HORA AQUÍ --- */}
                                        <div className="date-main">
                                            {new Date(rep.Fecha_Reporte).toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                                        </div>
                                        <div className="date-sub">
                                            {new Date(rep.Fecha_Reporte).toLocaleTimeString('es-CO', { timeZone: 'UTC', hour: '2-digit', minute:'2-digit' })}
                                        </div>
                                        {/* ------------------------------- */}
                                    </td>
                                    
                                    <td className="modern-cell">
                                        <div style={{fontWeight:'600', color:'#1e293b'}}>{rep.Usuario}</div>
                                    </td>

                                    <td className="modern-cell">
                                        <div className="asset-name">{rep.Activo}</div>
                                        <div className="form-name"><FaClipboardList size={10} style={{marginRight:'4px'}}/> {rep.Formulario}</div>
                                        {rep.Categoria && <span style={{fontSize:'0.7rem', background:'#f1f5f9', padding:'2px 6px', borderRadius:'4px', color:'#64748b'}}>{rep.Categoria}</span>}
                                    </td>

                                    <td className="modern-cell">
                                        <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                                            {rep.Tiene_Fallas ? (
                                                <span className="status-pill danger">
                                                    <FaExclamationTriangle /> Hallazgos
                                                </span>
                                            ) : (
                                                <span className="status-pill success">
                                                    <FaCheckCircle /> Conforme
                                                </span>
                                            )}
                                            
                                            {rep.Verificado && (
                                                <span style={{fontSize:'0.7rem', color:'#10b981', display:'flex', alignItems:'center', gap:'3px', fontWeight:'700'}}>
                                                    <FaCheckDouble /> Verificado
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="modern-cell">
                                        <div className="action-group">
                                            <button 
                                                className="btn-text-modern" 
                                                onClick={() => handleOpenView(rep)}
                                                title="Ver Detalle Completo"
                                            >
                                                <FaFileContract /> Ver
                                            </button>

                                            {rep.ID_ACPM ? (
                                                <button 
                                                    className="btn-text-modern btn-acpm-view" 
                                                    onClick={() => handleOpenViewACPM(rep.ID_ACPM)}
                                                    title="Ver Plan de Acción"
                                                >
                                                    <FaEye /> Plan De Acción
                                                </button>
                                            ) : rep.Tiene_Fallas ? (
                                                <button 
                                                    className="btn-text-modern btn-acpm-create" 
                                                    onClick={() => handleOpenCreateACPM(rep)}
                                                    title="Crear Plan de Acción"
                                                >
                                                    <FaTools /> Crear PDA
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODALES */}
            <ModalVerReporte 
                isOpen={showViewModal} 
                onClose={() => setShowViewModal(false)} 
                reporte={selectedReporte} 
                onUpdate={fetchReportes} 
            />

            <ModalCreateACPM 
                isOpen={showCreateACPM} 
                onClose={() => setShowCreateACPM(false)} 
                initialData={acpmData} 
                onSuccess={fetchReportes} 
            />

            <ModalVerACPM 
                isOpen={showViewACPM} 
                onClose={() => setShowViewACPM(false)} 
                acpm={acpmData} 
            />
        </div>
    );
};

export default HistorialReportes;