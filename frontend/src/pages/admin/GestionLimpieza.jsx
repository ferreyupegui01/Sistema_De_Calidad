import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_URL, getAuthHeaders } from '../../services/api';

// --- SERVICIOS ---
import { getReportes } from '../../services/reportesService';
import { getACPMs } from '../../services/acpmService';

// --- COMPONENTES ---
import FileManager from '../../components/FileManager'; 
import ModalVerReporte from '../../components/modals/ModalVerReporte';
import ModalCreateACPM from '../../components/modals/ModalCreateACPM';
import ModalVerACPM from '../../components/modals/ModalVerACPM';

import { 
    FaPlus, FaSearch, FaTrash, FaFolder, FaTimes, FaEdit, 
    FaBroom, FaSoap, FaHandsWash, FaSprayCan, FaRecycle, FaTrashAlt, FaFill, 
    FaBiohazard, FaExclamationTriangle, FaClipboardCheck, FaHardHat, FaFirstAid, FaFireExtinguisher,
    FaFilePdf, FaFileAlt, FaFileExcel, FaBoxOpen, FaIndustry, FaTruck, FaTint, FaCheckCircle,
    FaFileContract, FaEye, FaTools, FaCheckDouble, FaFilter
} from 'react-icons/fa';

import '../../styles/Tables.css';
import '../../styles/Dashboard.css'; 

// --- MAPA DE ICONOS ---
const ICON_MAP = {
    'folder': <FaFolder />, 'clipboard': <FaClipboardCheck />,
    'broom': <FaBroom />, 'bucket': <FaFill />, 'soap': <FaSoap />, 'spray': <FaSprayCan />,
    'hands': <FaHandsWash />, 'trash': <FaTrashAlt />, 'recycle': <FaRecycle />,
    'bio': <FaBiohazard />, 'warning': <FaExclamationTriangle />, 'helmet': <FaHardHat />,
    'aid': <FaFirstAid />, 'fire': <FaFireExtinguisher />,
    'box': <FaBoxOpen />, 'industry': <FaIndustry />, 'truck': <FaTruck />,
    'water': <FaTint />, 'check': <FaCheckCircle />,
    'pdf': <FaFilePdf />, 'doc': <FaFileAlt />, 'xls': <FaFileExcel />
};

const GestionLimpieza = () => {
    // --- ESTADOS TABS ---
    const [activeTab, setActiveTab] = useState('docs'); // 'docs' o 'reportes'

    // --- ESTADOS GESTIÓN DOCUMENTAL ---
    const [showFileManager, setShowFileManager] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ name: '', id: null });
    const [loadingFolder, setLoadingFolder] = useState(false);
    const [cards, setCards] = useState([]);
    const [showCreateCardModal, setShowCreateCardModal] = useState(false);
    const [newCardData, setNewCardData] = useState({ titulo:'', descripcion:'', color:'#10b981', icono:'broom' });

    // --- ESTADOS REPORTES ---
    const [reportes, setReportes] = useState([]);
    const [loadingReportes, setLoadingReportes] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos');

    // Modales Reportes
    const [showViewReporte, setShowViewReporte] = useState(false);
    const [showCreateACPM, setShowCreateACPM] = useState(false);
    const [showViewACPM, setShowViewACPM] = useState(false);
    const [selectedReporte, setSelectedReporte] = useState(null);
    const [acpmData, setAcpmData] = useState(null);

    useEffect(() => {
        if (activeTab === 'docs') loadCards();
        if (activeTab === 'reportes') fetchReportes();
    }, [activeTab]);

    // ==========================================
    // LÓGICA TARJETAS
    // ==========================================
    const loadCards = async () => {
        try {
            const res = await fetch(`${API_URL}/core/tarjetas/LIMPIEZA`, { headers: getAuthHeaders() });
            const data = await res.json();
            setCards(data);
        } catch (e) { console.error(e); }
    };

    const handleCreateCard = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/core/tarjetas`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ ...newCardData, modulo: 'LIMPIEZA' })
            });
            if(res.ok) {
                Swal.fire('Éxito', 'Categoría agregada', 'success');
                setShowCreateCardModal(false);
                setNewCardData({ titulo:'', descripcion:'', color:'#10b981', icono:'broom' });
                loadCards();
            }
        } catch (error) { Swal.fire('Error', 'No se pudo crear', 'error'); }
    };

    const handleDeleteCard = async (e, id) => {
        e.stopPropagation();
        if(await Swal.fire({title:'¿Borrar categoría?', text:'Se ocultará el acceso, los archivos permanecen en el Drive.', icon:'warning', showCancelButton:true, confirmButtonColor:'#d33'}).then(r=>r.isConfirmed)){
            await fetch(`${API_URL}/core/tarjetas/${id}`, { method:'DELETE', headers:getAuthHeaders() });
            loadCards();
        }
    };

    const handleCardClick = async (card) => {
        setLoadingFolder(true);
        try {
            const headers = getAuthHeaders();
            let rootModuleId = await findOrCreateFolder(1, "Limpieza y Desinfección", headers);
            let categoryFolderId = await findOrCreateFolder(rootModuleId, card.Titulo, headers);
            setCurrentCategory({ name: card.Titulo, id: categoryFolderId });
            setShowFileManager(true);
        } catch (error) {
            Swal.fire('Error', 'No se pudo acceder al repositorio.', 'error');
        } finally { setLoadingFolder(false); }
    };

    const findOrCreateFolder = async (parentId, folderName, headers) => {
        const res = await fetch(`${API_URL}/drive/contenido/${parentId}`, { headers });
        const data = await res.json();
        const existing = data.carpetas.find(c => c.NombreCarpeta === folderName);
        if (existing) return existing.ID_Carpeta;
        
        await fetch(`${API_URL}/drive/carpeta`, {
            method: 'POST', headers,
            body: JSON.stringify({ nombre: folderName, idPadre: parentId })
        });
        const res2 = await fetch(`${API_URL}/drive/contenido/${parentId}`, { headers });
        const data2 = await res2.json();
        return data2.carpetas.find(c => c.NombreCarpeta === folderName).ID_Carpeta;
    };

    // ==========================================
    // LÓGICA REPORTES
    // ==========================================
    const fetchReportes = async () => {
        setLoadingReportes(true);
        try {
            const data = await getReportes();
            
            // --- AQUÍ ESTÁ EL CAMBIO SOLICITADO ---
            // Ahora filtra si el Programa es 'Limpieza y Desinfección' O si la categoría tiene la palabra 'limpieza'
            const onlyLimpieza = data.filter(r => 
                (r.Programa === 'Limpieza y Desinfección') || 
                (r.Categoria && r.Categoria.toLowerCase().includes('limpieza'))
            );
            
            setReportes(onlyLimpieza);
        } catch (error) { console.error(error); } 
        finally { setLoadingReportes(false); }
    };

    const filteredReportes = reportes.filter(item => {
        const textMatch = item.Usuario.toLowerCase().includes(searchTerm.toLowerCase()) || item.Activo.toLowerCase().includes(searchTerm.toLowerCase());
        let statusMatch = true;
        if (filterStatus === 'fallas') statusMatch = item.Tiene_Fallas === true;
        if (filterStatus === 'ok') statusMatch = item.Tiene_Fallas === false;
        if (filterStatus === 'pendiente') statusMatch = item.Verificado !== true;
        return textMatch && statusMatch;
    });

    const handleOpenViewReporte = (rep) => { setSelectedReporte(rep); setShowViewReporte(true); };
    
    const handleOpenCreateACPM = (rep) => {
        setAcpmData({
            origen: `Reporte LyD #${rep.ID_Reporte}`,
            descripcion: `Falla en limpieza: ${rep.Observaciones || 'Sin detalles'}`,
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

    return (
        <div>
            {/* CABECERA */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Programa de Limpieza y Desinfección</h1>
                    <p style={{color:'#64748b', marginTop:'-5px'}}>Gestión de protocolos y registros L&D.</p>
                </div>
            </div>

            {/* PESTAÑAS (TABS) */}
            <div style={{display:'flex', gap:'10px', marginBottom:'1.5rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'10px'}}>
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
                    <FaClipboardCheck/> Reportes Operativos
                </button>
            </div>

            {/* --- SECCIÓN: TARJETAS DINÁMICAS --- */}
            {activeTab === 'docs' && (
                <div className="fade-in">
                    <div style={{marginBottom:'2rem'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'0.5rem'}}>
                            <h3 style={{fontSize:'1.1rem', color:'#334155', margin:0}}>Repositorio Documental</h3>
                            <small style={{color:'#64748b'}}>Gestione las carpetas del área</small>
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
                                        <button onClick={(e) => handleDeleteCard(e, card.ID_Tarjeta)} style={{border:'none', background:'transparent', color:'#ef4444', cursor:'pointer', padding:'5px'}}>
                                            <FaTrash size={12}/>
                                        </button>
                                    </div>
                                    <h4 style={{margin:0, color:'#1e293b', fontSize:'1rem'}}>{card.Titulo}</h4>
                                    <p style={{margin:'5px 0 0 0', fontSize:'0.8rem', color:'#64748b'}}>{card.Descripcion}</p>
                                </div>
                            ))}

                            <div onClick={() => setShowCreateCardModal(true)}
                                style={{
                                    border:'2px dashed #cbd5e1', borderRadius:'12px', display:'flex', flexDirection:'column',
                                    alignItems:'center', justifyContent:'center', cursor:'pointer', minHeight:'140px',
                                    color:'#94a3b8', transition:'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981'; e.currentTarget.style.background = '#f0fdf4'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <FaPlus size={30} />
                                <span style={{fontWeight:'600', marginTop:'10px'}}>Nueva Carpeta</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SECCIÓN: REPORTES (CON HORA CORREGIDA) --- */}
            {activeTab === 'reportes' && (
                <div className="fade-in">
                      <div className="control-bar">
                        <div className="search-box">
                            <FaSearch />
                            <input className="search-input" placeholder="Buscar reporte..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <FaFilter style={{color:'#64748b'}}/>
                            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="todos">Todos</option>
                                <option value="fallas">Con Hallazgos</option>
                                <option value="ok">Conforme</option>
                                <option value="pendiente">Pendiente Revisión</option>
                            </select>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr><th>Fecha</th><th>Responsable</th><th>Lugar / Formato</th><th>Estado</th><th style={{textAlign:'right'}}>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {loadingReportes ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>Cargando...</td></tr> : 
                                filteredReportes.length === 0 ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No hay reportes de limpieza registrados.</td></tr> :
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
                                        <td className="modern-cell"><strong>{rep.Usuario}</strong></td>
                                        <td className="modern-cell">
                                            <div className="asset-name">{rep.Activo}</div>
                                            <div className="form-name" style={{color:'#64748b', fontSize:'0.85rem'}}>{rep.Formulario}</div>
                                        </td>
                                        <td className="modern-cell">
                                            <div style={{display:'flex', gap:'5px', flexDirection:'column'}}>
                                                {rep.Tiene_Fallas ? 
                                                    <span className="status-pill danger"><FaExclamationTriangle/> Hallazgo</span> : 
                                                    <span className="status-pill success"><FaCheckCircle/> Conforme</span>
                                                }
                                                {rep.Verificado && <span style={{fontSize:'0.7rem', color:'#10b981', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}><FaCheckDouble/> Verificado</span>}
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODALES TARJETAS */}
            {showCreateCardModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth:'550px'}}>
                        <div className="modal-header">
                            <h2>Nueva Carpeta L&D</h2>
                            <button className="modal-close-button" onClick={()=>setShowCreateCardModal(false)}><FaTimes/></button>
                        </div>
                        <form onSubmit={handleCreateCard}>
                            <div className="modal-body">
                                <div className="form-group"><label>Título</label><input className="form-control" required value={newCardData.titulo} onChange={e=>setNewCardData({...newCardData, titulo:e.target.value})} placeholder="Ej: Protocolos de Aseo" /></div>
                                <div className="form-group"><label>Descripción</label><input className="form-control" value={newCardData.descripcion} onChange={e=>setNewCardData({...newCardData, descripcion:e.target.value})} /></div>
                                <div className="form-group"><label>Color</label><input type="color" className="form-control" style={{height:'40px', padding:0}} value={newCardData.color} onChange={e=>setNewCardData({...newCardData, color:e.target.value})} /></div>
                                
                                <div className="form-group">
                                    <label>Seleccionar Icono</label>
                                    <div style={{
                                        display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px', marginTop:'5px',
                                        maxHeight: '180px', overflowY: 'auto', padding: '5px', border: '1px solid #e2e8f0', borderRadius: '8px'
                                    }}>
                                        {Object.keys(ICON_MAP).map(key => (
                                            <div key={key} onClick={()=>setNewCardData({...newCardData, icono:key})} 
                                                style={{
                                                    padding:'10px', borderRadius:'8px', cursor:'pointer', textAlign:'center', fontSize:'1.4rem', 
                                                    border: newCardData.icono === key ? '2px solid #10b981' : '1px solid white', 
                                                    background: newCardData.icono === key ? '#f0fdf4' : 'transparent', 
                                                    color: newCardData.icono === key ? '#10b981' : '#64748b'
                                                }}
                                                title={key} 
                                            >
                                                {ICON_MAP[key]}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={()=>setShowCreateCardModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary-modal">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FILE MANAGER */}
            {showFileManager && (
                <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.7)', zIndex: 99999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
                    <div style={{width:'900px', height:'85vh', background:'white', borderRadius:'12px', overflow:'hidden', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative'}}>
                        <FileManager initialFolderId={currentCategory.id} title={`L&D: ${currentCategory.name}`} onClose={() => setShowFileManager(false)} />
                    </div>
                </div>
            )}

            {loadingFolder && (
                <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(255,255,255,0.8)', zIndex: 99999, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}>
                    <div className="spin" style={{fontSize:'3rem', color:'#10b981'}}>●</div>
                    <p style={{marginTop:'10px', color:'#0c4760', fontWeight:'600'}}>Cargando archivos...</p>
                </div>
            )}

            {/* NUEVOS MODALES DE REPORTES */}
            <ModalVerReporte isOpen={showViewReporte} onClose={() => setShowViewReporte(false)} reporte={selectedReporte} onUpdate={fetchReportes} />
            <ModalCreateACPM isOpen={showCreateACPM} onClose={() => setShowCreateACPM(false)} initialData={acpmData} onSuccess={fetchReportes} />
            <ModalVerACPM isOpen={showViewACPM} onClose={() => setShowViewACPM(false)} acpm={acpmData} />
        </div>
    );
};

export default GestionLimpieza;