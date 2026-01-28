import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
// Importamos utilidades de seguridad
import { API_URL, getAuthHeaders, apiFetchBlob, extractFilename } from '../../services/api';

// --- SERVICIOS ---
import { getHistorialAgua } from '../../services/specializedService'; // Registro Diario (Cloro/pH)
import { getReportes } from '../../services/reportesService';         // Reportes Operativos (Forms)
import { getACPMs } from '../../services/acpmService';                // Planes de Acción

// --- COMPONENTES ---
import ModalRegistrarAgua from '../../components/modals/ModalRegistrarAgua';
import FileManager from '../../components/FileManager';
import ModalVerReporte from '../../components/modals/ModalVerReporte';
import ModalCreateACPM from '../../components/modals/ModalCreateACPM';
import ModalVerACPM from '../../components/modals/ModalVerACPM';

import { 
    FaPlus, FaSearch, FaEye, FaFileContract, FaPaperclip, 
    FaCamera, FaClipboardList, FaMap, FaCogs,
    FaTrash, FaFolder, FaTimes, FaTint, FaCalendarCheck, 
    FaFilter, FaExclamationTriangle, FaCheckCircle, FaCheckDouble, FaTools
} from 'react-icons/fa';

import '../../styles/Tables.css';
import '../../styles/Dashboard.css'; 

// MAPA DE ICONOS
const ICON_MAP = {
    'contract': <FaFileContract />,
    'cogs': <FaCogs />,
    'clip': <FaPaperclip />,
    'camera': <FaCamera />,
    'list': <FaClipboardList />,
    'map': <FaMap />,
    'folder': <FaFolder />,
    'water': <FaTint />
};

const HistorialAguaAdmin = () => {
    // --- TABS: 'monitoreo' (Diario), 'docs' (Archivos), 'reportes' (Checklists) ---
    const [activeTab, setActiveTab] = useState('monitoreo');

    // --- ESTADOS MONITOREO DIARIO (Cloro/pH) ---
    const [registrosDiarios, setRegistrosDiarios] = useState([]);
    const [loadingDiario, setLoadingDiario] = useState(false);
    const [showModalRegistro, setShowModalRegistro] = useState(false);

    // --- ESTADOS GESTIÓN DOCUMENTAL ---
    const [showFileManager, setShowFileManager] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ name: '', id: null });
    const [loadingFolder, setLoadingFolder] = useState(false);
    const [cards, setCards] = useState([]);
    const [showCreateCardModal, setShowCreateCardModal] = useState(false);
    const [newCardData, setNewCardData] = useState({ titulo:'', descripcion:'', color:'#0ea5e9', icono:'water' });

    // --- ESTADOS REPORTES OPERATIVOS ---
    const [reportes, setReportes] = useState([]);
    const [loadingReportes, setLoadingReportes] = useState(false);
    const [filterStatus, setFilterStatus] = useState('todos');
    
    // Filtro de búsqueda general
    const [searchTerm, setSearchTerm] = useState('');

    // Modales Reportes
    const [showViewReporte, setShowViewReporte] = useState(false);
    const [showCreateACPM, setShowCreateACPM] = useState(false);
    const [showViewACPM, setShowViewACPM] = useState(false);
    const [selectedReporte, setSelectedReporte] = useState(null);
    const [acpmData, setAcpmData] = useState(null);

    // Color Temático (Azul Agua)
    const THEME_COLOR = '#0ea5e9';

    useEffect(() => {
        if (activeTab === 'monitoreo') fetchRegistrosDiarios();
        if (activeTab === 'docs') loadCards();
        if (activeTab === 'reportes') fetchReportesOperativos();
    }, [activeTab]);

    // ==========================================
    // 1. LÓGICA MONITOREO DIARIO
    // ==========================================
    const fetchRegistrosDiarios = async () => {
        setLoadingDiario(true);
        try {
            const data = await getHistorialAgua();
            setRegistrosDiarios(data);
        } catch (error) { console.error(error); } 
        finally { setLoadingDiario(false); }
    };

    // --- FUNCIÓN SEGURA PARA VER EVIDENCIA DE AGUA ---
    const handleVerEvidencia = async (urlEvidencia) => {
        if (!urlEvidencia) return;
        try {
            const filename = extractFilename(urlEvidencia);
            // CORRECCIÓN APLICADA: Se agregó el prefijo '/specialized' a la ruta
            const blob = await apiFetchBlob(`/specialized/agua/evidencia/${filename}`);
            
            if (blob.size === 0) throw new Error("Archivo vacío");

            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error al ver evidencia:", error);
            if (urlEvidencia.startsWith('http')) window.open(urlEvidencia, '_blank');
            else Swal.fire('Error', 'No se pudo abrir la evidencia', 'error');
        }
    };

    // ==========================================
    // 2. LÓGICA DOCUMENTACIÓN (CARPETAS)
    // ==========================================
    const loadCards = async () => {
        try {
            const res = await fetch(`${API_URL}/core/tarjetas/AGUA`, { headers: getAuthHeaders() });
            const data = await res.json();
            setCards(data);
        } catch (e) { console.error(e); }
    };

    const handleCreateCard = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/core/tarjetas`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ ...newCardData, modulo: 'AGUA' })
            });
            if(res.ok) {
                Swal.fire('Éxito', 'Tarjeta agregada correctamente', 'success');
                setShowCreateCardModal(false);
                setNewCardData({ titulo:'', descripcion:'', color:'#0ea5e9', icono:'folder' });
                loadCards(); 
            }
        } catch (error) { Swal.fire('Error', 'No se pudo crear la tarjeta', 'error'); }
    };

    const handleDeleteCard = async (e, id) => {
        e.stopPropagation(); 
        if(await Swal.fire({
            title:'¿Borrar tarjeta?', 
            text:'Se ocultará el acceso, pero los archivos seguirán seguros en el Drive.', 
            icon:'warning', showCancelButton:true, confirmButtonColor: '#d33'
        }).then(r=>r.isConfirmed)){
            await fetch(`${API_URL}/core/tarjetas/${id}`, { method:'DELETE', headers:getAuthHeaders() });
            loadCards();
        }
    };

    const handleCardClick = async (card) => {
        setLoadingFolder(true);
        try {
            const headers = getAuthHeaders();
            let rootModuleId = await findOrCreateFolder(1, "Monitoreo Agua", headers);
            let categoryFolderId = await findOrCreateFolder(rootModuleId, card.Titulo, headers);
            setCurrentCategory({ name: card.Titulo, id: categoryFolderId });
            setShowFileManager(true);
        } catch (error) { Swal.fire('Error', 'No se pudo acceder al repositorio.', 'error'); } 
        finally { setLoadingFolder(false); }
    };

    const findOrCreateFolder = async (parentId, folderName, headers) => {
        const res = await fetch(`${API_URL}/drive/contenido/${parentId}`, { headers });
        const data = await res.json();
        const existing = data.carpetas.find(c => c.NombreCarpeta === folderName);
        if (existing) return existing.ID_Carpeta;
        await fetch(`${API_URL}/drive/carpeta`, { method: 'POST', headers, body: JSON.stringify({ nombre: folderName, idPadre: parentId }) });
        const res2 = await fetch(`${API_URL}/drive/contenido/${parentId}`, { headers });
        const data2 = await res2.json();
        return data2.carpetas.find(c => c.NombreCarpeta === folderName).ID_Carpeta;
    };

    // ==========================================
    // 3. LÓGICA REPORTES OPERATIVOS
    // ==========================================
    const fetchReportesOperativos = async () => {
        setLoadingReportes(true);
        try {
            const data = await getReportes();
            const onlyAgua = data.filter(r => 
                (r.Programa === 'Agua Potable') || 
                (r.Categoria && r.Categoria.toLowerCase().includes('agua'))
            );
            setReportes(onlyAgua);
        } catch (error) { console.error(error); } 
        finally { setLoadingReportes(false); }
    };

    // Filtros combinados
    const getFilteredData = () => {
        const term = searchTerm.toLowerCase();
        
        if (activeTab === 'monitoreo') {
            return registrosDiarios.filter(r => 
                r.Usuario.toLowerCase().includes(term) || 
                r.Punto_Toma.toLowerCase().includes(term)
            );
        }
        
        if (activeTab === 'reportes') {
            return reportes.filter(item => {
                const textMatch = (item.Usuario || '').toLowerCase().includes(term) || 
                                  (item.Activo || '').toLowerCase().includes(term);
                let statusMatch = true;
                if (filterStatus === 'fallas') statusMatch = item.Tiene_Fallas === true;
                if (filterStatus === 'ok') statusMatch = item.Tiene_Fallas === false;
                if (filterStatus === 'pendiente') statusMatch = item.Verificado !== true;
                return textMatch && statusMatch;
            });
        }
        return [];
    };

    const handleOpenViewReporte = (rep) => { setSelectedReporte(rep); setShowViewReporte(true); };
    
    const handleOpenCreateACPM = (rep) => {
        setAcpmData({
            origen: `Reporte Agua #${rep.ID_Reporte}`,
            descripcion: `Novedad en sistema de agua: ${rep.Observaciones || 'Sin detalles'}`,
            idReporte: rep.ID_Reporte
        });
        setShowCreateACPM(true);
    };

    const handleOpenViewACPM = async (idACPM) => {
        try {
            const all = await getACPMs();
            const found = all.find(a => a.ID_ACPM === idACPM);
            if(found) { setAcpmData(found); setShowViewACPM(true); }
        } catch (e) { console.error(e); }
    };

    const filteredData = getFilteredData();

    return (
        <div className="fade-in">
            {/* CABECERA */}
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <FaTint style={{color: THEME_COLOR}}/> Gestión de Agua Potable
                    </h1>
                    <p style={{color:'#64748b', marginTop:'-5px'}}>Monitoreo de calidad, documentación y reportes operativos.</p>
                </div>
            </div>

            {/* PESTAÑAS (TABS) */}
            <div style={{display:'flex', gap:'10px', marginBottom:'1.5rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'10px', flexWrap:'wrap'}}>
                <button 
                    onClick={() => setActiveTab('monitoreo')}
                    style={{
                        padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'0.95rem',
                        background: activeTab === 'monitoreo' ? '#0c4760' : 'transparent',
                        color: activeTab === 'monitoreo' ? 'white' : '#64748b', 
                        display:'flex', alignItems:'center', gap:'8px', transition:'all 0.2s'
                    }}
                >
                    <FaCalendarCheck/> Monitoreo Diario (Cloro/pH)
                </button>
                <button 
                    onClick={() => setActiveTab('docs')}
                    style={{
                        padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'0.95rem',
                        background: activeTab === 'docs' ? '#0c4760' : 'transparent',
                        color: activeTab === 'docs' ? 'white' : '#64748b', 
                        display:'flex', alignItems:'center', gap:'8px', transition:'all 0.2s'
                    }}
                >
                    <FaFolder/> Documentación
                </button>
                <button 
                    onClick={() => setActiveTab('reportes')}
                    style={{
                        padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'0.95rem',
                        background: activeTab === 'reportes' ? '#0c4760' : 'transparent',
                        color: activeTab === 'reportes' ? 'white' : '#64748b', 
                        display:'flex', alignItems:'center', gap:'8px', transition:'all 0.2s'
                    }}
                >
                    <FaClipboardList/> Reportes Operativos
                </button>
            </div>

            {/* BARRA DE FILTROS (Común para Monitoreo y Reportes) */}
            {activeTab !== 'docs' && (
                <div className="filters-bar" style={{marginBottom:'20px'}}>
                    <div className="search-input-container">
                        <FaSearch />
                        <input 
                            type="text" 
                            placeholder={activeTab === 'monitoreo' ? "Buscar por usuario o punto de toma..." : "Buscar reporte por activo o responsable..."}
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    {activeTab === 'reportes' && (
                        <div className="filter-select-container">
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="todos">Todos los Estados</option>
                                <option value="fallas">Con Hallazgos</option>
                                <option value="ok">Conforme</option>
                                <option value="pendiente">Pendiente Revisión</option>
                            </select>
                        </div>
                    )}
                    {activeTab === 'monitoreo' && (
                        <button 
                            className="btn-primary" 
                            onClick={() => setShowModalRegistro(true)}
                            style={{backgroundColor: THEME_COLOR, display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px'}}
                        >
                            <FaPlus /> Registrar Medición
                        </button>
                    )}
                </div>
            )}

            {/* --- CONTENIDO TAB 1: MONITOREO DIARIO --- */}
            {activeTab === 'monitoreo' && (
                <div className="table-container fade-in">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha / Hora</th>
                                <th>Responsable</th>
                                <th>Punto de Toma</th>
                                <th>Mediciones</th>
                                <th>Evidencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingDiario ? (
                                <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>Cargando historial...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No hay registros de medición.</td></tr>
                            ) : (
                                filteredData.map(row => (
                                    <tr key={row.ID_Registro}>
                                        <td>
                                            <div style={{fontWeight:'500'}}>
                                                {new Date(row.Fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                                            </div>
                                            <div style={{fontSize:'0.8rem', color:'#64748b'}}>
                                                {new Date(row.Fecha).toLocaleTimeString('es-CO', { timeZone: 'UTC', hour:'2-digit', minute:'2-digit' })}
                                            </div>
                                        </td>
                                        <td>{row.Usuario}</td>
                                        <td><span style={{fontWeight:'600', color:'#0c4760'}}>{row.Punto_Toma}</span></td>
                                        <td>
                                            <span style={{background:'#f0f9ff', padding:'4px 8px', borderRadius:'4px', fontSize:'0.85rem', border:'1px solid #bae6fd', color:'#0369a1'}}>
                                                {row.Datos_Medicion}
                                            </span>
                                        </td>
                                        <td>
                                            {/* BOTÓN SEGURO PARA VER FOTO */}
                                            {row.Url_Foto_Evidencia ? (
                                                <button 
                                                    onClick={() => handleVerEvidencia(row.Url_Foto_Evidencia)} 
                                                    className="btn-action" 
                                                    style={{display:'inline-flex', alignItems:'center', gap:'5px', textDecoration:'none', color:'#64748b', border:'none', background:'transparent', cursor:'pointer'}}
                                                >
                                                    <FaEye /> Ver Foto
                                                </button>
                                            ) : (
                                                <span style={{color:'#94a3b8', fontSize:'0.85rem'}}>Sin foto</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- CONTENIDO TAB 2: DOCUMENTACIÓN --- */}
            {activeTab === 'docs' && (
                <div className="fade-in">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                        <h3 style={{fontSize:'1.1rem', color:'#334155', margin:0}}>Carpetas del Repositorio</h3>
                        <button className="btn-primary" onClick={() => setShowCreateCardModal(true)} style={{backgroundColor: THEME_COLOR, padding:'8px 15px', fontSize:'0.9rem'}}>
                            <FaPlus style={{marginRight:'5px'}}/> Nueva Carpeta
                        </button>
                    </div>
                    
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px'}}>
                        {cards.map((card) => (
                            <div key={card.ID_Tarjeta} onClick={() => handleCardClick(card)}
                                style={{
                                    background:'white', padding:'1.2rem', borderRadius:'12px', 
                                    border:'1px solid #e2e8f0', cursor:'pointer', transition:'all 0.2s',
                                    position:'relative', overflow:'hidden', boxShadow:'0 2px 4px rgba(0,0,0,0.02)',
                                    borderTop: `4px solid ${card.Color}`
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.05)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                            >
                                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px'}}>
                                    <div style={{background: `${card.Color}20`, color: card.Color, width:'45px', height:'45px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem'}}>
                                        {ICON_MAP[card.Icono] || <FaFolder/>}
                                    </div>
                                    <button onClick={(e) => handleDeleteCard(e, card.ID_Tarjeta)} style={{border:'none', background:'transparent', color:'#ef4444', cursor:'pointer', padding:'5px', borderRadius:'50%'}}>
                                        <FaTrash size={12}/>
                                    </button>
                                </div>
                                <h4 style={{margin:0, color:'#1e293b', fontSize:'1rem'}}>{card.Titulo}</h4>
                                <p style={{margin:'5px 0 0 0', fontSize:'0.8rem', color:'#64748b'}}>{card.Descripcion}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- CONTENIDO TAB 3: REPORTES OPERATIVOS --- */}
            {activeTab === 'reportes' && (
                <div className="table-container fade-in">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Responsable</th>
                                <th>Formato / Área</th>
                                <th>Estado</th>
                                <th style={{textAlign:'right'}}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingReportes ? (
                                <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>Cargando reportes...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No hay reportes operativos registrados.</td></tr>
                            ) : (
                                filteredData.map(rep => (
                                    <tr key={rep.ID_Reporte} className="modern-row">
                                        <td className="modern-cell">
                                            <div className="date-main">{new Date(rep.Fecha_Reporte).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</div>
                                            <div className="date-sub">{new Date(rep.Fecha_Reporte).toLocaleTimeString('es-CO', { timeZone: 'UTC', hour: '2-digit', minute:'2-digit' })}</div>
                                        </td>
                                        <td className="modern-cell"><strong>{rep.Usuario}</strong></td>
                                        <td className="modern-cell">
                                            <div className="asset-name">{rep.Activo || 'General'}</div>
                                            <div className="form-name" style={{color:'#64748b', fontSize:'0.85rem'}}>{rep.Formulario}</div>
                                        </td>
                                        <td className="modern-cell">
                                            <div style={{display:'flex', gap:'5px', flexDirection:'column'}}>
                                                {rep.Tiene_Fallas ? 
                                                    <span className="status-pill danger"><FaExclamationTriangle/> Hallazgo</span> : 
                                                    <span className="status-pill success"><FaCheckCircle/> Conforme</span>
                                                }
                                                {rep.Verificado && <span className="verified-badge" style={{fontSize:'0.7rem', color:'#10b981', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}><FaCheckDouble/> Verificado</span>}
                                            </div>
                                        </td>
                                        <td className="modern-cell">
                                            <div className="action-group">
                                                <button className="btn-text-modern" onClick={() => handleOpenViewReporte(rep)}><FaFileContract/> Ver</button>
                                                {rep.ID_ACPM ? 
                                                    <button className="btn-text-modern btn-acpm-view" onClick={() => handleOpenViewACPM(rep.ID_ACPM)}><FaEye/></button> : 
                                                    rep.Tiene_Fallas ? <button className="btn-text-modern btn-acpm-create" onClick={() => handleOpenCreateACPM(rep)}><FaTools/></button> : null
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODALES GLOBALES */}
            <ModalRegistrarAgua isOpen={showModalRegistro} onClose={() => setShowModalRegistro(false)} onSuccess={fetchRegistrosDiarios} />
            <ModalVerReporte isOpen={showViewReporte} onClose={() => setShowViewReporte(false)} reporte={selectedReporte} onUpdate={fetchReportesOperativos} />
            <ModalCreateACPM isOpen={showCreateACPM} onClose={() => setShowCreateACPM(false)} initialData={acpmData} onSuccess={fetchReportesOperativos} />
            <ModalVerACPM isOpen={showViewACPM} onClose={() => setShowViewACPM(false)} acpm={acpmData} />

            {/* MODAL CREAR TARJETA */}
            {showCreateCardModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth:'500px'}}>
                        <div className="modal-header"><h2>Nueva Carpeta</h2><button className="modal-close-button" onClick={()=>setShowCreateCardModal(false)}><FaTimes/></button></div>
                        <form onSubmit={handleCreateCard}>
                            <div className="modal-body">
                                <div className="form-group"><label>Título</label><input className="form-control" required value={newCardData.titulo} onChange={e=>setNewCardData({...newCardData, titulo:e.target.value})} placeholder="Ej: Certificados Lab" /></div>
                                <div className="form-group"><label>Descripción</label><input className="form-control" value={newCardData.descripcion} onChange={e=>setNewCardData({...newCardData, descripcion:e.target.value})} /></div>
                                <div className="form-group"><label>Color</label><input type="color" className="form-control" style={{height:'40px', padding:0}} value={newCardData.color} onChange={e=>setNewCardData({...newCardData, color:e.target.value})} /></div>
                                <div className="form-group"><label>Icono</label>
                                    <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px', marginTop:'5px'}}>
                                        {Object.keys(ICON_MAP).map(key => (
                                            <div key={key} onClick={()=>setNewCardData({...newCardData, icono:key})} style={{padding:'10px', borderRadius:'8px', cursor:'pointer', textAlign:'center', fontSize:'1.2rem', border: newCardData.icono === key ? `2px solid ${THEME_COLOR}` : '1px solid #e2e8f0', color: newCardData.icono === key ? THEME_COLOR : '#64748b', background: newCardData.icono === key ? '#f0f9ff' : 'transparent'}}>{ICON_MAP[key]}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer"><button type="submit" className="btn-primary" style={{backgroundColor: THEME_COLOR}}>Crear</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* FILE MANAGER */}
            {showFileManager && (
                <div className="modal-overlay"> 
                    <div className="modal-content" style={{width: '95%', maxWidth: '1100px', height: '85vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                        <FileManager initialFolderId={currentCategory.id} title={`Agua: ${currentCategory.name}`} onClose={() => setShowFileManager(false)} />
                    </div>
                </div>
            )}
            
            {loadingFolder && <div style={{position:'fixed', inset:0, background:'rgba(255,255,255,0.8)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center'}}><div className="spin" style={{fontSize:'3rem', color: THEME_COLOR}}>●</div></div>}
        </div>
    );
};

export default HistorialAguaAdmin;