import { useState, useEffect } from 'react';
import { getAuditorias } from '../../services/auditoriaService';
import { getACPMById } from '../../services/acpmService';
import { API_URL } from '../../services/api';
import ModalCrearAuditoria from '../../components/modals/ModalCrearAuditoria';
import ModalCreateACPM from '../../components/modals/ModalCreateACPM';
import ModalVerAuditoria from '../../components/modals/ModalVerAuditoria';
import ModalVerACPM from '../../components/modals/ModalVerACPM';

import { 
    FaSearch, FaPlus, FaClipboardList, FaExternalLinkAlt, 
    FaFilePdf, FaImage, FaFileAlt, FaEye, FaUserTie, FaBuilding, FaFileSignature
} from 'react-icons/fa';

const GestionAuditorias = () => {
    const [auditorias, setAuditorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabActive, setTabActive] = useState('Interna');
    const [searchTerm, setSearchTerm] = useState('');

    // Modales
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showACPMModal, setShowACPMModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    
    // Modal Ver ACPM
    const [showVerPlanModal, setShowVerPlanModal] = useState(false);
    const [selectedPlanACPM, setSelectedPlanACPM] = useState(null);

    const [acpmInitialData, setAcpmInitialData] = useState(null);
    const [selectedAuditoria, setSelectedAuditoria] = useState(null);

    const SERVER_URL = API_URL.replace('/api', '');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const data = await getAuditorias();
            setAuditorias(data);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    const filteredData = auditorias.filter(item => 
        item.Tipo === tabActive && 
        (item.Auditor.toLowerCase().includes(searchTerm.toLowerCase()) || 
         item.Area_Auditada.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (item.Normas && item.Normas.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    // Abrir Modal Crear Plan
    const handleCreatePlan = (auditoria) => {
        setAcpmInitialData({
            origen: `Auditoría ${auditoria.Tipo} #${auditoria.ID_Auditoria}`,
            descripcion: `Hallazgo en auditoría realizada por ${auditoria.Auditor} en área ${auditoria.Area_Auditada}. Obs: ${auditoria.Observaciones}`,
            idAuditoria: auditoria.ID_Auditoria
        });
        setShowACPMModal(true);
    };

    // Abrir Modal Ver Plan
    const handleViewPlan = async (idACPM) => {
        try {
            const plan = await getACPMById(idACPM);
            setSelectedPlanACPM(plan);
            setShowVerPlanModal(true);
        } catch (error) {
            console.error("Error cargando plan", error);
        }
    };

    const handleViewAuditoria = (auditoria) => {
        setSelectedAuditoria(auditoria);
        setShowViewModal(true);
    };

    const getFileIcon = (url) => {
        if (!url) return <FaExternalLinkAlt />;
        const ext = url.split('.').pop().toLowerCase();
        if (ext === 'pdf') return <FaFilePdf />;
        if (['jpg', 'jpeg', 'png'].includes(ext)) return <FaImage />;
        return <FaFileAlt />;
    };

    // --- ESTILOS CSS RESPONSIVE ---
    const styles = `
        .page-container { padding: 20px; animation: fadeIn 0.5s ease-in-out; }
        .header-container { display: flex; justify-content: space-between; alignItems: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0; flex-wrap: wrap; gap: 15px; }
        .filter-container { display: flex; justify-content: space-between; alignItems: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
        .search-box { position: relative; min-width: 300px; }
        
        /* ESTILOS DE LA TABLA RESPONSIVE */
        .table-wrapper { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden; }
        .responsive-table { width: 100%; border-collapse: collapse; }
        .responsive-table thead { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .responsive-table th { padding: 15px; text-align: left; color: #475569; font-size: 0.85rem; text-transform: uppercase; }
        .responsive-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; color: #334155; }

        /* Media Query para Móviles (Menos de 768px) */
        @media (max-width: 768px) {
            .page-container { padding: 10px; }
            .header-container { flex-direction: column; align-items: flex-start; }
            .header-container button { width: 100%; justify-content: center; }
            .filter-container { flex-direction: column-reverse; align-items: stretch; }
            .search-box { min-width: 100%; }
            
            /* Transformación de Tabla a Tarjetas */
            .responsive-table thead { display: none; }
            .responsive-table, .responsive-table tbody, .responsive-table tr, .responsive-table td { display: block; width: 100%; }
            .responsive-table tr { margin-bottom: 15px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .responsive-table td { text-align: right; padding-left: 50%; position: relative; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
            .responsive-table td::before { 
                content: attr(data-label); 
                position: absolute; left: 15px; width: 45%; padding-right: 10px; white-space: nowrap; text-align: left; font-weight: 700; color: #64748b; font-size: 0.8rem; text-transform: uppercase;
            }
            .responsive-table td:last-child { border-bottom: 0; justify-content: center; padding: 15px; }
            .responsive-table td:last-child::before { display: none; } /* Ocultar label en acciones */
            
            .action-buttons { width: 100%; justify-content: space-between; }
        }
    `;

    return (
        <div className="page-container">
            <style>{styles}</style>
            
            {/* CABECERA */}
            <div className="header-container">
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaClipboardList style={{ color: '#0c4760' }} /> 
                        Gestionar Auditorías
                    </h1>
                    <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '0.95rem' }}>
                        Control de auditorías internas, externas y evidencias.
                    </p>
                </div>
                <button 
                    className="btn-primary" 
                    onClick={() => setShowCreateModal(true)}
                    style={{ 
                        backgroundColor: '#0c4760', padding: '10px 20px', borderRadius: '8px', 
                        display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(12, 71, 96, 0.2)',
                        color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    <FaPlus /> Nueva Auditoría
                </button>
            </div>

            {/* PESTAÑAS Y BUSCADOR */}
            <div className="filter-container">
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '5px', borderRadius: '10px', gap: '5px' }}>
                    {['Interna', 'Externa'].map(tipo => (
                        <button 
                            key={tipo}
                            onClick={() => setTabActive(tipo)}
                            style={{
                                padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                                backgroundColor: tabActive === tipo ? '#fff' : 'transparent',
                                color: tabActive === tipo ? '#0c4760' : '#64748b',
                                boxShadow: tabActive === tipo ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.2s', flex: 1
                            }}
                        >
                            {tipo}s
                        </button>
                    ))}
                </div>

                <div className="search-box">
                    <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar por auditor, área, norma..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px',
                            border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem'
                        }}
                    />
                </div>
            </div>

            {/* TABLA RESPONSIVE */}
            <div className="table-wrapper">
                <table className="responsive-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Auditor / Entidad</th>
                            <th>Área</th>
                            <th>Normas</th>
                            <th>Evidencia</th>
                            <th style={{textAlign: 'center'}}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Cargando registros...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No se encontraron auditorías.</td></tr>
                        ) : (
                            filteredData.map(item => (
                                <tr key={item.ID_Auditoria}>
                                    <td data-label="Fecha" style={{ fontWeight: '500' }}>
                                        {new Date(item.Fecha_Registro).toLocaleDateString('es-CO')}
                                    </td>
                                    <td data-label="Auditor">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                                            <FaUserTie style={{ color: '#64748b' }} /> {item.Auditor}
                                        </div>
                                    </td>
                                    <td data-label="Área">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FaBuilding style={{ color: '#94a3b8' }} /> {item.Area_Auditada}
                                        </div>
                                    </td>
                                    <td data-label="Normas">
                                        <span style={{ background: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontSize: '0.85rem', border: '1px solid #bbf7d0' }}>
                                            {item.Normas || 'General'}
                                        </span>
                                    </td>
                                    <td data-label="Evidencia">
                                        {item.Url_Evidencia ? (
                                            <a 
                                                href={`${SERVER_URL}${item.Url_Evidencia}`} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                style={{ 
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px', 
                                                    color: '#0ea5e9', textDecoration: 'none', fontWeight: '500',
                                                    background: '#e0f2fe', padding: '5px 10px', borderRadius: '6px', fontSize:'0.85rem'
                                                }}
                                            >
                                                {getFileIcon(item.Url_Evidencia)} Archivo
                                            </a>
                                        ) : (
                                            <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.9rem' }}>--</span>
                                        )}
                                    </td>
                                    <td data-label="Acciones">
                                        <div className="action-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '8px', width: '100%' }}>
                                            
                                            {/* BOTÓN VER DETALLE */}
                                            <button 
                                                onClick={() => handleViewAuditoria(item)}
                                                style={{
                                                    backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                                                    padding: '8px', borderRadius: '6px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s', flex: 1, maxWidth: '40px'
                                                }}
                                                title="Ver Detalle"
                                            >
                                                <FaEye size={16} />
                                            </button>

                                            {/* BOTÓN PLAN ACCIÓN */}
                                            {item.ID_ACPM_Relacionado ? (
                                                <button 
                                                    onClick={() => handleViewPlan(item.ID_ACPM_Relacionado)}
                                                    style={{
                                                        backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                                                        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
                                                        fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s', flex: 2
                                                    }}
                                                >
                                                    <FaEye /> Ver Plan
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleCreatePlan(item)}
                                                    style={{
                                                        backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fca5a5',
                                                        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
                                                        fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s', flex: 2
                                                    }}
                                                >
                                                    <FaFileSignature /> Crear Plan
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ModalCrearAuditoria isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={cargarDatos} />
            
            <ModalCreateACPM 
                isOpen={showACPMModal} 
                onClose={() => setShowACPMModal(false)} 
                initialData={acpmInitialData}
                onSuccess={cargarDatos} 
            />

            <ModalVerAuditoria 
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                auditoria={selectedAuditoria}
            />

            <ModalVerACPM 
                isOpen={showVerPlanModal}
                onClose={() => setShowVerPlanModal(false)}
                acpm={selectedPlanACPM}
            />
        </div>
    );
};

export default GestionAuditorias;